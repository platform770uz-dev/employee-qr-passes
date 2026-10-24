import {CONFIG} from './config.js';
import {supabase,requireRole,initShell,qs,esc,fmtDate,message,t} from './common.js';
import {downloadLocationPoster} from './pdf.js';

let employees=[],locations=[];
const modal=qs('#employee-modal'),form=qs('#employee-form');
function showModal(open=true){modal.hidden=!open}
function setNotice(text){const box=qs('#modal-notice');box.textContent=text;box.hidden=false}
function normalizePhone(value){let s=value.replace(/[\s()\-]/g,'');if(s.startsWith('00'))s='+'+s.slice(2);if(/^998\d{9}$/.test(s))s='+'+s;return s}
function validPhone(value){return /^\+[1-9]\d{7,14}$/.test(value)}
function rowHtml(e){return `<tr><td><strong>${esc(e.full_name)}</strong></td><td>${esc(e.position)}</td><td>${esc(e.department)}</td><td>${esc(e.phone||'—')}</td><td><span class="pill ${esc(e.status)}">${esc(t(e.status))}</span></td><td>${esc(fmtDate(e.pass_valid_until))}</td><td><button class="button secondary edit" data-id="${esc(e.id)}">Открыть</button></td></tr>`}
async function loadEmployees(){
  const {data,error}=await supabase.from('employees').select('id,full_name,position,department,phone,photo_path,hire_date,status,pass_valid_until,auth_user_id').order('full_name');
  if(error){message(t('save_error'));return}employees=data||[];
  for(const e of employees){if(e.photo_path){const {data:s}=await supabase.storage.from('employee-photos').createSignedUrl(e.photo_path,120);e.photo_preview=s?.signedUrl||''}}
  fillDepartments();render();
}
async function loadLocations(){const {data,error}=await supabase.from('locations').select('id,name,location_code').order('name');if(error){message(t('save_error'));return}locations=data||[];renderLocations()}
function renderLocations(){
  const list=qs('#location-list');list.innerHTML=locations.map(x=>{const url=`${CONFIG.siteUrl}/check.html?loc=${encodeURIComponent(x.location_code)}`;return `<article class="location-item"><div><strong>${esc(x.name)}</strong><div class="small muted">${esc(t('location_code'))}: ${esc(x.location_code)}</div><a class="small" href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a></div><div class="row location-actions"><button class="button secondary copy-location" data-url="${esc(url)}" type="button">${esc(t('copy'))}</button><button class="button poster-location" data-id="${esc(x.id)}" type="button">${esc(t('poster'))}</button></div></article>`}).join('')||`<div class="empty">${esc(t('no_data'))}</div>`;
  list.querySelectorAll('.copy-location').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.url);message(t('copied'),'success')}catch{message(b.dataset.url,'notice')}});
  list.querySelectorAll('.poster-location').forEach(b=>b.onclick=async()=>{const location=locations.find(x=>x.id===b.dataset.id);try{await downloadLocationPoster(location)}catch(e){message(e.message||t('save_error'))}});
}
function fillDepartments(){const sel=qs('#department-filter'),v=sel.value,opts=[...new Set(employees.map(e=>e.department))].sort();sel.innerHTML='<option value="">Все отделы</option>'+opts.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');sel.value=opts.includes(v)?v:''}
function filtered(){const query=qs('#search').value.trim().toLocaleLowerCase();return employees.filter(e=>(!query||`${e.full_name} ${e.phone||''} ${e.department}`.toLocaleLowerCase().includes(query))&&(!qs('#status-filter').value||e.status===qs('#status-filter').value)&&(!qs('#department-filter').value||e.department===qs('#department-filter').value))}
function render(){const list=filtered();qs('#employee-list').innerHTML=list.map(rowHtml).join('');qs('#empty').hidden=!!list.length;qs('#employee-list').querySelectorAll('.edit').forEach(b=>b.onclick=()=>openEdit(b.dataset.id))}
function setForm(e={}){
  form.reset();form.id.value=e.id||'';form.full_name.value=e.full_name||'';form.position.value=e.position||'';form.department.value=e.department||'';form.phone.value=e.phone||'';form.hire_date.value=e.hire_date||new Date().toISOString().slice(0,10);form.pass_valid_until.value=e.pass_valid_until||new Date(Date.now()+365*864e5).toISOString().slice(0,10);form.status.value=e.status||'active';
  qs('#contract-section').hidden=!e.id;qs('#set-pin').hidden=!e.id;qs('#modal-title').textContent=e.id?'Карточка сотрудника':'Новый сотрудник';qs('#modal-notice').hidden=true;if(e.id)loadContracts(e.id);
}
function openEdit(id){const e=employees.find(x=>x.id===id);if(e){setForm(e);showModal()}}
async function loadContracts(id){
  const {data,error}=await supabase.from('contracts').select('*').eq('employee_id',id).order('end_date',{ascending:true});if(error){message(t('save_error'));return}
  const list=qs('#contract-list');list.innerHTML=(data||[]).map(c=>`<div class="contract-item"><div><strong>${esc(c.contract_number)}</strong><div class="small muted">${esc(c.contract_type)} · ${esc(fmtDate(c.start_date))} — ${esc(fmtDate(c.end_date))}</div></div><button class="button secondary" data-file="${esc(c.file_path)}" data-name="${esc(c.contract_number)}">${esc(t('download'))}</button></div>`).join('')||`<div class="empty">${esc(t('no_data'))}</div>`;
  list.querySelectorAll('[data-file]').forEach(btn=>btn.onclick=async()=>{const {data,error}=await supabase.storage.from('contracts').createSignedUrl(btn.dataset.file,120,{download:btn.dataset.name});if(error){message(error.message);return}window.open(data.signedUrl,'_blank','noopener,noreferrer')});
  const near=(data||[]).filter(c=>new Date(`${c.end_date}T00:00:00`)>=new Date()&&new Date(`${c.end_date}T00:00:00`)-Date.now()<=30*864e5);const warn=qs('#contract-warning');warn.hidden=!near.length;if(near.length)warn.textContent=`${t('soon')}: ${near.map(x=>`${x.contract_number} — ${fmtDate(x.end_date)}`).join(', ')}`;
}
async function validateFile(file,allowed){if(!file)return null;if(file.size>CONFIG.maxUploadBytes)throw new Error(t('file_limit'));if(!allowed.includes(file.type))throw new Error('Допустимы только JPG, PNG и PDF.');return file}
async function setEmployeePin(employeeId){
  const pin=form.pin.value.trim();if(!/^\d{4,6}$/.test(pin)){setNotice(t('pin_format'));return false}
  const {error}=await supabase.functions.invoke('employee-auth',{body:{action:'set_pin',employee_id:employeeId,pin}});
  if(error){setNotice(error.message||t('pin_error'));return false}form.pin.value='';message(t('pin_saved'),'success');await loadEmployees();return true;
}
async function saveEmployee(e){
  e.preventDefault();const phone=normalizePhone(form.phone.value.trim());if(phone&&!validPhone(phone)){setNotice(t('phone_format'));return}
  const body={full_name:form.full_name.value.trim(),position:form.position.value.trim(),department:form.department.value.trim(),phone:phone||null,hire_date:form.hire_date.value,status:form.status.value,pass_valid_until:form.pass_valid_until.value};
  if(body.full_name.length<2||!body.position||!body.department){setNotice(t('save_error'));return}
  const id=form.id.value;const res=id?await supabase.from('employees').update(body).eq('id',id).select().single():await supabase.from('employees').insert(body).select().single();if(res.error){setNotice(t('save_error'));return}
  if(!id){form.id.value=res.data.id;qs('#contract-section').hidden=false;qs('#set-pin').hidden=false;qs('#modal-title').textContent='Карточка сотрудника'}
  let employee=res.data;try{const file=await validateFile(form.photo.files[0],['image/jpeg','image/png']);if(file){const ext=file.type==='image/png'?'png':'jpg',path=`${employee.id}/${crypto.randomUUID()}.${ext}`;const up=await supabase.storage.from('employee-photos').upload(path,file,{contentType:file.type,upsert:false});if(up.error)throw up.error;const upd=await supabase.from('employees').update({photo_path:path}).eq('id',employee.id).select().single();if(upd.error)throw upd.error;employee=upd.data}}
  catch(err){setNotice(err.message||t('save_error'));return}
  if(form.pin.value.trim()){if(!employee.phone){setNotice(t('phone_format'));return}const ok=await setEmployeePin(employee.id);if(!ok)return}
  showModal(false);await loadEmployees();
}
async function addContract(){
  const id=form.id.value;if(!id){message('Сначала сохраните карточку сотрудника.','error');return}
  const file=form.contract_file.files[0],number=form.contract_number.value.trim(),type=form.contract_type.value.trim(),start=form.start_date.value,end=form.end_date.value;
  if(!number||!type||!start||!end||!file){message('Заполните все поля договора и выберите файл.');return}
  try{await validateFile(file,['application/pdf','image/jpeg','image/png']);const ext={'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png'}[file.type],path=`${id}/${crypto.randomUUID()}.${ext}`;const up=await supabase.storage.from('contracts').upload(path,file,{contentType:file.type,upsert:false});if(up.error)throw up.error;
    const {error}=await supabase.from('contracts').insert({employee_id:id,contract_number:number,contract_type:type,start_date:start,end_date:end,file_path:path});if(error){await supabase.storage.from('contracts').remove([path]);throw error}
    ['contract_number','contract_type','start_date','end_date','contract_file'].forEach(k=>form[k].value='');await loadContracts(id);
  }catch(err){message(err.message||t('save_error'))}
}
async function createLocation(e){e.preventDefault();const name=qs('#location-name').value.trim();if(!name)return;const {error}=await supabase.from('locations').insert({name});if(error){message(t('location_error'));return}qs('#location-name').value='';await loadLocations()}

initShell();
qs('#add-employee').onclick=()=>{setForm();showModal()};document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>showModal(false));modal.addEventListener('click',e=>{if(e.target===modal)showModal(false)});
form.addEventListener('submit',saveEmployee);qs('#add-contract').onclick=addContract;qs('#set-pin').onclick=()=>setEmployeePin(form.id.value);qs('#location-form').addEventListener('submit',createLocation);
qs('#search').oninput=render;qs('#status-filter').onchange=render;qs('#department-filter').onchange=render;
if(await requireRole('admin')){await Promise.all([loadEmployees(),loadLocations()])}

