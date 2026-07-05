# Feather / SnapCut — Frontend

React (Vite) frontend for Feather, an AI background remover. Talks to the
companion Express backend in `/backend` for auth sync, background removal
(ClipDrop), history storage (Cloudinary + MongoDB), and payments (Paddle).

## 1. Install

```bash
cd frontend/project
npm install
cp .env.example .env
# fill in .env — see below
npm run dev
```

Runs on `http://localhost:5173` by default.

## 2. Environment variables

See `.env.example`. You need:

- **Firebase web app config** (`VITE_FIREBASE_*`) — from Firebase Console →
  Project Settings → General → "Your apps" → Web app. Enable **Google** as a
  sign-in provider under Authentication → Sign-in method.
- **`VITE_API_URL`** — the base URL of the deployed backend (no trailing
  slash, no `/api` suffix), e.g. `https://snapcut-backend.onrender.com`. For
  local dev against a locally-running backend, use `http://localhost:5000`.

## 3. How it's wired to the backend

- `src/firebase.jsx` — initializes Firebase Auth (Google sign-in popup).
- `src/AuthContext.jsx` — on every auth state change, calls
  `POST /api/auth/sync` (via `src/api/auth.js`) so the backend creates/updates
  the Mongo user record, then stores the returned profile (`plan`, `usage`,
  `historyCount`) as `profile` alongside the Firebase `user`.
- `src/api/client.js` — shared axios instance; a request interceptor attaches
  `Authorization: Bearer <firebase-id-token>` to every call automatically.
- `src/api/bg.js` — `POST /api/bg/remove` (multipart upload) for the actual AI
  cutout. `src/utils/bgRemoval.js` still does the client-side compositing
  (background swap, format conversion, thumbnailing) against the cutout the
  backend returns.
- `src/api/history.js` — list/create/delete/clear history, backed by
  MongoDB + Cloudinary on the server.
- `src/api/payments.js` + `src/utils/paddle.js` — Paddle.js checkout flow for
  the "Upgrade to Pro" button on the Profile page.

No further code changes are needed — just fill in the env vars and deploy.

## 4. Deploying to Vercel

1. Push this repo to Git.
2. Vercel dashboard → **Add New → Project** → import the repo.
   - **Root Directory:** `frontend/project` (if using the monorepo)
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
3. Add the environment variables from `.env.example` under **Settings →
   Environment Variables** (all `VITE_*` ones — Vite only exposes vars
   prefixed `VITE_` to the client bundle).
4. Deploy. `vercel.json` already has an SPA fallback rewrite so client-side
   routes (`/dashboard`, `/history`, etc.) work on refresh/direct link.
5. Once deployed, go back to the backend's `CLIENT_ORIGINS` env var (on
   Render) and add this Vercel URL so CORS allows it.
6. Also add this Vercel URL as an authorized domain in Firebase Console →
   Authentication → Settings → Authorized domains, or Google sign-in will be
   blocked on the deployed site.

## 5. Project layout

```
src/
  api/            axios wrappers for every backend route (auth, user, bg, history, payments)
  utils/          bgRemoval (canvas compositing), paddle (Paddle.js loader)
  AuthContext.jsx Firebase auth + backend profile sync
  firebase.jsx    Firebase Auth init (Google provider)
  Pages/          route-level pages (Home, Dashboard, RemoveBackground, History, Profile)
  Pages/Elements/ shared UI pieces (nav, cards, pickers, etc.)
```
