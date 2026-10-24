import { initShell, currentProfile, configured, supabase } from './common.js';
import { showVerification } from './verify-view.js';
initShell();
if(!configured){await showVerification('');}
else{
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){const next='verify.html'+location.search;location.href='./index.html?next='+encodeURIComponent(next)}
  else{try{const state=await currentProfile();if(state?.profile.role!=='guard'){location.href='./admin.html'}else await showVerification(new URLSearchParams(location.search).get('t'))}catch{location.href='./index.html?next='+encodeURIComponent('verify.html'+location.search)}}
}

