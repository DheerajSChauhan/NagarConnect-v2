-- Run this SQL in Supabase SQL Editor for profile verification support

create table if not exists public.user_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  id_type text not null,
  id_number text not null,
  id_proof_path text not null,
  verification_status text not null default 'pending',
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_verifications_user_id
  on public.user_verifications(user_id);

create index if not exists idx_user_verifications_created_at
  on public.user_verifications(created_at desc);
