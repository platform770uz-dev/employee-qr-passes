import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://platform770uz-dev.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = req.headers.get("Authorization") ?? "";
  const jwt = authorization.replace(/^Bearer\s+/i, "");
  if (!url || !anonKey || !serviceKey || !jwt) return reply(401, { error: "Admin authentication required" });

  const userClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await userClient.auth.getUser(jwt);
  if (authError || !authData.user) return reply(401, { error: "Admin authentication required" });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile, error: profileError } = await admin
    .from("profiles").select("role").eq("id", authData.user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") return reply(403, { error: "Administrator role required" });

  let body: { action?: string; employee_id?: string; pin?: string };
  try { body = await req.json(); } catch { return reply(400, { error: "Invalid request" }); }
  if (body.action !== "set_pin" || !body.employee_id || !/^[0-9a-f-]{36}$/i.test(body.employee_id)) {
    return reply(400, { error: "Invalid request" });
  }
  if (!body.pin || !/^\d{4,6}$/.test(body.pin)) return reply(400, { error: "PIN must contain 4 to 6 digits" });

  const { data: employee, error: employeeError } = await admin
    .from("employees").select("id,phone,auth_user_id").eq("id", body.employee_id).maybeSingle();
  if (employeeError || !employee) return reply(404, { error: "Employee not found" });
  const phone = String(employee.phone ?? "").replace(/[\s()\-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) return reply(400, { error: "Enter an employee phone in international format" });

  let userId = employee.auth_user_id as string | null;
  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      phone,
      phone_confirm: true,
      password: body.pin,
    });
    if (error) return reply(400, { error: "Supabase Auth rejected this phone or PIN. Check the project password policy." });
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      phone,
      phone_confirm: true,
      password: body.pin,
    });
    if (error || !data.user) return reply(409, { error: "Could not create the employee login. The phone may already belong to a Supabase Auth user, or the project password policy rejected the PIN." });
    userId = data.user.id;
    const { error: linkError } = await admin.from("employees").update({ auth_user_id: userId }).eq("id", employee.id);
    if (linkError) {
      await admin.auth.admin.deleteUser(userId);
      return reply(500, { error: "Could not link the employee login; the new Auth user was removed." });
    }
  }

  return reply(200, { ok: true });
});

