/**
 * Seeded deterministic pseudo-random number generator and Fisher-Yates shuffle.
 * Guarantees that the same student + assessment seed produces the exact same shuffled order
 * across browser refreshes, while two different students get distinct permutations.
 */

/**
 * 32-bit string hash (MurmurHash3-inspired) to produce an initial numeric seed.
 */
export function hashStringToSeed(str: string): number {
  let hash = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(hash ^ str.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return (hash >>> 0) || 1;
}

/**
 * Mulberry32 PRNG - fast, high quality 32-bit pseudo-random generator.
 */
export function createSeededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically shuffles an array using Fisher-Yates algorithm with seeded PRNG.
 * Does not mutate the original array.
 */
export function seededShuffle<T>(array: readonly T[], seedStr: string): T[] {
  if (array.length <= 1) return [...array];

  const seed = hashStringToSeed(seedStr);
  const random = createSeededRandom(seed);
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = temp;
  }

  return copy;
}
