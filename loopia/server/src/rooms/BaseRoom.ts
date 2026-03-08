import { Room, Client } from "colyseus";
import { GameState, Player, ChatMessage } from "./schema/GameState";
import { RateLimiter } from "../utils/RateLimiter";
import { ServerPathfinder } from "../utils/ServerPathfinder";
import { ROOM_OBSTACLES } from "@shared/obstacles";
import { PLAYER_SPEED, ANIM, CHAT, SOCIAL, TRADE, GAME_LOOP_INTERVAL, PLAYER_NAME_MAX_LENGTH } from "@shared/constants";
import prisma from "../db/prisma";
import { deliverToGuestId } from "../social/crossRoomMessenger";
import { processDailyLogin } from "../economy/dailyLoginService";
import { getBalance } from "../economy/economyService";
import { TradeManager, ActiveTrade } from "../trade/TradeManager";
import { executeTrade } from "../trade/tradeService";

export interface RoomConfig {
    obstacleKey: string;
    speed: number;
    logPrefix: string;
    welcomeMsg: string;
    leaveMsg: string;
}

const RESERVED_NAMES = ['system', 'admin', 'moderator', 'server', 'loopia'];

export function sanitizeName(raw: string): string | null {
    const name = raw.trim().substring(0, PLAYER_NAME_MAX_LENGTH);
    if (!name) return null;
    if (RESERVED_NAMES.includes(name.toLowerCase())) return null;
    return name;
}

export abstract class BaseRoom extends Room<GameState> {
    protected chatLimiter = new RateLimiter(CHAT.RATE_LIMIT_COUNT, CHAT.RATE_LIMIT_WINDOW);
    protected moveLimiter = new RateLimiter(5, 1000);
    protected whisperLimiter = new RateLimiter(SOCIAL.WHISPER_RATE_LIMIT_COUNT, SOCIAL.WHISPER_RATE_LIMIT_WINDOW);
    protected tradeLimiter = new RateLimiter(TRADE.RATE_LIMIT_COUNT, TRADE.RATE_LIMIT_WINDOW);
    protected tradeManager = new TradeManager();
    protected pathfinder!: ServerPathfinder;
    private tileSize: number = 8;

    protected abstract getRoomConfig(): RoomConfig;

    /** Called at end of onCreate — override for setMetadata, roomLabel storage, etc. */
    protected onRoomCreate(_options: any): void {}

    /** Override to register extra message handlers (e.g. setName) */
    protected registerMessageHandlers(): void {}

    private getClientIp(client: Client): string {
        try {
            const req = (client as any).upgradeReq || (client as any).req;
            if (req) {
                return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                    || req.headers['x-real-ip']
                    || req.connection?.remoteAddress
                    || "";
            }
        } catch {}
        return "";
    }

    onCreate(options: any) {
        const config = this.getRoomConfig();
        const prefix = config.logPrefix;

        this.setState(new GameState());

        // Initialize pathfinder
        const obstacleConfig = ROOM_OBSTACLES[config.obstacleKey];
        this.pathfinder = new ServerPathfinder(obstacleConfig);
        this.tileSize = obstacleConfig.tileSize;

        // Server-authoritative movement: client sends click target, server does pathfinding
        this.onMessage("moveRequest", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            if (!this.moveLimiter.isAllowed(client.sessionId)) return;

            const { targetX, targetY } = data;
            if (typeof targetX !== 'number' || typeof targetY !== 'number') return;
            if (isNaN(targetX) || isNaN(targetY)) return;
            if (!this.pathfinder.isInBounds(targetX, targetY)) return;

            // Server pathfinding (EasyStar resolves synchronously with immediate calculate())
            this.pathfinder.findPath(player.x, player.y, targetX, targetY).then((path) => {
                if (!path || path.length === 0) return;

                // Convert tile coordinates to world coordinates (center of tile)
                const ts = this.tileSize;
                const worldPath = path.map(p => ({
                    x: p.x * ts + ts / 2,
                    y: p.y * ts + ts / 2
                }));

                // Convert smooth path to isometric L-segments:
                // Each segment is split into two iso-axis-aligned legs via a corner point.
                // Iso axes in 2:1 view: A = (2,1), B = (2,-1)
                // Given dx,dy from P to Q:  a = (dx+2*dy)/4,  b = (dx-2*dy)/4
                // Corner = P + a*(2,1) = (P.x + a*2, P.y + a*1)  then straight along B to Q
                const isoPath: { x: number; y: number }[] = [];
                const src = { x: player.x, y: player.y };
                const points = worldPath.length > 1 ? worldPath.slice(1) : worldPath;

                let prev = src;
                for (const wp of points) {
                    const sdx = wp.x - prev.x;
                    const sdy = wp.y - prev.y;
                    // Decompose into iso components
                    const a = (sdx + 2 * sdy) / 4; // iso-down component
                    const b = (sdx - 2 * sdy) / 4; // iso-right component

                    // If both components are significant, add a corner point
                    if (Math.abs(a) > 1 && Math.abs(b) > 1) {
                        // Walk along iso-A axis first (down/up), then iso-B (right/left)
                        const corner = {
                            x: prev.x + a * 2,
                            y: prev.y + a * 1
                        };
                        isoPath.push(corner);
                    }
                    isoPath.push(wp);
                    prev = wp;
                }

                player.currentPath = isoPath;
                player.pathIndex = 0;

                // Set initial anim from first segment
                if (isoPath.length > 0) {
                    const firstDx = isoPath[0].x - player.x;
                    const firstDy = isoPath[0].y - player.y;
                    const fI = firstDx + 2 * firstDy;
                    const fJ = firstDx - 2 * firstDy;
                    if (Math.abs(fI) > Math.abs(fJ)) {
                        player.anim = fI > 0 ? ANIM.WALK_DOWN : ANIM.WALK_UP;
                    } else {
                        player.anim = fJ > 0 ? ANIM.WALK_RIGHT : ANIM.WALK_LEFT;
                    }
                }
            });
        });

        // Handle chat messages with rate limiting
        this.onMessage("chat", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (!player || !data.message || !data.message.trim()) return;

            if (!this.chatLimiter.isAllowed(client.sessionId)) {
                console.warn(`[${prefix} RATE_LIMIT] Chat spam from ${player.name}`);
                return;
            }

            const chatMsg = new ChatMessage();
            chatMsg.sender = player.name;
            chatMsg.message = data.message.trim().substring(0, CHAT.MAX_MESSAGE_LENGTH);
            chatMsg.timestamp = Date.now();

            if (this.state.messages.length >= CHAT.MAX_HISTORY) {
                this.state.messages.shift();
            }
            this.state.messages.push(chatMsg);

            console.log(`[${prefix} CHAT] ${player.name}: ${chatMsg.message}`);
        });

        // System message handler (from admin panel broadcast)
        this.onMessage("systemMessage", (_client, data) => {
            if (!data.message) return;
            const chatMsg = new ChatMessage();
            chatMsg.sender = "System";
            chatMsg.message = data.message;
            chatMsg.timestamp = Date.now();
            if (this.state.messages.length >= CHAT.MAX_HISTORY) {
                this.state.messages.shift();
            }
            this.state.messages.push(chatMsg);
        });

        // Same-room whisper
        this.onMessage("whisper", (client, data) => {
            const sender = this.state.players.get(client.sessionId);
            if (!sender) return;

            const { targetSessionId, message } = data;
            if (!targetSessionId || !message || typeof message !== "string" || !message.trim()) return;

            if (!this.whisperLimiter.isAllowed(client.sessionId)) return;

            const targetPlayer = this.state.players.get(targetSessionId);
            if (!targetPlayer) return;

            const trimmed = message.trim().substring(0, CHAT.MAX_MESSAGE_LENGTH);

            // Async block check + send
            (async () => {
                try {
                    // Block check (only if both have guestIds)
                    if (sender.guestId > 0 && targetPlayer.guestId > 0) {
                        const block = await prisma.blockEntry.findFirst({
                            where: {
                                OR: [
                                    { blockerId: sender.guestId, blockedId: targetPlayer.guestId },
                                    { blockerId: targetPlayer.guestId, blockedId: sender.guestId },
                                ],
                            },
                        });
                        if (block) {
                            client.send("whisperError", { error: "Cannot whisper to this player" });
                            return;
                        }
                    }

                    // Send to target
                    const targetClient = this.clients.find(c => c.sessionId === targetSessionId);
                    if (targetClient) {
                        targetClient.send("whisper", {
                            senderSessionId: client.sessionId,
                            senderName: sender.name,
                            senderGuestId: sender.guestId,
                            message: trimmed,
                        });
                    }

                    // Confirm to sender
                    client.send("whisperSent", {
                        targetSessionId,
                        targetName: targetPlayer.name,
                        message: trimmed,
                    });
                } catch (e) {
                    console.error("[BaseRoom] whisper block check error:", e);
                }
            })();
        });

        // Cross-room whisper (friends only)
        this.onMessage("whisperCrossRoom", (client, data) => {
            const sender = this.state.players.get(client.sessionId);
            if (!sender || !sender.guestId) return;

            const { targetGuestId, message } = data;
            if (!targetGuestId || typeof targetGuestId !== "number") return;
            if (!message || typeof message !== "string" || !message.trim()) return;

            if (!this.whisperLimiter.isAllowed(client.sessionId)) return;

            const trimmed = message.trim().substring(0, CHAT.MAX_MESSAGE_LENGTH);

            // Async: check block + friendship, then deliver or store
            (async () => {
                try {
                    // Block check
                    const block = await prisma.blockEntry.findFirst({
                        where: {
                            OR: [
                                { blockerId: sender.guestId, blockedId: targetGuestId },
                                { blockerId: targetGuestId, blockedId: sender.guestId },
                            ],
                        },
                    });
                    if (block) {
                        client.send("whisperError", { error: "Cannot whisper to this player" });
                        return;
                    }

                    const friendship = await prisma.friendship.findFirst({
                        where: {
                            status: "accepted",
                            OR: [
                                { guestId: sender.guestId, friendId: targetGuestId },
                                { guestId: targetGuestId, friendId: sender.guestId },
                            ],
                        },
                    });

                    if (!friendship) {
                        client.send("whisperError", { error: "Must be friends to whisper cross-room" });
                        return;
                    }

                    // Get target display name
                    const targetAccount = await prisma.account.findUnique({
                        where: { id: targetGuestId },
                        select: { displayName: true },
                    });
                    const targetName = targetAccount?.displayName || `Guest${targetGuestId}`;

                    const delivered = await deliverToGuestId(targetGuestId, "whisper", {
                        senderSessionId: client.sessionId,
                        senderName: sender.name,
                        senderGuestId: sender.guestId,
                        message: trimmed,
                        crossRoom: true,
                    });

                    if (delivered) {
                        client.send("whisperSent", {
                            targetGuestId,
                            targetName,
                            message: trimmed,
                            crossRoom: true,
                        });
                    } else {
                        // Offline — save as DM
                        await prisma.directMessage.create({
                            data: {
                                senderId: sender.guestId,
                                receiverId: targetGuestId,
                                message: trimmed,
                            },
                        });
                        client.send("whisperOffline", {
                            targetGuestId,
                            targetName,
                            message: trimmed,
                        });
                    }
                } catch (e) {
                    console.error("[BaseRoom] crossRoomWhisper error:", e);
                }
            })();
        });

        // Trade message handlers
        this.registerTradeHandlers();

        // Extra message handlers from child classes
        this.registerMessageHandlers();

        // Game loop: server-side path following at 20Hz
        this.setSimulationInterval((dt) => this.gameLoop(dt), GAME_LOOP_INTERVAL);

        // Heartbeat: batch-update lastSeenAt for connected players every 60s
        this.clock.setInterval(() => this.updateConnectedPlayersLastSeen(), 60000);

        // Trade expiry cleanup every 30s
        this.clock.setInterval(() => this.cleanExpiredTrades(), 30000);

        // Child-specific setup
        this.onRoomCreate(options);

        // Load active system messages from DB
        this.loadSystemMessages();

        console.log(`[${prefix}] Room created!`);
    }

    private async loadSystemMessages() {
        try {
            const roomLabel = this.metadata?.roomLabel || "";
            const messages = await prisma.systemMessage.findMany({
                where: {
                    active: true,
                    OR: [
                        { targetRoom: null },
                        { targetRoom: roomLabel },
                    ],
                },
            });

            for (const msg of messages) {
                const chatMsg = new ChatMessage();
                chatMsg.sender = "System";
                chatMsg.message = msg.message;
                chatMsg.timestamp = Date.now();
                if (this.state.messages.length >= CHAT.MAX_HISTORY) {
                    this.state.messages.shift();
                }
                this.state.messages.push(chatMsg);
            }
        } catch (e) {
            console.error("[BaseRoom] Failed to load system messages:", e);
        }
    }

    private async updateConnectedPlayersLastSeen() {
        const guestIds: number[] = [];
        this.state.players.forEach((player) => {
            if (player.guestId > 0) guestIds.push(player.guestId);
        });
        if (guestIds.length === 0) return;
        try {
            await prisma.account.updateMany({
                where: { id: { in: guestIds } },
                data: { lastSeenAt: new Date() },
            });
        } catch (e) {
            console.error("[BaseRoom] Failed to update lastSeenAt:", e);
        }
    }

    private gameLoop(dt: number) {
        const step = PLAYER_SPEED * (dt / 1000);

        this.state.players.forEach((player, sessionId) => {
            if (player.currentPath.length === 0 || player.pathIndex >= player.currentPath.length) return;

            const target = player.currentPath[player.pathIndex];
            const dx = target.x - player.x;
            const dy = target.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= step) {
                // Reached this waypoint
                player.x = target.x;
                player.y = target.y;
                player.pathIndex++;

                if (player.pathIndex >= player.currentPath.length) {
                    // Path complete
                    player.currentPath = [];
                    player.pathIndex = 0;
                    player.anim = ANIM.IDLE;

                    // Notify the client that owns this player
                    const client = this.clients.find(c => c.sessionId === sessionId);
                    if (client) {
                        client.send("moveComplete", {});
                    }
                } else {
                    // Update anim for next segment (iso direction)
                    const next = player.currentPath[player.pathIndex];
                    const segDx = next.x - player.x;
                    const segDy = next.y - player.y;
                    const sI = segDx + 2 * segDy;
                    const sJ = segDx - 2 * segDy;
                    if (Math.abs(sI) > Math.abs(sJ)) {
                        player.anim = sI > 0 ? ANIM.WALK_DOWN : ANIM.WALK_UP;
                    } else {
                        player.anim = sJ > 0 ? ANIM.WALK_RIGHT : ANIM.WALK_LEFT;
                    }
                }
            } else {
                player.x += (dx / dist) * step;
                player.y += (dy / dist) * step;
            }
        });
    }

    onJoin(client: Client, options: any) {
        const config = this.getRoomConfig();
        const obstacleConfig = ROOM_OBSTACLES[config.obstacleKey];
        const ip = this.getClientIp(client);

        console.log(`[${config.logPrefix}] ${client.sessionId} joined!`);

        const player = new Player();

        // Spawn validation
        let spawnX = options.spawnX ?? obstacleConfig.defaultSpawnX;
        let spawnY = options.spawnY ?? obstacleConfig.defaultSpawnY;
        spawnX = Math.max(0, Math.min(obstacleConfig.mapWidth, spawnX));
        spawnY = Math.max(0, Math.min(obstacleConfig.mapHeight, spawnY));
        const walkable = this.pathfinder.isWalkable(spawnX, spawnY);
        console.log(`[${config.logPrefix} SPAWN] requested=(${spawnX}, ${spawnY}) walkable=${walkable}`);
        if (!walkable) {
            console.log(`[${config.logPrefix} SPAWN] BLOCKED! Falling back to default=(${obstacleConfig.defaultSpawnX}, ${obstacleConfig.defaultSpawnY})`);
            spawnX = obstacleConfig.defaultSpawnX;
            spawnY = obstacleConfig.defaultSpawnY;
        }

        player.x = spawnX;
        player.y = spawnY;
        player.name = (options.name && sanitizeName(options.name)) || `Player${Math.floor(Math.random() * 1000)}`;
        this.state.players.set(client.sessionId, player);

        // Welcome message
        const welcomeMsg = new ChatMessage();
        welcomeMsg.sender = "System";
        welcomeMsg.message = `${player.name} ${config.welcomeMsg}`;
        welcomeMsg.timestamp = Date.now();
        if (this.state.messages.length >= CHAT.MAX_HISTORY) {
            this.state.messages.shift();
        }
        this.state.messages.push(welcomeMsg);

        // Async DB operations (fire-and-forget, non-blocking)
        this.onJoinAsync(client, player, config, ip, options.guestToken);
    }

    private async onJoinAsync(client: Client, player: Player, config: RoomConfig, ip: string, guestToken?: string) {
        // Ban check (IP)
        try {
            const ban = await prisma.banEntry.findFirst({
                where: {
                    identifier: ip,
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } },
                    ],
                },
            });

            if (ban) {
                client.send("banned", { reason: ban.reason });
                client.leave();
                this.state.players.delete(client.sessionId);
                console.log(`[${config.logPrefix}] Banned IP ${ip} kicked after join`);
                return;
            }
        } catch (e) {
            console.error("[BaseRoom] Ban check failed:", e);
        }

        // Resolve guest account
        let guestId: number | undefined;
        if (guestToken && typeof guestToken === "string") {
            try {
                const guest = await prisma.account.findUnique({
                    where: { guestToken },
                });
                if (guest) {
                    guestId = guest.id;
                    player.guestId = guest.id;
                    // Update lastSeenAt
                    await prisma.account.update({
                        where: { id: guest.id },
                        data: { lastSeenAt: new Date() },
                    });

                    // Ban check (guestId)
                    const guestBan = await prisma.banEntry.findFirst({
                        where: {
                            identifier: `guest:${guest.id}`,
                            OR: [
                                { expiresAt: null },
                                { expiresAt: { gt: new Date() } },
                            ],
                        },
                    });
                    if (guestBan) {
                        client.send("banned", { reason: guestBan.reason });
                        client.leave();
                        this.state.players.delete(client.sessionId);
                        console.log(`[${config.logPrefix}] Banned guest ${guest.id} kicked after join`);
                        return;
                    }
                }
            } catch (e) {
                console.error("[BaseRoom] Guest resolve failed:", e);
            }
        }

        // Daily login reward
        if (guestId) {
            try {
                const loginResult = await processDailyLogin(guestId);
                if (loginResult && loginResult.rewarded) {
                    client.send("dailyLoginReward", {
                        streakDay: loginResult.streakDay,
                        loopiEarned: loginResult.loopiEarned,
                        totalLoopi: loginResult.totalLoopi,
                        streakReset: loginResult.streakReset,
                    });
                }
            } catch (e) {
                console.error("[BaseRoom] Daily login failed:", e);
            }

            // Send current balance
            try {
                const balance = await getBalance(guestId);
                client.send("balanceUpdate", balance);
            } catch (e) {
                console.error("[BaseRoom] Balance send failed:", e);
            }
        }

        // Log session to DB
        try {
            await prisma.playerSession.create({
                data: {
                    sessionId: client.sessionId,
                    name: player.name,
                    roomName: this.metadata?.roomLabel || "unknown",
                    roomType: config.obstacleKey,
                    ip,
                    guestId: guestId ?? null,
                },
            });
        } catch (e) {
            console.error("[BaseRoom] Failed to log session:", e);
        }
    }

    async onLeave(client: Client, consented: boolean) {
        const config = this.getRoomConfig();
        const player = this.state.players.get(client.sessionId);

        if (consented) {
            // Player left intentionally (scene transition, leave button, tab close)
            this.removePlayer(client, config, player);
            return;
        }

        // Unexpected disconnect — allow 30s reconnection window
        try {
            console.log(`[${config.logPrefix}] ${player?.name || client.sessionId} disconnected, waiting for reconnect...`);
            await this.allowReconnection(client, 30);
            console.log(`[${config.logPrefix}] ${player?.name || client.sessionId} reconnected!`);
            // Reconnect successful — player state preserved, nothing to clean up
        } catch (_e) {
            // Reconnection timed out — remove player
            console.log(`[${config.logPrefix}] ${player?.name || client.sessionId} reconnection timed out.`);
            this.removePlayer(client, config, player);
        }
    }

    private removePlayer(client: Client, config: RoomConfig, player: Player | undefined) {
        if (player) {
            const leaveMsg = new ChatMessage();
            leaveMsg.sender = "System";
            leaveMsg.message = `${player.name} ${config.leaveMsg}`;
            leaveMsg.timestamp = Date.now();
            if (this.state.messages.length >= CHAT.MAX_HISTORY) {
                this.state.messages.shift();
            }
            this.state.messages.push(leaveMsg);
        }

        // Cancel active trade on leave
        this.cancelTradeForSession(client.sessionId, "Partner disconnected");

        this.chatLimiter.reset(client.sessionId);
        this.moveLimiter.reset(client.sessionId);
        this.whisperLimiter.reset(client.sessionId);
        this.tradeLimiter.reset(client.sessionId);

        console.log(`[${config.logPrefix}] ${client.sessionId} left!`);
        this.state.players.delete(client.sessionId);

        // Update session in DB (fire-and-forget)
        prisma.playerSession.updateMany({
            where: {
                sessionId: client.sessionId,
                leftAt: null,
            },
            data: {
                leftAt: new Date(),
            },
        }).catch(e => {
            console.error("[BaseRoom] Failed to update session:", e);
        });
    }

    // ──────────── Trade System ────────────

    private registerTradeHandlers() {
        // Trade request
        this.onMessage("tradeRequest", (client, data) => {
            const sender = this.state.players.get(client.sessionId);
            if (!sender || sender.guestId <= 0) {
                client.send("tradeError", { error: "You must be logged in to trade" });
                return;
            }

            if (!this.tradeLimiter.isAllowed(client.sessionId)) {
                client.send("tradeError", { error: "Too many trade requests, slow down" });
                return;
            }

            if (this.tradeManager.isInTrade(client.sessionId)) {
                client.send("tradeError", { error: "You are already in a trade" });
                return;
            }

            if (this.tradeManager.hasPendingRequest(client.sessionId)) {
                client.send("tradeError", { error: "You already have a pending trade request" });
                return;
            }

            const { targetSessionId } = data;
            if (!targetSessionId || typeof targetSessionId !== "string") return;
            if (targetSessionId === client.sessionId) return;

            const target = this.state.players.get(targetSessionId);
            if (!target || target.guestId <= 0) {
                client.send("tradeError", { error: "Player not found" });
                return;
            }

            if (this.tradeManager.isInTrade(targetSessionId)) {
                client.send("tradeError", { error: "That player is already in a trade" });
                return;
            }

            if (this.tradeManager.getRequest(targetSessionId)) {
                client.send("tradeError", { error: "That player already has a pending trade request" });
                return;
            }

            // Block check (async)
            (async () => {
                try {
                    const block = await prisma.blockEntry.findFirst({
                        where: {
                            OR: [
                                { blockerId: sender.guestId, blockedId: target.guestId },
                                { blockerId: target.guestId, blockedId: sender.guestId },
                            ],
                        },
                    });
                    if (block) {
                        client.send("tradeError", { error: "Cannot trade with this player" });
                        return;
                    }

                    this.tradeManager.addRequest(client.sessionId, targetSessionId);

                    // Confirm to sender — show pending UI
                    client.send("tradeRequestSent", {
                        targetSessionId,
                        targetName: target.name,
                    });

                    // Send incoming notification to target
                    const targetClient = this.clients.find(c => c.sessionId === targetSessionId);
                    if (targetClient) {
                        targetClient.send("tradeIncoming", {
                            fromSessionId: client.sessionId,
                            fromName: sender.name,
                        });
                    }

                    // Expire timer
                    const timer = setTimeout(() => {
                        this.tradeManager.removeRequest(targetSessionId);
                        client.send("tradeRequestExpired", {});
                    }, TRADE.REQUEST_EXPIRE_MS);
                    this.tradeManager.setRequestTimer(targetSessionId, timer);
                } catch (e) {
                    console.error("[BaseRoom] tradeRequest block check error:", e);
                }
            })();
        });

        // Accept trade request
        this.onMessage("tradeAccept", (client) => {
            const fromSession = this.tradeManager.getRequest(client.sessionId);
            if (!fromSession) {
                client.send("tradeError", { error: "No pending trade request" });
                return;
            }

            const acceptor = this.state.players.get(client.sessionId);
            const initiator = this.state.players.get(fromSession);
            if (!acceptor || !initiator || acceptor.guestId <= 0 || initiator.guestId <= 0) {
                this.tradeManager.removeRequest(client.sessionId);
                client.send("tradeError", { error: "Trade partner not available" });
                return;
            }

            // Check neither is already in a trade
            if (this.tradeManager.isInTrade(client.sessionId) || this.tradeManager.isInTrade(fromSession)) {
                this.tradeManager.removeRequest(client.sessionId);
                client.send("tradeError", { error: "A player is already in a trade" });
                return;
            }

            this.tradeManager.removeRequest(client.sessionId);
            const trade = this.tradeManager.createTrade(fromSession, client.sessionId, initiator.guestId, acceptor.guestId);

            const initiatorClient = this.clients.find(c => c.sessionId === fromSession);
            const acceptorClient = this.clients.find(c => c.sessionId === client.sessionId);

            if (initiatorClient) {
                initiatorClient.send("tradeStarted", {
                    tradeId: trade.id,
                    partnerSessionId: client.sessionId,
                    partnerName: acceptor.name,
                });
            }
            if (acceptorClient) {
                acceptorClient.send("tradeStarted", {
                    tradeId: trade.id,
                    partnerSessionId: fromSession,
                    partnerName: initiator.name,
                });
            }
        });

        // Decline trade request
        this.onMessage("tradeDecline", (client) => {
            const fromSession = this.tradeManager.getRequest(client.sessionId);
            if (!fromSession) return;

            this.tradeManager.removeRequest(client.sessionId);

            const fromClient = this.clients.find(c => c.sessionId === fromSession);
            if (fromClient) {
                fromClient.send("tradeRequestDeclined", {});
            }
        });

        // Set offer
        this.onMessage("tradeSetOffer", (client, data) => {
            const trade = this.tradeManager.getTrade(client.sessionId);
            if (!trade) {
                client.send("tradeError", { error: "Not in a trade" });
                return;
            }

            const { loopi } = data;
            if (typeof loopi !== "number") return;
            if (!Number.isInteger(loopi)) return;
            if (loopi < 0) return;
            if (loopi > TRADE.MAX_OFFER) return;

            const wasReady = this.tradeManager.setOffer(client.sessionId, { loopi });

            const partnerSession = this.tradeManager.getPartnerSession(trade, client.sessionId);
            const partnerClient = this.clients.find(c => c.sessionId === partnerSession);

            if (partnerClient) {
                partnerClient.send("tradeOfferUpdated", { sessionId: client.sessionId, loopi });
            }

            // If ready flags were reset, notify both sides
            if (wasReady) {
                client.send("tradeReadyChanged", { sessionId: trade.sessionA, isReady: false });
                client.send("tradeReadyChanged", { sessionId: trade.sessionB, isReady: false });
                if (partnerClient) {
                    partnerClient.send("tradeReadyChanged", { sessionId: trade.sessionA, isReady: false });
                    partnerClient.send("tradeReadyChanged", { sessionId: trade.sessionB, isReady: false });
                }
            }
        });

        // Ready
        this.onMessage("tradeReady", (client) => {
            const trade = this.tradeManager.getTrade(client.sessionId);
            if (!trade) return;

            // At least one side must offer something
            if (trade.offerA.loopi === 0 && trade.offerB.loopi === 0) {
                client.send("tradeError", { error: "At least one side must offer something" });
                return;
            }

            // Balance check for this player
            const side = this.tradeManager.getSide(trade, client.sessionId);
            const offer = trade[`offer${side}`];
            const guestId = trade[`guestId${side}`];

            (async () => {
                try {
                    const balance = await getBalance(guestId);
                    if (balance.loopi < offer.loopi) {
                        client.send("tradeError", { error: "Insufficient balance" });
                        return;
                    }

                    const { bothReady } = this.tradeManager.setReady(client.sessionId);

                    const partnerSession = this.tradeManager.getPartnerSession(trade, client.sessionId);
                    const partnerClient = this.clients.find(c => c.sessionId === partnerSession);

                    // Notify both about ready state change
                    client.send("tradeReadyChanged", { sessionId: client.sessionId, isReady: true });
                    if (partnerClient) {
                        partnerClient.send("tradeReadyChanged", { sessionId: client.sessionId, isReady: true });
                    }

                    if (bothReady) {
                        this.startTradeCountdown(trade);
                    }
                } catch (e) {
                    console.error("[BaseRoom] tradeReady balance check error:", e);
                    client.send("tradeError", { error: "Failed to verify balance" });
                }
            })();
        });

        // Unready
        this.onMessage("tradeUnready", (client) => {
            const trade = this.tradeManager.getTrade(client.sessionId);
            if (!trade) return;

            this.tradeManager.setUnready(client.sessionId);

            const partnerSession = this.tradeManager.getPartnerSession(trade, client.sessionId);
            const partnerClient = this.clients.find(c => c.sessionId === partnerSession);

            client.send("tradeReadyChanged", { sessionId: client.sessionId, isReady: false });
            if (partnerClient) {
                partnerClient.send("tradeReadyChanged", { sessionId: client.sessionId, isReady: false });
            }
        });

        // Confirm (after countdown)
        this.onMessage("tradeConfirm", (client) => {
            const trade = this.tradeManager.getTrade(client.sessionId);
            if (!trade) return;

            // Both must still be ready
            if (!trade.readyA || !trade.readyB) {
                client.send("tradeError", { error: "Both players must be ready" });
                return;
            }

            const { bothConfirmed } = this.tradeManager.setConfirm(client.sessionId);

            if (bothConfirmed) {
                this.completeTrade(trade);
            }
        });

        // Cancel
        this.onMessage("tradeCancel", (client) => {
            this.cancelTradeForSession(client.sessionId, "Trade cancelled");
        });
    }

    private startTradeCountdown(trade: ActiveTrade) {
        let remaining = TRADE.COUNTDOWN_SECONDS;

        const clientA = this.clients.find(c => c.sessionId === trade.sessionA);
        const clientB = this.clients.find(c => c.sessionId === trade.sessionB);

        const tick = () => {
            // Check trade still exists and both still ready
            const current = this.tradeManager.getTrade(trade.sessionA);
            if (!current || !current.readyA || !current.readyB) return;

            if (remaining > 0) {
                clientA?.send("tradeCountdown", { remaining });
                clientB?.send("tradeCountdown", { remaining });
                remaining--;
                trade.countdownTimer = setTimeout(tick, 1000);
            } else {
                // Countdown finished — auto-confirm both sides
                trade.confirmedA = true;
                trade.confirmedB = true;
                this.completeTrade(trade);
            }
        };

        tick();
    }

    private async completeTrade(trade: ActiveTrade) {
        const clientA = this.clients.find(c => c.sessionId === trade.sessionA);
        const clientB = this.clients.find(c => c.sessionId === trade.sessionB);

        try {
            // Final balance check + atomic transfer
            const result = await executeTrade(
                trade.guestIdA,
                trade.guestIdB,
                trade.offerA,
                trade.offerB
            );

            // Notify both players
            if (clientA) {
                clientA.send("tradeCompleted", {
                    gained: { loopi: trade.offerB.loopi },
                    lost: { loopi: trade.offerA.loopi },
                    balance: result.balanceA,
                });
                clientA.send("balanceUpdate", result.balanceA);
            }
            if (clientB) {
                clientB.send("tradeCompleted", {
                    gained: { loopi: trade.offerA.loopi },
                    lost: { loopi: trade.offerB.loopi },
                    balance: result.balanceB,
                });
                clientB.send("balanceUpdate", result.balanceB);
            }

            this.tradeManager.removeTrade(trade.sessionA);
        } catch (e: any) {
            console.error("[BaseRoom] completeTrade error:", e);
            const errorMsg = e.message || "Trade failed";

            clientA?.send("tradeCancelled", { reason: errorMsg });
            clientB?.send("tradeCancelled", { reason: errorMsg });
            this.tradeManager.removeTrade(trade.sessionA);
        }
    }

    private cancelTradeForSession(sessionId: string, reason: string) {
        // Cancel active trade
        const trade = this.tradeManager.removeTrade(sessionId);
        if (trade) {
            const partnerSession = sessionId === trade.sessionA ? trade.sessionB : trade.sessionA;
            const partnerClient = this.clients.find(c => c.sessionId === partnerSession);
            if (partnerClient) {
                partnerClient.send("tradeCancelled", { reason });
            }
        }

        // Remove pending requests involving this session + notify affected targets
        const removedTargets = this.tradeManager.removeAllRequests(sessionId);
        for (const targetSession of removedTargets) {
            const targetClient = this.clients.find(c => c.sessionId === targetSession);
            if (targetClient) {
                targetClient.send("tradeIncomingCancelled", {});
            }
        }
    }

    private cleanExpiredTrades() {
        const expired = this.tradeManager.getExpiredTrades(TRADE.TIMEOUT_MS);
        for (const trade of expired) {
            const clientA = this.clients.find(c => c.sessionId === trade.sessionA);
            const clientB = this.clients.find(c => c.sessionId === trade.sessionB);
            clientA?.send("tradeCancelled", { reason: "Trade expired due to inactivity" });
            clientB?.send("tradeCancelled", { reason: "Trade expired due to inactivity" });
            this.tradeManager.removeTrade(trade.sessionA);
        }
    }

    onDispose() {
        console.log(`[${this.getRoomConfig().logPrefix}] Room disposed`);
    }
}
