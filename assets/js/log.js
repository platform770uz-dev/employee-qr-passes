import {supabase,requireRole,initShell,qs,esc,t} from './common.js';
initShell();let page=0;const pageSize=50;
const labels={valid:t('valid'),expired:t('expired'),suspended:t('suspended_result')};
async function loadLocations(){const {data,error}=await supabase.from('locations').select('id,name').order('name');if(error)return;const sel=qs('#location-filter');sel.innerHTML=`<option value="">${esc(t('locations'))}</option>`+(data||[]).map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}
async function load(){
  let q=supabase.from('scan_log').select('id,employee_id,location_id,result,scanned_at,employees(full_name),locations(name)',{count:'exact'}).not('location_id','is',null).order('scanned_at',{ascending:false}).range(page*pageSize,(page+1)*pageSize-1);
  if(qs('#from-date').value)q=q.gte('scanned_at',new Date(`${qs('#from-date').value}T00:00:00`).toISOString());
  if(qs('#to-date').value)q=q.lt('scanned_at',new Date(new Date(`${qs('#to-date').value}T00:00:00`).getTime()+864e5).toISOString());
  if(qs('#result-filter').value)q=q.eq('result',qs('#result-filter').value);if(qs('#location-filter').value)q=q.eq('location_id',qs('#location-filter').value);
  const {data,error,count}=await q;if(error){const notice=qs('#notice');notice.hidden=false;notice.textContent=t('save_error');return}
  qs('#log-rows').innerHTML=(data||[]).map(row=>`<tr><td>${esc(new Date(row.scanned_at).toLocaleString())}</td><td>${esc(row.employees?.full_name||'—')}</td><td>${esc(row.locations?.name||'—')}</td><td><span class="pill ${esc(row.result)}">${esc(labels[row.result]||row.result)}</span></td></tr>`).join('');qs('#empty').hidden=!!data?.length;qs('#page-info').textContent=`${page+1} / ${Math.max(1,Math.ceil((count||0)/pageSize))}`;qs('#prev').disabled=page===0;qs('#next').disabled=(page+1)*pageSize>=(count||0);
}
qs('#apply-filter').onclick=()=>{page=0;load()};qs('#prev').onclick=()=>{page=Math.max(0,page-1);load()};qs('#next').onclick=()=>{page++;load()};
if(await requireRole('admin')){await loadLocations();await load()}

