import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateSafeSql } from '../src/lib/sql-validator.js';

describe('SQL Safety Validator', () => {
  it('should allow valid SELECT query', () => {
    const query = 'SELECT * FROM schools WHERE student_count > 100';
    const result = validateSafeSql(query);
    assert.equal(result.isValid, true);
    assert.equal(result.cleanedSql, query);
  });

  it('should allow valid CTE (WITH clause)', () => {
    const query = 'WITH ranked_students AS (SELECT * FROM students) SELECT * FROM ranked_students';
    const result = validateSafeSql(query);
    assert.equal(result.isValid, true);
  });

  it('should strip markdown code blocks safely', () => {
    const raw = '```sql\nSELECT id, name FROM class_groups\n```';
    const result = validateSafeSql(raw);
    assert.equal(result.isValid, true);
    assert.equal(result.cleanedSql, 'SELECT id, name FROM class_groups');
  });

  it('should reject destructive DROP query', () => {
    const query = 'DROP TABLE students';
    const result = validateSafeSql(query);
    assert.equal(result.isValid, false);
    assert.ok(result.error);
  });

  it('should reject mutating INSERT query', () => {
    const query = 'INSERT INTO users (username) VALUES ("hacker")';
    const result = validateSafeSql(query);
    assert.equal(result.isValid, false);
    assert.ok(result.error);
  });

  it('should reject multi-statement injection attempt', () => {
    const query = 'SELECT * FROM students; DELETE FROM students';
    const result = validateSafeSql(query);
    assert.equal(result.isValid, false);
    assert.ok(result.error?.includes('Xavfsizlik qoidasi'));
  });

  it('should reject PRAGMA statements', () => {
    const query = 'PRAGMA table_info(students)';
    const result = validateSafeSql(query);
    assert.equal(result.isValid, false);
  });
});
