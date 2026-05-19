-- Run on an EXISTING database to align with manual payment system.
-- Review before executing in production.

-- Orders: rename columns and tighten status values
alter table public.orders rename column total to total_price;
alter table public.orders rename column status to order_status;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_order_status_check check (order_status in (
    'pending','processing','shipped','delivered'
  ));

alter table public.orders
  add constraint orders_payment_status_check check (payment_status in (
    'unpaid','pending_verification','paid'
  ));

-- Drop Stripe column if it still exists
alter table public.orders drop column if exists payment_intent_id;

-- Map legacy values (adjust if your data differs)
update public.orders set payment_status = 'unpaid' where payment_status in ('pending', 'failed');
update public.orders set payment_status = 'paid' where payment_status = 'paid';
update public.orders set payment_status = 'pending_verification' where payment_status not in ('unpaid', 'paid');

update public.orders set order_status = 'pending' where order_status in ('payment_confirmed', 'cancelled', 'refunded');
update public.orders set order_status = 'processing' where order_status = 'processing';

-- Payments table (skip if already created)
create table if not exists public.payments (
  id               uuid primary key default uuid_generate_v4(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  payment_method   text not null check (payment_method in ('cod','bkash','nagad','rocket')),
  transaction_id   text,
  screenshot_url   text,
  amount           integer not null check (amount > 0),
  status           text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at       timestamptz not null default now()
);

create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists payments_status_idx on public.payments (status);
