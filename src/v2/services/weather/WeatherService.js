/**
 * Weather Service
 * Main coordinator for all weather-related functionality
 * This is the primary interface used by the app
 */

import { WeatherGenerator } from './WeatherGenerator';
import SunriseSunsetService from '../celestial/SunriseSunsetService';
import MoonService from '../celestial/MoonService';
import WandererService from '../celestial/WandererService';
import { EnvironmentalConditionsService } from './EnvironmentalConditionsService';
import { SnowAccumulationService } from './SnowAccumulationService';
import { SeaStateService } from './SeaStateService';
import { advanceDate, getMonthName } from '../../utils/dateUtils';

/**
 * Weather Service - Main Interface
 * Coordinates weather generation and celestial calculations
 */
export class WeatherService {
  constructor() {
    this.weatherGenerator = new WeatherGenerator();
    this.sunService = SunriseSunsetService;
    this.moonService = MoonService;
    this.wandererService = WandererService;
    this.environmentalService = new EnvironmentalConditionsService();
    this.snowService = new SnowAccumulationService();
    this.seaStateService = new SeaStateService();
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

    // Get environmental conditions and snow accumulation (land regions only)
    // Ocean regions don't have meaningful snow accumulation or flood risk
    const isOcean = this.isOceanRegion(region);
    const environmental = isOcean
      ? this.getOceanEnvironmental()
      : this.environmentalService.getEnvironmentalConditions(region, date);
    const snowAccumulation = isOcean
      ? this.getOceanSnowAccumulation()
      : this.snowService.getAccumulation(region, date);

    // Get wanderer event (pass weather for visibility check)
    const wanderer = this.wandererService.getWandererEvent(region, date, weather);

    // Get sea state for ocean regions (includes forecast for sailors)
    let seaState = null;
    if (isOcean) {
      seaState = this.seaStateService.getSeaState(region, date, weather);
      seaState.forecast = this.seaStateService.getSeaStateForecast(region, date, weather);
    }

    return {
      ...weather,
      celestial,
      environmental,
      snowAccumulation,
      seaState,
      wanderer,
      timestamp: this.getTimestamp(date)
    };
  }

  /**
   * Check if a region is an ocean region
   * @param {Object} region - Region data
   * @returns {boolean} True if ocean region
   */
  isOceanRegion(region) {
    if (!region) return false;
    const climate = region.climate || region.parameters || {};
    return climate.specialFactors?.isOcean === true ||
           climate.biome === 'ocean' ||
           region.biome === 'ocean';
  }

  /**
   * Get environmental conditions for ocean regions
   * Ocean regions don't have land-based environmental conditions
   * @returns {Object} Empty environmental conditions
   */
  getOceanEnvironmental() {
    return {
      drought: { level: 0, name: 'N/A', description: 'Ocean region', gameplayImpacts: [] },
      flooding: { level: 0, name: 'N/A', description: 'Ocean region', gameplayImpacts: [] },
      heatWave: { level: 0, name: 'Normal', description: 'Temperatures within seasonal norms', consecutiveDays: 0, degreesAboveNormal: 0, gameplayImpacts: [] },
      coldSnap: { level: 0, name: 'Normal', description: 'Temperatures within seasonal norms', consecutiveDays: 0, degreesBelowNormal: 0, gameplayImpacts: [] },
      wildfireRisk: { level: 0, name: 'N/A', description: 'Ocean region', gameplayImpacts: [] },
      activeAlerts: [],
      hasActiveAlerts: false,
      isOceanRegion: true
    };
  }

  /**
   * Get snow accumulation for ocean regions
   * Snow doesn't accumulate on open water - it melts on contact
   * @returns {Object} Empty snow accumulation
   */
  getOceanSnowAccumulation() {
    return {
      snowDepth: 0,
      snowWaterEquivalent: 0,
      iceAccumulation: 0,
      snowAge: 0,
      groundCondition: { name: 'Ocean', description: 'Open water - no ground accumulation' },
      snowFillPercent: 0,
      groundTemperature: null,
      groundTempCondition: null,
      canAccumulateSnow: false,
      isSnowCovered: false,
      isIcy: false,
      travelImpact: ['Sea conditions determine travel'],
      gameplayEffects: [],
      isOceanRegion: true
    };
  }

  /**
   * Get celestial data (sun and moon information)
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @returns {Object} Celestial data
   */
  getCelestialData(region, date) {
    const latitudeBand = region.latitudeBand || 'temperate';

    // Get sun data
    const sunData = this.sunService.getFormattedTimes(latitudeBand, date, false);

    // Get moon data
    const moonData = this.moonService.getFormattedMoonInfo(date, 0, false);

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
      isMoonVisible: moonData.isMoonVisible,
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
      const forecastDate = advanceDate(currentDate, i);
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
   * Get timestamp string for weather data
   * @param {Object} date - Game date
   * @returns {string} Timestamp
   */
  getTimestamp(date) {
    const monthName = getMonthName(date.month);
    return `${monthName} ${date.day}, Year ${date.year}, Hour ${date.hour}`;
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
      environmental: { activeAlerts: [], hasActiveAlerts: false },
      timestamp: 'Unknown'
    };
  }

  /**
   * Group consecutive hours with similar weather into periods
   * Used for Druidcraft cantrip display
   * @param {Array} forecast - Array of hourly weather data
   * @returns {Array} Array of weather periods
   */
  groupIntoPeriods(forecast) {
    if (!forecast || forecast.length === 0) return [];

    const periods = [];
    let currentPeriod = {
      condition: forecast[0].condition,
      precipitationType: forecast[0].precipitationType,
      hours: 1,
      tempMin: forecast[0].temperature,
      tempMax: forecast[0].temperature,
      startHour: forecast[0].hour
    };

    for (let i = 1; i < forecast.length; i++) {
      const current = forecast[i];

      // Check if weather is similar enough to group
      const isSameCondition = current.condition === currentPeriod.condition;
      const isSamePrecip = current.precipitationType === currentPeriod.precipitationType;

      if (isSameCondition && isSamePrecip) {
        // Extend current period
        currentPeriod.hours += 1;
        currentPeriod.tempMin = Math.min(currentPeriod.tempMin, current.temperature);
        currentPeriod.tempMax = Math.max(currentPeriod.tempMax, current.temperature);
      } else {
        // Start new period
        periods.push(currentPeriod);
        currentPeriod = {
          condition: current.condition,
          precipitationType: current.precipitationType,
          hours: 1,
          tempMin: current.temperature,
          tempMax: current.temperature,
          startHour: current.hour
        };
      }
    }

    // Add the last period
    periods.push(currentPeriod);

    return periods;
  }

  /**
   * Get daily forecast summary for DM planning
   * @param {Object} region - Region data
   * @param {Object} currentDate - Current game date
   * @param {number} days - Number of days to forecast (default: 7)
   * @returns {Array} Array of daily summaries
   */
  getDailyForecast(region, currentDate, days = 7) {
    const dailyForecast = [];

    for (let i = 0; i < days; i++) {
      const startDate = advanceDate(currentDate, i * 24);
      const dayWeather = [];

      // Get weather for each hour of the day
      for (let hour = 0; hour < 24; hour++) {
        const hourDate = { ...startDate, hour };
        const weather = this.weatherGenerator.generateWeather(region, hourDate);
        dayWeather.push(weather);
      }

      // Calculate daily summary
      const temps = dayWeather.map(w => w.temperature);
      const conditions = dayWeather.map(w => w.condition);
      const precipTypes = dayWeather.filter(w => w.precipitation).map(w => w.precipitationType);

      // Find most common condition
      const conditionCounts = {};
      conditions.forEach(c => conditionCounts[c] = (conditionCounts[c] || 0) + 1);
      const dominantCondition = Object.keys(conditionCounts).reduce((a, b) =>
        conditionCounts[a] > conditionCounts[b] ? a : b
      );

      dailyForecast.push({
        day: i,
        date: startDate,
        high: Math.max(...temps),
        low: Math.min(...temps),
        condition: dominantCondition,
        precipitation: precipTypes.length > 0,
        precipitationType: precipTypes[0] || null,
        pattern: dayWeather[12].pattern // Noon pattern
      });
    }

    return dailyForecast;
  }

  /**
   * Clear all caches (useful when changing regions)
   */
  clearCache() {
    this.weatherGenerator.clearCache();
    this.environmentalService.clearCache();
    this.snowService.clearCache();
    this.wandererService.clearCache();
    this.seaStateService.clearCache();
  }
}

// Create and export singleton instance
const weatherService = new WeatherService();
export default weatherService;
