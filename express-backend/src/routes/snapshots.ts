import { Router, type Request, type Response } from 'express';
import { prisma } from '../prisma.js';

export const snapshotsRouter = Router();

// Calculate XP change
export function calculateBonusXP(unreadCount: number): number {
    if (unreadCount <= 5) return 100;
    if (unreadCount <= 10) return 50;
    if (unreadCount <= 49) return -10;
    return -50; 
}

// Settlement runner function called during authenticated user requests
export async function processDailySettlement(bigIntUserId: bigint, tx: any) {
    const stats = await tx.userStats.findUnique({
        where: { user_id: bigIntUserId },
    });

    if (!stats) return null;

    const unsettledSnapshots = await tx.snapshot.findMany({
        where: { 
            user_id: bigIntUserId, 
            settled: false 
        },
        orderBy: { date: 'asc' }
    }).catch(() => []);

    if (!unsettledSnapshots || unsettledSnapshots.length === 0) {
        return stats;
    }

    let currentXp = typeof stats.xp === 'bigint' ? Number(stats.xp) : (stats.xp ?? 0);

    // Apply XP changes
    for (const snap of unsettledSnapshots) {
        const xpChange = calculateBonusXP(snap.unread_count);
        
        // Ensure total XP never drops below 0
        currentXp = Math.max(0, currentXp + xpChange);

        // Mark snapshot as settled
        await tx.snapshot.update({
            where: { id: snap.id },
            data: { settled: true }
        });

        // Record history
        await tx.pointHistory.create({
            data: {
                user_id: bigIntUserId,
                amount: xpChange,
                action: 'DAILY_INBOX_BONUS',
            },
        });
    }

    // Update userStats
    return await tx.userStats.update({
        where: { user_id: bigIntUserId },
        data: { xp: currentXp },
    });
}

// Called by extension chrome.alarm at 11:59 PM
snapshotsRouter.post('/', async (req: Request, res: Response) => {
    const { userId, unreadCount, date } = req.body;

    if (!userId || unreadCount === undefined || !date) {
        return res.status(400).json({ error: 'Missing required fields: userId, unreadCount, and date.' });
    }

    try {
        const bigIntUserId = BigInt(userId);
        const parsedCount = Number(unreadCount);
        const snapshotDate = new Date(date);

        const result = await prisma.$transaction(async (tx: any) => {
            // Check user stats
            let stats = await tx.userStats.findUnique({
                where: { user_id: bigIntUserId },
            });

            if (!stats) {
                return null;
            }

            // Record the daily snapshot as unsettled
            const snapshot = await tx.snapshot.create({
                data: {
                    user_id: bigIntUserId,
                    unread_count: parsedCount,
                    date: snapshotDate,
                    settled: false,
                },
            });

            return { success: true, snapshotId: snapshot.id };
        });

        if (!result) {
            return res.status(404).json({ error: 'User not found.' });
        }

        return res.status(200).json({ success: true, message: 'Snapshot recorded.' });
    } catch (error) {
        console.error('Error handling snapshot:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});