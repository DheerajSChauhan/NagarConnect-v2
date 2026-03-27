# NagarConnect Backend

Express API for authentication, complaint management, and discussion features.

## Setup

1. Create `.env` in `backend/` (or copy from `.env.example`).
2. Add Supabase and JWT-related values used by the server.
3. Install dependencies:

```bash
npm install
```

## Run

Development / local run:

```bash
npm run dev
```

Production start:

```bash
npm start
```

Default server entry: `server.js`

## Seed Data

Run from `backend/`:

```bash
npm run seed:admin
npm run seed:wards
npm run seed:all
```

## Important Paths

- `routes/` - API route definitions
- `controllers/` - request handlers and business logic
- `middleware/` - auth and request middleware
- `config/` - Supabase configuration
- `scripts/` - seed and setup scripts

## Notes

- See `SUPABASE_SETUP.md` for backend Supabase setup details.
- Uploads are stored under `uploads/complaints/`.
