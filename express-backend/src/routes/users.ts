import { Router } from "express";
import { prisma } from "../prisma.js"

export const users = Router();

users.get("/", async (_req, res) => {
    try {
        const users = await prisma.users.findMany({select: {username: true}});
        res.json(users);
    }
    catch (error) {
        console.error("Failed to ping database", error);
        res.status(500).json({error: "Failed to connect to database"})
    }
})