import type { Tenant, TenantPublicContext } from '../../entities/tenant/model';
import type { School } from '../../entities/school/model';
import type { ClassGroup } from '../../entities/class-group/model';
import type { StudentRosterRecord } from '../../entities/roster/model';
import type { Assessment } from '../../entities/assessment/model';
import { chsbAssessmentQuestions } from './questions';

export const mockTenants: Tenant[] = [
  {
    id: 'tenant-al-xorazmiy',
    slug: 'al-xorazmiy',
    name: 'Al-Xorazmiy nomidagi ixtisoslashtirilgan IT-maktab',
    status: 'active',
    branding: {
      primaryColor: '#0f4c5c',
    },
    features: ['roster_lookup', 'instant_receipt'],
  },
  {
    id: 'tenant-temurbeklar',
    slug: 'temurbeklar-maktabi',
    name: 'Temurbeklar Maktabi Harbiy-Akademik Litseyi',
    status: 'active',
    branding: {
      primaryColor: '#1e3a8a',
    },
    features: ['roster_lookup', 'instant_receipt'],
  },
];

export const mockSchools: School[] = [
  {
    id: 'school-ax-1',
    tenantId: 'tenant-al-xorazmiy',
    name: 'Al-Xorazmiy IT Bosh Kampusi',
    code: 'AX-01',
    status: 'active',
  },
  {
    id: 'school-tm-1',
    tenantId: 'tenant-temurbeklar',
    name: 'Temurbeklar Maktabi Markaziy Kampus',
    code: 'TM-01',
    status: 'active',
  },
];

export const mockClassGroups: ClassGroup[] = [
  {
    id: 'class-ax-11a',
    tenantId: 'tenant-al-xorazmiy',
    schoolId: 'school-ax-1',
    name: '11-A sinf',
    grade: 11,
    academicYear: '2026-2027',
    studentCount: 25,
  },
  {
    id: 'class-ax-11b',
    tenantId: 'tenant-al-xorazmiy',
    schoolId: 'school-ax-1',
    name: '11-B sinf',
    grade: 11,
    academicYear: '2026-2027',
    studentCount: 23,
  },
  {
    id: 'class-tm-11g1',
    tenantId: 'tenant-temurbeklar',
    schoolId: 'school-tm-1',
    name: '11-Guruh-1',
    grade: 11,
    academicYear: '2026-2027',
    studentCount: 20,
  },
  {
    id: 'class-tm-11g2',
    tenantId: 'tenant-temurbeklar',
    schoolId: 'school-tm-1',
    name: '11-Guruh-2',
    grade: 11,
    academicYear: '2026-2027',
    studentCount: 22,
  },
];

export const mockRosterRecords: StudentRosterRecord[] = [
  // Tenant 1: Al-Xorazmiy
  {
    id: 'rec-ax-101',
    tenantId: 'tenant-al-xorazmiy',
    schoolId: 'school-ax-1',
    classGroupId: 'class-ax-11a',
    rosterCode: 'STU-1101',
    firstName: 'Alisher',
    lastName: 'Zokirov',
    middleName: 'Bahrom o‘g‘li',
    status: 'eligible',
    availableAssessmentIds: ['chsb-inf-11-q1'],
  },
  {
    id: 'rec-ax-102',
    tenantId: 'tenant-al-xorazmiy',
    schoolId: 'school-ax-1',
    classGroupId: 'class-ax-11a',
    rosterCode: 'STU-1102',
    firstName: 'Madina',
    lastName: 'Rustamova',
    middleName: 'Ilhom qizi',
    status: 'eligible',
    availableAssessmentIds: ['chsb-inf-11-q1'],
  },
  {
    id: 'rec-ax-103',
    tenantId: 'tenant-al-xorazmiy',
    schoolId: 'school-ax-1',
    classGroupId: 'class-ax-11b',
    rosterCode: 'STU-1103',
    firstName: 'Jasur',
    lastName: 'Bekmurodov',
    middleName: 'Olim o‘g‘li',
    status: 'inactive', // Inactive scenario
    availableAssessmentIds: ['chsb-inf-11-q1'],
  },
  {
    id: 'rec-ax-999',
    tenantId: 'tenant-al-xorazmiy',
    schoolId: 'school-ax-1',
    classGroupId: 'class-ax-11a',
    rosterCode: 'AMBIGUOUS-CODE',
    firstName: 'Sinov',
    lastName: 'Talaba-1',
    status: 'ambiguous', // Ambiguous scenario
    availableAssessmentIds: ['chsb-inf-11-q1'],
  },

  // Tenant 2: Temurbeklar Maktabi
  {
    id: 'rec-tm-201',
    tenantId: 'tenant-temurbeklar',
    schoolId: 'school-tm-1',
    classGroupId: 'class-tm-11g1',
    rosterCode: 'TM-201',
    firstName: 'Sardor',
    lastName: 'Rahimov',
    middleName: 'G‘ayrat o‘g‘li',
    status: 'eligible',
    availableAssessmentIds: ['chsb-inf-11-q1-tm'],
  },
  {
    id: 'rec-tm-202',
    tenantId: 'tenant-temurbeklar',
    schoolId: 'school-tm-1',
    classGroupId: 'class-tm-11g1',
    rosterCode: 'TM-202',
    firstName: 'Otabek',
    lastName: 'Boboyev',
    middleName: 'Mansur o‘g‘li',
    status: 'eligible',
    availableAssessmentIds: ['chsb-inf-11-q1-tm'],
  },
  {
    id: 'rec-tm-203',
    tenantId: 'tenant-temurbeklar',
    schoolId: 'school-tm-1',
    classGroupId: 'class-tm-11g2',
    rosterCode: 'TM-203',
    firstName: 'Dilshod',
    lastName: 'Karimov',
    status: 'inactive',
    availableAssessmentIds: ['chsb-inf-11-q1-tm'],
  },
];

export const mockAssessments: Assessment[] = [
  {
    id: 'chsb-inf-11-q1',
    tenantId: 'tenant-al-xorazmiy',
    title: 'Informatika va axborot texnologiyalari, 11-sinf. I chorak 1-ChSB',
    subject: 'Informatika va axborot texnologiyalari',
    grade: 11,
    quarter: 1,
    assessmentNumber: 1,
    durationMinutes: 40,
    durationSeconds: 2400,
    questionCount: 15,
    maxScore: 40,
    status: 'available',
    questions: chsbAssessmentQuestions,
  },
  {
    id: 'chsb-inf-11-q1-tm',
    tenantId: 'tenant-temurbeklar',
    title: 'Informatika va axborot texnologiyalari (Harbiy yo‘nalish), 11-sinf. 1-ChSB',
    subject: 'Informatika va axborot texnologiyalari',
    grade: 11,
    quarter: 1,
    assessmentNumber: 1,
    durationMinutes: 40,
    durationSeconds: 2400,
    questionCount: 15,
    maxScore: 40,
    status: 'available',
    questions: chsbAssessmentQuestions,
  },
];

export function toTenantPublicContext(t: Tenant): TenantPublicContext {
  return {
    tenantId: t.id,
    tenantSlug: t.slug,
    displayName: t.name,
    status: t.status === 'active' ? 'active' : 'inactive',
  };
}
