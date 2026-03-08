import { SocialService, FriendInfo, PendingRequest } from "../services/SocialService";

export class FriendListPanel {
    private overlay: HTMLDivElement;
    private header: HTMLDivElement;
    private content: HTMLDivElement;
    private visible = false;

    // Drag state
    private isDragging = false;
    private dragStartX = 0;
    private dragStartY = 0;
    private initialLeft = 0;
    private initialTop = 0;

    /** Called when user clicks Whisper on a friend */
    public onWhisperFriend?: (guestId: number, displayName: string) => void;
    /** Called when user clicks Visit on a friend */
    public onVisitFriend?: (roomLabel: string) => void;

    constructor() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'friend-list-panel';

        // Sanalika-like styling: absolute, white, rounded, subtle shadow
        this.overlay.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 320px;
            background: #f1f5f9; /* Off-white / light slate background */
            border-radius: 12px;
            font-family: 'Outfit', Arial, sans-serif;
            color: #1e293b;
            z-index: 3000;
            display: none;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
            user-select: none; /* Prevent text selection while dragging */
        `;

        // Modern / Retro Header (Drag Handle)
        this.header = document.createElement('div');
        this.header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: #ffffff;
            border-radius: 12px 12px 0 0;
            cursor: grab;
            border-bottom: 2px solid #e2e8f0;
        `;

        // Left side of header (Profile icon + Name)
        const headerLeft = document.createElement('div');
        headerLeft.style.cssText = `display: flex; align-items: center; gap: 10px;`;

        // Placeholder Avatar (like Sanalika Aqui)
        const avatar = document.createElement('div');
        avatar.style.cssText = `
            width: 36px;
            height: 36px;
            border-radius: 8px;
            background: #ddd;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            border: 1px solid #cbd5e1;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        avatar.textContent = '👤';

        const titleText = document.createElement('div');
        titleText.style.cssText = `
            font-weight: 800;
            font-size: 16px;
            color: #0f172a;
        `;
        titleText.textContent = 'Social';

        headerLeft.appendChild(avatar);
        headerLeft.appendChild(titleText);

        // Right side of header (Close btn)
        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = '✖'; // Red cross
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

        this.header.appendChild(headerLeft);
        this.header.appendChild(closeBtn);

        // Setup Dragging
        this.setupDragging();

        // Tabs Container
        const tabBarContainer = document.createElement('div');
        tabBarContainer.style.cssText = `
            padding: 12px 16px 0 16px;
            background: #f1f5f9;
        `;

        const tabBar = document.createElement('div');
        tabBar.style.cssText = `
            display: flex;
            gap: 8px;
        `;

        const tabs = ['Friends', 'Requests', 'Search'];
        const tabElements: HTMLDivElement[] = [];

        tabs.forEach((tabName, idx) => {
            const tab = document.createElement('div');
            // Active by default for the first one
            const isActive = idx === 0;
            tab.style.cssText = `
                flex: 1;
                text-align: center;
                padding: 8px 12px;
                font-size: 12px;
                font-weight: bold;
                cursor: pointer;
                border-radius: 8px 8px 0 0;
                color: ${isActive ? '#ffffff' : '#475569'};
                background: ${isActive ? '#3b82f6' : '#ffffff'};
                border: 1px solid ${isActive ? '#2563eb' : '#cbd5e1'};
                border-bottom: none;
                transition: all 0.15s;
                position: relative;
                top: 1px; /* overlap content border */
                z-index: ${isActive ? '2' : '1'};
            `;
            tab.textContent = tabName;

            tab.addEventListener('click', () => {
                tabElements.forEach((t, i) => {
                    const isTabActive = i === idx;
                    t.style.color = isTabActive ? '#ffffff' : '#475569';
                    t.style.background = isTabActive ? '#3b82f6' : '#ffffff';
                    t.style.borderColor = isTabActive ? '#2563eb' : '#cbd5e1';
                    t.style.zIndex = isTabActive ? '2' : '1';
                });

                if (idx === 0) this.showFriendsTab();
                else if (idx === 1) this.showRequestsTab();
                else this.showSearchTab();
            });
            tabElements.push(tab);
            tabBar.appendChild(tab);
        });

        tabBarContainer.appendChild(tabBar);

        // Content Area (White Box)
        const contentWrapper = document.createElement('div');
        contentWrapper.style.cssText = `
            padding: 0 16px 16px 16px;
            background: #f1f5f9;
            border-radius: 0 0 12px 12px;
        `;

        this.content = document.createElement('div');
        this.content.style.cssText = `
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px;
            height: 300px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
            position: relative;
            z-index: 1;
        `;

        contentWrapper.appendChild(this.content);

        // Assemble pieces
        this.overlay.appendChild(this.header);
        this.overlay.appendChild(tabBarContainer);
        this.overlay.appendChild(contentWrapper);

        // Append to body so it can escape the game canvas constraints
        document.body.appendChild(this.overlay);

        // Prevent game clicks when interacting with panel
        this.overlay.addEventListener('pointerdown', (e) => e.stopPropagation());
    }

    private setupDragging() {
        this.header.addEventListener('pointerdown', (e) => {
            if (e.target !== this.header && !(e.target as HTMLElement).parentElement?.isSameNode(this.header)) {
                // Don't drag if clicking inside buttons or specific child inputs
                if ((e.target as HTMLElement).tagName.toLowerCase() === 'button' || (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
                    return;
                }
            }

            this.isDragging = true;
            this.header.style.cursor = 'grabbing';
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;

            // Get computed style to handle transform logic initially
            const style = window.getComputedStyle(this.overlay);
            // If it's still centered via transform, calculate absolute left/top and remove transform
            if (style.transform !== 'none') {
                const rect = this.overlay.getBoundingClientRect();
                this.overlay.style.transform = 'none';
                this.overlay.style.left = rect.left + 'px';
                this.overlay.style.top = rect.top + 'px';
                this.initialLeft = rect.left;
                this.initialTop = rect.top;
            } else {
                this.initialLeft = parseInt(style.left, 10) || 0;
                this.initialTop = parseInt(style.top, 10) || 0;
            }

            // Capture pointer so drag works outside element
            this.header.setPointerCapture(e.pointerId);
            e.preventDefault();
        });

        this.header.addEventListener('pointermove', (e) => {
            if (!this.isDragging) return;

            const dx = e.clientX - this.dragStartX;
            const dy = e.clientY - this.dragStartY;

            this.overlay.style.left = `${this.initialLeft + dx}px`;
            this.overlay.style.top = `${this.initialTop + dy}px`;
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

    public toggle() {
        this.visible = !this.visible;
        this.overlay.style.display = this.visible ? 'block' : 'none';

        // If showing for the first time or opening, we might want to reset position
        // But for a floating window, usually better to keep it where user left it.

        if (this.visible) {
            this.showFriendsTab();
        }
    }

    public isVisible(): boolean {
        return this.visible;
    }

    public hide() {
        this.visible = false;
        this.overlay.style.display = 'none';
    }

    private clearContent() {
        while (this.content.firstChild) {
            this.content.removeChild(this.content.firstChild);
        }
    }

    private async showFriendsTab() {
        this.clearContent();
        this.addLoading();

        try {
            const data = await SocialService.getInstance().getFriends();
            this.clearContent();

            if (data.friends.length === 0) {
                this.addEmpty("No friends yet. Search to add!");
                return;
            }

            // Sort: online first
            const sorted = [...data.friends].sort((a, b) => {
                if (a.isOnline && !b.isOnline) return -1;
                if (!a.isOnline && b.isOnline) return 1;
                return a.displayName.localeCompare(b.displayName);
            });

            for (const friend of sorted) {
                this.addFriendRow(friend);
            }
        } catch (e) {
            this.clearContent();
            this.addEmpty("Failed to load friends");
        }
    }

    private addFriendRow(friend: FriendInfo) {
        const row = document.createElement('div');
        row.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
        `;

        // Online indicator (Sanalika style - green status dot)
        const dot = document.createElement('div');
        dot.style.cssText = `
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: ${friend.isOnline ? '#22c55e' : '#cbd5e1'};
            border: 2px solid #ffffff;
            box-shadow: 0 0 0 1px ${friend.isOnline ? '#16a34a' : '#94a3b8'};
            margin-right: 12px;
            flex-shrink: 0;
        `;
        row.appendChild(dot);

        // Name + room
        const info = document.createElement('div');
        info.style.cssText = 'flex: 1; min-width: 0;';
        const name = document.createElement('div');
        name.style.cssText = 'font-size: 14px; color: #0f172a; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
        name.textContent = friend.displayName;
        info.appendChild(name);

        if (friend.isOnline && friend.roomLabel) {
            const room = document.createElement('div');
            room.style.cssText = 'font-size: 11px; color: #64748b; margin-top: 2px;';
            room.textContent = friend.roomLabel;
            info.appendChild(room);
        }
        row.appendChild(info);

        // Action buttons
        const actions = document.createElement('div');
        actions.style.cssText = 'display: flex; gap: 6px; flex-shrink: 0;';

        // Whisper button
        const whisperBtn = this.createActionButton('💬', '#e0f2fe', '#0ea5e9', 'Whisper');
        whisperBtn.addEventListener('click', () => {
            this.hide();
            if (this.onWhisperFriend) {
                this.onWhisperFriend(friend.guestId, friend.displayName);
            }
        });
        actions.appendChild(whisperBtn);

        // Visit button (online only)
        if (friend.isOnline && friend.roomLabel) {
            const visitBtn = this.createActionButton('🚀', '#dcfce7', '#22c55e', 'Visit World');
            visitBtn.addEventListener('click', () => {
                this.hide();
                if (this.onVisitFriend && friend.roomLabel) {
                    this.onVisitFriend(friend.roomLabel);
                }
            });
            actions.appendChild(visitBtn);
        }

        // Unfriend button
        const unfriendBtn = this.createActionButton('✖', '#fee2e2', '#ef4444', 'Unfriend');
        unfriendBtn.addEventListener('click', async () => {
            if (!confirm(`Remove ${friend.displayName} from friends?`)) return;
            try {
                await SocialService.getInstance().removeFriend(friend.guestId);
                this.showFriendsTab();
            } catch (e) {
                console.warn("[FriendList] removeFriend failed:", e);
            }
        });
        actions.appendChild(unfriendBtn);

        row.appendChild(actions);
        this.content.appendChild(row);
    }

    private async showRequestsTab() {
        this.clearContent();
        this.addLoading();

        try {
            const data = await SocialService.getInstance().getFriends();
            this.clearContent();

            if (data.pendingReceived.length === 0 && data.pendingSent.length === 0) {
                this.addEmpty("No pending requests.");
                return;
            }

            if (data.pendingReceived.length > 0) {
                this.addSectionHeader("Received");
                for (const req of data.pendingReceived) {
                    this.addRequestRow(req, true);
                }
            }

            if (data.pendingSent.length > 0) {
                this.addSectionHeader("Sent");
                for (const req of data.pendingSent) {
                    this.addRequestRow(req, false);
                }
            }
        } catch (e) {
            this.clearContent();
            this.addEmpty("Failed to load requests!");
        }
    }

    private addRequestRow(req: PendingRequest, isReceived: boolean) {
        const row = document.createElement('div');
        row.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
        `;

        const name = document.createElement('span');
        name.style.cssText = 'flex: 1; font-size: 14px; color: #0f172a; font-weight: 600;';
        name.textContent = req.displayName;
        row.appendChild(name);

        if (isReceived) {
            const acceptBtn = this.createActionButton('✓', '#dcfce7', '#22c55e', 'Accept');
            acceptBtn.addEventListener('click', async () => {
                try {
                    await SocialService.getInstance().respondToFriendRequest(req.requestId, true);
                    this.showRequestsTab();
                } catch (e) {
                    console.warn("[FriendList] accept failed:", e);
                }
            });
            row.appendChild(acceptBtn);

            const rejectBtn = this.createActionButton('✖', '#fee2e2', '#ef4444', 'Reject');
            rejectBtn.addEventListener('click', async () => {
                try {
                    await SocialService.getInstance().respondToFriendRequest(req.requestId, false);
                    this.showRequestsTab();
                } catch (e) {
                    console.warn("[FriendList] reject failed:", e);
                }
            });
            row.appendChild(rejectBtn);
        } else {
            const label = document.createElement('span');
            label.style.cssText = 'font-size: 11px; color: #94a3b8; font-weight: bold; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;';
            label.textContent = 'Pending...';
            row.appendChild(label);
        }

        this.content.appendChild(row);
    }

    private showSearchTab() {
        this.clearContent();

        const inputWrap = document.createElement('div');
        inputWrap.style.cssText = 'margin-bottom: 12px; position: sticky; top: 0; background: #ffffff; padding-bottom: 8px;';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Search username...';
        input.style.cssText = `
            width: 100%;
            padding: 10px;
            font-size: 13px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            background: #f8fafc;
            color: #0f172a;
            outline: none;
            box-sizing: border-box;
            font-family: 'Outfit', Arial, sans-serif;
            transition: border-color 0.2s;
        `;
        input.onfocus = () => input.style.borderColor = '#3b82f6';
        input.onblur = () => input.style.borderColor = '#e2e8f0';

        const results = document.createElement('div');

        let debounce: ReturnType<typeof setTimeout>;
        input.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(async () => {
                const query = input.value.trim();
                while (results.firstChild) results.removeChild(results.firstChild);

                if (query.length < 1) return;

                try {
                    const players = await SocialService.getInstance().searchPlayers(query);
                    if (players.length === 0) {
                        const empty = document.createElement('div');
                        empty.style.cssText = 'text-align: center; color: #94a3b8; font-size: 13px; padding: 20px;';
                        empty.textContent = 'User not found';
                        results.appendChild(empty);
                        return;
                    }

                    for (const p of players) {
                        const row = document.createElement('div');
                        row.style.cssText = `
                            display: flex;
                            align-items: center;
                            padding: 8px;
                            border-bottom: 1px solid #e2e8f0;
                        `;

                        const nameEl = document.createElement('span');
                        nameEl.style.cssText = 'flex: 1; font-size: 14px; color: #0f172a; font-weight: 600;';
                        nameEl.textContent = p.displayName;
                        row.appendChild(nameEl);

                        const addBtn = this.createActionButton('+', '#e0e7ff', '#4f46e5', 'Add Friend');
                        addBtn.addEventListener('click', async () => {
                            try {
                                await SocialService.getInstance().sendFriendRequest(p.guestId);
                                addBtn.textContent = '✓ Request Sent';
                                addBtn.style.background = '#dcfce7';
                                addBtn.style.color = '#22c55e';
                                addBtn.style.pointerEvents = 'none';
                                addBtn.style.width = 'auto'; // allow text expansion
                                addBtn.style.padding = '4px 8px';
                            } catch (e: any) {
                                addBtn.textContent = '!';
                                addBtn.title = e.message || 'Error';
                                addBtn.style.background = '#fee2e2';
                                addBtn.style.color = '#ef4444';
                            }
                        });
                        row.appendChild(addBtn);
                        results.appendChild(row);
                    }
                } catch (e) {
                    console.warn("[FriendList] search failed:", e);
                }
            }, 300);
        });

        // Prevent game input while typing
        input.addEventListener('keydown', (e) => e.stopPropagation());

        inputWrap.appendChild(input);
        this.content.appendChild(inputWrap);
        this.content.appendChild(results);
        input.focus();
    }

    private createActionButton(text: string, bgColor: string, txtColor: string, title: string): HTMLSpanElement {
        const btn = document.createElement('span');
        btn.style.cssText = `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 6px;
            background: ${bgColor};
            color: ${txtColor};
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: transform 0.1s, filter 0.2s;
            user-select: none;
        `;
        btn.textContent = text;
        btn.title = title;

        btn.addEventListener('mouseenter', () => btn.style.filter = 'brightness(0.95)');
        btn.addEventListener('mouseleave', () => btn.style.filter = 'brightness(1)');
        btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.95)');
        btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');

        return btn;
    }

    private addLoading() {
        const el = document.createElement('div');
        el.style.cssText = 'text-align: center; color: #94a3b8; font-size: 13px; padding: 30px; font-weight: 500;';
        el.textContent = 'Loading...';
        this.content.appendChild(el);
    }

    private addEmpty(msg: string) {
        const el = document.createElement('div');
        el.style.cssText = 'text-align: center; color: #94a3b8; font-size: 13px; padding: 30px; font-weight: 500;';
        el.textContent = msg;
        this.content.appendChild(el);
    }

    private addSectionHeader(text: string) {
        const el = document.createElement('div');
        el.style.cssText = 'font-size: 11px; color: #64748b; font-weight: 800; padding: 12px 0 4px 0; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; margin-bottom: 8px;';
        el.textContent = text;
        this.content.appendChild(el);
    }

    public destroy() {
        this.overlay.remove();
    }
}
