import { Router, type Request, type Response } from 'express';
import { prisma } from '../prisma.js';
import { getLoggedInUser } from './auth.js';

export const avatarRouter = Router();

function requireUser(req: Request, res: Response) {
    const user = getLoggedInUser(req);
    if (!user) {
        res.status(401).json({ error: 'Not logged in or session expired' });
        return null;
    }
    return { id: BigInt(user.sub), username: user.username };
}


// POST /api/friends { username }: add a friend (both directions at once)
avatarRouter.post('/', async (req: Request, res: Response) => {
    if (!req.body) {
        res.status(400).json({ error: "No request body"});
        return;
    }

    const keys = Object.keys(req.body)
    if (!keys.includes("newAvatar")) {
        res.status(400).json({
            message: "Missing new avatar number in body"
        });
    }

    const newAvatar = req.body.newAvatar;

    const me = requireUser(req, res);
    if (!me) return;

    try {
        const updatedUser = await prisma.users.update({
            where: {
                id: me.id,
            },
            data: {
                equipped_avatar: newAvatar,
            }
        })

        return res.status(200).json({
            newAvatar: updatedUser.equipped_avatar
        })

    }
    catch (error) {
        console.error('Error updating avatar', error);
        return res.status(500).json({ error: 'Could not update avatar, please try again.' });
    }
});
