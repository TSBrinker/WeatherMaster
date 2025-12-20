/**
 * Weather Pattern Service
 * Manages multi-day weather patterns for continuity
 * Patterns last 3-5 days and influence conditions, precipitation, and wind
 */

import { generatePatternSeed, SeededRandom } from '../../utils/seedGenerator';

/**
 * Weather pattern types
 * Each pattern influences weather conditions differently
 */
export const WEATHER_PATTERNS = {
  HIGH_PRESSURE: {
    name: 'High Pressure',
    duration: [3, 5], // Days
    characteristics: {
      clearSkies: 0.8,      // 80% chance of clear/partly cloudy
      precipitation: 0.1,    // 10% chance of precipitation
      windSpeed: 0.6,        // Moderate winds (60% of base)
      tempModifier: 2        // Slightly warmer (+2°F)
    }
  },
  LOW_PRESSURE: {
    name: 'Low Pressure',
    duration: [2, 4],
    characteristics: {
      clearSkies: 0.2,       // 20% chance of clear
      precipitation: 0.7,     // 70% chance of precipitation
      windSpeed: 1.3,        // Stronger winds (130% of base)
      tempModifier: -2       // Slightly cooler (-2°F)
    }
  },
  WARM_FRONT: {
    name: 'Warm Front',
    duration: [2, 3],
    characteristics: {
      clearSkies: 0.4,
      precipitation: 0.5,     // Steady, light precipitation
      windSpeed: 0.8,
      tempModifier: 4        // Warmer (+4°F)
    }
  },
  COLD_FRONT: {
    name: 'Cold Front',
    duration: [1, 3],
    characteristics: {
      clearSkies: 0.3,
      precipitation: 0.6,     // Brief, heavy precipitation
      windSpeed: 1.5,        // Strong winds
      tempModifier: -5       // Cooler (-5°F)
    }
  },
  STABLE: {
    name: 'Stable',
    duration: [4, 7],
    characteristics: {
      clearSkies: 0.6,
      precipitation: 0.3,
      windSpeed: 0.7,
      tempModifier: 0
    }
  }
};

/**
 * Pattern transition sequence
 * Realistic progression of weather patterns
 */
const PATTERN_TRANSITIONS = {
  HIGH_PRESSURE: ['STABLE', 'WARM_FRONT', 'HIGH_PRESSURE'],
  LOW_PRESSURE: ['COLD_FRONT', 'STABLE', 'HIGH_PRESSURE'],
  WARM_FRONT: ['LOW_PRESSURE', 'STABLE', 'HIGH_PRESSURE'],
  COLD_FRONT: ['HIGH_PRESSURE', 'STABLE', 'COLD_FRONT'],
  STABLE: ['HIGH_PRESSURE', 'LOW_PRESSURE', 'WARM_FRONT', 'STABLE']
};

/**
 * Weather Pattern Service
 */
export class WeatherPatternService {
  constructor() {
    this.patternCache = new Map();
  }

  /**
   * Get the current weather pattern for a region and date
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @returns {Object} Current pattern with characteristics
   */
  getCurrentPattern(region, date) {
    const cacheKey = `${region.id}:${date.year}:${date.month}:${date.day}`;

    if (this.patternCache.has(cacheKey)) {
      return this.patternCache.get(cacheKey);
    }

    // Use a 4-day pattern cycle (patterns change every 3-5 days on average)
    const patternSeed = generatePatternSeed(region.id, date, 4, 'weather-pattern');
    const rng = new SeededRandom(patternSeed);

    // Select pattern type
    const patternKeys = Object.keys(WEATHER_PATTERNS);
    const patternKey = rng.choice(patternKeys);
    const pattern = {
      type: patternKey,
      ...WEATHER_PATTERNS[patternKey]
    };

    // Calculate day within pattern
    const dayOfPattern = this.getDayOfPattern(region, date);
    pattern.dayOfPattern = dayOfPattern;

    // Determine total pattern duration for this occurrence
    const [minDuration, maxDuration] = pattern.duration;
    pattern.totalDays = rng.int(minDuration, maxDuration);

    this.patternCache.set(cacheKey, pattern);
    return pattern;
  }

  /**
   * Get which day of the current pattern we're on
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @returns {number} Day number (1-based)
   */
  getDayOfPattern(region, date) {
    const totalDays = (date.year - 1) * 360 + (date.month - 1) * 30 + (date.day - 1);
    const patternCycle = Math.floor(totalDays / 4);
    const dayInCycle = totalDays % 4;
    return dayInCycle + 1;
  }

  /**
   * Get the next pattern that will follow the current one
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @returns {Object} Next pattern
   */
  getNextPattern(region, date) {
    const currentPattern = this.getCurrentPattern(region, date);
    const possibleNext = PATTERN_TRANSITIONS[currentPattern.type];

    // Get seed for next pattern period
    const nextDate = {
      ...date,
      day: date.day + currentPattern.totalDays
    };

    const nextSeed = generatePatternSeed(region.id, nextDate, 4, 'weather-pattern');
    const rng = new SeededRandom(nextSeed);

    const nextType = rng.choice(possibleNext);
    return {
      type: nextType,
      ...WEATHER_PATTERNS[nextType]
    };
  }

  /**
   * Check if precipitation should occur given current pattern
   * @param {Object} pattern - Current weather pattern
   * @param {Object} date - Game date (for hourly variation)
   * @param {number} seed - Random seed
   * @returns {boolean} True if precipitation should occur
   */
  shouldPrecipitate(pattern, date, seed) {
    const rng = new SeededRandom(seed);
    const roll = rng.next();

    // Base chance from pattern
    let chance = pattern.characteristics.precipitation;

    // Afternoon/evening more likely for precipitation
    if (date.hour >= 14 && date.hour <= 20) {
      chance *= 1.3;
    }

    return roll < chance;
  }

  /**
   * Determine sky condition based on pattern
   * @param {Object} pattern - Current weather pattern
   * @param {number} seed - Random seed
   * @returns {string} Sky condition
   */
  getSkyCondition(pattern, seed) {
    const rng = new SeededRandom(seed);
    const roll = rng.next();

    const clearChance = pattern.characteristics.clearSkies;

    if (roll < clearChance * 0.5) {
      return 'clear';
    } else if (roll < clearChance) {
      return 'partly-cloudy';
    } else if (roll < clearChance + 0.3) {
      return 'cloudy';
    } else {
      return 'overcast';
    }
  }

  /**
   * Get wind speed modifier from pattern
   * @param {Object} pattern - Current weather pattern
   * @returns {number} Multiplier for base wind speed
   */
  getWindModifier(pattern) {
    return pattern.characteristics.windSpeed;
  }

  /**
   * Get temperature modifier from pattern
   * @param {Object} pattern - Current weather pattern
   * @returns {number} Temperature adjustment in °F
   */
  getTemperatureModifier(pattern) {
    return pattern.characteristics.tempModifier;
  }

  /**
   * Clear pattern cache
   */
  clearCache() {
    this.patternCache.clear();
  }
}
