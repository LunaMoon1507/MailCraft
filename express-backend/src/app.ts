import express from 'express';
import cors from 'cors';


import { healthRouter } from './routes/health.js';
import { users } from './routes/users.js';
import { authRouter } from './routes/auth.js';
import { profileRouter } from './routes/profile.js';

export function createApp() {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };


  const app = express();
  app.use(cors({
    origin: "chrome-extension://ahamhadjcabohgiholipggoijpeekdgp",
    credentials: true,
  }));
  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/users', users);
  app.use('/api/auth', authRouter);
  app.use('/api/profile', profileRouter);

  return app;
}
