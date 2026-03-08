export interface PortalData {
    title: string;
    description: string;
    linkUrl: string;
    linkLabel: string;
}

export class PortalPanel {
    private container: HTMLDivElement;
    private header: HTMLDivElement;
    private contentWrap: HTMLDivElement;

    // Drag state
    private isDragging = false;
    private dragStartX = 0;
    private dragStartY = 0;
    private initialLeft = 0;
    private initialTop = 0;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'portal-panel';

        this.container.style.cssText = `
            position: absolute;
            display: none;
            width: 280px;
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

        this.setupDragging();

        this.container.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
        });

        document.addEventListener('pointerdown', (e) => {
            if (this.container.style.display !== 'none' && !this.container.contains(e.target as Node)) {
                this.hide();
            }
        });
    }

    private setupDragging() {
        this.header.addEventListener('pointerdown', (e) => {
            if ((e.target as HTMLElement).textContent === '\u2716') return;

            this.isDragging = true;
            this.header.style.cursor = 'grabbing';
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;

            const rect = this.container.getBoundingClientRect();
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

    public show(screenX: number, screenY: number, data: PortalData): void {
        this.renderCard(data);
        this.container.style.display = 'flex';
        this.positionCard(screenX, screenY);
    }

    public hide(): void {
        this.container.style.display = 'none';
    }

    public destroy(): void {
        this.container.remove();
    }

    private renderCard(data: PortalData): void {
        // Header
        this.header.textContent = '';

        const leftGroup = document.createElement('div');
        leftGroup.style.cssText = 'display: flex; align-items: center; gap: 10px;';

        const portalBadge = document.createElement('div');
        portalBadge.style.cssText = `
            padding: 2px 8px;
            background: #ec4899;
            color: white;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.5px;
        `;
        portalBadge.textContent = 'PORTAL';

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
        titleText.textContent = data.title;

        leftGroup.appendChild(portalBadge);
        leftGroup.appendChild(titleText);

        const closeBtn = document.createElement('div');
        closeBtn.textContent = '\u2716';
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

        // Content
        while (this.contentWrap.firstChild) {
            this.contentWrap.removeChild(this.contentWrap.firstChild);
        }

        // Description
        const descWrap = document.createElement('div');
        descWrap.style.cssText = 'padding: 16px;';

        const descText = document.createElement('div');
        descText.style.cssText = `
            color: #64748b;
            font-size: 13px;
            line-height: 1.5;
            text-align: center;
            margin-bottom: 16px;
        `;
        descText.textContent = data.description;
        descWrap.appendChild(descText);

        // Link button
        const linkBtn = document.createElement('a');
        linkBtn.href = data.linkUrl;
        linkBtn.target = '_blank';
        linkBtn.rel = 'noopener';
        linkBtn.textContent = data.linkLabel;
        linkBtn.style.cssText = `
            display: block;
            width: 100%;
            box-sizing: border-box;
            padding: 10px 16px;
            background: #7c3aed;
            color: white;
            border: none;
            border-radius: 8px;
            font-family: 'Outfit', Arial, sans-serif;
            font-size: 14px;
            font-weight: 700;
            text-align: center;
            text-decoration: none;
            cursor: pointer;
            transition: background 0.15s;
        `;
        linkBtn.addEventListener('mouseenter', () => { linkBtn.style.background = '#6d28d9'; });
        linkBtn.addEventListener('mouseleave', () => { linkBtn.style.background = '#7c3aed'; });
        linkBtn.addEventListener('click', (e) => { e.stopPropagation(); });
        descWrap.appendChild(linkBtn);

        this.contentWrap.appendChild(descWrap);
    }

    private positionCard(screenX: number, screenY: number): void {
        if (screenX === 0 && screenY === 0) {
            this.container.style.left = '50%';
            this.container.style.top = '50%';
            this.container.style.transform = 'translate(-50%, -50%)';
            return;
        }

        this.container.style.transform = 'none';

        const rect = this.container.getBoundingClientRect();
        const width = rect.width || 280;
        const height = rect.height || 200;

        let x = screenX;
        let y = screenY;

        if (x + width > window.innerWidth) x = window.innerWidth - width - 10;
        if (y + height > window.innerHeight) y = window.innerHeight - height - 10;

        this.container.style.left = `${Math.max(10, x)}px`;
        this.container.style.top = `${Math.max(10, y)}px`;
    }
}
