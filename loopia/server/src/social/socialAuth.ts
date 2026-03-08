import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma";

export interface SocialRequest extends Request {
    guestId?: number;
    guestName?: string;
}

export async function resolveGuest(req: SocialRequest, res: Response, next: NextFunction) {
    const token = req.body?.token || req.query?.token;

    if (!token || typeof token !== "string") {
        return res.status(401).json({ error: "Token required" });
    }

    try {
        const guest = await prisma.account.findUnique({
            where: { guestToken: token },
        });

        if (!guest) {
            return res.status(401).json({ error: "Invalid token" });
        }

        req.guestId = guest.id;
        req.guestName = guest.displayName || `Guest${guest.id}`;
        next();
    } catch (e) {
        console.error("[SocialAuth] resolveGuest error:", e);
        return res.status(500).json({ error: "Internal server error" });
    }
}
