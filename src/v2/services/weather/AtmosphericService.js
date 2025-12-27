/**
 * Atmospheric Service
 * Manages atmospheric pressure, cloud cover, and enhanced humidity modeling
 * Part of Sprint 4 (Cedar) - Atmospheric Depth enhancements
 */

import { generateSeed, SeededRandom } from '../../utils/seedGenerator';

/**
 * Standard atmospheric pressure at sea level (inHg)
 */
const STANDARD_PRESSURE = 29.92;

/**
 * Pressure ranges for different patterns
 */
const PRESSURE_RANGES = {
  HIGH_PRESSURE: { min: 30.20, max: 30.70 },
  LOW_PRESSURE: { min: 29.20, max: 29.70 },
  WARM_FRONT: { min: 29.70, max: 30.00 },
  COLD_FRONT: { min: 29.40, max: 29.80 },
  STABLE: { min: 29.80, max: 30.10 }
};

/**
 * Cloud cover types and their percentage ranges
 */
const CLOUD_COVER_TYPES = {
  CLEAR: { min: 0, max: 10, description: 'Clear skies' },
  FEW: { min: 10, max: 25, description: 'Few clouds' },
  SCATTERED: { min: 25, max: 50, description: 'Scattered clouds' },
  BROKEN: { min: 50, max: 87, description: 'Broken clouds' },
  OVERCAST: { min: 87, max: 100, description: 'Overcast' }
};

/**
 * Atmospheric Service
 * Handles pressure systems, cloud cover, and atmospheric effects
 */
export class AtmosphericService {
  constructor() {
    this.pressureCache = new Map();
    this.cloudCoverCache = new Map();
  }

  /**
   * Get atmospheric pressure for a region and date
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @param {Object} pattern - Current weather pattern
   * @returns {Object} Pressure data { pressure, trend, description }
   */
  getPressure(region, date, pattern) {
    const cacheKey = `${region.id}:${date.year}:${date.month}:${date.day}`;

    if (this.pressureCache.has(cacheKey)) {
      return this.pressureCache.get(cacheKey);
    }

    // Get pressure range for current pattern
    const patternType = pattern.type || 'STABLE';
    const range = PRESSURE_RANGES[patternType] || PRESSURE_RANGES.STABLE;

    // Generate deterministic pressure within range
    const seed = generateSeed(region.id, date, 'pressure');
    const rng = new SeededRandom(seed);

    // Base pressure from pattern
    const basePressure = rng.range(range.min, range.max);

    // Add daily variation (pressure changes gradually throughout the day)
    const hourFactor = Math.sin((date.hour / 24) * Math.PI * 2) * 0.05;
    const pressure = basePressure + hourFactor;

    // Calculate pressure trend (rising, falling, steady)
    const trend = this.calculatePressureTrend(region, date, pattern);

    // Get description
    const description = this.getPressureDescription(pressure);

    const result = {
      pressure: Math.round(pressure * 100) / 100,
      trend,
      description,
      _debug: {
        patternType,
        basePressure,
        hourFactor
      }
    };

    this.pressureCache.set(cacheKey, result);
    return result;
  }

  /**
   * Calculate pressure trend (rising, falling, steady)
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @param {Object} pattern - Current weather pattern
   * @returns {string} Trend: 'rising', 'falling', 'steady'
   */
  calculatePressureTrend(region, date, pattern) {
    // Get yesterday's pattern to compare
    const yesterdayDate = { ...date, day: date.day - 1 };
    const seed = generateSeed(region.id, yesterdayDate, 'pressure');
    const todaySeed = generateSeed(region.id, date, 'pressure');

    const rng1 = new SeededRandom(seed);
    const rng2 = new SeededRandom(todaySeed);

    const patternType = pattern.type || 'STABLE';
    const range = PRESSURE_RANGES[patternType] || PRESSURE_RANGES.STABLE;

    const yesterdayPressure = rng1.range(range.min, range.max);
    const todayPressure = rng2.range(range.min, range.max);

    const diff = todayPressure - yesterdayPressure;

    if (diff > 0.1) return 'rising';
    if (diff < -0.1) return 'falling';
    return 'steady';
  }

  /**
   * Get pressure description
   * @param {number} pressure - Pressure in inHg
   * @returns {string} Description
   */
  getPressureDescription(pressure) {
    if (pressure >= 30.20) return 'High';
    if (pressure >= 29.80) return 'Normal';
    if (pressure >= 29.50) return 'Low';
    return 'Very Low';
  }

  /**
   * Get cloud cover percentage and type
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @param {Object} pattern - Current weather pattern
   * @param {Object} precipitation - Precipitation data
   * @returns {Object} Cloud cover data { percentage, type, description }
   */
  getCloudCover(region, date, pattern, precipitation) {
    const cacheKey = `${region.id}:${date.year}:${date.month}:${date.day}:${date.hour}`;

    if (this.cloudCoverCache.has(cacheKey)) {
      return this.cloudCoverCache.get(cacheKey);
    }

    // Base cloud cover from pattern
    const patternClearSkies = pattern.characteristics.clearSkies || 0.5;

    // If precipitation is occurring, clouds are heavy
    if (precipitation && precipitation.isOccurring) {
      const type = 'OVERCAST';
      return {
        percentage: 95,
        type,
        description: CLOUD_COVER_TYPES[type].description
      };
    }

    // Generate cloud cover based on clear skies probability
    const seed = generateSeed(region.id, date, 'clouds');
    const rng = new SeededRandom(seed);

    // High clear skies probability = low cloud cover
    // Low clear skies probability = high cloud cover
    const baseCloudiness = (1 - patternClearSkies) * 100;

    // Add variation (±20%)
    const variation = rng.range(-20, 20);
    const percentage = Math.max(0, Math.min(100, Math.round(baseCloudiness + variation)));

    // Determine cloud cover type
    let type = 'CLEAR';
    for (const [typeName, typeData] of Object.entries(CLOUD_COVER_TYPES)) {
      if (percentage >= typeData.min && percentage <= typeData.max) {
        type = typeName;
        break;
      }
    }

    const result = {
      percentage,
      type,
      description: CLOUD_COVER_TYPES[type].description,
      _debug: {
        patternClearSkies,
        baseCloudiness,
        variation
      }
    };

    this.cloudCoverCache.set(cacheKey, result);
    return result;
  }

  /**
   * Calculate enhanced humidity with pressure influence
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @param {Object} pattern - Current weather pattern
   * @param {Object} pressure - Pressure data
   * @param {number} baseHumidity - Base humidity from region profile
   * @returns {number} Enhanced humidity percentage
   */
  getEnhancedHumidity(region, date, pattern, pressure, baseHumidity) {
    let humidity = baseHumidity;

    // Low pressure increases humidity (more moisture in air)
    const pressureDiff = pressure.pressure - STANDARD_PRESSURE;
    const pressureEffect = -pressureDiff * 10; // Low pressure = positive effect
    humidity += pressureEffect;

    // Pressure trend affects humidity
    if (pressure.trend === 'falling') {
      humidity += 5; // Falling pressure = increasing humidity
    } else if (pressure.trend === 'rising') {
      humidity -= 5; // Rising pressure = decreasing humidity
    }

    // Note: Precipitation humidity boost is already applied in WeatherGenerator.generateHumidity()
    // so we don't add it again here to avoid double-dipping

    // Clamp to valid range
    return Math.max(10, Math.min(100, Math.round(humidity)));
  }

  /**
   * Calculate atmospheric contribution to "feels like" temperature
   * Considers humidity and pressure effects
   * @param {number} temperature - Actual temperature
   * @param {number} humidity - Humidity percentage
   * @param {Object} pressure - Pressure data
   * @returns {number} Atmospheric contribution to feels-like (degrees F)
   */
  getAtmosphericFeelsLikeContribution(temperature, humidity, pressure) {
    let contribution = 0;

    // High humidity makes it feel hotter in warm weather
    if (temperature >= 80 && humidity >= 60) {
      // Heat index contribution
      const humidityFactor = (humidity - 60) / 40; // 0 to 1
      contribution += humidityFactor * 5; // Up to +5°F
    }

    // Low pressure can make cold feel colder (less dense air = less insulation)
    if (temperature <= 40 && pressure.pressure < 29.80) {
      const pressureFactor = (29.80 - pressure.pressure) / 0.60; // 0 to 1
      contribution -= pressureFactor * 2; // Up to -2°F
    }

    return contribution;
  }

  /**
   * Get visibility based on conditions
   * @param {Object} cloudCover - Cloud cover data
   * @param {Object} precipitation - Precipitation data
   * @param {number} humidity - Humidity percentage
   * @returns {Object} Visibility data { distance, description }
   */
  getVisibility(cloudCover, precipitation, humidity) {
    let visibilityMiles = 10; // Default: excellent visibility
    let description = 'Excellent';

    // Precipitation reduces visibility
    if (precipitation && precipitation.isOccurring) {
      if (precipitation.intensity === 'heavy') {
        visibilityMiles = 0.5;
        description = 'Very Poor';
      } else if (precipitation.intensity === 'moderate') {
        visibilityMiles = 2;
        description = 'Poor';
      } else {
        visibilityMiles = 5;
        description = 'Moderate';
      }
    }

    // High humidity and clouds can create haze/mist
    if (humidity > 85 && cloudCover.percentage > 50) {
      visibilityMiles = Math.min(visibilityMiles, 3);
      description = 'Poor (Haze)';
    }

    // Fog (from weather generator) would override this
    // but we provide a baseline

    return {
      distance: visibilityMiles,
      description
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.pressureCache.clear();
    this.cloudCoverCache.clear();
  }
}

// Create and export singleton instance
const atmosphericService = new AtmosphericService();
export default atmosphericService;
