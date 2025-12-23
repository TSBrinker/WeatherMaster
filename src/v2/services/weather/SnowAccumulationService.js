/**
 * Snow & Ice Accumulation Service
 * Tracks snow depth and ice accumulation on the ground over time.
 *
 * Uses deterministic lookback calculations - no persistence required.
 * Looks back up to 14 days to calculate current accumulation.
 *
 * Snow Physics:
 * - Fresh snow accumulates based on precipitation intensity
 * - Snow melts when temperature > 32°F (degree-day method)
 * - Daytime accelerates melting (solar radiation)
 * - Rain-on-snow events cause rapid melting
 * - Snow compacts over time (affects visual depth but not water equivalent)
 *
 * Ice Physics:
 * - Freezing rain creates ice accumulation
 * - Ice melts slower than snow (higher density)
 * - Significant ice accumulation causes hazards
 */

import { WeatherGenerator } from './WeatherGenerator';
import { advanceDate } from '../../utils/dateUtils';

/**
 * Snow accumulation rates (inches per hour by intensity)
 */
const SNOW_RATES = {
  light: 0.4,      // Light snow: ~0.4 in/hr
  moderate: 1.0,   // Moderate snow: ~1.0 in/hr
  heavy: 2.0       // Heavy snow: ~2.0 in/hr
};

/**
 * Ice accumulation rates (inches per hour by intensity)
 */
const ICE_RATES = {
  light: 0.02,     // Light freezing rain: ~0.02 in/hr
  moderate: 0.05,  // Moderate: ~0.05 in/hr
  heavy: 0.1       // Heavy: ~0.1 in/hr
};

/**
 * Melt rate constants
 */
const MELT_CONSTANTS = {
  // Snow melt: inches melted per degree-hour above 32°F
  snowMeltPerDegreeHour: 0.03,

  // Solar radiation multiplier during daylight
  dayTimeMeltMultiplier: 1.5,

  // Rain-on-snow multiplier (warm rain accelerates melting)
  rainOnSnowMultiplier: 2.5,

  // Ice melts slower than snow
  iceMeltPerDegreeHour: 0.015,

  // Sublimation rate (snow loss in dry cold conditions, in/hr)
  sublimationRate: 0.01
};

/**
 * Compaction rates (how much snow settles)
 */
const COMPACTION = {
  // Fresh snow compacts about 5% per hour for first 24 hours
  hourlyRate: 0.02,
  // Maximum compaction (old snow is about 40% of fresh depth)
  maxCompaction: 0.4
};

/**
 * Ground condition thresholds
 */
const GROUND_CONDITIONS = {
  SNOW_COVERED: { minSnow: 0.5, name: 'Snow Covered', description: 'Ground covered in snow' },
  ICY: { minIce: 0.1, name: 'Icy', description: 'Ice on surfaces, very slippery' },
  FROZEN: { name: 'Frozen', description: 'Ground is frozen solid' },
  THAWING: { name: 'Thawing', description: 'Ground is thawing, becoming soft' },
  MUDDY: { name: 'Muddy', description: 'Ground is saturated and muddy' },
  DRY: { name: 'Dry', description: 'Ground is dry' }
};

/**
 * Snow Accumulation Service
 */
export class SnowAccumulationService {
  constructor() {
    this.weatherGenerator = new WeatherGenerator();
    this.accumulationCache = new Map();
  }

  /**
   * Get current snow and ice accumulation for a region
   * @param {Object} region - Region with climate parameters
   * @param {Object} date - Game date {year, month, day, hour}
   * @returns {Object} Accumulation data
   */
  getAccumulation(region, date) {
    const cacheKey = `${region.id}:${date.year}:${date.month}:${date.day}:${date.hour}`;

    if (this.accumulationCache.has(cacheKey)) {
      return this.accumulationCache.get(cacheKey);
    }

    // Calculate accumulation by simulating the last 14 days hour by hour
    const accumulation = this.calculateAccumulation(region, date);

    this.accumulationCache.set(cacheKey, accumulation);
    return accumulation;
  }

  /**
   * Calculate current accumulation by looking back through weather history
   * @param {Object} region - Region data
   * @param {Object} date - Current date
   * @returns {Object} Accumulation totals
   */
  calculateAccumulation(region, date) {
    const lookbackHours = 14 * 24; // 14 days of hourly data

    let snowDepth = 0;        // Current snow depth in inches (visual/actual)
    let snowWaterEquivalent = 0; // Water content in inches
    let iceAccumulation = 0;  // Ice thickness in inches
    let snowAge = 0;          // Hours since last fresh snow
    let hoursAboveFreezing = 0; // For ground condition calculation
    let hoursBelowFreezing = 0;
    let recentPrecipHours = 0; // Precipitation in last 48 hours

    // Track hourly data for the last 48 hours (for ground conditions)
    const recentHistory = [];

    // Process each hour from oldest to newest
    for (let hoursAgo = lookbackHours; hoursAgo >= 0; hoursAgo--) {
      const checkDate = advanceDate(date, -hoursAgo);
      const weather = this.weatherGenerator.generateWeather(region, checkDate);

      // Determine if it's daytime (rough estimate without celestial data)
      const hour = checkDate.hour;
      const isDaytime = hour >= 7 && hour <= 19;

      // Track temperature for ground conditions (last 48 hours)
      if (hoursAgo <= 48) {
        recentHistory.push({
          temp: weather.temperature,
          precip: weather.precipitation,
          precipType: weather.precipitationType
        });

        if (weather.temperature > 32) {
          hoursAboveFreezing++;
        } else {
          hoursBelowFreezing++;
        }

        if (weather.precipitation) {
          recentPrecipHours++;
        }
      }

      // === ACCUMULATION ===

      // Snow accumulation
      if (weather.precipitation && weather.precipitationType === 'snow') {
        const rate = SNOW_RATES[weather.precipitationIntensity] || SNOW_RATES.moderate;
        const freshSnow = rate; // Per hour
        snowDepth += freshSnow;
        snowWaterEquivalent += freshSnow / 10; // 10:1 snow-to-water ratio
        snowAge = 0; // Reset age when fresh snow falls
      } else {
        snowAge++;
      }

      // Ice accumulation (freezing rain)
      if (weather.precipitation && weather.precipitationType === 'freezing-rain') {
        const rate = ICE_RATES[weather.precipitationIntensity] || ICE_RATES.moderate;
        iceAccumulation += rate;
      }

      // === MELTING ===

      const temp = weather.temperature;

      if (temp > 32 && (snowDepth > 0 || iceAccumulation > 0)) {
        const degreesAboveFreezing = temp - 32;

        // Base melt rate
        let snowMelt = degreesAboveFreezing * MELT_CONSTANTS.snowMeltPerDegreeHour;
        let iceMelt = degreesAboveFreezing * MELT_CONSTANTS.iceMeltPerDegreeHour;

        // Daytime solar bonus
        if (isDaytime) {
          snowMelt *= MELT_CONSTANTS.dayTimeMeltMultiplier;
          iceMelt *= MELT_CONSTANTS.dayTimeMeltMultiplier;
        }

        // Rain-on-snow event (warm rain melts snow rapidly)
        if (weather.precipitation && weather.precipitationType === 'rain') {
          snowMelt *= MELT_CONSTANTS.rainOnSnowMultiplier;
          // Rain also adds to water content, accelerating base melt
          if (weather.precipitationIntensity === 'heavy') {
            snowMelt += 0.5; // Heavy rain directly melts snow
          }
        }

        // Apply melting
        snowDepth = Math.max(0, snowDepth - snowMelt);
        snowWaterEquivalent = Math.max(0, snowWaterEquivalent - (snowMelt / 10));
        iceAccumulation = Math.max(0, iceAccumulation - iceMelt);
      }

      // Sublimation in very cold, dry conditions (slow snow loss)
      if (temp < 20 && weather.humidity < 40 && snowDepth > 0) {
        snowDepth = Math.max(0, snowDepth - MELT_CONSTANTS.sublimationRate);
        snowWaterEquivalent = Math.max(0, snowWaterEquivalent - (MELT_CONSTANTS.sublimationRate / 10));
      }

      // === COMPACTION ===

      // Snow compacts over time
      if (snowDepth > 0 && snowAge > 0) {
        // Calculate compaction factor based on age
        const compactionFactor = Math.min(
          COMPACTION.maxCompaction,
          COMPACTION.hourlyRate * Math.min(snowAge, 72) // Cap at 72 hours of compaction
        );

        // Apply compaction to depth (not water equivalent)
        // Only apply compaction to "old" snow, not fresh
        const effectiveCompaction = 1 - (compactionFactor * 0.5); // Gradual
        snowDepth = Math.max(snowWaterEquivalent * 5, snowDepth * effectiveCompaction);
      }
    }

    // Calculate ground condition
    const groundCondition = this.determineGroundCondition(
      snowDepth,
      iceAccumulation,
      hoursAboveFreezing,
      hoursBelowFreezing,
      recentPrecipHours,
      recentHistory
    );

    // Calculate visual fill percentage for UI (0-100)
    // 24 inches of snow = 100% fill (adjustable)
    const maxSnowForFullFill = 24;
    const snowFillPercent = Math.min(100, (snowDepth / maxSnowForFullFill) * 100);

    return {
      snowDepth: Math.round(snowDepth * 10) / 10, // Round to 0.1 inch
      snowWaterEquivalent: Math.round(snowWaterEquivalent * 100) / 100,
      iceAccumulation: Math.round(iceAccumulation * 100) / 100,
      snowAge: Math.min(snowAge, lookbackHours), // Cap at lookback period
      groundCondition,
      snowFillPercent: Math.round(snowFillPercent),

      // Gameplay-relevant info
      isSnowCovered: snowDepth >= 0.5,
      isIcy: iceAccumulation >= 0.1,
      travelImpact: this.getTravelImpact(snowDepth, iceAccumulation, groundCondition),
      gameplayEffects: this.getGameplayEffects(snowDepth, iceAccumulation, groundCondition),

      _debug: {
        lookbackHours: lookbackHours,
        hoursAboveFreezing,
        hoursBelowFreezing,
        recentPrecipHours
      }
    };
  }

  /**
   * Determine ground condition based on accumulation and temperature history
   */
  determineGroundCondition(snowDepth, iceAccumulation, hoursAbove, hoursBelow, recentPrecip, history) {
    // Snow covered takes precedence
    if (snowDepth >= GROUND_CONDITIONS.SNOW_COVERED.minSnow) {
      return GROUND_CONDITIONS.SNOW_COVERED;
    }

    // Icy conditions
    if (iceAccumulation >= GROUND_CONDITIONS.ICY.minIce) {
      return GROUND_CONDITIONS.ICY;
    }

    // Determine frozen/thawing/muddy/dry based on recent temperature pattern
    const freezingRatio = hoursBelow / (hoursAbove + hoursBelow || 1);

    // Get most recent temperature
    const recentTemp = history.length > 0 ? history[history.length - 1].temp : 40;

    // Frozen: mostly below freezing recently
    if (freezingRatio > 0.7 && recentTemp <= 32) {
      return GROUND_CONDITIONS.FROZEN;
    }

    // Thawing: was frozen, now warming up
    if (freezingRatio > 0.3 && freezingRatio <= 0.7 && recentTemp > 32) {
      return GROUND_CONDITIONS.THAWING;
    }

    // Muddy: recent precipitation and thawing conditions
    if (recentPrecip > 12 || (freezingRatio > 0.2 && freezingRatio <= 0.5 && recentPrecip > 6)) {
      return GROUND_CONDITIONS.MUDDY;
    }

    // Default: dry
    return GROUND_CONDITIONS.DRY;
  }

  /**
   * Get travel impact description
   */
  getTravelImpact(snowDepth, iceAccumulation, groundCondition) {
    const impacts = [];

    if (snowDepth >= 12) {
      impacts.push('Deep snow - travel extremely difficult without snowshoes');
    } else if (snowDepth >= 6) {
      impacts.push('Significant snow - movement speed halved on foot');
    } else if (snowDepth >= 2) {
      impacts.push('Snow accumulation - slightly slowed travel');
    }

    if (iceAccumulation >= 0.25) {
      impacts.push('Severe ice - extremely treacherous, high fall risk');
    } else if (iceAccumulation >= 0.1) {
      impacts.push('Icy surfaces - DEX saves to avoid slipping');
    }

    if (groundCondition.name === 'Muddy') {
      impacts.push('Muddy conditions - difficult terrain for wheeled vehicles');
    }

    if (groundCondition.name === 'Thawing') {
      impacts.push('Thawing ground - unstable footing, potential for hidden ice');
    }

    return impacts.length > 0 ? impacts : ['Normal travel conditions'];
  }

  /**
   * Get gameplay effects for D&D
   */
  getGameplayEffects(snowDepth, iceAccumulation, groundCondition) {
    const effects = [];

    // Snow depth effects
    if (snowDepth >= 12) {
      effects.push('Difficult terrain (half speed)');
      effects.push('Tracks clearly visible');
      effects.push('Small creatures may be hindered');
    } else if (snowDepth >= 6) {
      effects.push('Difficult terrain for Small creatures');
      effects.push('Easy to track through snow');
    } else if (snowDepth >= 1) {
      effects.push('Tracking through snow has advantage');
    }

    // Ice effects
    if (iceAccumulation >= 0.25) {
      effects.push('DC 15 DEX save or fall prone when moving');
      effects.push('Creatures knocked prone slide 10 feet');
    } else if (iceAccumulation >= 0.1) {
      effects.push('DC 10 DEX save or fall prone when dashing');
    }

    // Ground condition effects
    if (groundCondition.name === 'Frozen') {
      effects.push('Ground cannot be easily dug');
    }
    if (groundCondition.name === 'Muddy') {
      effects.push('Wheeled vehicles move at half speed');
      effects.push('Tracks easily visible');
    }

    return effects;
  }

  /**
   * Get a simple text description of current conditions
   */
  getConditionSummary(accumulation) {
    const parts = [];

    if (accumulation.snowDepth >= 1) {
      parts.push(`${accumulation.snowDepth}" of snow on ground`);
    }

    if (accumulation.iceAccumulation >= 0.1) {
      parts.push(`${accumulation.iceAccumulation}" ice accumulation`);
    }

    if (parts.length === 0) {
      parts.push(accumulation.groundCondition.description);
    }

    return parts.join(', ');
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.accumulationCache.clear();
    this.weatherGenerator.clearCache();
  }
}

// Singleton instance
const snowAccumulationService = new SnowAccumulationService();
export default snowAccumulationService;
