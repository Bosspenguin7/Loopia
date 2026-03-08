import { CafeShopService, CafeItem } from "../services/CafeShopService";
import { EconomyService } from "../services/EconomyService";

export class CafeMenuPanel {
    private container: HTMLDivElement;
    private header: HTMLDivElement;
    private contentWrap: HTMLDivElement;
    private balanceText!: HTMLSpanElement;
    private itemsWrap!: HTMLDivElement;

    // Drag state
    private isDragging = false;
    private dragStartX = 0;
    private dragStartY = 0;
    private initialLeft = 0;
    private initialTop = 0;

    private outsideClickHandler: (e: PointerEvent) => void;
    private balance = 0;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'cafe-menu-panel';

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
        this.contentWrap.style.cssText = `max-height: 400px; overflow-y: auto;`;
        this.container.appendChild(this.header);
        this.container.appendChild(this.contentWrap);

        this.setupDragging();

        // Block game input
        this.container.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
        });

        // Close on outside click
        this.outsideClickHandler = (e: PointerEvent) => {
            if (this.container.style.display !== 'none' && !this.container.contains(e.target as Node)) {
                this.hide();
            }
        };
        document.addEventListener('pointerdown', this.outsideClickHandler);
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

    public async show(screenX: number, screenY: number, npcName: string): Promise<void> {
        this.renderHeader(npcName);
        this.container.style.display = 'flex';
        this.positionCard(screenX, screenY);

        const svc = CafeShopService.getInstance();

        if (svc.isPreloaded()) {
            // Data ready — render instantly
            this.balance = svc.getCachedBalance();
            this.renderContent();
        } else {
            // Fallback: show loading and fetch
            this.renderLoading();
            await svc.preload();
            this.balance = svc.getCachedBalance();
            this.renderContent();
        }
    }

    public hide(): void {
        this.container.style.display = 'none';
    }

    public destroy(): void {
        document.removeEventListener('pointerdown', this.outsideClickHandler);
        this.container.remove();
    }

    private renderHeader(npcName: string): void {
        this.header.textContent = '';

        const leftGroup = document.createElement('div');
        leftGroup.style.cssText = 'display: flex; align-items: center; gap: 8px;';

        const menuBadge = document.createElement('div');
        menuBadge.style.cssText = `
            padding: 2px 8px;
            background: #f59e0b;
            color: white;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.5px;
        `;
        menuBadge.textContent = 'MENU';

        const titleText = document.createElement('div');
        titleText.style.cssText = `
            font-weight: 800;
            font-size: 15px;
            color: #0f172a;
            max-width: 160px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;
        titleText.textContent = npcName;

        leftGroup.appendChild(menuBadge);
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
    }

    private renderLoading(): void {
        this.contentWrap.textContent = '';
        const loading = document.createElement('div');
        loading.textContent = 'Loading menu...';
        loading.style.cssText = `
            padding: 24px;
            text-align: center;
            color: #94a3b8;
            font-size: 13px;
        `;
        this.contentWrap.appendChild(loading);
    }

    private renderContent(): void {
        this.contentWrap.textContent = '';
        const svc = CafeShopService.getInstance();

        // Balance bar
        const balanceBar = document.createElement('div');
        balanceBar.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 16px;
            background: #fefce8;
            border-bottom: 1px solid #fde68a;
        `;

        const balLabel = document.createElement('span');
        balLabel.textContent = 'Your Loopi:';
        balLabel.style.cssText = 'font-size: 12px; color: #92400e; font-weight: 600;';

        this.balanceText = document.createElement('span');
        this.balanceText.textContent = `${this.balance} Loopi`;
        this.balanceText.style.cssText = 'font-size: 13px; font-weight: 700; color: #d97706;';

        balanceBar.appendChild(balLabel);
        balanceBar.appendChild(this.balanceText);
        this.contentWrap.appendChild(balanceBar);

        // Items list
        this.itemsWrap = document.createElement('div');
        this.itemsWrap.style.cssText = 'padding: 8px 0;';
        this.contentWrap.appendChild(this.itemsWrap);

        const items = svc.getItems();
        if (items.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'No items available.';
            empty.style.cssText = 'padding: 24px; text-align: center; color: #94a3b8; font-size: 13px;';
            this.itemsWrap.appendChild(empty);
            return;
        }

        items.forEach(item => {
            this.itemsWrap.appendChild(this.createItemRow(item));
        });
    }

    private createItemRow(item: CafeItem): HTMLDivElement {
        const svc = CafeShopService.getInstance();
        const qty = svc.getOwnedQuantity(item.id);

        const row = document.createElement('div');
        row.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 16px;
            border-bottom: 1px solid #f1f5f9;
            transition: background 0.15s;
        `;
        row.addEventListener('mouseenter', () => { row.style.background = '#f8fafc'; });
        row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });

        // Icon
        const icon = document.createElement('div');
        icon.textContent = item.iconEmoji;
        icon.style.cssText = 'font-size: 28px; line-height: 1; flex-shrink: 0;';

        // Info column
        const info = document.createElement('div');
        info.style.cssText = 'flex: 1; min-width: 0;';

        const name = document.createElement('div');
        name.textContent = item.name;
        name.style.cssText = 'font-weight: 700; font-size: 13px; color: #0f172a;';

        const price = document.createElement('div');
        price.textContent = `${item.priceLoopi} Loopi`;
        price.style.cssText = 'font-size: 11px; color: #d97706; font-weight: 600; margin-top: 2px;';

        info.appendChild(name);
        info.appendChild(price);

        // Quantity badge (if owned)
        const qtyBadge = document.createElement('div');
        if (qty > 0) {
            qtyBadge.textContent = `x${qty}`;
            qtyBadge.style.cssText = `
                font-size: 11px; font-weight: 700; color: #059669;
                background: #ecfdf5;
                padding: 2px 8px;
                border-radius: 10px;
                flex-shrink: 0;
            `;
        }

        // Buttons
        const btnGroup = document.createElement('div');
        btnGroup.style.cssText = 'display: flex; gap: 6px; flex-shrink: 0;';

        const buyBtn = this.createButton('Buy', '#6366f1', () => this.handlePurchase(item, buyBtn));

        btnGroup.appendChild(buyBtn);

        if (qty > 0) {
            const useBtn = this.createButton('Use', '#059669', () => this.handleConsume(item, useBtn));
            btnGroup.appendChild(useBtn);
        }

        row.appendChild(icon);
        row.appendChild(info);
        if (qty > 0) row.appendChild(qtyBadge);
        row.appendChild(btnGroup);

        return row;
    }

    private createButton(text: string, bgColor: string, onClick: () => void): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            background: ${bgColor};
            border: none;
            border-radius: 6px;
            color: #fff;
            font-size: 11px;
            font-weight: 700;
            padding: 5px 12px;
            cursor: pointer;
            font-family: 'Outfit', sans-serif;
            transition: opacity 0.15s;
            white-space: nowrap;
        `;
        btn.addEventListener('mouseenter', () => { btn.style.opacity = '0.85'; });
        btn.addEventListener('mouseleave', () => { btn.style.opacity = '1'; });
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick();
        });
        return btn;
    }

    private async handlePurchase(item: CafeItem, btn: HTMLButtonElement) {
        if (this.balance < item.priceLoopi) {
            this.showToast('Not enough Loopi!', '#ef4444');
            return;
        }

        btn.textContent = '...';
        btn.style.opacity = '0.6';
        (btn as any).disabled = true;

        try {
            const svc = CafeShopService.getInstance();
            const result = await svc.purchaseItem(item.id);
            this.balance = result.newBalance;
            svc.setCachedBalance(result.newBalance);
            // Update the CurrencyBar in real-time
            EconomyService.getInstance().updateBalance({ loopi: result.newBalance });
            this.showToast(`Bought ${item.iconEmoji} ${item.name}!`, '#059669');

            // Refresh inventory and re-render
            await svc.fetchInventory();
            this.renderContent();
        } catch (e: any) {
            this.showToast(e.message || 'Purchase failed', '#ef4444');
            btn.textContent = 'Buy';
            btn.style.opacity = '1';
            (btn as any).disabled = false;
        }
    }

    private async handleConsume(item: CafeItem, btn: HTMLButtonElement) {
        btn.textContent = '...';
        btn.style.opacity = '0.6';
        (btn as any).disabled = true;

        try {
            await CafeShopService.getInstance().consumeItem(item.id);
            this.showToast(`Used ${item.iconEmoji} ${item.name}!`, '#6366f1');

            // Refresh inventory and re-render
            await CafeShopService.getInstance().fetchInventory();
            this.renderContent();
        } catch (e: any) {
            this.showToast(e.message || 'Use failed', '#ef4444');
            btn.textContent = 'Use';
            btn.style.opacity = '1';
            (btn as any).disabled = false;
        }
    }

    private showToast(message: string, color: string) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${color};
            color: white;
            padding: 8px 20px;
            border-radius: 8px;
            font-family: 'Outfit', sans-serif;
            font-size: 13px;
            font-weight: 600;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: opacity 0.3s;
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    private positionCard(screenX: number, screenY: number): void {
        this.container.style.transform = 'none';

        const rect = this.container.getBoundingClientRect();
        const width = rect.width || 300;
        const height = rect.height || 300;

        let x = screenX;
        let y = screenY;

        if (x + width > window.innerWidth) x = window.innerWidth - width - 10;
        if (y + height > window.innerHeight) y = window.innerHeight - height - 10;

        this.container.style.left = `${Math.max(10, x)}px`;
        this.container.style.top = `${Math.max(10, y)}px`;
    }
}
