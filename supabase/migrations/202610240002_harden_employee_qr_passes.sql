-- Keep SECURITY DEFINER helper RPCs unavailable to unauthenticated clients.
revoke all on function public.current_app_role() from public, anon;
grant execute on function public.current_app_role() to authenticated;

-- Signup runs this through the trigger; clients do not need to call the trigger function directly.
revoke all on function public.set_updated_profile_on_signup() from public, anon, authenticated;

