import { Router } from "express";
import { resolveGuest, SocialRequest } from "../social/socialAuth";
import { RateLimiter } from "../utils/RateLimiter";
import { getCafeItems, getCafeInventory, purchaseCafeItem, consumeCafeItem } from "./cafeShopService";
import { SHOP } from "@shared/constants";

export const cafeShopRouter = Router();

const purchaseLimiter = new RateLimiter(SHOP.PURCHASE_RATE_LIMIT_COUNT, SHOP.PURCHASE_RATE_LIMIT_WINDOW);

// All routes require guest authentication
cafeShopRouter.use(resolveGuest as any);

// GET /items — cafe menu
cafeShopRouter.get("/items", async (_req: SocialRequest, res) => {
    try {
        const items = await getCafeItems();
        res.json(items);
    } catch (e) {
        console.error("[CafeShop] GET /items error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /inventory — user's cafe inventory
cafeShopRouter.get("/inventory", async (req: SocialRequest, res) => {
    try {
        const guestId = req.guestId!;
        const inventory = await getCafeInventory(guestId);
        res.json(inventory);
    } catch (e) {
        console.error("[CafeShop] GET /inventory error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /purchase — buy a cafe item with Loopi
cafeShopRouter.post("/purchase", async (req: SocialRequest, res) => {
    try {
        const guestId = req.guestId!;

        if (!purchaseLimiter.isAllowed(String(guestId))) {
            return res.status(429).json({ error: "Rate limited. Try again later." });
        }

        const { itemId } = req.body;
        if (!itemId || typeof itemId !== "number") {
            return res.status(400).json({ error: "itemId is required (number)" });
        }

        const result = await purchaseCafeItem(guestId, itemId);
        res.json(result);
    } catch (e: any) {
        console.error("[CafeShop] POST /purchase error:", e);
        const message = e.message || "Purchase failed";
        const isUserError = message.includes("not found") || message.includes("Insufficient") ||
            message.includes("no Loopi price");
        res.status(isUserError ? 400 : 500).json({ error: message });
    }
});

// POST /consume — use a cafe item
cafeShopRouter.post("/consume", async (req: SocialRequest, res) => {
    try {
        const guestId = req.guestId!;
        const { itemId } = req.body;

        if (!itemId || typeof itemId !== "number") {
            return res.status(400).json({ error: "itemId is required (number)" });
        }

        const result = await consumeCafeItem(guestId, itemId);
        res.json(result);
    } catch (e: any) {
        console.error("[CafeShop] POST /consume error:", e);
        const message = e.message || "Consume failed";
        const isUserError = message.includes("not in inventory");
        res.status(isUserError ? 400 : 500).json({ error: message });
    }
});
