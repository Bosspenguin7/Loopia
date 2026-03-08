import { SocialService, PlayerProfile } from '../services/SocialService';

export class PlayerProfileCard {
    private container: HTMLDivElement;
    private header: HTMLDivElement;
    private contentWrap: HTMLDivElement;
    private currentGuestId: number | null = null;

    // Drag state
    private isDragging = false;
    private dragStartX = 0;
    private dragStartY = 0;
    private initialLeft = 0;
    private initialTop = 0;

    // Callbacks — wired by SceneBehavior
    public onWhisper?: (sessionId: string, name: string) => void;
    public onTrade?: (sessionId: string, guestId: number, name: string) => void;
    public onAddFriend?: (guestId: number, name: string) => void;
    public onUnfriend?: (guestId: number) => void;
    public onVisitRoom?: (roomLabel: string) => void;
    public onBlock?: (guestId: number, name: string) => void;
    public onGiveRespect?: (guestId: number, name: string) => void;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'player-profile-card';

        // Sanalika-style floating panel
        this.container.style.cssText = `
            position: absolute;
            display: none;
            width: 300px;
            background: #ffffff;
            border-radius: 12px;
            font-family: 'Outfit', Arial, sans-serif;
            z-index: 3500;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
            user-select: none;
            flex-direction: column;
        `;
        document.body.appendChild(this.container);

        // Header / Drag Handle
        this.header = document.createElement('div');
        this.header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            cursor: grab;
        `;

        this.contentWrap = document.createElement('div');
        this.container.appendChild(this.header);
        this.container.appendChild(this.contentWrap);

        // Setup Dragging
        this.setupDragging();

        // Block game input when interacting with the card
        this.container.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
        });

        // Close on outside click
        document.addEventListener('pointerdown', (e) => {
            if (this.container.style.display !== 'none' && !this.container.contains(e.target as Node)) {
                this.hide();
            }
        });
    }

    private setupDragging() {
        this.header.addEventListener('pointerdown', (e) => {
            // Check if clicking close btn or other nested interactables
            if ((e.target as HTMLElement).tagName.toLowerCase() === 'button' || (e.target as HTMLElement).tagName.toLowerCase() === 'input' || (e.target as HTMLElement).innerText === '✖') {
                return;
            }

            this.isDragging = true;
            this.header.style.cursor = 'grabbing';
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;

            // Get absolute coords
            const rect = this.container.getBoundingClientRect();
            // In case it was centered using transform, we freeze it to absolute px
            this.container.style.transform = 'none';
            this.container.style.left = rect.left + 'px';
            this.container.style.top = rect.top + 'px';
            this.initialLeft = rect.left;
            this.initialTop = rect.top;

            this.header.setPointerCapture(e.pointerId);
            e.preventDefault();
        });

        this.header.addEventListener('pointermove', (e) => {
            if (!this.isDragging) return;

            const dx = e.clientX - this.dragStartX;
            const dy = e.clientY - this.dragStartY;

            this.container.style.left = `${this.initialLeft + dx}px`;
            this.container.style.top = `${this.initialTop + dy}px`;
        });

        this.header.addEventListener('pointerup', (e) => {
            this.isDragging = false;
            this.header.style.cursor = 'grab';
            this.header.releasePointerCapture(e.pointerId);
        });

        this.header.addEventListener('pointercancel', (e) => {
            this.isDragging = false;
            this.header.style.cursor = 'grab';
            this.header.releasePointerCapture(e.pointerId);
        });
    }

    public show(screenX: number, screenY: number, guestId: number, sessionId?: string, isSelf?: boolean): void {
        this.currentGuestId = guestId;
        this.clearContentWrap();

        // Reset header for loading state
        this.header.innerHTML = '';
        const loadingHeaderTitle = document.createElement('div');
        loadingHeaderTitle.style.cssText = 'font-weight: bold; color: #0f172a;';
        loadingHeaderTitle.textContent = 'Loading Profile...';
        this.header.appendChild(loadingHeaderTitle);

        // Show loading state
        const loading = document.createElement('div');
        loading.style.cssText = 'padding: 30px; color: #64748b; text-align: center; font-size: 13px; font-weight: 500;';
        loading.textContent = 'Please wait...';
        this.contentWrap.appendChild(loading);

        this.container.style.display = 'flex';
        this.positionCard(screenX, screenY);

        // Fetch profile
        SocialService.getInstance().getProfile(guestId).then((profile) => {
            // Guard: user may have closed or opened another card
            if (this.currentGuestId !== guestId) return;

            this.clearContentWrap();
            if (isSelf) {
                this.renderSelfCard(profile);
            } else {
                this.renderOtherCard(profile, sessionId);
            }
            // Re-position might not be needed unless size drastically changed, but safe to keep
        }).catch(() => {
            if (this.currentGuestId !== guestId) return;
            this.clearContentWrap();
            this.header.innerHTML = '';

            const errTitle = document.createElement('div');
            errTitle.style.cssText = 'font-weight: bold; color: #ef4444;';
            errTitle.textContent = 'Error';
            this.header.appendChild(errTitle);

            const err = document.createElement('div');
            err.style.cssText = 'padding: 30px; color: #ef4444; text-align: center; font-size: 13px; font-weight: bold;';
            err.textContent = 'Failed to load profile.';
            this.contentWrap.appendChild(err);
        });
    }

    public hide(): void {
        this.container.style.display = 'none';
        this.currentGuestId = null;
    }

    public destroy(): void {
        this.container.remove();
    }

    // ────────────────── Rendering ──────────────────

    private renderHeaderContent(profile: PlayerProfile, isSelf: boolean) {
        this.header.innerHTML = '';

        const leftGroup = document.createElement('div');
        leftGroup.style.cssText = 'display: flex; align-items: center; gap: 10px;';

        const avatar = document.createElement('div');
        avatar.style.cssText = `
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            border: 1px solid #cbd5e1;
            position: relative;
        `;
        avatar.textContent = '👤';

        // Online Status Dot (overlay on avatar)
        if (!isSelf) {
            const dot = document.createElement('div');
            dot.style.cssText = `
                position: absolute;
                bottom: -2px;
                right: -2px;
                width: 10px;
                height: 10px;
                background: ${profile.isOnline ? '#22c55e' : '#94a3b8'};
                border: 2px solid #ffffff;
                border-radius: 50%;
            `;
            avatar.appendChild(dot);
        }

        const titleText = document.createElement('div');
        titleText.style.cssText = `
            font-weight: 800;
            font-size: 16px;
            color: #0f172a;
            max-width: 160px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;
        titleText.textContent = isSelf ? `${profile.displayName} (You)` : profile.displayName;

        leftGroup.appendChild(avatar);
        leftGroup.appendChild(titleText);

        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = '✖';
        closeBtn.style.cssText = `
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #ef4444;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: inset 0 -2px 0 rgba(0,0,0,0.2);
            transition: transform 0.1s;
        `;
        closeBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            closeBtn.style.transform = 'translateY(2px)';
        });
        closeBtn.addEventListener('pointerup', (e) => {
            e.stopPropagation();
            closeBtn.style.transform = 'translateY(0)';
            this.hide();
        });
        closeBtn.addEventListener('pointerleave', (e) => {
            e.stopPropagation();
            closeBtn.style.transform = 'translateY(0)';
        });

        this.header.appendChild(leftGroup);
        this.header.appendChild(closeBtn);
    }

    private renderSelfCard(profile: PlayerProfile): void {
        this.renderHeaderContent(profile, true);

        // Motto (editable)
        const mottoRow = document.createElement('div');
        mottoRow.style.cssText = 'padding: 12px 16px; cursor: pointer; background: #ffffff;';

        const mottoText = this.createMottoText(profile.motto || 'Click to set a motto...');
        mottoText.title = 'Click to edit';
        mottoRow.appendChild(mottoText);

        mottoRow.addEventListener('click', () => {
            this.startMottoEdit(mottoRow, profile.motto);
        });

        this.contentWrap.appendChild(mottoRow);

        // Twitter section (always visible for self)
        if (profile.twitterUsername) {
            this.contentWrap.appendChild(this.createDivider());
            this.contentWrap.appendChild(this.createTwitterSection(profile));
        }

        this.contentWrap.appendChild(this.createDivider());
        this.contentWrap.appendChild(this.createInfoSection(profile));
    }

    private renderOtherCard(profile: PlayerProfile, sessionId?: string): void {
        this.renderHeaderContent(profile, false);

        // Motto
        if (profile.motto) {
            const mottoRow = document.createElement('div');
            mottoRow.style.cssText = 'padding: 12px 16px; background: #ffffff;';
            const mottoText = this.createMottoText(`"${profile.motto}"`);
            mottoRow.appendChild(mottoText);
            this.contentWrap.appendChild(mottoRow);
        }

        // Twitter section (only if server returned it — means twitterVisible is true)
        if (profile.twitterUsername) {
            if (profile.motto) this.contentWrap.appendChild(this.createDivider());
            this.contentWrap.appendChild(this.createTwitterSection(profile));
        }

        // Divider + Info
        if (profile.motto || profile.twitterUsername) this.contentWrap.appendChild(this.createDivider());
        this.contentWrap.appendChild(this.createInfoSection(profile));

        // Divider + Actions
        this.contentWrap.appendChild(this.createDivider());
        this.contentWrap.appendChild(this.createActions(profile, sessionId));
    }

    // ────────────────── Shared Components ──────────────────

    private createMottoText(text: string): HTMLDivElement {
        const el = document.createElement('div');
        el.style.cssText = `
            color: #64748b; font-size: 13px; font-style: italic;
            word-wrap: break-word; line-height: 1.4;
            background: #f8fafc; padding: 10px; border-radius: 8px;
            border: 1px dashed #cbd5e1; text-align: center;
        `;
        el.textContent = text;
        return el;
    }

    private createDivider(): HTMLDivElement {
        const div = document.createElement('div');
        div.style.cssText = 'height: 1px; background: #e2e8f0; margin: 0 16px;';
        return div;
    }

    private createInfoSection(profile: PlayerProfile): HTMLDivElement {
        const section = document.createElement('div');
        section.style.cssText = 'padding: 16px; display: flex; flex-direction: column; gap: 8px; background: #ffffff;';

        const joined = new Date(profile.createdAt);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        section.appendChild(this.createInfoRow('Joined Date', `${joined.getDate()} ${monthNames[joined.getMonth()]} ${joined.getFullYear()}`));

        section.appendChild(this.createInfoRow('Level', `⭐ ${profile.level}`));
        section.appendChild(this.createInfoRow('Friends', String(profile.friendCount)));
        section.appendChild(this.createInfoRow('Respects', `❤️ ${profile.respectsReceived}`));

        if (profile.isOnline && profile.roomLabel) {
            section.appendChild(this.createInfoRow('World', profile.roomLabel));
        }

        return section;
    }

    private createInfoRow(label: string, value: string): HTMLDivElement {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; justify-content: space-between; font-size: 13px; align-items: center;';

        const lbl = document.createElement('span');
        lbl.style.cssText = 'color: #64748b; font-weight: 600;';
        lbl.textContent = label;
        row.appendChild(lbl);

        const val = document.createElement('span');
        val.style.cssText = 'color: #0f172a; font-weight: 700; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;';
        val.textContent = value;
        row.appendChild(val);

        return row;
    }

    private createTwitterSection(profile: PlayerProfile): HTMLDivElement {
        const section = document.createElement('div');
        section.style.cssText = `
            margin: 0 16px;
            padding: 10px 12px;
            background: #f0f9ff;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            transition: background 0.15s;
        `;
        section.addEventListener('mouseenter', () => { section.style.background = '#e0f2fe'; });
        section.addEventListener('mouseleave', () => { section.style.background = '#f0f9ff'; });

        // Avatar
        if (profile.twitterAvatar) {
            const avatar = document.createElement('img');
            avatar.src = profile.twitterAvatar;
            avatar.style.cssText = `
                width: 28px; height: 28px; border-radius: 50%;
                border: 2px solid #1d9bf0; flex-shrink: 0;
            `;
            avatar.onerror = () => { avatar.style.display = 'none'; };
            section.appendChild(avatar);
        }

        // @username
        const username = document.createElement('span');
        username.textContent = `@${profile.twitterUsername}`;
        username.style.cssText = `
            color: #1d9bf0; font-weight: 700; font-size: 13px;
            flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        `;
        section.appendChild(username);

        // X logo
        const xLogo = document.createElement('span');
        xLogo.textContent = '\ud835\udd4f';
        xLogo.style.cssText = `
            font-size: 16px; color: #0f172a; flex-shrink: 0;
        `;
        section.appendChild(xLogo);

        section.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(`https://x.com/${profile.twitterUsername}`, '_blank', 'noopener');
        });

        return section;
    }

    private createActions(profile: PlayerProfile, sessionId?: string): HTMLDivElement {
        const section = document.createElement('div');
        section.style.cssText = 'padding: 16px; display: flex; flex-wrap: wrap; gap: 8px; background: #f8fafc; border-radius: 0 0 12px 12px;';

        // Whisper (only if same room — sessionId provided)
        if (sessionId) {
            section.appendChild(this.createButton('💬 Whisper', false, '#e0f2fe', '#0284c7', () => {
                this.hide();
                this.onWhisper?.(sessionId, profile.displayName);
            }));
        }

        // Trade (only if same room — sessionId provided)
        if (sessionId) {
            section.appendChild(this.createButton('💰 Trade', false, '#fef3c7', '#d97706', () => {
                this.hide();
                this.onTrade?.(sessionId, profile.guestId, profile.displayName);
            }));
        }

        // Respect
        if (profile.hasGivenRespectToday) {
            section.appendChild(this.createButton('❤️ Respected', true, '#fce7f3', '#ec4899'));
        } else {
            section.appendChild(this.createButton('❤️ Respect', false, '#fce7f3', '#ec4899', () => {
                this.hide();
                this.onGiveRespect?.(profile.guestId, profile.displayName);
            }));
        }

        // Friend action
        if (profile.isFriend) {
            section.appendChild(this.createButton('Friends ✓', true, '#dcfce7', '#16a34a'));
            section.appendChild(this.createButton('Unfriend', false, '#fee2e2', '#ef4444', () => {
                this.showUnfriendConfirm(profile);
            }));
        } else if (profile.hasPendingRequest) {
            section.appendChild(this.createButton('Request Sent', true, '#f1f5f9', '#64748b'));
        } else {
            section.appendChild(this.createButton('👤 Add Friend', false, '#e0e7ff', '#4f46e5', () => {
                this.hide();
                this.onAddFriend?.(profile.guestId, profile.displayName);
            }));
        }

        // Visit Room (online + friend + different room)
        if (profile.isFriend && profile.isOnline && profile.roomLabel) {
            section.appendChild(this.createButton('🚀 Visit World', false, '#dcfce7', '#16a34a', () => {
                this.hide();
                this.onVisitRoom?.(profile.roomLabel!);
            }));
        }

        // Block / Unblock
        if (profile.isBlocked) {
            section.appendChild(this.createButton('🚫 Blocked', true, '#f1f5f9', '#94a3b8'));
        } else {
            section.appendChild(this.createButton('🚫 Block', false, '#fee2e2', '#ef4444', () => {
                this.showBlockConfirm(profile);
            }));
        }

        return section;
    }

    private createButton(label: string, disabled: boolean, bgColor: string, txtColor: string, onClick?: () => void): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.style.cssText = `
            flex: 1;
            min-width: 80px;
            padding: 8px 12px;
            border: none;
            border-radius: 8px;
            font-family: 'Outfit', Arial, sans-serif;
            font-size: 13px;
            font-weight: bold;
            cursor: ${disabled ? 'default' : 'pointer'};
            transition: all 0.15s;
            color: ${txtColor};
            background: ${bgColor};
            opacity: ${disabled ? '0.7' : '1'};
            box-shadow: ${disabled ? 'none' : '0 2px 4px rgba(0,0,0,0.05)'};
        `;
        btn.textContent = label;

        if (!disabled && onClick) {
            btn.addEventListener('mouseenter', () => btn.style.filter = 'brightness(0.95)');
            btn.addEventListener('mouseleave', () => btn.style.filter = 'brightness(1)');
            btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.96)');
            btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                onClick();
            });
        }

        return btn;
    }

    // ────────────────── Motto Editing ──────────────────

    private startMottoEdit(mottoRow: HTMLDivElement, currentMotto: string): void {
        mottoRow.innerHTML = '';
        mottoRow.onclick = null;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentMotto;
        input.maxLength = 60;
        input.placeholder = 'New motto...';
        input.style.cssText = `
            width: 100%;
            box-sizing: border-box;
            background: #f1f5f9;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            color: #0f172a;
            font-family: 'Outfit', Arial, sans-serif;
            font-size: 13px;
            font-weight: 600;
            padding: 10px;
            outline: none;
        `;
        mottoRow.appendChild(input);
        input.focus();
        input.select();

        let saved = false;

        const save = async () => {
            if (saved) return;
            saved = true;

            const newMotto = input.value.trim().substring(0, 60);
            try {
                await SocialService.getInstance().updateMotto(newMotto);
            } catch {
                // local fallback on error ok logically
            }
            this.restoreMottoText(mottoRow, newMotto);
        };

        const cancel = () => {
            if (saved) return;
            saved = true;
            this.restoreMottoText(mottoRow, currentMotto);
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                save();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
            }
        });

        input.addEventListener('blur', () => save());
    }

    private restoreMottoText(mottoRow: HTMLDivElement, motto: string): void {
        mottoRow.innerHTML = '';
        const mottoText = this.createMottoText(motto || 'Click to set a motto...');
        mottoText.title = 'Click to edit';
        mottoRow.appendChild(mottoText);
        mottoRow.onclick = () => {
            mottoRow.onclick = null;
            this.startMottoEdit(mottoRow, motto);
        };
    }

    // ────────────────── Unfriend Confirmation ──────────────────

    private showUnfriendConfirm(profile: PlayerProfile): void {
        this.clearContentWrap();

        const confirm = document.createElement('div');
        confirm.style.cssText = 'padding: 24px 16px; text-align: center; background: #ffffff;';

        const msg = document.createElement('div');
        msg.style.cssText = 'color: #0f172a; font-size: 14px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase;';
        msg.textContent = `Remove ${profile.displayName} from friends?`;
        confirm.appendChild(msg);

        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display: flex; gap: 12px; justify-content: center;';

        const cancelBtn = this.createButton('Cancel', false, '#f1f5f9', '#475569', () => this.hide());
        const confirmBtn = this.createButton('Unfriend', false, '#fee2e2', '#ef4444', () => {
            this.hide();
            this.onUnfriend?.(profile.guestId);
        });

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(confirmBtn);
        confirm.appendChild(btnRow);

        this.contentWrap.appendChild(confirm);
    }

    // ────────────────── Block Confirmation ──────────────────

    private showBlockConfirm(profile: PlayerProfile): void {
        this.clearContentWrap();

        const confirm = document.createElement('div');
        confirm.style.cssText = 'padding: 24px 16px; text-align: center; background: #ffffff;';

        const msg = document.createElement('div');
        msg.style.cssText = 'color: #0f172a; font-size: 14px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; line-height: 1.4;';
        const blockText = document.createTextNode('Block ');
        const nameEl = document.createElement('b');
        nameEl.textContent = profile.displayName;
        const questionMark = document.createTextNode('?');
        const br1 = document.createElement('br');
        const br2 = document.createElement('br');
        const subText = document.createElement('span');
        subText.style.cssText = 'font-size: 12px; color: #64748b; font-weight: normal; text-transform: none;';
        subText.textContent = "They will be unfriended and won't be able to contact you. Are you sure?";
        msg.appendChild(blockText);
        msg.appendChild(nameEl);
        msg.appendChild(questionMark);
        msg.appendChild(br1);
        msg.appendChild(br2);
        msg.appendChild(subText);
        confirm.appendChild(msg);

        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display: flex; gap: 12px; justify-content: center;';

        const cancelBtn = this.createButton('Cancel', false, '#f1f5f9', '#475569', () => this.hide());
        const confirmBtn = this.createButton('Block', false, '#fee2e2', '#ef4444', () => {
            this.hide();
            this.onBlock?.(profile.guestId, profile.displayName);
        });

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(confirmBtn);
        confirm.appendChild(btnRow);

        this.contentWrap.appendChild(confirm);
    }

    // ────────────────── Helpers ──────────────────

    private clearContentWrap(): void {
        while (this.contentWrap.firstChild) {
            this.contentWrap.removeChild(this.contentWrap.firstChild);
        }
    }

    private positionCard(screenX: number, screenY: number): void {
        // Initial center if no specified valid coordinates
        if (screenX === 0 && screenY === 0) {
            this.container.style.left = '50%';
            this.container.style.top = '50%';
            this.container.style.transform = 'translate(-50%, -50%)';
            return;
        }

        // absolute coords parsing
        this.container.style.transform = 'none';

        // Show temporarily out of bounds to measure if necessary, but usually `display:flex` handles rendering size.
        // If not rendered yet, this might return 0. (we set it to flex before calling this function).
        const rect = this.container.getBoundingClientRect();
        let width = rect.width || 300; // fallback width
        let height = rect.height || 200; // fallback height

        let x = screenX;
        let y = screenY;

        if (x + width > window.innerWidth) x = window.innerWidth - width - 10;
        if (y + height > window.innerHeight) y = window.innerHeight - height - 10;

        this.container.style.left = `${Math.max(10, x)}px`;
        this.container.style.top = `${Math.max(10, y)}px`;
    }
}
