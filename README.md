# MailCraft — Block game themed inbox cleanup
### Project Plan & Tech Stack

---

## 1. Concept

A Chrome extension (side panel UI) that turns inbox cleanup into a game. Users
authenticate with the app, connect their Gmail account, and earn XP, streaks,
and achievements for archiving, trashing, and labeling clutter. A lightweight
backend + database tracks each user's progress independently of Gmail itself.

---

## 2. Objective Checklist → Design Mapping

| Objective | How it's satisfied |
|---|---|
| User authentication | Self-built username/password auth (JWT + bcrypt) in the backend, separate from Google OAuth |
| Dynamic database of user/item data | PostgreSQL: User, UserStats, Achievement, UserAchievement, ActionLog, SenderCatalog, Friendship, DailySnapshot tables |
| Frontend–backend–database operation(s) | "Log cleanup action" flow: extension → Express API → Postgres → updated stats returned |
| Dataset with 100+ items | `SenderCatalog` seeded with 100+ known bulk-mail/newsletter domains (used to tag and prioritize the cleanup queue); `Achievement` seeded with 20–30 badges (can pad to 100 with tiered variants) |
| New user registration | `/api/auth/register` endpoint + Register screen in the side panel |
| Expected UI elements | Login, Register, Logout, Profile (level, stats, achievements grid) |
| Design aesthetics | Consistent Tailwind theme, custom color palette, Framer Motion micro-animations, iconography for achievements |
| Dynamic & responsive | SPA-style side panel (no reloads), live-updating XP bar/streak counter, layout adapts to panel resize |

---

## 3. Architecture

### 3.1 Architectural pattern

**Client–server system, with an MVC-style client, a layered monolithic
backend, and a shared database.**

| Part | Pattern | Why |
|---|---|---|
| Whole system | Client–server | Many clients (each tester's extension) operate on one shared database, which the leaderboard and friends features depend on. The split also keeps Gmail data off the server. |
| Chrome extension | MVC-style | React screens = View, Zustand stores = Model, hooks + service modules = Controller. |
| Backend | Layered monolith | One Express deployable split into API → business logic → data access → database. Each layer only calls the layer directly below it. Game rules are testable without HTTP or SQL. |
| Data | Shared database | One PostgreSQL database accessed through Prisma. Simple to maintain and fast; no cross-database consistency work. |

Microservices were considered and rejected. With 7 endpoint groups, one small
team, and free-tier hosting that sleeps, they would add cold starts, network
hops, and multiple databases to keep consistent, without any benefit at this
scale.

### 3.2 Layers

| Tier | Layer | Responsibility |
|---|---|---|
| Client | Presentation (View) | Screens, animations, layout. No business rules. |
| Client | State (Model) | Session, XP/level/streak, email queue. Optimistic updates. |
| Client | Client services (Controller) | All I/O: `ApiClient`, `GmailService`, `IdentityService`, `StorageService`, `SenderTagger`, `ActionOutbox` |
| Client | Background service worker | `chrome.alarms` end-of-day inbox snapshot, token refresh, messaging |
| Server | API | Express routers + middleware (JWT verify, validation, rate limit, CORS) |
| Server | Business logic | `AuthService`, `FriendService`, `LeaderboardService`, `GameEngine` (XP, level, streak, achievements, high scores, daily settlement) |
| Server | Data access | Prisma Client, repositories, migrations, seed scripts |
| Data | Database | PostgreSQL |

### 3.3 Overview diagram

```
┌──────────────────────────────────────────┐
│  CLIENT TIER · Chrome Extension (React)  │
│  View:       Side panel screens + UI kit │
│  Model:      Zustand stores              │
│  Controller: Services + hooks            │
│  Background: service worker (alarms)     │
└──────┬───────────────────────────┬───────┘
       │                           │  HTTPS · JSON · JWT
       │  OAuth token              │  (derived events only)
       ▼                           ▼
┌────────────────────┐   ┌──────────────────────────┐
│  Gmail REST API    │   │  SERVER TIER             │
│  (direct, OAuth    │   │  Node/Express monolith   │
│  via chrome.       │   │  ┌────────────────────┐  │
│  identity)         │   │  │ API layer (routes) │  │
│                    │   │  ├────────────────────┤  │
│ threads / modify / │   │  │ Business logic     │  │
│ trash / labels     │   │  │ (GameEngine, Auth) │  │
└────────────────────┘   │  ├────────────────────┤  │
                         │  │ Data access(Prisma)│  │
                         │  └─────────┬──────────┘  │
                         └────────────┼─────────────┘
                                      ▼
                             ┌─────────────────┐
                             │   PostgreSQL    │
                             │ (shared DB)     │
                             └─────────────────┘
```

**Key principle:** Gmail data never touches the backend. The extension calls
the Gmail API directly with a token from `chrome.identity.getAuthToken()`.
The backend only ever sees *derived* events ("user archived thread X") and one
number per day (the inbox unread count at 11:59pm), never message content. This keeps
users on the unverified/testing OAuth tier (up to 100 test users, no CASA fee)
while still using the real Gmail API.

### 3.4 Reliability rules

- **Offline / sleeping backend:** the free-tier host can sleep, so the
  extension queues cleanup actions in an `ActionOutbox` (in
  `chrome.storage.local`) and syncs them when the API responds. Gmail
  actions never wait on the backend.
- **No server-side timers:** nothing depends on the server being awake at a
  given time. End-of-day bonuses are settled lazily (see §8).
- **MV3 service worker:** can be stopped at any time, so scheduled client
  work uses `chrome.alarms`, not `setTimeout`/`setInterval`.

---

## 4. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Extension framework | WXT | Manifest V3 scaffolding, hot reload |
| UI | React + TypeScript + Tailwind CSS | Side panel + popup views |
| Animation | Framer Motion | Level-ups, card swipes, streak effects |
| State | Zustand | Local UI/game state |
| Local persistence | `chrome.storage.local` | Cache profile, session token, action outbox |
| Scheduling (client) | `chrome.alarms` | 11:59pm inbox snapshot |
| Gmail access | Gmail REST API + `chrome.identity` | Client-side OAuth, no server involvement |
| Backend | Node.js + Express | REST API for auth & game data |
| Validation / abuse | zod + express-rate-limit | Request validation, per-user rate limits |
| ORM | Prisma | Type-safe DB access, migrations, seed scripts |
| Database | PostgreSQL (Neon or Supabase free tier) | Persistent, real relational DB |
| Auth | JWT (access token) + bcrypt (password hashing) | Self-implemented, not a third-party auth provider |
| Hosting (beta) | Render or Fly.io free tier | Zero cost for a small friend group |

---

## 5. Data Model (Postgres via Prisma)

**User**
- id, username (unique), password_hash, timezone (IANA, e.g. `America/New_York`), created_at

**UserStats**
- user_id (FK), xp, level, current_streak, longest_streak, last_active_date,
  best_day_count, best_day_date

**Achievement** (seed data, 20–30 base badges padded to 100 with tiers)
- id, name, description, icon, criteria_type, criteria_value
- *(e.g., "Archive 50 emails", "3-day streak", "Clear 100 emails from bulk senders")*

**UserAchievement**
- user_id (FK), achievement_id (FK), unlocked_at

**ActionLog**
- id, user_id (FK), action_type (archive/trash/label), gmail_thread_id,
  from_bulk_sender (bool), xp_awarded, created_at
- Unique constraint on (user_id, gmail_thread_id, action_type), so the same action
  can't earn XP twice
- *Stores only metadata about the action, never email content*

**SenderCatalog** (seed data, 100+ rows)
- id, domain (unique), display_name, category (newsletter/promotions/social/notifications)

**Friendship**
- requester_id (FK), addressee_id (FK), status (pending/accepted), created_at

**DailySnapshot**
- user_id (FK), day (date, user's time zone), unread_count, settled (bool), xp_delta
- Unique on (user_id, day)

---

## 6. Core API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/register` | POST | Create new user account (username, password, timezone) |
| `/api/auth/login` | POST | Authenticate, issue JWT |
| `/api/auth/logout` | POST | Invalidate session (client discards token; optional server-side blocklist) |
| `/api/account` | DELETE | Delete account and all related rows (cascading delete) |
| `/api/profile` | GET | Fetch stats, level, achievements (also settles any unsettled days) |
| `/api/actions` | POST | Log a cleanup action `{type, threadId, fromBulkSender}`, then award XP, check achievement unlocks, and update streak and high score. **The client never sends an XP amount.** |
| `/api/achievements` | GET | List all achievements + unlock status |
| `/api/senders` | GET | Bulk-sender catalog (cached by the extension to tag the queue) |
| `/api/snapshots` | POST | Record end-of-day inbox unread count `{day, unreadCount}` |
| `/api/friends` | GET / POST | List friends / send a friend request by username |
| `/api/friends/:id` | PATCH / DELETE | Accept a request / remove a friend |
| `/api/leaderboard` | GET | Ranked list of the user + accepted friends |

All routes except register/login require a valid JWT and are rate-limited per user.

---

## 7. UI Screens (Side Panel)

1. **Login** — username/password fields, "Register" link
2. **Register** — username, password (time zone detected automatically)
3. **Connect Gmail** — one-time OAuth consent via `chrome.identity`; also shown
   again if Google asks the user to re-consent
4. **Cleanup Game View** (main screen) — email queue (bulk senders tagged and
   sorted first), swipe/click actions, live XP bar, streak flame icon
5. **Profile** — level, total XP, streak, best day, achievements grid
6. **Leaderboard** — friend rankings, add friend by username, pending requests
7. **Settings** — logout, disconnect Gmail, delete account

---

## 8. Gamification Mechanics

All XP is calculated **on the server** by the `GameEngine`. The client only
reports what happened.

- **XP per action:** archive = 2xp, trash = 1xp, label = 1xp
  - "Delete" in the UI moves the thread to Gmail Trash (recoverable for 30
    days). Permanent deletion would require the full `mail.google.com` scope.
- **Streaks:** a streak day is a **calendar day in the user's time zone** with at
  least one XP-earning action. Missing a full calendar day resets
  `current_streak` to 0. (Replaces the earlier "24H with no XP gain" rule,
  which conflicted with the daily-session rule.)
- **Achievements:** unlock achievements for lifetime emails cleaned, daily streaks,
  number cleaned per amount of time, bulk-sender emails cleared, etc. Evaluated
  after every action from the `Achievement` table's `criteria_type` /
  `criteria_value`.
- **Levels:** `level = floor(sqrt(xp / 10)) + 1`, which gives level 1 at 0 XP,
  level 2 at 10 XP, level 4 at 90 XP and level 11 at 1,000 XP. Levels unlock
  new character options. (Replaces `10(log(xp)+9)`, which gave level 90 at
  1 XP and was undefined at 0 XP.)
- **High scores:** track personal best for most emails cleaned in a single day
  (`best_day_count`, `best_day_date`).
- **End-of-day inbox bonus:** the XP change is based on the inbox's unread count at 11:59pm in
  the user's time zone. The tiers don't overlap:

  | Unread in inbox | XP change |
  |---|---|
  | 0–5 | +100 |
  | 6–10 | +50 |
  | 11–49 | −10 |
  | 50+ | −50 |

  - **How it works:** the extension's service worker fires a `chrome.alarms`
    alarm at 11:59pm, reads the INBOX label's unread count from Gmail, and
    posts it to `/api/snapshots`. On the next authenticated request after
    midnight, `DailySettlement` applies the XP change for any unsettled days
    and marks them settled. The server never needs to be awake at 11:59pm.
  - **No snapshot** (browser closed at 11:59pm): no XP change for that day.
  - XP never drops below 0.
- **Leaderboard:** add friends by username; the leaderboard ranks you and your
  accepted friends by emails cleaned.

### 8.1 Anti-cheat (friend-beta level)
- Server computes XP from `action_type`; the client cannot send an XP amount.
- Unique (user_id, gmail_thread_id, action_type) constraint prevents replaying
  the same action.
- Per-user rate limit on `/api/actions` (e.g. 60 requests/minute).
- One snapshot per user per day (unique constraint).

---

## 9. OAuth / Distribution Notes

- Register a Google Cloud project, enable the Gmail API, set OAuth consent
  screen to **Testing** mode.
- Add your friends' Google accounts as **test users** (up to 100). This
  avoids Google's app verification and the CASA security assessment entirely.
- Testing-mode apps may ask users to re-consent periodically; the Connect
  Gmail screen handles this.
- For beta distribution, share the extension as an **unpacked build**
  (friends load it via `chrome://extensions` → Developer Mode → Load
  Unpacked), or publish **Unlisted** on the Chrome Web Store. Neither path
  requires Gmail-scope verification. That requirement is tied to OAuth
  consent screen status, not extension distribution method.
- Required Gmail scope: **`gmail.modify` only**. It covers reading, archiving
  (removing the INBOX label), labeling, and moving to Trash. `gmail.readonly`
  is redundant with it. Avoid `mail.google.com` (full access); it isn't
  needed since "delete" means Trash.

---

## 10. Build Order / Milestones

1. **Scaffold**: extension shell (WXT) + Express/Prisma backend skeleton with
   the layered folder structure (`routes/`, `services/`, `repositories/`)
2. **Auth loop**: register/login/logout/delete account working end-to-end with JWT
3. **Gmail connection**: OAuth via `chrome.identity`, fetch + list a batch of emails
4. **Core loop**: archive/trash/label action → `/api/actions` → XP update → UI
   reflects it (with optimistic update + action outbox)
5. **Profile + achievements**: seed `Achievement` and `SenderCatalog` data,
   wire up unlock logic and bulk-sender tagging
6. **Daily systems**: streaks in user time zone, high scores, end-of-day
   snapshot alarm + lazy settlement
7. **Social + polish**: friends, leaderboard, animations, theming
8. **Friend beta**: add testers in Google Cloud Console, share unpacked build
   or unlisted listing

---

## 11. Design Change Log

| Change | Reason |
|---|---|
| Named the architecture pattern (§3.1) | Client–server + MVC client + layered monolith + shared DB |
| Removed unsubscribe feature | Gmail API has no unsubscribe endpoint. It would need `List-Unsubscribe` parsing plus extra host permissions or `gmail.send` |
| Repurposed `SenderCatalog` | Still the 100+ item dataset; now tags and prioritizes bulk mail in the cleanup queue |
| Added `DailySnapshot` + `/api/snapshots` + lazy settlement | End-of-day bonus needs the unread count, which the backend never sees; free-tier host may be asleep at 11:59pm |
| Made the end-of-day tiers non-overlapping | The old ≤10 / ≤5 and >10 / ≥50 rules overlapped |
| Replaced level formula | `10(log(xp)+9)` gave level 90 at 1 XP and was undefined at 0 XP |
| Server-side XP + unique constraint + rate limit | Client-reported actions could be faked or replayed |
| Added `Friendship` + `/api/friends` | Leaderboard promised "add friends" with no supporting table/endpoint |
| Streaks use calendar days in user time zone; added `User.timezone` | "Missed day" and "24H no XP" rules conflicted |
| Added label XP value (1xp) | Label was a listed action with no XP value |
| Added `DELETE /api/account` | Settings screen had "delete account" with no endpoint |
| "Delete" = move to Trash; scopes reduced to `gmail.modify` | Permanent delete needs full-access scope; `gmail.readonly` was redundant |
| Added `ActionOutbox` | Game keeps working while the backend is asleep or offline |
