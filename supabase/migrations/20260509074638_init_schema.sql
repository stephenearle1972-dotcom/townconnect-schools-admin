-- =====================================================
-- TownConnect Schools — Initial Schema
-- =====================================================

-- Schools (the tenant)
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  short_code text unique,
  principal_name text,
  contact_email text not null,
  contact_phone text,
  address text,
  logo_url text,
  bot_phone_number_id text,
  bot_phone_e164 text,
  trial_bot_prefix text unique,
  subscription_status text not null default 'trial' check (
    subscription_status in ('trial', 'active', 'past_due', 'read_only', 'cancelled')
  ),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  paid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_schools_slug on public.schools(slug);
create index idx_schools_status on public.schools(subscription_status);

-- School admins (links auth users to schools)
create table public.school_admins (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'editor', 'viewer')),
  invited_by uuid references auth.users(id),
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (school_id, user_id)
);

create index idx_school_admins_user on public.school_admins(user_id);
create index idx_school_admins_school on public.school_admins(school_id);

-- Teachers
create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  full_name text not null,
  subjects text[],
  grades text[],
  email text,
  phone text,
  photo_url text,
  bio text,
  display_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_teachers_school on public.teachers(school_id);

-- Sport fixtures
create table public.sport_fixtures (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  fixture_date date not null,
  fixture_time time,
  sport text not null,
  age_group text,
  team text,
  opponent text,
  venue text,
  is_home boolean default true,
  result text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_fixtures_school_date on public.sport_fixtures(school_id, fixture_date);

-- Calendar events
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  event_date date not null,
  event_end_date date,
  title text not null,
  description text,
  category text,
  is_public boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_events_school_date on public.calendar_events(school_id, event_date);

-- Notices (the noticeboard)
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  body text not null,
  urgency text default 'normal' check (urgency in ('low', 'normal', 'high', 'urgent')),
  publish_at timestamptz default now(),
  expires_at timestamptz,
  attachment_url text,
  is_published boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  deleted_at timestamptz
);

create index idx_notices_school_publish on public.notices(school_id, publish_at);

-- Fees
create table public.fees (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  grade text not null,
  fee_type text not null,
  amount numeric(10, 2) not null,
  currency text default 'ZAR',
  due_date date,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_fees_school on public.fees(school_id);

-- Bus routes
create table public.bus_routes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  route_name text not null,
  description text,
  stops jsonb,
  morning_pickup_times jsonb,
  afternoon_dropoff_times jsonb,
  monthly_fee numeric(10, 2),
  contact_name text,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_bus_routes_school on public.bus_routes(school_id);

-- Narrative content (rich text blocks)
create table public.narrative_content (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  slug text not null,
  title text not null,
  body text not null,
  display_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (school_id, slug)
);

create index idx_narrative_school on public.narrative_content(school_id);

-- Files (PDFs, images, etc)
create table public.files (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  category text,
  filename text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  description text,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_files_school on public.files(school_id);

-- =====================================================
-- Updated_at trigger
-- =====================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'schools', 'teachers', 'sport_fixtures', 'calendar_events',
    'notices', 'fees', 'bus_routes', 'narrative_content'
  ])
  loop
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I
       for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end$$;

-- =====================================================
-- Helper function: which schools does the current user admin?
-- =====================================================

create or replace function public.user_school_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select school_id from public.school_admins where user_id = auth.uid();
$$;

-- =====================================================
-- Enable RLS on every table
-- =====================================================

alter table public.schools enable row level security;
alter table public.school_admins enable row level security;
alter table public.teachers enable row level security;
alter table public.sport_fixtures enable row level security;
alter table public.calendar_events enable row level security;
alter table public.notices enable row level security;
alter table public.fees enable row level security;
alter table public.bus_routes enable row level security;
alter table public.narrative_content enable row level security;
alter table public.files enable row level security;
