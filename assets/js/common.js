import {supabase,configured,currentProfile} from './db.js';
import {t,getLanguage,setLanguage,bindTranslations} from './i18n.js';
export {supabase,configured,currentProfile,t};
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const qs=(sel,root=document)=>root.querySelector(sel);
export const fmtDate=value=>value?new Date(`${value}T00:00:00`).toLocaleDateString(getLanguage()==='ru'?'ru-RU':'uz-UZ'):'—';
export function initShell(){
  bindTranslations();const lang=qs('#language');if(lang){lang.value=getLanguage();lang.addEventListener('change',e=>{setLanguage(e.target.value);location.reload()})}
  qs('#logout')?.addEventListener('click',async()=>{await supabase?.auth.signOut();if(document.body.classList.contains('check-page'))location.reload();else location.href='./index.html'});
}
export async function requireRole(role){
  if(!configured){const box=qs('#notice');if(box){box.hidden=false;box.textContent=t('no_config')}return null}
  try{const state=await currentProfile();if(!state){location.href='./index.html';return null}if(state.profile.role!==role){location.href='./admin.html';return null}return state}
  catch{const box=qs('#notice');if(box){box.hidden=false;box.textContent=t('role_error')}return null}
}
export function message(text,type='error'){const box=qs('#notice');if(box){box.hidden=false;box.className=type;box.textContent=text}}
export function bindLogin(){
  initShell();const form=qs('#login-form');if(!form)return;
  form.addEventListener('submit',async e=>{e.preventDefault();if(!configured){message(t('no_config'));return}const button=form.querySelector('button[type=submit]');button.disabled=true;
    const {error}=await supabase.auth.signInWithPassword({email:form.email.value.trim(),password:form.password.value});button.disabled=false;
    if(error){message(t('auth_error'));return}try{const state=await currentProfile();if(state?.profile.role==='admin'){location.href='./admin.html';return}await supabase.auth.signOut();message(t('role_error'))}catch{await supabase.auth.signOut();message(t('role_error'))}
  });
}

