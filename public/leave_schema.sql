-- Schema for Leave Management
-- Depends on: public.profiles (id, full_name)

-- Enable pgcrypto if not enabled (for gen_random_uuid)
create extension if not exists pgcrypto;

-- leave_types: normalized catalog of leave categories
create table if not exists public.leave_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  color text,
  is_paid boolean not null default true,
  created_at timestamptz not null default now()
);

-- leaves: individual leave requests/records
create table if not exists public.leaves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type_key text references public.leave_types(key) on delete set null,
  start_date date not null,
  end_date date not null,
  status text not null default 'pending', -- pending | approved | rejected
  reason text,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leaves_status_check check (status in ('pending','approved','rejected')),
  constraint leaves_date_range check (end_date >= start_date)
);

-- Indexes for typical queries
create index if not exists idx_leaves_user on public.leaves(user_id);
create index if not exists idx_leaves_period on public.leaves(start_date, end_date);
create index if not exists idx_leaves_status on public.leaves(status);

-- updated_at trigger
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;$$ language plpgsql;

drop trigger if exists trg_leaves_updated on public.leaves;
create trigger trg_leaves_updated before update on public.leaves
for each row execute function public.set_updated_at();

-- Optional RLS setup (uncomment if using RLS, adjust policies to your auth model)
-- alter table public.leaves enable row level security;
-- drop policy if exists "leaves_select_own" on public.leaves;
-- create policy "leaves_select_own" on public.leaves for select using (auth.uid() = user_id);
-- drop policy if exists "leaves_insert_own" on public.leaves;
-- create policy "leaves_insert_own" on public.leaves for insert with check (auth.uid() = user_id);
-- drop policy if exists "leaves_admin_all" on public.leaves;
-- create policy "leaves_admin_all" on public.leaves for all using (exists (
--   select 1 from public.profiles p where p.id = auth.uid() and coalesce(p.role, '') ilike '%admin%'
-- ));
