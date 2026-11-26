import { Router } from "express";
import { prisma } from "../prisma.js"
import { getLoggedInUser } from "./auth.js";

export const profileRouter = Router();

profileRouter.get("/", async (_req, res) => {
    const token = getLoggedInUser(_req)
    if (!token) {
        res.status(401).json({ error: "Not logged in or session expired" });
        return;
    }
    try {
        // reset streak to 0 if user didn't have any points added since yesterday
        const todayDate = new Date();
        const startOfToday = new Date(todayDate);
        startOfToday.setUTCHours(0, 0, 0, 0);
        const startofYesterday = new Date(startOfToday.getTime() - (1000*60*60*24))
        
        const yesterdaysActions = await prisma.pointHistory.findMany({
                where: {
                    user_id: BigInt(token.sub),
                    created_at: { gte: startofYesterday},
                    action: { startsWith: 'EMAIL_' },
                },
                select: { amount: true, action: true },
            });

        if (yesterdaysActions.length < 1) {
            await prisma.userStats.update({
                where: {
                    user_id: BigInt(token.sub)
                },
                data: {
                    current_streak: 0
                }
            })
        }

        const user = await prisma.users.findUniqueOrThrow({
            select: {username: true, equipped_avatar: true, userStats: true}, where: {username: token.username}});
        res.json(user);
    }
    catch (error) {
        console.error("No user found", error);
        res.status(500).json({error: "No user found"})
    }
})