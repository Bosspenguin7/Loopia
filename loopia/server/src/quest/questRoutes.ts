import { Router } from "express";
import { resolveGuest, SocialRequest } from "../social/socialAuth";
import { QUEST } from "@shared/constants";
import {
    getActiveQuestsForScene,
    getQuestProgress,
    getAllQuestsWithProgress,
    getFishInventory,
    submitQuestLink,
    catchFish,
    completeFishingQuest,
} from "./questService";

export const questRouter = Router();

// Rate limit maps
const submitLimits = new Map<number, number[]>();
const catchLimits = new Map<number, number[]>();

function checkRateLimit(
    map: Map<number, number[]>,
    guestId: number,
    maxCount: number,
    windowMs: number
): boolean {
    const now = Date.now();
    const timestamps = (map.get(guestId) || []).filter(t => now - t < windowMs);
    if (timestamps.length >= maxCount) return false;
    timestamps.push(now);
    map.set(guestId, timestamps);
    return true;
}

// GET /api/quest/all-with-progress
questRouter.get("/all-with-progress", resolveGuest, async (req: SocialRequest, res) => {
    try {
        const data = await getAllQuestsWithProgress(req.guestId!);
        res.json(data);
    } catch (e: any) {
        console.error("[Quest] GET /all-with-progress error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/quest/available?sceneKey=X
questRouter.get("/available", resolveGuest, async (req: SocialRequest, res) => {
    try {
        const sceneKey = req.query.sceneKey as string;
        if (!sceneKey) {
            res.status(400).json({ error: "sceneKey is required" });
            return;
        }
        const quests = await getActiveQuestsForScene(sceneKey);
        res.json(quests);
    } catch (e: any) {
        console.error("[Quest] GET /available error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/quest/progress/:questId
questRouter.get("/progress/:questId", resolveGuest, async (req: SocialRequest, res) => {
    try {
        const questId = parseInt(req.params.questId as string);
        if (isNaN(questId)) {
            res.status(400).json({ error: "Invalid questId" });
            return;
        }
        const progress = await getQuestProgress(req.guestId!, questId);
        res.json(progress);
    } catch (e: any) {
        console.error("[Quest] GET /progress error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/quest/submit-link
questRouter.post("/submit-link", resolveGuest, async (req: SocialRequest, res) => {
    try {
        const guestId = req.guestId!;
        if (!checkRateLimit(submitLimits, guestId, QUEST.SUBMIT_RATE_LIMIT_COUNT, QUEST.SUBMIT_RATE_LIMIT_WINDOW)) {
            res.status(429).json({ error: "Too many submissions, slow down" });
            return;
        }

        const { questId, linkUrl } = req.body;
        if (!questId || !linkUrl) {
            res.status(400).json({ error: "questId and linkUrl are required" });
            return;
        }

        const submission = await submitQuestLink(guestId, questId, linkUrl);
        res.json({ success: true, submissionId: submission.id });
    } catch (e: any) {
        console.error("[Quest] POST /submit-link error:", e);
        res.status(400).json({ error: e.message || "Failed to submit link" });
    }
});

// GET /api/quest/fish-inventory
questRouter.get("/fish-inventory", resolveGuest, async (req: SocialRequest, res) => {
    try {
        const fish = await getFishInventory(req.guestId!);
        res.json(fish);
    } catch (e: any) {
        console.error("[Quest] GET /fish-inventory error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/quest/catch-fish
questRouter.post("/catch-fish", resolveGuest, async (req: SocialRequest, res) => {
    try {
        const guestId = req.guestId!;
        if (!checkRateLimit(catchLimits, guestId, QUEST.CATCH_RATE_LIMIT_COUNT, QUEST.CATCH_RATE_LIMIT_WINDOW)) {
            res.status(429).json({ error: "Too many attempts, slow down" });
            return;
        }

        const fish = await catchFish(guestId);
        res.json({ success: true, fishCount: fish.quantity });
    } catch (e: any) {
        console.error("[Quest] POST /catch-fish error:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/quest/complete-fishing
questRouter.post("/complete-fishing", resolveGuest, async (req: SocialRequest, res) => {
    try {
        const guestId = req.guestId!;
        const { questId } = req.body;
        if (!questId) {
            res.status(400).json({ error: "questId is required" });
            return;
        }

        const result = await completeFishingQuest(guestId, questId);
        res.json({ success: true, ...result });
    } catch (e: any) {
        console.error("[Quest] POST /complete-fishing error:", e);
        res.status(400).json({ error: e.message || "Failed to complete quest" });
    }
});
