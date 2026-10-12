import Router, { type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";
import { type usersModel } from "../generated/prisma/models.js";
import { env } from "../config/env.js";

export const authRouter = Router();

const saltRounds = 10;

authRouter.post("/login", async (_req: Request, res: Response) => {
    if (!_req.body) {
        res.status(400).json({ error: "No request body"});
        return;
    }
    const keys = Object.keys(_req.body)
    if (!keys.includes("username") || !keys.includes("password")) {
        res.status(400).json({
            message: "Username or password missing"
        });
    }
    else {
        const username = _req.body.username
        const password = _req.body.password
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log(username, hashedPassword);

        try {
            const user: usersModel = await prisma.users.findUniqueOrThrow({
                where: { username: username , password_hash: hashedPassword},
            });
            const token = jwt.sign(password, env.jwtSecret)
            res.status(200).json({'token': token});
        }
        catch {
            res.status(400).json({
                message: "Username or password didn't match"
            });
        }
    }
})


authRouter.post("/register", async (_req, res) => {    
    if (!_req.body) {
        res.status(400).json({ error: "No request body"});
        return;
    }
    const keys = Object.keys(_req.body)
    if (!keys.includes("username") || !keys.includes("password")) {
        res.status(400).json({
            message: "Username or password missing"
        });
    }
    else {
        const username:string = _req.body.username
        const password:string = _req.body.password
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log(username, hashedPassword);

        try {
            const users: usersModel[] = await prisma.users.findMany({
                where: { username: username },
            });
            if (users.length > 0) {
                res.status(400).json({
                    message: "That username is already taken"
                });
                return;
            }
            else {
                const ianaTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const user = await prisma.users.create({data: {
                    username: username,
                    password_hash: hashedPassword,
                    timezone: ianaTimeZone,
                }})
                const token = jwt.sign(password, env.jwtSecret)
                res.status(200).json({'token': token});
            }
        }
        catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Unexpected error, please try again"
            });
        }
    }
})