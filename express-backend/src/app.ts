import express from 'express';
import cors from 'cors';


import { healthRouter } from './routes/health.js';
import { users } from './routes/users.js';
import { authRouter } from './routes/auth.js';

export function createApp() {
  const app = express();
  app.use(cors({
    origin: "chrome-extension://ahamhadjcabohgiholipggoijpeekdgp",
    credentials: true,
  }));
  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/users', users);
  app.use('/api/auth', authRouter);

  return app;
}
