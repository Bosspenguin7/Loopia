import { Request, Response, NextFunction } from "express";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD must be set in .env");
}

export function adminAuth(req: Request, res: Response, next: NextFunction) {
    const password = req.headers["x-admin-password"] as string;

    if (!password || password !== ADMIN_PASSWORD) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    next();
}
