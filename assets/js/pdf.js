import { CONFIG } from './config.js';
import { supabase } from './db.js';
import { t } from './i18n.js';

const { jsPDF } = window.jspdf;
const fontPath='./assets/fonts/';
async function addFonts(doc){
  for(const [file,name,style] of [['NotoSans-Regular.ttf','NotoSans','normal'],['NotoSans-Bold.ttf','NotoSans','bold']]){
    const res=await fetch(fontPath+file);if(!res.ok)throw new Error('Добавьте файл '+file+' в assets/fonts для PDF с поддержкой кириллицы.');
    const bytes=new Uint8Array(await res.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
    doc.addFileToVFS(file,btoa(binary));doc.addFont(file,name,style);
  }
  doc.setFont('NotoSans','normal');
  const probe=doc.getTextDimensions('Ўзбек oʻ gʻ ʼ Русский');if(!probe.h)throw new Error('Шрифт Noto Sans не поддерживает нужные символы.');
}
async function qrData(url){return QRCode.toDataURL(url,{errorCorrectionLevel:'H',type:'image/png',width:1200,margin:3,color:{dark:'#000000',light:'#FFFFFF'}})}
async function signedPhoto(path){if(!path)return null;const {data,error}=await supabase.storage.from('employee-photos').createSignedUrl(path,CONFIG.signedUrlSeconds);if(error)throw error;return data.signedUrl}
async function photoData(path){const url=await signedPhoto(path);if(!url)return null;const res=await fetch(url);if(!res.ok)throw new Error('Не удалось открыть фото для PDF.');const blob=await res.blob();const source=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=reject;fr.readAsDataURL(blob)});return await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);resolve(c.toDataURL('image/jpeg',.9))};img.onerror=reject;img.src=source})}
function fitText(doc,text,x,y,maxWidth,size=10){doc.setFontSize(size);const lines=doc.splitTextToSize(String(text||'—'),maxWidth);doc.text(lines.slice(0,2),x,y);return lines.slice(0,2).length}
async function initDoc(){const d=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});await addFonts(d);return d}
function save(doc,employee){const safe=(employee.full_name||'employee').normalize('NFKC').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').replace(/\s+/g,'_').slice(0,80);doc.save(`pass_${employee.pass_number}_${safe}.pdf`)}
export async function downloadPass(employee){
  const doc=await initDoc();const url=`${CONFIG.siteUrl}/verify.html?t=${encodeURIComponent(employee.qr_token)}`;const qr=await qrData(url);const photo=await photoData(employee.photo_path);
  doc.setDrawColor(42,62,67);doc.setLineWidth(.35);doc.roundedRect(10,10,190,277,4,4,'S');doc.setFont('NotoSans','bold');doc.setFontSize(20);doc.text(CONFIG.organizationName,18,27,{maxWidth:174});
  doc.setFont('NotoSans','normal');doc.setFontSize(11);doc.text('РАБОЧИЙ ПРОПУСК',18,36);
  if(photo)doc.addImage(photo,'JPEG',18,48,35,45,undefined,'FAST');else{doc.setFillColor(238,243,242);doc.rect(18,48,35,45,'F');doc.setFontSize(9);doc.text('Фото',35.5,71,{align:'center'})}
  doc.setFont('NotoSans','bold');fitText(doc,employee.full_name,62,57,115,18);doc.setFont('NotoSans','normal');doc.setFontSize(13);doc.text(employee.position,62,72,{maxWidth:118});doc.setFontSize(12);doc.text(`Отдел: ${employee.department}`,62,83,{maxWidth:118});
  doc.setFont('NotoSans','bold');doc.setFontSize(14);doc.text(`№ ${employee.pass_number}`,18,111);doc.setFont('NotoSans','normal');doc.setFontSize(11);doc.text(`Действителен до: ${employee.pass_valid_until}`,18,121);
  doc.addImage(qr,'PNG',135,145,50,50,undefined,'FAST');doc.setFontSize(10);doc.text('Проверить пропуск',160,201,{align:'center'});
  doc.line(18,225,100,225);doc.setFontSize(10);doc.text('Подпись руководителя / М.П.',18,232);
  doc.setDrawColor(140);doc.setLineDashPattern([2,2],0);doc.line(10,252,200,252);doc.setLineDashPattern([],0);
  doc.setFontSize(9);doc.text(`Пропуск ${employee.pass_number}`,18,267);doc.text(CONFIG.organizationName,192,267,{align:'right'});save(doc,employee);
}
export async function downloadBatch(employees){
  if(!employees.length)throw new Error('Выберите сотрудников для пакетной печати.');
  const groups=[];for(let i=0;i<employees.length;i+=4)groups.push(employees.slice(i,i+4));
  const doc=await initDoc();
  for(let page=0;page<groups.length;page++){
    if(page)doc.addPage('a4','portrait');
    for(let i=0;i<groups[page].length;i++){
      const e=groups[page][i],x=10+(i%2)*95,y=10+Math.floor(i/2)*138.5,url=`${CONFIG.siteUrl}/verify.html?t=${encodeURIComponent(e.qr_token)}`;
      const qr=await qrData(url),photo=await photoData(e.photo_path);doc.setDrawColor(100);doc.setLineDashPattern([1.5,1.5],0);doc.rect(x,y,95,138.5);doc.setLineDashPattern([],0);
      doc.setFont('NotoSans','bold');doc.setFontSize(9);doc.text(CONFIG.organizationName,x+5,y+8,{maxWidth:84});doc.setFontSize(11);fitText(doc,e.full_name,x+5,y+20,52,11);
      doc.setFont('NotoSans','normal');doc.setFontSize(8);doc.text(e.position,x+5,y+34,{maxWidth:52});doc.text(e.department,x+5,y+42,{maxWidth:52});doc.setFont('NotoSans','bold');doc.text(e.pass_number,x+5,y+53);
      doc.setFont('NotoSans','normal');doc.setFontSize(7);doc.text(`Действует до: ${e.pass_valid_until}`,x+5,y+60,{maxWidth:50});
      if(photo)doc.addImage(photo,'JPEG',x+5,y+70,24,31,undefined,'FAST');doc.addImage(qr,'PNG',x+58,y+70,30,30,undefined,'FAST');
      doc.setFontSize(6.5);doc.text('Подпись руководителя / М.П.',x+5,y+122,{maxWidth:80});doc.line(x+5,y+116,x+87,y+116);
    }
  }
  const first=employees[0];save(doc,{...first,pass_number:employees.length===1?first.pass_number:`${first.pass_number}_batch` ,full_name:employees.length===1?first.full_name:'batch'});
}

