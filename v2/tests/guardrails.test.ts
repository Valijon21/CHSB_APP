import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateDomainScope } from '../src/lib/domain-guard';
import { checkMissingClassOrGrade, extractTablesFromSql, verifyOutputGrounding } from '../src/lib/grounding-guard';
import { processChatQuery } from '../src/lib/ai-engine';

describe('RAG Anti-Hallucination & Domain Guardrails', () => {
  describe('Domain & Scope Guardrail (Out-of-Domain Rejection)', () => {
    it('should reject non-educational queries like weather', () => {
      const result = validateDomainScope('Ertaga Toshkentda ob-havo qanday bo‘ladi?');
      assert.equal(result.isAllowed, false);
      assert.ok(result.reason?.includes('CHSB/BSB maktab baholashlari'));
    });

    it('should reject financial and crypto currency queries', () => {
      const result = validateDomainScope('Bugun 1 AQSH dollari kursi va bitcoin narxi qancha?');
      assert.equal(result.isAllowed, false);
    });

    it('should reject cooking recipes and movie requests', () => {
      const result = validateDomainScope('Menga osh pishirish retseptini aytib ber');
      assert.equal(result.isAllowed, false);
    });

    it('should accept genuine school, CHSB and exam queries', () => {
      const q1 = validateDomainScope('Umumiy maktablar va CHSB ko‘rsatkichlarini ko‘rsat');
      assert.equal(q1.isAllowed, true);

      const q2 = validateDomainScope('11-sinflar kesimida CHSB imtihon baholari');
      assert.equal(q2.isAllowed, true);

      const q3 = validateDomainScope('Past o‘zlashtirgan o‘quvchilar ro‘yxati va PISA darajalari');
      assert.equal(q3.isAllowed, true);

      const q4 = validateDomainScope('Bloom taksonomiyasi va savollar kognitiv qiyinligi tahlili');
      assert.equal(q4.isAllowed, true);
    });
  });

  describe('Missing Data & Grade Bounds Guardrail', () => {
    it('should detect when user asks for non-existent grades (e.g. 7-sinf)', () => {
      const result = checkMissingClassOrGrade('7-sinf CHSB natijalarini ko‘rsat');
      assert.equal(result.isMissing, true);
      assert.equal(result.requestedGrade, 7);
      assert.ok(result.summary?.includes('7-sinf bo‘yicha hech qanday ma’lumot topilmadi'));
    });

    it('should detect when user asks for 9-sinf which has classes but no assessments yet', () => {
      const result = checkMissingClassOrGrade('9-sinflar kesimida o‘rtacha ballar');
      assert.equal(result.isMissing, true);
      assert.equal(result.requestedGrade, 9);
      assert.ok(result.summary?.includes('baholash natijalari hali kiritilmagan'));
    });

    it('should allow queries for 11-sinf which has 19 assessment records', () => {
      const result = checkMissingClassOrGrade('11-A sinf o‘quvchilari natijalari');
      assert.equal(result.isMissing, false);
    });
  });

  describe('SQL Provenance & Table Extraction', () => {
    it('should accurately extract queried tables from safe SQL', () => {
      const sql = 'SELECT s.name FROM students s JOIN class_groups cg ON cg.id = s.class_group_id LEFT JOIN assessment_results ar ON ar.student_id = s.id';
      const tables = extractTablesFromSql(sql);

      assert.ok(tables.includes('students'));
      assert.ok(tables.includes('class_groups'));
      assert.ok(tables.includes('assessment_results'));
    });
  });

  describe('Metric Fact-Checking & Anti-Hallucination Verifier', () => {
    it('should verify output when claimed percentages match real database numbers', () => {
      const fakeData = [{ overall_avg_percentage: 84.8, quality_percentage: 89.5 }];
      const sql = 'SELECT * FROM assessment_results';
      const summary = 'CHSB umumiy tahlili.';
      const insight = 'Platformadagi umumiy o‘rtacha ko‘rsatkich 84.8% ga teng.';

      const verification = verifyOutputGrounding(summary, insight, fakeData, sql);
      assert.equal(verification.isGrounded, true);
      assert.equal(verification.groundingScore, 1.0);
      assert.equal(verification.hallucinationsDetected.length, 0);
    });

    it('should flag hallucination when summary claims numbers not in database', () => {
      const fakeData = [{ overall_avg_percentage: 84.8 }];
      const sql = 'SELECT * FROM assessment_results';
      const summary = 'CHSB bo‘yicha natija 98.5% ni tashkil qilmoqda.'; // Fabricated number!
      const insight = 'O‘rtacha natija 84.8%.';

      const verification = verifyOutputGrounding(summary, insight, fakeData, sql);
      assert.equal(verification.isGrounded, false);
      assert.ok(verification.hallucinationsDetected.length > 0);
      assert.ok(verification.hallucinationsDetected[0].includes('98.5%'));
    });
  });

  describe('End-to-End Guardrail Interception via processChatQuery', () => {
    it('should intercept out-of-domain prompt and return DomainRejection UI component', async () => {
      const response = await processChatQuery('Bugun Toshkentda havo harorati necha daraja?');
      assert.equal(response.openUiComponent, 'DomainRejection');
      assert.ok(response.sqlExecuted.includes('Guardrail: Mavzudan tashqari so‘rov'));
      assert.equal(response.data.length, 0);
      assert.equal(response.grounding.isOutOfDomain, true);
    });

    it('should intercept query for 6-sinf and return MissingDataNotice without guessing', async () => {
      const response = await processChatQuery('6-sinflar kesimida CHSB imtihon baholari qanday?');
      assert.equal(response.openUiComponent, 'MissingDataNotice');
      assert.ok(response.sqlExecuted.includes('Mavjud bo‘lmagan sinf aniqlandi'));
      assert.equal(response.data.length, 0);
      assert.equal(response.grounding.isMissingData, true);
      assert.ok(response.summary.includes('6-sinf'));
    });

    it('should successfully execute and ground legitimate school query', async () => {
      const response = await processChatQuery('Umumiy maktablar va CHSB ko‘rsatkichlarini ko‘rsat');
      assert.equal(response.openUiComponent, 'OverviewDashboard');
      assert.ok(response.data.length > 0);
      assert.equal(response.grounding.isGrounded, true);
      assert.equal(response.grounding.groundingScore, 1.0);
      assert.ok(response.grounding.tablesQueried.includes('schools'));
      assert.ok(response.grounding.tablesQueried.includes('assessment_results'));
    });
  });
});
