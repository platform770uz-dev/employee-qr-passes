import { supabase, configured, qs, message, t, esc } from './common.js';
import { CONFIG } from './config.js';
const resultText={valid:'valid',expired:'expired',suspended:'suspended',not_found:'not_found'};
export async function showVerification(token){
  const panel=qs('#result-card');if(!panel)return;
  if(!configured){message(t('no_config'));return}
  if(!token||!/^[0-9a-f]{64}$/.test(token)){render(null,'not_found');return}
  const {data,error}=await supabase.rpc('verify_pass',{p_token:token});
  if(error){message(error.message.includes('Rate limit')?'Слишком много проверок. Подождите 5 минут.':t('role_error'));return}
  const row=Array.isArray(data)?data[0]:data;render(row,row?.result||'not_found');
  if(row?.photo_path&&row.result!=='not_found'){
    const {data:file}=await supabase.storage.from('employee-photos').createSignedUrl(row.photo_path,CONFIG.signedUrlSeconds);
    if(file?.signedUrl){const img=qs('#result-photo');img.src=file.signedUrl;img.hidden=false;img.onerror=()=>{img.hidden=true}}
  }
}
function render(row,result){
  const panel=qs('#result-card'),state=qs('#result-state'),label=resultText[result]||'not_found';panel.className=`card result-card ${label}`;
  state.textContent=t(label==='not_found'?'not_found':label==='suspended'?'suspended_result':label);state.className=`result-state pill ${label}`;
  qs('#result-name').textContent=row?.full_name||'';qs('#result-position').textContent=row?.position||'';qs('#result-valid').textContent=row?.pass_valid_until?`${t('pass_valid_until')}: ${new Date(`${row.pass_valid_until}T00:00:00`).toLocaleDateString()}`:'';
  const img=qs('#result-photo');img.hidden=true;img.removeAttribute('src');
  qs('#result-details').hidden=!row||result==='not_found';
}

