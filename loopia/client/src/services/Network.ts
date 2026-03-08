import { Client, Room } from "colyseus.js";
import { GuestAuth } from "./GuestAuth";

export class Network {
    private static instance: Network;
    private client: Client;
    public activeRoom?: Room;
    public playerName: string = "";
    public currentRoomLabel: string = "";

    // Reconnection state
    private lastReconnectionToken?: string;
    private reconnecting: boolean = false;
    public onReconnectStart?: () => void;
    public onReconnectAttempt?: (attempt: number, maxAttempts: number) => void;
    public onReconnectSuccess?: () => void;
    public onReconnectFail?: () => void;

    private constructor() {
        const isProduction = window.location.hostname.includes("loopia.world");
        const endpoint = isProduction ? "wss://server.loopia.world" : "ws://127.0.0.1:2567";
        this.client = new Client(endpoint);

        // Graceful disconnect on tab close/refresh
        window.addEventListener('beforeunload', () => {
            this.leaveAll();
        });
    }

    private leaveAll() {
        this.activeRoom?.leave();
    }

    public static getInstance(): Network {
        if (!Network.instance) {
            Network.instance = new Network();
        }
        return Network.instance;
    }

    public async joinRoom(roomType: string, playerName: string, roomLabel: string, spawnPos?: { x: number; y: number }): Promise<Room> {
        // Leave current room if connected
        if (this.activeRoom) {
            this.activeRoom.leave();
            this.activeRoom = undefined;
        }

        this.playerName = playerName;
        this.currentRoomLabel = roomLabel;

        try {
            this.activeRoom = await this.client.joinOrCreate(roomType, {
                name: playerName,
                roomLabel: roomLabel,
                spawnX: spawnPos?.x,
                spawnY: spawnPos?.y,
                guestToken: GuestAuth.getInstance().getToken(),
            });
            this.setupReconnectHandler(this.activeRoom);
            console.log(`Joined ${roomType} (${roomLabel}) successfully!`);
            return this.activeRoom;
        } catch (e) {
            console.error(`Could not connect to ${roomType}:`, e);
            throw e;
        }
    }

    public leaveRoom() {
        if (this.activeRoom) {
            this.activeRoom.leave();
            this.activeRoom = undefined;
        }
    }

    public sendChat(message: string) {
        if (this.activeRoom && this.activeRoom.connection.isOpen) {
            this.activeRoom.send("chat", { message });
        }
    }

    // ──────────── Trade Methods ────────────

    public sendTradeRequest(targetSessionId: string) {
        this.activeRoom?.send("tradeRequest", { targetSessionId });
    }

    public sendTradeAccept() {
        this.activeRoom?.send("tradeAccept", {});
    }

    public sendTradeDecline() {
        this.activeRoom?.send("tradeDecline", {});
    }

    public sendTradeSetOffer(loopi: number) {
        this.activeRoom?.send("tradeSetOffer", { loopi });
    }

    public sendTradeReady() {
        this.activeRoom?.send("tradeReady", {});
    }

    public sendTradeUnready() {
        this.activeRoom?.send("tradeUnready", {});
    }

    public sendTradeConfirm() {
        this.activeRoom?.send("tradeConfirm", {});
    }

    public sendTradeCancel() {
        this.activeRoom?.send("tradeCancel", {});
    }

    /** Store reconnection token and attach onLeave handler to the active room */
    private setupReconnectHandler(room: Room) {
        this.lastReconnectionToken = room.reconnectionToken;

        room.onLeave((code: number) => {
            // code 1000 + 4000 = normal/consented close, don't reconnect
            if (code === 1000 || code === 4000) return;

            // Unexpected disconnect — attempt reconnection
            console.log(`[Network] Unexpected disconnect (code ${code}), attempting reconnect...`);
            this.attemptReconnect();
        });
    }

    private async attemptReconnect() {
        if (this.reconnecting || !this.lastReconnectionToken) return;
        this.reconnecting = true;

        this.onReconnectStart?.();

        const maxAttempts = 3;
        const baseDelay = 2000; // 2s, 4s, 8s exponential backoff

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            this.onReconnectAttempt?.(attempt, maxAttempts);

            try {
                console.log(`[Network] Reconnect attempt ${attempt}/${maxAttempts}...`);
                const reconnected: Room = await this.client.reconnect(this.lastReconnectionToken!);

                // Reconnection successful — update room reference
                this.activeRoom = reconnected;
                this.lastReconnectionToken = reconnected.reconnectionToken;

                // Re-attach onLeave for future disconnects
                this.setupReconnectHandler(reconnected);

                this.reconnecting = false;
                this.onReconnectSuccess?.();
                console.log("[Network] Reconnected successfully!");
                return;
            } catch (e) {
                console.warn(`[Network] Reconnect attempt ${attempt} failed:`, e);
                if (attempt < maxAttempts) {
                    await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt - 1)));
                }
            }
        }

        // All attempts failed
        this.reconnecting = false;
        this.lastReconnectionToken = undefined;
        this.onReconnectFail?.();
        console.error("[Network] Reconnection failed after all attempts.");
    }
}
