import { describe, it, expect } from 'vitest';
import { cyrillicToLatin, isCyrillic, normalizeUnifiedName } from '../src/features/emaktab/services/transliterationService';
import { parseEmaktabJournal, parseMultipleEmaktabJournals } from '../src/features/emaktab/services/emaktabJournalParser';
import { parseEmaktabRoster } from '../src/features/emaktab/services/rosterParserService';

const CHUNK_11A_G2 = `,,,,,,,,,,,,,,,,,,,,,
Sinf: 11-A (2-gurux) 2026/2027 o‘quv yili,,,,,,,,,,,,,,,,,,,,,
Fan: Informatika va axbarotlar texnologiyasi,,,,,,,,,,,,,,,,,,,,,
1691610383141616760,,,,,,,,,,,,,,,,,,,,,
o‘qituvchining FIO: Dilrabo Turdialiyevna Sharafxonova,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,
X/X №,Oy,,Noyabr,,,,,,Dekabr,,,,,,,,FB,Ballar,Tavsiya. Baho,2 Chorak ,1 yarim yillik
,Son,,13.0,14.0,20.0,21.0,27.0,28.0,4.0,5.0,11.0,12.0,18.0,19.0,25.0,26.0,,,,,
,O‘quvchining ism va familiyasi,,,,,,,,,,,,,,,,,,,,
,,,2555715815496537357,2555715815496537354,2555715815496537348,2555715815496537351,2555715815496537338,2555715815496537350,2555715815496537364,2555715815496537359,2555715815496537344,2555715815496537337,2555715815496537342,2555715815496537356,2555715815496537347,2555715815496537362,,,,2529708302460568222,2529708302460568225
1.0,Davlatova Nurjaxonbegim,1000001990097,8.0,,,,,,,,,,,,,,0.0,0.0,0.0,,
2.0,Ibroximova Ruxshona,1000002015266,,,8.0,,,,,,,,,,,,0.0,0.0,0.0,,
3.0,Isaqov Muhammadqodir,1000003598256,9.0,,8.0,,,,,,,,,,,,0.0,0.0,0.0,,
4.0,Jurayev Xumoyun,1000003594718,,8.0,,,,,,,,,,,,,0.0,0.0,0.0,,
5.0,Mamatyusufova Kumush,1000001990105,9.0,,8.0,,,,,,,,,,,,0.0,0.0,0.0,,
6.0,Mamitaliyeva Xumora,1000017085712,,8.0,,,,,,,,,,,,,0.0,0.0,0.0,,
7.0,Nurmuxamadova Shabnam,1000001990107,,8.0,,,,,,,,,,,,,0.0,0.0,0.0,,
8.0,Raxmonov Ziyodullo,1000001990111,9.0,,9.0,,,,,,,,,,,,0.0,0.0,0.0,,
9.0,Sobirjonova Jasminabonu,1000019411830,,8.0,,,,,,,,,,,,,0.0,0.0,0.0,,
10.0,Solijonova Billura,1000003598214,9.0,,9.0,,,,,,,,,,,,0.0,0.0,0.0,,
11.0,Tursunaliyeva Nargiza,1000003598462,9.0,,,,,,,,,,,,,,0.0,0.0,0.0,,
12.0,Sharipova Gulsanam,1000001990118,,8.0,,,,,,,,,,,,,0.0,0.0,0.0,,
13.0,Озодов Озодбек,1000001990108,,8.0,,,,,,,,,,,,,0.0,0.0,0.0,,
14.0,Расулжонова Ноила,1000009831037,8.0,,8.0,,,,,,,,,,,,0.0,0.0,0.0,,
15.0,Умаржонова Шайдо,1000003594925,,8.0,,,,,,,,,,,,,0.0,0.0,0.0,,
16.0,Усибжонова Сарвиноз,1000001990114,,8.0,,,,,,,,,,,,,0.0,0.0,0.0,,`;

const CHUNK_11A_G1 = `,,,,,,,,,,,,,,,,,,,,,
Sinf: 11-A (1-gurux) 2026/2027 o‘quv yili,,,,,,,,,,,,,,,,,,,,,
Fan: Informatika va axbarotlar texnologiyasi,,,,,,,,,,,,,,,,,,,,,
1691610383141616760,,,,,,,,,,,,,,,,,,,,,
o‘qituvchining FIO: Dilmurod Rahmataliyevich Yunusov,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,
X/X №,Oy,,Noyabr,,,,,,Dekabr,,,,,,,,FB,Ballar,Tavsiya. Baho,2 Chorak ,1 yarim yillik
,Son,,13.0,14.0,20.0,21.0,27.0,28.0,4.0,5.0,11.0,12.0,18.0,19.0,25.0,26.0,,,,,
,O‘quvchining ism va familiyasi,,,,,,,,,,,,,,,,,,,,
,,,2555715815496537332,2555715815496537329,2555715815496537326,2555715815496537328,2555715815496537323,2555715815496537335,2555715815496537334,2555715815496537327,2555715815496537324,2555715815496537330,2555715815496537325,2555715815496537336,2555715815496537333,2555715815496537331,,,,2529708302460568222,2529708302460568225
1.0,Abduraximova Zuxra,1000001990090,8.0,,8.0,,,,,,,,,,,,0.0,0.0,0.0,,
2.0,Abdusattorova Xayrixon,1000003598248,,8.0,,,,,,,,,,,,,0.0,0.0,0.0,,
3.0,Abdug‘afforova Madinabonu,1000001990091,,8.0,,,,,,,,,,,,,0.0,0.0,0.0,,
4.0,Axmadjonova Zaxro,1000003569688,8.0,,8.0,,,,,,,,,,,,0.0,0.0,0.0,,
5.0,Davlataliyev O‘ktamjon,1000001990096,8.0,,,,,,,,,,,,,,0.0,0.0,0.0,,
6.0,Ergashaliyeva Zilola,1000004307678,,9.0,,,,,,,,,,,,,0.0,0.0,0.0,,
7.0,Ergashev Nurhayit,1000001990098,,8.0,,,,,,,,,,,,,0.0,0.0,0.0,,
8.0,Ergasheva Nazira,1000003569692,7.0,,8.0,,,,,,,,,,,,0.0,0.0,0.0,,
9.0,Jurabayeva Madina,1000001990100,,8.0,,,,,,,,,,,,,0.0,0.0,0.0,,
10.0,Odilov O‘tkirbek,1000003673332,8.0,,,,,,,,,,,,,,0.0,0.0,0.0,,
11.0,Ozatboyeva Gullola,1000001990109,,8.0,,,,,,,,,,,,,0.0,0.0,0.0,,
12.0,Sobirjonova Durdona,1000003594807,8.0,,8.0,,,,,,,,,,,,0.0,0.0,0.0,,
13.0,Umaraliyeva Feruza,1000001990115,,8.0,,,,,,,,,,,,,0.0,0.0,0.0,,
14.0,Valijonova Sevdora,1000020620646,,,8.0,,,,,,,,,,,,0.0,0.0,0.0,,
15.0,Мираджонова Шабнам,1000003569665,8.0,,,,,,,,,,,,,,0.0,0.0,0.0,,`;

const CHUNK_10V = `,,,,,,,,,,,,,,,,,,,
Sinf: 10-V 2026/2027 o‘quv yili,,,,,,,,,,,,,,,,,,,
Fan: Informatika va axbarotlar texnologiyasi,,,,,,,,,,,,,,,,,,,
1691610383141616760,,,,,,,,,,,,,,,,,,,
o‘qituvchining FIO: Dilmurod Rahmataliyevich Yunusov,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,
X/X №,Oy,,Noyabr,,,,,,Dekabr,,,,,,FB,Ballar,Tavsiya. Baho,2 Chorak ,1 yarim yillik
,Son,,10.0,16.0,17.0,23.0,24.0,30.0,1.0,7.0,14.0,15.0,21.0,22.0,,,,,
,O‘quvchining ism va familiyasi,,,,,,,,,,,,,,,,,,
,,,2555715759661962397,2555715759661962406,2555715759661962402,2555715759661962404,2555715759661962408,2555715759661962405,2555715759661962400,2555715759661962399,2555715759661962403,2555715759661962401,2555715759661962407,2555715759661962398,,,,2530210890943603027,2530210890943603030
1.0,Abbosova Bahora,1000005839035,8.0,,8.0,,,,,,,,,,0.0,0.0,0.0,,
2.0,Abduraximov Azamatjon,1000018350347,,8.0,,,,,,,,,,,0.0,0.0,0.0,,
3.0,Abdusattorova Gullola,1000011419185,,,8.0,,,,,,,,,,0.0,0.0,0.0,,
4.0,Adiljanov Murodjon,1000001361156,8.0,,,,,,,,,,,,0.0,0.0,0.0,,
5.0,Alijonova Fotimaxon,1000011349773,,8.0,,,,,,,,,,,0.0,0.0,0.0,,
6.0,Baxtiyorova Xushnoza,1000018174777,,,8.0,,,,,,,,,,0.0,0.0,0.0,,
7.0,Gulomova Shodiyona,1000012165845,8.0,k,k,,,,,,,,,,0.0,0.0,0.0,,
20.0,Sheraliyeva Nilufar,1000011372193,,k,k,,,,,,,,,,,,,,
22.0,Давлаталиев Жахонгир,1000011419188,,8.0,,,,,,,,,,,0.0,0.0,0.0,,
26.0,Турғунов Бобоназар,1000023444076,,8.0,,,,,,,,,,,0.0,0.0,0.0,,
27.0,Юлдашалиева Муштарийбоnu,1000001361183,8.0,,8.0,,,,,,,,,,0.0,0.0,0.0,,`;

describe('TASK-ED.1..3: Universal eMaktab Journal Parser & Transliteration', () => {
  describe('Transliteration Service', () => {
    it('detects Cyrillic text accurately', () => {
      expect(isCyrillic('Озодов Озодбек')).toBe(true);
      expect(isCyrillic('Турғунов Бобоназар')).toBe(true);
      expect(isCyrillic('Davlatova Nurjaxonbegim')).toBe(false);
    });

    it('transliterates Uzbek Cyrillic names into Latin accurately', () => {
      expect(cyrillicToLatin('Озодов Озодбек')).toBe('Ozodov Ozodbek');
      expect(cyrillicToLatin('Расулжонова Ноила')).toBe('Rasuljonova Noila');
      expect(cyrillicToLatin('Давлаталиев Жахонгир')).toBe('Davlataliyev Jaxongir');
      expect(cyrillicToLatin('Турғунов Бобоназар')).toBe("Turg'unov Bobonazar");
    });

    it('normalizes names into unified lowercase search string regardless of alphabet', () => {
      const cyrillic = normalizeUnifiedName('Озодов Озодбек');
      const latin = normalizeUnifiedName('Ozodov Ozodbek');
      expect(cyrillic).toBe(latin);
    });
  });

  describe('eMaktab Journal Parser Service', () => {
    it('parses 11-A (2-guruh) journal metadata and all 16 students accurately', () => {
      const data = parseEmaktabJournal(CHUNK_11A_G2);
      expect(data.metadata.className).toBe('11-A');
      expect(data.metadata.groupName).toBe('2-gurux');
      expect(data.metadata.subject).toContain('Informatika');
      expect(data.metadata.teacherFio).toContain('Dilrabo');
      expect(data.students.length).toBe(16);

      // Student 1 (Latin)
      expect(data.students[0]?.fullName).toBe('Davlatova Nurjaxonbegim');
      expect(data.students[0]?.emaktabId).toBe('1000001990097');
      expect(data.students[0]?.grades).toContain('8');

      // Student 13 (Cyrillic)
      const cyrStudent = data.students[12];
      expect(cyrStudent?.fullName).toBe('Озодов Озодбек');
      expect(cyrStudent?.fullNameLatin).toBe('Ozodov Ozodbek');
      expect(cyrStudent?.emaktabId).toBe('1000001990108');
    });

    it('parses 11-A (1-guruh) journal for teacher Dilmurod Yunusov', () => {
      const data = parseEmaktabJournal(CHUNK_11A_G1);
      expect(data.metadata.className).toBe('11-A');
      expect(data.metadata.groupName).toBe('1-gurux');
      expect(data.metadata.teacherFio).toContain('Dilmurod Rahmataliyevich Yunusov');
      expect(data.students.length).toBe(15);
      expect(data.students[0]?.fullName).toBe('Abduraximova Zuxra');
      expect(data.students[0]?.emaktabId).toBe('1000001990090');
    });

    it('parses 10-V whole class journal and catches attendance absences', () => {
      const data = parseEmaktabJournal(CHUNK_10V);
      expect(data.metadata.className).toBe('10-V');
      expect(data.metadata.groupName).toBeUndefined(); // whole class
      expect(data.students.length).toBe(11); // from excerpt

      // Gulomova Shodiyona had 'k' attendance
      const gulomova = data.students.find((s) => s.fullName.includes('Gulomova'));
      expect(gulomova?.attendanceAbsences).toBe(2);
      expect(gulomova?.grades).toContain('k');
    });

    it('parses multiple journals separated by ^next_part^', () => {
      const multi = `${CHUNK_11A_G1}\n^next_part^\n${CHUNK_11A_G2}`;
      const list = parseMultipleEmaktabJournals(multi);
      expect(list.length).toBe(2);
      expect(list[0]?.metadata.groupName).toBe('1-gurux');
      expect(list[1]?.metadata.groupName).toBe('2-gurux');
    });

    it('integrates seamlessly with parseEmaktabRoster when full journal text is pasted', () => {
      const students = parseEmaktabRoster(CHUNK_11A_G2);
      expect(students.length).toBe(16);
      expect(students[0]?.fullName).toBe('Davlatova Nurjaxonbegim');
      expect(students[0]?.emaktabId).toBe('1000001990097');
      expect(students[0]?.className).toBe('11-A');
    });
  });
});
