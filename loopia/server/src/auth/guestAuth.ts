import { Router } from "express";
import crypto from "crypto";
import prisma from "../db/prisma";

export const guestRouter = Router();

// POST /api/auth/guest — authenticate or create guest
guestRouter.post("/guest", async (req, res) => {
    try {
        const { token } = req.body || {};

        // If token provided, try to find existing guest
        if (token && typeof token === "string") {
            const guest = await prisma.account.findUnique({
                where: { guestToken: token },
            });

            if (guest) {
                // Update lastSeenAt
                await prisma.account.update({
                    where: { id: guest.id },
                    data: { lastSeenAt: new Date() },
                });

                return res.json({
                    token: guest.guestToken,
                    displayName: guest.displayName,
                    guestId: guest.id,
                });
            }
        }

        // No valid token — create new guest
        const newToken = crypto.randomUUID();
        const guest = await prisma.account.create({
            data: { guestToken: newToken },
        });

        return res.json({
            token: guest.guestToken,
            displayName: guest.displayName,
            guestId: guest.id,
        });
    } catch (e) {
        console.error("[GuestAuth] POST /guest error:", e);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// PUT /api/auth/guest/name — update display name
guestRouter.put("/guest/name", async (req, res) => {
    try {
        const { token, displayName } = req.body || {};

        if (!token || typeof token !== "string") {
            return res.status(400).json({ error: "Token required" });
        }

        if (!displayName || typeof displayName !== "string") {
            return res.status(400).json({ error: "displayName required" });
        }

        const sanitized = displayName.trim().substring(0, 15);

        const guest = await prisma.account.findUnique({
            where: { guestToken: token },
        });

        if (!guest) {
            return res.status(404).json({ error: "Guest not found" });
        }

        await prisma.account.update({
            where: { id: guest.id },
            data: { displayName: sanitized },
        });

        return res.json({ displayName: sanitized });
    } catch (e) {
        console.error("[GuestAuth] PUT /guest/name error:", e);
        return res.status(500).json({ error: "Internal server error" });
    }
});
