import express, { type Request, type Response } from 'express';
import { google } from 'googleapis';
import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const app = express();
const PORT = process.env.PORT || 3000;

async function pingDatabase() {
    const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL })
    })
    try {
        const users = await prisma.users.findMany();
        return users;
    }
    catch(e) {
        console.log(e);
        return "fail";
    }
}

app.get('/', (req, res)=> {
    res.send("Hello world!");
});

app.get('/api/test/', async (req, res) => {
    const data = await pingDatabase();
    res.send(data);
})

app.listen(PORT, () => {
    console.log(process.env.PORT)
    console.log(`Server running at localhost:${PORT}`);
});