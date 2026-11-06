/**
 * Generates an emergency offline submission verification hash.
 * Used when a school loses internet connectivity before an assessment is synced.
 * The 16-character alphanumeric code allows teachers to verify offline submissions
 * against paper attendance records.
 */

export function generateOfflineVerificationHash(
  studentId: string,
  assessmentId: string,
  answers: Record<string, string>,
  timestamp: string
): string {
  const sortedAnswers = Object.keys(answers)
    .sort()
    .map((k) => `${k}:${answers[k]}`)
    .join(';');

  const payload = `${studentId}#${assessmentId}#${sortedAnswers}#${timestamp}`;

  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  const fullHex = hex1 + hex2;

  return `CHSB-${fullHex.slice(0, 4)}-${fullHex.slice(4, 8)}-${fullHex.slice(8, 12)}`;
}
