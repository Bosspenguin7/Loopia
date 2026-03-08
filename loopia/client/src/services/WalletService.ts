import { GuestAuth } from "./GuestAuth";

export class WalletService {
    private static instance: WalletService;
    private address: string | null = null;
    private balance: string = "0";
    private gasPrice: string = "0";
    private onWalletCreatedCallback?: (address: string) => void;
    private onBalanceChangeCallback?: (balance: string) => void;

    private constructor() {}

    public static getInstance(): WalletService {
        if (!WalletService.instance) {
            WalletService.instance = new WalletService();
        }
        return WalletService.instance;
    }

    private getApiBase(): string {
        const isProduction = window.location.hostname.includes("loopia.world");
        return isProduction ? "https://server.loopia.world" : "http://127.0.0.1:2567";
    }

    private getToken(): string {
        return GuestAuth.getInstance().getToken() || "";
    }

    public onWalletCreated(cb: (address: string) => void): void {
        this.onWalletCreatedCallback = cb;
    }

    public onBalanceChange(cb: (balance: string) => void): void {
        this.onBalanceChangeCallback = cb;
    }

    public async fetchWalletInfo(): Promise<void> {
        try {
            const res = await fetch(
                `${this.getApiBase()}/api/wallet/info?token=${encodeURIComponent(this.getToken())}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            this.address = data.address;
            this.gasPrice = data.gasPrice || "0";
            const newBalance = data.avaxBalance || "0";
            if (newBalance !== this.balance) {
                this.balance = newBalance;
                this.onBalanceChangeCallback?.(this.balance);
            }
        } catch (e) {
            console.warn("[WalletService] fetchWalletInfo failed:", e);
        }
    }

    public async createWallet(): Promise<boolean> {
        try {
            const res = await fetch(`${this.getApiBase()}/api/wallet/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: this.getToken() }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.error("[WalletService] createWallet failed:", err);
                return false;
            }
            const data = await res.json();
            this.address = data.address;
            this.balance = "0";
            this.onWalletCreatedCallback?.(data.address);
            this.onBalanceChangeCallback?.(this.balance);
            return true;
        } catch (e) {
            console.error("[WalletService] createWallet error:", e);
            return false;
        }
    }

    public hasWallet(): boolean {
        return this.address !== null;
    }

    public getAddress(): string | null {
        return this.address;
    }

    public getBalance(): string {
        return this.balance;
    }

    /** Estimated fee for a simple transfer (21000 gas) in AVAX */
    public getEstimatedFee(): number {
        const gasPriceWei = parseFloat(this.gasPrice);
        if (!gasPriceWei || isNaN(gasPriceWei)) return 0;
        return (gasPriceWei * 21000) / 1e18;
    }
}
