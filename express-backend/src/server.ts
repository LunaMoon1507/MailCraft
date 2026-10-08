import { env } from './config/env.js';
import { createApp } from './app.js';

createApp().listen(env.port, () => {
  console.log(`MailCraft API running at http://localhost:${env.port}`);
});
