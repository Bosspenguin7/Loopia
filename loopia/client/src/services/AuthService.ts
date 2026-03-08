import { GuestAuth } from "./GuestAuth";

const STORAGE_KEY = "loopia_guest_token";
const AUTH_METHOD_KEY = "loopia_auth_method";

// Twitter OAuth 2.0 PKCE constants — Client ID loaded from Vite env
const TWITTER_CLIENT_ID = import.meta.env.VITE_TWITTER_CLIENT_ID || "";
const TWITTER_AUTH_URL = "https://twitter.com/i/oauth2/authorize";
const TWITTER_SCOPES = "users.read tweet.read offline.access";

export class AuthService {
    private static instance: AuthService;

    private constructor() {}

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    private getApiBase(): string {
        const isProduction = window.location.hostname.includes("loopia.world");
        return isProduction ? "https://server.loopia.world" : "http://127.0.0.1:2567";
    }

    private getRedirectUri(): string {
        return `${window.location.origin}/auth/callback`;
    }

    private getTwitterClientId(): string {
        return TWITTER_CLIENT_ID;
    }

    // --- PKCE Helpers ---

    private generateCodeVerifier(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return this.base64UrlEncode(array);
    }

    private async generateCodeChallenge(verifier: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const digest = await crypto.subtle.digest("SHA-256", data);
        return this.base64UrlEncode(new Uint8Array(digest));
    }

    private base64UrlEncode(buffer: Uint8Array): string {
        let str = "";
        for (const byte of buffer) {
            str += String.fromCharCode(byte);
        }
        return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    // --- Twitter OAuth Flow ---

    public async startTwitterLogin(): Promise<void> {
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);
        const state = crypto.randomUUID();

        // Store in sessionStorage (survives redirect, cleared on tab close)
        sessionStorage.setItem("twitter_code_verifier", codeVerifier);
        sessionStorage.setItem("twitter_oauth_state", state);

        const params = new URLSearchParams({
            response_type: "code",
            client_id: this.getTwitterClientId(),
            redirect_uri: this.getRedirectUri(),
            scope: TWITTER_SCOPES,
            state,
            code_challenge: codeChallenge,
            code_challenge_method: "S256",
        });

        window.location.href = `${TWITTER_AUTH_URL}?${params.toString()}`;
    }

    public async handleTwitterCallback(code: string, state: string): Promise<boolean> {
        // Verify state for CSRF protection
        const storedState = sessionStorage.getItem("twitter_oauth_state");
        if (!storedState || storedState !== state) {
            console.error("[AuthService] State mismatch — possible CSRF");
            return false;
        }

        const codeVerifier = sessionStorage.getItem("twitter_code_verifier");
        if (!codeVerifier) {
            console.error("[AuthService] No code_verifier found in sessionStorage");
            return false;
        }

        // Clean up sessionStorage
        sessionStorage.removeItem("twitter_code_verifier");
        sessionStorage.removeItem("twitter_oauth_state");

        try {
            const res = await fetch(`${this.getApiBase()}/api/auth/twitter/token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    code_verifier: codeVerifier,
                    redirect_uri: this.getRedirectUri(),
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.error("[AuthService] Twitter token exchange failed:", err);
                return false;
            }

            const data = await res.json();

            // Store token in localStorage (same key as guest auth)
            localStorage.setItem(STORAGE_KEY, data.token);
            localStorage.setItem(AUTH_METHOD_KEY, "twitter");

            // Hydrate GuestAuth singleton so downstream code works unchanged
            const guestAuth = GuestAuth.getInstance();
            guestAuth.hydrateFromExternal(data.token, data.displayName, data.guestId);

            return true;
        } catch (e) {
            console.error("[AuthService] handleTwitterCallback error:", e);
            return false;
        }
    }

    public isAuthenticated(): boolean {
        return !!localStorage.getItem(STORAGE_KEY);
    }

    public getAuthMethod(): string {
        return localStorage.getItem(AUTH_METHOD_KEY) || "guest";
    }

    public logout(): void {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(AUTH_METHOD_KEY);
        window.location.reload();
    }
}
