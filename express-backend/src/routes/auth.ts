import Router, { type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";
import { type usersModel } from "../generated/prisma/models.js";
import { env } from "../config/env.js";
import { decode } from "punycode";
import { verify } from "crypto";

export const authRouter = Router();

const saltRounds = 10;

interface JWTToken {
  "sub": string,
  "username": string,
  "roles": string[],
  "type"?: "access" | "refresh",
  "iat": number,
  "exp": number
}

type ExpiresIn = NonNullable<jwt.SignOptions["expiresIn"]>;

// Issues a short-lived access token and a long-lived refresh token for a user.
function issueTokens(user: { id: bigint, username: string }) {
    const payload = {
        sub: user.id.toString(),
        username: user.username,
        roles: ['user'], // fix this if we add different user roles
    };
    const token = jwt.sign({ ...payload, type: "access" }, env.jwtSecret,
        { expiresIn: env.jwtAccessExpiresIn as ExpiresIn });
    const refreshToken = jwt.sign({ ...payload, type: "refresh" }, env.jwtRefreshSecret,
        { expiresIn: env.jwtRefreshExpiresIn as ExpiresIn });
    return { token, refreshToken };
}

// Returns the token's payload, or null if it is expired, tampered with or the wrong kind.
// jwt.verify throws on an expired token, so catch it here instead of crashing the request.
function verifyToken(token: string, kind: "access" | "refresh") {
    try {
        const secret = kind === "access" ? env.jwtSecret : env.jwtRefreshSecret;
        const payload = jwt.verify(token, secret) as JWTToken;
        // Never accept a refresh token as an access token (or vice versa).
        // Older access tokens have no "type", so only reject a mismatching one.
        if (kind === "refresh" ? payload.type !== "refresh" : payload.type === "refresh") {
            return null;
        }
        return payload;
    }
    catch {
        return null;
    }
}

export function getLoggedInUser(req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return null;
    }
    const token = authHeader.substring(7);
    return verifyToken(token, "access");
}

// Exchanges a valid refresh token for a new access token + refresh token.
// The extension calls this when an API request comes back 401.
authRouter.post("/refresh", async (_req: Request, res: Response) => {
    const refreshToken = _req.body?.refreshToken;
    if (typeof refreshToken !== "string") {
        res.status(400).json({ message: "refreshToken missing" });
        return;
    }
    const payload = verifyToken(refreshToken, "refresh");
    if (!payload) {
        res.status(401).json({ message: "Session expired, please log in" });
        return;
    }
    try {
        // Make sure the account still exists before handing out new tokens.
        const user = await prisma.users.findUnique({ where: { id: BigInt(payload.sub) } });
        if (!user) {
            res.status(401).json({ message: "Session expired, please log in" });
            return;
        }
        res.status(200).json(issueTokens(user));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Unexpected error, please try again" });
    }
})

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

        try {
            const user: usersModel = await prisma.users.findUniqueOrThrow({
                where: { username: username },
            });
            
            const isMatch = await bcrypt.compare(password, user.password_hash)
            if (!isMatch) {
                throw new Error(); // go to the catch block
            }
            console.log("Login success");
            res.status(200).json(issueTokens(user));
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
                const userStats = await prisma.userStats.create({data: {
                    user_id: user.id,
                    xp: 0,
                    highest_level: 1,
                    level: 1,
                    current_streak: 0,
                    longest_streak: 0,
                    best_day_count: 0,
                }})
                res.status(200).json(issueTokens(user));
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