import { Router } from "express";
import crypto from "crypto";
import prisma from "../db/prisma";

export const twitterRouter = Router();

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID || "";
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET || "";

// Simple in-memory rate limiter: IP -> timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const timestamps = rateLimitMap.get(ip) || [];
    const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    if (recent.length >= RATE_LIMIT_MAX) return true;
    recent.push(now);
    rateLimitMap.set(ip, recent);
    return false;
}

// POST /api/auth/twitter/token
// Client sends: { code, code_verifier, redirect_uri }
// Server exchanges code for Twitter access token, fetches user info, creates/finds account
twitterRouter.post("/twitter/token", async (req, res) => {
    try {
        const ip = req.ip || "unknown";
        if (isRateLimited(ip)) {
            return res.status(429).json({ error: "Too many requests" });
        }

        const { code, code_verifier, redirect_uri } = req.body || {};

        if (!code || !code_verifier || !redirect_uri) {
            return res.status(400).json({ error: "code, code_verifier, and redirect_uri are required" });
        }

        if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
            console.error("[TwitterAuth] TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET not set");
            return res.status(500).json({ error: "Twitter auth not configured" });
        }

        // Exchange authorization code for access token
        const tokenParams = new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri,
            code_verifier,
            client_id: TWITTER_CLIENT_ID,
        });

        const basicAuth = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64");

        const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Basic ${basicAuth}`,
            },
            body: tokenParams.toString(),
        });

        if (!tokenRes.ok) {
            const errBody = await tokenRes.text();
            console.error("[TwitterAuth] Token exchange failed:", tokenRes.status, errBody);
            return res.status(401).json({ error: "Twitter token exchange failed" });
        }

        const tokenData = await tokenRes.json() as { access_token?: string };
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            return res.status(401).json({ error: "No access token received" });
        }

        // Fetch Twitter user info
        const userRes = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url", {
            headers: { "Authorization": `Bearer ${accessToken}` },
        });

        if (!userRes.ok) {
            const errBody = await userRes.text();
            console.error("[TwitterAuth] User info fetch failed:", userRes.status, errBody);
            return res.status(401).json({ error: "Failed to fetch Twitter user info" });
        }

        const userData = await userRes.json() as { data?: { id?: string; username?: string; profile_image_url?: string } };
        const twitterId = userData.data?.id;
        const twitterUsername = userData.data?.username;
        const twitterAvatar = userData.data?.profile_image_url || "";

        if (!twitterId || !twitterUsername) {
            return res.status(401).json({ error: "Invalid Twitter user data" });
        }

        // Find or create account by twitterId
        let guest = await prisma.account.findUnique({
            where: { twitterId },
        });

        if (guest) {
            // Update existing account
            guest = await prisma.account.update({
                where: { id: guest.id },
                data: {
                    twitterUsername,
                    twitterAvatar,
                    lastSeenAt: new Date(),
                },
            });
        } else {
            // Create new account linked to Twitter
            guest = await prisma.account.create({
                data: {
                    guestToken: crypto.randomUUID(),
                    displayName: twitterUsername,
                    twitterId,
                    twitterUsername,
                    twitterAvatar,
                    authMethod: "twitter",
                },
            });
        }

        return res.json({
            token: guest.guestToken,
            displayName: guest.displayName,
            guestId: guest.id,
            twitterUsername: guest.twitterUsername,
            twitterAvatar: guest.twitterAvatar,
        });
    } catch (e) {
        console.error("[TwitterAuth] POST /twitter/token error:", e);
        return res.status(500).json({ error: "Internal server error" });
    }
});
