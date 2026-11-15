import { describe, it, expect } from 'vitest';
import {
  UserRoleSchema,
  LoginCredentialsSchema,
  AuthUserSchema,
} from '../src/features/auth/types';

describe('TASK-AUTH.1: Auth Schemas & Zod Contracts', () => {
  describe('UserRoleSchema', () => {
    it('validates supported roles correctly', () => {
      expect(UserRoleSchema.parse('SUPER_ADMIN')).toBe('SUPER_ADMIN');
      expect(UserRoleSchema.parse('SCHOOL_ADMIN')).toBe('SCHOOL_ADMIN');
      expect(UserRoleSchema.parse('TEACHER')).toBe('TEACHER');
      expect(UserRoleSchema.parse('STUDENT')).toBe('STUDENT');
    });

    it('rejects unsupported roles', () => {
      expect(() => UserRoleSchema.parse('GUEST')).toThrow();
      expect(() => UserRoleSchema.parse('ADMIN')).toThrow();
    });
  });

  describe('LoginCredentialsSchema', () => {
    it('accepts valid credentials with defaults', () => {
      const parsed = LoginCredentialsSchema.parse({
        username: 'dilmurod_ustoz',
        password: 'secret_password_123',
      });
      expect(parsed.username).toBe('dilmurod_ustoz');
      expect(parsed.password).toBe('secret_password_123');
      expect(parsed.rememberMe).toBe(false);
    });

    it('trims whitespace on username', () => {
      const parsed = LoginCredentialsSchema.parse({
        username: '  teacher@xorazm.uz  ',
        password: 'password123',
        rememberMe: true,
      });
      expect(parsed.username).toBe('teacher@xorazm.uz');
      expect(parsed.rememberMe).toBe(true);
    });

    it('rejects username shorter than 3 characters', () => {
      expect(() =>
        LoginCredentialsSchema.parse({
          username: 'ab',
          password: 'password123',
        })
      ).toThrow("Foydalanuvchi nomi kamida 3 ta belgidan iborat bo'lishi kerak");
    });

    it('rejects password shorter than 4 characters', () => {
      expect(() =>
        LoginCredentialsSchema.parse({
          username: 'teacher',
          password: '123',
        })
      ).toThrow("Parol kamida 4 ta belgidan iborat bo'lishi kerak");
    });
  });

  describe('AuthUserSchema', () => {
    it('accepts valid authenticated teacher user', () => {
      const teacher = {
        id: 'usr-tch-01',
        username: 'dilmurod_ustoz',
        fullName: 'Dilmurod Matyoqubov',
        role: 'TEACHER',
        email: 'dilmurod@al-xorazmiy.uz',
        phone: '+998901234567',
        tenantSlug: 'al-xorazmiy',
        schoolName: 'Al-Xorazmiy IT-maktab',
        token: 'mock-jwt-token-xyz',
      };
      const parsed = AuthUserSchema.parse(teacher);
      expect(parsed.id).toBe('usr-tch-01');
      expect(parsed.role).toBe('TEACHER');
      expect(parsed.tenantSlug).toBe('al-xorazmiy');
    });

    it('accepts valid super admin user without tenantSlug', () => {
      const superAdmin = {
        id: 'usr-reg-01',
        username: 'regional_head',
        fullName: 'Xorazm Viloyati Boshqarmasi Rahbari',
        role: 'SUPER_ADMIN',
        token: 'super-admin-jwt-token',
      };
      const parsed = AuthUserSchema.parse(superAdmin);
      expect(parsed.role).toBe('SUPER_ADMIN');
      expect(parsed.tenantSlug).toBeUndefined();
    });

    it('rejects missing token or invalid role', () => {
      expect(() =>
        AuthUserSchema.parse({
          id: '1',
          username: 'user1',
          fullName: 'Name',
          role: 'INVALID_ROLE',
          token: 'token',
        })
      ).toThrow();
    });
  });
});

