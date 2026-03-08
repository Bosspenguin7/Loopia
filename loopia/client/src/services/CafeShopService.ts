import { GuestAuth } from "./GuestAuth";

export interface CafeItem {
    id: number;
    name: string;
    description: string;
    category: string;
    priceAvax: string;
    priceLoopi: number;
    iconEmoji: string;
    isActive: boolean;
    sortOrder: number;
}

export interface CafeInventoryEntry {
    id: number;
    guestId: number;
    itemId: number;
    quantity: number;
    item: CafeItem;
}

export class CafeShopService {
    private static instance: CafeShopService;
    private items: CafeItem[] = [];
    private inventory: CafeInventoryEntry[] = [];
    private cachedBalance = 0;

    private preloaded = false;

    private constructor() {}

    public static getInstance(): CafeShopService {
        if (!CafeShopService.instance) {
            CafeShopService.instance = new CafeShopService();
        }
        return CafeShopService.instance;
    }

    /** Call on scene enter to fetch items/inventory/balance in the background */
    public async preload(): Promise<void> {
        if (this.preloaded) return;
        await Promise.all([
            this.fetchCafeItems(),
            this.fetchInventory(),
            this.fetchBalance(),
        ]);
        this.preloaded = true;
    }

    public isPreloaded(): boolean {
        return this.preloaded;
    }

    /** Reset preload flag (call after purchase/consume to allow refresh) */
    public invalidate(): void {
        this.preloaded = false;
    }

    private getApiBase(): string {
        const isProduction = window.location.hostname.includes("loopia.world");
        return isProduction ? "https://server.loopia.world" : "http://127.0.0.1:2567";
    }

    private getToken(): string {
        return GuestAuth.getInstance().getToken() || "";
    }

    public async fetchCafeItems(): Promise<CafeItem[]> {
        try {
            const res = await fetch(
                `${this.getApiBase()}/api/cafe/items?token=${encodeURIComponent(this.getToken())}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            this.items = await res.json();
            return this.items;
        } catch (e) {
            console.warn("[CafeShopService] fetchCafeItems failed:", e);
            return this.items;
        }
    }

    public async fetchBalance(): Promise<number> {
        try {
            const res = await fetch(
                `${this.getApiBase()}/api/economy/balance?token=${encodeURIComponent(this.getToken())}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            this.cachedBalance = data.loopi ?? 0;
            return this.cachedBalance;
        } catch (e) {
            console.warn("[CafeShopService] fetchBalance failed:", e);
            return this.cachedBalance;
        }
    }

    public getCachedBalance(): number {
        return this.cachedBalance;
    }

    public setCachedBalance(val: number): void {
        this.cachedBalance = val;
    }

    public async fetchInventory(): Promise<CafeInventoryEntry[]> {
        try {
            const res = await fetch(
                `${this.getApiBase()}/api/cafe/inventory?token=${encodeURIComponent(this.getToken())}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            this.inventory = await res.json();
            return this.inventory;
        } catch (e) {
            console.warn("[CafeShopService] fetchInventory failed:", e);
            return this.inventory;
        }
    }

    public async purchaseItem(itemId: number): Promise<{ item: { id: number; name: string; iconEmoji: string }; newBalance: number }> {
        const res = await fetch(`${this.getApiBase()}/api/cafe/purchase`, {
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

    public async consumeItem(itemId: number): Promise<{ remaining: number }> {
        const res = await fetch(`${this.getApiBase()}/api/cafe/consume`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: this.getToken(), itemId }),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Consume failed");
        }
        return data;
    }

    public getItems(): CafeItem[] {
        return this.items;
    }

    public getInventoryItems(): CafeInventoryEntry[] {
        return this.inventory;
    }

    public getOwnedQuantity(itemId: number): number {
        const entry = this.inventory.find(inv => inv.itemId === itemId);
        return entry ? entry.quantity : 0;
    }
}
