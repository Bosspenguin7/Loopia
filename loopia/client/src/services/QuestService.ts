import { GuestAuth } from "./GuestAuth";

export interface Quest {
    id: number;
    questKey: string;
    name: string;
    description: string;
    npcName: string;
    sceneKey: string;
    questType: string;
    loopiReward: number;
    xpReward: number;
    requiresReview: boolean;
}

export interface QuestProgress {
    completedToday: boolean;
    currentStreak: number;
    longestStreak: number;
    badgeEarned: boolean;
    hasPendingSubmission: boolean;
    fishCount: number;
}

export interface FishInventoryItem {
    id: number;
    guestId: number;
    fishType: string;
    quantity: number;
}

export interface QuestWithProgress extends Quest {
    progress: QuestProgress;
}

export class QuestService {
    private static instance: QuestService;
    private fishInventory: FishInventoryItem[] = [];

    private constructor() {}

    public static getInstance(): QuestService {
        if (!QuestService.instance) {
            QuestService.instance = new QuestService();
        }
        return QuestService.instance;
    }

    private getApiBase(): string {
        const isProduction = window.location.hostname.includes("loopia.world");
        return isProduction ? "https://server.loopia.world" : "http://127.0.0.1:2567";
    }

    private getToken(): string {
        return GuestAuth.getInstance().getToken() || "";
    }

    public async fetchAllQuestsWithProgress(): Promise<QuestWithProgress[]> {
        try {
            const res = await fetch(
                `${this.getApiBase()}/api/quest/all-with-progress?token=${encodeURIComponent(this.getToken())}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn("[QuestService] fetchAllQuestsWithProgress failed:", e);
            return [];
        }
    }

    public async fetchQuestsForScene(sceneKey: string): Promise<Quest[]> {
        try {
            const res = await fetch(
                `${this.getApiBase()}/api/quest/available?sceneKey=${encodeURIComponent(sceneKey)}&token=${encodeURIComponent(this.getToken())}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn("[QuestService] fetchQuestsForScene failed:", e);
            return [];
        }
    }

    public async getQuestProgress(questId: number): Promise<QuestProgress | null> {
        try {
            const res = await fetch(
                `${this.getApiBase()}/api/quest/progress/${questId}?token=${encodeURIComponent(this.getToken())}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn("[QuestService] getQuestProgress failed:", e);
            return null;
        }
    }

    public async fetchFishInventory(): Promise<FishInventoryItem[]> {
        try {
            const res = await fetch(
                `${this.getApiBase()}/api/quest/fish-inventory?token=${encodeURIComponent(this.getToken())}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            this.fishInventory = await res.json();
            return this.fishInventory;
        } catch (e) {
            console.warn("[QuestService] fetchFishInventory failed:", e);
            return this.fishInventory;
        }
    }

    public getFishItems(): FishInventoryItem[] {
        return this.fishInventory;
    }

    public async submitLink(questId: number, linkUrl: string): Promise<{ success: boolean; error?: string }> {
        try {
            const res = await fetch(`${this.getApiBase()}/api/quest/submit-link`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: this.getToken(), questId, linkUrl }),
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error };
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message || "Network error" };
        }
    }

    public async catchFish(): Promise<{ success: boolean; fishCount?: number; error?: string }> {
        try {
            const res = await fetch(`${this.getApiBase()}/api/quest/catch-fish`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: this.getToken() }),
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error };
            return { success: true, fishCount: data.fishCount };
        } catch (e: any) {
            return { success: false, error: e.message || "Network error" };
        }
    }

    public async completeFishingQuest(questId: number): Promise<{ success: boolean; error?: string; loopiReward?: number; xpReward?: number; newStreak?: number; badgeEarned?: boolean }> {
        try {
            const res = await fetch(`${this.getApiBase()}/api/quest/complete-fishing`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: this.getToken(), questId }),
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error };
            return { success: true, ...data };
        } catch (e: any) {
            return { success: false, error: e.message || "Network error" };
        }
    }
}
