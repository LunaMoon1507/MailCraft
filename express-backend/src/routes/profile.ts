import { Router } from "express";
import { prisma } from "../prisma.js"
import { getLoggedInUser } from "./auth.js";

export const profileRouter = Router();

profileRouter.get("/", async (_req, res) => {
    const token = getLoggedInUser(_req)
    if (!token) {
        res.status(401);
        return;
    }
    try {
        const user = await prisma.users.findUniqueOrThrow({
            select: {username: true, userStats: true}, where: {username: token.username}});
        res.json(user);
    }
    catch (error) {
        console.error("No user found", error);
        res.status(500).json({error: "No user found"})
    }
})