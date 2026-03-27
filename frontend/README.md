# NagarConnect Frontend

React + Vite client for users, ward admins, and platform admins.

## Setup

1. Copy `.env.example` to `.env`.
2. Configure API and Supabase values.
3. Install dependencies:

```bash
npm install
```

## Run

Start local development server:

```bash
npm run dev
```

Preview production build locally:

```bash
npm run build
npm run preview
```

## Environment Variables

- `VITE_API_BASE_URL` - Backend API URL (example: `http://localhost:5001`)
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/publishable key

## Useful Scripts

- `npm run dev` - start dev server
- `npm run build` - create production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

## Important Paths

- `src/pages/` - role-based pages and feature screens
- `src/components/` - shared UI components
- `src/config/api.js` - API base configuration
- `src/config/supabase.js` - Supabase client setup

