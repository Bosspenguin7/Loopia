import { EMOJI_CATEGORIES } from '../data/emojis';

export class EmojiPicker {
    private overlay: HTMLDivElement;
    private header: HTMLDivElement;
    private tabBar: HTMLDivElement;
    private grid: HTMLDivElement;
    private visible = false;
    private activeCategory = 0;

    // Drag state
    private isDragging = false;
    private dragStartX = 0;
    private dragStartY = 0;
    private initialLeft = 0;
    private initialTop = 0;

    // Outside-click handler
    private outsideClickHandler: (e: PointerEvent) => void;

    public onEmojiSelect?: (emoji: string) => void;
    private anchorEl?: HTMLElement;

    constructor() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'emoji-picker-panel';
        this.overlay.style.cssText = `
            position: absolute;
            width: 320px;
            background: #f1f5f9;
            border-radius: 12px;
            font-family: 'Outfit', Arial, sans-serif;
            color: #1e293b;
            z-index: 2000;
            display: none;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
            user-select: none;
        `;

        // Header (drag handle)
        this.header = document.createElement('div');
        this.header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            background: #ffffff;
            border-radius: 12px 12px 0 0;
            cursor: grab;
            border-bottom: 2px solid #e2e8f0;
        `;

        const titleText = document.createElement('span');
        titleText.style.cssText = `font-weight: 800; font-size: 14px; color: #0f172a;`;
        titleText.textContent = 'Emojis';

        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `
            background: none; border: none; font-size: 18px; cursor: pointer;
            color: #64748b; padding: 0 4px; line-height: 1;
        `;
        closeBtn.textContent = '✕';
        closeBtn.addEventListener('click', () => this.hide());

        this.header.appendChild(titleText);
        this.header.appendChild(closeBtn);

        // Drag logic
        this.header.addEventListener('pointerdown', (e) => {
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            const rect = this.overlay.getBoundingClientRect();
            this.initialLeft = rect.left;
            this.initialTop = rect.top;
            this.header.style.cursor = 'grabbing';
            e.preventDefault();
        });

        document.addEventListener('pointermove', (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.dragStartX;
            const dy = e.clientY - this.dragStartY;
            this.overlay.style.bottom = 'auto';
            this.overlay.style.left = (this.initialLeft + dx) + 'px';
            this.overlay.style.top = (this.initialTop + dy) + 'px';
        });

        document.addEventListener('pointerup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.header.style.cursor = 'grab';
            }
        });

        // Tab bar
        this.tabBar = document.createElement('div');
        this.tabBar.style.cssText = `
            display: flex;
            gap: 2px;
            padding: 6px 8px;
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            overflow-x: auto;
        `;
        this.buildTabs();

        // Emoji grid
        this.grid = document.createElement('div');
        this.grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 2px;
            padding: 8px;
            height: 200px;
            overflow-y: auto;
            background: #ffffff;
            border-radius: 0 0 12px 12px;
        `;

        // Event delegation for emoji clicks
        this.grid.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const emoji = target.dataset.emoji;
            if (emoji && this.onEmojiSelect) {
                this.onEmojiSelect(emoji);
            }
        });

        this.overlay.appendChild(this.header);
        this.overlay.appendChild(this.tabBar);
        this.overlay.appendChild(this.grid);

        // Prevent clicks inside picker from reaching the game canvas
        this.overlay.addEventListener('pointerdown', (e) => e.stopPropagation());
        this.overlay.addEventListener('mousedown', (e) => e.stopPropagation());

        document.body.appendChild(this.overlay);

        this.renderCategory(0);

        // Outside click handler
        this.outsideClickHandler = (e: PointerEvent) => {
            if (!this.visible) return;
            if (!this.overlay.contains(e.target as Node)) {
                this.hide();
            }
        };
        document.addEventListener('pointerdown', this.outsideClickHandler);
    }

    private buildTabs() {
        EMOJI_CATEGORIES.forEach((cat, i) => {
            const tab = document.createElement('button');
            tab.dataset.tabIndex = String(i);
            tab.textContent = cat.icon;
            tab.title = cat.name;
            tab.style.cssText = `
                flex-shrink: 0;
                width: 34px;
                height: 30px;
                border: none;
                border-radius: 6px;
                font-size: 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.15s;
                ${i === 0 ? 'background: #3b82f6; color: white;' : 'background: #f1f5f9; color: #1e293b;'}
            `;
            tab.addEventListener('click', () => {
                this.activeCategory = i;
                this.renderCategory(i);
                this.updateTabStyles();
            });
            this.tabBar.appendChild(tab);
        });
    }

    private updateTabStyles() {
        const tabs = this.tabBar.children;
        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i] as HTMLElement;
            if (i === this.activeCategory) {
                tab.style.background = '#3b82f6';
                tab.style.color = 'white';
            } else {
                tab.style.background = '#f1f5f9';
                tab.style.color = '#1e293b';
            }
        }
    }

    private renderCategory(index: number) {
        // Clear grid using DOM methods
        while (this.grid.firstChild) {
            this.grid.removeChild(this.grid.firstChild);
        }

        const emojis = EMOJI_CATEGORIES[index].emojis;
        for (const emoji of emojis) {
            const btn = document.createElement('button');
            btn.dataset.emoji = emoji;
            btn.textContent = emoji;
            btn.style.cssText = `
                width: 36px;
                height: 36px;
                border: none;
                background: transparent;
                border-radius: 6px;
                font-size: 22px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.1s, background 0.1s;
                padding: 0;
                line-height: 1;
            `;
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.15)';
                btn.style.background = '#e2e8f0';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
                btn.style.background = 'transparent';
            });
            this.grid.appendChild(btn);
        }
    }

    public toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /** Set the element the picker should appear above */
    public setAnchor(el: HTMLElement) {
        this.anchorEl = el;
    }

    public show() {
        this.visible = true;
        this.overlay.style.display = 'block';

        if (this.anchorEl) {
            const rect = this.anchorEl.getBoundingClientRect();
            this.overlay.style.bottom = 'auto';
            this.overlay.style.left = rect.left + 'px';
            this.overlay.style.top = (rect.top - this.overlay.offsetHeight - 8) + 'px';
        }
    }

    public hide() {
        this.visible = false;
        this.overlay.style.display = 'none';
    }

    public isVisible() {
        return this.visible;
    }

    public destroy() {
        document.removeEventListener('pointerdown', this.outsideClickHandler);
        this.overlay.remove();
    }
}
