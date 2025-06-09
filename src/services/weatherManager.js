// src/services/weatherManager.js
// Singleton manager for weather services across regions
// Clean version with meteorological-only support

import MeteorologicalWeatherService from './MeteorologicalWeatherService';

class WeatherManager {
  constructor() {
    this.weatherServices = {}; // WeatherService instance per region
    this.forecasts = {}; // Forecast data per region
  }
  
  /**
   * Initialize weather for a region
   * @param {string} regionId - Unique region identifier
   * @param {string} climate - Climate type (e.g., 'temperate-deciduous')
   * @param {string} season - Season ('spring', 'summer', 'fall', 'winter', or 'auto')
   * @param {Date} date - Starting date for weather generation
   * @returns {Array} - The 24-hour forecast
   */
  initializeWeather(regionId, climate, season, date) {
    // Create new meteorological weather service
    this.weatherServices[regionId] = new MeteorologicalWeatherService();
    
    // Ensure climate is valid
    const safeClimate = climate || "temperate-deciduous";
    
    // Initialize weather
    this.weatherServices[regionId].initializeWeather(safeClimate, season, date);
    
    // Store forecast
    this.forecasts[regionId] = this.weatherServices[regionId].get24HourForecast();
    
    return this.forecasts[regionId];
  }
  
  /**
   * Get forecast for a region
   * @param {string} regionId - Region identifier
   * @returns {Array|null} - Current forecast or null if not found
   */
  getForecast(regionId) {
    return this.forecasts[regionId] || null;
  }
  
  /**
   * Advance time for a region
   * @param {string} regionId - Region identifier
   * @param {number} hours - Hours to advance
   * @param {string} climate - Climate type
   * @param {string} season - Current season
   * @param {Date} currentDate - Current date
   * @returns {Array} - Updated forecast
   */
  advanceTime(regionId, hours, climate, season, currentDate) {
    // Ensure a weather service exists
    if (!this.weatherServices[regionId]) {
      this.weatherServices[regionId] = new MeteorologicalWeatherService();
      this.initializeWeather(regionId, climate, season, currentDate);
    }
    
    // Advance time in the service
    this.weatherServices[regionId].advanceTime(hours, climate, season, currentDate);
    
    // Update stored forecast
    this.forecasts[regionId] = this.weatherServices[regionId].get24HourForecast();
    
    return this.forecasts[regionId];
  }
  
  /**
   * Extend forecast using stateless generation (preferred method)
   * @param {string} regionId - Region identifier
   * @param {Array} currentForecast - Current 24-hour forecast
   * @param {number} hours - Hours to advance
   * @param {string} climate - Climate type
   * @param {string} season - Current season
   * @returns {Array} - Extended forecast
   */
  extendForecast(regionId, currentForecast, hours, climate, season) {
    // Validate current forecast
    if (!currentForecast || currentForecast.length === 0) {
      const currentDate = new Date();
      currentDate.setHours(currentDate.getHours() + hours);
      return this.initializeWeather(regionId, climate, season, currentDate);
    }
    
    // Ensure weather service exists
    if (!this.weatherServices[regionId]) {
      this.weatherServices[regionId] = new MeteorologicalWeatherService();
    }
    
    // Use the weather service's extend forecast method if available
    if (typeof this.weatherServices[regionId].extendForecast === 'function') {
      const extendedForecast = this.weatherServices[regionId].extendForecast(
        currentForecast,
        hours,
        climate,
        season
      );
      
      // Update stored forecast
      this.forecasts[regionId] = extendedForecast;
      
      return extendedForecast;
    }
    
    // Fallback to regular advance time
    const lastHour = currentForecast[currentForecast.length - 1];
    const newDate = new Date(lastHour.date);
    newDate.setHours(newDate.getHours() + hours);
    
    return this.advanceTime(regionId, hours, climate, season, newDate);
  }
  
  /**
   * Get current weather for a region (first hour of forecast)
   * @param {string} regionId - Region identifier
   * @returns {object|null} - Current weather or null
   */
  getCurrentWeather(regionId) {
    const forecast = this.forecasts[regionId];
    return forecast && forecast.length > 0 ? forecast[0] : null;
  }
  
  /**
   * Clear weather data for a region
   * @param {string} regionId - Region identifier
   */
  clearRegionWeather(regionId) {
    delete this.weatherServices[regionId];
    delete this.forecasts[regionId];
  }
  
  /**
   * Clear all weather data
   */
  clearAllWeather() {
    this.weatherServices = {};
    this.forecasts = {};
  }
  
  /**
   * Get season from date
   * @param {Date} date - Date to check
   * @returns {string} - Season name
   */
  getSeasonFromDate(date) {
    if (this.weatherServices && Object.keys(this.weatherServices).length > 0) {
      // Use existing service if available
      const firstService = Object.values(this.weatherServices)[0];
      return firstService.getSeasonFromDate(date);
    }
    
    // Fallback season calculation
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
  
  /**
   * Export weather state for persistence
   * @returns {object} - Serializable weather state
   */
  exportState() {
    return {
      forecasts: this.forecasts
    };
  }
  
  /**
   * Import weather state from persistence
   * @param {object} state - Previously exported state
   */
  importState(state) {
    if (state && state.forecasts) {
      this.forecasts = state.forecasts;
      
      // Convert date strings back to Date objects
      Object.keys(this.forecasts).forEach(regionId => {
        if (this.forecasts[regionId] && Array.isArray(this.forecasts[regionId])) {
          this.forecasts[regionId] = this.forecasts[regionId].map(hour => ({
            ...hour,
            date: new Date(hour.date)
          }));
        }
      });
    }
  }
  
  /**
   * Check if a region has active weather data
   * @param {string} regionId - Region identifier
   * @returns {boolean} - True if region has weather data
   */
  hasWeatherData(regionId) {
    return !!(this.forecasts[regionId] && this.forecasts[regionId].length > 0);
  }
  
  /**
   * Get weather service instance for a region (for debugging/advanced use)
   * @param {string} regionId - Region identifier
   * @returns {MeteorologicalWeatherService|null} - Weather service instance
   */
  getWeatherService(regionId) {
    return this.weatherServices[regionId] || null;
  }
}

// Singleton instance
const weatherManager = new WeatherManager();
export default weatherManager;