export const messages = {
  ru: {
    title:'Учёт сотрудников', subtitle:'Система QR-пропусков', email:'Электронная почта', password:'Пароль', login:'Войти', logout:'Выйти',
    employees:'Сотрудники', contracts:'Договоры', logs:'Журнал', scan:'Сканер', add:'Добавить сотрудника', search:'Поиск по ФИО или номеру пропуска',
    all:'Все статусы', active:'Активен', suspended:'Приостановлен', fired:'Уволен', department:'Отдел', position:'Должность', full_name:'ФИО', phone:'Телефон',
    hire_date:'Дата приёма', pass_valid_until:'Пропуск действует до', save:'Сохранить', cancel:'Отмена', photo:'Фото', contract_number:'Номер договора',
    contract_type:'Тип договора', start_date:'Дата начала', end_date:'Дата окончания', upload:'Загрузить файл', download:'Скачать', renew_qr:'Перевыпустить QR',
    pass_pdf:'Пропуск PDF', print_one:'1 пропуск на A4', print_four:'4 пропуска на A4', valid:'ВАЛИДЕН', expired:'ИСТЁК', suspended_result:'ПРИОСТАНОВЛЕН',
    not_found:'НЕ НАЙДЕН', scan_title:'Проверка пропуска', start_scan:'Начать сканирование', stop_scan:'Остановить', result:'Результат', date:'Дата', filter:'Фильтр',
    no_data:'Записей пока нет', no_camera:'Камера недоступна. Разрешите доступ к камере или откройте ссылку QR.', soon:'Скоро истекает договор', save_error:'Не удалось сохранить. Проверьте настройки Supabase и права доступа.',
    choose:'Выбрать', selected:'Выбрано', result_valid:'valid', result_expired:'expired', result_suspended:'suspended', result_not_found:'not_found', back:'Назад',
    confirm_reissue:'Старый QR перестанет работать. Выпустить новый?', file_limit:'Максимальный размер файла — 10 МБ.', role_error:'У этой учётной записи нет доступа к странице.',
    no_config:'Сначала настройте Supabase в assets/js/config.js.', org:'Организация', pass:'Пропуск', language:'Язык', guard:'Охрана', admin:'Администратор'
  },
  uz: {
    title:'Xodimlar hisobi', subtitle:'QR-ruxsatnoma tizimi', email:'Elektron pochta', password:'Parol', login:'Kirish', logout:'Chiqish',
    employees:'Xodimlar', contracts:'Shartnomalar', logs:'Jurnal', scan:'Skaner', add:'Xodim qo‘shish', search:'F.I.Sh. yoki ruxsatnoma raqami bo‘yicha qidirish',
    all:'Barcha holatlar', active:'Faol', suspended:'To‘xtatilgan', fired:'Ishdan bo‘shatilgan', department:'Bo‘lim', position:'Lavozim', full_name:'F.I.Sh.', phone:'Telefon',
    hire_date:'Ishga qabul qilingan sana', pass_valid_until:'Ruxsatnoma muddati', save:'Saqlash', cancel:'Bekor qilish', photo:'Surat', contract_number:'Shartnoma raqami',
    contract_type:'Shartnoma turi', start_date:'Boshlanish sanasi', end_date:'Tugash sanasi', upload:'Fayl yuklash', download:'Yuklab olish', renew_qr:'QRni yangilash',
    pass_pdf:'PDF ruxsatnoma', print_one:'A4 da 1 ta ruxsatnoma', print_four:'A4 da 4 ta ruxsatnoma', valid:'AMALDA', expired:'MUDDATI TUGAGAN', suspended_result:'TO‘XTATILGAN',
    not_found:'TOPILMADI', scan_title:'Ruxsatnomani tekshirish', start_scan:'Skanerlashni boshlash', stop_scan:'To‘xtatish', result:'Natija', date:'Sana', filter:'Filtr',
    no_data:'Hozircha yozuvlar yo‘q', no_camera:'Kamera mavjud emas. QR havolasini oching yoki kameraga ruxsat bering.', soon:'Shartnoma muddati tugamoqda', save_error:'Saqlab bo‘lmadi. Supabase sozlamalari va ruxsatlarni tekshiring.',
    choose:'Tanlash', selected:'Tanlandi', result_valid:'valid', result_expired:'expired', result_suspended:'suspended', result_not_found:'not_found', back:'Orqaga',
    confirm_reissue:'Eski QR ishlamay qoladi. Yangisini chiqarasizmi?', file_limit:'Fayl hajmi 10 MB dan oshmasligi kerak.', role_error:'Bu hisobda sahifaga kirish huquqi yo‘q.',
    no_config:'Avval assets/js/config.js faylida Supabase sozlamalarini kiriting.', org:'Tashkilot', pass:'Ruxsatnoma', language:'Til', guard:'Qo‘riqlash', admin:'Administrator'
  }
};
export function getLanguage(){ return localStorage.getItem('pass-lang') || 'ru'; }
export function setLanguage(lang){ localStorage.setItem('pass-lang', lang); document.documentElement.lang=lang; }
export function t(key){ return messages[getLanguage()][key] || key; }
export function bindTranslations(root=document){ root.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n)); root.querySelectorAll('[data-i18n-placeholder]').forEach(el=>el.placeholder=t(el.dataset.i18nPlaceholder)); }

