import { z } from 'zod';

// ==========================================
// 1. MAKTAB (SCHOOL / TENANT) MODELLARI
// ==========================================

export const SchoolTypeSchema = z.enum([
  'general',
  'specialized',
  'lyceum',
  'private',
]);
export type SchoolType = z.infer<typeof SchoolTypeSchema>;

export const SchoolStatusSchema = z.enum(['active', 'inactive']);
export type SchoolStatus = z.infer<typeof SchoolStatusSchema>;

export const SchoolInputSchema = z.object({
  name: z.string().min(3, 'Maktab nomi kamida 3 ta belgidan iborat bo\'lishi shart'),
  code: z.string().min(2, 'Maktab kodi kamida 2 ta belgi bo\'lishi shart'),
  slug: z
    .string()
    .min(3, 'Slug kamida 3 ta belgidan iborat bo\'lishi shart')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug faqat kichik lotin harflari, raqamlar va defisdan iborat bo\'lishi kerak (masalan: urganch-1-maktab)'
    ),
  districtId: z.string().min(1, 'Tuman tanlanishi shart'),
  districtName: z.string().min(1, 'Tuman nomi ko\'rsatilishi shart'),
  type: SchoolTypeSchema.default('general'),
  directorName: z.string().min(3, 'Direktor F.I.SH. kiritilishi shart'),
  contactPhone: z.string().min(9, 'Telefon raqami kamida 9 ta raqamdan iborat bo\'lishi kerak'),
  email: z.string().email('Noto\'g\'ri email formati').optional().or(z.literal('')),
  status: SchoolStatusSchema.default('active'),
});

export type SchoolInput = z.infer<typeof SchoolInputSchema>;

export const SchoolRecordSchema = SchoolInputSchema.extend({
  id: z.string().min(1),
  createdAt: z.string(),
  studentCount: z.number().int().nonnegative().default(0),
  teacherCount: z.number().int().nonnegative().default(0),
});

export type SchoolRecord = z.infer<typeof SchoolRecordSchema>;

// ==========================================
// 2. O'QITUVCHI (TEACHER) MODELLARI
// ==========================================

export const TeacherQualificationSchema = z.enum([
  'oliy',
  'birinchi',
  'ikkinchi',
  'mutaxassis',
]);
export type TeacherQualification = z.infer<typeof TeacherQualificationSchema>;

export const TeacherInputSchema = z.object({
  schoolId: z.string().min(1, 'Maktab IDsi bo\'sh bo\'lmasligi shart'),
  tenantSlug: z.string().min(1, 'Tenant slug bo\'sh bo\'lmasligi shart'),
  fullName: z.string().min(3, 'O\'qituvchi F.I.SH. kamida 3 ta belgidan iborat bo\'lishi shart'),
  subject: z.string().min(2, 'Fan nomi kiritilishi shart'),
  qualification: TeacherQualificationSchema.default('mutaxassis'),
  assignedClassIds: z.array(z.string()).default([]),
  phone: z.string().min(9, 'Telefon raqami kamida 9 ta raqam bo\'lishi kerak'),
  email: z.string().email('Noto\'g\'ri email').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type TeacherInput = z.infer<typeof TeacherInputSchema>;

export const TeacherRecordSchema = TeacherInputSchema.extend({
  id: z.string().min(1),
  assignedClassNames: z.array(z.string()).default([]),
  createdAt: z.string(),
});

export type TeacherRecord = z.infer<typeof TeacherRecordSchema>;

// ==========================================
// 3. O'QUVCHI (STUDENT / ROSTER) MODELLARI
// ==========================================

export const StudentGenderSchema = z.enum(['M', 'F']);
export type StudentGender = z.infer<typeof StudentGenderSchema>;

export const StudentStatusSchema = z.enum(['eligible', 'inactive']);
export type StudentStatus = z.infer<typeof StudentStatusSchema>;

export const StudentInputSchema = z.object({
  tenantSlug: z.string().min(1),
  schoolId: z.string().min(1),
  classGroupId: z.string().min(1, 'Sinf tanlanishi shart'),
  className: z.string().min(1, 'Sinf nomi bo\'sh bo\'lmasligi shart'),
  firstName: z.string().min(2, 'Ism kamida 2 ta harfdan iborat bo\'lishi kerak'),
  lastName: z.string().min(2, 'Familiya kamida 2 ta harfdan iborat bo\'lishi kerak'),
  middleName: z.string().optional(),
  gender: StudentGenderSchema,
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tug\'ilgan sana YYYY-MM-DD formatida bo\'lishi kerak (masalan: 2009-05-15)'),
  rosterCode: z.string().optional(),
  emaktabId: z.string().optional(),
  group: z.string().optional().default('1-guruh'),
  status: StudentStatusSchema.default('eligible'),
});

export type StudentInput = z.infer<typeof StudentInputSchema>;

export const StudentRecordSchema = StudentInputSchema.extend({
  id: z.string().min(1),
  rosterCode: z.string().min(1),
  fullName: z.string().min(1),
  createdAt: z.string(),
});

export type StudentRecord = z.infer<typeof StudentRecordSchema>;

// ==========================================
// 4. SINF (CLASS GROUP) MODELLARI
// ==========================================

export const ClassGroupInputSchema = z.object({
  schoolId: z.string().min(1),
  tenantSlug: z.string().min(1),
  name: z.string().min(2, 'Sinf nomi kamida 2 ta belgi bo\'lishi kerak (masalan: 9-A)'),
  gradeLevel: z.number().int().min(1).max(11, 'Sinf darajasi 1 dan 11 gacha bo\'lishi shart'),
  shift: z.union([z.literal(1), z.literal(2)]).default(1),
  academicYear: z.string().default('2026-2027'),
  headTeacherId: z.string().optional(),
  headTeacherName: z.string().optional(),
});

export type ClassGroupInput = z.infer<typeof ClassGroupInputSchema>;

export const ClassGroupRecordSchema = ClassGroupInputSchema.extend({
  id: z.string().min(1),
  studentCount: z.number().int().nonnegative().default(0),
  hasGroups: z.boolean().optional().default(true),
  groupCounts: z.record(z.string(), z.number()).optional(),
  createdAt: z.string(),
});

export type ClassGroupRecord = z.infer<typeof ClassGroupRecordSchema>;

// ==========================================
// 5. FAN (SUBJECT) MODELLARI
// ==========================================

export const SubjectInputSchema = z.object({
  tenantSlug: z.string().default('al-xorazmiy'),
  name: z.string().min(2, "Fan nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  code: z
    .string()
    .min(2, "Fan kodi kamida 2 ta belgidan iborat bo'lishi kerak")
    .max(20, "Fan kodi 20 belgidan oshmasligi kerak")
    .regex(/^[A-Za-z0-9_-]+$/, "Kod faqat harf, raqam va defisdan iborat bo'lishi kerak"),
  gradeLevels: z.string().default('5,6,7,8,9,10,11'),
  description: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export type SubjectInput = z.infer<typeof SubjectInputSchema>;

export const SubjectRecordSchema = SubjectInputSchema.extend({
  id: z.string().min(1),
  tenantId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SubjectRecord = z.infer<typeof SubjectRecordSchema>;

