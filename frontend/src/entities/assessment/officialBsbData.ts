import type { Assessment, Question } from './model';

/**
 * Rasmiy "Pedagogik mahorat va xalqaro baholash ilmiy-amaliy markazi"
 * 2026-2027 o'quv yili Informatika va axborot texnologiyalari fani
 * 1-BSB rasmiy topshiriqlari va baholash mezonlari (Rubrics)
 */

export const officialBsb5GradeQuestions: Question[] = [
  {
    id: 'bsb-5-q1',
    order: 1,
    cognitiveLevel: '(B)',
    points: 5,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '1-topshiriq [5 ball]. Klaviatura tugmalarining vazifalarini mos ravishda yozing:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '5-1-a', label: 'a)', prompt: 'Shift tugmasining asosiy vazifasini yozing:', points: 1.25, rubric: 'Katta harflarni va klaviaturadagi yuqori belgilarni yozish uchun xizmat qiladi deb yozilsa 1.25 ball.' },
      { id: '5-1-b', label: 'b)', prompt: 'Enter tugmasining vazifasi nima?', points: 1.25, rubric: 'Kiritilgan buyruqni tasdiqlash yoki matnda yangi satrga o‘tish deb yozilsa 1.25 ball.' },
      { id: '5-1-c', label: 'c)', prompt: 'Backspace tugmasi matnda qaysi belgini o‘chiradi?', points: 1.25, rubric: 'Kursor turgan joydan chap tomondagi (oldindagi) belgini o‘chiradi deb yozilsa 1.25 ball.' },
      { id: '5-1-d', label: 'd)', prompt: 'Caps Lock tugmasi yoqilganda qanday holat yuz beradi?', points: 1.25, rubric: 'Barcha harflar doimiy ravishda bosh (katta) harflar bilan yoziladi deb ko‘rsatilsa 1.25 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-5-1', criterion: 'Klaviatura tugmalari vazifasini aniqlash', fullScore: 5, partialScore: 2.5, zeroScore: 0, guideline: 'Har bir to‘g‘ri bandga 1.25 ball. 4 ta band to‘liq = 5 ball.' },
    ],
  },
  {
    id: 'bsb-5-q2',
    order: 2,
    cognitiveLevel: '(Q)',
    points: 5,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '2-topshiriq [5 ball]. Paint grafik muharririda asboblar va amallar tahlili:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '5-2-a', label: 'a)', prompt: 'Rasmdagi biror rangni nusxalab boshqa sohaga qo‘llash uchun qaysi asbobdan foydalaniladi?', points: 2.5, rubric: 'Pipetka (Rang tanlagich / Color Picker) ko‘rsatilsa 2.5 ball.' },
      { id: '5-2-b', label: 'b)', prompt: 'Rasmning faqat ma’lum bir qismini qirqib olish (Crop) bosqichlarini yozing:', points: 2.5, rubric: 'Select (Tanlash) orqali soha belgilanadi va Qirqish (Crop) tugmasi bosiladi deb yozilsa 2.5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-5-2', criterion: 'Paint vositalari va ularni qo‘llash', fullScore: 5, partialScore: 2.5, zeroScore: 0, guideline: 'Asboblar nomi va qo‘llanish ketma-ketligi aniq ko‘rsatilsa 5 ball.' },
    ],
  },
  {
    id: 'bsb-5-q3',
    order: 3,
    cognitiveLevel: '(Q)',
    points: 5,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '3-topshiriq [5 ball]. Matn muharririda matn ustida amallar bajarish:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '5-3-a', label: 'a)', prompt: 'Matndan biror bo‘lakni o‘chirmasdan boshqa joyga ko‘paytirish (nusxalash) uchun qaysi tezkor tugmalar birikmasi bosiladi?', points: 2.5, rubric: 'Ctrl+C (Nusxa olish) va Ctrl+V (Joylashtirish) yozilsa 2.5 ball.' },
      { id: '5-3-b', label: 'b)', prompt: 'Ko‘chirish (Cut) amali Nusxa olish (Copy) amalidan qanday farq qiladi?', points: 2.5, rubric: 'Ko‘chirishda asl matn joyidan o‘chiriladi va yangi joyga ko‘chiriladi, nusxalashda esa asli saqlanib qoladi deb yozilsa 2.5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-5-3', criterion: 'Matnni tahrirlash amallari', fullScore: 5, partialScore: 2.5, zeroScore: 0, guideline: 'Tugmalar birikmasi va tushunchalar farqi to‘liq ochib berilsa 5 ball.' },
    ],
  },
  {
    id: 'bsb-5-q4',
    order: 4,
    cognitiveLevel: '(M)',
    points: 5,
    taskType: 'case_study',
    blocks: [
      {
        type: 'paragraph',
        text: '4-topshiriq [5 ball]. Hujjatni saqlash bo‘yicha vaziyatli topshiriq: Siz avvaldan saqlangan "Referat.docx" faylini ochib, unga yangi ma’lumotlar qo‘shdingiz. Endi uni boshqa papkaga yangi "Referat_yakuniy.docx" nomi bilan saqlashingiz kerak.',
      },
    ],
    options: [],
    subQuestions: [
      { id: '5-4-a', label: 'a)', prompt: 'Buning uchun "Saqlash" (Save) buyrug‘ini tanlaysizmi yoki "Boshqa nom bilan saqlash" (Save As)? Sababini izohlang.', points: 2.5, rubric: '"Boshqa nom bilan saqlash" (Save As) tanlanishi va sababi ko‘rsatilsa 2.5 ball.' },
      { id: '5-4-b', label: 'b)', prompt: 'Agar faqat "Saqlash" (Save / Ctrl+S) tugmasini bossangiz, dastlabki fayl nima bo‘ladi?', points: 2.5, rubric: 'Eski fayl ustiga yangilanadi va asl holat yo‘qotilishi mumkinligi to‘g‘ri tushuntirilsa 2.5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-5-4', criterion: 'Save va Save As farqini anglash va amalda qo‘llash', fullScore: 5, partialScore: 2.5, zeroScore: 0, guideline: 'Ikki buyruqning natijasi to‘g‘ri tahlil qilingan bo‘lsa 5 ball.' },
    ],
  },
  {
    id: 'bsb-5-q5',
    order: 5,
    cognitiveLevel: '(B)',
    points: 5,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '5-topshiriq [5 ball]. Matnni formatlash elementlari:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '5-5-a', label: 'a)', prompt: 'Matnni satrning ikki chetiga teng taqsimlab tekislash (Justify / Kenglik bo‘yicha tekislash) buyrug‘ining afzalligini yozing:', points: 2.5, rubric: 'Matn kitob sahifasidek har ikki chetga tekis va tartibli joylashadi deb yozilsa 2.5 ball.' },
      { id: '5-5-b', label: 'b)', prompt: 'Shrift o‘lchami (Font Size) qaysi o‘lchov birligida o‘lchanadi (masalan, 12, 14)?', points: 2.5, rubric: 'Pt (punkt / points) ekanligi to‘g‘ri yozilsa 2.5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-5-5', criterion: 'Formatlash tushunchalari', fullScore: 5, partialScore: 2.5, zeroScore: 0, guideline: 'Tekislash va o‘lchov birligi to‘g‘ri ko‘rsatilsa 5 ball.' },
    ],
  },
];

export const officialBsb6GradeQuestions: Question[] = [
  {
    id: 'bsb-6-q1',
    order: 1,
    cognitiveLevel: '(B)',
    points: 5,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '1-topshiriq [5 ball]. Axborot turlari va ularning ko‘rinishlarini aniqlang:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '6-1-a', label: 'a)', prompt: 'Inson axborotni qabul qilish a’zolariga ko‘ra eng ko‘p axborotni (taxminan 80-90%) qaysi a’zosi orqali qabul qiladi?', points: 2.5, rubric: 'Ko‘rish a’zosi (ko‘z / vizual) deb yozilsa 2.5 ball.' },
      { id: '6-1-b', label: 'b)', prompt: 'Axborotning ishonchlilik (haqqoniylik) xossasi nimani anglatadi?', points: 2.5, rubric: 'Axborot real voqelikka to‘liq mos kelishi, yolg‘on yoki buzilmagan bo‘lishi kerakligi yozilsa 2.5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-6-1', criterion: 'Axborotning turlari va xossalarini bilish', fullScore: 5, partialScore: 2.5, zeroScore: 0, guideline: 'Har bir band to‘liq yoritilsa 2.5 balldan beriladi.' },
    ],
  },
  {
    id: 'bsb-6-q2',
    order: 2,
    cognitiveLevel: '(Q)',
    points: 5,
    taskType: 'table_completion',
    blocks: [
      {
        type: 'paragraph',
        text: '2-topshiriq [5 ball]. Fayl kengaytmalari va ularning tegishli dasturlari jadvalini to‘ldiring:',
      },
    ],
    options: [],
    tableData: {
      headers: ['Fayl kengaytmasi', 'Axborot turi / Dastur nomi'],
      rows: [
        { label: '.docx', cells: [{ key: 'row1', placeholder: 'Matnli hujjat / MS Word' }] },
        { label: '.xlsx', cells: [{ key: 'row2', placeholder: 'Elektron jadval / MS Excel' }] },
        { label: '.pptx', cells: [{ key: 'row3', placeholder: 'Taqdimot / MS PowerPoint' }] },
        { label: '.mp3', cells: [{ key: 'row4', placeholder: 'Tovush (audio) fayli' }] },
      ],
    },
    subQuestions: [
      { id: '6-2-a', label: 'a)', prompt: 'Fayl nomidagi nuqtadan keyingi 3 yoki 4 ta harf (masalan, .docx) nima deb ataladi va uning vazifasi nima?', points: 2.5, rubric: 'Fayl kengaytmasi (file extension) deb ataladi va fayl turini hamda qaysi dasturda ochilishini belgilaydi deb yozilsa 2.5 ball.' },
      { id: '6-2-b', label: 'b)', prompt: 'Yuqoridagi jadvaldagi 4 ta kengaytmaning turini to‘g‘ri yozing:', points: 2.5, rubric: 'Barcha kengaytmalar to‘g‘ri ko‘rsatilsa 2.5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-6-2', criterion: 'Fayl tizimi va kengaytmalarni tahlil qilish', fullScore: 5, partialScore: 2.5, zeroScore: 0, guideline: 'Tushuncha va 4 ta fayl turi to‘liq ko‘rsatilsa 5 ball.' },
    ],
  },
  {
    id: 'bsb-6-q3',
    order: 3,
    cognitiveLevel: '(Q)',
    points: 5,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '3-topshiriq [5 ball]. Matn muharririda jadvallar bilan ishlash:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '6-3-a', label: 'a)', prompt: 'Jadvaldagi bir nechta kataklarni birlashtirib bitta katakka aylantirish qaysi buyruq orqali amalga oshiriladi?', points: 2.5, rubric: 'Merge Cells (Kataklarni birlashtirish) buyrug‘i yozilsa 2.5 ball.' },
      { id: '6-3-b', label: 'b)', prompt: 'Mavjud jadvalga yangi ustun yoki yangi satr qo‘shish qanday amalga oshiriladi?', points: 2.5, rubric: 'Insert Rows/Columns (Satr/ustun qo‘shish) yoki o‘ng tugma orqali kontekst menyudan qo‘shish tushuntirilsa 2.5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-6-3', criterion: 'Jadval amallari va tahrirlash', fullScore: 5, partialScore: 2.5, zeroScore: 0, guideline: 'Kataklarni birlashtirish va satr/ustun qo‘shish to‘g‘ri yoritilsa 5 ball.' },
    ],
  },
  {
    id: 'bsb-6-q4',
    order: 4,
    cognitiveLevel: '(M)',
    points: 5,
    taskType: 'case_study',
    blocks: [
      {
        type: 'paragraph',
        text: '4-topshiriq [5 ball]. Hujjatga rasm joylashtirish va uni matn bilan o‘rash (Wrap Text): Hujjatga rasm qo‘yilganda u matnni buzib yubordi yoki matn rasm orqasiga yashirinib qoldi.',
      },
    ],
    options: [],
    subQuestions: [
      { id: '6-4-a', label: 'a)', prompt: 'Rasmni matn atrofida chiroyli kvadrat shaklida o‘rab joylashtirish uchun qaysi parametr (Wrap Text rejimi) tanlanadi?', points: 2.5, rubric: 'Square (Kvadrat bo‘yicha o‘rash) yoki Tight tanlanishi ko‘rsatilsa 2.5 ball.' },
      { id: '6-4-b', label: 'b)', prompt: 'Rasmni hujjat bo‘ylab erkin surish uchun qanday amal bajariladi?', points: 2.5, rubric: 'Matn bilan o‘rash (In Front of Text / Behind Text yoki Square) rejimi yoqilsa erkin ko‘chirish mumkin bo‘ladi deb yozilsa 2.5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-6-4', criterion: 'Tasvir va matn uyg‘unligi (Wrap Text)', fullScore: 5, partialScore: 2.5, zeroScore: 0, guideline: 'Vaziyat to‘g‘ri yechilgan bo‘lsa 5 ball.' },
    ],
  },
  {
    id: 'bsb-6-q5',
    order: 5,
    cognitiveLevel: '(B)',
    points: 5,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '5-topshiriq [5 ball]. Sahifa elementlari: Yuqori va quyi kolontitul (Header & Footer):',
      },
    ],
    options: [],
    subQuestions: [
      { id: '6-5-a', label: 'a)', prompt: 'Kolontitul nima va u hujjatning qayerida joylashadi?', points: 2.5, rubric: 'Hujjatning har bir sahifasining yuqori (Header) yoki quyi (Footer) hoshiyasida takrorlanuvchi maxsus soha deb yozilsa 2.5 ball.' },
      { id: '6-5-b', label: 'b)', prompt: 'Kolontitulga ko‘pincha qanday ma’lumotlar joylashtiriladi? Kamida 2 tasini ayting.', points: 2.5, rubric: 'Sahifa raqami, kitob/hujjat nomi, muallif ismi, sana deb ko‘rsatilsa 2.5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-6-5', criterion: 'Kolontitul tushunchasi va qo‘llanishi', fullScore: 5, partialScore: 2.5, zeroScore: 0, guideline: 'Aniq ta’rif va 2 ta to‘g‘ri misol uchun 5 ball.' },
    ],
  },
];

export const officialBsb7GradeQuestions: Question[] = [
  {
    id: 'bsb-7-q1',
    order: 1,
    cognitiveLevel: '(B)',
    points: 5,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '1-topshiriq [5 ball]. Vektorli va rastrli grafika farqlari:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '7-1-a', label: 'a)', prompt: 'Rastrli grafikaning eng kichik ajralmas elementi nima deb ataladi?', points: 2.5, rubric: 'Piksel (pixel) deb yozilsa 2.5 ball.' },
      { id: '7-1-b', label: 'b)', prompt: 'Vektorli tasvir kattalashtirilganda sifati nima uchun buzilmaydi?', points: 2.5, rubric: 'Chunki u piksellardan emas, balki matematik formulalar (chiziqlar, nuqtalar, egri chiziqlar) asosida qayta hisoblab chiziladi deb yozilsa 2.5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-7-1', criterion: 'Kompyuter grafikasi turlarini tahlil qilish', fullScore: 5, partialScore: 2.5, zeroScore: 0, guideline: 'Piksel va matematik formula asoslari to‘liq tushuntirilsa 5 ball.' },
    ],
  },
  {
    id: 'bsb-7-q2',
    order: 2,
    cognitiveLevel: '(Q)',
    points: 5,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '2-topshiriq [5 ball]. Kompyuter tarmoqlari tasnifi:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '7-2-a', label: 'a)', prompt: 'LAN (Local Area Network) va WAN (Wide Area Network) tarmoqlari o‘rtasidagi asosiy farqni yozing:', points: 2.5, rubric: 'LAN bitta bino yoki xona ichidagi lokal tarmoq, WAN esa butun dunyo yoki mintaqaviy global tarmoq (masalan Internet) deb yozilsa 2.5 ball.' },
      { id: '7-2-b', label: 'b)', prompt: 'Maktabingizdagi informatika xonasidagi kompyuterlar o‘zaro qaysi tarmoq turiga ulangan?', points: 2.5, rubric: 'LAN (Lokal tarmoq) deb to‘g‘ri ko‘rsatilsa 2.5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-7-2', criterion: 'Tarmoq ko‘lami va turlarini aniqlash', fullScore: 5, partialScore: 2.5, zeroScore: 0, guideline: 'Hududiy qamrov va maktab tarmog‘i to‘g‘ri belgilansa 5 ball.' },
    ],
  },
  {
    id: 'bsb-7-q3',
    order: 3,
    cognitiveLevel: '(Q)',
    points: 5,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '3-topshiriq [5 ball]. Internet vositalari va gipermatn:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '7-3-a', label: 'a)', prompt: 'Veb-brauzer va qidiruv tizimi (Search Engine) o‘rtasidagi farq nima? Har biriga bittadan misol keltiring.', points: 2.5, rubric: 'Brauzer veb-sahifalarni ochuvchi dastur (Google Chrome, Firefox), qidiruv tizimi esa ma’lumot topuvchi sayt (Google, Yandex) deb farqlansa 2.5 ball.' },
      { id: '7-3-b', label: 'b)', prompt: 'Giperhavola (Hyperlink) nima va uning asosiy vazifasi nima?', points: 2.5, rubric: 'Boshqa hujjatga yoki veb-sahifaga olib o‘tuvchi faol matn yoki rasm deb ko‘rsatilsa 2.5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-7-3', criterion: 'Veb-texnologiyalar tushunchalari', fullScore: 5, partialScore: 2.5, zeroScore: 0, guideline: 'Brauzer/qidiruv tizimi va giperhavola to‘liq yoritilsa 5 ball.' },
    ],
  },
  {
    id: 'bsb-7-q4',
    order: 4,
    cognitiveLevel: '(M)',
    points: 5,
    taskType: 'case_study',
    blocks: [
      {
        type: 'paragraph',
        text: '4-topshiriq [5 ball]. Elektron pochta xavfsizligi va spam xabarlar: Sizning pochtangizga noma’lum manzildan "Shoshilinch! Sizga meros qoldi, ilovadagi .exe faylni oching" deb yozilgan xat keldi.',
      },
    ],
    options: [],
    subQuestions: [
      { id: '7-4-a', label: 'a)', prompt: 'Bunday kutilmagan, ommaviy va shubhali xabarlar axborot texnologiyalarida qanday ataladi?', points: 2.5, rubric: 'Spam (keraksiz/zararli xabar) deb yozilsa 2.5 ball.' },
      { id: '7-4-b', label: 'b)', prompt: 'Nima sababdan notanish xatlardagi .exe fayllarni ochish qat’iyan man etiladi?', points: 2.5, rubric: 'Chunki u virus yoki zararli dastur bo‘lib, kompyuterni buzishi yoki shaxsiy ma’lumotlarni o‘g‘irlashi mumkin deb tushuntirilsa 2.5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-7-4', criterion: 'Elektron pochta xavfsizligi tahlili', fullScore: 5, partialScore: 2.5, zeroScore: 0, guideline: 'Xavf omillari va to‘g‘ri harakatlar ko‘rsatilsa 5 ball.' },
    ],
  },
  {
    id: 'bsb-7-q5',
    order: 5,
    cognitiveLevel: '(M)',
    points: 5,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '5-topshiriq [5 ball]. Shaxsiy ma’lumotlar xavfsizligi va kuchli parol yaratish qoidalari:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '7-5-a', label: 'a)', prompt: 'Kuchli va ishonchli parol tuzishning kamida 3 ta asosiy talabini yozing:', points: 2.5, rubric: 'Kamida 8-12 ta belgi, katta-kichik harflar, raqamlar va maxsus belgilar (@, #, $, !) aralashmasi bo‘lishi kerakligi yozilsa 2.5 ball.' },
      { id: '7-5-b', label: 'b)', prompt: 'Nima uchun parolda o‘z tug‘ilgan yilingiz yoki ismingizdan foydalanish xavfli hisoblanadi?', points: 2.5, rubric: 'Buzg‘unchilar ijtimoiy muhandislik yoki lug‘at hujumi orqali bunday ma’lumotlarni juda oson taxmin qilib topishi mumkinligi tushuntirilsa 2.5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-7-5', criterion: 'Parol xavfsizligi qoidalari', fullScore: 5, partialScore: 2.5, zeroScore: 0, guideline: '3 ta talab va buzish sababi to‘liq yoritilsa 5 ball.' },
    ],
  },
];

export const officialBsb9GradeQuestions: Question[] = [
  {
    id: 'bsb-9-q1',
    order: 1,
    cognitiveLevel: '(B)',
    points: 10,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '1-topshiriq [10 ball]. Quyidagi kompyuter apparat ta’minotining asosiy qismlari vazifasini aniq va lo‘nda yozing (Har bir band uchun 2.5 ball):',
      },
    ],
    options: [],
    subQuestions: [
      { id: '9-1-a', label: 'a)', prompt: 'Kiritish qurilmasi:', points: 2.5, rubric: 'Ma’lumotlarni va buyruqlarni tashqi muhitdan kompyuterga kiritish uchun xizmat qiladi deb yozilsa 2.5 ball; qisman yoritilsa 1 ball; xato bo‘lsa 0 ball.' },
      { id: '9-1-b', label: 'b)', prompt: 'Protsessor (CPU):', points: 2.5, rubric: 'Dasturiy buyruqlarni bajaradi, mantiqiy va arifmetik amallarni hisoblaydi, tizimni boshqaradi deb yozilsa 2.5 ball; qisman bo‘lsa 1 ball; xato bo‘lsa 0 ball.' },
      { id: '9-1-c', label: 'c)', prompt: 'Chiqarish qurilmasi:', points: 2.5, rubric: 'Qayta ishlangan natijalarni inson tushunadigan shaklda ko‘rsatadi yoki aks ettiradi deb yozilsa 2.5 ball; qisman bo‘lsa 1 ball; xato bo‘lsa 0 ball.' },
      { id: '9-1-d', label: 'd)', prompt: 'Xotira qurilmasi:', points: 2.5, rubric: 'Ma’lumotlarni, oraliq hisoblashlarni va dasturlarni vaqtincha yoki doimiy saqlaydi deb yozilsa 2.5 ball; qisman bo‘lsa 1 ball; xato bo‘lsa 0 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-9-1', criterion: 'Apparat qismlari vazifalarini to‘liq ifodalash', fullScore: 10, partialScore: 4, zeroScore: 0, guideline: 'Har bir band to‘liq bo‘lsa 2.5 ball, qisman bo‘lsa 1 ball, noaniq bo‘lsa 0 ball.' },
    ],
  },
  {
    id: 'bsb-9-q2',
    order: 2,
    cognitiveLevel: '(Q)',
    points: 10,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '2-topshiriq [10 ball]. Kirish/chiqish texnologiyalari tahlili:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '9-2-a', label: 'a)', prompt: 'Supermarket kassasida shtrix-kod skaneridan foydalanishning 2 ta muhim afzalligini yozing:', points: 5, rubric: '1) Narx va ma’lumotlarni bir zumda xatosiz kiritish tezligi; 2) Insoniy xatoliklar (kassir adashishi) oldi olinishi ko‘rsatilsa to‘liq 5 ball.' },
      { id: '9-2-b', label: 'b)', prompt: 'To‘lov terminalida chip va PIN-kod o‘quvchi qurilmasining 2 ta kamchiligini yozing:', points: 5, rubric: '1) PIN-kodni begonalar ko‘rib qolishi xavfi (elka osha qarash); 2) Plastik karta chipi shikastlansa yoki terminal aloqa tarmog‘i uzilsa to‘lov amalga oshmasligi ko‘rsatilsa to‘liq 5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-9-2', criterion: 'Shtrix-kod va PIN rider afzallik hamda kamchiliklari', fullScore: 10, partialScore: 5, zeroScore: 0, guideline: 'Har bir to‘g‘ri afzallik/kamchilik uchun 2.5 balldan beriladi.' },
    ],
  },
  {
    id: 'bsb-9-q3',
    order: 3,
    cognitiveLevel: '(M)',
    points: 12,
    taskType: 'table_completion',
    blocks: [
      {
        type: 'paragraph',
        text: '3-topshiriq [12 ball]. Xotira qurilmalari tahlili jadvalini to‘ldiring (Har bir to‘liq satr 3 balldan):',
      },
    ],
    options: [],
    tableData: {
      headers: ['Xotira vositasi', 'Saqlash sig‘imi', 'Ma’lumot uzatish tezligi', 'Portativlik darajasi', 'Nisbiy narxi (1 GB uchun)'],
      rows: [
        { label: 'Portativ qattiq disk (External HDD/SSD)', cells: [{ key: 'h_cap', placeholder: 'Yuqori (500GB - 4TB+)' }, { key: 'h_spd', placeholder: 'Yuqori (100-500 MB/s)' }, { key: 'h_prt', placeholder: 'O‘rtacha portativ' }, { key: 'h_prc', placeholder: 'Arzon/Qulay' }] },
        { label: 'USB flesh-xotira (Flash drive)', cells: [{ key: 'u_cap', placeholder: 'O‘rtacha (8GB - 256GB)' }, { key: 'u_spd', placeholder: 'O‘rtacha/Yuqori' }, { key: 'u_prt', placeholder: 'Juda yuqori (cho‘ntakbop)' }, { key: 'u_prc', placeholder: 'Arzon' }] },
        { label: 'Blu-ray disk', cells: [{ key: 'b_cap', placeholder: '25 GB - 100 GB' }, { key: 'b_spd', placeholder: 'Past/O‘rtacha' }, { key: 'b_prt', placeholder: 'Mo‘rt, drayver talab qiladi' }, { key: 'b_prc', placeholder: 'Qimmatroq' }] },
        { label: 'DVD disk', cells: [{ key: 'd_cap', placeholder: '4.7 GB - 8.5 GB' }, { key: 'd_spd', placeholder: 'Past' }, { key: 'd_prt', placeholder: 'Optik drayver talab qiladi' }, { key: 'd_prc', placeholder: 'Arzon' }] },
      ],
    },
    subQuestions: [
      { id: '9-3-a', label: 'Xulosa:', prompt: 'Nima uchun katta hajmdagi ma’lumotlarni zaxiralash (backup) uchun optik disklardan ko‘ra tashqi qattiq disklar afzal ko‘riladi?', points: 3, rubric: 'Hajmi ancha kattaligi, qayta yozish imkoniyati va yuqori tezligi sabab qilib ko‘rsatilsa 3 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-9-3', criterion: 'Xotira qurilmalarini har tomonlama taqqoslash', fullScore: 12, partialScore: 6, zeroScore: 0, guideline: 'Har bir qurilma xususiyatlari to‘liq taqqoslansa 3 ball (jami 4 ta = 12 ball).' },
    ],
  },
  {
    id: 'bsb-9-q4',
    order: 4,
    cognitiveLevel: '(M)',
    points: 8,
    taskType: 'case_study',
    blocks: [
      {
        type: 'paragraph',
        text: '4-topshiriq [8 ball]. Tarmoq texnologiyalari bo‘yicha vaziyatli topshiriq:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '9-4-a', label: 'a)', prompt: 'Uyda Wi-Fi router o‘chib qoldi, biroq noutbuk va smartfonda Bluetooth ishlab turibdi. Bluetooth orqali noutbukdan internetga kirish mumkinmi? Vaziyatni tahlil qiling va qanday cheklovlar borligini ayting:', points: 4, rubric: 'Agar smartfonda mobil internet bo‘lsa, Bluetooth tethering orqali noutbukka internet ulashish mumkin. Cheklovi: tezlik past va masofa qisqa (10m) deb ko‘rsatilsa 4 ball.' },
      { id: '9-4-b', label: 'b)', prompt: 'Smartfondan simsiz dinamikka (kolonkaga) musiqa uzatishda nima uchun Wi-Fi dan ko‘ra Bluetooth qulayroq hisoblanadi?', points: 4, rubric: 'Routerga yoki murakkab tarmoq sozlamalariga ehtiyoj yo‘qligi, to‘g‘ridan-to‘g‘ri qurilma-qurilma (Peer-to-Peer) ulanishi va energiya kam sarflanishi to‘g‘ri yozilsa 4 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-9-4', criterion: 'Wi-Fi va Bluetooth amaliy qo‘llanilishi tahlili', fullScore: 8, partialScore: 4, zeroScore: 0, guideline: 'Har bir keys tahlili uchun 4 balldan beriladi.' },
    ],
  },
  {
    id: 'bsb-9-q5',
    order: 5,
    cognitiveLevel: '(Q)',
    points: 10,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '5-topshiriq [10 ball]. Quyidagi URL manzilni tahlil qiling: https://kitob.uz/library',
      },
    ],
    options: [],
    subQuestions: [
      { id: '9-5-a', label: 'a)', prompt: 'Ushbu manzildagi sayt domeni (domen nomi) qaysi?', points: 2.5, rubric: 'kitob.uz deb yozilsa 2.5 ball.' },
      { id: '9-5-b', label: 'b)', prompt: 'Manzildagi /library qismi nimani anglatadi?', points: 2.5, rubric: 'Sayt ichidagi katalog, papka (yo‘l / path) yoki bo‘limni bildiradi deb yozilsa 2.5 ball.' },
      { id: '9-5-c', label: 'c)', prompt: 'http va https protokollarining farqi nimada? Oxiridagi "s" harfi nimani bildiradi?', points: 2.5, rubric: 'https xavfsiz (Secure / shifrlangan) protokol, ma’lumotlar SSL/TLS orqali himoyalanganini bildiradi deb yozilsa 2.5 ball.' },
      { id: '9-5-d', label: 'd)', prompt: 'Protokoldan keyingi :// belgilarining vazifasi nima?', points: 2.5, rubric: 'Protokol nomini domen va yo‘ldan ajratuvchi standart sintaktik belgi deb ko‘rsatilsa 2.5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-9-5', criterion: 'URL strukturasi va tarmoq protokollari tahlili', fullScore: 10, partialScore: 5, zeroScore: 0, guideline: 'To‘rtta qism to‘liq yoritilsa 10 ball (har biri 2.5 ball).' },
    ],
  },
];

export const officialBsb10GradeQuestions: Question[] = [
  {
    id: 'bsb-10-q1',
    order: 1,
    cognitiveLevel: '(B)',
    points: 10,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '1-topshiriq [10 ball]. Axborotning xossalari: Statik va dinamik axborot tahlili:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '10-1-a', label: 'a)', prompt: 'Statik axborot nima? Unga real hayotdan 2 ta aniq misol keltiring:', points: 5, rubric: 'Vaqt o‘tishi bilan deyarli o‘zgarmaydigan axborot. Misollar: Bosma kitobdagi matn, shaxsning tug‘ilgan sanasi va joyi ko‘rsatilsa 5 ball.' },
      { id: '10-1-b', label: 'b)', prompt: 'Dinamik axborot nima? Unga real hayotdan 2 ta aniq misol keltiring:', points: 5, rubric: 'Doimiy ravishda real vaqtda o‘zgarib turuvchi axborot. Misollar: Ob-havo harorati, birjadagi valyuta kursi, avtomobil spidometri ko‘rsatkichi keltirilsa 5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-10-1', criterion: 'Statik va dinamik axborot ta’rifi va misollari', fullScore: 10, partialScore: 5, zeroScore: 0, guideline: 'Ta’rif va 2 tadan to‘g‘ri misol uchun to‘liq 10 ball.' },
    ],
  },
  {
    id: 'bsb-10-q2',
    order: 2,
    cognitiveLevel: '(Q)',
    points: 10,
    taskType: 'case_study',
    blocks: [
      {
        type: 'paragraph',
        text: '2-topshiriq [10 ball]. Sezar shifri (Caesar Cipher) orqali matnni shifrdan chiqarish: Ingliz alifbosi asosida 5 ta siljish (shift = 5) bilan shifrlangan quyidagi xabar berilgan:\n"fvzfynh kqtbjw"',
      },
    ],
    options: [],
    subQuestions: [
      { id: '10-2-a', label: 'a)', prompt: 'Ushbu xabarni asl holiga qaytaring (deshifrlang) va hosil bo‘lgan inglizcha so‘zlarni yozing:', points: 6, rubric: 'Harflarni 5 qadam orqaga surib "atomic flower" (yoki so‘z ma’nosiga ko‘ra to‘g‘ri alifbo surilishi) aniqlansa to‘liq 6 ball.' },
      { id: '10-2-b', label: 'b)', prompt: 'Sezar shifrlash algoritmining asosiy kamchiligi va uni qanday usul bilan oson buzish mumkinligini yozing:', points: 4, rubric: 'Alifboda harflar soni kamligi sababli Brute-force (barcha 25 ta siljishni tekshirib ko‘rish) yoki chastotaviy tahlil orqali oson buzilishi ko‘rsatilsa 4 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-10-2', criterion: 'Sezar shifrini yechish va kriptografik tahlil', fullScore: 10, partialScore: 5, zeroScore: 0, guideline: 'Matn to‘g‘ri deshifrlansa va kamchiligi ko‘rsatilsa 10 ball.' },
    ],
  },
  {
    id: 'bsb-10-q3',
    order: 3,
    cognitiveLevel: '(B)',
    points: 10,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '3-topshiriq [10 ball]. Ichki va tashqi apparat ta’minoti tizimi:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '10-3-a', label: 'a)', prompt: 'Tizim blokining ichki apparat vositalaridan kamida 3 tasini va ularning vazifasini yozing:', points: 5, rubric: 'Ona plata (barcha qismlarni birlashtiradi), CPU (hisoblaydi), RAM (tezkor xotira), Quvvat bloki (elektr taqsimlaydi) keltirilsa 5 ball.' },
      { id: '10-3-b', label: 'b)', prompt: 'Tashqi (periferiya) qurilmalariga 3 ta misol keltiring va ularning kompyuter bilan aloqa interfeysini ko‘rsating:', points: 5, rubric: 'Monitor (HDMI/DisplayPort), Klaviatura/sichqoncha (USB), Printer (USB/Wi-Fi) ko‘rsatilsa 5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-10-3', criterion: 'Ichki va tashqi apparat vositalari arxitekturasi', fullScore: 10, partialScore: 5, zeroScore: 0, guideline: '3 tadan qism va ularning vazifalari to‘g‘ri yozilsa 10 ball.' },
    ],
  },
  {
    id: 'bsb-10-q4',
    order: 4,
    cognitiveLevel: '(Q)',
    points: 10,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '4-topshiriq [10 ball]. Dasturiy ta’minot turlari tahlili (Har bir band 2.5 ball):',
      },
    ],
    options: [],
    subQuestions: [
      { id: '10-4-a', label: 'a)', prompt: 'Ma’lumotlar bazasini boshqarish tizimi (MBBT / DBMS) vazifasi nima? Misol keltiring.', points: 2.5, rubric: 'Katta hajmdagi ma’lumotlarni tizimli saqlash, boshqarish va izlash uchun xizmat qiladi (MySQL, PostgreSQL) deb yozilsa 2.5 ball.' },
      { id: '10-4-b', label: 'b)', prompt: 'Veb-brauzer appletlari yoki kengaytmalari (Extensions) nima uchun xizmat qiladi?', points: 2.5, rubric: 'Brauzer imkoniyatlarini kengaytirish va qo‘shimcha funksiyalar (reklama bloklash, tarjimon) taqdim etish uchun xizmat qiladi deb yozilsa 2.5 ball.' },
      { id: '10-4-c', label: 'c)', prompt: 'Antivirus dasturlarining asosiy ishlash tamoyili qanday?', points: 2.5, rubric: 'Fayllarni viruslar bazasi (signaturalar) bilan solishtiradi va shubhali xatti-harakatlarni tahlil qiladi deb yozilsa 2.5 ball.' },
      { id: '10-4-d', label: 'd)', prompt: 'Operatsion tizim amaliy dasturlar va apparat o‘rtasida qanday vositachilik rolini o‘ynaydi?', points: 2.5, rubric: 'Drayverlar va tizim chaqiriqlari orqali dasturlarga kompyuter resurslaridan (CPU, RAM, disk) to‘g‘ri foydalanish imkonini beradi deb yozilsa 2.5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-10-4', criterion: 'Tizimli va amaliy dasturiy ta’minot tushunchalari', fullScore: 10, partialScore: 5, zeroScore: 0, guideline: 'Har bir band to‘g‘ri javob berilsa 2.5 balldan beriladi.' },
    ],
  },
  {
    id: 'bsb-10-q5',
    order: 5,
    cognitiveLevel: '(M)',
    points: 10,
    taskType: 'case_study',
    blocks: [
      {
        type: 'paragraph',
        text: '5-topshiriq [10 ball]. Kiberxavfsizlik vaziyatli topshirig‘i: Sizga Telegram messenjeri orqali "Tabriklaymiz! Siz 10,000,000 so‘m yutuq sohibi bo‘ldingiz. Yutuqni kartangizga qabul qilish uchun quyidagi link orqali kiring va kartangiz raqami hamda telefoningizga kelgan 6 xonali SMS kodni tasdiqlang" degan xabar keldi.',
      },
    ],
    options: [],
    subQuestions: [
      { id: '10-5-a', label: 'a)', prompt: 'Ushbu kiberhujum turi axborot xavfsizligida qanday ataladi?', points: 2.5, rubric: 'Fishing (Phishing) yoki Ijtimoiy muhandislik (Social engineering) deb yozilsa 2.5 ball.' },
      { id: '10-5-b', label: 'b)', prompt: 'Agar foydalanuvchi ushbu talabni bajarsa, qanday xavfli oqibatlarga olib kelishi mumkin?', points: 2.5, rubric: 'Bank kartasidagi barcha pul mablag‘lari o‘g‘irlanadi yoki Telegram akkaunt qo‘ldan ketadi deb yozilsa 2.5 ball.' },
      { id: '10-5-c', label: 'c)', prompt: 'Foydalanuvchi bunday vaziyatda qanday xavfsizlik choralarini ko‘rishi shart?', points: 2.5, rubric: 'Havolani ochmaslik, SMS kodni hech kimga bermaslik, xabarni spam deb belgilash va foydalanuvchini bloklash deb yozilsa 2.5 ball.' },
      { id: '10-5-d', label: 'd)', prompt: 'Bunday firibgar xabarlarni qanday belgilariga qarab rasmiy xabarlardan ajratish mumkin?', points: 2.5, rubric: 'Kutilmagan yutuq va’dasi, shoshiltirish holati, g‘alati veb-manzil (domen), shaxsiy SMS kodni so‘rashi orqali ajratiladi deb yozilsa 2.5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-10-5', criterion: 'Fishing va kiberxavfsizlik tahdidlarini aniqlash', fullScore: 10, partialScore: 5, zeroScore: 0, guideline: 'To‘rtta band to‘liq tahlil qilinsa 10 ball.' },
    ],
  },
];

export const officialBsb11GradeQuestions: Question[] = [
  {
    id: 'bsb-11-q1',
    order: 1,
    cognitiveLevel: '(B)',
    points: 10,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '1-topshiriq [10 ball]. Relyatsion ma’lumotlar bazasi va SQL so‘rovlari:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '11-1-a', label: 'a)', prompt: 'Birlamchi kalit (Primary Key) va Tashqi kalit (Foreign Key) farqini yozing:', points: 5, rubric: 'Primary Key jadvalda har bir satrni yagona (takrorlanmas) qiladi, Foreign Key esa boshqa jadval bilan munosabat (bog‘lanish) o‘rnatadi deb yozilsa 5 ball.' },
      { id: '11-1-b', label: 'b)', prompt: 'O‘quvchilar jadvalidan ("Students") bahosi 5 bo‘lgan barcha o‘quvchilarni saralash uchun SQL so‘rovini yozing:', points: 5, rubric: 'SELECT * FROM Students WHERE grade = 5; (yoki shunga mos to‘g‘ri SQL sintaksisi) yozilsa 5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-11-1', criterion: 'Relyatsion MBBT va SQL asoslari', fullScore: 10, partialScore: 5, zeroScore: 0, guideline: 'Kalitlar ta’rifi va SQL so‘rovi to‘g‘ri yozilsa 10 ball.' },
    ],
  },
  {
    id: 'bsb-11-q2',
    order: 2,
    cognitiveLevel: '(Q)',
    points: 10,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '2-topshiriq [10 ball]. Sun’iy intellekt va Neyron tarmoqlar:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '11-2-a', label: 'a)', prompt: 'Mashinali o‘rganishda "O‘qituvchi bilan o‘rganish" (Supervised Learning) va "O‘qituvchisiz o‘rganish" (Unsupervised Learning) farqi nimada?', points: 5, rubric: 'Supervised da belgilangan (label berilgan) ma’lumotlar o‘rgatiladi, Unsupervised da esa belgilanmagan ma’lumotlar klasterlanadi va qonuniyatlar o‘zi topiladi deb yozilsa 5 ball.' },
      { id: '11-2-b', label: 'b)', prompt: 'Sun’iy neyron tarmoqning asosiy qatlamlarini (Layers) ko‘rsating:', points: 5, rubric: 'Kiritish qatlami (Input Layer), Yashirin qatlamlar (Hidden Layers) va Chiqarish qatlami (Output Layer) deb yozilsa 5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-11-2', criterion: 'SI va neyron tarmoq arxitekturasi', fullScore: 10, partialScore: 5, zeroScore: 0, guideline: 'O‘rganish turlari va qatlamlar to‘g‘ri yoritilsa 10 ball.' },
    ],
  },
  {
    id: 'bsb-11-q3',
    order: 3,
    cognitiveLevel: '(M)',
    points: 10,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '3-topshiriq [10 ball]. Simmetrik va asimmetrik shifrlash tizimlari:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '11-3-a', label: 'a)', prompt: 'Simmetrik shifrlash (AES) va Asimmetrik shifrlash (RSA) o‘rtasidagi asosiy kalitlar farqini tushuntiring:', points: 5, rubric: 'Simmetrikda shifrlash va deshifrlash uchun bitta umumiy maxfiy kalit ishlatiladi, asimmetrikda esa 2 ta kalit: Ochiq kalit (Public key) va Maxfiy kalit (Private key) ishlatiladi deb yozilsa 5 ball.' },
      { id: '11-3-b', label: 'b)', prompt: 'Elektron raqamli imzo (ERI) qanday yaratiladi va uning o‘zgarmaslik (yaxlitlik) kafolati nimada?', points: 5, rubric: 'Hujjat xeshi muallifning shaxsiy maxfiy kaliti bilan shifrlanadi, har qanday o‘zgarishda xesh buziladi deb ko‘rsatilsa 5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-11-3', criterion: 'Kriptografiya va raqamli imzo tamoyillari', fullScore: 10, partialScore: 5, zeroScore: 0, guideline: 'Kalitlar arxitekturasi va ERI to‘g‘ri tushuntirilsa 10 ball.' },
    ],
  },
  {
    id: 'bsb-11-q4',
    order: 4,
    cognitiveLevel: '(M)',
    points: 10,
    taskType: 'case_study',
    blocks: [
      {
        type: 'paragraph',
        text: '4-topshiriq [10 ball]. Kiberxavfsizlik tahlili: DoS va DDoS hujumlari:',
      },
    ],
    options: [],
    subQuestions: [
      { id: '11-4-a', label: 'a)', prompt: 'DDoS (Distributed Denial of Service) hujumi qanday amalga oshiriladi va u serverni qanday qilib ishdan chiqaradi?', points: 5, rubric: 'Botnet (zararlangan minglab kompyuterlar) orqali serverga bir vaqtning o‘zida haddan tashqari ko‘p so‘rov yuboriladi va server resurslari to‘lib xizmat ko‘rsata olmay qoladi deb yozilsa 5 ball.' },
      { id: '11-4-b', label: 'b)', prompt: 'DDoS hujumlaridan himoyalanish uchun qanday zamonaviy vositalar (Firewall, CDN va h.k.) qo‘llaniladi?', points: 5, rubric: 'Web Application Firewall (WAF), Cloudflare kabi CDN tarmoqlari, trafik filtrlash va tezlikni cheklash (rate limiting) deb ko‘rsatilsa 5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-11-4', criterion: 'DDoS hujumlari mexanizmi va himoya choralari', fullScore: 10, partialScore: 5, zeroScore: 0, guideline: 'Hujum mexanizmi va himoya choralari to‘g‘ri yozilsa 10 ball.' },
    ],
  },
  {
    id: 'bsb-11-q5',
    order: 5,
    cognitiveLevel: '(Q)',
    points: 10,
    taskType: 'subquestions',
    blocks: [
      {
        type: 'paragraph',
        text: '5-topshiriq [10 ball]. Algoritmlarning vaqt va xotira murakkabligi (Big O):',
      },
    ],
    options: [],
    subQuestions: [
      { id: '11-5-a', label: 'a)', prompt: 'Chiziqli qidiruv (Linear Search) va Binar qidiruv (Binary Search) algoritmlarining vaqt murakkabligini O(...) belgisi bilan yozing:', points: 5, rubric: 'Linear Search: O(n), Binary Search: O(log n) deb yozilsa 5 ball.' },
      { id: '11-5-b', label: 'b)', prompt: 'Binar qidiruv algoritmini qo‘llash uchun massiv qanday shartni qanoatlantirishi shart?', points: 5, rubric: 'Massiv elementlari albatta tartiblangan (o‘sish yoki kamayish tartibida saralangan) bo‘lishi shart deb yozilsa 5 ball.' },
    ],
    rubricCriteria: [
      { id: 'rubric-11-5', criterion: 'Algoritmlar murakkabligi va saralash shartlari', fullScore: 10, partialScore: 5, zeroScore: 0, guideline: 'O(n), O(log n) va saralanganlik sharti to‘g‘ri ko‘rsatilsa 10 ball.' },
    ],
  },
];

/**
 * Rasmiy BSB imtihonlari to'plami
 */
export const officialBsbAssessments: Assessment[] = [
  {
    id: 'bsb-inf-5-q1',
    tenantId: 'tenant-al-xorazmiy',
    title: '5-sinf Informatika va AT. I chorak 1-BSB (Rasmiy mezon)',
    subject: 'Informatika va axborot texnologiyalari',
    grade: 5,
    quarter: 1,
    assessmentNumber: 1,
    durationMinutes: 40,
    durationSeconds: 2400,
    questionCount: 5,
    maxScore: 25,
    status: 'available',
    questions: officialBsb5GradeQuestions,
  },
  {
    id: 'bsb-inf-6-q1',
    tenantId: 'tenant-al-xorazmiy',
    title: '6-sinf Informatika va AT. I chorak 1-BSB (Rasmiy mezon)',
    subject: 'Informatika va axborot texnologiyalari',
    grade: 6,
    quarter: 1,
    assessmentNumber: 1,
    durationMinutes: 40,
    durationSeconds: 2400,
    questionCount: 5,
    maxScore: 25,
    status: 'available',
    questions: officialBsb6GradeQuestions,
  },
  {
    id: 'bsb-inf-7-q1',
    tenantId: 'tenant-al-xorazmiy',
    title: '7-sinf Informatika va AT. I chorak 1-BSB (Rasmiy mezon)',
    subject: 'Informatika va axborot texnologiyalari',
    grade: 7,
    quarter: 1,
    assessmentNumber: 1,
    durationMinutes: 40,
    durationSeconds: 2400,
    questionCount: 5,
    maxScore: 25,
    status: 'available',
    questions: officialBsb7GradeQuestions,
  },
  {
    id: 'bsb-inf-9-q1',
    tenantId: 'tenant-al-xorazmiy',
    title: '9-sinf Informatika va AT. I chorak 1-BSB (Pedagogik Mahorat Markazi)',
    subject: 'Informatika va axborot texnologiyalari',
    grade: 9,
    quarter: 1,
    assessmentNumber: 1,
    durationMinutes: 40,
    durationSeconds: 2400,
    questionCount: 5,
    maxScore: 50,
    status: 'available',
    questions: officialBsb9GradeQuestions,
  },
  {
    id: 'bsb-inf-10-q1',
    tenantId: 'tenant-al-xorazmiy',
    title: '10-sinf Informatika va AT. I chorak 1-BSB (Pedagogik Mahorat Markazi)',
    subject: 'Informatika va axborot texnologiyalari',
    grade: 10,
    quarter: 1,
    assessmentNumber: 1,
    durationMinutes: 40,
    durationSeconds: 2400,
    questionCount: 5,
    maxScore: 50,
    status: 'available',
    questions: officialBsb10GradeQuestions,
  },
  {
    id: 'bsb-inf-11-q1-bsb',
    tenantId: 'tenant-al-xorazmiy',
    title: '11-sinf Informatika va AT. I chorak 1-BSB (Pedagogik Mahorat Markazi)',
    subject: 'Informatika va axborot texnologiyalari',
    grade: 11,
    quarter: 1,
    assessmentNumber: 1,
    durationMinutes: 40,
    durationSeconds: 2400,
    questionCount: 5,
    maxScore: 50,
    status: 'available',
    questions: officialBsb11GradeQuestions,
  },
];

/**
 * Sinf darajasiga qarab rasmiy mezon parametrlarini qaytarish
 */
export function getBsbStandardByGrade(grade: number): {
  maxScore: number;
  questionCount: number;
  durationMinutes: number;
  sampleQuestions: Question[];
} {
  if (grade <= 7) {
    let questions = officialBsb5GradeQuestions;
    if (grade === 6) questions = officialBsb6GradeQuestions;
    if (grade === 7) questions = officialBsb7GradeQuestions;
    return {
      maxScore: 25,
      questionCount: 5,
      durationMinutes: 40,
      sampleQuestions: questions,
    };
  }

  let questions = officialBsb9GradeQuestions;
  if (grade === 10) questions = officialBsb10GradeQuestions;
  if (grade === 11) questions = officialBsb11GradeQuestions;
  return {
    maxScore: 50,
    questionCount: 5,
    durationMinutes: 40,
    sampleQuestions: questions,
  };
}
