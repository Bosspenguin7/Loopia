import { Router } from "express";
import { resolveGuest, SocialRequest } from "../social/socialAuth";
import { getBalance } from "./economyService";
import { getDailyLoginInfo } from "./dailyLoginService";
import prisma from "../db/prisma";

export const economyRouter = Router();

// All routes require guest authentication
economyRouter.use(resolveGuest as any);

// GET /balance — current balance
economyRouter.get("/balance", async (req: SocialRequest, res) => {
    try {
        const balance = await getBalance(req.guestId!);
        res.json(balance);
    } catch (e) {
        console.error("[Economy] GET /balance error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /daily-login — streak info
economyRouter.get("/daily-login", async (req: SocialRequest, res) => {
    try {
        const info = await getDailyLoginInfo(req.guestId!);
        res.json(info);
    } catch (e) {
        console.error("[Economy] GET /daily-login error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /transactions — recent transaction history
economyRouter.get("/transactions", async (req: SocialRequest, res) => {
    try {
        const currency = req.query.currency as string | undefined;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

        const where: any = { guestId: req.guestId! };
        if (currency === "loopi") {
            where.currency = currency;
        }

        const transactions = await prisma.currencyTransaction.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        res.json({ transactions });
    } catch (e) {
        console.error("[Economy] GET /transactions error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});
