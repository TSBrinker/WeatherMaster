/**
 * Seed Generator
 * Creates deterministic seeds from region ID and date for reproducible randomness
 */

/**
 * Simple hash function to convert string to number
 * @param {string} str - String to hash
 * @returns {number} Hash value
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate a deterministic seed from region ID and date
 * Same region + same date = same seed = same weather
 *
 * @param {string} regionId - UUID of the region
 * @param {Object} date - Game date {year, month, day, hour}
 * @param {string} [context=''] - Optional context string for different random streams
 * @returns {number} Deterministic seed value
 */
export function generateSeed(regionId, date, context = '') {
  // Create a string that uniquely identifies this moment
  const dateString = `${date.year}-${date.month}-${date.day}`;
  const seedString = `${regionId}:${dateString}:${context}`;

  return hashString(seedString);
}

/**
 * Generate a seed that changes every N days (for multi-day weather patterns)
 * @param {string} regionId - UUID of the region
 * @param {Object} date - Game date
 * @param {number} patternLengthDays - How many days each pattern lasts (default: 4)
 * @param {string} [context=''] - Optional context string
 * @returns {number} Seed that's stable for N days
 */
export function generatePatternSeed(regionId, date, patternLengthDays = 4, context = '') {
  // Calculate total days since year 1
  const totalDays = (date.year - 1) * 360 + (date.month - 1) * 30 + (date.day - 1);

  // Calculate which pattern period we're in
  const patternPeriod = Math.floor(totalDays / patternLengthDays);

  const seedString = `${regionId}:pattern${patternPeriod}:${context}`;
  return hashString(seedString);
}

/**
 * Seeded Random Number Generator (Mulberry32)
 * Produces deterministic pseudo-random numbers from a seed
 */
export class SeededRandom {
  constructor(seed) {
    this.seed = seed >>> 0; // Ensure unsigned 32-bit integer
  }

  /**
   * Get next random number [0, 1)
   * @returns {number} Random value between 0 and 1
   */
  next() {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  /**
   * Get random number in range [min, max)
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (exclusive)
   * @returns {number} Random value in range
   */
  range(min, max) {
    return min + this.next() * (max - min);
  }

  /**
   * Get random integer in range [min, max]
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (inclusive)
   * @returns {number} Random integer in range
   */
  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Choose random element from array
   * @param {Array} array - Array to choose from
   * @returns {*} Random element
   */
  choice(array) {
    return array[this.int(0, array.length - 1)];
  }
}
