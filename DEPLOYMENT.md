# Deployment Guide (Vercel + Render)

## 1) Deploy backend on Render

- Create a new Web Service from your GitHub repo.
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`

Set these environment variables in Render:

- `NODE_ENV=production`
- `FRONTEND_URL=https://your-frontend.vercel.app`
- `JWT_SECRET=...`
- `JWT_EXPIRE=30d`
- `COOKIE_EXPIRE=30`
- `GOOGLE_CLIENT_ID=...`
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`

After first deploy, open:

- `https://your-backend.onrender.com/api/health`

Expected response:

- `{ "success": true, "status": "ok" }`

## 2) Deploy frontend on Vercel

- Import the same GitHub repo in Vercel.
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Set frontend environment variables in Vercel:

- `VITE_API_BASE_URL=https://your-backend.onrender.com`
- `VITE_GOOGLE_CLIENT_ID=...`
- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_PUBLISHABLE_KEY=...`

Redeploy frontend after env changes.

## 3) Notes

- `frontend/vercel.json` includes SPA rewrites so React routes work on refresh.
- Never put `SUPABASE_SERVICE_ROLE_KEY` in frontend env variables.
- If CORS errors appear, confirm Render `FRONTEND_URL` exactly matches your Vercel domain.
