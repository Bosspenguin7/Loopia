import { SocialService, FriendInfo } from "../services/SocialService";

export class MessengerPanel {
    private overlay: HTMLDivElement;
    private header: HTMLDivElement;
    private conversationList: HTMLDivElement;
    private threadMessages: HTMLDivElement;
    private threadInput: HTMLInputElement;
    private threadHeader: HTMLDivElement;
    private visible = false;
    private myGuestId: number;

    private selectedGuestId: number | null = null;
    private friends: FriendInfo[] = [];
    private unreadCounts: { [guestId: number]: number } = {};

    // Drag state
    private isDragging = false;
    private dragStartX = 0;
    private dragStartY = 0;
    private initialLeft = 0;
    private initialTop = 0;

    /** Total unread count for badge */
    public totalUnread: number = 0;
    /** Called when total unread changes */
    public onUnreadChange?: (count: number) => void;

    constructor(myGuestId: number) {
        this.myGuestId = myGuestId;

        this.overlay = document.createElement('div');
        this.overlay.id = 'messenger-panel';

        // Sanalika-like styling
        this.overlay.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 500px;
            height: 400px;
            background: #ffffff;
            border-radius: 12px;
            font-family: 'Outfit', Arial, sans-serif;
            color: #1e293b;
            z-index: 3000;
            display: none;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
            flex-direction: column;
            user-select: none;
        `;

        // Modern / Retro Header (Drag Handle)
        this.header = document.createElement('div');
        this.header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: #f1f5f9;
            border-radius: 12px 12px 0 0;
            cursor: grab;
            border-bottom: 2px solid #e2e8f0;
            flex-shrink: 0;
        `;

        // Left side of header (Icon + Name)
        const headerLeft = document.createElement('div');
        headerLeft.style.cssText = `display: flex; align-items: center; gap: 10px;`;

        const iconContainer = document.createElement('div');
        iconContainer.style.cssText = `
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: #e0f2fe;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            border: 1px solid #bae6fd;
            color: #0369a1;
        `;
        iconContainer.textContent = '✉️';

        const titleText = document.createElement('div');
        titleText.style.cssText = `
            font-weight: 800;
            font-size: 16px;
            color: #0f172a;
        `;
        titleText.textContent = 'Messages';

        headerLeft.appendChild(iconContainer);
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

        // Two-column layout
        const contentLayout = document.createElement('div');
        contentLayout.style.cssText = `
            display: flex; 
            flex: 1; 
            overflow: hidden;
            border-radius: 0 0 12px 12px;
        `;

        // Left: conversation list
        this.conversationList = document.createElement('div');
        this.conversationList.style.cssText = `
            width: 160px;
            border-right: 1px solid #e2e8f0;
            background: #f8fafc;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
        `;

        // Right: thread view
        const rightPane = document.createElement('div');
        rightPane.style.cssText = 'flex: 1; display: flex; flex-direction: column; background: #ffffff;';

        this.threadHeader = document.createElement('div');
        this.threadHeader.style.cssText = `
            padding: 12px 16px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            background: #ffffff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            z-index: 1;
        `;
        this.threadHeader.textContent = 'Select a conversation';

        this.threadMessages = document.createElement('div');
        this.threadMessages.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 12px;
            background: #f1f5f9;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;

        // Thread input
        const inputWrap = document.createElement('div');
        inputWrap.style.cssText = `
            padding: 12px; 
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
        `;

        this.threadInput = document.createElement('input');
        this.threadInput.type = 'text';
        this.threadInput.placeholder = 'Type a message...';
        this.threadInput.style.cssText = `
            width: 100%;
            padding: 10px 14px;
            font-size: 14px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            background: #f8fafc;
            color: #0f172a;
            outline: none;
            box-sizing: border-box;
            font-family: 'Outfit', Arial, sans-serif;
            transition: border-color 0.2s;
        `;

        this.threadInput.onfocus = () => this.threadInput.style.borderColor = '#3b82f6';
        this.threadInput.onblur = () => this.threadInput.style.borderColor = '#e2e8f0';

        this.threadInput.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter' && this.threadInput.value.trim() && this.selectedGuestId) {
                this.sendDM(this.selectedGuestId, this.threadInput.value.trim());
                this.threadInput.value = '';
            }
        });

        inputWrap.appendChild(this.threadInput);

        rightPane.appendChild(this.threadHeader);
        rightPane.appendChild(this.threadMessages);
        rightPane.appendChild(inputWrap);

        contentLayout.appendChild(this.conversationList);
        contentLayout.appendChild(rightPane);

        this.overlay.appendChild(this.header);
        this.overlay.appendChild(contentLayout);
        document.body.appendChild(this.overlay);

        // Prevent game clicks
        this.overlay.addEventListener('pointerdown', (e) => e.stopPropagation());
    }

    private setupDragging() {
        this.header.addEventListener('pointerdown', (e) => {
            if (e.target !== this.header && !(e.target as HTMLElement).parentElement?.isSameNode(this.header)) {
                if ((e.target as HTMLElement).tagName.toLowerCase() === 'button' || (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
                    return;
                }
            }

            this.isDragging = true;
            this.header.style.cursor = 'grabbing';
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;

            const style = window.getComputedStyle(this.overlay);
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
        this.overlay.style.display = this.visible ? 'flex' : 'none';
        if (this.visible) {
            this.refresh();
        }
    }

    public isVisible(): boolean {
        return this.visible;
    }

    public hide() {
        this.visible = false;
        this.overlay.style.display = 'none';
    }

    public async refresh() {
        try {
            const [friendsData, unread] = await Promise.all([
                SocialService.getInstance().getFriends(),
                SocialService.getInstance().getUnreadCounts(),
            ]);
            this.friends = friendsData.friends;
            this.unreadCounts = unread;
            this.updateTotalUnread();
            this.renderConversationList();
        } catch (e) {
            console.warn("[Messenger] refresh failed:", e);
        }
    }

    /** Called on login to check for unread messages */
    public async checkUnread(): Promise<number> {
        try {
            this.unreadCounts = await SocialService.getInstance().getUnreadCounts();
            this.updateTotalUnread();
            return this.totalUnread;
        } catch (e) {
            return 0;
        }
    }

    /** Handle incoming real-time DM */
    public handleIncomingDM(senderId: number, senderName: string, message: string) {
        // If currently viewing this conversation, add to thread
        if (this.visible && this.selectedGuestId === senderId) {
            this.addMessageBubble(message, false, senderName);
            // Mark as read
            SocialService.getInstance().markRead(senderId).catch(() => { });
        } else {
            // Increment unread
            this.unreadCounts[senderId] = (this.unreadCounts[senderId] || 0) + 1;
            this.updateTotalUnread();
            if (this.visible) {
                this.renderConversationList();
            }
        }
    }

    private updateTotalUnread() {
        this.totalUnread = Object.values(this.unreadCounts).reduce((a, b) => a + b, 0);
        if (this.onUnreadChange) {
            this.onUnreadChange(this.totalUnread);
        }
    }

    private renderConversationList() {
        while (this.conversationList.firstChild) {
            this.conversationList.removeChild(this.conversationList.firstChild);
        }

        // Sort: unread first, then alphabetical
        const sorted = [...this.friends].sort((a, b) => {
            const ua = this.unreadCounts[a.guestId] || 0;
            const ub = this.unreadCounts[b.guestId] || 0;
            if (ua > 0 && ub === 0) return -1;
            if (ua === 0 && ub > 0) return 1;
            return a.displayName.localeCompare(b.displayName);
        });

        for (const friend of sorted) {
            const row = document.createElement('div');
            const isSelected = this.selectedGuestId === friend.guestId;
            row.style.cssText = `
                padding: 12px 14px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                background: ${isSelected ? '#e0f2fe' : 'transparent'};
                border-left: ${isSelected ? '4px solid #3b82f6' : '4px solid transparent'};
                transition: background 0.15s;
                border-bottom: 1px solid #e2e8f0;
            `;

            const name = document.createElement('span');
            name.style.cssText = `
                flex: 1; 
                overflow: hidden; 
                text-overflow: ellipsis; 
                white-space: nowrap;
                color: ${isSelected ? '#0369a1' : '#334155'};
                font-weight: ${isSelected ? '700' : '500'};
            `;
            name.textContent = friend.displayName;
            row.appendChild(name);

            const unread = this.unreadCounts[friend.guestId] || 0;
            if (unread > 0) {
                const badge = document.createElement('span');
                badge.style.cssText = `
                    background: #ef4444;
                    color: white;
                    border-radius: 12px;
                    padding: 2px 8px;
                    font-size: 11px;
                    font-weight: 800;
                    min-width: 18px;
                    text-align: center;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                `;
                badge.textContent = String(unread);
                row.appendChild(badge);
            }

            row.addEventListener('mouseenter', () => {
                if (!isSelected) row.style.background = '#f1f5f9';
            });
            row.addEventListener('mouseleave', () => {
                if (!isSelected) row.style.background = 'transparent';
            });
            row.addEventListener('click', () => {
                this.selectConversation(friend.guestId, friend.displayName);
            });

            this.conversationList.appendChild(row);
        }

        if (sorted.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'text-align: center; color: #94a3b8; font-size: 13px; padding: 20px;';
            empty.textContent = 'No friends';
            this.conversationList.appendChild(empty);
        }
    }

    private async selectConversation(guestId: number, displayName: string) {
        this.selectedGuestId = guestId;
        this.threadHeader.textContent = displayName;

        while (this.threadMessages.firstChild) {
            this.threadMessages.removeChild(this.threadMessages.firstChild);
        }

        // Mark as read
        if (this.unreadCounts[guestId]) {
            delete this.unreadCounts[guestId];
            this.updateTotalUnread();
            this.renderConversationList();
            SocialService.getInstance().markRead(guestId).catch(() => { });
        }

        // Load message history
        try {
            const messages = await SocialService.getInstance().getMessages(guestId);
            for (const msg of messages) {
                const isMine = msg.senderId === this.myGuestId;
                this.addMessageBubble(msg.message, isMine);
            }
            this.threadMessages.scrollTop = this.threadMessages.scrollHeight;
        } catch (e) {
            console.warn("[Messenger] loadMessages failed:", e);
        }

        this.threadInput.focus();
    }

    private addMessageBubble(message: string, isMine: boolean, _senderName?: string) {
        const wrap = document.createElement('div');
        wrap.style.cssText = `
            display: flex;
            justify-content: ${isMine ? 'flex-end' : 'flex-start'};
            width: 100%;
        `;

        const bubble = document.createElement('div');
        bubble.style.cssText = `
            max-width: 80%;
            padding: 8px 12px;
            border-radius: ${isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px'};
            font-size: 13px;
            line-height: 1.4;
            word-wrap: break-word;
            background: ${isMine ? '#3b82f6' : '#ffffff'};
            color: ${isMine ? '#ffffff' : '#0f172a'};
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            border: ${isMine ? 'none' : '1px solid #e2e8f0'};
        `;
        bubble.textContent = message;

        wrap.appendChild(bubble);
        this.threadMessages.appendChild(wrap);
        this.threadMessages.scrollTop = this.threadMessages.scrollHeight;
    }

    private async sendDM(targetGuestId: number, message: string) {
        try {
            await SocialService.getInstance().sendMessage(targetGuestId, message);
            this.addMessageBubble(message, true);
        } catch (e: any) {
            console.warn("[Messenger] sendDM failed:", e);
        }
    }

    public destroy() {
        this.overlay.remove();
    }
}
