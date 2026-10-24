-- Employee QR Passes: run once on a new Supabase project.
create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('admin', 'guard');
create type public.employee_status as enum ('active', 'suspended', 'fired');
create type public.scan_result as enum ('valid', 'expired', 'suspended', 'not_found');

create sequence public.pass_number_seq start 1;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text check (email is null or length(email) <= 254),
  role public.app_role not null default 'guard',
  created_at timestamptz not null default now()
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) between 2 and 160),
  position text not null check (length(trim(position)) between 1 and 120),
  department text not null check (length(trim(department)) between 1 and 120),
  phone text check (phone is null or length(phone) <= 40),
  photo_path text,
  hire_date date not null default current_date,
  status public.employee_status not null default 'active',
  pass_number text not null unique default ('PASS-' || lpad(nextval('public.pass_number_seq')::text, 4, '0')),
  qr_token text not null unique default encode(extensions.gen_random_bytes(32), 'hex') check (qr_token ~ '^[0-9a-f]{64}$'),
  pass_valid_until date not null default (current_date + 365),
  created_at timestamptz not null default now()
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  contract_number text not null check (length(trim(contract_number)) between 1 and 80),
  contract_type text not null check (length(trim(contract_type)) between 1 and 80),
  start_date date not null,
  end_date date not null,
  file_path text not null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.scan_log (
  id bigint generated always as identity primary key,
  employee_id uuid references public.employees(id) on delete set null,
  scanned_by uuid not null references public.profiles(id),
  result public.scan_result not null,
  scanned_at timestamptz not null default now()
);
create index scan_log_scanned_at_idx on public.scan_log(scanned_at desc);
create index scan_log_employee_idx on public.scan_log(employee_id, scanned_at desc);

create table public.verify_rate_limits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  window_started_at timestamptz not null,
  call_count integer not null default 0
);

create or replace function public.set_updated_profile_on_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, email, role) values (new.id, new.email, 'guard')
  on conflict (id) do update set email=excluded.email;
  return new;
end;
$$;
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute function public.set_updated_profile_on_signup();

create or replace function public.current_app_role()
returns public.app_role language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;
revoke all on function public.current_app_role() from public;
grant execute on function public.current_app_role() to authenticated;

alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.contracts enable row level security;
alter table public.scan_log enable row level security;
alter table public.verify_rate_limits enable row level security;

create policy "profiles_read_self_or_admin" on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.current_app_role()) = 'admin');
create policy "profiles_admin_manage" on public.profiles for all to authenticated
using ((select public.current_app_role()) = 'admin')
with check ((select public.current_app_role()) = 'admin');

create policy "employees_admin_manage" on public.employees for all to authenticated
using ((select public.current_app_role()) = 'admin')
with check ((select public.current_app_role()) = 'admin');
create policy "contracts_admin_manage" on public.contracts for all to authenticated
using ((select public.current_app_role()) = 'admin')
with check ((select public.current_app_role()) = 'admin');
create policy "scan_log_admin_read" on public.scan_log for select to authenticated
using ((select public.current_app_role()) = 'admin');
create policy "rate_limits_no_client_access" on public.verify_rate_limits for all to authenticated
using (false) with check (false);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.employees, public.contracts to authenticated;
grant select on public.scan_log to authenticated;
grant usage, select on sequence public.pass_number_seq to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values
 ('employee-photos','employee-photos',false,10485760,array['image/jpeg','image/png']),
 ('contracts','contracts',false,10485760,array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public=false, file_size_limit=10485760, allowed_mime_types=excluded.allowed_mime_types;

create policy "photos_admin_all" on storage.objects for all to authenticated
using (bucket_id='employee-photos' and (select public.current_app_role())='admin')
with check (bucket_id='employee-photos' and (select public.current_app_role())='admin');
create or replace function public.guard_recently_verified_photo(p_object_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.current_app_role()='guard' and exists (
    select 1 from public.scan_log l
    where l.scanned_by=(select auth.uid())
      and l.result in ('valid','expired','suspended')
      and l.scanned_at > now() - interval '2 minutes'
      and (storage.foldername(p_object_name))[1] = l.employee_id::text
  )
$$;
revoke all on function public.guard_recently_verified_photo(text) from public, anon;
grant execute on function public.guard_recently_verified_photo(text) to authenticated;
-- Guard photo access is restricted to the employee whose pass the same user verified in the last 2 minutes.
create policy "photos_guard_recent_verification" on storage.objects for select to authenticated
using (
  bucket_id='employee-photos'
  and (select public.guard_recently_verified_photo(name))
);
create policy "contracts_admin_all" on storage.objects for all to authenticated
using (bucket_id='contracts' and (select public.current_app_role())='admin')
with check (bucket_id='contracts' and (select public.current_app_role())='admin');

create or replace function public.verify_pass(p_token text)
returns table(full_name text, position text, photo_path text, employee_status text, pass_valid_until date, result text)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_role public.app_role;
  v_employee public.employees%rowtype;
  v_result public.scan_result;
  v_now timestamptz := now();
  v_limiter public.verify_rate_limits%rowtype;
  v_found boolean := false;
begin
  if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select role into v_role from public.profiles where id=v_uid;
  if v_role is distinct from 'guard' then raise exception 'Guard role required' using errcode='42501'; end if;

  insert into public.verify_rate_limits(user_id, window_started_at, call_count)
  values (v_uid, v_now, 1)
  on conflict (user_id) do update set
    window_started_at = case when public.verify_rate_limits.window_started_at < v_now - interval '5 minutes' then v_now else public.verify_rate_limits.window_started_at end,
    call_count = case when public.verify_rate_limits.window_started_at < v_now - interval '5 minutes' then 1 else public.verify_rate_limits.call_count + 1 end
  returning * into v_limiter;
  if v_limiter.call_count > 10 then
    insert into public.scan_log(employee_id, scanned_by, result) values (null, v_uid, 'not_found');
    return query select null::text, null::text, null::text, null::text, null::date, 'not_found'::text;
    return;
  end if;

  if p_token is not null and p_token ~ '^[0-9a-f]{64}$' then
    select * into v_employee from public.employees e where e.qr_token=p_token;
    v_found := found;
  end if;
  if not v_found then
    v_result := 'not_found';
    insert into public.scan_log(employee_id, scanned_by, result) values (null, v_uid, v_result);
    return query select null::text, null::text, null::text, null::text, null::date, v_result::text;
    return;
  end if;
  if v_employee.status='suspended' then v_result := 'suspended';
  elsif v_employee.status='fired' or v_employee.pass_valid_until < current_date then v_result := 'expired';
  else v_result := 'valid'; end if;
  insert into public.scan_log(employee_id, scanned_by, result) values (v_employee.id, v_uid, v_result);
  return query select v_employee.full_name, v_employee.position, v_employee.photo_path, v_employee.status::text, v_employee.pass_valid_until, v_result::text;
end;
$$;
revoke all on function public.verify_pass(text) from public, anon;
grant execute on function public.verify_pass(text) to authenticated;

create or replace function public.reissue_employee_qr(p_employee_id uuid)
returns text language plpgsql security invoker set search_path = '' as $$
declare v_token text;
begin
  if public.current_app_role() is distinct from 'admin' then raise exception 'Admin role required' using errcode='42501'; end if;
  update public.employees set qr_token=encode(extensions.gen_random_bytes(32),'hex') where id=p_employee_id returning qr_token into v_token;
  if v_token is null then raise exception 'Employee not found' using errcode='P0002'; end if;
  return v_token;
end;
$$;
revoke all on function public.reissue_employee_qr(uuid) from public, anon;
grant execute on function public.reissue_employee_qr(uuid) to authenticated;

