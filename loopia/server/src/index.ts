import "dotenv/config";
import { Server, matchMaker } from "colyseus";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import { GameRoom } from "./rooms/GameRoom";
import { CafeRoom } from "./rooms/CafeRoom";
import { BearsAndSalmonRoom } from "./rooms/BearsAndSalmonRoom";
import { ApartmentRoom } from "./rooms/ApartmentRoom";
import { AvalabsRoom } from "./rooms/AvalabsRoom";
import { GrottoRoom } from "./rooms/GrottoRoom";
import { SecondMapRoom } from "./rooms/SecondMapRoom";
import { monitor } from "@colyseus/monitor";
import prisma from "./db/prisma";
import { adminRouter } from "./admin/adminRoutes";
import { adminAuth } from "./admin/adminAuth";
import { guestRouter } from "./auth/guestAuth";
import { twitterRouter } from "./auth/twitterAuth";
import { socialRouter } from "./social/socialRoutes";
import { economyRouter } from "./economy/economyRoutes";
import { walletRouter } from "./wallet/walletRoutes";
import { shopRouter } from "./shop/shopRoutes";
import { cafeShopRouter } from "./shop/cafeShopRoutes";
import { questRouter } from "./quest/questRoutes";
import { ROOM_TYPES } from "@shared/constants";

// Global error handlers — prevent server crash on unhandled errors
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

const port = 2567;
const app = express();

app.use(cors({
  origin: ["https://play.loopia.world", "http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
}));
app.use("/api/auth", express.json(), guestRouter);
app.use("/api/auth", express.json(), twitterRouter);
app.use("/api/social", express.json(), socialRouter);
app.use("/api/economy", express.json(), economyRouter);
app.use("/api/wallet", express.json(), walletRouter);
app.use("/api/shop", express.json(), shopRouter);
app.use("/api/cafe", express.json(), cafeShopRouter);
app.use("/api/quest", express.json(), questRouter);

const gameServer = new Server({
  server: createServer(app),
});

gameServer.define(ROOM_TYPES.GAME, GameRoom).filterBy(['roomLabel']);
gameServer.define(ROOM_TYPES.CAFE, CafeRoom).filterBy(['roomLabel']);
gameServer.define(ROOM_TYPES.BEARS, BearsAndSalmonRoom).filterBy(['roomLabel']);
gameServer.define(ROOM_TYPES.APARTMENT, ApartmentRoom).filterBy(['roomLabel']);
gameServer.define(ROOM_TYPES.AVALABS, AvalabsRoom).filterBy(['roomLabel']);
gameServer.define(ROOM_TYPES.GROTTO, GrottoRoom).filterBy(['roomLabel']);
gameServer.define(ROOM_TYPES.SECONDMAP, SecondMapRoom).filterBy(['roomLabel']);

app.get("/api/rooms", async (_req, res) => {
    try {
        // Get active rooms from DB
        const dbRooms = await prisma.room.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
        });

        // Get live room data from matchMaker
        const liveRooms = await matchMaker.query({});
        const liveLookup = new Map<string, number>();
        for (const lr of liveRooms) {
            const label = lr.metadata?.roomLabel;
            if (label) {
                liveLookup.set(label, (liveLookup.get(label) || 0) + lr.clients);
            }
        }

        res.json(dbRooms.map(r => ({
            roomLabel: r.name,
            displayName: r.displayName,
            clients: liveLookup.get(r.name) || 0,
            maxClients: r.maxClients,
            roomType: r.roomType,
            sceneKey: r.sceneKey,
        })));
    } catch (e) {
        console.error("[API] /api/rooms error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Admin API routes
app.use("/admin/api", express.json(), adminAuth, adminRouter);

// Serve admin panel static files
// __dirname in compiled output is lib/server/src/, admin-dist is at server root
const serverRoot = path.resolve(__dirname, "../../..");
app.use("/admin", express.static(path.join(serverRoot, "admin-dist")));
app.get("/admin/{*path}", (_req, res) => {
    res.sendFile(path.join(serverRoot, "admin-dist/index.html"));
});

// HTTP Basic Auth for Colyseus Monitor panel
if (!process.env.MONITOR_USER || !process.env.MONITOR_PASS) {
    throw new Error("MONITOR_USER and MONITOR_PASS must be set in .env");
}
const MONITOR_USER: string = process.env.MONITOR_USER;
const MONITOR_PASS: string = process.env.MONITOR_PASS;

function basicAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Basic ")) {
        res.set("WWW-Authenticate", 'Basic realm="Colyseus Monitor"');
        res.status(401).send("Authentication required");
        return;
    }

    const [user, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");

    const userMatch = crypto.timingSafeEqual(Buffer.from(user), Buffer.from(MONITOR_USER));
    const passMatch = crypto.timingSafeEqual(Buffer.from(pass), Buffer.from(MONITOR_PASS));

    if (!userMatch || !passMatch) {
        res.set("WWW-Authenticate", 'Basic realm="Colyseus Monitor"');
        res.status(401).send("Invalid credentials");
        return;
    }

    next();
}

app.use("/colyseus", basicAuthMiddleware, monitor());

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);

// Clean up orphan sessions from previous server runs (leftAt still null)
prisma.playerSession.updateMany({
  where: { leftAt: null },
  data: { leftAt: new Date() },
}).then((result) => {
  if (result.count > 0) {
    console.log(`[Startup] Cleaned ${result.count} orphan session(s)`);
  }
}).catch((e) => {
  console.error('[Startup] Failed to clean orphan sessions:', e);
});

// Graceful shutdown — notify clients and dispose rooms before exit
const shutdown = () => {
  console.log('[Server] Graceful shutdown initiated...');
  gameServer.gracefullyShutdown().then(() => {
    console.log('[Server] Shutdown complete.');
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
