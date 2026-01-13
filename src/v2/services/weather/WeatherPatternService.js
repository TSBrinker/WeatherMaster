/**
 * Weather Pattern Service
 * Manages multi-day weather patterns for continuity
 * Patterns last 3-5 days and influence conditions, precipitation, and wind
 */

import { generatePatternSeed, generateSeed, SeededRandom } from '../../utils/seedGenerator';

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
 * Pattern transition weights
 * Maps each pattern to likely successors with relative weights
 * Higher weight = more likely to be selected
 *
 * Meteorological basis:
 * - High pressure systems tend to persist or give way to fronts
 * - Low pressure systems are followed by clearing (cold front, then high pressure)
 * - Fronts are transitional and lead to pressure systems
 * - Stable conditions can shift to any pattern
 */
const PATTERN_TRANSITIONS = {
  HIGH_PRESSURE: { HIGH_PRESSURE: 3, STABLE: 3, WARM_FRONT: 2, LOW_PRESSURE: 1, COLD_FRONT: 1 },
  LOW_PRESSURE: { COLD_FRONT: 4, HIGH_PRESSURE: 3, STABLE: 2, LOW_PRESSURE: 1, WARM_FRONT: 0 },
  WARM_FRONT: { LOW_PRESSURE: 4, STABLE: 2, HIGH_PRESSURE: 2, COLD_FRONT: 1, WARM_FRONT: 1 },
  COLD_FRONT: { HIGH_PRESSURE: 5, STABLE: 3, COLD_FRONT: 1, LOW_PRESSURE: 1, WARM_FRONT: 0 },
  STABLE: { HIGH_PRESSURE: 3, STABLE: 2, LOW_PRESSURE: 2, WARM_FRONT: 2, COLD_FRONT: 1 }
};

/**
 * Pattern fatigue penalties
 * Reduces probability of same pattern repeating consecutively
 */
const PATTERN_FATIGUE = {
  REPEAT_ONCE: 0.5,    // 50% weight if pattern occurred last cycle
  REPEAT_TWICE: 0.25,  // 25% weight if pattern occurred 2 cycles in a row
  REPEAT_THREE: 0.1    // 10% weight if pattern occurred 3+ cycles in a row
};

/**
 * Precipitation streak limits by climate type
 * After hitting the soft cap, precipitation chance decreases exponentially.
 * After hitting the hard cap, precipitation is forced to stop.
 * Values are in hours.
 */
const PRECIP_STREAK_LIMITS = {
  // Tropical wet climates - can have long rainy periods but not 40+ days
  tropical_wet: { softCap: 5 * 24, hardCap: 10 * 24 },      // 5-10 days
  // Monsoon climates - extended wet seasons but with breaks
  monsoon: { softCap: 4 * 24, hardCap: 8 * 24 },            // 4-8 days
  // Maritime/oceanic - frequent rain but fronts pass through
  maritime: { softCap: 3 * 24, hardCap: 6 * 24 },           // 3-6 days
  // Open ocean - weather systems move through, fronts are transient
  ocean: { softCap: 3 * 24, hardCap: 6 * 24 },              // 3-6 days
  // Polar/arctic - persistent low pressure but still has breaks
  polar: { softCap: 3 * 24, hardCap: 7 * 24 },              // 3-7 days
  // Temperate - weather systems move through
  temperate: { softCap: 2 * 24, hardCap: 5 * 24 },          // 2-5 days
  // Continental - more variable, drier
  continental: { softCap: 2 * 24, hardCap: 4 * 24 },        // 2-4 days
  // Default fallback
  default: { softCap: 3 * 24, hardCap: 6 * 24 }             // 3-6 days
};

/**
 * Weather Pattern Service
 */
export class WeatherPatternService {
  constructor() {
    this.patternCache = new Map();
    this.precipStreakCache = new Map();  // Cache for precipitation streak counts
  }

  /**
   * Get the climate type for streak limiting based on region parameters
   * @param {Object} climate - Region climate data
   * @returns {string} Climate type key for PRECIP_STREAK_LIMITS
   */
  getClimateTypeForStreakLimit(climate) {
    const specialFactors = climate.specialFactors || {};
    const maritimeInfluence = climate.maritimeInfluence || 0;
    const latitude = climate.latitude || 45;
    const isOcean = specialFactors.isOcean === true;

    // Polar regions (high latitude) - check first
    if (latitude >= 65) {
      if (isOcean) {
        return 'polar';  // Polar seas, pack ice waters
      }
      return 'polar';  // Tundra, polar highlands
    }

    // Ocean biomes (not polar)
    if (isOcean) {
      // Tropical oceans with very high humidity
      if (latitude <= 25 && specialFactors.highRainfall) {
        return 'tropical_wet';
      }
      return 'ocean';  // General ocean
    }

    // Land-based climate types
    if (specialFactors.highRainfall && specialFactors.hasMonsoonSeason) {
      return 'tropical_wet';
    }
    if (specialFactors.hasMonsoonSeason) {
      return 'monsoon';
    }
    if (specialFactors.highRainfall) {
      return 'tropical_wet';
    }
    if (maritimeInfluence > 0.6) {
      return 'maritime';
    }
    if (specialFactors.continental || maritimeInfluence < 0.3) {
      return 'continental';
    }
    return 'temperate';
  }

  /**
   * Count consecutive precipitation hours looking backward from current time.
   * Uses deterministic lookback to maintain consistency with seeded generation.
   * @param {Object} region - Region data
   * @param {Object} date - Current game date
   * @param {Object} pattern - Current weather pattern
   * @param {number} maxLookback - Maximum hours to look back (default: 10 days)
   * @returns {number} Number of consecutive precipitation hours
   */
  countPrecipStreak(region, date, pattern, maxLookback = 10 * 24) {
    // Create cache key for this specific hour
    const cacheKey = `${region.id}:${date.year}:${date.month}:${date.day}:${date.hour}`;

    if (this.precipStreakCache.has(cacheKey)) {
      return this.precipStreakCache.get(cacheKey);
    }

    let streakCount = 0;
    const climate = region.climate || region.parameters || {};

    // Look back hour by hour
    for (let hoursBack = 1; hoursBack <= maxLookback; hoursBack++) {
      const pastDate = this.subtractHours(date, hoursBack);

      // Check if precipitation occurred in that hour
      // We need to compute this WITHOUT calling shouldPrecipitate (to avoid recursion)
      // Instead, we use a simplified check based on the base probability
      const hadPrecip = this.checkPastPrecipitation(region, pastDate, climate);

      if (hadPrecip) {
        streakCount++;
      } else {
        // Streak broken
        break;
      }
    }

    // Cache the result (limit cache size)
    if (this.precipStreakCache.size > 10000) {
      // Clear oldest entries
      const keysToDelete = Array.from(this.precipStreakCache.keys()).slice(0, 5000);
      keysToDelete.forEach(k => this.precipStreakCache.delete(k));
    }
    this.precipStreakCache.set(cacheKey, streakCount);

    return streakCount;
  }

  /**
   * Check if precipitation occurred in a past hour (simplified check for streak counting)
   * This avoids recursion by using a direct probability check without streak fatigue.
   * Uses the same seed as actual precipitation generation for consistency.
   * @param {Object} region - Region data
   * @param {Object} date - Past date to check
   * @param {Object} climate - Climate parameters
   * @returns {boolean} Whether precipitation likely occurred
   */
  checkPastPrecipitation(region, date, climate) {
    // Use exact same seed as actual precipitation generation (WeatherGenerator.generatePrecipitation)
    // Note: The original code uses 'precipitation' without hour, meaning all hours of a day
    // get the same base random roll. We must match this for consistency.
    const seed = generateSeed(region.id, date, 'precipitation');
    const rng = new SeededRandom(seed);
    const roll = rng.next();

    // Get the pattern for that date
    const pastPattern = this.getCurrentPattern(region, date);

    // Calculate base chance (simplified version without streak fatigue)
    let chance = pastPattern.characteristics.precipitation;

    const specialFactors = climate.specialFactors || {};
    const humidity = climate.humidityProfile || {};
    const season = this.getSeason(date.month);

    // Apply key modifiers (simplified subset)
    if (specialFactors.dryAir) {
      chance *= (1 - specialFactors.dryAir * 0.8);
    }
    if (specialFactors.permanentIce && specialFactors.permanentIce > 0.7) {
      chance *= 0.15;
    }
    if (specialFactors.coldOceanCurrent) {
      chance *= (1 - specialFactors.coldOceanCurrent * 0.85);
    }
    if (specialFactors.rainShadowEffect) {
      chance *= (1 - specialFactors.rainShadowEffect * 0.7);
    }
    if (specialFactors.highRainfall) {
      chance *= 1.6;
    }
    if (climate.maritimeInfluence && climate.maritimeInfluence > 0.6 && !specialFactors.coldOceanCurrent) {
      chance *= 1.2;
    }
    if (specialFactors.hasMonsoonSeason) {
      if (season === 'summer') {
        chance *= 2.5;
      } else if (season === 'winter') {
        chance *= 0.3;
      }
    }
    if (specialFactors.hasDrySeason && season === 'winter') {
      chance *= 0.4;
    }

    // Clamp
    chance = Math.max(0, Math.min(1, chance));

    return roll < chance;
  }

  /**
   * Subtract hours from a date
   * @param {Object} date - Game date
   * @param {number} hours - Hours to subtract
   * @returns {Object} New date
   */
  subtractHours(date, hours) {
    let { year, month, day, hour } = date;

    hour -= hours;

    while (hour < 0) {
      hour += 24;
      day--;

      while (day < 1) {
        month--;
        if (month < 1) {
          month = 12;
          year--;
        }
        day += 30; // 30 days per month in this system
      }
    }

    return { year, month, day, hour };
  }

  /**
   * Get the current weather pattern for a region and date
   * Uses transition-based selection with pattern fatigue to prevent
   * unrealistic streaks of the same weather type.
   *
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @returns {Object} Current pattern with characteristics
   */
  getCurrentPattern(region, date) {
    const cacheKey = `${region.id}:${date.year}:${date.month}:${date.day}`;

    if (this.patternCache.has(cacheKey)) {
      return this.patternCache.get(cacheKey);
    }

    // Use a 4-day pattern cycle
    const patternSeed = generatePatternSeed(region.id, date, 4, 'weather-pattern');
    const rng = new SeededRandom(patternSeed);

    // Get pattern history for transition-based selection
    const patternHistory = this.getPatternHistory(region, date, 3);

    // Select pattern using weighted transitions and fatigue
    const patternKey = this.selectPatternWithTransitions(rng, patternHistory);

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
   * Get the pattern types from previous N cycles (for fatigue calculation)
   * @param {Object} region - Region data
   * @param {Object} date - Current game date
   * @param {number} lookback - Number of previous cycles to check
   * @returns {string[]} Array of pattern type keys, most recent first
   */
  getPatternHistory(region, date, lookback = 3) {
    const history = [];
    const totalDays = (date.year - 1) * 360 + (date.month - 1) * 30 + (date.day - 1);
    const currentCycle = Math.floor(totalDays / 4);

    for (let i = 1; i <= lookback; i++) {
      const previousCycle = currentCycle - i;
      if (previousCycle < 0) break;

      // Calculate a date in the previous cycle
      const previousDay = previousCycle * 4 + 1; // Day 1 of that cycle
      const year = Math.floor(previousDay / 360) + 1;
      const month = Math.floor((previousDay % 360) / 30) + 1;
      const day = (previousDay % 30) + 1;

      // Generate the pattern for that cycle directly (avoiding recursion)
      const prevSeed = generatePatternSeed(region.id, { year, month, day }, 4, 'weather-pattern');
      const prevRng = new SeededRandom(prevSeed);

      // For historical patterns, we need to select without recursion
      // Use the previous pattern's history for weighted selection
      const olderHistory = history.slice(); // Patterns already found
      const prevPatternKey = this.selectPatternWithTransitions(prevRng, olderHistory);
      history.push(prevPatternKey);
    }

    return history;
  }

  /**
   * Select a pattern type using transition weights and fatigue penalties
   * @param {SeededRandom} rng - Random number generator
   * @param {string[]} history - Recent pattern history (most recent first)
   * @returns {string} Selected pattern type key
   */
  selectPatternWithTransitions(rng, history) {
    const patternKeys = Object.keys(WEATHER_PATTERNS);

    // If no history, use base weights favoring stable/high pressure
    // (weather systems don't start from chaos)
    if (history.length === 0) {
      const baseWeights = {
        HIGH_PRESSURE: 3,
        STABLE: 3,
        LOW_PRESSURE: 2,
        WARM_FRONT: 1,
        COLD_FRONT: 1
      };
      return this.weightedChoice(rng, patternKeys, baseWeights);
    }

    // Get transition weights from previous pattern
    const previousPattern = history[0];
    const transitionWeights = { ...PATTERN_TRANSITIONS[previousPattern] };

    // Apply fatigue penalties for repeated patterns
    for (const key of patternKeys) {
      let consecutiveCount = 0;
      for (const histPattern of history) {
        if (histPattern === key) {
          consecutiveCount++;
        } else {
          break; // Only count consecutive occurrences
        }
      }

      // Apply fatigue based on how many times this pattern repeated
      if (consecutiveCount >= 3) {
        transitionWeights[key] *= PATTERN_FATIGUE.REPEAT_THREE;
      } else if (consecutiveCount === 2) {
        transitionWeights[key] *= PATTERN_FATIGUE.REPEAT_TWICE;
      } else if (consecutiveCount === 1) {
        transitionWeights[key] *= PATTERN_FATIGUE.REPEAT_ONCE;
      }
    }

    return this.weightedChoice(rng, patternKeys, transitionWeights);
  }

  /**
   * Make a weighted random choice from options
   * @param {SeededRandom} rng - Random number generator
   * @param {string[]} options - Array of options to choose from
   * @param {Object} weights - Map of option -> weight
   * @returns {string} Selected option
   */
  weightedChoice(rng, options, weights) {
    // Calculate total weight
    let totalWeight = 0;
    for (const option of options) {
      totalWeight += weights[option] || 0;
    }

    // If all weights are 0, fall back to uniform random
    if (totalWeight === 0) {
      return rng.choice(options);
    }

    // Make weighted selection
    let roll = rng.next() * totalWeight;
    for (const option of options) {
      roll -= weights[option] || 0;
      if (roll <= 0) {
        return option;
      }
    }

    // Fallback (shouldn't happen)
    return options[options.length - 1];
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
   * Uses the same transition-based selection as getCurrentPattern
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @returns {Object} Next pattern
   */
  getNextPattern(region, date) {
    // Calculate the start of the next pattern cycle
    const totalDays = (date.year - 1) * 360 + (date.month - 1) * 30 + (date.day - 1);
    const currentCycle = Math.floor(totalDays / 4);
    const nextCycleStart = (currentCycle + 1) * 4;

    // Convert to date
    const year = Math.floor(nextCycleStart / 360) + 1;
    const month = Math.floor((nextCycleStart % 360) / 30) + 1;
    const day = (nextCycleStart % 30) + 1;
    const nextDate = { year, month, day, hour: 12 };

    // Use getCurrentPattern for the next cycle (it will use proper transitions)
    return this.getCurrentPattern(region, nextDate);
  }

  /**
   * Check if precipitation should occur given current pattern
   * @param {Object} pattern - Current weather pattern
   * @param {Object} region - Region with climate data
   * @param {Object} date - Game date (for hourly and seasonal variation)
   * @param {number} seed - Random seed
   * @returns {boolean} True if precipitation should occur
   */
  shouldPrecipitate(pattern, region, date, seed) {
    const rng = new SeededRandom(seed);
    const roll = rng.next();

    // Base chance from pattern
    let chance = pattern.characteristics.precipitation;

    // Get climate parameters
    const climate = region.climate || region.parameters || {};
    const specialFactors = climate.specialFactors || {};
    const humidity = climate.humidityProfile || {};

    // Determine current season (1-12 months)
    const season = this.getSeason(date.month);

    // === ARIDITY MODIFIERS (Deserts and Polar Deserts) ===
    // Polar deserts and dry climates get much less precipitation
    if (specialFactors.dryAir) {
      chance *= (1 - specialFactors.dryAir * 0.8); // Up to 80% reduction
    }

    // Ice sheets and permanent ice are extremely dry
    if (specialFactors.permanentIce && specialFactors.permanentIce > 0.7) {
      chance *= 0.15; // 85% reduction - ice sheets are deserts
    }

    // Cold ocean currents create coastal deserts (Atacama, Namib, etc.)
    // These are some of the driest places on Earth despite being on the coast
    if (specialFactors.coldOceanCurrent) {
      chance *= (1 - specialFactors.coldOceanCurrent * 0.85); // Up to 85% reduction
    }

    // Rain shadow effect - mountains block moisture
    if (specialFactors.rainShadowEffect) {
      chance *= (1 - specialFactors.rainShadowEffect * 0.7); // Up to 70% reduction
    }

    // === HUMIDITY-BASED MODIFIERS ===
    // Low humidity regions get less precipitation
    const seasonalHumidity = humidity[season];
    if (seasonalHumidity) {
      const humidityMean = seasonalHumidity.mean;
      if (humidityMean < 40) {
        chance *= 0.5; // Dry climates: 50% reduction
      } else if (humidityMean < 50) {
        chance *= 0.7; // Semi-arid: 30% reduction
      } else if (humidityMean > 75) {
        chance *= 1.4; // Very humid: 40% increase
      } else if (humidityMean > 65) {
        chance *= 1.2; // Humid: 20% increase
      }
    }

    // === WET CLIMATE MODIFIERS ===
    // Rainforests, wetlands, and high-rainfall zones
    if (specialFactors.highRainfall) {
      chance *= 1.6; // 60% increase
    }

    // Maritime/coastal influence increases precipitation
    // BUT NOT if there's a cold ocean current (coastal deserts are exceptions)
    if (climate.maritimeInfluence && climate.maritimeInfluence > 0.6) {
      if (!specialFactors.coldOceanCurrent) {
        chance *= 1.2; // Coastal areas: 20% increase
      }
      // Cold current coasts already handled above - no boost here
    }

    // === SEASONAL VARIATIONS ===
    // Monsoon season (summer = wet, winter = dry)
    if (specialFactors.hasMonsoonSeason) {
      if (season === 'summer') {
        chance *= 2.5; // Monsoon season: massive increase
      } else if (season === 'winter') {
        chance *= 0.3; // Dry season: significant decrease
      }
    }

    // Mediterranean climate (winter wet, summer dry)
    if (climate.latitude && climate.latitude >= 30 && climate.latitude <= 45) {
      const maritimeFactor = climate.maritimeInfluence || 0;
      // Check if this is a Mediterranean-style climate (moderate maritime influence)
      if (maritimeFactor > 0.4 && maritimeFactor < 0.8) {
        if (season === 'summer') {
          chance *= 0.4; // Dry summers
        } else if (season === 'winter') {
          chance *= 1.5; // Wet winters
        }
      }
    }

    // Dry season modifier (tropical savannas, etc.)
    if (specialFactors.hasDrySeason && season === 'winter') {
      chance *= 0.4; // Dry season: 60% reduction
    }

    // === TIME OF DAY MODIFIERS ===
    // Afternoon/evening more likely for precipitation (convective storms)
    if (date.hour >= 14 && date.hour <= 20) {
      chance *= 1.2; // Reduced from 1.3 to balance with biome modifiers
    }

    // Early morning precipitation less likely (except in monsoons/maritime climates)
    if (date.hour >= 2 && date.hour <= 6) {
      if (!specialFactors.hasMonsoonSeason && climate.maritimeInfluence < 0.5) {
        chance *= 0.8;
      }
    }

    // === PRECIPITATION STREAK FATIGUE SYSTEM ===
    // Use deterministic day-based breaks that don't require lookback.
    // This ensures every climate gets periodic dry breaks regardless of probability.

    // Get climate-appropriate streak limits
    const climateType = this.getClimateTypeForStreakLimit(climate);
    const limits = PRECIP_STREAK_LIMITS[climateType] || PRECIP_STREAK_LIMITS.default;

    // Calculate day of year (1-360)
    const dayOfYear = (date.month - 1) * 30 + date.day;

    // Hard cap enforcement: Force dry days at regular intervals
    // The hard cap determines the maximum consecutive wet days before a forced break
    const hardCapDays = Math.floor(limits.hardCap / 24);
    const softCapDays = Math.floor(limits.softCap / 24);

    // Create a deterministic "break day" pattern based on region and climate
    // Use a seed based on region to ensure consistency but variation between regions
    const breakPatternSeed = generateSeed(region.id, { year: date.year, month: 1, day: 1 }, 'precip-breaks');
    const breakRng = new SeededRandom(breakPatternSeed);

    // Generate break days for this region (at least every hardCapDays days)
    // We check if today is within a "break window"
    const breakInterval = hardCapDays;
    const cycleDay = dayOfYear % breakInterval;

    // Force a break day at the end of each cycle (last 1-2 days)
    // The exact break day varies by region using the seed
    const breakDayOffset = Math.floor(breakRng.next() * 2); // 0 or 1 days before end of cycle
    const isHardBreakDay = cycleDay >= (breakInterval - 1 - breakDayOffset);

    if (isHardBreakDay) {
      // On hard break days, dramatically reduce precipitation chance
      // But use a roll so it's not 100% deterministic
      const hardBreakRoll = rng.next();
      if (hardBreakRoll < 0.85) { // 85% chance of actual break
        return false; // Forced dry hour
      }
    }

    // Soft cap: Apply fatigue as we approach the break interval
    // This creates a gradual reduction in precipitation chance
    if (cycleDay >= softCapDays) {
      const daysIntoFatigue = cycleDay - softCapDays;
      const daysUntilBreak = breakInterval - softCapDays;
      const fatigueProgress = daysIntoFatigue / daysUntilBreak;
      // Exponential decay: starts at 1.0, drops to ~0.15 near break
      const fatigueMultiplier = Math.pow(0.15, fatigueProgress);
      chance *= fatigueMultiplier;
    }

    // === DAILY BREAK CHANCE ===
    // Even before hitting soft cap, there's a small chance for breaks
    // This creates more natural weather patterns with occasional dry hours
    const patternDay = this.getDayOfPattern(region, date);
    const breakRoll = rng.next();

    // Mid-pattern break chance
    if (patternDay === 2 || patternDay === 3) {
      if (breakRoll < 0.20) { // 20% chance
        chance *= 0.25; // Strong reduction for break periods
      }
    }

    // High pressure patterns should have even more reliable dry periods
    if (pattern.type === 'HIGH_PRESSURE' && patternDay >= 2) {
      chance *= 0.7; // Additional 30% reduction on non-first days
    }

    // Clamp chance to valid range [0, 1]
    chance = Math.max(0, Math.min(1, chance));

    return roll < chance;
  }

  /**
   * Get season from month
   * @param {number} month - Month (1-12)
   * @returns {string} Season name
   */
  getSeason(month) {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
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
   * Get temperature modifier from pattern with smooth transitions
   * @param {Object} pattern - Current weather pattern
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @returns {number} Temperature adjustment in °F
   */
  getTemperatureModifier(pattern, region, date) {
    const currentMod = pattern.characteristics.tempModifier;
    const transitionHours = 12;

    // Calculate absolute time since year 1
    const currentDay = (date.year - 1) * 360 + (date.month - 1) * 30 + (date.day - 1);
    const absoluteHour = currentDay * 24 + date.hour;

    // Patterns change every 4 days (96 hours)
    const patternCycleHours = 96;
    const hourInCycle = absoluteHour % patternCycleHours;

    // Fade in from previous pattern (first 12 hours of cycle)
    if (hourInCycle < transitionHours) {
      const previousPattern = this.getPreviousPattern(region, date);
      const previousMod = previousPattern.characteristics.tempModifier;
      const blendFactor = hourInCycle / transitionHours;
      return previousMod + (currentMod - previousMod) * blendFactor;
    }

    // Fade out to next pattern (last 12 hours of cycle)
    if (hourInCycle >= patternCycleHours - transitionHours) {
      const nextPattern = this.getNextPattern(region, date);
      const nextMod = nextPattern.characteristics.tempModifier;
      const hoursUntilEnd = patternCycleHours - hourInCycle;
      const blendFactor = hoursUntilEnd / transitionHours;
      return currentMod + (nextMod - currentMod) * (1 - blendFactor);
    }

    return currentMod;
  }

  /**
   * Get the day number when the current pattern started
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @returns {number} Day number (absolute from year 1)
   */
  getPatternStartDay(region, date) {
    const currentDay = (date.year - 1) * 360 + (date.month - 1) * 30 + (date.day - 1);
    const patternCycle = Math.floor(currentDay / 4);
    const dayInCycle = currentDay % 4;
    return currentDay - dayInCycle;
  }

  /**
   * Get the previous pattern that preceded the current one
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @returns {Object} Previous pattern
   */
  getPreviousPattern(region, date) {
    // Calculate the start of the current pattern, then go back one day
    const patternStartDay = this.getPatternStartDay(region, date);
    const previousDay = patternStartDay - 1;

    // Convert back to date format
    const year = Math.floor(previousDay / 360) + 1;
    const month = Math.floor((previousDay % 360) / 30) + 1;
    const day = (previousDay % 30) + 1;

    const previousDate = { year, month, day, hour: 12 };
    return this.getCurrentPattern(region, previousDate);
  }

  /**
   * Clear pattern cache and precipitation streak cache
   */
  clearCache() {
    this.patternCache.clear();
    this.precipStreakCache.clear();
  }
}
