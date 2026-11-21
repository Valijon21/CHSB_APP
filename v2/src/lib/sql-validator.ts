/**
 * SQL Safety Validator
 * Ensures Large Language Models cannot execute destructive or mutating SQL statements.
 * Strict Allow-list: ONLY SELECT statements are allowed.
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  cleanedSql?: string;
}

const FORBIDDEN_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'ALTER',
  'CREATE',
  'TRUNCATE',
  'REPLACE',
  'ATTACH',
  'DETACH',
  'PRAGMA',
  'VACUUM',
  'REINDEX',
  'GRANT',
  'REVOKE',
  'EXEC',
  'EXECUTE',
  '--',
  ';', // Prevent multi-statement injection
];

export function validateSafeSql(rawSql: string): ValidationResult {
  if (!rawSql || typeof rawSql !== 'string') {
    return { isValid: false, error: 'SQL so‘rovi bo‘sh bo‘lishi mumkin emas.' };
  }

  // Remove markdown code blocks if the model generated ```sql ... ```
  let sql = rawSql.trim();
  if (sql.startsWith('```')) {
    sql = sql.replace(/^```(?:sql)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  // Check for multi-statements
  const statementCount = sql.split(';').filter((s) => s.trim().length > 0).length;
  if (statementCount > 1) {
    return {
      isValid: false,
      error: 'Xavfsizlik qoidasi: Bir vaqtda bir nechta SQL so‘rovlarini bajarish taqiqlangan.',
    };
  }

  // Strip trailing semicolon
  if (sql.endsWith(';')) {
    sql = sql.slice(0, -1).trim();
  }

  // Must begin with SELECT or WITH (for CTEs)
  const normalized = sql.toUpperCase();
  if (!normalized.startsWith('SELECT') && !normalized.startsWith('WITH')) {
    return {
      isValid: false,
      error: 'Xavfsizlik qoidasi: Faqatgina SELECT yoki WITH bilan boshlanuvchi o‘qish so‘rovlariga ruxsat berilgan.',
    };
  }

  // Check forbidden keywords as whole words
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (keyword === ';' || keyword === '--') {
      if (sql.includes(keyword)) {
        return {
          isValid: false,
          error: `Xavfsizlik qoidasi: So‘rovda taqiqlangan belgi aniqlandi: '${keyword}'`,
        };
      }
      continue;
    }

    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(sql)) {
      return {
        isValid: false,
        error: `Xavfsizlik qoidasi: '${keyword}' buyrug‘ini bajarish qat’iyan taqiqlangan. Tizim faqat ma’lumotlarni o‘qish rejimida ishlaydi.`,
      };
    }
  }

  return { isValid: true, cleanedSql: sql };
}
