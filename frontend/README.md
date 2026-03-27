# NagarConnect Frontend (Vite)

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `VITE_API_BASE_URL` to your backend URL.
3. Install dependencies:

```bash
npm install
```

4. Start dev server:

```bash
npm run dev
```

## Environment variables

- `VITE_API_BASE_URL` - Backend API base URL (example: `http://localhost:5001`)
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client id
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase publishable (anon) key

## Build

```bash
npm run build
```

