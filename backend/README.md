# Feather / SnapCut — Backend

Node.js + Express API for the SnapCut/Feather frontend. Replaces the
frontend's localStorage-only demo logic (`usageStore.js`, `historyStore.js`,
the fake canvas cutout in `bgRemoval.js`) with real services:

| Concern              | Service                                  |
|-----------------------|-------------------------------------------|
| Login/identity         | Firebase Auth (verified server-side with `firebase-admin`) |
| User + plan storage     | MongoDB (Mongoose)                       |
| Background removal      | ClipDrop "Remove Background" API         |
| History image storage   | Cloudinary                               |
| Payments (Free/Pro)     | Paddle (Billing, sandbox/demo)           |

## 1. Install

```bash
cd backend
npm install
cp .env.example .env
# fill in .env — see the comments in that file for where each value comes from
npm run dev
```

Server starts on `http://localhost:5000` by default. `GET /health` should
return `{ ok: true }`.

## 2. Environment variables

See `.env.example` for the full list and where to find each value
(Firebase service account, Cloudinary dashboard, ClipDrop API key, Paddle
sandbox dashboard). Nothing in this project talks to any of those services
until you fill these in — there are no hardcoded fallbacks.

## 3. Data model

**User** (`src/models/User.js`)
- `firebaseUid`, `email`, `name`, `photoURL`
- `plan`: `"free" | "pro"`
- `usage`: `{ day: "YYYY-MM-DD", count }` — resets automatically when the day-key changes (UTC)
- `paddleCustomerId` / `paddleTransactionId` — set once Pro checkout completes

**HistoryItem** (`src/models/HistoryItem.js`)
- Belongs to a user (`firebaseUid` + Mongo ref)
- `resultUrl` / `resultPublicId` — the processed image on Cloudinary
- `bgImageThumbUrl` — thumbnail of a custom background image, if one was used
- Thumbnails of the *result* image aren't stored separately — they're generated
  on the fly via a Cloudinary URL transformation (`toThumbnailUrl`), so there's
  only ever one upload per history entry.

## 4. API

All authenticated routes expect:
```
Authorization: Bearer <firebase-id-token>
```
Get this on the frontend with `await auth.currentUser.getIdToken()`.

### Auth
- `POST /api/auth/sync` — call right after Firebase sign-in. Creates the Mongo
  user on first login, refreshes cached profile fields otherwise. Returns the
  full profile (plan, usage, history count).

### User
- `GET /api/user/me` — profile + usage snapshot + history count.
- `GET /api/user/usage` — just the usage snapshot (`count/limit/remaining`, `unlimited: true` for Pro).

### Background removal
- `POST /api/bg/remove` — `multipart/form-data`, field name `image`.
  - Enforces the free-plan daily quota (`FREE_DAILY_LIMIT`, default 10/day) before calling ClipDrop; Pro accounts are unlimited.
  - Calls ClipDrop, returns `{ image: "data:image/png;base64,...", usage }`.
  - The frontend keeps its existing `compositeBackground` / `toThumbnail` canvas
    logic in `bgRemoval.js` to swap in the chosen background and format —
    only the actual segmentation step moves server-side.

### History (Cloudinary-backed)
- `POST /api/history` — body `{ filename, format, bgType, bgColor, resultFull, bgImageThumb? }`
  (`resultFull`/`bgImageThumb` are base64 data URLs, same shape the frontend
  already produces via `compositeBackground`/`toThumbnail`). Uploads to
  Cloudinary and returns the saved item shaped exactly like the old
  `addHistoryItem` return value, so `HistoryCard.jsx` needs no changes.
- `GET /api/history` — list, newest first.
- `DELETE /api/history/:id` — delete one (also removes the Cloudinary asset).
- `DELETE /api/history` — clear all (bulk Cloudinary cleanup + Mongo wipe).

### Payments (Paddle)
- `GET /api/payments/config` — public; `{ environment, clientToken, proPriceId }` for `Paddle.Initialize(...)` on the frontend.
- `POST /api/payments/create-checkout` — auth required; creates a Paddle
  transaction server-side (tamper-proof price) tagged with the user's Firebase
  UID. Returns `{ transactionId }` — open it client-side with
  `Paddle.Checkout.open({ transactionId })`.
- `POST /api/payments/webhook` — Paddle calls this. Verifies the
  `Paddle-Signature` header against the raw body, and on
  `transaction.completed` flips the matching user to `plan: "pro"`. Also
  reverts to `"free"` on a refund (`adjustment.created` with `action: "refund"`),
  since Pro is a one-time "lifetime" purchase rather than a subscription.

  **Important:** point your Paddle sandbox notification destination at
  `https://<your-deployed-backend>/api/payments/webhook`. Paddle can't reach
  `localhost`, so use a tunnel (ngrok, etc.) for local testing.

## 5. Frontend wiring — done

The frontend (`/frontend/project`) is already wired to this API — see
`src/api/*.js`, `src/AuthContext.jsx`, `src/utils/paddle.js`, and the updated
`RemoveBackground.jsx` / `History.jsx` / `Dashboard.jsx` / `Profile.jsx` pages
there. In short:

1. `AuthContext.jsx` calls `POST /api/auth/sync` automatically whenever
   Firebase's `onAuthStateChanged` fires with a user, and stores the returned
   profile (plan/usage/historyCount) alongside the Firebase `user` object.
2. `RemoveBackground.jsx` posts the raw `File` to `POST /api/bg/remove` via
   `src/api/bg.js`, then feeds the returned `image` data URL into the existing
   `compositeBackground(...)` helper exactly as the old simulated cutout was
   used.
3. Usage numbers come from the `usage` object returned by `/api/bg/remove` and
   `/api/user/me` (via `AuthContext`'s `refreshProfile()`).
4. History reads/writes go through `src/api/history.js` (`GET/POST/DELETE
   /api/history`).
5. `Profile.jsx`'s "Upgrade to Pro" button calls `/api/payments/config` +
   `/api/payments/create-checkout`, then opens Paddle.js's overlay
   (`src/utils/paddle.js`) with the returned `transactionId`. It polls
   `/api/user/me` briefly afterward to pick up `plan: "pro"` once the webhook
   lands.

You only need to fill in `.env` (this backend) and `.env` (the frontend, just
`VITE_API_URL` + Firebase web config) — no further code changes are required
to run the whole thing end-to-end.

## 6. Deploying to Render

1. Push this repo to Git (the whole monorepo, or just `backend/` as its own repo).
2. Render dashboard -> New -> Web Service -> connect the repo.
   - Root Directory: `backend` (if using the monorepo)
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance type: Free tier is fine for a demo.
3. Add every variable from `.env.example` under Environment - paste the real
   Firebase/Cloudinary/ClipDrop/Paddle/Mongo values. For `FIREBASE_PRIVATE_KEY`,
   paste it as a single line with literal `\n` for newlines - the app
   un-escapes them at startup (see `config/firebase.js`).
4. Set `CLIENT_ORIGINS` to your deployed Vercel URL(s), comma-separated, e.g.
   `https://your-app.vercel.app,https://your-custom-domain.com`.
5. Deploy. Confirm `GET https://<your-service>.onrender.com/health` returns
   `{ "ok": true }`.
6. In the Paddle sandbox dashboard, point the webhook notification
   destination at `https://<your-service>.onrender.com/api/payments/webhook`.
7. Copy the Render service URL into the frontend's `VITE_API_URL` (see
   `/frontend/project/.env.example`) before deploying the frontend.

## 7. Project layout

```
src/
  server.js            entrypoint — boots Firebase Admin, Cloudinary, Mongo, then Express
  app.js               Express app assembly, middleware order, route mounting
  config/              Mongo / Firebase Admin / Cloudinary initialization
  middleware/          Firebase token verification, multer upload, error handler
  models/              Mongoose schemas (User, HistoryItem)
  services/            ClipDrop, Cloudinary, usage/quota, Paddle — all external I/O lives here
  controllers/         Route handlers, thin — delegate to services
  routes/              Express routers per resource
  utils/               asyncHandler, ApiError
```

## 8. Notes / things to double check before shipping

- Paddle webhook route (`/api/payments/webhook`) is mounted with
  `express.raw()` **before** the global `express.json()` parser in `app.js` —
  don't reorder that, or signature verification will fail.
- `deleteAllUserHistoryAssets` uses Cloudinary's `delete_resources_by_prefix`,
  which requires the Cloudinary plan/API key to have that capability enabled
  (it does by default on standard accounts).
- CORS origins are locked down via `CLIENT_ORIGINS` — add your deployed
  frontend URL there in production.
