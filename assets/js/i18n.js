export const messages = {
  ru: {
    title:'Система проверки сотрудников', subtitle:'Покажите этот экран охране на входе', email:'Электронная почта администратора', password:'Пароль', login:'Войти', logout:'Выйти',
    employees:'Сотрудники', contracts:'Договоры', logs:'Журнал входов', add:'Добавить сотрудника', search:'Поиск по ФИО, телефону или отделу',
    all:'Все статусы', active:'Активен', suspended:'Приостановлен', fired:'Уволен', department:'Отдел', position:'Должность', full_name:'ФИО', phone:'Телефон',
    hire_date:'Дата приёма', valid_until:'Допуск действует до', save:'Сохранить', cancel:'Отмена', photo:'Фото', contract_number:'Номер договора',
    contract_type:'Тип договора', start_date:'Дата начала', end_date:'Дата окончания', upload:'Загрузить файл', download:'Скачать',
    valid:'ДОПУСК РАЗРЕШЁН', expired:'СРОК ИСТЁК', suspended_result:'ДОПУСК ЗАПРЕЩЁН', not_found:'Сотрудник не найден', scan_title:'Проверка на входе',
    result:'Результат', date:'Дата и время', filter:'Показать', no_data:'Записей пока нет', soon:'Скоро истекает договор', save_error:'Не удалось сохранить. Проверьте настройки Supabase и права доступа.',
    file_limit:'Максимальный размер файла — 10 МБ.', role_error:'У этой учётной записи нет доступа к странице.', no_config:'Сначала настройте Supabase в assets/js/config.js.',
    org:'Организация', language:'Язык', admin:'Администратор', pin:'PIN-код (4–6 цифр)', pin_help:'PIN не сохраняется в базе приложения. Supabase Auth хранит только защищённый пароль.',
    reset_pin:'Задать / сбросить PIN', locations:'Точки входа', location_name:'Название точки входа', add_location:'Создать точку', location_code:'Код точки', poster:'Скачать плакат PDF',
    poster_title:'Отсканируй QR для проверки', login_phone:'Телефон', login_pin:'PIN (4–6 цифр)', login_employee:'Войти и показать экран', live:'ЖИВАЯ ПРОВЕРКА',
    step1:'1. Отсканируй QR', step2:'2. Войди: телефон + PIN', step3:'3. Покажи экран охране', location_invalid:'Точка входа не найдена.',
    auth_error:'Неверный телефон или PIN.', phone_format:'Введите телефон в международном формате, например +998901234567.', pin_format:'PIN должен состоять из 4–6 цифр.',
    pin_saved:'PIN сохранён в Supabase Auth.', pin_error:'Не удалось задать PIN. Проверьте телефон и настройки Auth.', location_error:'Не удалось создать точку входа.', copy:'Скопировать ссылку', copied:'Ссылка скопирована.',
    point:'Точка входа', result_valid:'ДОПУСК РАЗРЕШЁН', result_expired:'СРОК ИСТЁК', result_suspended:'ДОПУСК ЗАПРЕЩЁН', log_location:'Точка входа',
    login_hint:'Вход защищён Supabase Auth. Сеанс останется на этом телефоне.', retry_check:'Обновить проверку',
    poster_ru_1:'1. Отсканируй', poster_uz_1:'1. Skanerlang', poster_ru_2:'2. Войди: телефон + PIN', poster_uz_2:'2. Kiring: telefon + PIN', poster_ru_3:'3. Покажи экран охране', poster_uz_3:'3. Ekranni qoʻriqchiga koʻrsating'
  },
  uz: {
    title:'Xodimlarni tekshirish tizimi', subtitle:'Kirish joyida ushbu ekranni qo‘riqchiga ko‘rsating', email:'Administrator elektron pochtasi', password:'Parol', login:'Kirish', logout:'Chiqish',
    employees:'Xodimlar', contracts:'Shartnomalar', logs:'Kirish jurnali', add:'Xodim qo‘shish', search:'F.I.Sh., telefon yoki bo‘lim bo‘yicha qidirish',
    all:'Barcha holatlar', active:'Faol', suspended:'To‘xtatilgan', fired:'Ishdan bo‘shatilgan', department:'Bo‘lim', position:'Lavozim', full_name:'F.I.Sh.', phone:'Telefon',
    hire_date:'Ishga qabul qilingan sana', valid_until:'Ruxsat muddati', save:'Saqlash', cancel:'Bekor qilish', photo:'Surat', contract_number:'Shartnoma raqami',
    contract_type:'Shartnoma turi', start_date:'Boshlanish sanasi', end_date:'Tugash sanasi', upload:'Fayl yuklash', download:'Yuklab olish',
    valid:'KIRISHGA RUXSAT', expired:'MUDDATI TUGAGAN', suspended_result:'KIRISH TAQIQLANGAN', not_found:'Xodim topilmadi', scan_title:'Kirishda tekshirish',
    result:'Natija', date:'Sana va vaqt', filter:'Ko‘rsatish', no_data:'Hozircha yozuvlar yo‘q', soon:'Shartnoma muddati tugamoqda', save_error:'Saqlab bo‘lmadi. Supabase sozlamalari va ruxsatlarni tekshiring.',
    file_limit:'Fayl hajmi 10 MB dan oshmasligi kerak.', role_error:'Bu hisobda sahifaga kirish huquqi yo‘q.', no_config:'Avval assets/js/config.js faylida Supabase sozlamalarini kiriting.',
    org:'Tashkilot', language:'Til', admin:'Administrator', pin:'PIN-kod (4–6 raqam)', pin_help:'PIN ilova bazasida saqlanmaydi. Supabase Auth faqat himoyalangan parolni saqlaydi.',
    reset_pin:'PIN o‘rnatish / tiklash', locations:'Kirish nuqtalari', location_name:'Kirish nuqtasi nomi', add_location:'Nuqta yaratish', location_code:'Nuqta kodi', poster:'PDF plakatni yuklab olish',
    poster_title:'Tekshirish uchun QR-kodni skanerlang', login_phone:'Telefon', login_pin:'PIN (4–6 raqam)', login_employee:'Kirish va ekranni ko‘rsatish', live:'JONLI TEKSHIRUV',
    step1:'1. QR-kodni skanerlang', step2:'2. Kiring: telefon + PIN', step3:'3. Ekranni qo‘riqchiga ko‘rsating', location_invalid:'Kirish nuqtasi topilmadi.',
    auth_error:'Telefon yoki PIN noto‘g‘ri.', phone_format:'Telefonni xalqaro formatda kiriting, masalan +998901234567.', pin_format:'PIN 4–6 ta raqamdan iborat bo‘lishi kerak.',
    pin_saved:'PIN Supabase Auth’da saqlandi.', pin_error:'PIN o‘rnatilmadi. Telefon va Auth sozlamalarini tekshiring.', location_error:'Kirish nuqtasini yaratib bo‘lmadi.', copy:'Havolani nusxalash', copied:'Havola nusxalandi.',
    point:'Kirish nuqtasi', result_valid:'KIRISHGA RUXSAT', result_expired:'MUDDATI TUGAGAN', result_suspended:'KIRISH TAQIQLANGAN', log_location:'Kirish nuqtasi',
    login_hint:'Kirish Supabase Auth orqali himoyalangan. Seans shu telefonda saqlanadi.', retry_check:'Tekshiruvni yangilash',
    poster_ru_1:'1. Отсканируй', poster_uz_1:'1. Skanerlang', poster_ru_2:'2. Войди: телефон + PIN', poster_uz_2:'2. Kiring: telefon + PIN', poster_ru_3:'3. Покажи экран охране', poster_uz_3:'3. Ekranni qoʻriqchiga koʻrsating'
  }
};
export function getLanguage(){return localStorage.getItem('pass-lang')||'ru'}
export function setLanguage(lang){localStorage.setItem('pass-lang',lang);document.documentElement.lang=lang}
export function t(key){return messages[getLanguage()][key]||key}
export function bindTranslations(root=document){root.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));root.querySelectorAll('[data-i18n-placeholder]').forEach(el=>el.placeholder=t(el.dataset.i18nPlaceholder))}

