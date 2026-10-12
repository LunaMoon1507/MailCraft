import { env } from './config/env.js';
import { createApp } from './app.js';
import { prisma } from './prisma.js';

createApp().listen(env.port, () => {
  console.log(`MailCraft API running at http://localhost:${env.port}`);
});



async function shutdown() {
  console.log("Stopping server");
  try {
    await prisma.$disconnect();
    console.log("Prisma disconnected.");
  }
  catch (error) {
    console.error("Error when disconnecting Prisma:", error);
  }
}

// close prisma connection on stopping server
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
