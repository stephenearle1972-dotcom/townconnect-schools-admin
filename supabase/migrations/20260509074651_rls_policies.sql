-- =====================================================
-- Schools — admins can read/update their own school
-- =====================================================

create policy schools_select_own on public.schools
  for select using (id in (select public.user_school_ids()));

create policy schools_update_own on public.schools
  for update using (id in (select public.user_school_ids()))
  with check (id in (select public.user_school_ids()));

-- Anyone can insert a new school (sign-up flow)
create policy schools_insert_signup on public.schools
  for insert with check (true);

-- =====================================================
-- school_admins — see your own admin links + members of your schools
-- =====================================================

create policy school_admins_select on public.school_admins
  for select using (
    user_id = auth.uid()
    or school_id in (select public.user_school_ids())
  );

create policy school_admins_insert on public.school_admins
  for insert with check (
    user_id = auth.uid()
    or school_id in (select public.user_school_ids())
  );

create policy school_admins_delete on public.school_admins
  for delete using (school_id in (select public.user_school_ids()));

-- =====================================================
-- Generic policy template applied to all per-school tables
-- =====================================================

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'teachers', 'sport_fixtures', 'calendar_events',
    'notices', 'fees', 'bus_routes', 'narrative_content', 'files'
  ])
  loop
    execute format(
      'create policy %I_select_own on public.%I
       for select using (school_id in (select public.user_school_ids()));',
      t, t
    );
    execute format(
      'create policy %I_insert_own on public.%I
       for insert with check (school_id in (select public.user_school_ids()));',
      t, t
    );
    execute format(
      'create policy %I_update_own on public.%I
       for update using (school_id in (select public.user_school_ids()))
       with check (school_id in (select public.user_school_ids()));',
      t, t
    );
    execute format(
      'create policy %I_delete_own on public.%I
       for delete using (school_id in (select public.user_school_ids()));',
      t, t
    );
  end loop;
end$$;
