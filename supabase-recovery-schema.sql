-- Supabase schema for Comcare Recovery Support Network
-- Run this in Supabase SQL Editor, then set Vercel env vars:
-- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RECOVERY_ADMIN_TOKEN

create extension if not exists pgcrypto;

create table if not exists public.recovery_professionals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  specialty text not null,
  certifications text,
  years_experience text,
  phone text not null,
  email text not null,
  website text,
  linkedin text,
  service_area text not null,
  bio text not null,
  photo_url text,
  featured boolean not null default false,
  verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recovery_professionals_status_idx on public.recovery_professionals(status);
create index if not exists recovery_professionals_featured_idx on public.recovery_professionals(featured desc);
create index if not exists recovery_professionals_created_idx on public.recovery_professionals(created_at desc);

alter table public.recovery_professionals enable row level security;

drop policy if exists "Public can read approved professionals" on public.recovery_professionals;
create policy "Public can read approved professionals"
  on public.recovery_professionals
  for select
  using (status = 'approved');