import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

// Find database path safely across dev/prod and root
function resolveDatabasePath(): string {
  const possiblePaths = [
    path.resolve(process.cwd(), 'prisma/dev.db'),
    path.resolve(process.cwd(), '../prisma/dev.db'),
    path.resolve(process.cwd(), '../../prisma/dev.db'),
    path.resolve(process.cwd(), 'dev.db'),
    path.resolve(process.cwd(), '../dev.db'),
  ];

  for (const candidate of possiblePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback
  return path.resolve(process.cwd(), 'prisma/dev.db');
}

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = resolveDatabasePath();
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database file not found at: ${dbPath}. Please run 'npm run db:push' first.`);
    }
    // Open in read-only mode by default for AI safety
    dbInstance = new DatabaseSync(dbPath, { readOnly: true });
  }
  return dbInstance;
}

/**
 * Execute a safe parameterized read-only query
 */
export function queryDatabase<T = Record<string, unknown>>(sql: string): T[] {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  return stmt.all() as T[];
}
