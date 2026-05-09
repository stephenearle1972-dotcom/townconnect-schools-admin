-- Drop the permissive policy
drop policy if exists schools_insert_signup on public.schools;

-- Create the tightened version
create policy schools_insert_authenticated on public.schools
  for insert
  with check (
    auth.uid() is not null
    and (
      not exists (
        select 1 from public.school_admins where user_id = auth.uid()
      )
      or public.is_super_admin()
    )
  );
