# Supabase Setup Guide

## 1) Create a Supabase project

- Open Supabase dashboard and create a new project.
- Save your project URL and service role key:
  - Settings -> API -> Project URL
  - Settings -> API -> service_role key

## 2) Configure backend environment

- Copy `.env.example` to `.env` in backend folder.
- Set these values in `.env`:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `JWT_SECRET`
  - `GOOGLE_CLIENT_ID` (if using Google login)

## 3) Create database schema

- In Supabase dashboard, open SQL Editor.
- Run SQL from `scripts/supabase_schema.sql`.

## 4) Install backend dependencies

- In backend folder:
  - `npm install`

## 5) Seed admin accounts (optional but recommended)

- Create main admin:
  - `npm run seed:admin`
- Create ward admins:
  - `npm run seed:wards`
- Or run both:
  - `npm run seed:all`

## 6) Start backend

- `npm start`

## 7) Configure frontend environment

- Copy `frontend/.env.example` to `frontend/.env`.
- Set:
  - `VITE_API_BASE_URL` (for local setup, use `http://localhost:5001`)
  - `VITE_GOOGLE_CLIENT_ID`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

## 8) Quick verification checklist

- Backend starts without `SUPABASE_URL` or key errors.
- Frontend starts with `npm run dev` in `frontend` folder.
- Register/Login works.
- Complaint create/list works.
- Discussion create/like works.

## Security notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- Keep backend `.env` out of git.
- Rotate keys if leaked.
