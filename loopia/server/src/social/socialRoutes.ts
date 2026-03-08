import { Router } from "express";
import prisma from "../db/prisma";
import { resolveGuest, SocialRequest } from "./socialAuth";
import { RateLimiter } from "../utils/RateLimiter";
import { SOCIAL } from "@shared/constants";
import { deliverToGuestId } from "./crossRoomMessenger";

export const socialRouter = Router();

const friendRequestLimiter = new RateLimiter(
    SOCIAL.FRIEND_REQUEST_RATE_LIMIT_COUNT,
    SOCIAL.FRIEND_REQUEST_RATE_LIMIT_WINDOW
);
const mottoLimiter = new RateLimiter(5, 60000);
const dmLimiter = new RateLimiter(
    SOCIAL.DM_RATE_LIMIT_COUNT,
    SOCIAL.DM_RATE_LIMIT_WINDOW
);
const blockLimiter = new RateLimiter(
    SOCIAL.BLOCK_RATE_LIMIT_COUNT,
    SOCIAL.BLOCK_RATE_LIMIT_WINDOW
);
const respectLimiter = new RateLimiter(
    SOCIAL.RESPECT_RATE_LIMIT_COUNT,
    SOCIAL.RESPECT_RATE_LIMIT_WINDOW
);

async function isBlocked(guestIdA: number, guestIdB: number): Promise<boolean> {
    const block = await prisma.blockEntry.findFirst({
        where: {
            OR: [
                { blockerId: guestIdA, blockedId: guestIdB },
                { blockerId: guestIdB, blockedId: guestIdA },
            ],
        },
    });
    return !!block;
}

// All routes require guest authentication
socialRouter.use(resolveGuest as any);

// ────────────────────────── Profile Endpoints ──────────────────────────

// GET /profile/:guestId — player profile card data
socialRouter.get("/profile/:guestId", async (req: SocialRequest, res) => {
    try {
        const myId = req.guestId!;
        const targetId = parseInt(req.params.guestId as string, 10);

        if (isNaN(targetId)) {
            return res.status(400).json({ error: "Invalid guestId" });
        }

        const target = await prisma.account.findUnique({
            where: { id: targetId },
            select: { id: true, displayName: true, motto: true, createdAt: true, lastSeenAt: true, respectsReceived: true, twitterUsername: true, twitterAvatar: true, twitterVisible: true, authMethod: true, xp: true, level: true },
        });

        if (!target) {
            return res.status(404).json({ error: "Player not found" });
        }

        // Friend count
        const friendCount = await prisma.friendship.count({
            where: {
                status: "accepted",
                OR: [{ guestId: targetId }, { friendId: targetId }],
            },
        });

        // Friendship status with requester
        let isFriend = false;
        let hasPendingRequest = false;

        if (targetId !== myId) {
            const friendship = await prisma.friendship.findFirst({
                where: {
                    OR: [
                        { guestId: myId, friendId: targetId },
                        { guestId: targetId, friendId: myId },
                    ],
                },
            });
            if (friendship) {
                if (friendship.status === "accepted") {
                    isFriend = true;
                } else {
                    hasPendingRequest = true;
                }
            }
        }

        // Online status
        const threshold = new Date(Date.now() - SOCIAL.ONLINE_THRESHOLD_MS);
        const isOnline = target.lastSeenAt > threshold;

        let roomLabel: string | null = null;
        if (isOnline) {
            const session = await prisma.playerSession.findFirst({
                where: { guestId: targetId, leftAt: null },
                select: { roomName: true },
            });
            if (session) roomLabel = session.roomName;
        }

        // Block status
        const blocked = targetId !== myId ? await isBlocked(myId, targetId) : false;

        // Respect: has the requester already given respect to this player today?
        let hasGivenRespectToday = false;
        if (targetId !== myId) {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const existing = await prisma.respectLog.findFirst({
                where: { giverId: myId, receiverId: targetId, givenAt: { gte: todayStart } },
            });
            hasGivenRespectToday = !!existing;
        }

        // Twitter fields: self always sees everything; others only if twitterVisible
        const isSelf = targetId === myId;
        const showTwitter = isSelf || target.twitterVisible;

        res.json({
            guestId: target.id,
            displayName: target.displayName || `Guest${target.id}`,
            motto: target.motto,
            createdAt: target.createdAt.toISOString(),
            friendCount,
            isFriend,
            hasPendingRequest,
            isOnline,
            roomLabel,
            isBlocked: blocked,
            respectsReceived: target.respectsReceived,
            hasGivenRespectToday,
            xp: target.xp,
            level: target.level,
            twitterUsername: showTwitter ? target.twitterUsername : null,
            twitterAvatar: showTwitter ? target.twitterAvatar : null,
            ...(isSelf ? { twitterVisible: target.twitterVisible, authMethod: target.authMethod } : {}),
        });
    } catch (e) {
        console.error("[Social] GET /profile/:guestId error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// PUT /profile/motto — update own motto
socialRouter.put("/profile/motto", async (req: SocialRequest, res) => {
    try {
        const myId = req.guestId!;
        const { motto } = req.body;

        if (typeof motto !== "string") {
            return res.status(400).json({ error: "motto required" });
        }

        if (!mottoLimiter.isAllowed(String(myId))) {
            return res.status(429).json({ error: "Rate limited" });
        }

        const trimmed = motto.trim().substring(0, 60);

        await prisma.account.update({
            where: { id: myId },
            data: { motto: trimmed },
        });

        res.json({ motto: trimmed });
    } catch (e) {
        console.error("[Social] PUT /profile/motto error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// PUT /profile/twitter-visible — toggle Twitter profile visibility
socialRouter.put("/profile/twitter-visible", async (req: SocialRequest, res) => {
    try {
        const myId = req.guestId!;
        const { visible } = req.body;

        if (typeof visible !== "boolean") {
            return res.status(400).json({ error: "visible (boolean) required" });
        }

        if (!mottoLimiter.isAllowed(`tw-${myId}`)) {
            return res.status(429).json({ error: "Rate limited" });
        }

        // Only Twitter-authenticated users can toggle this
        const account = await prisma.account.findUnique({
            where: { id: myId },
            select: { authMethod: true },
        });
        if (!account || account.authMethod !== "twitter") {
            return res.status(403).json({ error: "Only Twitter accounts can toggle visibility" });
        }

        await prisma.account.update({
            where: { id: myId },
            data: { twitterVisible: visible },
        });

        res.json({ twitterVisible: visible });
    } catch (e) {
        console.error("[Social] PUT /profile/twitter-visible error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ────────────────────────── Friend Endpoints ──────────────────────────

// GET /friends — friend list + pending requests + online status
socialRouter.get("/friends", async (req: SocialRequest, res) => {
    try {
        const myId = req.guestId!;
        const threshold = new Date(Date.now() - SOCIAL.ONLINE_THRESHOLD_MS);

        // Accepted friendships (both directions)
        const friendships = await prisma.friendship.findMany({
            where: {
                status: "accepted",
                OR: [{ guestId: myId }, { friendId: myId }],
            },
            include: {
                guest: { select: { id: true, displayName: true, lastSeenAt: true } },
                friend: { select: { id: true, displayName: true, lastSeenAt: true } },
            },
        });

        // Collect all friend guestIds for batch query
        const friendGuestIds = friendships.map((f) =>
            f.guestId === myId ? f.friend.id : f.guest.id
        );

        // Single batch query for active sessions (N+1 fix)
        const activeSessions = friendGuestIds.length > 0
            ? await prisma.playerSession.findMany({
                where: { guestId: { in: friendGuestIds }, leftAt: null },
                select: { guestId: true, roomName: true },
            })
            : [];

        const roomMap = new Map<number, string>();
        for (const s of activeSessions) {
            if (s.guestId !== null) roomMap.set(s.guestId, s.roomName);
        }

        const friends = friendships.map((f) => {
            const other = f.guestId === myId ? f.friend : f.guest;
            const isOnline = other.lastSeenAt > threshold;
            const roomLabel = isOnline ? (roomMap.get(other.id) || null) : null;

            return {
                guestId: other.id,
                displayName: other.displayName || `Guest${other.id}`,
                isOnline,
                roomLabel,
            };
        });

        // Pending received
        const pendingReceived = await prisma.friendship.findMany({
            where: { friendId: myId, status: "pending" },
            include: {
                guest: { select: { id: true, displayName: true } },
            },
        });

        // Pending sent
        const pendingSent = await prisma.friendship.findMany({
            where: { guestId: myId, status: "pending" },
            include: {
                friend: { select: { id: true, displayName: true } },
            },
        });

        res.json({
            friends,
            pendingReceived: pendingReceived.map((f) => ({
                requestId: f.id,
                guestId: f.guest.id,
                displayName: f.guest.displayName || `Guest${f.guest.id}`,
            })),
            pendingSent: pendingSent.map((f) => ({
                requestId: f.id,
                guestId: f.friend.id,
                displayName: f.friend.displayName || `Guest${f.friend.id}`,
            })),
        });
    } catch (e) {
        console.error("[Social] GET /friends error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /friend-request — send friend request
socialRouter.post("/friend-request", async (req: SocialRequest, res) => {
    try {
        const myId = req.guestId!;
        const { targetGuestId } = req.body;

        if (!targetGuestId || typeof targetGuestId !== "number") {
            return res.status(400).json({ error: "targetGuestId required" });
        }

        if (targetGuestId === myId) {
            return res.status(400).json({ error: "Cannot add yourself" });
        }

        if (!friendRequestLimiter.isAllowed(String(myId))) {
            return res.status(429).json({ error: "Rate limited" });
        }

        // Block check
        if (await isBlocked(myId, targetGuestId)) {
            return res.status(403).json({ error: "Cannot send request to this player" });
        }

        // Check target exists
        const target = await prisma.account.findUnique({
            where: { id: targetGuestId },
        });
        if (!target) {
            return res.status(404).json({ error: "Player not found" });
        }

        // Check friend limit
        const friendCount = await prisma.friendship.count({
            where: {
                status: "accepted",
                OR: [{ guestId: myId }, { friendId: myId }],
            },
        });
        if (friendCount >= SOCIAL.MAX_FRIENDS) {
            return res.status(400).json({ error: "Friend limit reached" });
        }

        // Check existing friendship (either direction)
        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { guestId: myId, friendId: targetGuestId },
                    { guestId: targetGuestId, friendId: myId },
                ],
            },
        });

        if (existing) {
            if (existing.status === "accepted") {
                return res.status(400).json({ error: "Already friends" });
            }
            return res.status(400).json({ error: "Request already exists" });
        }

        const friendship = await prisma.friendship.create({
            data: { guestId: myId, friendId: targetGuestId },
        });

        // Real-time notification to target
        deliverToGuestId(targetGuestId, "friendRequest", {
            requestId: friendship.id,
            guestId: myId,
            displayName: req.guestName,
        });

        res.json({ requestId: friendship.id });
    } catch (e) {
        console.error("[Social] POST /friend-request error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /friend-request/respond — accept or reject
socialRouter.post("/friend-request/respond", async (req: SocialRequest, res) => {
    try {
        const myId = req.guestId!;
        const { requestId, accept } = req.body;

        if (!requestId || typeof requestId !== "number") {
            return res.status(400).json({ error: "requestId required" });
        }
        if (typeof accept !== "boolean") {
            return res.status(400).json({ error: "accept (boolean) required" });
        }

        const friendship = await prisma.friendship.findUnique({
            where: { id: requestId },
        });

        if (!friendship || friendship.friendId !== myId || friendship.status !== "pending") {
            return res.status(404).json({ error: "Request not found" });
        }

        if (accept) {
            // Check friend limits for both parties
            const [acceptorCount, requesterCount] = await Promise.all([
                prisma.friendship.count({
                    where: { status: "accepted", OR: [{ guestId: myId }, { friendId: myId }] },
                }),
                prisma.friendship.count({
                    where: {
                        status: "accepted",
                        OR: [{ guestId: friendship.guestId }, { friendId: friendship.guestId }],
                    },
                }),
            ]);
            if (acceptorCount >= SOCIAL.MAX_FRIENDS) {
                return res.status(400).json({ error: "You have reached the friend limit" });
            }
            if (requesterCount >= SOCIAL.MAX_FRIENDS) {
                return res.status(400).json({ error: "The other player has reached the friend limit" });
            }

            await prisma.friendship.update({
                where: { id: requestId },
                data: { status: "accepted" },
            });

            // Notify the requester
            deliverToGuestId(friendship.guestId, "friendRequestAccepted", {
                guestId: myId,
                displayName: req.guestName,
            });

            res.json({ status: "accepted" });
        } else {
            await prisma.friendship.delete({ where: { id: requestId } });
            res.json({ status: "rejected" });
        }
    } catch (e) {
        console.error("[Social] POST /friend-request/respond error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// DELETE /friend/:friendGuestId — remove friendship
socialRouter.delete("/friend/:friendGuestId", async (req: SocialRequest, res) => {
    try {
        const myId = req.guestId!;
        const friendGuestId = parseInt(req.params.friendGuestId as string, 10);

        if (isNaN(friendGuestId)) {
            return res.status(400).json({ error: "Invalid friendGuestId" });
        }

        await prisma.friendship.deleteMany({
            where: {
                OR: [
                    { guestId: myId, friendId: friendGuestId },
                    { guestId: friendGuestId, friendId: myId },
                ],
            },
        });

        res.json({ status: "removed" });
    } catch (e) {
        console.error("[Social] DELETE /friend error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /search?name=X — search players by name
socialRouter.get("/search", async (req: SocialRequest, res) => {
    try {
        const name = req.query.name as string;
        if (!name || name.trim().length < 1) {
            return res.json({ results: [] });
        }

        const results = await prisma.account.findMany({
            where: {
                displayName: { contains: name.trim(), mode: "insensitive" },
                id: { not: req.guestId! },
            },
            select: { id: true, displayName: true },
            take: 10,
        });

        res.json({
            results: results.map((r) => ({
                guestId: r.id,
                displayName: r.displayName || `Guest${r.id}`,
            })),
        });
    } catch (e) {
        console.error("[Social] GET /search error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ────────────────────────── Message Endpoints ──────────────────────────

// GET /messages?withGuestId=Y&limit=50 — conversation history
socialRouter.get("/messages", async (req: SocialRequest, res) => {
    try {
        const myId = req.guestId!;
        const withGuestId = parseInt(req.query.withGuestId as string, 10);
        const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);

        if (isNaN(withGuestId)) {
            return res.status(400).json({ error: "withGuestId required" });
        }

        const messages = await prisma.directMessage.findMany({
            where: {
                OR: [
                    { senderId: myId, receiverId: withGuestId },
                    { senderId: withGuestId, receiverId: myId },
                ],
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        res.json({
            messages: messages.reverse().map((m) => ({
                id: m.id,
                senderId: m.senderId,
                receiverId: m.receiverId,
                message: m.message,
                isRead: m.isRead,
                createdAt: m.createdAt.toISOString(),
            })),
        });
    } catch (e) {
        console.error("[Social] GET /messages error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /messages/unread — unread message counts per sender
socialRouter.get("/messages/unread", async (req: SocialRequest, res) => {
    try {
        const myId = req.guestId!;

        const unread = await prisma.directMessage.groupBy({
            by: ["senderId"],
            where: { receiverId: myId, isRead: false },
            _count: { id: true },
        });

        const counts: { [guestId: number]: number } = {};
        for (const u of unread) {
            counts[u.senderId] = u._count.id;
        }

        res.json({ unread: counts });
    } catch (e) {
        console.error("[Social] GET /messages/unread error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /messages/send — send direct message
socialRouter.post("/messages/send", async (req: SocialRequest, res) => {
    try {
        const myId = req.guestId!;
        const { targetGuestId, message } = req.body;

        if (!targetGuestId || typeof targetGuestId !== "number") {
            return res.status(400).json({ error: "targetGuestId required" });
        }
        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({ error: "message required" });
        }

        if (!dmLimiter.isAllowed(String(myId))) {
            return res.status(429).json({ error: "Rate limited" });
        }

        // Block check
        if (await isBlocked(myId, targetGuestId)) {
            return res.status(403).json({ error: "Cannot send message to this player" });
        }

        // Check friendship
        const friendship = await prisma.friendship.findFirst({
            where: {
                status: "accepted",
                OR: [
                    { guestId: myId, friendId: targetGuestId },
                    { guestId: targetGuestId, friendId: myId },
                ],
            },
        });

        if (!friendship) {
            return res.status(403).json({ error: "Must be friends to send messages" });
        }

        const trimmed = message.trim().substring(0, SOCIAL.MAX_DM_LENGTH);

        const dm = await prisma.directMessage.create({
            data: {
                senderId: myId,
                receiverId: targetGuestId,
                message: trimmed,
            },
        });

        // Try to deliver in real-time
        deliverToGuestId(targetGuestId, "directMessage", {
            id: dm.id,
            senderId: myId,
            senderName: req.guestName,
            message: trimmed,
            createdAt: dm.createdAt.toISOString(),
        });

        res.json({ id: dm.id });
    } catch (e) {
        console.error("[Social] POST /messages/send error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /messages/read — mark messages from sender as read
socialRouter.post("/messages/read", async (req: SocialRequest, res) => {
    try {
        const myId = req.guestId!;
        const { senderGuestId } = req.body;

        if (!senderGuestId || typeof senderGuestId !== "number") {
            return res.status(400).json({ error: "senderGuestId required" });
        }

        await prisma.directMessage.updateMany({
            where: {
                senderId: senderGuestId,
                receiverId: myId,
                isRead: false,
            },
            data: { isRead: true },
        });

        res.json({ status: "ok" });
    } catch (e) {
        console.error("[Social] POST /messages/read error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ────────────────────────── Block Endpoints ──────────────────────────

// POST /block — block a player
socialRouter.post("/block", async (req: SocialRequest, res) => {
    try {
        const myId = req.guestId!;
        const { targetGuestId } = req.body;

        if (!targetGuestId || typeof targetGuestId !== "number") {
            return res.status(400).json({ error: "targetGuestId required" });
        }
        if (targetGuestId === myId) {
            return res.status(400).json({ error: "Cannot block yourself" });
        }

        if (!blockLimiter.isAllowed(String(myId))) {
            return res.status(429).json({ error: "Rate limited" });
        }

        // Check target exists
        const target = await prisma.account.findUnique({
            where: { id: targetGuestId },
        });
        if (!target) {
            return res.status(404).json({ error: "Player not found" });
        }

        // Check already blocked
        const existing = await prisma.blockEntry.findUnique({
            where: { blockerId_blockedId: { blockerId: myId, blockedId: targetGuestId } },
        });
        if (existing) {
            return res.status(400).json({ error: "Already blocked" });
        }

        // Transaction: create block + remove friendship if exists
        await prisma.$transaction([
            prisma.blockEntry.create({
                data: { blockerId: myId, blockedId: targetGuestId },
            }),
            prisma.friendship.deleteMany({
                where: {
                    OR: [
                        { guestId: myId, friendId: targetGuestId },
                        { guestId: targetGuestId, friendId: myId },
                    ],
                },
            }),
        ]);

        res.json({ status: "blocked" });
    } catch (e) {
        console.error("[Social] POST /block error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// DELETE /block/:targetGuestId — unblock a player
socialRouter.delete("/block/:targetGuestId", async (req: SocialRequest, res) => {
    try {
        const myId = req.guestId!;
        const targetGuestId = parseInt(req.params.targetGuestId as string, 10);

        if (isNaN(targetGuestId)) {
            return res.status(400).json({ error: "Invalid targetGuestId" });
        }

        await prisma.blockEntry.deleteMany({
            where: { blockerId: myId, blockedId: targetGuestId },
        });

        res.json({ status: "unblocked" });
    } catch (e) {
        console.error("[Social] DELETE /block error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /blocks — list blocked players
socialRouter.get("/blocks", async (req: SocialRequest, res) => {
    try {
        const myId = req.guestId!;

        const blocks = await prisma.blockEntry.findMany({
            where: { blockerId: myId },
            include: {
                blocked: { select: { id: true, displayName: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json({
            blocks: blocks.map((b) => ({
                guestId: b.blocked.id,
                displayName: b.blocked.displayName || `Guest${b.blocked.id}`,
                blockedAt: b.createdAt.toISOString(),
            })),
        });
    } catch (e) {
        console.error("[Social] GET /blocks error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ────────────────────────── Respect Endpoints ──────────────────────────

// POST /respect — give respect to a player
socialRouter.post("/respect", async (req: SocialRequest, res) => {
    try {
        const myId = req.guestId!;
        const { targetGuestId } = req.body;

        if (!targetGuestId || typeof targetGuestId !== "number") {
            return res.status(400).json({ error: "targetGuestId required" });
        }
        if (targetGuestId === myId) {
            return res.status(400).json({ error: "Cannot give respect to yourself" });
        }

        if (!respectLimiter.isAllowed(String(myId))) {
            return res.status(429).json({ error: "Rate limited" });
        }

        // Block check
        if (await isBlocked(myId, targetGuestId)) {
            return res.status(403).json({ error: "Cannot give respect to this player" });
        }

        // Check target exists
        const target = await prisma.account.findUnique({
            where: { id: targetGuestId },
        });
        if (!target) {
            return res.status(404).json({ error: "Player not found" });
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Daily total limit check (across all players)
        const givenToday = await prisma.respectLog.count({
            where: { giverId: myId, givenAt: { gte: todayStart } },
        });
        if (givenToday >= SOCIAL.DAILY_RESPECT_LIMIT) {
            return res.status(400).json({ error: "Daily respect limit reached" });
        }

        // Already given to this player today?
        const alreadyGiven = await prisma.respectLog.findFirst({
            where: { giverId: myId, receiverId: targetGuestId, givenAt: { gte: todayStart } },
        });
        if (alreadyGiven) {
            return res.status(400).json({ error: "Already given respect to this player today" });
        }

        // Create log + increment counter
        await prisma.respectLog.create({
            data: { giverId: myId, receiverId: targetGuestId },
        });
        const updated = await prisma.account.update({
            where: { id: targetGuestId },
            data: { respectsReceived: { increment: 1 } },
        });

        // Real-time notification
        deliverToGuestId(targetGuestId, "respectReceived", {
            fromGuestId: myId,
            fromName: req.guestName,
        });

        res.json({ status: "ok", totalRespects: updated.respectsReceived });
    } catch (e) {
        console.error("[Social] POST /respect error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /respect/remaining — remaining daily respect count
socialRouter.get("/respect/remaining", async (req: SocialRequest, res) => {
    try {
        const myId = req.guestId!;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const givenToday = await prisma.respectLog.count({
            where: { giverId: myId, givenAt: { gte: todayStart } },
        });

        res.json({ remaining: SOCIAL.DAILY_RESPECT_LIMIT - givenToday });
    } catch (e) {
        console.error("[Social] GET /respect/remaining error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});
