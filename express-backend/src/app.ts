import express from 'express';
import cors from 'cors';


import { healthRouter } from './routes/health.js';
import { users } from './routes/users.js';
import { pointsRouter } from './routes/points.js';
import { authRouter } from './routes/auth.js';
import { profileRouter } from './routes/profile.js';
import { friendsRouter } from './routes/friends.js';
import { avatarRouter } from './routes/avatar.js';
import { leaderboardRouter } from './routes/leaderboard.js';

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
  app.use('/api/points', pointsRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/profile', profileRouter);
  app.use('/api/friends', friendsRouter);
  app.use('/api/avatar', avatarRouter);
  app.use('/api/leaderboard', leaderboardRouter);
  return app;
}