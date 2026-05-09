-- Drop the redundant email column from super_admins
alter table public.super_admins drop column email;

-- Document school_admins.email as deliberately denormalised
comment on column public.school_admins.email is
  'Denormalised — set at invite time before auth user exists. May drift if user later changes their auth email. JOIN auth.users for canonical email.';

-- Helper view for super admins with current canonical email
create or replace view public.v_super_admins as
  select s.user_id, s.created_at, u.email
  from public.super_admins s
  left join auth.users u on u.id = s.user_id;

grant select on public.v_super_admins to authenticated;
