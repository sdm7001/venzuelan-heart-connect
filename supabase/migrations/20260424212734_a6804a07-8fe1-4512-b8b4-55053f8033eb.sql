create table if not exists public.staff_step_up (
  user_id uuid primary key,
  verified_at timestamptz not null default now(),
  method text not null default 'password',
  updated_at timestamptz not null default now()
);

alter table public.staff_step_up enable row level security;

create policy "own step-up read"
  on public.staff_step_up for select
  to authenticated
  using (user_id = auth.uid());

create policy "own step-up upsert"
  on public.staff_step_up for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "own step-up update"
  on public.staff_step_up for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create trigger staff_step_up_set_updated_at
  before update on public.staff_step_up
  for each row execute function public.tg_set_updated_at();