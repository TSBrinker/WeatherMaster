/**
 * Ground Temperature Service
 * Calculates ground temperature as a lagged, weighted average of air temperature.
 *
 * Ground temperature acts as a "low-pass filter" on air temperature, preventing
 * rapid oscillations that cause unrealistic precipitation type flip-flopping.
 *
 * Physics:
 * - Ground has thermal inertia based on ground type (rock, soil, sand, etc.)
 * - Higher inertia = slower response to air temperature changes
 * - Snow cover insulates the ground, stabilizing temperature near 32°F
 * - Permafrost creates a temperature floor
 *
 * Uses exponentially-weighted moving average (EWMA):
 *   groundTemp = Σ(airTemp[i] * weight[i]) / Σ(weight[i])
 *   where weight[i] = thermalInertia^hoursAgo
 */

import { WeatherGenerator } from './WeatherGenerator';
import { advanceDate } from '../../utils/dateUtils';

/**
 * Ground type thermal and melt properties
 * - thermalInertia: How much the ground resists temperature change (0-1)
 *   Higher values = more lag, slower response to air temp changes
 * - effectiveLagHours: Approximate hours of temperature lag
 * - meltRateModifier: Multiplier for snow melt rate (1.0 = baseline)
 *   < 1.0 = slower melt (frozen ground, wet substrates)
 *   > 1.0 = faster melt (absorbs solar heat, dry conditions)
 */
const GROUND_TYPES = {
  permafrost: {
    thermalInertia: 0.98,
    effectiveLagHours: 72,
    minTemp: -40,  // Permafrost can get very cold
    meltRateModifier: 0.5,  // Frozen substrate resists melting
    description: 'Permanently frozen ground'
  },
  rock: {
    thermalInertia: 0.95,
    effectiveLagHours: 48,
    minTemp: null,
    meltRateModifier: 1.3,  // Dark rock absorbs solar heat
    description: 'Bedrock and rocky terrain'
  },
  clay: {
    thermalInertia: 0.90,
    effectiveLagHours: 36,
    minTemp: null,
    meltRateModifier: 0.85,  // Retains moisture, stays cooler
    description: 'Clay-rich soil, river valleys'
  },
  soil: {
    thermalInertia: 0.85,
    effectiveLagHours: 24,
    minTemp: null,
    meltRateModifier: 1.0,  // Baseline melt rate
    description: 'Standard soil, forests, grasslands'
  },
  peat: {
    thermalInertia: 0.85,
    effectiveLagHours: 24,
    minTemp: null,
    meltRateModifier: 0.7,  // Wet, insulating, slow to warm
    description: 'Peat bogs and muskeg'
  },
  sand: {
    thermalInertia: 0.70,
    effectiveLagHours: 12,
    minTemp: null,
    meltRateModifier: 1.5,  // Fast thermal response, low moisture retention
    description: 'Sandy soil, deserts, beaches'
  }
};

// Default ground type if none specified
const DEFAULT_GROUND_TYPE = 'soil';

/**
 * Snow insulation constants
 * Deep snow insulates the ground, keeping it near freezing
 */
const SNOW_INSULATION = {
  // Snow depth (inches) at which insulation effect begins
  minDepthForInsulation: 4,
  // Snow depth at which full insulation effect is reached
  fullInsulationDepth: 12,
  // Ground temperature stabilizes toward this value under deep snow
  insulatedTemp: 32
};

/**
 * Ground Temperature Service
 */
export class GroundTemperatureService {
  constructor() {
    this.weatherGenerator = new WeatherGenerator();
    this.cache = new Map();
  }

  /**
   * Get ground temperature for a region at a specific date/time
   * @param {Object} region - Region with climate parameters
   * @param {Object} date - Game date {year, month, day, hour}
   * @param {number} snowDepth - Current snow depth in inches (optional, for insulation calc)
   * @returns {Object} Ground temperature data
   */
  getGroundTemperature(region, date, snowDepth = 0) {
    const cacheKey = `${region.id}:${date.year}:${date.month}:${date.day}:${date.hour}:${Math.round(snowDepth)}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = this.calculateGroundTemperature(region, date, snowDepth);
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Calculate ground temperature using exponentially-weighted moving average
   * @param {Object} region - Region data
   * @param {Object} date - Current date
   * @param {number} snowDepth - Current snow depth
   * @returns {Object} Ground temperature data
   */
  calculateGroundTemperature(region, date, snowDepth) {
    // Get ground type from region's specialFactors
    const groundTypeName = region.climate?.specialFactors?.groundType ||
                           region.specialFactors?.groundType ||
                           DEFAULT_GROUND_TYPE;

    const groundType = GROUND_TYPES[groundTypeName] || GROUND_TYPES[DEFAULT_GROUND_TYPE];
    const thermalInertia = groundType.thermalInertia;

    // Determine lookback hours based on thermal inertia
    // Higher inertia = need to look back further for accurate average
    const lookbackHours = Math.ceil(groundType.effectiveLagHours * 2);

    // Calculate weighted average of air temperatures
    let weightedSum = 0;
    let totalWeight = 0;
    let minAirTemp = Infinity;
    let maxAirTemp = -Infinity;

    for (let hoursAgo = 0; hoursAgo <= lookbackHours; hoursAgo++) {
      const checkDate = advanceDate(date, -hoursAgo);
      const weather = this.weatherGenerator.generateWeather(region, checkDate);
      const airTemp = weather.temperature;

      // Exponential decay weight: more recent temps have higher weight
      // but high inertia means older temps still matter significantly
      const weight = Math.pow(thermalInertia, hoursAgo);

      weightedSum += airTemp * weight;
      totalWeight += weight;

      // Track air temp range for debug
      minAirTemp = Math.min(minAirTemp, airTemp);
      maxAirTemp = Math.max(maxAirTemp, airTemp);
    }

    let groundTemp = weightedSum / totalWeight;

    // Apply snow insulation effect
    // Deep snow keeps ground temperature near freezing
    let snowInsulated = false;
    if (snowDepth >= SNOW_INSULATION.minDepthForInsulation) {
      const insulationFactor = Math.min(1,
        (snowDepth - SNOW_INSULATION.minDepthForInsulation) /
        (SNOW_INSULATION.fullInsulationDepth - SNOW_INSULATION.minDepthForInsulation)
      );

      // Blend toward insulated temp based on insulation factor
      // Only applies if ground would otherwise be colder than 32°F
      if (groundTemp < SNOW_INSULATION.insulatedTemp) {
        groundTemp = groundTemp + (SNOW_INSULATION.insulatedTemp - groundTemp) * insulationFactor * 0.5;
        snowInsulated = insulationFactor > 0.5;
      }
    }

    // Apply permafrost minimum temperature if applicable
    if (groundType.minTemp !== null) {
      groundTemp = Math.max(groundTemp, groundType.minTemp);
    }

    // Determine ground condition
    const isFrozen = groundTemp <= 32;
    let condition = 'warm';
    if (groundTemp <= 28) {
      condition = 'frozen';
    } else if (groundTemp <= 35) {
      condition = 'near-freezing';
    } else if (groundTemp <= 40) {
      condition = 'cool';
    }

    // Get current air temp for comparison
    const currentWeather = this.weatherGenerator.generateWeather(region, date);
    const currentAirTemp = currentWeather.temperature;
    const tempLag = currentAirTemp - groundTemp;

    return {
      temperature: Math.round(groundTemp * 10) / 10,
      isFrozen,
      condition,
      groundType: groundTypeName,
      thermalInertia,
      snowInsulated,

      // For snow accumulation decisions
      canAccumulateSnow: groundTemp <= 33,

      // Debug info
      _debug: {
        lookbackHours,
        currentAirTemp,
        tempLag: Math.round(tempLag * 10) / 10,
        airTempRange: { min: minAirTemp, max: maxAirTemp },
        effectiveLagHours: groundType.effectiveLagHours
      }
    };
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
    this.weatherGenerator.clearCache();
  }
}

// Singleton instance
const groundTemperatureService = new GroundTemperatureService();
export default groundTemperatureService;

// Export ground types for reference
export { GROUND_TYPES };
