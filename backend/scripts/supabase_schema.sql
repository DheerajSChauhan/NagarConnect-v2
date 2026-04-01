-- Run this SQL in Supabase SQL Editor
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password text,
  state text,
  district text,
  city text,
  locality text,
  department text,
  employee_id text,
  ward text,
  phone text not null,
  role text not null default 'citizen',
  google_id text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  state text,
  state_code text,
  district text,
  city text,
  urban_body_type text check (urban_body_type in ('nagar_nigam', 'nagar_palika', 'nagar_panchayat', 'gram_panchayat')),
  locality text,
  latitude double precision,
  longitude double precision,
  assigned_department text,
  assigned_officer_id uuid references public.users(id),
  ward text,
  description text not null,
  category text not null,
  location text not null,
  status text not null default 'Pending',
  priority text not null default 'Medium',
  image text,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.discussions (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  language text not null default 'en',
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.discussion_likes (
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (discussion_id, user_id)
);

create index if not exists idx_complaints_user_id on public.complaints(user_id);
create index if not exists idx_complaints_state on public.complaints(state);
create index if not exists idx_complaints_district on public.complaints(district);
create index if not exists idx_complaints_city on public.complaints(city);
create index if not exists idx_complaints_created_at on public.complaints(created_at desc);
create index if not exists idx_discussions_user_id on public.discussions(user_id);
create index if not exists idx_discussions_created_at on public.discussions(created_at desc);
create index if not exists idx_discussion_likes_discussion_id on public.discussion_likes(discussion_id);
