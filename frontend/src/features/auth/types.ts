import { z } from 'zod';

// ==========================================
// 1. FOYDALANUVCHI ROLLARI (USER ROLES / RBAC)
// ==========================================
export const UserRoleSchema = z.enum([
  'SUPER_ADMIN',  // Viloyat / Respublika Boshqarmasi xodimi
  'SCHOOL_ADMIN', // Maktab Direktori / O'RINBOSARI
  'REGIONAL_INSPECTOR', // Hududiy nazoratchi (faqat umumlashtirilgan ko'rsatkichlar)
  'TEACHER',      // Fan o'qituvchisi
  'STUDENT',      // O'quvchi
]);

export type UserRole = z.infer<typeof UserRoleSchema>;

// ==========================================
// 2. KIRISH MALUMOTLARI (LOGIN CREDENTIALS)
// ==========================================
export const LoginCredentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Foydalanuvchi nomi kamida 3 ta belgidan iborat bo'lishi kerak"),
  password: z
    .string()
    .min(4, "Parol kamida 4 ta belgidan iborat bo'lishi kerak"),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginCredentialsInput = z.input<typeof LoginCredentialsSchema>;
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

// ==========================================
// 3. SESSIYA FOYDALANUVCHISI (AUTHENTICATED USER)
// ==========================================
export const AuthUserSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(3),
  fullName: z.string().min(2),
  role: UserRoleSchema,
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  tenantSlug: z.string().optional(), // 'al-xorazmiy', 'temurbeklar-maktabi' va h.k.
  schoolName: z.string().optional(),
  token: z.string().min(1),
  avatarUrl: z.string().optional(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;
