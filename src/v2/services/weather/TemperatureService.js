/**
 * Temperature Service
 * Generates realistic temperatures with smooth daily and seasonal transitions
 */

import { HOURS_PER_DAY } from '../../models/constants';
import { generateSeed, SeededRandom } from '../../utils/seedGenerator';
import SunriseSunsetService from '../celestial/SunriseSunsetService';

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
   * Uses actual sunrise/sunset times from SunriseSunsetService
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

    const hoursSinceMidnight = date.hour;

    // Get actual sunrise/sunset times for this region and date
    const latitudeBand = region.latitudeBand || 'temperate';
    const sunData = SunriseSunsetService.getSunriseSunset(latitudeBand, date);

    let minHour, maxHour;

    if (sunData.sunriseHour !== null && sunData.sunsetHour !== null) {
      // Normal day: min temp at sunrise, max temp ~3 hours after solar noon
      minHour = sunData.sunriseHour;
      const solarNoon = (sunData.sunriseHour + sunData.sunsetHour) / 2;
      maxHour = solarNoon + 3; // Thermal lag: max temp ~3 hours after solar noon
      if (maxHour >= HOURS_PER_DAY) maxHour -= HOURS_PER_DAY;
    } else if (sunData.dayLengthHours >= 24) {
      // Polar day (24hr sunlight): use gentle variation, warmest at "noon" equivalent
      // Sun is always up, but still circles - use 12hr cycle centered on midnight sun
      minHour = 0;  // Coolest at midnight (sun at lowest point in sky circuit)
      maxHour = 12; // Warmest at noon (sun at highest point)
    } else {
      // Polar night (no sunrise): minimal variation, always cold
      // Return reduced variation since there's no solar heating cycle
      return dailyRange * 0.2 * Math.cos((hoursSinceMidnight / HOURS_PER_DAY) * 2 * Math.PI);
    }

    // Calculate center point for cosine wave
    const hourShift = (minHour + maxHour) / 2;

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

    // Continental/high diurnal variation climates get bigger day-to-day swings
    // This simulates rapid weather system changes (cold fronts, warm fronts, etc.)
    const baseRange = specialFactors.highDiurnalVariation ? 15 : 5;

    // Use a multi-day seed that changes slowly over time
    // We'll use 6-hour blocks to create smooth transitions
    const currentDay = (date.year - 1) * 360 + (date.month - 1) * 30 + (date.day - 1);
    const absoluteHour = currentDay * 24 + date.hour;

    // Create 6-hour blocks for smoother transitions
    const blockSize = 6;
    const currentBlock = Math.floor(absoluteHour / blockSize);
    const hourInBlock = absoluteHour % blockSize;

    // Get influence for current 6-hour block
    const blockSeed = generateSeed(region.id, {
      year: Math.floor(currentBlock / (360 * 24 / blockSize)) + 1,
      month: Math.floor((currentBlock % (360 * 24 / blockSize)) / (30 * 24 / blockSize)) + 1,
      day: Math.floor((currentBlock % (30 * 24 / blockSize)) / (24 / blockSize)) + 1,
      hour: 0
    }, 'temp-pattern');
    const blockRng = new SeededRandom(blockSeed);
    const currentInfluence = blockRng.range(-baseRange, baseRange);

    // Get influence for next 6-hour block
    const nextBlock = currentBlock + 1;
    const nextBlockSeed = generateSeed(region.id, {
      year: Math.floor(nextBlock / (360 * 24 / blockSize)) + 1,
      month: Math.floor((nextBlock % (360 * 24 / blockSize)) / (30 * 24 / blockSize)) + 1,
      day: Math.floor((nextBlock % (30 * 24 / blockSize)) / (24 / blockSize)) + 1,
      hour: 0
    }, 'temp-pattern');
    const nextBlockRng = new SeededRandom(nextBlockSeed);
    const nextInfluence = nextBlockRng.range(-baseRange, baseRange);

    // Smoothly interpolate between blocks
    const blendFactor = hourInBlock / blockSize;
    return currentInfluence + (nextInfluence - currentInfluence) * blendFactor;
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
