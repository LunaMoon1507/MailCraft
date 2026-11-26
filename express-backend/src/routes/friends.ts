import { Router, type Request, type Response } from 'express';
import { prisma } from '../prisma.js';
import { getLoggedInUser } from './auth.js';

// Friends list (PBI #10 / SCRUM-41).
// Friendships are mutual and instant: adding someone writes two rows,
// (me, them) and (them, me), so both users see each other as friends.
export const friendsRouter = Router();

// Every friends route needs a logged-in user; the user id comes from the token.
function requireUser(req: Request, res: Response) {
    const user = getLoggedInUser(req);
    if (!user) {
        res.status(401).json({ error: 'Not logged in or session expired' });
        return null;
    }
    return { id: BigInt(user.sub), username: user.username };
}

function readUsername(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
}

// GET /api/friends: the logged-in user's friends, alphabetical
friendsRouter.get('/', async (req: Request, res: Response) => {
    const me = requireUser(req, res);
    if (!me) return;
    try {
        const rows = await prisma.friendship.findMany({
            where: { user_id: me.id },
            select: { created_at: true, friend: { select: { username: true, equipped_avatar: true } } },
            orderBy: { friend: { username: 'asc' } },
        });
        return res.json(rows.map((row) => ({ username: row.friend.username, since: row.created_at, avatar: row.friend.equipped_avatar })));
    }
    catch (error) {
        console.error('Error listing friends:', error);
        return res.status(500).json({ error: 'Could not load your friends list.' });
    }
});

// GET /api/friends/search?username=steve: exact username match only,
// so nobody can browse the full user list.
friendsRouter.get('/search', async (req: Request, res: Response) => {
    const me = requireUser(req, res);
    if (!me) return;
    const username = readUsername(req.query.username);
    if (!username) {
        return res.status(400).json({ error: 'Enter a username to search for.' });
    }
    try {
        const user = await prisma.users.findUnique({ where: { username }, select: { id: true, username: true, equipped_avatar: true } });
        if (!user) {
            return res.status(404).json({ error: `No user named "${username}".` });
        }
        const existing = await prisma.friendship.findUnique({
            where: { user_id_friend_id: { user_id: me.id, friend_id: user.id } },
        });
        return res.json({
            username: user.username,
            isSelf: user.id === me.id,
            isFriend: !!existing,
            avatar: user.equipped_avatar,
        });
    }
    catch (error) {
        console.error('Error searching users:', error);
        return res.status(500).json({ error: 'Search failed, please try again.' });
    }
});

// POST /api/friends { username }: add a friend (both directions at once)
friendsRouter.post('/', async (req: Request, res: Response) => {
    const me = requireUser(req, res);
    if (!me) return;
    const username = readUsername(req.body?.username);
    if (!username) {
        return res.status(400).json({ error: 'username is required.' });
    }
    try {
        const friend = await prisma.users.findUnique({ where: { username }, select: { id: true, username: true } });
        if (!friend) {
            return res.status(404).json({ error: `No user named "${username}".` });
        }
        if (friend.id === me.id) {
            return res.status(400).json({ error: "You can't add yourself as a friend." });
        }
        // skipDuplicates: if they're already friends (or one row exists), this is a no-op for that row
        const created = await prisma.friendship.createMany({
            data: [
                { user_id: me.id, friend_id: friend.id },
                { user_id: friend.id, friend_id: me.id },
            ],
            skipDuplicates: true,
        });
        if (created.count === 0) {
            return res.status(409).json({ error: `You're already friends with ${friend.username}.` });
        }
        return res.status(201).json({ username: friend.username });
    }
    catch (error) {
        console.error('Error adding friend:', error);
        return res.status(500).json({ error: 'Could not add friend, please try again.' });
    }
});

// DELETE /api/friends/:username: unfriend (removes it for both users)
friendsRouter.delete('/:username', async (req: Request, res: Response) => {
    const me = requireUser(req, res);
    if (!me) return;
    const username = readUsername(req.params.username);
    try {
        const friend = await prisma.users.findUnique({ where: { username }, select: { id: true } });
        if (!friend) {
            return res.status(404).json({ error: `No user named "${username}".` });
        }
        const deleted = await prisma.friendship.deleteMany({
            where: {
                OR: [
                    { user_id: me.id, friend_id: friend.id },
                    { user_id: friend.id, friend_id: me.id },
                ],
            },
        });
        if (deleted.count === 0) {
            return res.status(404).json({ error: `You aren't friends with ${username}.` });
        }
        return res.status(204).end();
    }
    catch (error) {
        console.error('Error removing friend:', error);
        return res.status(500).json({ error: 'Could not remove friend, please try again.' });
    }
});
