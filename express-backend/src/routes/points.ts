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
    if (type !== 'ARCHIVE' && type !== 'DELETE') {
        return res.status(400).json({ 
            error: 'Invalid actionType. Allowed values are ARCHIVE or DELETE.' 
        });
    }

    const pointsPerAction = type === 'DELETE' ? 1 : 2;
    const pointsToAdd = pointsPerAction * Math.max(1, Number(count));

    try {
        const bigIntUserId = BigInt(userId);
        const result = await prisma.$transaction(async (tx) => {
            // Record in PointHistory
            await tx.pointHistory.create({
                data: {
                    user_id: bigIntUserId,
                    amount: pointsToAdd,
                    action: `EMAIL_${type}`,
                },
            });

            // Increment user points
            const updatedUser = await tx.userStats.update({
                where: { user_id: bigIntUserId },
                data: { xp: { increment: pointsToAdd } },
                select: { user_id: true, xp: true },
            });

            return updatedUser;
        });

        return res.status(200).json({
            success: true,
            awardedPoints: pointsToAdd,
            totalPoints: typeof result.xp === 'bigint' ? Number(result.xp) : result.xp
        });

    } catch (error: any) {
        console.error('Error awarding points:', error);
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
            select: { user_id: true, xp: true },
        });

        if (!stats) {
            return res.status(404).json({ error: 'User not found.' });
        }

        return res.status(200).json({
            userId: stats.user_id.toString(),
            points: typeof stats.xp === 'bigint' ? Number(stats.xp) : (stats.xp ?? 0)
        });
    } catch (error) {
        console.error('Error fetching user points:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});