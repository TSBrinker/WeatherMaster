/**
 * Temperature Service
 * Generates realistic temperatures with smooth daily and seasonal transitions
 */

import { HOURS_PER_DAY } from '../../models/constants';
import { generateSeed, SeededRandom } from '../../utils/seedGenerator';

// Calendar constants for the game world
const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;

/**
 * Get the current season based on month
 * @param {number} month - Month number (1-12)
 * @returns {string} Season name
 */
function getSeason(month) {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter'; // 12, 1, 2
}

/**
 * Calculate day of year (0-359)
 * @param {Object} date - Game date {year, month, day}
 * @returns {number} Day of year
 */
function getDayOfYear(date) {
  return (date.month - 1) * DAYS_PER_MONTH + (date.day - 1);
}

/**
 * Smooth interpolation between values (cosine interpolation)
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor [0, 1]
 * @returns {number} Interpolated value
 */
function smoothInterpolate(a, b, t) {
  const mu2 = (1 - Math.cos(t * Math.PI)) / 2;
  return a * (1 - mu2) + b * mu2;
}

/**
 * Temperature Service
 * Generates realistic temperature patterns with daily and seasonal variation
 */
export class TemperatureService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate temperature for a specific date and time
   * @param {Object} region - Region with climate parameters
   * @param {Object} date - Game date {year, month, day, hour}
   * @returns {number} Temperature in Fahrenheit
   */
  getTemperature(region, date) {
    const cacheKey = `${region.id}:${date.year}:${date.month}:${date.day}:${Math.floor(date.hour)}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const params = region.climate || region.parameters || {};
    const tempProfile = params.temperatureProfile;

    if (!tempProfile) {
      console.warn('Region missing temperature profile, using default 70°F');
      return 70;
    }

    // Get base temperature for current season
    const baseTemp = this.getSeasonalBaseTemperature(tempProfile, date);

    // Add daily variation (diurnal cycle)
    const dailyVariation = this.getDailyTemperatureVariation(region, date, tempProfile);

    // Add weather pattern influence (will be enhanced in Sprint 3)
    const patternInfluence = this.getPatternInfluence(region, date);

    const finalTemp = baseTemp + dailyVariation + patternInfluence;

    this.cache.set(cacheKey, finalTemp);
    return finalTemp;
  }

  /**
   * Get base temperature for the current season, with smooth transitions
   * @param {Object} tempProfile - Temperature profile from region
   * @param {Object} date - Game date
   * @returns {number} Base temperature
   */
  getSeasonalBaseTemperature(tempProfile, date) {
    const dayOfYear = getDayOfYear(date);
    const daysPerYear = DAYS_PER_MONTH * MONTHS_PER_YEAR;

    // Define season centers (middle of each season)
    // Winter: Month 1, Day 15 (day 15 of year)
    // Spring: Month 4, Day 15 (day 105 of year)
    // Summer: Month 7, Day 15 (day 195 of year)
    // Fall: Month 10, Day 15 (day 285 of year)
    const seasonKeyPoints = [
      { day: 15, temp: tempProfile.winter.mean },    // Mid-winter
      { day: 105, temp: tempProfile.spring.mean },   // Mid-spring
      { day: 195, temp: tempProfile.summer.mean },   // Mid-summer
      { day: 285, temp: tempProfile.fall.mean },     // Mid-fall
      { day: 375, temp: tempProfile.winter.mean }    // Next winter (for wraparound)
    ];

    // Handle year wraparound for days near end/start of year
    let adjustedDayOfYear = dayOfYear;
    if (dayOfYear < 60) {
      // Early in year, might be interpolating from previous winter
      adjustedDayOfYear = dayOfYear;
    }

    // Find which two key points we're between
    let lowerPoint, upperPoint;
    for (let i = 0; i < seasonKeyPoints.length - 1; i++) {
      if (adjustedDayOfYear >= seasonKeyPoints[i].day && adjustedDayOfYear <= seasonKeyPoints[i + 1].day) {
        lowerPoint = seasonKeyPoints[i];
        upperPoint = seasonKeyPoints[i + 1];
        break;
      }
    }

    // If we're in late fall/early winter (day 285-375), wrap around
    if (!lowerPoint) {
      if (adjustedDayOfYear >= 285) {
        lowerPoint = seasonKeyPoints[3]; // Mid-fall
        upperPoint = seasonKeyPoints[4]; // Next winter
      } else {
        // Fallback to winter-spring
        lowerPoint = seasonKeyPoints[0];
        upperPoint = seasonKeyPoints[1];
      }
    }

    // Calculate interpolation factor (0 to 1)
    const dayRange = upperPoint.day - lowerPoint.day;
    const dayOffset = adjustedDayOfYear - lowerPoint.day;
    const t = dayOffset / dayRange;

    // Use smooth cosine interpolation
    const seasonalTemp = smoothInterpolate(lowerPoint.temp, upperPoint.temp, t);

    return seasonalTemp;
  }

  /**
   * Get daily temperature variation (warmer during day, cooler at night)
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @param {Object} tempProfile - Temperature profile
   * @returns {number} Temperature adjustment for time of day
   */
  getDailyTemperatureVariation(region, date, tempProfile) {
    const season = getSeason(date.month);
    const variance = tempProfile[season]?.variance || 10;

    // Daily temperature variation is typically ±50% of seasonal variance
    const dailyRange = variance * 0.5;

    // Temperature peaks around 3 PM (hour 15), minimum around 5 AM (hour 5)
    const hoursSinceMidnight = date.hour;

    // Shift cosine wave so minimum is at hour 5, maximum at hour 15
    const peakHour = 15;
    const minHour = 5;
    const hourShift = (minHour + peakHour) / 2; // Center at 10

    const dailyProgress = ((hoursSinceMidnight - hourShift) / HOURS_PER_DAY) * 2 * Math.PI;
    const dailyVariation = dailyRange * Math.cos(dailyProgress);

    return dailyVariation;
  }

  /**
   * Get temperature influence from weather patterns
   * This provides smooth day-to-day variation (not just hourly)
   * Continental climates get much larger swings
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @returns {number} Temperature adjustment from weather patterns
   */
  getPatternInfluence(region, date) {
    const params = region.climate || region.parameters || {};
    const specialFactors = params.specialFactors || {};

    // Create a slowly changing influence using multi-day seed
    const seed = generateSeed(region.id, date, 'temp-pattern');
    const rng = new SeededRandom(seed);

    // Continental/high diurnal variation climates get bigger day-to-day swings
    // This simulates rapid weather system changes (cold fronts, warm fronts, etc.)
    const baseRange = specialFactors.highDiurnalVariation ? 15 : 5;

    // Temperature can vary based on climate volatility
    const influence = rng.range(-baseRange, baseRange);

    // Smooth this over multiple days by blending with yesterday's influence
    const yesterdayDate = {
      ...date,
      day: date.day - 1 > 0 ? date.day - 1 : DAYS_PER_MONTH
    };
    const yesterdaySeed = generateSeed(region.id, yesterdayDate, 'temp-pattern');
    const yesterdayRng = new SeededRandom(yesterdaySeed);
    const yesterdayInfluence = yesterdayRng.range(-baseRange, baseRange);

    // Less smoothing for volatile climates (allows bigger jumps)
    const smoothingFactor = specialFactors.highDiurnalVariation ? 0.85 : 0.7;
    return influence * smoothingFactor + yesterdayInfluence * (1 - smoothingFactor);
  }

  /**
   * Calculate "feels like" temperature based on wind and humidity
   * @param {number} temperature - Actual temperature
   * @param {number} windSpeed - Wind speed in mph
   * @param {number} humidity - Humidity percentage (0-100)
   * @returns {number} Feels-like temperature
   */
  getFeelsLike(temperature, windSpeed, humidity) {
    // Wind chill calculation (for temps below 50°F and wind > 3 mph)
    if (temperature <= 50 && windSpeed > 3) {
      const windChill = 35.74 + 0.6215 * temperature
        - 35.75 * Math.pow(windSpeed, 0.16)
        + 0.4275 * temperature * Math.pow(windSpeed, 0.16);
      return Math.round(windChill);
    }

    // Heat index calculation (for temps above 80°F)
    if (temperature >= 80) {
      const T = temperature;
      const R = humidity;

      let heatIndex = -42.379
        + 2.04901523 * T
        + 10.14333127 * R
        - 0.22475541 * T * R
        - 0.00683783 * T * T
        - 0.05481717 * R * R
        + 0.00122874 * T * T * R
        + 0.00085282 * T * R * R
        - 0.00000199 * T * T * R * R;

      return Math.round(heatIndex);
    }

    // Otherwise, feels like = actual temperature
    return Math.round(temperature);
  }

  /**
   * Get detailed temperature breakdown for debugging
   * @param {Object} region - Region with climate parameters
   * @param {Object} date - Game date {year, month, day, hour}
   * @returns {Object} Temperature breakdown
   */
  getTemperatureDebug(region, date) {
    const params = region.climate || region.parameters || {};
    const tempProfile = params.temperatureProfile;

    if (!tempProfile) {
      return null;
    }

    const baseTemp = this.getSeasonalBaseTemperature(tempProfile, date);
    const dailyVariation = this.getDailyTemperatureVariation(region, date, tempProfile);
    const patternInfluence = this.getPatternInfluence(region, date);

    // Determine current season
    const month = date.month;
    let season;
    if (month >= 1 && month <= 3) season = 'winter';
    else if (month >= 4 && month <= 6) season = 'spring';
    else if (month >= 7 && month <= 9) season = 'summer';
    else season = 'fall';

    return {
      season,
      expectedSeasonMean: tempProfile[season].mean,
      expectedSeasonRange: `${tempProfile[season].mean - tempProfile[season].variance}°F to ${tempProfile[season].mean + tempProfile[season].variance}°F`,
      seasonalBase: Math.round(baseTemp * 10) / 10,
      dailyVariation: Math.round(dailyVariation * 10) / 10,
      patternInfluence: Math.round(patternInfluence * 10) / 10,
      finalTemp: Math.round((baseTemp + dailyVariation + patternInfluence) * 10) / 10
    };
  }

  /**
   * Clear temperature cache (useful when changing regions)
   */
  clearCache() {
    this.cache.clear();
  }
}
