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
    permissions: ['sidePanel'],
    // Lets extension pages call the API without CORS. Add the deployed
    // API origin here when the backend is hosted.
    host_permissions: ['http://localhost:3000/*'],
    action: {
      default_title: 'Open MailCraft',
    },
  },
});
