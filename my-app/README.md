# SafeCommute Web App

SafeCommute helps walkers pick routes that optimise for safety as well as speed. The React frontend renders an interactive map, provides safety metrics for multiple route options, and lets the community contribute lighting/patrol notes.

The UI currently ships with demo data so it works out‑of‑the‑box. Connecting it to your Directions & MongoDB backend simply requires updating environment variables and implementing the expected REST endpoints.

## Quick start

```bash
npm install
cp .env.example .env.local
# add your API keys + backend URL to .env.local
npm start
```

The development server runs at http://localhost:3000.

To ship a production build:

```bash
npm run build
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `REACT_APP_GOOGLE_MAPS_API_KEY` – required for the in-app map (Maps JS + Directions API).
- `REACT_APP_BACKEND_BASE_URL` – root of your API server (e.g. `http://localhost:5000/api`).
- Optional public data keys: `REACT_APP_CRIME_DATA_API_URL`, `REACT_APP_CRIME_DATA_API_TOKEN`, `REACT_APP_WEATHER_API_KEY`.
- Backend values (`MONGODB_URI`, `MONGODB_DB_NAME`, etc.) are read by the Node server you will deploy alongside this frontend.

Create React App automatically loads `.env.local` (ignored by git).

## API contract

The frontend calls two endpoints on `REACT_APP_BACKEND_BASE_URL`:

1. `GET /routes?start=...&end=...&mode=...&preference=...`
   ```json
   [
     {
       "id": "route-fastest",
       "label": "Fastest Route",
       "type": "fastest",
       "distanceMi": 1.4,
       "durationMin": 18,
       "safetyScore": 3.2,
       "confidence": "medium",
       "summary": "Short description",
       "coordinates": [[37.77, -122.41], ...],
       "incidents": ["text"],
       "recommendations": ["text"]
     }
   ]
   ```

2. `POST /feedback`
   ```json
   {
     "location": "Mission & 16th Street",
     "category": "well-lit",
     "notes": "Plenty of store fronts lighting",
     "submittedAt": "2025-01-30T03:18:29.410Z"
   }
   ```

Responses should include the created document or `{ ok: true }`. When these endpoints are missing the UI gracefully falls back to bundled mock routes and local feedback handling.

## MongoDB + backend integration

1. **Provision MongoDB**
   - Atlas: create a free cluster, whitelist your IP, and generate a database user.
   - Local: install MongoDB Community Edition and run `mongod`.

2. **Set environment variables** (backend):
   ```
   MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net
   MONGODB_DB_NAME=safe_commute
   MONGODB_ROUTES_COLLECTION=routes
   MONGODB_FEEDBACK_COLLECTION=feedback
   JWT_SECRET=super-long-random-string
   ```

3. **Seed initial data (optional)**:
   ```bash
   mongosh "$MONGODB_URI"
   use safe_commute
   db.createCollection("routes")
   db.createCollection("feedback")
   ```

4. **Build a lightweight API** (Express example):
   ```js
   import express from 'express';
   import { MongoClient } from 'mongodb';
   import 'dotenv/config';

   const app = express();
   app.use(express.json());

   const client = new MongoClient(process.env.MONGODB_URI);
   await client.connect();
   const db = client.db(process.env.MONGODB_DB_NAME);

   app.get('/api/routes', async (req, res) => {
     const { start, end, preference } = req.query;
     // TODO: call Google Directions API, score routes, persist/cache results
     const routes = await db.collection(process.env.MONGODB_ROUTES_COLLECTION).find({ start, end }).toArray();
     res.json(routes);
   });

   app.post('/api/feedback', async (req, res) => {
     const entry = { ...req.body, createdAt: new Date() };
     await db.collection(process.env.MONGODB_FEEDBACK_COLLECTION).insertOne(entry);
     res.json(entry);
   });

   app.listen(5000, () => console.log('API listening on 5000'));
   ```

5. **Wire your Directions scorer**
   - Use Google Directions API to fetch candidate routes.
   - Overlay your crime datasets + user feedback to compute `safetyScore` and `confidence`.
   - Persist each route result in MongoDB (include `start`, `end`, `mode`, `preference` to reuse cached data).

6. **Run frontend with backend**
   - Update `REACT_APP_BACKEND_BASE_URL` to point at your Express server (`http://localhost:5000/api` in the example).
   - Restart `npm start` so CRA picks up new env values.

## Project structure

```
src/
  components/        # UI building blocks
  data/mockRoutes.js # Demo data + categories
  hooks/useGoogleMaps.js
  services/api.js    # REST helpers w/ mock fallback
```

The map auto-loads Google Maps JS using your API key. If the key is missing or the script fails it displays a graceful fallback banner.

## Testing

- `npm test` – CRA’s default Jest setup (no custom tests yet).
- `npm run build` – validates there are no type/compile errors.

Pull requests should add unit tests for new data processing once the backend logic is in place.
