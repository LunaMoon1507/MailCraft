import express from 'express';
import { healthRouter } from './routes/health.js';
import { users } from './routes/users.js';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/users', users);

  return app;
}
