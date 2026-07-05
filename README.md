# SnapCut / Feather — AI Background Remover

Full-stack app: React (Vite) frontend + Node/Express backend, wired together.

- **Frontend** (`/frontend`): Firebase Google sign-in, upload UI, background
  picker, format export, history gallery, profile/plan page. Deploys to **Vercel**.
- **Backend** (`/backend`): verifies Firebase ID tokens, stores users/usage in
  **MongoDB**, calls **ClipDrop** for the actual AI background removal, stores
  processed images in **Cloudinary**, and handles **Paddle** payments for a
  one-time "Pro" upgrade. Deploys to **Render**.

The two are already wired to each other (see `backend/README.md` §5 and
`frontend/README.md` §3 for exactly which files do what). All that's left is
filling in real API keys and deploying — no code changes required.

## Quick start (local dev)

```bash
# Terminal 1 — backend
cd backend
npm install
cp .env.example .env   # fill in real values, see below
npm run dev             # http://localhost:5000

# Terminal 2 — frontend
cd frontend
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:5000 + Firebase config
npm run dev              # http://localhost:5173
```

## What you need to fill in, and where to get it

### 1. Firebase (auth)
1. Go to the [Firebase Console](https://console.firebase.google.com/) → Create a project.
2. **Authentication → Sign-in method** → enable **Google**.
3. **Project Settings → General → Your apps** → add a Web app → copy the
   config object into `frontend/.env` (`VITE_FIREBASE_*`).
4. **Project Settings → Service accounts** → **Generate new private key** →
   downloads a JSON file. Copy `project_id`, `client_email`, and
   `private_key` into `backend/.env` (`FIREBASE_PROJECT_ID`,
   `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — keep the `\n` escapes in
   the private key as a single-line value).

### 2. MongoDB (user + history records)
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2. **Database Access** → add a database user + password.
3. **Network Access** → allow `0.0.0.0/0` (or Render's IPs) so Render can connect.
4. **Connect → Drivers** → copy the connection string into `backend/.env` as
   `MONGODB_URI` (fill in your username/password/db name, e.g. `.../snapcut?...`).

### 3. ClipDrop (AI background removal)
1. Sign up at [clipdrop.co/apis](https://clipdrop.co/apis).
2. Grab an API key for the **Remove Background** API.
3. Put it in `backend/.env` as `CLIPDROP_API_KEY`.

### 4. Cloudinary (processed-image storage for History)
1. Sign up at [cloudinary.com](https://cloudinary.com/) (free tier is enough).
2. **Dashboard** → copy **Cloud name**, **API Key**, **API Secret** into
   `backend/.env` (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
   `CLOUDINARY_API_SECRET`).

### 5. Paddle (demo/sandbox payments for the $19 "Pro" upgrade)
1. Sign up at [paddle.com](https://www.paddle.com/) and switch to **Sandbox** mode.
2. **Developer Tools → Authentication** → create an API key → `PADDLE_API_KEY`.
3. **Developer Tools → Client-side tokens** → create one → `PADDLE_CLIENT_TOKEN`.
4. **Catalog → Products** → create a one-time "Pro" product/price → copy the
   price id (`pri_...`) → `PADDLE_PRO_PRICE_ID`.
5. **Developer Tools → Notifications** → create a webhook destination
   pointing at `https://<your-render-service>.onrender.com/api/payments/webhook`,
   subscribed to at least `transaction.completed` and `adjustment.created` →
   copy the signing secret → `PADDLE_WEBHOOK_SECRET`.
6. Leave `PADDLE_ENV=sandbox` for demo purposes (switch to `production` with
   live keys when you're ready to charge real cards).

## Deploying

### Backend → Render
See `backend/README.md` §6 for the full step-by-step. Short version: new Web
Service, root directory `backend`, build `npm install`, start `npm start`,
paste in every var from `backend/.env.example` with real values, set
`CLIENT_ORIGINS` to your Vercel URL once you have it.

### Frontend → Vercel
See `frontend/README.md` §4. Short version: new Project, root directory
`frontend`, framework Vite (auto-detected), paste in every `VITE_*` var from
`frontend/.env.example`, using the Render URL for `VITE_API_URL`.

### Wiring the two together after both are deployed
1. Copy the Render backend URL → set as `VITE_API_URL` in Vercel's env vars → redeploy frontend.
2. Copy the Vercel frontend URL → add to `CLIENT_ORIGINS` in Render's env vars → redeploy backend.
3. Add the Vercel URL to Firebase Console → Authentication → Settings →
   Authorized domains (otherwise Google sign-in will fail on the live site).
4. Point the Paddle sandbox webhook at the Render URL's `/api/payments/webhook`.

Once all four of those cross-references are set, sign-in, background removal,
history, and the Pro upgrade should all work end-to-end on the live URLs.

## Project structure

```
backend/     Express API — see backend/README.md
frontend/    React (Vite) app — see frontend/README.md
```
