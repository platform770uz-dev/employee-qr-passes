import { initShell, requireRole, qs, message, t } from './common.js';
import { CONFIG } from './config.js';
import { showVerification } from './verify-view.js';
initShell();
if(await requireRole('guard')){
 let scanner=null, running=false;
 const stop=async()=>{if(running&&scanner){await scanner.stop();await scanner.clear();running=false}qs('#reader').hidden=true;qs('#start-scan').textContent=t('start_scan')};
 qs('#start-scan').onclick=async()=>{
   if(running){await stop();return}
   if(!window.Html5Qrcode){message(t('no_camera'));return}
   const reader=qs('#reader');reader.hidden=false;scanner=new Html5Qrcode('reader');
   try{await scanner.start({facingMode:'environment'},{fps:12,qrbox:{width:250,height:250}},async text=>{
     try{const u=new URL(text);const expected=new URL(CONFIG.siteUrl+'/verify.html');if(u.origin!==expected.origin||u.pathname!==expected.pathname)throw new Error('Это не QR-код пропуска.');
       const token=u.searchParams.get('t');await stop();await showVerification(token);
     }catch(e){message(e.message||t('not_found'))}
   },()=>{});running=true;qs('#start-scan').textContent=t('stop_scan')}
   catch{await stop();message(t('no_camera'))}
 };
}

