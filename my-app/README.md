# SafeCommute Web App

SafeCommute gives walkers and cyclists a way to compare routes by safety in addition to travel time. The React frontend now includes a routed experience with dedicated login, contact, about, and records pages. When Firebase credentials are provided, riders can authenticate and sync the routes/notes they save from the planner to Firestore.

## Quick start

```bash
npm install
cp .env .env.local   # or create your own .env.local
# add Google Maps + Firebase creds to .env.local
npm run dev
```

The Vite dev server defaults to http://localhost:5173. Build for production with:

```bash
npm run build
npm run preview # optional: test the production bundle locally
```

## Environment variables

Copy `.env` to `.env.local` (git-ignored) and fill in the following:

| Key | Purpose |
| --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | Required for the in-app Google Maps + polyline rendering. |
| `VITE_BACKEND_BASE_URL` | Root of your `/routes` + `/feedback` API. The UI falls back to demo data when unset. |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | Enable Firebase Authentication + Firestore so users can log in and sync saved route records. |
| Optional `REACT_APP_*` keys | Legacy hooks for weather/crime integrations; keep them if your backend expects these names. |

Backend-only values such as `MONGODB_URI`, `MONGODB_DB_NAME`, and `JWT_SECRET` are read by the Express server under `server/`. Do not prefix those with `VITE_`.

## Key folders

```
src/
  App.jsx                  # AuthProvider + React Router setup
  layout/AppLayout.jsx     # Shared chrome + navbar
  pages/                   # Planner, Login, Records, About, Contact screens
  components/              # Reusable UI (RoutePlannerForm, MapView, SaveRecordPanel, etc.)
  services/api.js          # Routes + feedback API calls (mock fallback)
  services/firebaseClient.js / records.js  # Firebase + Firestore helpers
```

`src/pages/PlannerPage.jsx` hosts the core planner UI. When a user is logged in they can use the “Save to records” panel to push the selected route plus optional note into Firestore; `src/pages/RecordsPage.jsx` streams those documents back in real time.

## API contract

The planner expects a backend with:

- `POST /routes` – body contains `{ origin, destination, mode, preference }`. Respond with `{ routes: [...] }` matching the shape used in `src/data/mockRoutes.js`.
- `POST /feedback` – receives free-form community intel. Reply with `{ success: true }` or a richer payload – the UI surfaces `type` + `message` when provided.

When either endpoint is missing the frontend falls back to bundled mock routes or local feedback confirmation so the experience still works for demos.

## Testing & linting

- `npm run build` ensures the bundle compiles (no Jest/Vitest suite is wired up yet).
- `npm run lint` runs ESLint (React hooks + Refresh plugins).

Add regression coverage once you start replacing mocks with production data pipelines.
