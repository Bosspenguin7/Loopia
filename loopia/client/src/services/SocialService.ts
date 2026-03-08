import { GuestAuth } from "./GuestAuth";

export interface FriendInfo {
    guestId: number;
    displayName: string;
    isOnline: boolean;
    roomLabel: string | null;
}

export interface PendingRequest {
    requestId: number;
    guestId: number;
    displayName: string;
}

export interface FriendsResponse {
    friends: FriendInfo[];
    pendingReceived: PendingRequest[];
    pendingSent: PendingRequest[];
}

export interface MessageInfo {
    id: number;
    senderId: number;
    receiverId: number;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export interface SearchResult {
    guestId: number;
    displayName: string;
}

export interface PlayerProfile {
    guestId: number;
    displayName: string;
    motto: string;
    createdAt: string;
    friendCount: number;
    isFriend: boolean;
    hasPendingRequest: boolean;
    isOnline: boolean;
    roomLabel: string | null;
    isBlocked: boolean;
    respectsReceived: number;
    hasGivenRespectToday: boolean;
    xp: number;
    level: number;
    twitterUsername?: string | null;
    twitterAvatar?: string | null;
    twitterVisible?: boolean;   // self-view only
    authMethod?: string;         // self-view only
}

export class SocialService {
    private static instance: SocialService;

    private constructor() {}

    public static getInstance(): SocialService {
        if (!SocialService.instance) {
            SocialService.instance = new SocialService();
        }
        return SocialService.instance;
    }

    private getApiBase(): string {
        const isProduction = window.location.hostname.includes("loopia.world");
        return isProduction ? "https://server.loopia.world" : "http://127.0.0.1:2567";
    }

    private getToken(): string {
        return GuestAuth.getInstance().getToken() || "";
    }

    // ────────────────────────── Friends ──────────────────────────

    public async getFriends(): Promise<FriendsResponse> {
        const res = await fetch(
            `${this.getApiBase()}/api/social/friends?token=${encodeURIComponent(this.getToken())}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    public async sendFriendRequest(targetGuestId: number): Promise<{ requestId: number }> {
        const res = await fetch(`${this.getApiBase()}/api/social/friend-request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: this.getToken(), targetGuestId }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `HTTP ${res.status}`);
        }
        return res.json();
    }

    public async respondToFriendRequest(
        requestId: number,
        accept: boolean
    ): Promise<{ status: string }> {
        const res = await fetch(`${this.getApiBase()}/api/social/friend-request/respond`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: this.getToken(), requestId, accept }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    public async removeFriend(friendGuestId: number): Promise<void> {
        const res = await fetch(
            `${this.getApiBase()}/api/social/friend/${friendGuestId}?token=${encodeURIComponent(this.getToken())}`,
            { method: "DELETE" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }

    public async searchPlayers(name: string): Promise<SearchResult[]> {
        const res = await fetch(
            `${this.getApiBase()}/api/social/search?token=${encodeURIComponent(this.getToken())}&name=${encodeURIComponent(name)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.results;
    }

    // ────────────────────────── Messages ──────────────────────────

    public async getMessages(withGuestId: number, limit: number = 50): Promise<MessageInfo[]> {
        const res = await fetch(
            `${this.getApiBase()}/api/social/messages?token=${encodeURIComponent(this.getToken())}&withGuestId=${withGuestId}&limit=${limit}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.messages;
    }

    public async getUnreadCounts(): Promise<{ [guestId: number]: number }> {
        const res = await fetch(
            `${this.getApiBase()}/api/social/messages/unread?token=${encodeURIComponent(this.getToken())}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.unread;
    }

    public async sendMessage(targetGuestId: number, message: string): Promise<{ id: number }> {
        const res = await fetch(`${this.getApiBase()}/api/social/messages/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: this.getToken(), targetGuestId, message }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `HTTP ${res.status}`);
        }
        return res.json();
    }

    public async markRead(senderGuestId: number): Promise<void> {
        const res = await fetch(`${this.getApiBase()}/api/social/messages/read`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: this.getToken(), senderGuestId }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }

    // ────────────────────────── Profile ──────────────────────────

    public async getProfile(guestId: number): Promise<PlayerProfile> {
        const res = await fetch(
            `${this.getApiBase()}/api/social/profile/${guestId}?token=${encodeURIComponent(this.getToken())}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    public async updateMotto(motto: string): Promise<void> {
        const res = await fetch(`${this.getApiBase()}/api/social/profile/motto`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: this.getToken(), motto }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `HTTP ${res.status}`);
        }
    }

    public async updateTwitterVisibility(visible: boolean): Promise<void> {
        const res = await fetch(`${this.getApiBase()}/api/social/profile/twitter-visible`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: this.getToken(), visible }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `HTTP ${res.status}`);
        }
    }

    // ────────────────────────── Respect ──────────────────────────

    public async giveRespect(targetGuestId: number): Promise<{ totalRespects: number }> {
        const res = await fetch(`${this.getApiBase()}/api/social/respect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: this.getToken(), targetGuestId }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `HTTP ${res.status}`);
        }
        return res.json();
    }

    // ────────────────────────── Blocks ──────────────────────────

    public async blockPlayer(targetGuestId: number): Promise<void> {
        const res = await fetch(`${this.getApiBase()}/api/social/block`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: this.getToken(), targetGuestId }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `HTTP ${res.status}`);
        }
    }

    public async unblockPlayer(targetGuestId: number): Promise<void> {
        const res = await fetch(
            `${this.getApiBase()}/api/social/block/${targetGuestId}?token=${encodeURIComponent(this.getToken())}`,
            { method: "DELETE" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }

    public async getBlockList(): Promise<{ guestId: number; displayName: string; blockedAt: string }[]> {
        const res = await fetch(
            `${this.getApiBase()}/api/social/blocks?token=${encodeURIComponent(this.getToken())}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.blocks;
    }
}
