create table public.super_admin_audit (
  id uuid primary key default gen_random_uuid(),
  super_admin_user_id uuid not null references auth.users(id) on delete cascade,
  super_admin_email text not null,
  action text not null check (action in (
    'view_school',
    'view_school_admins',
    'open_as_admin',
    'mark_as_paid',
    'suspend',
    'change_subscription_status',
    'other'
  )),
  target_school_id uuid references public.schools(id) on delete set null,
  target_school_name text,
  detail jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_super_admin_audit_admin_created
  on public.super_admin_audit(super_admin_user_id, created_at desc);

create index idx_super_admin_audit_school_created
  on public.super_admin_audit(target_school_id, created_at desc);

alter table public.super_admin_audit enable row level security;

create policy super_admin_audit_select_super on public.super_admin_audit
  for select using (public.is_super_admin());

create policy super_admin_audit_insert_service_only on public.super_admin_audit
  for insert with check (false);
