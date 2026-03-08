import { GuestAuth } from "./GuestAuth";

export class EconomyService {
    private static instance: EconomyService;
    private cachedBalance: { loopi: number } = { loopi: 0 };
    private onBalanceChangeCallback?: (balance: { loopi: number }) => void;

    private constructor() {}

    public static getInstance(): EconomyService {
        if (!EconomyService.instance) {
            EconomyService.instance = new EconomyService();
        }
        return EconomyService.instance;
    }

    private getApiBase(): string {
        const isProduction = window.location.hostname.includes("loopia.world");
        return isProduction ? "https://server.loopia.world" : "http://127.0.0.1:2567";
    }

    private getToken(): string {
        return GuestAuth.getInstance().getToken() || "";
    }

    public setOnBalanceChange(cb: (balance: { loopi: number }) => void): void {
        this.onBalanceChangeCallback = cb;
    }

    public updateBalance(balance: { loopi: number }): void {
        this.cachedBalance = balance;
        this.onBalanceChangeCallback?.(balance);
    }

    public getCachedBalance(): { loopi: number } {
        return this.cachedBalance;
    }

    public async fetchBalance(): Promise<{ loopi: number }> {
        const res = await fetch(
            `${this.getApiBase()}/api/economy/balance?token=${encodeURIComponent(this.getToken())}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.updateBalance(data);
        return data;
    }

    public async getDailyLoginInfo(): Promise<{
        streakDay: number;
        claimedToday: boolean;
        nextReward: number;
    }> {
        const res = await fetch(
            `${this.getApiBase()}/api/economy/daily-login?token=${encodeURIComponent(this.getToken())}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }
}
