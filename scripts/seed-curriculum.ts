import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');
const db = new DatabaseSync(dbPath);

console.log(`🚀 Seeding Curriculum Resources into: ${dbPath}`);

const tenantId = 'tenant-al-xorazmiy';
const subjectCode = 'inf';

// Clear existing curriculum resources
db.exec('DELETE FROM curriculum_resources;');
db.exec('DELETE FROM assessment_solutions;');

const insertResource = db.prepare(`
  INSERT INTO curriculum_resources (
    id, tenant_id, subject_code, grade_level, quarter, lesson_number,
    title, topic, resource_type, description, content_json, file_url, download_count, created_at, updated_at
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
`);

const grades = [
  {
    grade: 5,
    title: 'Axborot va uning turlari. Kompyuter bilan xavfsiz ishlash',
    topic: 'Axborot tushunchasi va texnika xavfsizligi',
    slidesCount: 10,
    tasksCount: 4,
  },
  {
    grade: 6,
    title: 'Grafik muharrirlar va kompyuter grafikasi asoslari',
    topic: 'Rastrli va vektorli grafika',
    slidesCount: 10,
    tasksCount: 4,
  },
  {
    grade: 7,
    title: 'Algoritm tushunchasi, turlari va blok-sxemalar',
    topic: 'Chiziqli, tarmoqlanuvchi va takrorlanuvchi algoritmlar',
    slidesCount: 12,
    tasksCount: 5,
  },
  {
    grade: 8,
    title: 'Elektron jadvallar (Excel)da hisoblashlar va diagrammalar',
    topic: 'Formula va funksiyalar bilan ishlash',
    slidesCount: 12,
    tasksCount: 5,
  },
  {
    grade: 9,
    title: 'Python dasturlash tili: o‘zgaruvchilar va shart operatorlari',
    topic: 'Sintaksis, if/else va sodda hisoblash algoritmlari',
    slidesCount: 14,
    tasksCount: 6,
  },
  {
    grade: 10,
    title: 'Web-dasturlash: HTML5 semantik teglari va CSS3 stillari',
    topic: 'Zamonaviy veb-sahifa maketini yaratish',
    slidesCount: 15,
    tasksCount: 6,
  },
  {
    grade: 11,
    title: 'Sun’iy intellekt, Kiberxavfsizlik va Relyatsion ma’lumotlar bazasi (SQL)',
    topic: 'Axborot xavfsizligi, neyron tarmoqlar va SQL so‘rovlari',
    slidesCount: 16,
    tasksCount: 6,
  },
];

for (const g of grades) {
  // 1. PRESENTATION
  const presentationContent = {
    slides: [
      {
        slideNumber: 1,
        title: `${g.grade}-sinf: ${g.title}`,
        subtitle: 'Informatika va axborot texnologiyalari fani',
        bullets: ['Darsning maqsadi va vazifalari', 'Asosiy tushunchalar', 'Amaliy namoyish', 'Mustahkamlash savollari'],
      },
      {
        slideNumber: 2,
        title: 'Dars Maqsadi va Kutilayotgan Natijalar',
        subtitle: 'Kognitiv o‘zlashtirish mezonlari (Bloom taksonomiyasi)',
        bullets: [
          'Bilish: Asosiy termin va ta’riflarni o‘zlashtirish',
          'Qo‘llash: Kompyuterda amaliy ko‘nikmalarni shakllantirish',
          'Tahlil: Natijalarni solishtirish va xatolarni mustaqil bartaraf etish',
        ],
      },
      {
        slideNumber: 3,
        title: `Nazariy Qism: ${g.topic}`,
        subtitle: 'Asosiy qoidalar va tushunchalar',
        bullets: [
          'Mavzuning kundalik hayotdagi va kasbiy sohadagi amaliy ahamiyati',
          'Dasturiy vositalar va ulardan unumli foydalanish tamoyillari',
          'Ommaviy xatolar va ularni oldini olish yo‘llari',
        ],
      },
      {
        slideNumber: 4,
        title: 'Amaliy Mashg‘ulot va Bosqichma-bosqich Ko‘rsatma',
        subtitle: 'O‘qituvchi boshchiligidagi laboratoriya ishi',
        bullets: [
          '1-bosqich: Boshlang‘ich muhitni tayyorlash',
          '2-bosqich: Asosiy vazifani bajarish',
          '3-bosqich: Natijani tekshirish va xulosalash',
        ],
      },
      {
        slideNumber: 5,
        title: 'Xulosa va Uy Vazifasi',
        subtitle: 'Bilimlarni mustahkamlash',
        bullets: [
          'Darslikdagi mavzuni takrorlash va konspekt qilish',
          'Amaliy topshiriqni mustaqil yakunlash',
          'Keyingi dars uchun tayyorgarlik savollari',
        ],
      },
    ],
  };

  insertResource.run(
    `res-pres-${g.grade}`,
    tenantId,
    subjectCode,
    g.grade,
    1,
    1,
    `${g.grade}-sinf Dars Taqdimoti: ${g.title}`,
    g.topic,
    'PRESENTATION',
    `${g.grade}-sinflar uchun to‘liq interaktiv slaydlar to‘plami (Darsda namoyish qilish va yuklab olish uchun).`,
    JSON.stringify(presentationContent),
    `/materials/presentations/${g.grade}-sinf-taqdimot.pdf`,
    128 + g.grade * 15
  );

  // 2. WORKSHEET / TASKS
  const taskContent = {
    steps: [
      {
        phase: '1. Kirish va Aqliy Hujum (5 daqiqa)',
        task: 'O‘tgan mavzuni yodga olish va yangi mavzu bo‘yicha 3 ta qiziqarli savolga javob topish.',
        timeMinutes: 5,
        points: 5,
      },
      {
        phase: '2. Yangi Mavzuni Mustahkamlash (20 daqiqa)',
        task: 'Darslikdagi asosiy amaliy topshiriqni kompyuterda bosqichma-bosqich bajarish.',
        timeMinutes: 20,
        points: 15,
      },
      {
        phase: '3. Mustaqil Ish va Kognitiv Masala (15 daqiqa)',
        task: 'PISA formatidagi nostandart mantiqiy topshiriqni mustaqil tahlil qilish.',
        timeMinutes: 15,
        points: 15,
      },
      {
        phase: '4. Refleksiya va Dars Yakuni (5 daqiqa)',
        task: '“Bugun nima o‘rgandim?” o‘z-o‘zini baholash varaqasini to‘ldirish.',
        timeMinutes: 5,
        points: 5,
      },
    ],
  };

  insertResource.run(
    `res-task-${g.grade}`,
    tenantId,
    subjectCode,
    g.grade,
    1,
    1,
    `${g.grade}-sinf Dars Topshiriqlari (Ish Varaqasi)`,
    g.topic,
    'WORKSHEET',
    `Har bir darsda 45 daqiqalik dars davomida o‘quvchilarga tarqatish uchun 4 bosqichli tayyor mashqlar.`,
    JSON.stringify(taskContent),
    `/materials/worksheets/${g.grade}-sinf-ish-varaqasi.pdf`,
    94 + g.grade * 8
  );

  // 3. WORKBOOK (Nazorat ishi daftari)
  const workbookContent = {
    title: `${g.grade}-sinf Informatika fanidan Nazorat Ishi Daftari`,
    guidelines: [
      'Nazorat ishi 40 daqiqa davom etadi.',
      'Barcha hisob-kitob va yozuvlar ushbu daftarda aniq qayd etilishi shart.',
      'Javoblar jadvali qalam yoki ko‘k ruchkada toza to‘ldiriladi.',
    ],
    sections: [
      '1. O‘quvchi Ma’lumotlari va Titul Varaqasi',
      '2. 1-Variant Nazorat Topshiriqlari',
      '3. 2-Variant Nazorat Topshiriqlari',
      '4. O‘quvchi Javoblar Matrisasi',
      '5. O‘qituvchi Baholash Varaqasi va Kriteriyalari',
    ],
  };

  insertResource.run(
    `res-wb-${g.grade}`,
    tenantId,
    subjectCode,
    g.grade,
    1,
    1,
    `${g.grade}-sinf Nazorat Ishi Daftari (Chop etishga tayyor A4)`,
    `ChSB va BSB nazoratlari uchun rasmiy daftar`,
    'WORKBOOK',
    `5–11-sinflar uchun chop etishga tayyor, rasmiy vazirlik talablariga mos nazorat ishi daftarlari.`,
    JSON.stringify(workbookContent),
    `/materials/workbooks/${g.grade}-sinf-nazorat-daftari.pdf`,
    215 + g.grade * 12
  );

  // 4. SOLUTION (BSB/CHSB Yechimlari)
  const solutionContent = {
    examTitle: `${g.grade}-sinf 1-CHSB Imtihon Savollari va To‘liq Yechimlari`,
    totalQuestions: 15,
    maxScore: 40,
    questions: [
      {
        number: 1,
        question: `${g.topic} bo‘yicha asosiy tushuncha qaysi javobda to‘g‘ri keltirilgan?`,
        correctAnswer: 'A varianti',
        stepByStepSolution:
          '1-qadam: Savol matnidagi asosiy qoidani tahlil qilamiz. 2-qadam: A variantidagi ta’rif darslikdagi standart tushunchaga 100% mos keladi.',
        bloomLevel: 'KNOWLEDGE',
        points: 2.5,
      },
      {
        number: 2,
        question: `Amaliy jarayonda ushbu parametr qanday o‘zgaradi?`,
        correctAnswer: 'C varianti',
        stepByStepSolution:
          '1-qadam: Boshlang‘ich qiymatni aniqlaymiz. 2-qadam: Formulani qo‘llab, oraliq natijani chiqaramiz. 3-qadam: C varianti qanoatlantiradi.',
        bloomLevel: 'APPLICATION',
        points: 2.5,
      },
      {
        number: 3,
        question: `Keltirilgan kod / algoritm natijasini hisoblang:`,
        correctAnswer: 'B varianti',
        stepByStepSolution:
          '1-qadam: Shart operatorini tekshiramiz (True). 2-qadam: Qiymat 2 martaga oshiriladi. 3-qadam: Natija: B varianti.',
        bloomLevel: 'ANALYSIS',
        points: 3.0,
      },
    ],
  };

  insertResource.run(
    `res-sol-${g.grade}`,
    tenantId,
    subjectCode,
    g.grade,
    1,
    1,
    `${g.grade}-sinf BSB va CHSB Savollari hamda Batafsil Yechimlari`,
    `1-Chorak BSB va CHSB tahlili`,
    'SOLUTION',
    `Barcha BSB va CHSB savollarining qadamma-qadam yechimlari, to‘g‘ri javob kalitlari va baholash rubrikasi.`,
    JSON.stringify(solutionContent),
    `/materials/solutions/${g.grade}-sinf-yechimlar.pdf`,
    340 + g.grade * 20
  );
}

// Seed specific assessment solutions for 11th grade CHSB (chsb-inf-11-q1)
const insertSolution = db.prepare(`
  INSERT INTO assessment_solutions (
    id, assessment_id, question_id, variant_number, step_by_step_solution,
    solution_formulas, rubric_criteria_json, author_note, created_at
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
  )
`);

const qRows = db.prepare(`SELECT id, question_number, prompt, correct_option_id, points, bloom_level FROM questions WHERE assessment_id = 'chsb-inf-11-q1'`).all() as {
  id: string;
  question_number: number;
  prompt: string;
  correct_option_id: string;
  points: number;
  bloom_level: string;
}[];

for (const q of qRows) {
  insertSolution.run(
    `sol-${q.id}`,
    'chsb-inf-11-q1',
    q.id,
    1,
    `Savol #${q.question_number} Yechimi: To‘g‘ri javob — ${q.correct_option_id}. Ushbu savol ${q.bloom_level} darajasiga oid bo‘lib, darslikdagi qoidalar asosida tahlil qilinadi. Qadamma-qadam: 1. Berilgan shartlar aniqlanadi. 2. To‘g‘ri formula tatbiq etiladi. 3. ${q.correct_option_id} varianti tanlanadi.`,
    q.bloom_level === 'APPLICATION' ? 'N = 2^i, I = K * i' : null,
    JSON.stringify([
      { criterion: 'Nazariy qoidani to‘g‘ri tushunish', maxPoints: q.points * 0.4 },
      { criterion: 'Hisoblash yoki mantiqiy xulosalash', maxPoints: q.points * 0.6 },
    ]),
    `O‘qituvchi uchun izoh: O‘quvchi ushbu savolda qiynalsa, ${q.bloom_level} bo‘yicha qo‘shimcha mashg‘ulot o‘tkazish tavsiya etiladi.`
  );
}

console.log(`✅ Muvaqqafiyatli yakunlandi! 5-11-sinflar uchun barcha resurslar va yechimlar bazaga kiritildi.`);
