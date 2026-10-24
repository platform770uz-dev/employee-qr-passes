-- Replace individual employee QR codes with permanent location codes.
-- This migration only changes the employee QR module's tables, policies and RPCs.

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  location_code text not null unique default lower(substr(encode(extensions.gen_random_bytes(12), 'hex'), 1, 16)),
  created_at timestamptz not null default now()
);

alter table public.locations enable row level security;
drop policy if exists locations_admin_manage on public.locations;
create policy locations_admin_manage on public.locations for all to authenticated
using ((select public.current_app_role()) = 'admin')
with check ((select public.current_app_role()) = 'admin');
grant select, insert, update, delete on public.locations to authenticated;

alter table public.employees
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
create unique index if not exists employees_auth_user_id_uidx on public.employees(auth_user_id) where auth_user_id is not null;

alter table public.scan_log
  add column if not exists location_id uuid references public.locations(id) on delete set null;
alter table public.scan_log alter column scanned_by drop not null;
create index if not exists scan_log_location_scanned_at_idx on public.scan_log(location_id, scanned_at desc);

-- The old client RPCs are no longer part of the app. Keep their definitions and QR data
-- for compatibility, but prevent browser clients from invoking them.
revoke all on function public.verify_pass(text) from public, anon, authenticated;
revoke all on function public.reissue_employee_qr(uuid) from public, anon, authenticated;

-- Employees may receive a signed URL for their own photo; contract files remain admin-only.
create or replace function public.guard_recently_verified_photo(p_object_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.employees e
    where e.auth_user_id = (select auth.uid())
      and e.photo_path = p_object_name
  )
$$;
revoke all on function public.guard_recently_verified_photo(text) from public, anon;
grant execute on function public.guard_recently_verified_photo(text) to authenticated;

create or replace function public.check_in(location_code text)
returns table(
  full_name text,
  "position" text,
  photo_path text,
  employee_status text,
  pass_valid_until date,
  result text,
  location_name text
)
language plpgsql security definer set search_path = '' as $$
declare
  v_employee public.employees%rowtype;
  v_location public.locations%rowtype;
  v_result public.scan_result;
  v_now timestamptz := clock_timestamp();
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select * into v_employee from public.employees e
    where e.auth_user_id = (select auth.uid())
    for update;
  if not found then
    raise exception 'Employee account is not linked' using errcode = '42501';
  end if;
  if $1 is null or length(trim($1)) = 0 then
    raise exception 'Location code required' using errcode = '22023';
  end if;
  select * into v_location from public.locations l where l.location_code = trim($1);
  if not found then
    raise exception 'Location not found' using errcode = '22023';
  end if;

  if v_employee.status in ('suspended', 'fired') then
    v_result := 'suspended';
  elsif v_employee.pass_valid_until < (v_now at time zone 'UTC')::date then
    v_result := 'expired';
  else
    v_result := 'valid';
  end if;

  -- The employee row lock serializes simultaneous scans; keep at most one log row per rolling minute.
  if not exists (
    select 1 from public.scan_log l
    where l.employee_id = v_employee.id
      and l.scanned_at > v_now - interval '1 minute'
  ) then
    insert into public.scan_log(employee_id, location_id, scanned_by, result, scanned_at)
    values (v_employee.id, v_location.id, null, v_result, v_now);
  end if;

  return query select
    v_employee.full_name,
    v_employee.position,
    v_employee.photo_path,
    v_employee.status::text,
    v_employee.pass_valid_until,
    upper(v_result::text),
    v_location.name;
end;
$$;
revoke all on function public.check_in(text) from public, anon;
grant execute on function public.check_in(text) to authenticated;

