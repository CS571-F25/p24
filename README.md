# SafeCommute

SafeCommute helps walkers and cyclists pick safer routes by blending travel time with lighting, patrol, and incident data. The current build ships with rich demo data so you can evaluate the experience before a backend is connected.

## Tech stack

- **React 19 + ReactDOM 19** rendered with Vite and React Bootstrap for a clean, accessible UI.
- **GitHub Pages workflow** (`.github/workflows/deploy.yml`) builds from `main` and publishes the production bundle from `dist/`.
- **Environment-driven configuration** via `.env` and `.env.local`, following the familiar `REACT_APP_*` convention for API keys and service URLs.

## Quick start

1. Duplicate `.env` (or `.env.example` if you received a blank template) to `.env.local` and plug in your own keys. The Google Maps key is required to render the interactive map, while other fields help you wire in live APIs later.
2. Install dependencies with `npm install`.
3. Run the dev server with `npm run dev`. Your app is available at the Vite preview URL (typically `http://localhost:5173`).
4. Build for production with `npm run build`, or preview the static build locally with `npm run preview`.

> The Google Maps SDK loads on demand. Without a valid `REACT_APP_GOOGLE_MAPS_API_KEY`, the map pane gracefully falls back to a helper message.

## Environment variables

SafeCommute reads the following keys from `.env`/`.env.local`:

- `REACT_APP_GOOGLE_MAPS_API_KEY` – required for the live map preview.
- `REACT_APP_BACKEND_BASE_URL` – base URL for the `/routes` and `/feedback` endpoints.
- `REACT_APP_CRIME_DATA_API_URL` and `REACT_APP_CRIME_DATA_API_TOKEN` – optional future integrations for municipal crime feeds.
- `REACT_APP_WEATHER_API_KEY` – reserved for weather-aware routing.
- `MONGODB_URI`, `MONGODB_DB_NAME`, `MONGODB_ROUTES_COLLECTION`, `MONGODB_FEEDBACK_COLLECTION` – reference values for an Express + MongoDB backend.
- `JWT_SECRET` – seed value for planned auth/session features.

All `REACT_APP_*` variables are exposed to the browser so you can read them from `process.env`.

## Frontend flow

- `src/App.jsx` orchestrates the overall UI state: it seeds demo routes on load, tracks the active route and preference toggle (safest/balanced/fastest), and surfaces status messaging whenever the app falls back to demo data.
- `src/components/RoutePlannerForm.jsx` collects origin, destination, and travel mode. It swaps fields client side and prevents submission until both fields are filled.
- `src/components/RouteCard.jsx` renders metrics, confidence levels, and recent incidents for each route. Toggle buttons reorder the same routes by priority.
- `src/components/FeedbackForm.jsx` captures community notes, submitting to `/feedback` when configured—or quietly storing the result client-side while you remain in demo mode.
- `src/components/MapView.jsx` pairs with `src/hooks/useGoogleMaps.js` to load the Maps SDK, render polylines for each candidate route, and provide a fallback message when the script fails to load.

## Data & services

- `src/data/mockRoutes.js` holds the three illustrative route options plus feedback categories that seed the UI.
- `src/services/api.js` exposes `fetchRoutes` and `submitFeedback`, calling your configured backend but gracefully returning the bundled mock data or noop responses when unavailable.

## Styling & UX

- Layout relies on React Bootstrap components with a white surface, soft blue accents, and pill-shaped buttons.
- Component-level CSS modules (`RoutePlannerForm.module.css`, `RouteCard.module.css`, etc.) add gradient cards and shadows to achieve the dashboard look.
- Global typography lives in `src/index.css`; page layout styles live in `src/App.css`.

## Testing status

Automated tests are not wired up yet. Add Jest or Vitest coverage for route filtering, API fallbacks, and feedback submission when you begin wiring in production data.

## Next steps

1. Stand up real `/routes` and `/feedback` endpoints, then update `REACT_APP_BACKEND_BASE_URL` to remove the mock data dependency.
2. Replace the placeholder test with meaningful unit coverage.
3. Integrate live data feeds (crime, weather, protected lanes) and expand the map markers accordingly.
4. Harden authentication by plumbing the provided JWT scaffold through your backend of choice.
