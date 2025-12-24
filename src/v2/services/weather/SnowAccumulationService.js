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
import { GroundTemperatureService, GROUND_TYPES } from './GroundTemperatureService';
import { advanceDate } from '../../utils/dateUtils';

/**
 * Snow accumulation rates (inches per hour by intensity)
 * Tuned for realistic ground accumulation - a typical Midwest winter
 * might see 30-40" total annual snowfall, with max ground depth ~12-15".
 *
 * Rates reduced from original (0.4/1.0/2.0) to account for:
 * - Wind redistribution
 * - Immediate settling during fall
 * - Temperature-dependent snow density
 */
const SNOW_RATES = {
  light: 0.2,      // Light snow: ~0.2 in/hr (fluffy flurries)
  moderate: 0.5,   // Moderate snow: ~0.5 in/hr (steady snowfall)
  heavy: 1.0       // Heavy snow: ~1.0 in/hr (significant storm)
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
 * Increased from original values to ensure snow doesn't accumulate unrealistically.
 * Real-world: 40°F sunny day can melt 2-4" of snow.
 * At 40°F (8° above freezing), with solar bonus: 8 * 0.06 * 1.5 = 0.72"/hr
 * That's about 5-6" in a sunny day - realistic for spring melt.
 */
const MELT_CONSTANTS = {
  // Snow melt: inches melted per degree-hour above 32°F
  // Increased from 0.03 to 0.06 for faster melt during warm spells
  snowMeltPerDegreeHour: 0.06,

  // Solar radiation multiplier during daylight
  dayTimeMeltMultiplier: 1.5,

  // Rain-on-snow multiplier (warm rain accelerates melting)
  rainOnSnowMultiplier: 2.5,

  // Ice melts slower than snow
  iceMeltPerDegreeHour: 0.02,

  // Sublimation rate (snow loss in dry cold conditions, in/hr)
  sublimationRate: 0.01
};

/**
 * Compaction rates (how much snow settles)
 * Fresh powder (10:1 ratio) compacts to dense pack (4:1 ratio) over days.
 * This means fresh snow loses ~60% of its depth to compaction alone.
 */
const COMPACTION = {
  // Fresh snow compacts about 3% per hour for first 24 hours
  hourlyRate: 0.03,
  // Maximum compaction - old snow is about 35% of fresh depth
  // (e.g., 10" fresh snow becomes ~3.5" packed snow)
  maxCompaction: 0.65
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
    this.groundTempService = new GroundTemperatureService();
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

      // === GROUND TEMPERATURE ===
      // Ground temp determines whether snow sticks and how fast it melts
      const groundTempData = this.groundTempService.getGroundTemperature(region, checkDate, snowDepth);
      const groundTemp = groundTempData.temperature;

      // === ACCUMULATION ===

      // Snow accumulation - now depends on ground temperature
      if (weather.precipitation && weather.precipitationType === 'snow') {
        const rate = SNOW_RATES[weather.precipitationIntensity] || SNOW_RATES.moderate;

        // Snow sticking depends on ground temperature
        // Ground ≤ 33°F: snow sticks fully
        // Ground 33-38°F: partial sticking (some melts on contact)
        // Ground > 38°F: snow melts on contact
        let stickingFactor = 1.0;
        if (groundTemp > 38) {
          stickingFactor = 0; // Snow melts on contact
        } else if (groundTemp > 33) {
          // Linear interpolation: 33°F = 100%, 38°F = 0%
          stickingFactor = 1 - ((groundTemp - 33) / 5);
        }

        const freshSnow = rate * stickingFactor;
        snowDepth += freshSnow;
        snowWaterEquivalent += freshSnow / 10; // 10:1 snow-to-water ratio
        snowAge = 0; // Reset age when fresh snow falls
      } else {
        snowAge++;
      }

      // Ice accumulation (freezing rain) - requires frozen ground
      if (weather.precipitation && weather.precipitationType === 'freezing-rain') {
        // Ice only accumulates if ground is at or below freezing
        if (groundTemp <= 32) {
          const rate = ICE_RATES[weather.precipitationIntensity] || ICE_RATES.moderate;
          iceAccumulation += rate;
        }
      }

      // === MELTING ===
      // Use GROUND temperature for melt calculations, not air temperature
      // This prevents brief warm spells from causing massive snow loss

      // Get ground type melt modifier (sand melts fast, permafrost slow)
      const groundTypeName = groundTempData.groundType;
      const groundTypeData = GROUND_TYPES[groundTypeName] || GROUND_TYPES.soil;
      const meltRateModifier = groundTypeData.meltRateModifier || 1.0;

      // Get dryAir factor from region for enhanced sublimation/solar melt (Denver effect)
      const dryAir = region.climate?.specialFactors?.dryAir ||
                     region.specialFactors?.dryAir || 0;

      if (groundTemp > 32 && (snowDepth > 0 || iceAccumulation > 0)) {
        const degreesAboveFreezing = groundTemp - 32;

        // Base melt rate (using ground temp) * ground type modifier
        let snowMelt = degreesAboveFreezing * MELT_CONSTANTS.snowMeltPerDegreeHour * meltRateModifier;
        let iceMelt = degreesAboveFreezing * MELT_CONSTANTS.iceMeltPerDegreeHour * meltRateModifier;

        // Daytime solar bonus
        if (isDaytime) {
          snowMelt *= MELT_CONSTANTS.dayTimeMeltMultiplier;
          iceMelt *= MELT_CONSTANTS.dayTimeMeltMultiplier;

          // Dry air enhances solar melt (Denver effect: intense sun + dry air = fast melt)
          // Up to 40% faster melt in very dry climates during daytime
          if (dryAir > 0) {
            snowMelt *= (1 + dryAir * 0.4);
          }
        }

        // Rain-on-snow event - effect modulated by ground temperature
        // Frozen ground: rain freezes, minimal melt acceleration
        // Thawing ground: moderate acceleration
        // Warm ground: full rain-on-snow effect
        if (weather.precipitation && weather.precipitationType === 'rain' && snowDepth > 0) {
          let rainOnSnowFactor = 1.0;
          if (groundTemp <= 32) {
            rainOnSnowFactor = 0.2; // Frozen ground - rain mostly freezes
          } else if (groundTemp <= 36) {
            // Transition zone: 32°F = 20%, 36°F = 100%
            rainOnSnowFactor = 0.2 + 0.8 * ((groundTemp - 32) / 4);
          }

          snowMelt *= (1 + (MELT_CONSTANTS.rainOnSnowMultiplier - 1) * rainOnSnowFactor);

          // Heavy rain direct melt also modulated
          if (weather.precipitationIntensity === 'heavy') {
            snowMelt += 0.5 * rainOnSnowFactor;
          }
        }

        // Apply melting
        snowDepth = Math.max(0, snowDepth - snowMelt);
        snowWaterEquivalent = Math.max(0, snowWaterEquivalent - (snowMelt / 10));
        iceAccumulation = Math.max(0, iceAccumulation - iceMelt);
      }

      // Sublimation in very cold, dry conditions (slow snow loss)
      // Uses air temperature since sublimation is an atmospheric process
      // Dry air climates have enhanced sublimation
      const airTemp = weather.temperature;
      const sublimationThreshold = dryAir > 0.5 ? 25 : 20; // Dry climates sublimate at higher temps
      const sublimationRate = MELT_CONSTANTS.sublimationRate * (1 + dryAir * 0.5); // Up to 50% faster
      if (airTemp < sublimationThreshold && weather.humidity < 40 && snowDepth > 0) {
        snowDepth = Math.max(0, snowDepth - sublimationRate);
        snowWaterEquivalent = Math.max(0, snowWaterEquivalent - (sublimationRate / 10));
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

    // Get current ground temperature for display
    const currentGroundTemp = this.groundTempService.getGroundTemperature(region, date, snowDepth);

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

      // Ground temperature (new in Sprint 22)
      groundTemperature: currentGroundTemp.temperature,
      groundTempCondition: currentGroundTemp.condition,
      canAccumulateSnow: currentGroundTemp.canAccumulateSnow,

      // Gameplay-relevant info
      isSnowCovered: snowDepth >= 0.5,
      isIcy: iceAccumulation >= 0.1,
      travelImpact: this.getTravelImpact(snowDepth, iceAccumulation, groundCondition),
      gameplayEffects: this.getGameplayEffects(snowDepth, iceAccumulation, groundCondition),

      _debug: {
        lookbackHours: lookbackHours,
        hoursAboveFreezing,
        hoursBelowFreezing,
        recentPrecipHours,
        groundTempDebug: currentGroundTemp._debug
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
    this.groundTempService.clearCache();
  }
}

// Singleton instance
const snowAccumulationService = new SnowAccumulationService();
export default snowAccumulationService;
