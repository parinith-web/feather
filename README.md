# Feather

AI-powered background remover with history, plans, and one-time Pro upgrades

React (Vite) · Express · MongoDB

Feather lets users upload an image, remove the background with one click, pick a new background, export in their format of choice, and revisit past edits from a history gallery. A one-time payment unlocks Pro features.

## Features

**Background Removal**
- One-Click Removal — AI-powered background removal via ClipDrop
- Background Picker — Swap in solid colors or custom backgrounds
- Format Export — Download processed images in your chosen format
- History Gallery — Revisit and re-download past edits

**Account & Auth**
- Google Sign-In — Auth handled via Firebase
- Profile & Plan — View account details and current plan
- Usage Tracking — Track remaining free-tier usage

**Payments**
- Pro Upgrade — One-time paid upgrade via Paddle
- Webhook-Driven — Plan status updates automatically on successful payment

## Tech Stack

**Frontend**
| Technology | Purpose |
|---|---|
| React 19 | UI library |
| Vite | Build tool & dev server |
| React Router | Client-side routing |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Firebase (client) | Google sign-in |
| Axios | API requests |

**Backend**
| Technology | Purpose |
|---|---|
| Express | REST API |
| MongoDB (Mongoose) | User & history storage |
| Firebase Admin | ID token verification |
| Cloudinary | Processed image storage |
| ClipDrop API | AI background removal |
| Paddle | Payments & webhooks |

## Project Structure

```
feather/
├── frontend/               # React (Vite) app
│   └── src/
│       ├── Pages/          # Dashboard, Home, History, Profile, RemoveBackground
│       ├── api/            # API client + endpoint wrappers
│       ├── utils/          # bgRemoval, paddle helpers
│       └── firebase.jsx    # Firebase client config
└── backend/                # Express API
    └── src/
        ├── controllers/    # auth, bg, history, payment, user
        ├── routes/         # Route definitions
        ├── services/       # clipdrop, cloudinary, paddle, usage
        ├── models/         # User, HistoryItem (Mongoose)
        ├── middleware/      # Firebase token verification, upload, errors
        └── config/         # db, firebase, cloudinary setup
```

## Architecture

```
User → Firebase Auth → Backend verifies ID token → MongoDB (user/usage)
                                    ↓
                          Upload image → ClipDrop (remove bg)
                                    ↓
                          Cloudinary (store result) → History
                                    ↓
                          Paddle checkout → Webhook → Pro plan unlocked
```

## Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project (Google sign-in enabled)
- A MongoDB Atlas cluster
- A ClipDrop API key
- A Cloudinary account
- A Paddle account (sandbox is fine for local dev)

### Installation

```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in Firebase, MongoDB, ClipDrop, Cloudinary, Paddle keys
npm run dev             # http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env    # VITE_API_URL + Firebase config
npm run dev              # http://localhost:5173
```

## Available Scripts

**Backend**
| Command | Description |
|---|---|
| `npm run dev` | Start dev server with auto-restart |
| `npm start` | Start production server |

**Frontend**
| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Deployment

- **Backend** → Render (root: `backend`, build: `npm install`, start: `npm start`)
- **Frontend** → Vercel (root: `frontend`, framework: Vite, auto-detected)

After deploying both, set `VITE_API_URL` (frontend) to the Render URL, add the Vercel URL to `CLIENT_ORIGINS` (backend) and to Firebase's authorized domains, and point the Paddle webhook at `<render-url>/api/payments/webhook`.
