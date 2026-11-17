-- Una fila por pregunta a Clubi: sirve de tope diario por usuario y para ver
-- cuantos tokens de la API de Claude se consumen.
create table if not exists public.clubi_message (
  id bigint generated always as identity primary key,
  auth_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  organization_id bigint references public.organization(id) on delete set null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists clubi_message_user_created_idx
  on public.clubi_message (auth_user_id, created_at desc);

alter table public.clubi_message enable row level security;

grant select, insert on public.clubi_message to authenticated;

create policy clubi_message_select_own on public.clubi_message
  for select to authenticated using (auth_user_id = (select auth.uid()));

create policy clubi_message_insert_own on public.clubi_message
  for insert to authenticated with check (auth_user_id = (select auth.uid()));
