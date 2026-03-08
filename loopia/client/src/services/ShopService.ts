import { GuestAuth } from "./GuestAuth";

export interface ShopItem {
    id: number;
    name: string;
    description: string;
    category: string;
    priceAvax: string;
    iconEmoji: string;
    isActive: boolean;
    sortOrder: number;
}

export interface InventoryEntry {
    id: number;
    guestId: number;
    itemId: number;
    quantity: number;
    item: ShopItem;
}

export interface PurchaseResult {
    txHash: string;
    snowtraceUrl: string;
    item: { id: number; name: string; iconEmoji: string };
}

export class ShopService {
    private static instance: ShopService;
    private items: ShopItem[] = [];
    private inventory: InventoryEntry[] = [];

    private constructor() {}

    public static getInstance(): ShopService {
        if (!ShopService.instance) {
            ShopService.instance = new ShopService();
        }
        return ShopService.instance;
    }

    private getApiBase(): string {
        const isProduction = window.location.hostname.includes("loopia.world");
        return isProduction ? "https://server.loopia.world" : "http://127.0.0.1:2567";
    }

    private getToken(): string {
        return GuestAuth.getInstance().getToken() || "";
    }

    public async fetchItems(): Promise<ShopItem[]> {
        try {
            const res = await fetch(
                `${this.getApiBase()}/api/shop/items?token=${encodeURIComponent(this.getToken())}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            this.items = await res.json();
            return this.items;
        } catch (e) {
            console.warn("[ShopService] fetchItems failed:", e);
            return this.items;
        }
    }

    public async fetchInventory(): Promise<InventoryEntry[]> {
        try {
            const res = await fetch(
                `${this.getApiBase()}/api/shop/inventory?token=${encodeURIComponent(this.getToken())}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            this.inventory = await res.json();
            return this.inventory;
        } catch (e) {
            console.warn("[ShopService] fetchInventory failed:", e);
            return this.inventory;
        }
    }

    public async purchaseItem(itemId: number): Promise<PurchaseResult> {
        const res = await fetch(`${this.getApiBase()}/api/shop/purchase`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: this.getToken(), itemId }),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Purchase failed");
        }

        return data;
    }

    public async withdraw(toAddress: string, amount: string): Promise<{ txHash: string; snowtraceUrl: string }> {
        const res = await fetch(`${this.getApiBase()}/api/wallet/withdraw`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: this.getToken(), toAddress, amount }),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Withdraw failed");
        }

        return data;
    }

    public getItems(): ShopItem[] {
        return this.items;
    }

    public getInventoryItems(): InventoryEntry[] {
        return this.inventory;
    }

    public ownsItem(itemId: number): boolean {
        return this.inventory.some(inv => inv.itemId === itemId);
    }
}
