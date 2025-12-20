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

    const params = region.parameters || region.climateProfile;
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
    const seasonCenters = {
      winter: 15,  // Mid-January (month 1, day 15)
      spring: 105, // Mid-April (month 4, day 15)
      summer: 195, // Mid-July (month 7, day 15)
      fall: 285    // Mid-October (month 10, day 15)
    };

    const seasonTemps = {
      winter: tempProfile.winter.mean,
      spring: tempProfile.spring.mean,
      summer: tempProfile.summer.mean,
      fall: tempProfile.fall.mean
    };

    // Create smooth annual temperature curve
    // Use cosine wave with peak in summer, trough in winter
    const yearProgress = (dayOfYear / daysPerYear) * 2 * Math.PI;

    // Calculate distance from winter (coldest) and summer (warmest)
    const winterTemp = seasonTemps.winter;
    const summerTemp = seasonTemps.summer;
    const tempRange = summerTemp - winterTemp;

    // Shift so winter is at yearProgress = 0 (and 360)
    // Peak (summer) at yearProgress = π
    const seasonalTemp = winterTemp + (tempRange / 2) * (1 + Math.cos(yearProgress + Math.PI));

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
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @returns {number} Temperature adjustment from weather patterns
   */
  getPatternInfluence(region, date) {
    // Create a slowly changing influence using multi-day seed
    const seed = generateSeed(region.id, date, 'temp-pattern');
    const rng = new SeededRandom(seed);

    // Temperature can vary ±5°F from the base due to weather systems
    const influence = rng.range(-5, 5);

    // Smooth this over multiple days by blending with yesterday's influence
    const yesterdayDate = {
      ...date,
      day: date.day - 1 > 0 ? date.day - 1 : DAYS_PER_MONTH
    };
    const yesterdaySeed = generateSeed(region.id, yesterdayDate, 'temp-pattern');
    const yesterdayRng = new SeededRandom(yesterdaySeed);
    const yesterdayInfluence = yesterdayRng.range(-5, 5);

    // Blend 70% today, 30% yesterday for smooth transition
    return influence * 0.7 + yesterdayInfluence * 0.3;
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
   * Clear temperature cache (useful when changing regions)
   */
  clearCache() {
    this.cache.clear();
  }
}
