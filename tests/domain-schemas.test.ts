import { describe, it, expect } from 'vitest';
import { TenantSchema } from '../src/entities/tenant/model';
import { StudentRosterRecordSchema } from '../src/entities/roster/model';
import { AssessmentSchema, QuestionBlockSchema } from '../src/entities/assessment/model';
import { AssessmentAttemptSchema } from '../src/entities/attempt/model';
import { AssessmentResultSchema } from '../src/entities/result/model';

describe('Domain Schemas & Zod Validators', () => {
  it('validates a valid Tenant entity', () => {
    const validTenant = {
      id: 'tenant-1',
      slug: 'test-slug',
      name: 'Test School',
      status: 'active',
      features: ['roster_lookup'],
    };
    const parsed = TenantSchema.safeParse(validTenant);
    expect(parsed.success).toBe(true);
  });

  it('rejects an invalid Tenant entity with missing slug', () => {
    const invalid = { id: 'tenant-1', name: 'Test' };
    const parsed = TenantSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates QuestionBlock discriminated union (paragraph, image, table, code)', () => {
    const pBlock = { type: 'paragraph', text: 'Savol matni' };
    const imgBlock = { type: 'image', assetId: '/assets/img.jpg', alt: 'Rasm' };
    const tableBlock = { type: 'table', columns: ['A', 'B'], rows: [['1', '2']] };
    const codeBlock = { type: 'code', code: 'console.log()' };

    expect(QuestionBlockSchema.safeParse(pBlock).success).toBe(true);
    expect(QuestionBlockSchema.safeParse(imgBlock).success).toBe(true);
    expect(QuestionBlockSchema.safeParse(tableBlock).success).toBe(true);
    expect(QuestionBlockSchema.safeParse(codeBlock).success).toBe(true);

    // Invalid block type
    expect(QuestionBlockSchema.safeParse({ type: 'unknown_type' }).success).toBe(false);
  });

  it('validates StudentRosterRecord and AssessmentAttempt schemas', () => {
    const validRoster = {
      id: 'rec-1',
      tenantId: 'tenant-1',
      schoolId: 'school-1',
      classGroupId: 'class-1',
      rosterCode: 'STU-100',
      firstName: 'Ali',
      lastName: 'Valiyev',
      status: 'eligible',
      availableAssessmentIds: ['a-1'],
    };
    expect(StudentRosterRecordSchema.safeParse(validRoster).success).toBe(true);

    const validAssessment = {
      id: 'a-1',
      tenantId: 'tenant-1',
      title: 'CHSB-11',
      subject: 'Informatika',
      grade: 11,
      quarter: 1,
      assessmentNumber: 1,
      durationMinutes: 40,
      durationSeconds: 2400,
      questionCount: 1,
      maxScore: 40,
      status: 'available',
      questions: [
        {
          id: 'q-1',
          order: 1,
          cognitiveLevel: '(B)',
          points: 2.5,
          blocks: [{ type: 'paragraph', text: 'Savol' }],
          options: [{ id: 'A', text: 'Variant' }],
        },
      ],
    };
    expect(AssessmentSchema.safeParse(validAssessment).success).toBe(true);

    const validAttempt = {
      id: 'att-1',
      tenantId: 'tenant-1',
      assessmentId: 'a-1',
      rosterRecordId: 'rec-1',
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      deadlineAt: new Date().toISOString(),
      answers: { 'q-1': 'B' },
      remainingSeconds: 2400,
    };
    expect(AssessmentAttemptSchema.safeParse(validAttempt).success).toBe(true);
  });

  it('validates AssessmentResult schema', () => {
    const validResult = {
      attemptId: 'att-1',
      tenantId: 'tenant-1',
      assessmentId: 'a-1',
      rosterRecordId: 'rec-1',
      studentName: 'Ali Valiyev',
      className: '11-A',
      totalQuestions: 15,
      answeredQuestions: 15,
      score: 40,
      maxScore: 40,
      percentage: 100,
      status: 'verified',
      verifiedByTeacher: true,
      submittedAt: new Date().toISOString(),
    };
    expect(AssessmentResultSchema.safeParse(validResult).success).toBe(true);
  });
});
