-- Saku Finance — backup/restore schema
-- Jalankan di Supabase Dashboard → SQL Editor → New query → paste → Run

-- Tabel snapshot data per user (1 row per user, di-overwrite tiap backup)
create table if not exists public.saku_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  device_label text,
  size_bytes integer generated always as (octet_length(data::text)) stored,
  updated_at timestamptz default now()
);

-- Index untuk filter cepat (opsional)
create index if not exists saku_backups_updated_idx
  on public.saku_backups (updated_at desc);

-- RLS: user hanya bisa baca/tulis data mereka sendiri
alter table public.saku_backups enable row level security;

drop policy if exists "saku_backups_select_own" on public.saku_backups;
create policy "saku_backups_select_own"
  on public.saku_backups for select
  using (auth.uid() = user_id);

drop policy if exists "saku_backups_insert_own" on public.saku_backups;
create policy "saku_backups_insert_own"
  on public.saku_backups for insert
  with check (auth.uid() = user_id);

drop policy if exists "saku_backups_update_own" on public.saku_backups;
create policy "saku_backups_update_own"
  on public.saku_backups for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "saku_backups_delete_own" on public.saku_backups;
create policy "saku_backups_delete_own"
  on public.saku_backups for delete
  using (auth.uid() = user_id);

-- Trigger: auto-update updated_at on UPDATE
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists saku_backups_set_updated_at on public.saku_backups;
create trigger saku_backups_set_updated_at
  before update on public.saku_backups
  for each row execute function public.set_updated_at();
