import { Router, type Request, type Response } from "express";
import { prisma } from "../prisma.js";
import { processDailySettlement } from "./snapshots.js";

export const users = Router();

users.get("/", async (_req: Request, res: Response) => {
    try {
        const usersList = await prisma.users.findMany({ select: { username: true } });
        return res.json(usersList);
    }
    catch (error) {
        console.error("Failed to ping database", error);
        return res.status(500).json({error: "Failed to connect to database"});
    }
});

users.get("/:userId", async (req: Request, res: Response) => {
    const { userId } = req.params;
    const targetUserId = Array.isArray(userId) ? userId[0] : userId;
    if (!targetUserId) {
        return res.status(400).json({ error: "Invalid user ID." });
    }
    try {
        const bigIntUserId = BigInt(targetUserId);
        
        const stats = await prisma.$transaction(async (tx: any) => {
            const updatedStats = await processDailySettlement(bigIntUserId, tx);
            if (updatedStats) return updatedStats;
            return await tx.userStats.findUnique({
                where: { user_id: bigIntUserId },
            });
        });
        if (!stats) {
            return res.status(404).json({ error: "User not found." });
        }
        return res.status(200).json({
            userId: stats.user_id.toString(),
            xp: typeof stats.xp === 'bigint' ? Number(stats.xp) : (stats.xp ?? 0),
            level: stats.level ?? 1,
            currentStreak: stats.current_streak ?? 0,
            bestDayCount: stats.best_day_count ?? 0,
            bestDayDate: stats.best_day_date ?? null
        });
    } 
    catch (error) {
        console.error("Error fetching user profile and settling XP:", error);
        return res.status(500).json({ error: "Internal server error while fetching user profile." });
    }
});