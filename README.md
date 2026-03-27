# NagarConnect v2

NagarConnect is a municipal grievance management platform where citizens can report civic issues (garbage, potholes, drainage, streetlights), track complaint status, and interact through a discussion forum. Admin and ward admin dashboards help authorities manage and resolve issues faster.

## Live Demo

Frontend: https://nagartrack-fronntend.onrender.com

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Auth/DB: Supabase

## Project Structure

- `frontend/` - React client app
- `backend/` - Express API server, routes, controllers, middleware
- `DEPLOYMENT.md` - deployment notes
- `SUPABASE_AUTH_MIGRATION.md` - auth migration details

## Quick Start

### 1) Clone and install dependencies

```bash
git clone <repo-url>
cd NagarConnect-v2

cd backend && npm install
cd ../frontend && npm install
```

### 2) Configure environment variables

Create `.env` files in both `backend/` and `frontend/` as required by Supabase and API configuration.

Helpful references:
- `backend/SUPABASE_SETUP.md`
- `frontend/src/config/supabase.js`
- `frontend/src/config/api.js`

### 3) Run locally

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## Main Features

- User authentication (including Supabase auth flow)
- Complaint registration and status tracking
- Discussion forum for community interaction
- Admin dashboard and ward admin dashboard

## Deployment

See `DEPLOYMENT.md` and `render.yaml` for deployment configuration.
