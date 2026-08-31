create extension if not exists pgcrypto;

create table if not exists public.comcare_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'new',
  priority text not null default 'normal',
  service_area_status text not null default 'review service area',
  customer_name text not null,
  customer_email text,
  customer_phone text,
  address text,
  city text,
  state text,
  zip text,
  start_date date,
  end_date date,
  notes text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null default 0,
  summary text,
  recommended_action text,
  confirmation_subject text,
  confirmation_body text,
  confirmation_status text not null default 'ready',
  confirmation_error text,
  payment_link text,
  delivery_window text,
  delivered_at timestamptz,
  pickup_requested_at timestamptz,
  owner_notes text
);

create index if not exists comcare_orders_status_idx on public.comcare_orders(status);
create index if not exists comcare_orders_created_at_idx on public.comcare_orders(created_at desc);
create index if not exists comcare_orders_zip_idx on public.comcare_orders(zip);

create table if not exists public.comcare_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.comcare_orders(id) on delete cascade,
  event_type text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists comcare_order_events_order_id_idx on public.comcare_order_events(order_id);
create index if not exists comcare_order_events_created_at_idx on public.comcare_order_events(created_at desc);

alter table public.comcare_orders enable row level security;
alter table public.comcare_order_events enable row level security;
