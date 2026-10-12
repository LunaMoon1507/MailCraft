import { env } from "./config/env.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const connectionString = env.databaseUrl;
const adapter = new PrismaPg({ connectionString })

export const prisma = new PrismaClient({ adapter });