export interface BottomMenuCallbacks {
    onInventory: () => void;
    onRoomSwitch: () => void;
    onFriends: () => void;
    onChat: () => void;
    onMood: () => void;
    onShop: () => void;
    onQuests: () => void;
    onSoundToggle: () => void;
    onExitToLobby: () => void;
    onSettings: () => void;
}

interface ButtonDef {
    label: string;
    icon?: string;      // PNG path (relative to assets/)
    emoji?: string;     // fallback emoji for Shop
    isChat?: boolean;   // badge target
    isLoopi?: boolean;  // hover popup trigger
    cb?: () => void;
}

export class BottomMenu {
    private el: HTMLDivElement;
    private scene: Phaser.Scene;
    private messengerBadge!: HTMLSpanElement;
    private soundLabel!: HTMLSpanElement;
    private loopiPopup!: HTMLDivElement;
    private popupTimer: ReturnType<typeof setTimeout> | null = null;
    private resizeHandler: () => void;
    private resizeObserver?: ResizeObserver;
    private callbacks: BottomMenuCallbacks;

    // Chat input elements (inside the single row)
    private chatInput!: HTMLInputElement;
    private emojiBtn!: HTMLButtonElement;

    constructor(scene: Phaser.Scene, callbacks: BottomMenuCallbacks) {
        this.scene = scene;
        this.callbacks = callbacks;

        // Remove stale instance
        document.getElementById('bottom-menu')?.remove();

        this.el = document.createElement('div');
        this.el.id = 'bottom-menu';
        this.el.style.cssText = `
            position: absolute;
            z-index: 2000;
            height: 60px;
            background: #1b1b30;
            border-top: 2px solid #55477c;
            display: flex;
            align-items: center;
            padding: 0 10px;
            font-family: 'Outfit', Arial, sans-serif;
            user-select: none;
            box-sizing: border-box;
            position: absolute;
        `;

        // ── Left side: Chat input + emoji button ──
        const chatGroup = document.createElement('div');
        chatGroup.style.cssText = `
            display: flex;
            align-items: center;
            gap: 5px;
            flex-shrink: 0;
            z-index: 1;
        `;

        this.chatInput = document.createElement('input');
        this.chatInput.type = 'text';
        this.chatInput.placeholder = 'Type a message...';
        this.chatInput.style.cssText = `
            width: 220px;
            padding: 8px 12px;
            font-size: 13px;
            font-family: 'Outfit', Arial, sans-serif;
            border: 1.5px solid #4a3870;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.08);
            color: #e2e8f0;
            outline: none;
            pointer-events: auto;
            transition: border-color 0.2s, box-shadow 0.2s;
        `;

        this.chatInput.addEventListener('focus', () => {
            this.chatInput.style.borderColor = '#7c3aed';
            this.chatInput.style.boxShadow = '0 0 0 2px rgba(124, 58, 237, 0.25)';
        });

        this.chatInput.addEventListener('blur', () => {
            this.chatInput.style.borderColor = '#4a3870';
            this.chatInput.style.boxShadow = 'none';
        });

        this.chatInput.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });

        this.emojiBtn = document.createElement('button');
        this.emojiBtn.textContent = '\u{1F60A}';
        this.emojiBtn.style.cssText = `
            width: 36px;
            height: 36px;
            border: 1.5px solid #4a3870;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.08);
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: border-color 0.2s;
            padding: 0;
            line-height: 1;
            flex-shrink: 0;
        `;
        this.emojiBtn.addEventListener('mouseenter', () => {
            this.emojiBtn.style.borderColor = '#7c3aed';
        });
        this.emojiBtn.addEventListener('mouseleave', () => {
            this.emojiBtn.style.borderColor = '#4a3870';
        });

        chatGroup.appendChild(this.chatInput);
        chatGroup.appendChild(this.emojiBtn);

        // ── Center: Icon buttons (absolute-centered over full width) ──
        const buttonGroup = document.createElement('div');
        buttonGroup.style.cssText = `
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 6px;
        `;

        const buttons: ButtonDef[] = [
            { label: 'Inventory', icon: 'assets/ui/inv.png', cb: callbacks.onInventory },
            { label: 'Shop', icon: 'assets/ui/store.png', cb: callbacks.onShop },
            { label: 'Social', icon: 'assets/ui/social.png', cb: callbacks.onFriends },
            { label: 'Chat', icon: 'assets/ui/chat.png', cb: callbacks.onChat, isChat: true },
            { label: 'Mood', icon: 'assets/ui/mood.png', cb: callbacks.onMood },
            { label: 'World', icon: 'assets/ui/room.png', cb: callbacks.onRoomSwitch },
            { label: 'Loopi', icon: 'assets/ui/loopia-navbar.png', isLoopi: true },
        ];

        buttons.forEach((btn) => {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `
                position: relative; display: flex;
                align-items: center; justify-content: center;
                width: 48px; height: 44px;
                background: transparent; border: none;
                border-radius: 4px; cursor: pointer;
                transition: transform 0.1s;
            `;

            if (btn.icon) {
                const img = document.createElement('img');
                img.src = btn.icon;
                img.style.cssText = 'width: 40px; height: 40px; object-fit: contain; pointer-events: none;';
                wrapper.appendChild(img);
            } else if (btn.emoji) {
                const span = document.createElement('span');
                span.textContent = btn.emoji;
                span.style.cssText = 'font-size: 20px; line-height: 1;';
                wrapper.appendChild(span);
            }

            // Tooltip
            const tooltip = document.createElement('div');
            tooltip.textContent = btn.label;
            tooltip.style.cssText = `
                position: absolute;
                bottom: calc(100% + 8px);
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.85);
                color: #fff;
                font-size: 11px;
                font-weight: 600;
                padding: 4px 8px;
                border-radius: 4px;
                white-space: nowrap;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.15s ease;
            `;
            wrapper.appendChild(tooltip);

            // Chat badge
            if (btn.isChat) {
                const badge = document.createElement('span');
                badge.style.cssText = `
                    position: absolute; top: -6px; right: -6px;
                    background: #ef4444; color: #fff; font-size: 10px; font-weight: bold;
                    min-width: 18px; height: 18px; border-radius: 50%;
                    display: none; align-items: center; justify-content: center;
                    border: 2px solid #0f172a; font-family: Arial;
                `;
                badge.textContent = '0';
                wrapper.appendChild(badge);
                this.messengerBadge = badge;
            }

            if (btn.isLoopi) {
                this.createLoopiPopup(wrapper);

                wrapper.addEventListener('mouseenter', () => {
                    wrapper.style.transform = 'scale(1.1)';
                    tooltip.style.opacity = '0';
                    this.showPopup();
                });
                wrapper.addEventListener('mouseleave', () => {
                    wrapper.style.transform = '';
                    this.scheduleHidePopup();
                });
            } else {
                wrapper.addEventListener('mousedown', () => {
                    wrapper.style.transform = 'scale(0.9)';
                });
                wrapper.addEventListener('mouseup', () => {
                    wrapper.style.transform = 'scale(1.1)';
                    btn.cb?.();
                });
                wrapper.addEventListener('mouseleave', () => {
                    wrapper.style.transform = '';
                    tooltip.style.opacity = '0';
                });
                wrapper.addEventListener('mouseenter', () => {
                    wrapper.style.transform = 'scale(1.1)';
                    tooltip.style.opacity = '1';
                });
            }

            buttonGroup.appendChild(wrapper);
        });

        this.el.appendChild(chatGroup);
        this.el.appendChild(buttonGroup);
        document.body.appendChild(this.el);

        // Position relative to canvas
        this.resizeHandler = () => this.reposition();
        this.reposition();
        window.addEventListener('resize', this.resizeHandler);

        const canvas = scene.game.canvas;
        if (canvas.parentElement) {
            this.resizeObserver = new ResizeObserver(() => this.reposition());
            this.resizeObserver.observe(canvas.parentElement);
        }
    }

    /** Expose the chat input element so ChatOverlay can wire it */
    public getChatInput(): HTMLInputElement {
        return this.chatInput;
    }

    /** Expose the emoji button so ChatOverlay can wire it */
    public getEmojiBtn(): HTMLButtonElement {
        return this.emojiBtn;
    }

    private createLoopiPopup(wrapper: HTMLDivElement) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: absolute;
            bottom: calc(100% + 8px);
            right: 0;
            background: #1e293b;
            border: 2px solid #334155;
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
            min-width: 160px;
            padding: 4px 0;
            display: none;
            flex-direction: column;
            z-index: 2100;
            font-family: 'Outfit', Arial, sans-serif;
        `;

        // Quests row
        popup.appendChild(this.createPopupRow('\u{1F4DC}', 'Quests', () => {
            this.hidePopup();
            this.callbacks.onQuests();
        }));

        // Sound row
        const soundRow = this.createPopupRow('\u{1F50A}', 'Sound On', () => {
            this.callbacks.onSoundToggle();
        });
        this.soundLabel = soundRow.querySelector('[data-popup-label]') as HTMLSpanElement;
        popup.appendChild(soundRow);

        // Exit to lobby row
        popup.appendChild(this.createPopupRow('\u{1F6AA}', 'Exit to Lobby', () => {
            this.hidePopup();
            this.callbacks.onExitToLobby();
        }));

        // Settings row
        popup.appendChild(this.createPopupRow('\u{2699}\u{FE0F}', 'Settings', () => {
            this.hidePopup();
            this.callbacks.onSettings();
        }));

        popup.addEventListener('mouseenter', () => {
            this.cancelHidePopup();
        });
        popup.addEventListener('mouseleave', () => {
            this.scheduleHidePopup();
        });

        wrapper.appendChild(popup);
        this.loopiPopup = popup;
    }

    private createPopupRow(emoji: string, label: string, cb: () => void): HTMLDivElement {
        const row = document.createElement('div');
        row.style.cssText = `
            display: flex; align-items: center; gap: 10px;
            padding: 8px 14px; cursor: pointer;
            transition: background 0.1s;
            font-size: 13px; color: #e2e8f0;
        `;

        const icon = document.createElement('span');
        icon.textContent = emoji;
        icon.style.cssText = 'font-size: 16px; line-height: 1; width: 20px; text-align: center;';

        const text = document.createElement('span');
        text.textContent = label;
        text.setAttribute('data-popup-label', '');
        text.style.cssText = 'font-weight: 500;';

        row.appendChild(icon);
        row.appendChild(text);

        row.addEventListener('mouseenter', () => {
            row.style.background = '#334155';
        });
        row.addEventListener('mouseleave', () => {
            row.style.background = 'transparent';
        });
        row.addEventListener('click', cb);

        return row;
    }

    private showPopup() {
        this.cancelHidePopup();
        this.loopiPopup.style.display = 'flex';
    }

    private hidePopup() {
        this.cancelHidePopup();
        this.loopiPopup.style.display = 'none';
    }

    private scheduleHidePopup() {
        this.cancelHidePopup();
        this.popupTimer = setTimeout(() => {
            this.loopiPopup.style.display = 'none';
        }, 200);
    }

    private cancelHidePopup() {
        if (this.popupTimer) {
            clearTimeout(this.popupTimer);
            this.popupTimer = null;
        }
    }

    private reposition() {
        const canvas = this.scene.game.canvas;
        const rect = canvas.getBoundingClientRect();
        this.el.style.left = `${rect.left}px`;
        this.el.style.width = `${rect.width}px`;
        this.el.style.top = `${rect.bottom - 60}px`;
    }

    public updateMessengerBadge(count: number) {
        if (!this.messengerBadge) return;
        if (count > 0) {
            this.messengerBadge.textContent = String(count);
            this.messengerBadge.style.display = 'flex';
        } else {
            this.messengerBadge.style.display = 'none';
        }
    }

    public updateSoundIcon(isMuted: boolean) {
        if (!this.soundLabel) return;
        this.soundLabel.textContent = isMuted ? 'Sound Off' : 'Sound On';
        const row = this.soundLabel.parentElement;
        if (row) {
            const icon = row.querySelector('span:first-child');
            if (icon) icon.textContent = isMuted ? '\u{1F507}' : '\u{1F50A}';
        }
    }

    public applyZoom(_zoom: number) {
        // No-op: DOM-based, unaffected by camera zoom
    }

    public getContainer(): any {
        return null;
    }

    public show() {
        this.el.style.display = 'flex';
    }

    public hide() {
        this.el.style.display = 'none';
    }

    public destroy() {
        window.removeEventListener('resize', this.resizeHandler);
        this.resizeObserver?.disconnect();
        this.cancelHidePopup();
        this.el.remove();
    }
}
