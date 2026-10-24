import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm';
import { CONFIG } from './config.js';
export const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(CONFIG.supabaseUrl) && !CONFIG.supabaseKey.startsWith('YOUR_');
export const supabase = configured ? createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, { auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true} }) : null;
export async function currentProfile(){
  if(!supabase) throw new Error('not_configured');
  const {data:{user},error}=await supabase.auth.getUser(); if(error||!user) return null;
  const {data:profile,error:profileError}=await supabase.from('profiles').select('id,role').eq('id',user.id).single();
  if(profileError) throw profileError;
  return {user,profile};
}

