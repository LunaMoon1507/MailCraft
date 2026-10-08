# MailCraft — Block game themed inbox cleanup

# Project Setup
## Backend server
Install Node.js if needed and install dependencies in the root and express-backend folders:

```bash
npm i
cd express-backend
npm i
```

### .env setup and installing dependencies
In the root directory, create a .env file containing these contents
```
PORT=3000
GOOGLE_CLIENT_ID={insert client id}
GOOGLE_CLIENT_SECRET={insert client secret}
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
API_KEY={insert API key}
DIRECT_URL="postgresql://postgres.bgyxdmbomguuwcguazdj:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:5432/postgres"
DATABASE_URL=postgresql://postgres.bgyxdmbomguuwcguazdj:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:5432/postgres
```

Also cd into the express-backend folder and create another .env with this (used for the prisma commands):
```
# Connect to Postgres via the shared session-mode pooler (used for migrations)
DIRECT_URL="postgresql://postgres.bgyxdmbomguuwcguazdj:[INSERT PASSWORD HERE]@aws-1-us-west-2.pooler.supabase.com:5432/postgres"
```

Then, run `npx prisma generate` in the express-backend folder. Rerun after making migrations.

## DB
To get the schema, run `npx prisma db pull` in the express-backend folder
To make database migrations after changing the schema, run `npx prisma migrate dev` in the express-backend folder

## Running
You can run `npm run start` in the root folder to start the Express server on port 3000.

### Project Plan & Tech Stack

---

## 1. Concept

A Chrome extension (side panel UI) that turns inbox cleanup into a game. Users
authenticate with the app, connect their Gmail account, and earn XP, streaks,
and achievements for archiving, deleting, labeling, and unsubscribing from
clutter. A lightweight backend + database tracks each user's progress
independently of Gmail itself.

---

## 2. Objective Checklist → Design Mapping

| Objective | How it's satisfied |
|---|---|
| User authentication | Self-built email/password auth (JWT + bcrypt) in the backend, separate from Google OAuth |
| Dynamic database of user/item data | PostgreSQL: Users, UserStats, Achievements, SenderCatalog, UserAchievements, ActionLog tables |
| Frontend–backend–database operation(s) | "Log cleanup action" flow: extension → Express API → Postgres → updated stats returned |
| Dataset with 100+ items | `SenderCatalog` seeded with 100+ known bulk-mail/newsletter domains; `Achievements` seeded with 20–30 badges (can pad to 100 with tiered variants) |
| New user registration | `/api/auth/register` endpoint + Register screen in the side panel |
| Expected UI elements | Login, Register, Logout, Profile (level, stats, achievements grid) |
| Design aesthetics | Consistent Tailwind theme, custom color palette, Framer Motion micro-animations, iconography for achievements |
| Dynamic & responsive | SPA-style side panel (no reloads), live-updating XP bar/streak counter, layout adapts to panel resize |

---

## 3. Architecture Overview

```
┌─────────────────────────────┐
│   Chrome Extension (React)  │
│  Side Panel UI + Animations │
└─────────────┬────────────────┘
              │
   ┌──────────┴───────────┐
   │                       │
   ▼                       ▼
┌────────────────┐   ┌───────────────────┐
│  Gmail REST API │   │  Backend API │
│ (direct, OAuth  │   │  (Node/Express)   │
│  via chrome.    │   │                    │
│  identity)      │   │  /auth/register    │
│                 │   │  /auth/login        │
│ archive/delete/ │   │  /profile           │
│ search/label    │   │  /actions (log XP)  │
└────────────────┘   │  /leaderboard        │
                      └─────────┬────────────┘
                                ▼
                        ┌───────────────┐
                        │  PostgreSQL    │
                        │  (Prisma ORM)  │
                        └───────────────┘
```

**Key principle:** Gmail data never touches the backend. The extension calls
the Gmail API directly with a token from `chrome.identity.getAuthToken()`.
Backend only ever sees *derived* events ("user archived an email") and
own account data — not message content. This keeps users on the
unverified/testing OAuth tier (up to 100 test users, no CASA fee) while still
using the real Gmail API.

---

## 4. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Extension framework | WXT | Manifest V3 scaffolding, hot reload |
| UI | React + TypeScript + Tailwind CSS | Side panel + popup views |
| Animation | Framer Motion | Level-ups, card swipes, streak effects |
| State | Zustand | Local UI/game state |
| Local persistence | `chrome.storage.local` | Cache profile/session token |
| Gmail access | Gmail REST API + `chrome.identity` | Client-side OAuth, no server involvement |
| Backend | Node.js + Express | REST API for auth & game data |
| ORM | Prisma | Type-safe DB access, migrations |
| Database | PostgreSQL (Neon or Supabase free tier) | Persistent, real relational DB |
| Auth | JWT (access token) + bcrypt (password hashing) | Self-implemented, not a third-party auth provider |
| Hosting (beta) | Render or Fly.io free tier | Zero cost for a small friend group |

---

## 5. Data Model (Postgres via Prisma)

**User**
- id, username, password_hash, created_at

**UserStats**
- user_id (FK), xp, level, current_streak, longest_streak, last_active_date

**Achievement** (seed data, 100+ rows)
- id, name, description, icon, criteria_type, criteria_value
- *(e.g., "Archive 50 emails", "3-day streak", "Unsubscribe from 10 senders")*

**UserAchievement**
- user_id (FK), achievement_id (FK), unlocked_at

**ActionLog**
- id, user_id (FK), action_type (archive/delete/label/unsubscribe), gmail_thread_id, xp_awarded, created_at
- *Stores only metadata about the action, never email content*

---

## 6. Core API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/register` | POST | Create new user account |
| `/api/auth/login` | POST | Authenticate, issue JWT |
| `/api/auth/logout` | POST | Invalidate session (client discards token; optional server-side blocklist) |
| `/api/profile` | GET | Fetch stats, level, achievements |
| `/api/actions` | POST | Log a cleanup action, award XP, check achievement unlocks, update streak |
| `/api/achievements` | GET | List all achievements + unlock status |
| `/api/leaderboard` | GET | Ranked XP list among beta friend group |

---

## 7. UI Screens (Side Panel)

1. **Login** — username/password fields, "Register" link
2. **Register** — username, password
3. **Connect Gmail** — one-time OAuth consent via `chrome.identity`
4. **Cleanup Game View** (main screen) — email queue, swipe/click actions, live XP bar, streak flame icon
5. **Profile** — level, total XP, streak, achievements grid
6. **Leaderboard** — friend group rankings
7. **Settings** — logout, delete account

---

## 8. Gamification Mechanics

- **XP per action:** archive = 2xp, delete = 1xp, unsubscribe = 5xp
- **Streaks:** daily cleanup session maintains streak; missed day (24H no XP gain) resets it
- **Achievements:** unlock achievements for lifetime emails cleaned, daily streaks, number cleaned per amount of time, etc.
- **Levels:** XP thresholds (follows formula level = 10(log(xp)+9) unlock new character options
- **High scores:** Set new personal high scores for most emails cleaned in a day
- **End of day XP boosts:** can gain or lose XP at the end of each day (11:59pm) depending on # unread emails in inbox
  - Each day with <=10 emails unread in inbox gains 50xp
  - Each day with <=5 emails unread in inbox gains 100xp
  - Each day with >10 emails unread in inbox loses 10xp
  - Each day with >=50 emails unread loses 50xp
- **Leaderboard:** add friends to see a leaderboard of most emails cleaned


---

## 9. OAuth / Distribution Notes

- Register a Google Cloud project, enable the Gmail API, set OAuth consent
  screen to **Testing** mode.
- Add your friends' Google accounts as **test users** (up to 100) — this
  avoids Google's app verification and the CASA security assessment entirely.
- For beta distribution, share the extension as an **unpacked build**
  (friends load it via `chrome://extensions` → Developer Mode → Load
  Unpacked), or publish **Unlisted** on the Chrome Web Store. Neither path
  requires Gmail-scope verification — that requirement is tied to OAuth
  consent screen status, not extension distribution method.
- Required Gmail scopes: `gmail.readonly`, `gmail.modify` (covers archive/
  label), `gmail.labels`. Avoid requesting `mail.google.com` (full access) —
  it's unnecessary for this use case.

---

## 10. Build Order / Milestones

1. **Scaffold** — extension shell (WXT) + Express/Prisma backend skeleton
2. **Auth loop** — register/login/logout working end-to-end with JWT
3. **Gmail connection** — OAuth via `chrome.identity`, fetch + list a batch of emails
4. **Core loop** — archive/delete action → `/api/actions` → XP update → UI reflects it
5. **Profile + achievements** — seed `Achievement` and `SenderCatalog` data, wire up unlock logic
6. **Polish** — animations, theming, streaks, leaderboard
7. **Friend beta** — add testers in Google Cloud Console, share unpacked build or unlisted listing

