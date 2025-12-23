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

    // === PRECIPITATION STREAK PREVENTION ===
    // Even wet climates have occasional dry periods. Use a secondary roll
    // based on the day-of-pattern to create natural breaks.
    // This prevents unrealistically long wet streaks (30+ days).
    const patternDay = this.getDayOfPattern(region, date);
    const breakRoll = rng.next();

    // Every 3-4 days within a pattern, there's a chance for a "break day"
    // This is more likely mid-pattern and less likely at pattern transitions
    if (patternDay === 2 || patternDay === 3) {
      // Mid-pattern break chance (15% chance to skip precipitation)
      if (breakRoll < 0.15) {
        chance *= 0.3; // Significantly reduce chance, creating dry breaks
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
   * Clear pattern cache
   */
  clearCache() {
    this.patternCache.clear();
  }
}
