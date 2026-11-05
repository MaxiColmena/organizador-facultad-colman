-- Ejecutar en Supabase → SQL Editor. Crea la tabla de datos y el bucket de adjuntos con seguridad por usuario.

create table if not exists public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

drop policy if exists "dueño lee" on public.user_state;
drop policy if exists "dueño escribe" on public.user_state;
drop policy if exists "dueño actualiza" on public.user_state;
create policy "dueño lee" on public.user_state for select using (auth.uid() = user_id);
create policy "dueño escribe" on public.user_state for insert with check (auth.uid() = user_id);
create policy "dueño actualiza" on public.user_state for update using (auth.uid() = user_id);

-- Bucket privado para PDFs y documentación
insert into storage.buckets (id, name, public) values ('adjuntos', 'adjuntos', false)
on conflict (id) do nothing;

drop policy if exists "adjuntos propios select" on storage.objects;
drop policy if exists "adjuntos propios insert" on storage.objects;
drop policy if exists "adjuntos propios update" on storage.objects;
drop policy if exists "adjuntos propios delete" on storage.objects;
create policy "adjuntos propios select" on storage.objects for select
  using (bucket_id = 'adjuntos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "adjuntos propios insert" on storage.objects for insert
  with check (bucket_id = 'adjuntos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "adjuntos propios update" on storage.objects for update
  using (bucket_id = 'adjuntos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "adjuntos propios delete" on storage.objects for delete
  using (bucket_id = 'adjuntos' and (storage.foldername(name))[1] = auth.uid()::text);
