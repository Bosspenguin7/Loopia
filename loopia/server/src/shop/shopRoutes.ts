import { Router } from "express";
import { resolveGuest, SocialRequest } from "../social/socialAuth";
import { RateLimiter } from "../utils/RateLimiter";
import { getShopItems, getInventory, purchaseItemWithAvax } from "./shopService";
import { SHOP } from "@shared/constants";

export const shopRouter = Router();

const purchaseLimiter = new RateLimiter(SHOP.PURCHASE_RATE_LIMIT_COUNT, SHOP.PURCHASE_RATE_LIMIT_WINDOW);

// All routes require guest authentication
shopRouter.use(resolveGuest as any);

// GET /items — list active shop items
shopRouter.get("/items", async (_req: SocialRequest, res) => {
    try {
        const items = await getShopItems();
        res.json(items);
    } catch (e) {
        console.error("[Shop] GET /items error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /inventory — get user's inventory
shopRouter.get("/inventory", async (req: SocialRequest, res) => {
    try {
        const guestId = req.guestId!;
        const inventory = await getInventory(guestId);
        res.json(inventory);
    } catch (e) {
        console.error("[Shop] GET /inventory error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /purchase — buy an item with AVAX
shopRouter.post("/purchase", async (req: SocialRequest, res) => {
    try {
        const guestId = req.guestId!;

        if (!purchaseLimiter.isAllowed(String(guestId))) {
            return res.status(429).json({ error: "Rate limited. Try again later." });
        }

        const { itemId } = req.body;
        if (!itemId || typeof itemId !== "number") {
            return res.status(400).json({ error: "itemId is required (number)" });
        }

        const result = await purchaseItemWithAvax(guestId, itemId);
        res.json(result);
    } catch (e: any) {
        console.error("[Shop] POST /purchase error:", e);
        const message = e.message || "Purchase failed";
        // Return user-friendly errors as 400, server errors as 500
        const isUserError = message.includes("not found") || message.includes("already own") ||
            message.includes("No wallet") || message.includes("Insufficient");
        res.status(isUserError ? 400 : 500).json({ error: message });
    }
});
