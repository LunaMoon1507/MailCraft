import { Router, type Request, type Response } from 'express';
import { prisma } from '../prisma.js';

export const pointsRouter = Router();

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
    
    let pointsPerAction = 1;
    if (type === 'ARCHIVE') {
        pointsPerAction = 2;
    } 
    else if (type === 'DELETE' || type === 'LABEL') {
        pointsPerAction = 1;
    }
    
    const actionCount = Math.max(1, Number(count));
    const pointsToAdd = pointsPerAction * actionCount;

    try {
        const bigIntUserId = BigInt(userId);
        // Get today's date
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const todayDate = new Date();

        const result = await prisma.$transaction(async (tx: any) => {
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

            // Calculate today's total cleaned emails & compare
            const storedDateStr = stats.best_day_date ? new Date(stats.best_day_date).toISOString().split('T')[0] : '';
            let newBestCount = stats.best_day_count;
            let newBestDate = stats.best_day_date;
            if (storedDateStr === todayStr) {
                // If the best day is already today
                const currentDayTotal = stats.best_day_count + actionCount;
                if (currentDayTotal > stats.best_day_count) {
                    newBestCount = currentDayTotal;
                    newBestDate = todayDate;
                }
            } 
            else {
                // If it's a new day
                if (actionCount > stats.best_day_count) {
                    newBestCount = actionCount;
                    newBestDate = todayDate;
                }
            }
            // Update user stats
            const updatedUser = await tx.userStats.update({
                where: { user_id: bigIntUserId },
                data: { 
                    xp: { increment: pointsToAdd },
                    best_day_count: newBestCount,
                    best_day_date: newBestDate,
                },
                select: { user_id: true, xp: true, best_day_count: true, best_day_date: true },
            });
            return updatedUser;
        });
        return res.status(200).json({
            success: true,
            awardedPoints: pointsToAdd,
            totalPoints: typeof result.xp === 'bigint' ? Number(result.xp) : result.xp,
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