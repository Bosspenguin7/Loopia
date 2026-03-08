import { Router } from "express";
import prisma from "../db/prisma";
import { resolveGuest, SocialRequest } from "../social/socialAuth";
import { RateLimiter } from "../utils/RateLimiter";
import { generateWallet, getAvaxBalance, getGasPrice, sendAvax } from "./walletService";
import { SHOP } from "@shared/constants";

export const walletRouter = Router();

const createLimiter = new RateLimiter(10, 60000);  // 10 req/min
const infoLimiter = new RateLimiter(30, 60000);     // 30 req/min
const withdrawLimiter = new RateLimiter(SHOP.WITHDRAW_RATE_LIMIT_COUNT, SHOP.WITHDRAW_RATE_LIMIT_WINDOW);

// All routes require guest authentication
walletRouter.use(resolveGuest as any);

// POST /create — generate a new wallet for the authenticated user
walletRouter.post("/create", async (req: SocialRequest, res) => {
    try {
        const guestId = req.guestId!;

        if (!createLimiter.isAllowed(String(guestId))) {
            return res.status(429).json({ error: "Rate limited" });
        }

        // Check if user already has a wallet
        const existing = await prisma.account.findUnique({
            where: { id: guestId },
            select: { walletAddress: true },
        });

        if (existing?.walletAddress) {
            return res.status(400).json({ error: "Wallet already exists" });
        }

        const { address, encryptedKey } = generateWallet();

        await prisma.account.update({
            where: { id: guestId },
            data: { walletAddress: address, encryptedKey },
        });

        console.log(`[Wallet] Created wallet for guest ${guestId}: ${address}`);
        res.json({ address });
    } catch (e) {
        console.error("[Wallet] POST /create error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /info — get wallet address and AVAX balance (or null if no wallet)
walletRouter.get("/info", async (req: SocialRequest, res) => {
    try {
        const guestId = req.guestId!;

        if (!infoLimiter.isAllowed(String(guestId))) {
            return res.status(429).json({ error: "Rate limited" });
        }

        const guest = await prisma.account.findUnique({
            where: { id: guestId },
            select: { walletAddress: true },
        });

        if (!guest?.walletAddress) {
            return res.json({ address: null, avaxBalance: "0" });
        }

        let avaxBalance = "0";
        let gasPrice = "0";
        try {
            [avaxBalance, gasPrice] = await Promise.all([
                getAvaxBalance(guest.walletAddress),
                getGasPrice(),
            ]);
        } catch (e) {
            console.warn("[Wallet] Failed to fetch wallet data:", e);
        }

        res.json({ address: guest.walletAddress, avaxBalance, gasPrice });
    } catch (e) {
        console.error("[Wallet] GET /info error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /withdraw — send AVAX to an external address
walletRouter.post("/withdraw", async (req: SocialRequest, res) => {
    try {
        const guestId = req.guestId!;

        if (!withdrawLimiter.isAllowed(String(guestId))) {
            return res.status(429).json({ error: "Rate limited. Try again later." });
        }

        const { toAddress, amount } = req.body;

        if (!toAddress || typeof toAddress !== "string") {
            return res.status(400).json({ error: "toAddress is required" });
        }
        if (!amount || typeof amount !== "string" || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: "Valid amount is required" });
        }

        const guest = await prisma.account.findUnique({
            where: { id: guestId },
            select: { walletAddress: true, encryptedKey: true },
        });

        if (!guest?.walletAddress || !guest?.encryptedKey) {
            return res.status(400).json({ error: "No wallet found" });
        }

        const result = await sendAvax(guest.walletAddress, guest.encryptedKey, toAddress, amount);
        res.json(result);
    } catch (e: any) {
        console.error("[Wallet] POST /withdraw error:", e);
        const message = e.message || "Withdraw failed";
        const isUserError = message.includes("Invalid") || message.includes("Insufficient");
        res.status(isUserError ? 400 : 500).json({ error: message });
    }
});
