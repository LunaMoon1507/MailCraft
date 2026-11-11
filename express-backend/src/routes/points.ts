import { Router, type Request, type Response } from 'express';
import { prisma } from '../prisma.js';

export const pointsRouter = Router();

// XP per email action (README §8). Also used to turn a PointHistory row's
// amount back into a number of emails for the best-day high score.
const POINTS_PER_ACTION: Record<string, number> = { ARCHIVE: 2, DELETE: 1, LABEL: 1 };

// README §8: level = floor(sqrt(xp / 10)) + 1
function levelForXp(xp: number) {
    return Math.floor(Math.sqrt(Math.max(0, xp) / 10)) + 1;
}

pointsRouter.post('/action', async (req: Request, res: Response) => {
    const { userId, actionType, count = 1 } = req.body;
    if (!userId || !actionType) {
        return res.status(400).json({ 
            error: 'Missing required fields: userId and actionType are required.' 
        });
    }
    const type = actionType.toUpperCase();
    if (type !== 'ARCHIVE' && type !== 'DELETE' && type !== 'LABEL') {
        return res.status(400).json({ 
            error: 'Invalid actionType. Allowed values are ARCHIVE, DELETE, or LABEL.' 
        });
    }
    
    const pointsPerAction = POINTS_PER_ACTION[type] ?? 1;

    const actionCount = Math.max(1, Number(count));
    const pointsToAdd = pointsPerAction * actionCount;

    try {
        const bigIntUserId = BigInt(userId);
        // Get today's date
        // (UTC for now; README §8 wants the user's own time zone)
        const todayDate = new Date();
        const startOfToday = new Date(todayDate);
        startOfToday.setUTCHours(0, 0, 0, 0);

        // No `tx: any` here: letting Prisma type `tx` means a model missing from
        // the generated client is a compile error instead of a runtime crash.
        const result = await prisma.$transaction(async (tx) => {
            await tx.pointHistory.create({
                data: {
                    user_id: bigIntUserId,
                    amount: pointsToAdd,
                    action: `EMAIL_${type}`,
                },
            });
            // Check/update today's high score
            let stats = await tx.userStats.findUnique({
                where: { user_id: bigIntUserId },
            });
            if (!stats) {
                // Default userStats
                stats = await tx.userStats.create({
                    data: {
                        user_id: bigIntUserId,
                        xp: 0,
                        level: 1,
                        highest_level: 1,
                        current_streak: 0,
                        longest_streak: 0,
                        best_day_count: 0,
                        best_day_date: todayDate,
                    },
                });
            }

            // Count all emails cleaned today (including this action, created above)
            // from the history, so actions spread over the day add up.
            const todaysActions = await tx.pointHistory.findMany({
                where: {
                    user_id: bigIntUserId,
                    created_at: { gte: startOfToday },
                    action: { startsWith: 'EMAIL_' },
                },
                select: { amount: true, action: true },
            });
            const todayCount = todaysActions.reduce((sum, row) => {
                const perAction = POINTS_PER_ACTION[row.action.replace('EMAIL_', '')] ?? 1;
                return sum + Math.round(row.amount / perAction);
            }, 0);

            let newBestCount = stats.best_day_count;
            let newBestDate = stats.best_day_date;
            if (todayCount > stats.best_day_count) {
                newBestCount = todayCount;
                newBestDate = todayDate;
            }

            // Level follows XP; highest_level never goes down (rewards stay unlocked)
            const newXp = stats.xp + pointsToAdd;
            const newLevel = levelForXp(newXp);

            // Update user stats
            const updatedUser = await tx.userStats.update({
                where: { user_id: bigIntUserId },
                data: { 
                    xp: newXp,
                    level: newLevel,
                    highest_level: Math.max(stats.highest_level, newLevel),
                    best_day_count: newBestCount,
                    best_day_date: newBestDate,
                },
                select: { user_id: true, xp: true, level: true, highest_level: true, best_day_count: true, best_day_date: true },
            });
            return updatedUser;
        });
        return res.status(200).json({
            success: true,
            awardedPoints: pointsToAdd,
            totalPoints: typeof result.xp === 'bigint' ? Number(result.xp) : result.xp,
            level: result.level,
            leveledUp: result.level > levelForXp(result.xp - pointsToAdd),
            bestDayCount: result.best_day_count,
            bestDayDate: result.best_day_date
        });
    } 
    catch (error: any) {
        console.error('Error awarding points & tracking high score:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'User not found.' });
        }
        return res.status(500).json({ error: 'Internal server error while processing points.' });
    }
});

pointsRouter.get('/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'Invalid user ID.' });
    }

    try {
        const stats = await prisma.userStats.findUnique({
            where: { user_id: BigInt(userId) },
            select: { user_id: true, xp: true, best_day_count: true, best_day_date: true },
        });

        if (!stats) {
            return res.status(404).json({ error: 'User not found.' });
        }

        return res.status(200).json({
            userId: stats.user_id.toString(),
            points: typeof stats.xp === 'bigint' ? Number(stats.xp) : (stats.xp ?? 0),
            bestDayCount: stats.best_day_count ?? 0,
            bestDayDate: stats.best_day_date
        });
    } catch (error) {
        console.error('Error fetching user points:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});