# Campus Connect

Campus Connect is a Node.js/Express event-booking site backed by PostgreSQL.
The Express server serves both the API and the static frontend, so one Render
web service deploys the complete website.

## Local setup

1. In `backend`, copy `.env.example` to `.env`.
2. In Supabase, open **Connect → Connection pooling → URI** and copy the
   pooler URI (port `6543`). Replace its password placeholder with the database
   password. URL-encode any special characters in that password.
3. Set `DATABASE_URL` to that URI and set a long `SESSION_SECRET`.
4. Run `npm install` and then `npm start` from `backend`.
5. Open `http://localhost:3000`. Verify database status at
   `http://localhost:3000/api/health`.

## Database

`backend/database.sql` creates the app tables and sample data. It begins by
dropping those tables, so run it only on a new Supabase project or when a reset
is intended. Do not run `npm run init-db` on a database whose data must be kept.

## Render deployment

1. Push this project to a GitHub repository.
2. In Render, create a Blueprint from that repository (or create a Web Service
   with root directory `backend`, build command `npm ci`, and start command
   `npm start`). `render.yaml` contains the same configuration.
3. Set `DATABASE_URL` in Render to the Supabase **pooler** URI and redeploy.
   Render generates `SESSION_SECRET` from `render.yaml`; use a strong custom
   value instead if you need it to remain stable across service recreation.
4. Wait until `https://<your-render-service>/api/health` responds with
   `{ "status": "ok", "database": "connected" }`, then test registration,
   user login, bookings, and admin login from the deployed site.

The frontend is served by the same Express application, so no separate frontend
URL or CORS setting is required. Only set `FRONTEND_URL` if a future deployment
hosts the frontend on another domain.
