import { ShopService, InventoryEntry } from "../services/ShopService";
import { CafeShopService } from "../services/CafeShopService";
import { QuestService, FishInventoryItem } from "../services/QuestService";

export class InventoryPanel {
    private static instance: InventoryPanel | null = null;
    private overlay: HTMLDivElement;
    private panel: HTMLDivElement;
    private gridContainer!: HTMLDivElement;
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
        if (InventoryPanel.instance) {
            InventoryPanel.instance.close();
        } else {
            InventoryPanel.instance = new InventoryPanel();
        }
    }

    public static show(): void {
        if (!InventoryPanel.instance) {
            InventoryPanel.instance = new InventoryPanel();
        }
    }

    public static hide(): void {
        if (InventoryPanel.instance) {
            InventoryPanel.instance.close();
        }
    }

    private async loadData() {
        await Promise.all([
            ShopService.getInstance().fetchInventory(),
            CafeShopService.getInstance().fetchInventory(),
            QuestService.getInstance().fetchFishInventory(),
        ]);
        this.renderItems();
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
            width: 440px; max-height: 80vh;
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
        title.textContent = "\u{1F392} My Inventory";
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
        loading.textContent = "Loading inventory...";
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
        const shopInventory = ShopService.getInstance().getInventoryItems();
        const cafeInventory = CafeShopService.getInstance().getInventoryItems();
        const fishInventory = QuestService.getInstance().getFishItems();

        // Merge both inventories into a unified list
        const allEntries: InventoryEntry[] = [
            ...shopInventory,
            ...cafeInventory.map(ci => ({
                id: ci.id,
                guestId: ci.guestId,
                itemId: ci.itemId,
                quantity: ci.quantity,
                item: ci.item,
            })),
        ];

        // Quest items (fish)
        const questCards = fishInventory
            .filter(f => f.quantity > 0)
            .map(f => this.createQuestItemCard(f));

        if (allEntries.length === 0 && questCards.length === 0) {
            const empty = document.createElement("div");
            empty.style.cssText = `
                grid-column: 1 / -1; text-align: center;
                color: #808090; font-size: 14px; padding: 30px 20px;
            `;
            empty.textContent = "Your inventory is empty. Visit the shop!";
            this.gridContainer.appendChild(empty);
            return;
        }

        // Render quest items first
        questCards.forEach(card => this.gridContainer.appendChild(card));

        // Render shop/cafe items
        allEntries.forEach(entry => {
            this.gridContainer.appendChild(this.createInventoryCard(entry));
        });
    }

    private static readonly FISH_LABELS: Record<string, { emoji: string; name: string }> = {
        salmon: { emoji: "\u{1F41F}", name: "Salmon" },
    };

    private createQuestItemCard(fish: FishInventoryItem): HTMLDivElement {
        const card = document.createElement("div");
        card.style.cssText = `
            background: rgba(139, 92, 246, 0.06);
            border: 1px solid rgba(139, 92, 246, 0.25);
            border-radius: 10px;
            padding: 14px;
            display: flex; flex-direction: column; align-items: center;
            gap: 6px;
            position: relative;
        `;

        // Quest item badge
        const badge = document.createElement("div");
        badge.textContent = "QUEST";
        badge.style.cssText = `
            position: absolute; top: 8px; right: 8px;
            background: #8b5cf6; color: #fff;
            font-size: 9px; font-weight: 800; letter-spacing: 0.5px;
            padding: 2px 6px; border-radius: 4px;
        `;
        card.appendChild(badge);

        const info = InventoryPanel.FISH_LABELS[fish.fishType] || { emoji: "\u{1F41F}", name: fish.fishType };

        // Emoji icon
        const icon = document.createElement("div");
        icon.textContent = info.emoji;
        icon.style.cssText = `font-size: 32px; line-height: 1;`;

        // Name
        const name = document.createElement("div");
        name.textContent = info.name;
        name.style.cssText = `font-size: 13px; font-weight: 600; color: #e0e0e8; text-align: center;`;

        // Description
        const desc = document.createElement("div");
        desc.textContent = "Caught from the pool. Turn in to Secretsmo.";
        desc.style.cssText = `font-size: 11px; color: #808090; text-align: center; line-height: 1.3;`;

        // Quantity
        const qty = document.createElement("div");
        qty.textContent = `Qty: ${fish.quantity}`;
        qty.style.cssText = `
            font-size: 11px; font-weight: 600; color: #c4b5fd;
            background: rgba(139, 92, 246, 0.12);
            padding: 2px 10px; border-radius: 4px; margin-top: 2px;
        `;

        card.appendChild(icon);
        card.appendChild(name);
        card.appendChild(desc);
        card.appendChild(qty);

        return card;
    }

    private createInventoryCard(entry: InventoryEntry): HTMLDivElement {
        const card = document.createElement("div");
        card.style.cssText = `
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            padding: 14px;
            display: flex; flex-direction: column; align-items: center;
            gap: 6px;
        `;

        // Emoji icon
        const icon = document.createElement("div");
        icon.textContent = entry.item.iconEmoji;
        icon.style.cssText = `font-size: 32px; line-height: 1;`;

        // Name
        const name = document.createElement("div");
        name.textContent = entry.item.name;
        name.style.cssText = `font-size: 13px; font-weight: 600; color: #e0e0e8; text-align: center;`;

        // Description
        const desc = document.createElement("div");
        desc.textContent = entry.item.description;
        desc.style.cssText = `font-size: 11px; color: #808090; text-align: center; line-height: 1.3;`;

        // Quantity
        const qty = document.createElement("div");
        qty.textContent = `Qty: ${entry.quantity}`;
        qty.style.cssText = `
            font-size: 11px; font-weight: 600; color: #a5b4fc;
            background: rgba(99, 102, 241, 0.1);
            padding: 2px 10px; border-radius: 4px; margin-top: 2px;
        `;

        card.appendChild(icon);
        card.appendChild(name);
        card.appendChild(desc);
        card.appendChild(qty);

        // "Use" button for consumable items (cafe_food)
        if (entry.item.category === "cafe_food") {
            const useBtn = document.createElement("button");
            useBtn.textContent = "Use";
            useBtn.style.cssText = `
                background: #059669; border: none; border-radius: 6px;
                color: #fff; font-size: 11px; font-weight: 700;
                padding: 5px 16px; cursor: pointer; margin-top: 4px;
                font-family: 'Outfit', sans-serif; transition: opacity 0.15s;
                width: 100%;
            `;
            useBtn.onmouseover = () => { useBtn.style.opacity = "0.85"; };
            useBtn.onmouseout = () => { useBtn.style.opacity = "1"; };
            useBtn.onclick = () => this.handleConsume(entry, useBtn);
            card.appendChild(useBtn);
        }

        return card;
    }

    private async handleConsume(entry: InventoryEntry, btn: HTMLButtonElement) {
        btn.textContent = "...";
        btn.style.opacity = "0.6";
        btn.disabled = true;

        try {
            await CafeShopService.getInstance().consumeItem(entry.itemId);

            // Show toast
            this.showToast(`Used ${entry.item.iconEmoji} ${entry.item.name}!`);

            // Refresh and re-render
            await CafeShopService.getInstance().fetchInventory();
            await ShopService.getInstance().fetchInventory();
            this.renderItems();
        } catch (e: any) {
            this.showToast(e.message || "Use failed");
            btn.textContent = "Use";
            btn.style.opacity = "1";
            btn.disabled = false;
        }
    }

    private showToast(message: string) {
        const toast = document.createElement("div");
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #6366f1;
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
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    private close(): void {
        document.removeEventListener("keydown", this.escHandler);
        this.overlay.remove();
        InventoryPanel.instance = null;
    }

    public static destroy(): void {
        if (InventoryPanel.instance) {
            InventoryPanel.instance.close();
        }
    }
}
