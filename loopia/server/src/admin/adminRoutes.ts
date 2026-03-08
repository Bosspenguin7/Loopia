import { Router } from "express";
import { matchMaker } from "colyseus";
import prisma from "../db/prisma";
import { ChatMessage } from "../rooms/schema/GameState";
import { addCurrency, getBalance } from "../economy/economyService";
import { deliverToGuestId } from "../social/crossRoomMessenger";
import { approveSubmission, rejectSubmission } from "../quest/questService";

export const adminRouter = Router();

// ─── Room Management ───

adminRouter.get("/rooms", async (_req, res) => {
    try {
        const rooms = await prisma.room.findMany({ orderBy: { sortOrder: "asc" } });
        res.json(rooms);
    } catch (e) {
        console.error("[Admin] GET /rooms error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

adminRouter.post("/rooms", async (req, res) => {
    try {
        const { name, displayName, maxClients, roomType, sceneKey, isActive, sortOrder } = req.body;
        if (!name || !displayName) {
            res.status(400).json({ error: "name and displayName are required" });
            return;
        }
        const room = await prisma.room.create({
            data: {
                name,
                displayName,
                maxClients: maxClients || 50,
                roomType: roomType || "game_room",
                sceneKey: sceneKey || "Scene",
                isActive: isActive !== false,
                sortOrder: sortOrder || 0,
            },
        });
        res.json(room);
    } catch (e: any) {
        if (e.code === "P2002") {
            res.status(409).json({ error: "Room name already exists" });
            return;
        }
        console.error("[Admin] POST /rooms error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

adminRouter.put("/rooms/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const room = await prisma.room.update({
            where: { id },
            data: req.body,
        });
        res.json(room);
    } catch (e) {
        console.error("[Admin] PUT /rooms/:id error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

adminRouter.delete("/rooms/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const permanent = req.query.permanent === "true";

        if (permanent) {
            await prisma.room.delete({ where: { id } });
        } else {
            await prisma.room.update({
                where: { id },
                data: { isActive: false },
            });
        }
        res.json({ success: true });
    } catch (e) {
        console.error("[Admin] DELETE /rooms/:id error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ─── Live Status ───

adminRouter.get("/status", async (_req, res) => {
    try {
        const dbRooms = await prisma.room.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
        });

        const liveRooms = await matchMaker.query({});

        const status = dbRooms.map((dbRoom) => {
            const matching = liveRooms.filter(
                (lr) => lr.metadata?.roomLabel === dbRoom.name
            );
            const clients = matching.reduce((sum, lr) => sum + lr.clients, 0);

            return {
                ...dbRoom,
                clients,
                colyseusRoomIds: matching.map((lr) => lr.roomId),
            };
        });

        res.json(status);
    } catch (e) {
        console.error("[Admin] GET /status error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

adminRouter.get("/status/:roomName/players", async (req, res) => {
    try {
        const { roomName } = req.params;
        const liveRooms = await matchMaker.query({});
        const matching = liveRooms.filter(
            (lr) => lr.metadata?.roomLabel === roomName
        );

        const players: any[] = [];
        for (const lr of matching) {
            try {
                const room = matchMaker.getRoomById(lr.roomId);
                if (room) {
                    const state = (room as any).state;
                    if (state && state.players) {
                        state.players.forEach((player: any, sessionId: string) => {
                            players.push({
                                sessionId,
                                name: player.name,
                                x: Math.round(player.x),
                                y: Math.round(player.y),
                                roomId: lr.roomId,
                            });
                        });
                    }
                }
            } catch (err) {
                console.error("[Admin] Error reading players from room:", lr.roomId, err);
            }
        }

        res.json(players);
    } catch (e) {
        console.error("[Admin] GET /status/:roomName/players error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ─── Moderation ───

adminRouter.post("/kick", async (req, res) => {
    try {
        const { sessionId, roomId } = req.body;
        if (!sessionId || !roomId) {
            res.status(400).json({ error: "sessionId and roomId are required" });
            return;
        }

        const room = matchMaker.getRoomById(roomId);
        if (!room) {
            res.status(404).json({ error: "Room not found" });
            return;
        }

        const client = (room as any).clients.find(
            (c: any) => c.sessionId === sessionId
        );
        if (!client) {
            res.status(404).json({ error: "Client not found in room" });
            return;
        }

        client.leave(4000); // code 4000 = kicked
        res.json({ success: true });
    } catch (e) {
        console.error("[Admin] POST /kick error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

adminRouter.get("/bans", async (_req, res) => {
    try {
        const bans = await prisma.banEntry.findMany({
            orderBy: { bannedAt: "desc" },
        });
        res.json(bans);
    } catch (e) {
        console.error("[Admin] GET /bans error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

adminRouter.post("/bans", async (req, res) => {
    try {
        const { identifier, reason, expiresAt } = req.body;
        if (!identifier) {
            res.status(400).json({ error: "identifier (IP) is required" });
            return;
        }
        const ban = await prisma.banEntry.create({
            data: {
                identifier,
                reason: reason || "",
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
        });
        res.json(ban);
    } catch (e) {
        console.error("[Admin] POST /bans error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

adminRouter.delete("/bans/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.banEntry.delete({ where: { id } });
        res.json({ success: true });
    } catch (e) {
        console.error("[Admin] DELETE /bans/:id error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

adminRouter.post("/system-message", async (req, res) => {
    try {
        const { message, targetRoom, active } = req.body;
        if (!message) {
            res.status(400).json({ error: "message is required" });
            return;
        }

        // Save to DB
        const sysMsg = await prisma.systemMessage.create({
            data: {
                message,
                targetRoom: targetRoom || null,
                active: active !== false,
            },
        });

        // Add to live room state (syncs to clients via onStateChange)
        const liveRooms = await matchMaker.query({});
        for (const lr of liveRooms) {
            try {
                const shouldBroadcast =
                    !targetRoom || lr.metadata?.roomLabel === targetRoom;
                if (!shouldBroadcast) continue;

                const room = matchMaker.getRoomById(lr.roomId);
                if (room) {
                    const state = (room as any).state;
                    const chatMsg = new ChatMessage();
                    chatMsg.sender = "System";
                    chatMsg.message = message;
                    chatMsg.timestamp = Date.now();
                    if (state.messages.length >= 50) {
                        state.messages.shift();
                    }
                    state.messages.push(chatMsg);
                }
            } catch (err) {
                console.error("[Admin] Error broadcasting to room:", lr.roomId, err);
            }
        }

        res.json(sysMsg);
    } catch (e) {
        console.error("[Admin] POST /system-message error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ─── Users ───

adminRouter.get("/users", async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
        const q = ((req.query.q as string) || "").trim();
        const skip = (page - 1) * limit;

        const where = q
            ? {
                  OR: [
                      ...(/^\d+$/.test(q) ? [{ id: parseInt(q) }] : []),
                      { displayName: { contains: q, mode: "insensitive" as const } },
                  ],
              }
            : {};

        const [rawUsers, total] = await Promise.all([
            prisma.account.findMany({
                where,
                select: { id: true, displayName: true, duckets: true, createdAt: true, lastSeenAt: true, level: true, xp: true },
                orderBy: { id: "desc" },
                skip,
                take: limit,
            }),
            prisma.account.count({ where }),
        ]);

        const users = rawUsers.map(u => ({
            id: u.id,
            displayName: u.displayName,
            loopi: u.duckets,
            level: u.level,
            xp: u.xp,
            createdAt: u.createdAt,
            lastSeenAt: u.lastSeenAt,
        }));

        res.json({ users, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (e) {
        console.error("[Admin] GET /users error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

adminRouter.get("/users/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: "Invalid id" });
            return;
        }

        const rawUser = await prisma.account.findUnique({
            where: { id },
            select: {
                id: true, displayName: true, motto: true, respectsReceived: true,
                duckets: true, loginStreak: true, lastLoginRewardAt: true,
                createdAt: true, lastSeenAt: true, level: true, xp: true,
            },
        });

        if (!rawUser) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const transactions = await prisma.currencyTransaction.findMany({
            where: { guestId: id },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        const { duckets, ...rest } = rawUser;
        res.json({ ...rest, loopi: duckets, level: rest.level, xp: rest.xp, transactions });
    } catch (e) {
        console.error("[Admin] GET /users/:id error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ─── Economy ───

adminRouter.post("/economy/grant", async (req, res) => {
    try {
        const { guestId, currency, amount, reason } = req.body;
        if (!guestId || !currency || amount === undefined) {
            res.status(400).json({ error: "guestId, currency, and amount are required" });
            return;
        }
        if (currency !== "loopi") {
            res.status(400).json({ error: "currency must be 'loopi'" });
            return;
        }
        if (typeof amount !== "number" || amount === 0) {
            res.status(400).json({ error: "amount must be a non-zero number" });
            return;
        }

        const grantReason = reason || (amount > 0 ? "admin_grant" : "admin_deduct");

        let newBalance: number;
        if (amount > 0) {
            newBalance = await addCurrency(guestId, currency, amount, grantReason);
        } else {
            // For negative amounts, use addCurrency with negative value
            newBalance = await addCurrency(guestId, currency, amount, grantReason);
        }

        // Send real-time balance update to the player
        try {
            const balance = await getBalance(guestId);
            await deliverToGuestId(guestId, "balanceUpdate", balance);
        } catch {}

        res.json({ success: true, newBalance });
    } catch (e: any) {
        console.error("[Admin] POST /economy/grant error:", e);
        res.status(500).json({ error: e.message || "Internal server error" });
    }
});

// ─── Stats ───

adminRouter.get("/stats", async (_req, res) => {
    try {
        // Current online count
        const liveRooms = await matchMaker.query({});
        const onlineCount = liveRooms.reduce((sum, lr) => sum + lr.clients, 0);

        // Today's sessions
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todaySessions = await prisma.playerSession.count({
            where: { joinedAt: { gte: todayStart } },
        });

        // Peak concurrent (approximate: count sessions that overlap within today)
        // Simplified: max number of sessions that were active at the same time
        const activeSessions = await prisma.playerSession.count({
            where: { leftAt: null },
        });

        // Collect live session IDs from Colyseus
        const liveSessionIds = new Set<string>();
        for (const lr of liveRooms) {
            try {
                const room = matchMaker.getRoomById(lr.roomId);
                if (room) {
                    for (const c of (room as any).clients) {
                        liveSessionIds.add(c.sessionId);
                    }
                }
            } catch (err) {
                console.error("[Admin] Error reading clients from room:", lr.roomId, err);
            }
        }

        // Recent sessions
        const recentSessions = await prisma.playerSession.findMany({
            orderBy: { joinedAt: "desc" },
            take: 50,
        });

        // Mark sessions that have leftAt=null but are not actually in any live room
        const sessionsWithStatus = recentSessions.map(s => ({
            ...s,
            leftAt: s.leftAt ? s.leftAt : (liveSessionIds.has(s.sessionId) ? null : new Date()),
        }));

        res.json({
            onlineCount,
            todaySessions,
            currentActive: onlineCount,
            recentSessions: sessionsWithStatus,
        });
    } catch (e) {
        console.error("[Admin] GET /stats error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ─── Quest Review ───

adminRouter.get("/quest/submissions", async (req, res) => {
    try {
        const status = (req.query.status as string) || undefined;
        const where = status ? { status } : {};
        const submissions = await prisma.questSubmission.findMany({
            where,
            include: {
                guest: { select: { id: true, displayName: true } },
                quest: { select: { id: true, name: true, questKey: true } },
            },
            orderBy: { submittedAt: "desc" },
            take: 100,
        });
        res.json(submissions);
    } catch (e) {
        console.error("[Admin] GET /quest/submissions error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

adminRouter.post("/quest/approve", async (req, res) => {
    try {
        const { submissionId, reviewedBy, notes } = req.body;
        if (!submissionId) {
            res.status(400).json({ error: "submissionId is required" });
            return;
        }
        const result = await approveSubmission(submissionId, reviewedBy || "admin", notes);
        res.json({ success: true, ...result });
    } catch (e: any) {
        console.error("[Admin] POST /quest/approve error:", e);
        res.status(400).json({ error: e.message || "Failed to approve" });
    }
});

adminRouter.post("/quest/reject", async (req, res) => {
    try {
        const { submissionId, reviewedBy, notes } = req.body;
        if (!submissionId) {
            res.status(400).json({ error: "submissionId is required" });
            return;
        }
        await rejectSubmission(submissionId, reviewedBy || "admin", notes);
        res.json({ success: true });
    } catch (e: any) {
        console.error("[Admin] POST /quest/reject error:", e);
        res.status(400).json({ error: e.message || "Failed to reject" });
    }
});
