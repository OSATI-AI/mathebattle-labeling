/**
 * Seeded random number generator for deterministic shuffling
 * Uses a simple LCG (Linear Congruential Generator)
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generate next random number in range [0, 1)
   */
  next(): number {
    // LCG parameters (same as used by glibc)
    const a = 1103515245;
    const c = 12345;
    const m = 2 ** 31;

    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }
}

/**
 * Fisher-Yates shuffle with a fixed seed
 * Ensures all labelers see tasks in the same random order
 *
 * @param array - Array to shuffle
 * @param seed - Random seed (default: 42)
 * @returns Shuffled array (modifies in place)
 */
export function seededShuffle<T>(array: T[], seed: number = 42): T[] {
  const rng = new SeededRandom(seed);

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}
