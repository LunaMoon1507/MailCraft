import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  // WXT's dev server defaults to port 3000, which is the backend's port.
  // Keep it on its own port so http://localhost:3000 always reaches the API.
  dev: {
    server: {
      port: 3100,
      origin: 'http://localhost:3100',
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'MailCraft',
    description: 'Turn inbox cleanup into a block-building game.',
    // Public key that pins the extension ID to abnalcomdnkcdgmnplffokedaeabecgh on every machine.
    // The Google OAuth client is tied to this ID. Not secret; do NOT regenerate
    // (see README §9 "Extension ID & key").
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1IoWSw7sGxKlHBoveamHw3ddcDB1UqDAu/9YE/X3XdIzoeHPTE1ATOBJJXCb3czA92ZO7yyk5NriCWGHItHekW98IY21VFhLufyoxOPfh/y1o7cNrHp2H4KxDnXJDwTTCQ4AheAqBSafRevLg/RxtVQeUly2mhhDdwIajVinMjElMkT4pQ2TpXbti+kCc8vvyL+btlxXncZe5uGnnCbLBHdTVThIYqylk6IrN2J1mKZDkAWOTn3xLclM/b8ltSuamEi4nHXleSZPBIhHBudduJVLi6lwfsZftO3neYpYbOlOIRMNzQjmJmxB3oUlp4fp6exJkwuaVIal82R9zseGiwIDAQAB',
    permissions: ['sidePanel'],
    // Lets extension pages call the API without CORS. Add the deployed
    // API origin here when the backend is hosted.
    host_permissions: ['http://localhost:3000/*'],
    action: {
      default_title: 'Open MailCraft',
    },
  },
});
