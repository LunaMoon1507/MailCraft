import { Router, type Request, type Response } from 'express';
import { prisma } from '../prisma.js';
import { getLoggedInUser } from './auth.js';

export const leaderboardRouter = Router();

// Count Archive, Delete, and Label actions as email cleaned.
const CLEANED_ACTIONS = ['EMAIL_ARCHIVE', 'EMAIL_DELETE', 'EMAIL_LABEL'];
leaderboardRouter.get('/', async (req: Request, res: Response) => {
    // Check whether the user is logged in. If not, return a 401 Unauthorized response.
    const user = getLoggedInUser(req);
    if (!user) {
        return res.status(401).json({ error: 'Not logged in or session expired' });
    }
    try {
        const currentUserId = BigInt(user.sub);
        // Get the list of friends for the current user.
        const friendships = await prisma.friendship.findMany({
            where: {
                user_id: currentUserId,
            },
            select: {
                friend_id: true,
            },
        });
        const userIds = [
            currentUserId,
            ...friendships.map((friendship) => friendship.friend_id),
        ];

        // Get usernames and avatars.
        const users = await prisma.users.findMany({
            where: {
                id: { in: userIds },
            },
            select: {
                id: true,
                username: true,
                equipped_avatar: true,
            },
        });

        // Calculate total XPs.
        const history = await prisma.pointHistory.groupBy({
            by: ['user_id', 'action'],
            where: {
                user_id: { in: userIds },
                action: { in: CLEANED_ACTIONS},
            },
            _sum: {
                amount: true,
            },
        });

        // Convert XPs into the number of emails cleaned per user.
        const count = new Map<string, number>();
        for (const record of history) {
            const userId = record.user_id.toString();
            const points = record._sum.amount ?? 0;
            // Archive = 2 points, Delete = 1 point, Label = 1 point.
            const emailsCleaned = record.action === 'EMAIL_ARCHIVE' ? points / 2 : points;
            const previousCount = count.get(userId) ?? 0;
            count.set(userId, previousCount + emailsCleaned);
        }

        // Leaderboard entries.
        const leaderboard = users.map(account => ({
            userId: account.id.toString(),
            username: account.username,
            avatar: account.equipped_avatar,
            emailsCleaned: count.get(account.id.toString()) ?? 0,
            isCurrentUser: account.id === currentUserId,
        }));

        // Sort by emails cleaned in descending order.
        leaderboard.sort((a, b) => b.emailsCleaned - a.emailsCleaned || a.username.localeCompare(b.username));

        // Assign ranks based on sorted order.
        // Users with the same number of emails cleaned will have the same rank.
        let currentRank = 0;
        for (let i = 0; i < leaderboard.length; i++) {
            const current=leaderboard[i];
            const previous = leaderboard[i - 1];
            if (!current) {
                continue;
            }
            if (i === 0 || current.emailsCleaned !== previous?.emailsCleaned) {
                currentRank = i + 1;
            }
            Object.assign(current, { rank: currentRank });
        }
        return res.status(200).json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return res.status(500).json({ error: 'Internal server error while fetching leaderboard.' });
    }
});

