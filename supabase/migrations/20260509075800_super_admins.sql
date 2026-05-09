-- super_admins table
create table public.super_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz default now()
);

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists(select 1 from public.super_admins where user_id = auth.uid());
$$;

create policy schools_select_superadmin on public.schools
  for select using (public.is_super_admin());

do $$
declare t text;
begin
  for t in select unnest(array[
    'school_admins', 'teachers', 'sport_fixtures', 'calendar_events',
    'notices', 'fees', 'bus_routes', 'narrative_content', 'files'
  ])
  loop
    execute format(
      'create policy %I_select_superadmin on public.%I
       for select using (public.is_super_admin());',
      t, t
    );
  end loop;
end$$;

create policy schools_update_superadmin on public.schools
  for update using (public.is_super_admin())
  with check (public.is_super_admin());

alter table public.super_admins enable row level security;

create policy super_admins_select_self on public.super_admins
  for select using (user_id = auth.uid() or public.is_super_admin());
