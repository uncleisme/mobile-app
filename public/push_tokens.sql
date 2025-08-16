-- Supabase schema for web push tokens
-- Run this in Supabase SQL editor or via migration tooling

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  token text not null unique,
  platform text not null check (platform in ('web')),
  created_at timestamptz not null default now()
);

-- Helpful index if you query by user/platform often
create index if not exists push_tokens_user_platform_idx on public.push_tokens (user_id, platform);

alter table public.push_tokens enable row level security;

-- Helper: create policy only if it does not exist
do $$ begin
  if not exists (
    select 1 from pg_policy p
    where p.polname = 'insert own token' and p.polrelid = 'public.push_tokens'::regclass
  ) then
    create policy "insert own token"
      on public.push_tokens for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policy p
    where p.polname = 'select own tokens' and p.polrelid = 'public.push_tokens'::regclass
  ) then
    create policy "select own tokens"
      on public.push_tokens for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policy p
    where p.polname = 'delete own tokens' and p.polrelid = 'public.push_tokens'::regclass
  ) then
    create policy "delete own tokens"
      on public.push_tokens for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policy p
    where p.polname = 'update own tokens' and p.polrelid = 'public.push_tokens'::regclass
  ) then
    create policy "update own tokens"
      on public.push_tokens for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
