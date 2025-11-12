# SafeCommute

SafeCommute helps walkers and cyclists pick safer routes by blending travel time with lighting, patrol, and incident data. The current build ships with rich demo data so you can evaluate the experience before a backend is connected.

## Tech stack

- **React 19 + ReactDOM 19** rendered with Vite and React Bootstrap for a clean, accessible UI.
- **GitHub Pages workflow** (`.github/workflows/deploy.yml`) builds from `main` and publishes the production bundle from `dist/`.
- **Environment-driven configuration** via `.env` and `.env.local`, using `VITE_*` (or `REACT_APP_*` for legacy keys) to surface secrets to the browser.

## Quick start

1. Duplicate `.env` (or `.env.example` if you received a blank template) to `.env.local` and plug in your own keys. The Google Maps key is required to render the interactive map, while other fields help you wire in live APIs later. Add `VITE_PUBLIC_BASE=/p24/` (or your repository slug) if you plan to build locally and push the `dist/` folder to GitHub Pages.
2. Install dependencies with `npm install`.
3. Run the dev server with `npm run dev`. Your app is available at the Vite preview URL (typically `http://localhost:5173`).
4. Build for production with `npm run build`, or preview the static build locally with `npm run preview`.

> The Google Maps SDK loads on demand. Without a valid `VITE_GOOGLE_MAPS_API_KEY`, the map pane gracefully falls back to a helper message.

## Environment variables

SafeCommute reads the following keys from `.env`/`.env.local` (prefix with `VITE_` so Vite exposes them to the client):

- `VITE_GOOGLE_MAPS_API_KEY` – required for the live map preview.
- `VITE_BACKEND_BASE_URL` – base URL for the `/routes` and `/feedback` endpoints.
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` – client credentials for Firebase Authentication + Firestore (used for login and records sync).
- `VITE_CRIME_DATA_API_URL` and `VITE_CRIME_DATA_API_TOKEN` – optional future integrations for municipal crime feeds.
- `VITE_WEATHER_API_KEY` – reserved for weather-aware routing.
- `VITE_PUBLIC_BASE` – optional override for the built asset base path. Set this to `/p24/` (or equivalent) when deploying manually to GitHub Pages from a nested route.
- `MONGODB_URI`, `MONGODB_DB_NAME`, `MONGODB_ROUTES_COLLECTION`, `MONGODB_FEEDBACK_COLLECTION` – reference values for an Express + MongoDB backend.
- `JWT_SECRET` – seed value for planned auth/session features.

All `VITE_*` variables (and any `REACT_APP_*` values you keep around) are exposed to the browser via `import.meta.env`.

### Backend environment (server/.env)

The Node backend (see `server/`) expects its own `.env` file with:

- `PORT` – defaults to `8787` locally; set by your host in production.
- `GOOGLE_MAPS_API_KEY` – **server-side** Directions API key (can differ from the frontend key/restrictions).
- `FIREBASE_SERVICE_ACCOUNT_BASE64` *or* `FIREBASE_SERVICE_ACCOUNT_PATH` – credentials for Firestore writes.
- `FEEDBACK_WINDOW_HOURS` – rolling window (in hours) used when blending community feedback into route scores.
- `WEATHER_USER_AGENT` – required contact string for weather.gov (e.g., `SafeCommute/1.0 (tanush.shrivastava@gmail.com)`).
- `WEATHER_CACHE_TTL_MS` – cache duration (ms) for weather/grid lookups to keep the NWS API happy.
- `WEATHER_SAMPLE_MILES` / `WEATHER_MAX_POINTS` – spacing (in miles) and cap for weather checkpoints calculated along each route.

Set these as environment variables when deploying (Render, Fly, Cloud Run, etc.) so the backend can access Google Maps, Firestore, and weather.gov safely.

## Frontend flow

- `src/App.jsx` wires the global providers (Firebase Auth context + React Router) and registers every page in the experience (planner, login, records, about, and contact).
- `src/layout/AppLayout.jsx` and `src/components/AppNavbar.jsx` render the shared chrome + navigation links so the user can bounce between planner, contact, and records screens.
- `src/pages/PlannerPage.jsx` hosts the original routing workflow: it seeds demo routes, calls `/routes` when configured, lets the user prioritize metrics, and now exposes a “Save to records” action tied to the authenticated user.
- `src/pages/LoginPage.jsx` handles email/password auth via Firebase; `src/pages/RecordsPage.jsx` listens to Firestore for per-user route/comment history; `src/pages/AboutPage.jsx` and `src/pages/ContactPage.jsx` round out the brochure content.
- `src/components/RoutePlannerForm.jsx` collects origin, destination, and travel mode. It swaps fields client side and prevents submission until both fields are filled.
- `src/components/RouteCard.jsx` renders metrics, confidence levels, and recent incidents for each route. Toggle buttons reorder the same routes by priority.
- `src/components/FeedbackForm.jsx` captures community notes, submitting to `/feedback` when configured—or quietly storing the result client-side while you remain in demo mode.
- `src/components/MapView.jsx` pairs with `src/hooks/useGoogleMaps.js` to load the Maps SDK, render polylines for each candidate route, and provide a fallback message when the script fails to load.

## Data & services

- `src/data/mockRoutes.js` holds the three illustrative route options plus feedback categories that seed the UI.
- `src/services/api.js` exposes `fetchRoutes` and `submitFeedback`, calling your configured backend but gracefully returning the bundled mock data or noop responses when unavailable.
- `src/services/firebaseClient.js` centralizes Firebase app/Auth/Firestore initialization, while `src/services/records.js` wraps Firestore calls that save and stream per-user route records.
- `src/components/SaveRecordPanel.jsx` provides the UI hook for persisting the active route + optional note for the logged-in rider.

## Styling & UX

- Layout relies on React Bootstrap components with a white surface, soft blue accents, and pill-shaped buttons.
- Component-level CSS modules (`RoutePlannerForm.module.css`, `RouteCard.module.css`, etc.) add gradient cards and shadows to achieve the dashboard look.
- Global typography lives in `src/index.css`; page layout styles live in `src/App.css`.

## Testing status

Automated tests are not wired up yet. Add Jest or Vitest coverage for route filtering, API fallbacks, and feedback submission when you begin wiring in production data.

## Next steps

1. Stand up real `/routes` and `/feedback` endpoints, then update `VITE_BACKEND_BASE_URL` to remove the mock data dependency.
2. Replace the placeholder test with meaningful unit coverage.
3. Integrate live data feeds (crime, weather, protected lanes) and expand the map markers accordingly.
4. Harden authentication by plumbing the provided JWT scaffold through your backend of choice.
