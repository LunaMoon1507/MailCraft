# MailCraft extension

WXT + React + TypeScript + Tailwind CSS. Manifest V3, side panel UI.

## Setup

```bash
nvm use          # from the repo root; Node version is pinned in .nvmrc
cd extension
npm install
cp .env.example .env
```

## Run

```bash
npm run dev      # builds to .output/chrome-mv3-dev and opens Chrome with it loaded
```

Start the backend too (`cd express-backend && npm run dev`), then click the
MailCraft toolbar icon to open the side panel. It should show "Connected".

To load the build in your everyday Chrome instead: `chrome://extensions` →
Developer mode → Load unpacked → pick `extension/.output/chrome-mv3-dev`.

The extension ID is always `abnalcomdnkcdgmnplffokedaeabecgh` (pinned by `manifest.key` in
`wxt.config.ts`; Gmail sign-in depends on it). Don't generate your own key.
See the main README §9, "Extension ID & key".

Other scripts: `npm run build` (production build to `.output/chrome-mv3`),
`npm run zip` (zip for sharing), `npm run typecheck`.

## Layout

```
entrypoints/
  background.ts         service worker: opens the side panel on icon click
  sidepanel/            side panel page (index.html → main.tsx → App.tsx)
lib/api.ts              backend client (base URL from WXT_API_URL)
assets/tailwind.css     Tailwind import + theme tokens
wxt.config.ts           manifest: permissions, host permissions
```
