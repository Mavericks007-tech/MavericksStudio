-- ─────────────────────────────────────────────────────────────────────────
-- F1 Store — Supabase Schema
-- Run this in the Supabase SQL editor to set up all tables + RLS policies
-- ─────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── profiles ──────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  phone       text,
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── products ──────────────────────────────────────────────────────────────
create table public.products (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  slug              text not null unique,
  description       text not null default '',
  price             integer not null check (price > 0),        -- pence
  compare_at_price  integer,
  category          text not null check (category in (
    'T-Shirts','Hoodies','Joggers','Shorts','Jackets','Full Sleeve Jersey','Accessories'
  )),
  team              text,
  driver            text,
  sizes             text[] not null default '{}',
  images            text[] not null default '{}',
  stock             jsonb not null default '{}',
  is_active         boolean not null default true,
  is_featured       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index on public.products (category);
create index on public.products (is_active);
create index on public.products (is_featured);

-- ── orders ────────────────────────────────────────────────────────────────
create table public.orders (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references public.profiles (id),
  items              jsonb not null,
  shipping_address   jsonb not null,
  subtotal           integer not null,
  shipping_cost      integer not null default 499,
  discount           integer not null default 0,
  total              integer not null,
  status             text not null default 'pending' check (status in (
    'pending','payment_confirmed','processing','shipped','delivered','cancelled','refunded'
  )),
  payment_status     text not null default 'pending' check (payment_status in (
    'pending','paid','failed','refunded'
  )),
  tracking_number    text,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index on public.orders (user_id);
create index on public.orders (status);

-- ── payments (manual: cod, bkash, nagad, rocket) ──────────────────────────
create table public.payments (
  id               uuid primary key default uuid_generate_v4(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  payment_method   text not null check (payment_method in ('cod','bkash','nagad','rocket')),
  transaction_id   text,
  screenshot_url   text,
  amount           integer not null check (amount > 0),
  status           text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at       timestamptz not null default now()
);

create index on public.payments (order_id);
create index on public.payments (status);

-- ── Row Level Security ────────────────────────────────────────────────────

-- profiles: users can read/update their own profile
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- products: everyone can read active products
alter table public.products enable row level security;

create policy "Anyone can view active products"
  on public.products for select using (is_active = true);

-- orders: users can only see their own orders
alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select using (auth.uid() = user_id);

create policy "Users can create own orders"
  on public.orders for insert with check (auth.uid() = user_id);
