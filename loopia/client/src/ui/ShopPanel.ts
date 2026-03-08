import { ShopService, ShopItem } from "../services/ShopService";
import { WalletService } from "../services/WalletService";

export class ShopPanel {
    private static instance: ShopPanel | null = null;
    private overlay: HTMLDivElement;
    private panel: HTMLDivElement;
    private gridContainer!: HTMLDivElement;
    private balanceText!: HTMLSpanElement;
    private escHandler: (e: KeyboardEvent) => void;

    private constructor() {
        this.overlay = document.createElement("div");
        this.panel = document.createElement("div");
        this.escHandler = (e: KeyboardEvent) => {
            if (e.key === "Escape") this.close();
        };
        this.createUI();
        this.loadData();
    }

    public static toggle(): void {
        if (ShopPanel.instance) {
            ShopPanel.instance.close();
        } else {
            ShopPanel.instance = new ShopPanel();
        }
    }

    public static show(): void {
        if (!ShopPanel.instance) {
            ShopPanel.instance = new ShopPanel();
        }
    }

    public static hide(): void {
        if (ShopPanel.instance) {
            ShopPanel.instance.close();
        }
    }

    private async loadData() {
        // Fetch wallet info, items, and inventory in parallel
        await Promise.all([
            WalletService.getInstance().fetchWalletInfo(),
            ShopService.getInstance().fetchItems(),
            ShopService.getInstance().fetchInventory(),
        ]);

        this.updateBalance();
        this.renderItems();
    }

    private updateBalance() {
        const ws = WalletService.getInstance();
        if (ws.hasWallet()) {
            const bal = parseFloat(ws.getBalance());
            this.balanceText.textContent = `${bal.toFixed(4)} AVAX`;
        } else {
            this.balanceText.textContent = "No wallet";
            this.balanceText.style.color = "#f87171";
        }
    }

    private createUI(): void {
        // Overlay backdrop
        this.overlay.style.cssText = `
            position: fixed; inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 3000;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Outfit', sans-serif;
        `;
        this.overlay.onclick = (e) => {
            if (e.target === this.overlay) this.close();
        };

        // Panel
        this.panel.style.cssText = `
            background: #1e1e26;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            width: 480px; max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
            color: #e0e0e8;
        `;

        // Header
        const header = document.createElement("div");
        header.style.cssText = `
            display: flex; align-items: center; justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        `;

        const title = document.createElement("span");
        title.textContent = "\u{1F6D2} AVAX Item Shop";
        title.style.cssText = `font-size: 16px; font-weight: 700; color: #a5b4fc;`;

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "\u00D7";
        closeBtn.style.cssText = `
            background: none; border: none; color: #808090; font-size: 22px;
            cursor: pointer; padding: 0 4px; line-height: 1;
        `;
        closeBtn.onclick = () => this.close();

        header.appendChild(title);
        header.appendChild(closeBtn);
        this.panel.appendChild(header);

        // Balance bar
        const balanceBar = document.createElement("div");
        balanceBar.style.cssText = `
            display: flex; align-items: center; justify-content: space-between;
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.03);
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        `;

        const balLabel = document.createElement("span");
        balLabel.textContent = "Your Balance:";
        balLabel.style.cssText = `font-size: 13px; color: #808090;`;

        this.balanceText = document.createElement("span");
        this.balanceText.textContent = "Loading...";
        this.balanceText.style.cssText = `font-size: 14px; font-weight: 600; color: #34d399;`;

        balanceBar.appendChild(balLabel);
        balanceBar.appendChild(this.balanceText);
        this.panel.appendChild(balanceBar);

        // Grid container
        this.gridContainer = document.createElement("div");
        this.gridContainer.style.cssText = `
            padding: 16px 20px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        `;

        // Loading state
        const loading = document.createElement("div");
        loading.textContent = "Loading items...";
        loading.style.cssText = `
            grid-column: 1 / -1; text-align: center;
            color: #808090; font-size: 14px; padding: 20px;
        `;
        this.gridContainer.appendChild(loading);

        this.panel.appendChild(this.gridContainer);
        this.overlay.appendChild(this.panel);
        document.body.appendChild(this.overlay);
        document.addEventListener("keydown", this.escHandler);
    }

    private clearGrid() {
        while (this.gridContainer.firstChild) {
            this.gridContainer.removeChild(this.gridContainer.firstChild);
        }
    }

    private renderItems() {
        this.clearGrid();
        const items = ShopService.getInstance().getItems();

        if (items.length === 0) {
            const empty = document.createElement("div");
            empty.textContent = "No items available.";
            empty.style.cssText = `
                grid-column: 1 / -1; text-align: center;
                color: #808090; font-size: 14px; padding: 20px;
            `;
            this.gridContainer.appendChild(empty);
            return;
        }

        items.forEach(item => {
            this.gridContainer.appendChild(this.createItemCard(item));
        });
    }

    private createItemCard(item: ShopItem): HTMLDivElement {
        const card = document.createElement("div");
        const owned = ShopService.getInstance().ownsItem(item.id);

        card.style.cssText = `
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            padding: 14px;
            display: flex; flex-direction: column; align-items: center;
            gap: 6px;
            transition: border-color 0.2s;
        `;

        if (!owned) {
            card.onmouseover = () => { card.style.borderColor = "rgba(99, 102, 241, 0.4)"; };
            card.onmouseout = () => { card.style.borderColor = "rgba(255, 255, 255, 0.08)"; };
        }

        // Emoji icon
        const icon = document.createElement("div");
        icon.textContent = item.iconEmoji;
        icon.style.cssText = `font-size: 32px; line-height: 1;`;

        // Name
        const name = document.createElement("div");
        name.textContent = item.name;
        name.style.cssText = `font-size: 13px; font-weight: 600; color: #e0e0e8; text-align: center;`;

        // Description
        const desc = document.createElement("div");
        desc.textContent = item.description;
        desc.style.cssText = `font-size: 11px; color: #808090; text-align: center; line-height: 1.3;`;

        // Price
        const price = document.createElement("div");
        price.textContent = `${item.priceAvax} AVAX`;
        price.style.cssText = `font-size: 12px; font-weight: 600; color: #f59e0b; margin-top: 2px;`;

        card.appendChild(icon);
        card.appendChild(name);
        card.appendChild(desc);
        card.appendChild(price);

        if (owned) {
            const badge = document.createElement("div");
            badge.textContent = "\u2705 Owned";
            badge.style.cssText = `
                font-size: 11px; font-weight: 600; color: #34d399;
                background: rgba(52, 211, 153, 0.1);
                padding: 4px 12px; border-radius: 6px; margin-top: 4px;
            `;
            card.appendChild(badge);
        } else {
            const buyBtn = document.createElement("button");
            buyBtn.textContent = "Buy";
            buyBtn.style.cssText = `
                background: #6366f1; border: none; border-radius: 6px;
                color: #fff; font-size: 12px; font-weight: 600;
                padding: 6px 20px; cursor: pointer; margin-top: 4px;
                font-family: 'Outfit', sans-serif; transition: all 0.2s;
                width: 100%;
            `;
            buyBtn.onmouseover = () => { buyBtn.style.opacity = "0.85"; };
            buyBtn.onmouseout = () => { buyBtn.style.opacity = "1"; };
            buyBtn.onclick = () => this.handlePurchase(item, buyBtn);
            card.appendChild(buyBtn);
        }

        return card;
    }

    private async handlePurchase(item: ShopItem, btn: HTMLButtonElement) {
        const ws = WalletService.getInstance();
        if (!ws.hasWallet()) {
            alert("You need to create a wallet first. Go to Settings.");
            return;
        }

        const confirmed = confirm(
            `Buy "${item.name}" for ${item.priceAvax} AVAX?\n\nThis will send a real transaction on Avalanche Fuji testnet.`
        );
        if (!confirmed) return;

        btn.textContent = "Buying...";
        btn.style.opacity = "0.6";
        btn.disabled = true;

        try {
            const result = await ShopService.getInstance().purchaseItem(item.id);

            // Refresh inventory and balance
            await Promise.all([
                ShopService.getInstance().fetchInventory(),
                WalletService.getInstance().fetchWalletInfo(),
            ]);

            this.updateBalance();
            this.renderItems();

            // Show success with Snowtrace link
            const viewTx = confirm(
                `${item.iconEmoji} "${item.name}" purchased!\n\nTx: ${result.txHash.slice(0, 10)}...\n\nView on Snowtrace?`
            );
            if (viewTx) {
                window.open(result.snowtraceUrl, "_blank");
            }
        } catch (e: any) {
            alert(e.message || "Purchase failed");
            btn.textContent = "Buy";
            btn.style.opacity = "1";
            btn.disabled = false;
        }
    }

    private close(): void {
        document.removeEventListener("keydown", this.escHandler);
        this.overlay.remove();
        ShopPanel.instance = null;
    }

    public static destroy(): void {
        if (ShopPanel.instance) {
            ShopPanel.instance.close();
        }
    }
}
