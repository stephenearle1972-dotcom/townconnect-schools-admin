-- pg_cron is needed for the nightly sweep. Idempotent.
create extension if not exists pg_cron with schema extensions;
grant usage on schema cron to postgres;

create or replace function public.cleanup_bot_query_log()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted integer;
begin
  delete from public.bot_query_log
  where created_at < now() - interval '90 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- Schedule the sweep nightly at 02:00 UTC. Idempotent — unschedule if already present.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'bot-query-log-retention') then
    perform cron.unschedule('bot-query-log-retention');
  end if;
  perform cron.schedule(
    'bot-query-log-retention',
    '0 2 * * *',
    $sql$select public.cleanup_bot_query_log();$sql$
  );
end$$;
