import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDatabase, queryDatabase } from '../src/lib/db.js';

describe('Database Connection Bridge (CHSB Real SQLite DB)', () => {
  it('should successfully connect to database and retrieve tables', () => {
    const db = getDatabase();
    assert.ok(db);

    const tables = queryDatabase<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );

    const tableNames = tables.map((t) => t.name);
    assert.ok(tableNames.includes('schools'));
    assert.ok(tableNames.includes('students'));
    assert.ok(tableNames.includes('assessment_results'));
    assert.ok(tableNames.includes('class_groups'));
  });

  it('should retrieve seeded schools correctly', () => {
    const schools = queryDatabase<{ id: string; name: string }>(
      'SELECT id, name FROM schools ORDER BY created_at ASC'
    );
    assert.ok(schools.length > 0);
    assert.ok(schools[0].name);
  });

  it('should retrieve seeded assessment results with grades', () => {
    const results = queryDatabase<{ score: number; percentage: number; grade: string }>(
      'SELECT score, percentage, grade FROM assessment_results LIMIT 5'
    );
    assert.ok(results.length > 0);
    assert.ok(results[0].grade);
    assert.ok(results[0].percentage >= 0);
  });
});
