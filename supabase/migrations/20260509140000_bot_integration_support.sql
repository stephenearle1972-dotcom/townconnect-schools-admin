-- =====================================================
-- bot_query_log — every WhatsApp query, for analytics + debugging
-- =====================================================

create table if not exists public.bot_query_log (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  parent_phone text,
  prefix_used text,
  message_text text,
  response_text text,
  tokens_in int,
  tokens_out int,
  latency_ms int,
  status text check (status in ('answered', 'unknown_prefix', 'school_paused', 'no_prefix', 'error')),
  error_detail text,
  created_at timestamptz not null default now()
);

create index if not exists idx_bot_log_school_created
  on public.bot_query_log(school_id, created_at desc);

create index if not exists idx_bot_log_status_created
  on public.bot_query_log(status, created_at desc);

alter table public.bot_query_log enable row level security;

create policy bot_log_select_super on public.bot_query_log
  for select using (public.is_super_admin());

create policy bot_log_select_own_school on public.bot_query_log
  for select using (school_id in (select public.user_school_ids()));

create policy bot_log_insert_service_only on public.bot_query_log
  for insert with check (false);

-- =====================================================
-- get_school_by_prefix_or_phone
-- =====================================================

create or replace function public.get_school_by_prefix_or_phone(
  p_prefix text default null,
  p_phone_id text default null
)
returns public.schools
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select * from public.schools
  where deleted_at is null
    and (
      (p_prefix is not null and upper(trial_bot_prefix) = upper(p_prefix))
      or (p_phone_id is not null and bot_phone_number_id = p_phone_id)
    )
  order by
    case when p_phone_id is not null and bot_phone_number_id = p_phone_id then 0 else 1 end
  limit 1;
$$;

-- =====================================================
-- get_school_full_data
-- =====================================================

create or replace function public.get_school_full_data(p_school_id uuid)
returns jsonb
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'school', to_jsonb(s.*),
    'teachers', coalesce(
      (select jsonb_agg(to_jsonb(t.*) order by t.display_order, t.full_name)
       from public.teachers t
       where t.school_id = s.id and t.deleted_at is null),
      '[]'::jsonb
    ),
    'fixtures_upcoming', coalesce(
      (select jsonb_agg(to_jsonb(f.*) order by f.fixture_date, f.fixture_time)
       from public.sport_fixtures f
       where f.school_id = s.id
         and f.deleted_at is null
         and f.fixture_date >= current_date
         and f.fixture_date < current_date + interval '60 days'),
      '[]'::jsonb
    ),
    'fixtures_recent', coalesce(
      (select jsonb_agg(to_jsonb(f.*) order by f.fixture_date desc)
       from public.sport_fixtures f
       where f.school_id = s.id
         and f.deleted_at is null
         and f.fixture_date < current_date
         and f.fixture_date >= current_date - interval '30 days'),
      '[]'::jsonb
    ),
    'calendar_upcoming', coalesce(
      (select jsonb_agg(to_jsonb(c.*) order by c.event_date)
       from public.calendar_events c
       where c.school_id = s.id
         and c.deleted_at is null
         and c.event_date >= current_date
         and c.event_date < current_date + interval '180 days'),
      '[]'::jsonb
    ),
    'notices_active', coalesce(
      (select jsonb_agg(to_jsonb(n.*) order by n.publish_at desc)
       from public.notices n
       where n.school_id = s.id
         and n.deleted_at is null
         and n.is_published = true
         and n.publish_at <= now()
         and (n.expires_at is null or n.expires_at > now())),
      '[]'::jsonb
    ),
    'fees', coalesce(
      (select jsonb_agg(to_jsonb(f.*) order by f.grade, f.fee_type)
       from public.fees f
       where f.school_id = s.id and f.deleted_at is null),
      '[]'::jsonb
    ),
    'bus_routes', coalesce(
      (select jsonb_agg(to_jsonb(b.*) order by b.route_name)
       from public.bus_routes b
       where b.school_id = s.id and b.deleted_at is null),
      '[]'::jsonb
    ),
    'narrative', coalesce(
      (select jsonb_agg(to_jsonb(n.*) order by n.display_order, n.slug)
       from public.narrative_content n
       where n.school_id = s.id and n.deleted_at is null),
      '[]'::jsonb
    ),
    'files', coalesce(
      (select jsonb_agg(to_jsonb(f.*) order by f.created_at desc)
       from public.files f
       where f.school_id = s.id and f.deleted_at is null),
      '[]'::jsonb
    )
  )
  from public.schools s
  where s.id = p_school_id and s.deleted_at is null;
$$;

grant execute on function public.get_school_by_prefix_or_phone(text, text) to authenticated, service_role;
grant execute on function public.get_school_full_data(uuid) to authenticated, service_role;
