# 🪙 CoinDrop Rewards

A full-stack **MERN** (MongoDB, Express, React, Node.js) rewarded-video points
app. Visitors land on a marketing homepage, sign up, watch a 15-second
"Premium Video Ad," earn +40 points per completed view, and redeem 10,000
points for a ₹100 Google Play code — with an optional proof screenshot and
full admin review workflow. All users, points, and transactions are stored
and verified **on the server** — nothing is trusted from or stored in the
browser.

### ✨ What's new in this revision
- **Public landing page** (`/`) with a sticky header, desktop nav + mobile
  hamburger drawer, hero section, feature grid, "how it works" steps, an
  **FAQ accordion** (tap-to-expand, one-at-a-time, fully mobile-friendly),
  and a multi-column footer.
- **Dark / Light mode toggle** — a sun/moon button in the header switches
  themes instantly and remembers your choice (`localStorage`), with a full
  light-mode color palette in addition to the original dark emerald theme.
- **Screenshot upload on Redeem** — users can optionally attach a proof
  screenshot (PNG/JPG/WEBP, max 5MB) to their redemption request, previewed
  before submit and viewable full-size (lightbox) in History and the Admin
  Panel.
- **Admin Panel** (`/admin`) — a role-gated dashboard with three tabs:
  - **Overview**: total users, pending/approved redemptions, points in
    circulation, total ads watched.
  - **Redemptions**: filter by status, view each user's details and
    screenshot, **Approve** (optionally attaching the real Google Play code)
    or **Reject & Refund** (automatically returns the deducted points).
  - **Users**: browse all accounts, disable/re-enable any account.
- General UI/UX polish across every existing page (softer shadows, refined
  spacing, consistent theming tokens) while keeping the original file
  structure and routes intact.

---

## 1. Architecture Overview

```
coindrop-rewards/
├── server/                       # Express + MongoDB REST API
│   ├── config/db.js              # Mongoose connection
│   ├── models/                   # User, AdView, Transaction schemas
│   ├── middleware/                # JWT auth guard, error handler, uploads
│   │   ├── authMiddleware.js       # protect + requireAdmin
│   │   ├── errorMiddleware.js
│   │   └── uploadMiddleware.js     # multer config for proof screenshots
│   ├── controllers/               # auth, ads, redeem, user, admin
│   ├── routes/                    # Express routers (incl. adminRoutes.js)
│   ├── uploads/screenshots/       # Uploaded proof screenshots land here
│   ├── utils/
│   │   ├── generateToken.js
│   │   └── makeAdmin.js            # CLI: promote a user to admin
│   ├── server.js                  # App entrypoint + security middleware stack
│   ├── package.json
│   └── .env.example
│
└── client/                       # React (Vite) SPA — the "multi-page" UI
    ├── src/
    │   ├── pages/
    │   │   ├── Landing.jsx         # Public homepage: header/nav/hero/FAQ/footer
    │   │   ├── Login.jsx / Signup.jsx
    │   │   ├── Dashboard.jsx / Redeem.jsx / History.jsx
    │   │   └── admin/AdminDashboard.jsx   # Overview / Redemptions / Users tabs
    │   ├── components/            # Navbar, VideoAdModal, Ad slot placeholders
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ThemeContext.jsx    # dark/light mode
    │   ├── api/axios.js
    │   ├── App.jsx                 # Client-side routing
    │   └── index.css               # Dark + light theme tokens, all page styles
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── .env.example
```

**Why this is secure by design:**
- Passwords are hashed with **bcrypt** (12 salt rounds) — never stored in plaintext.
- Auth uses a **JWT stored in an httpOnly, secure cookie** — client-side JS can
  never read or tamper with it (mitigates XSS token theft).
- **Every points change happens only in a controller on the server**, using
  atomic MongoDB `$inc` updates. The client never sends a "balance" — it only
  ever sends actions ("start ad," "complete ad," "redeem"), and the server
  decides what happens to the number.
- The 15-second ad timer is **re-verified server-side**: the countdown you see
  in the UI is cosmetic. The `/api/ads/complete` route independently checks
  `Date.now() - startedAt >= 15s` before crediting anything, and an `AdView`
  document's `sessionToken` can only be completed once.
- Redemption uses an **atomic conditional decrement**
  (`findOneAndUpdate({ pointsBalance: { $gte: 10000 } }, ...)`) so two
  simultaneous redeem clicks can never double-spend the same points.
- `helmet`, `express-mongo-sanitize`, `xss-clean`, `hpp`, `express-rate-limit`,
  and `express-validator` guard against the standard web attack surface
  (header injection, NoSQL injection, XSS payloads, parameter pollution,
  brute force, and malformed input).
- No app downloads, surveys, or check-in tasks exist anywhere in the code —
  the only earning action implemented is the Premium Video Ad.

---

## 2. Prerequisites

- **Node.js** v18+ and npm
- **MongoDB** — either:
  - Installed locally ([MongoDB Community Server](https://www.mongodb.com/try/download/community)), or
  - A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster (no credit card needed for the free tier)

No Adsterra keys, Firebase keys, or any other external API key is required to
run the app — the ad slots are placeholders you fill in later (see §5).

---

## 3. Local Setup — Step by Step

### 3.1 Unzip / open the project
```bash
cd coindrop-rewards
```

### 3.2 Start the backend

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and set at minimum:
```
MONGO_URI=mongodb://127.0.0.1:27017/coindrop_rewards
JWT_SECRET=replace_with_a_long_random_string
```
(If using Atlas, paste your Atlas connection string into `MONGO_URI` instead.)

Run it:
```bash
npm run dev
```
You should see:
```
[DB] MongoDB connected: 127.0.0.1
[SERVER] CoinDrop Rewards API listening on port 5000 (development)
```

Verify it's alive: open `http://localhost:5000/api/health` in a browser — you
should see `{"success":true,"message":"CoinDrop Rewards API is running."}`.

### 3.3 Start the frontend

Open a **second terminal**:
```bash
cd client
npm install
cp .env.example .env   # optional — only needed if you change ports
npm run dev
```
Vite will print a local URL, typically `http://localhost:5173`.

### 3.4 Use the app
Open `http://localhost:5173` in your browser:
1. You'll land on the **public homepage** — browse Features, How It Works,
   and the FAQ accordion, and toggle ☀️/🌙 dark/light mode from the header.
2. **Sign up** with a name, email, and password (8+ chars, 1 number).
3. You'll land on the **Dashboard** — tap **Watch** on the Premium Video Ad
   card, wait out the 15-second timer, and watch your points balance update
   (+40 pts), fully verified by the server.
4. Watch ads until you reach **10,000 points**, then go to **Redeem**,
   submit your Google Play email, and optionally attach a proof screenshot,
   to log a **Pending** redemption.
5. Check **History** to see your completed task count, live transaction
   status log, and any screenshot you attached (tap it to view full-size).

### 3.5 Access the Admin Panel
The Admin Panel at `/admin` is role-gated — regular users are redirected away
from it automatically. To create your first admin:

```bash
cd server
npm run make:admin -- youremail@example.com
```

Then log in with that account — you'll be redirected straight to `/admin`
instead of the regular Dashboard. From there you can:
- View platform-wide stats (**Overview** tab)
- **Approve** (optionally attaching the real Google Play code) or
  **Reject & Refund** any pending redemption, including viewing the user's
  proof screenshot (**Redemptions** tab)
- Disable or re-enable any user account (**Users** tab)

---

## 4. Project Scripts Reference

| Location | Command | What it does |
|---|---|---|
| `server/` | `npm run dev` | Starts the API with nodemon (auto-restart) |
| `server/` | `npm start` | Starts the API in plain Node (production) |
| `server/` | `npm run make:admin -- <email>` | Promotes an existing registered user to `role: "admin"` |
| `client/` | `npm run dev` | Starts the Vite dev server with hot reload |
| `client/` | `npm run build` | Builds a production-ready static bundle to `client/dist/` |
| `client/` | `npm run preview` | Serves the production build locally to sanity-check it |

---

## 5. Where to plug in real Adsterra scripts later

Every ad placement is already wired into the layout as a clearly commented
placeholder — search the codebase for `INSERT ADSTERRA` to find all five:

| Placeholder | File(s) | Purpose |
|---|---|---|
| `INSERT ADSTERRA NATIVE BANNER 728x90 SCRIPT HERE` | `client/src/components/AdSlotTop.jsx` | Rendered at the top of every sub-page (Dashboard, Redeem, History) |
| `INSERT ADSTERRA NATIVE BANNER 320x50 SCRIPT HERE` | `client/src/components/AdSlotBottom.jsx` | Rendered at the bottom of every sub-page |
| `INSERT ADSTERRA POPUNDER SCRIPT HERE` | `client/index.html` (head) and `client/src/components/PopunderScript.jsx` (React-mounted alternative) | Fires on user interaction, app-wide |
| `INSERT ADSTERRA SOCIAL BAR SCRIPT HERE` | `client/src/components/SocialBarScript.jsx` | Floating notification-style ad unit |
| `INSERT ADSTERRA SMARTLINK URL HERE` | `client/src/config/ads.js` (`ADSTERRA_SMARTLINK_URL`) | Opened in a new tab the instant the user taps **Watch** on the Dashboard — see §5.1 below |

To go live with Adsterra: sign up at Adsterra, create ad zones matching each
unit, and paste the `<script>` snippet they give you into the matching
placeholder (or inject it via a `useEffect`, as shown in
`PopunderScript.jsx`).

### 5.1 Smartlink — why it's different

Unlike the other four units, an Adsterra **Smartlink is a plain URL, not a
`<script>` tag** — there's nothing to "embed" in the page. The standard
pattern is to open it in a new tab exactly when the user starts an action,
while your own countdown/reward flow keeps running in the original tab.

That's implemented for you in **`client/src/pages/Dashboard.jsx`**: the
`handleWatchClick` function calls `window.open(ADSTERRA_SMARTLINK_URL, ...)`
synchronously, inside the button's `onClick`, before the 15-second-timer
modal even opens. To go live:

1. Open `client/src/config/ads.js`.
2. Replace the placeholder value of `ADSTERRA_SMARTLINK_URL` with your real
   Smartlink "Direct Link" URL from the Adsterra dashboard.

That's it — every tap of **Watch** will now open your Smartlink in a new tab
first, then run the existing 15-second countdown and server-verified reward
in the current tab. (Opening the URL *synchronously* inside the click handler
— not after an `await` — is what stops browsers from blocking it as a popup;
don't move this call inside an async function.)

---

## 6. Deployment Guide (no external paid keys required)

### 6.1 Database — MongoDB Atlas (free tier)
1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register).
2. Add a database user and allow your deployment's IP (or `0.0.0.0/0` for
   simplicity while testing).
3. Copy the connection string into your production `MONGO_URI`.

### 6.2 Backend — Render / Railway / any Node host
1. Push the `server/` folder to a Git repo (or the whole monorepo).
2. Create a new **Web Service**, root directory `server`.
3. Build command: `npm install` — Start command: `npm start`.
4. Add all variables from `.env.example` as environment variables in the
   host's dashboard, with production values:
   - `NODE_ENV=production`
   - `MONGO_URI=<your Atlas string>`
   - `JWT_SECRET=<a strong random secret>`
   - `CLIENT_URL=<your deployed frontend URL>` (needed for CORS + cookies)
5. Deploy. Confirm `https://<your-api-domain>/api/health` responds.

### 6.3 Frontend — Vercel / Netlify
1. Push the `client/` folder to the same or a separate repo.
2. Import it into Vercel/Netlify, root directory `client`.
3. Build command: `npm run build` — Output directory: `dist`.
4. Set the environment variable `VITE_API_BASE_URL=https://<your-api-domain>/api`.
5. Deploy. Your app is now live at your Vercel/Netlify URL.

### 6.4 Cookie/CORS note for cross-domain production
Because the JWT lives in an httpOnly cookie, when the frontend and backend are
on **different domains** in production, `server.js` already sets
`sameSite: "none"` + `secure: true` for you when `NODE_ENV=production` — just
make sure both domains are served over **HTTPS** (Render/Vercel/Netlify give
you this by default) and that `CLIENT_URL` on the server exactly matches your
deployed frontend origin.

### 6.5 Note on uploaded screenshots in production
Redemption proof screenshots are saved to disk at `server/uploads/screenshots/`.
Most free hosting tiers (Render free plan, Railway ephemeral containers, etc.)
use an **ephemeral filesystem** — uploaded files can be wiped on redeploy or
restart. For a production deployment where screenshots must persist
long-term, mount a persistent volume (most hosts offer this on paid tiers) or
swap `uploadMiddleware.js`'s local `diskStorage` for an object-storage
provider of your choice. For local development and demos, the local disk
setup here works out of the box with no extra configuration.

---

## 7. Economy Configuration

All point values are environment-driven in `server/.env` — no code changes
needed to tune the economy:

```
POINTS_PER_AD_VIEW=40
AD_MIN_WATCH_SECONDS=15
REDEEM_POINTS_THRESHOLD=6250
REDEEM_CASH_VALUE_INR=50

# Anti-fraud / high-frequency ad guards
AD_DAILY_LIMIT=120
AD_LIMIT_WINDOW_HOURS=12
AD_COOLDOWN_SECONDS=10
```

- **`REDEEM_POINTS_THRESHOLD` / `REDEEM_CASH_VALUE_INR`** — currently 6,250
  points → ₹50. Both the Redeem page and the eligibility API
  (`GET /api/redeem/eligibility`) read these values live, so the UI never
  hardcodes "10,000" or "₹100" anywhere — changing the `.env` values alone
  is enough to retune the whole payout economy.
- **`AD_DAILY_LIMIT` / `AD_LIMIT_WINDOW_HOURS`** — hard cap of ads a single
  user can watch in any rolling window (currently 120 ads per 12 hours).
  Enforced server-side in
  `POST /api/ads/start` (rejects new sessions once the cap is hit) *and*
  re-checked in `POST /api/ads/complete` in case the cap was reached by a
  concurrent session. The Dashboard shows a live `watched / limit` progress
  bar sourced from `GET /api/users/dashboard`.
- **`AD_COOLDOWN_SECONDS`** — minimum gap required between the start of one
  ad session and the next (currently 10s), to blunt rapid/bot clicking of
  "Watch" and protect your Adsterra/Monetag traffic quality. Enforced in
  two layers:
  1. **Frontend** (`Dashboard.jsx`): the Watch button disables itself and
     shows a live `Wait Xs` countdown the instant a session starts.
  2. **Backend** (`POST /api/ads/start`): independently checks the
     timestamp of the user's most recent `AdView` session and rejects with
     `429` if the cooldown hasn't elapsed — this is the real enforcement;
     the frontend timer is UX only and cannot be bypassed by calling the
     API directly.

---

## 8. Notes on the Redeem flow

Redemption requests are logged as `status: "Pending"` transactions in
MongoDB. This app deliberately does **not** auto-issue real Google Play codes
(doing so would require a paid, keyed integration with a gift-card
provider). In production you'd add a small admin panel or a manual back-office
step that reviews `Pending` transactions and flips them to `Approved` once a
real code has been purchased and emailed out — the `Transaction` model
already has `redeemCode` and `processedAt` fields ready for that step.
