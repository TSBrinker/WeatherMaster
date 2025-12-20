/**
 * Weather Service
 * Main coordinator for all weather-related functionality
 * This is the primary interface used by the app
 */

import { WeatherGenerator } from './WeatherGenerator';
import { SunriseSunsetService } from '../celestial/SunriseSunsetService';
import { MoonService } from '../celestial/MoonService';

/**
 * Weather Service - Main Interface
 * Coordinates weather generation and celestial calculations
 */
export class WeatherService {
  constructor() {
    this.weatherGenerator = new WeatherGenerator();
    this.sunService = new SunriseSunsetService();
    this.moonService = new MoonService();
  }

  /**
   * Get complete weather and celestial data for a region
   * @param {Object} region - Region with climate parameters
   * @param {Object} date - Game date {year, month, day, hour}
   * @returns {Object} Complete weather and celestial data
   */
  getCurrentWeather(region, date) {
    if (!region || !date) {
      console.warn('WeatherService: Missing region or date');
      return this.getDefaultWeather();
    }

    // Generate weather
    const weather = this.weatherGenerator.generateWeather(region, date);

    // Get celestial data
    const celestial = this.getCelestialData(region, date);

    return {
      ...weather,
      celestial,
      timestamp: this.getTimestamp(date)
    };
  }

  /**
   * Get celestial data (sun and moon information)
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @returns {Object} Celestial data
   */
  getCelestialData(region, date) {
    const params = region.parameters || region.climateProfile;
    const latitude = params.latitude || 45;

    // Get sun data
    const sunData = this.sunService.getSunData(date, latitude);

    // Get moon data
    const moonData = this.moonService.getMoonData(date);

    return {
      // Sun data
      sunriseTime: sunData.sunriseTime,
      sunsetTime: sunData.sunsetTime,
      dayLength: sunData.dayLength,
      twilightLevel: sunData.twilightLevel,
      isPermanentNight: sunData.isPermanentNight,
      distanceToSun: sunData.distanceToSun,

      // Moon data
      moonPhase: moonData.phaseName,
      moonIcon: moonData.phaseIcon,
      moonIllumination: moonData.illumination,
      isWaxing: moonData.isWaxing,
      moonriseTime: moonData.moonriseTime,
      moonsetTime: moonData.moonsetTime,
      isMoonVisible: moonData.isVisible,
      phaseAngle: moonData.phaseAngle
    };
  }

  /**
   * Get forecast for next N hours
   * @param {Object} region - Region data
   * @param {Object} currentDate - Current game date
   * @param {number} hours - Number of hours to forecast (default: 24)
   * @returns {Array} Array of weather data for each hour
   */
  getForecast(region, currentDate, hours = 24) {
    const forecast = [];

    for (let i = 0; i < hours; i++) {
      const forecastDate = this.addHours(currentDate, i);
      const weather = this.getCurrentWeather(region, forecastDate);

      forecast.push({
        hour: forecastDate.hour,
        day: forecastDate.day,
        ...weather
      });
    }

    return forecast;
  }

  /**
   * Add hours to a date
   * @param {Object} date - Game date
   * @param {number} hours - Hours to add
   * @returns {Object} New date
   */
  addHours(date, hours) {
    let newHour = date.hour + hours;
    let newDay = date.day;
    let newMonth = date.month;
    let newYear = date.year;

    // Handle hour overflow
    while (newHour >= 24) {
      newHour -= 24;
      newDay += 1;

      if (newDay > 30) {
        newDay = 1;
        newMonth += 1;

        if (newMonth > 12) {
          newMonth = 1;
          newYear += 1;
        }
      }
    }

    return {
      year: newYear,
      month: newMonth,
      day: newDay,
      hour: newHour
    };
  }

  /**
   * Get timestamp string for weather data
   * @param {Object} date - Game date
   * @returns {string} Timestamp
   */
  getTimestamp(date) {
    return `Year ${date.year}, Month ${date.month}, Day ${date.day}, Hour ${date.hour}`;
  }

  /**
   * Get default weather (fallback when data is missing)
   * @returns {Object} Default weather data
   */
  getDefaultWeather() {
    return {
      temperature: 70,
      feelsLike: 70,
      condition: 'Clear',
      windSpeed: 5,
      windDirection: 'N',
      humidity: 50,
      precipitation: false,
      precipitationType: null,
      precipitationIntensity: null,
      pattern: 'Unknown',
      effects: [],
      celestial: null,
      timestamp: 'Unknown'
    };
  }

  /**
   * Clear all caches (useful when changing regions)
   */
  clearCache() {
    this.weatherGenerator.clearCache();
  }
}

// Export singleton instance
export default new WeatherService();
