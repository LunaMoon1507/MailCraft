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
        const result = await prisma.$transaction(async (tx: any) => {
            // Record in PointHistory
            await tx.pointHistory.create({
                data: {
                    user_id: bigIntUserId,
                    amount: pointsToAdd,
                    action: `EMAIL_${type}`,
                },
            });

            // Increment user points
            const updatedUser = await tx.users.update({
                where: { id: bigIntUserId },
                data: { points: { increment: pointsToAdd } },
                select: { id: true, points: true },
            });

            return updatedUser;
        });

        return res.status(200).json({
            success: true,
            awardedPoints: pointsToAdd,
            totalPoints: typeof result.points === 'bigint' ? Number(result.points) : result.points
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
        const user = await prisma.users.findUnique({
            where: { id: BigInt(userId) },
            select: { id: true, points: true },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        return res.status(200).json({
            userId: user.id.toString(),
            points: typeof user.points === 'bigint' ? Number(user.points) : (user.points ?? 0)
        });
    } catch (error) {
        console.error('Error fetching user points:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});