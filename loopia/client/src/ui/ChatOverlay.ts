import { convertShortcodes } from '../data/emojis';
import { EmojiPicker } from './EmojiPicker';

export class ChatOverlay {
    private container!: HTMLDivElement;
    private input!: HTMLInputElement;
    private emojiPicker!: EmojiPicker;
    private onSend: (msg: string) => void;
    private styleEl?: HTMLStyleElement;
    private resizeHandler?: () => void;
    private resizeObserver?: ResizeObserver;
    private scene?: Phaser.Scene;

    // Whisper state
    private whisperTargetSessionId: string | null = null;
    private whisperTargetGuestId: number | null = null;

    /** Called when user sends a same-room whisper */
    public onWhisperSend?: (targetSessionId: string, message: string) => void;
    /** Called when user sends a cross-room whisper */
    public onCrossRoomWhisperSend?: (targetGuestId: number, message: string) => void;

    constructor(onSend: (msg: string) => void) {
        this.onSend = onSend;
        this.createMessageContainer();
    }

    /** Wire the input & emoji button from BottomMenu */
    public attachToBottomMenu(input: HTMLInputElement, emojiBtn: HTMLButtonElement, scene: Phaser.Scene) {
        this.input = input;
        this.scene = scene;

        // Wire input events
        this.input.addEventListener('focus', () => {
            this.container.style.pointerEvents = 'auto';
        });

        this.input.addEventListener('blur', () => {
            // Restore border unless in whisper mode
            if (!this.whisperTargetSessionId && !this.whisperTargetGuestId) {
                this.input.style.borderColor = '#4a3870';
            }
            this.container.style.pointerEvents = 'none';
        });

        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearWhisperMode();
                this.input.blur();
                e.stopPropagation();
                return;
            }
            if (e.key === 'Enter' && this.input.value.trim()) {
                const msg = convertShortcodes(this.input.value.trim());
                if (this.whisperTargetSessionId && this.onWhisperSend) {
                    this.onWhisperSend(this.whisperTargetSessionId, msg);
                    this.clearWhisperMode();
                } else if (this.whisperTargetGuestId && this.onCrossRoomWhisperSend) {
                    this.onCrossRoomWhisperSend(this.whisperTargetGuestId, msg);
                    this.clearWhisperMode();
                } else {
                    this.onSend(msg);
                }
                this.input.value = '';
                this.input.blur();
            }
            e.stopPropagation();
        });

        // Wire emoji button
        this.emojiPicker = new EmojiPicker();
        this.emojiPicker.setAnchor(emojiBtn);
        this.emojiPicker.onEmojiSelect = (emoji) => {
            this.insertEmojiAtCursor(emoji);
        };
        emojiBtn.addEventListener('click', () => {
            this.emojiPicker.toggle();
        });

        // Position message container relative to canvas
        this.resizeHandler = () => this.repositionContainer();
        this.repositionContainer();
        window.addEventListener('resize', this.resizeHandler);

        const canvas = scene.game.canvas;
        if (canvas.parentElement) {
            this.resizeObserver = new ResizeObserver(() => this.repositionContainer());
            this.resizeObserver.observe(canvas.parentElement);
        }
    }

    private createMessageContainer() {
        // Remove stale
        document.getElementById('chat-container')?.remove();

        this.container = document.createElement('div');
        this.container.id = 'chat-container';
        this.container.style.cssText = `
            position: absolute;
            width: 380px;
            height: 140px;
            padding: 8px 10px;
            overflow-y: auto;
            font-family: 'Outfit', Arial, sans-serif;
            font-size: 13px;
            scrollbar-width: none;
            pointer-events: none;
            z-index: 1999;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
        `;

        this.styleEl = document.createElement('style');
        this.styleEl.textContent = `
            #chat-container::-webkit-scrollbar { display: none; }
        `;
        document.head.appendChild(this.styleEl);
        document.body.appendChild(this.container);
    }

    private repositionContainer() {
        if (!this.scene) return;
        const canvas = this.scene.game.canvas;
        const rect = canvas.getBoundingClientRect();
        // Position: left-aligned within canvas, just above the 60px bottom menu
        this.container.style.left = `${rect.left + 6}px`;
        this.container.style.top = `${rect.bottom - 60 - 140 - 8}px`;
    }

    private insertEmojiAtCursor(emoji: string) {
        if (!this.input) return;
        const start = this.input.selectionStart ?? this.input.value.length;
        const end = this.input.selectionEnd ?? start;
        const text = this.input.value;
        this.input.value = text.substring(0, start) + emoji + text.substring(end);
        const newPos = start + emoji.length;
        this.input.setSelectionRange(newPos, newPos);
        this.input.focus();
    }

    public addMessage(sender: string, message: string, isSystem: boolean) {
        const msgWrap = document.createElement('div');
        msgWrap.style.cssText = `
            margin-bottom: 3px;
            padding: 1px 4px;
            word-wrap: break-word;
            line-height: 1.3;
            animation: fadeIn 0.2s ease-out;
        `;

        const senderSpan = document.createElement('span');
        senderSpan.style.cssText = `
            font-weight: 800;
            color: ${isSystem ? '#22c55e' : '#facc15'};
            text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 1px 2px rgba(0,0,0,0.5);
            margin-right: 4px;
        `;
        senderSpan.textContent = sender + ':';

        const messageSpan = document.createElement('span');
        messageSpan.style.cssText = `
            color: ${isSystem ? '#dcfce7' : '#ffffff'};
            font-weight: 600;
            text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 1px 2px rgba(0,0,0,0.5);
        `;
        messageSpan.textContent = convertShortcodes(message);

        msgWrap.appendChild(senderSpan);
        msgWrap.appendChild(messageSpan);
        this.container.appendChild(msgWrap);

        // Keep only last 50 messages to prevent DOM bloat
        while (this.container.children.length > 50) {
            this.container.removeChild(this.container.firstChild!);
        }

        // Auto scroll
        this.container.scrollTop = this.container.scrollHeight;
    }

    public clear() {
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
    }

    public getInputElement(): HTMLInputElement {
        return this.input;
    }

    public setVisible(visible: boolean) {
        this.container.style.display = visible ? 'flex' : 'none';
        if (!visible && this.emojiPicker) this.emojiPicker.hide();
    }

    public destroy() {
        if (this.emojiPicker) this.emojiPicker.destroy();
        if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
        this.resizeObserver?.disconnect();
        this.container.remove();
        this.styleEl?.remove();
    }

    /** Enter whisper mode for a same-room target */
    public setWhisperMode(targetName: string, targetSessionId: string) {
        this.whisperTargetSessionId = targetSessionId;
        this.whisperTargetGuestId = null;
        if (this.input) {
            this.input.placeholder = `Whisper to ${targetName}... (Esc)`;
            this.input.style.borderColor = '#a855f7';
            this.input.focus();
        }
    }

    /** Enter whisper mode for a cross-room target */
    public setWhisperModeCrossRoom(targetGuestId: number, targetName: string) {
        this.whisperTargetSessionId = null;
        this.whisperTargetGuestId = targetGuestId;
        if (this.input) {
            this.input.placeholder = `Message to ${targetName}... (Esc)`;
            this.input.style.borderColor = '#a855f7';
            this.input.focus();
        }
    }

    /** Return to normal chat mode */
    public clearWhisperMode() {
        this.whisperTargetSessionId = null;
        this.whisperTargetGuestId = null;
        if (this.input) {
            this.input.placeholder = 'Type a message... (Enter)';
            this.input.style.borderColor = '#4a3870';
        }
    }

    /** Add a whisper message to the chat overlay */
    public addWhisper(name: string, message: string, direction: 'sent' | 'received') {
        const msgWrap = document.createElement('div');
        msgWrap.style.cssText = `
            margin-bottom: 3px;
            padding: 1px 4px;
            word-wrap: break-word;
            line-height: 1.3;
            animation: fadeIn 0.2s ease-out;
        `;

        const prefix = direction === 'sent' ? `[To ${name}]` : `[From ${name}]`;

        const senderSpan = document.createElement('span');
        senderSpan.style.cssText = `
            font-weight: 800;
            color: #c084fc;
            text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 1px 2px rgba(0,0,0,0.5);
            margin-right: 4px;
        `;
        senderSpan.textContent = prefix;

        const messageSpan = document.createElement('span');
        messageSpan.style.cssText = `
            color: #e9d5ff;
            font-weight: 600;
            text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 1px 2px rgba(0,0,0,0.5);
        `;
        messageSpan.textContent = convertShortcodes(message);

        msgWrap.appendChild(senderSpan);
        msgWrap.appendChild(messageSpan);
        this.container.appendChild(msgWrap);

        while (this.container.children.length > 50) {
            this.container.removeChild(this.container.firstChild!);
        }

        this.container.scrollTop = this.container.scrollHeight;
    }
}
