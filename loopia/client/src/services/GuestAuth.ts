const STORAGE_KEY = "loopia_guest_token";

export class GuestAuth {
    private static instance: GuestAuth;
    private token: string | null = null;
    private displayName: string = "";
    private guestId: number | null = null;

    private constructor() {}

    public static getInstance(): GuestAuth {
        if (!GuestAuth.instance) {
            GuestAuth.instance = new GuestAuth();
        }
        return GuestAuth.instance;
    }

    private getApiBase(): string {
        const isProduction = window.location.hostname.includes("loopia.world");
        return isProduction ? "https://server.loopia.world" : "http://127.0.0.1:2567";
    }

    public async authenticate(): Promise<void> {
        const stored = localStorage.getItem(STORAGE_KEY);

        try {
            const res = await fetch(`${this.getApiBase()}/api/auth/guest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: stored || undefined }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            this.token = data.token;
            this.displayName = data.displayName || "";
            this.guestId = data.guestId ?? null;

            localStorage.setItem(STORAGE_KEY, data.token);
        } catch (e) {
            console.warn("[GuestAuth] authenticate failed:", e);
        }
    }

    public updateName(name: string): void {
        if (!this.token) return;

        fetch(`${this.getApiBase()}/api/auth/guest/name`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: this.token, displayName: name }),
        }).catch((e) => {
            console.warn("[GuestAuth] updateName failed:", e);
        });
    }

    public getToken(): string | null {
        return this.token;
    }

    public getDisplayName(): string {
        return this.displayName;
    }

    public getGuestId(): number | null {
        return this.guestId;
    }

    public hydrateFromExternal(token: string, displayName: string, guestId: number): void {
        this.token = token;
        this.displayName = displayName;
        this.guestId = guestId;
    }
}
