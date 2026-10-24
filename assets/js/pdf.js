import {CONFIG} from './config.js';
import {t,getLanguage} from './i18n.js';

const {jsPDF}=window.jspdf;
async function addFonts(doc){
  for(const [file,style] of [['NotoSans-Regular.ttf','normal'],['NotoSans-Bold.ttf','bold']]){
    const res=await fetch(`./assets/fonts/${file}`);if(!res.ok)throw new Error(`Не удалось загрузить шрифт ${file}.`);
    const bytes=new Uint8Array(await res.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
    doc.addFileToVFS(file,btoa(binary));doc.addFont(file,'NotoSans',style);
  }
  doc.setFont('NotoSans','normal');const probe=doc.getTextDimensions('Ўзбек oʻ gʻ ʼ Русский');if(!probe.h)throw new Error('Не удалось подготовить кириллический шрифт.');
}
function safeName(value){return String(value||'location').normalize('NFKC').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').replace(/\s+/g,'_').slice(0,80)||'location'}
async function qrData(url){return QRCode.toDataURL(url,{errorCorrectionLevel:'Q',type:'image/png',width:1200,margin:4,color:{dark:'#000000',light:'#FFFFFF'}})}
export async function downloadLocationPoster(location){
  const url=`${CONFIG.siteUrl}/check.html?loc=${encodeURIComponent(location.location_code)}`;
  const qr=await qrData(url);const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});await addFonts(doc);
  doc.setDrawColor(23,107,98);doc.setLineWidth(.8);doc.roundedRect(9,9,192,279,5,5,'S');
  doc.setTextColor(23,33,43);doc.setFont('NotoSans','bold');doc.setFontSize(13);doc.text(CONFIG.organizationName,105,24,{align:'center',maxWidth:176});
  doc.setFontSize(17);doc.text(t('poster_title'),105,41,{align:'center',maxWidth:184});
  doc.setFont('NotoSans','normal');doc.setFontSize(11);doc.text('Tekshirish uchun QR-kodni skanerlang',105,50,{align:'center',maxWidth:184});
  doc.setFont('NotoSans','bold');doc.setFontSize(12);doc.text(location.name,105,60,{align:'center',maxWidth:180});
  doc.addImage(qr,'PNG',45,66,120,120,undefined,'FAST');
  const ru=getLanguage()==='ru';
  doc.setFont('NotoSans','bold');doc.setFontSize(13);doc.text(ru?t('poster_ru_1'):t('poster_uz_1'),105,205,{align:'center'});
  doc.setFont('NotoSans','normal');doc.setFontSize(11);doc.text(ru?t('poster_uz_1'):t('poster_ru_1'),105,212,{align:'center'});
  doc.setFont('NotoSans','bold');doc.setFontSize(13);doc.text(ru?t('poster_ru_2'):t('poster_uz_2'),105,225,{align:'center'});
  doc.setFont('NotoSans','normal');doc.setFontSize(11);doc.text(ru?t('poster_uz_2'):t('poster_ru_2'),105,232,{align:'center'});
  doc.setFont('NotoSans','bold');doc.setFontSize(13);doc.text(ru?t('poster_ru_3'):t('poster_uz_3'),105,245,{align:'center'});
  doc.setFont('NotoSans','normal');doc.setFontSize(11);doc.text(ru?t('poster_uz_3'):t('poster_ru_3'),105,252,{align:'center'});
  doc.setTextColor(90,100,105);doc.setFontSize(8);doc.text(`${url}`,105,270,{align:'center',maxWidth:176});
  doc.save(`poster_${safeName(location.name)}.pdf`);
}

