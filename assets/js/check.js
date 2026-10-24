import {supabase,configured,initShell,qs,message,t} from './common.js';
import {CONFIG} from './config.js';

initShell();
const code=new URLSearchParams(location.search).get('loc')?.trim();
const loginPanel=qs('#login-panel'),resultPanel=qs('#result-panel');
let clockTimer=null;
const validPhone=value=>/^\+[1-9]\d{7,14}$/.test(value);
function normalizePhone(value){let s=value.replace(/[\s()\-]/g,'');if(s.startsWith('00'))s='+'+s.slice(2);if(/^998\d{9}$/.test(s))s='+'+s;return s}
function startClock(){const el=qs('#live-clock');const update=()=>{el.textContent=new Intl.DateTimeFormat(document.documentElement.lang==='uz'?'uz-UZ':'ru-RU',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date())};update();clearInterval(clockTimer);clockTimer=setInterval(update,1000)}
function showLogin(){loginPanel.hidden=false;resultPanel.hidden=true}
async function showCheckIn(){
  loginPanel.hidden=true;resultPanel.hidden=false;const card=qs('#result-card');card.className='check-card checking';qs('#result-state').textContent='…';qs('#result-name').textContent='';qs('#result-position').textContent='';qs('#result-valid').textContent='';qs('#result-location').textContent='';
  const img=qs('#result-photo');img.hidden=true;img.removeAttribute('src');
  const {data,error}=await supabase.rpc('check_in',{location_code:code});
  if(error){card.className='check-card suspended';qs('#result-state').textContent=t('auth_error');return}
  const row=Array.isArray(data)?data[0]:data;if(!row){card.className='check-card suspended';qs('#result-state').textContent=t('auth_error');return}
  const result=String(row.result||'SUSPENDED').toUpperCase();const kind=result==='VALID'?'valid':result==='EXPIRED'?'expired':'suspended';
  card.className=`check-card ${kind}`;qs('#result-state').textContent=t(`result_${kind}`);qs('#result-name').textContent=row.full_name||'';qs('#result-position').textContent=row.position||'';qs('#result-location').textContent=row.location_name?`${t('point')}: ${row.location_name}`:'';
  if(row.pass_valid_until)qs('#result-valid').textContent=`${t('valid_until')}: ${new Date(`${row.pass_valid_until}T00:00:00`).toLocaleDateString(document.documentElement.lang==='ru'?'ru-RU':'uz-UZ')}`;
  if(row.photo_path){const {data:file}=await supabase.storage.from('employee-photos').createSignedUrl(row.photo_path,CONFIG.signedUrlSeconds);if(file?.signedUrl){img.src=file.signedUrl;img.hidden=false;img.onerror=()=>{img.hidden=true}}}
  startClock();
}
async function begin(){
  qs('#location-error').hidden=true;
  if(!configured){message(t('no_config'));return}
  if(!code){qs('#location-error').hidden=false;loginPanel.hidden=true;return}
  const {data:{session},error}=await supabase.auth.getSession();if(error){message(t('auth_error'));return}
  if(session){await showCheckIn();return}showLogin();
}
qs('#employee-login').addEventListener('submit',async e=>{
  e.preventDefault();if(!configured){message(t('no_config'));return}
  const phone=normalizePhone(qs('#phone').value.trim()),pin=qs('#pin').value.trim();
  if(!validPhone(phone)){message(t('phone_format'));return}if(!/^\d{4,6}$/.test(pin)){message(t('pin_format'));return}
  const button=e.currentTarget.querySelector('button[type="submit"]');button.disabled=true;
  const {error}=await supabase.auth.signInWithPassword({phone,password:pin});button.disabled=false;
  if(error){message(t('auth_error'));return}qs('#pin').value='';await showCheckIn();
});
qs('#try-again').addEventListener('click',showCheckIn);
begin();

