// src/services/WeatherManager.js
// Singleton manager for weather services across regions

// Import the WeatherFactory class directly, not the instance
import { WeatherFactory } from './WeatherFactory';

/**
 * Singleton manager that coordinates weather services across multiple regions.
 * This allows different regions to use different weather generation systems
 * while providing a consistent API for the UI components.
 */
class WeatherManager {
  constructor() {
    // Map of region IDs to weather services
    this.weatherServices = new Map();
  }

  /**
   * Initialize weather for a region
   * @param {string} regionId - Region ID
   * @param {string} biome - Biome/climate type
   * @param {string} season - Current season
   * @param {Date} currentDate - Current date
   * @param {string} weatherType - Weather generation type (diceTable or meteorological)
   * @returns {object} - The generated weather
   */
  initializeWeather(regionId, biome, season, currentDate, weatherType = 'diceTable') {
    console.log(`Initializing ${weatherType} weather for region ${regionId}`);
    
    // Create appropriate weather service using the static method
    const weatherService = WeatherFactory.createWeatherService(weatherType);
    
    // Store the service
    this.weatherServices.set(regionId, weatherService);
    
    // Initialize weather
    return weatherService.initializeWeather(biome, season, currentDate);
  }

  /**
   * Advance time for a region
   * @param {string} regionId - Region ID
   * @param {number} hours - Hours to advance
   * @param {string} biome - Biome/climate type
   * @param {string} season - Current season
   * @param {Date} currentDate - Current date
   * @returns {object} - Updated weather
   */
  advanceTime(regionId, hours, biome, season, currentDate) {
    // Get weather service for the region
    const weatherService = this.weatherServices.get(regionId);
    
    if (!weatherService) {
      console.error(`No weather service found for region ${regionId}`);
      return null;
    }
    
    // Advance time
    return weatherService.advanceTime(hours, biome, season, currentDate);
  }

  /**
   * Get the weather service for a region
   * @param {string} regionId - Region ID
   * @returns {object} - Weather service instance
   */
  getWeatherService(regionId) {
    return this.weatherServices.get(regionId);
  }

  /**
   * Change weather system type for a region
   * @param {string} regionId - Region ID
   * @param {string} newType - New weather type (diceTable or meteorological)
   * @param {string} biome - Biome/climate type
   * @param {string} season - Current season
   * @param {Date} currentDate - Current date
   * @returns {object} - New weather data
   */
  changeWeatherSystem(regionId, newType, biome, season, currentDate) {
    console.log(`Changing weather system for region ${regionId} to ${newType}`);
    
    // Create new weather service of the requested type
    const weatherService = WeatherFactory.createWeatherService(newType);
    
    // Store the service
    this.weatherServices.set(regionId, weatherService);
    
    // Initialize weather with the new service
    return weatherService.initializeWeather(biome, season, currentDate);
  }

  /**
   * Get season from date
   * @param {Date} date - Date object
   * @returns {string} - Season name
   */
  getSeasonFromDate(date) {
    const month = date.getMonth();
    
    // Northern hemisphere seasons
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
  
  /**
   * Clear weather service for a region (for cleanup)
   * @param {string} regionId - Region ID
   */
  clearWeatherService(regionId) {
    this.weatherServices.delete(regionId);
  }
}

// Export singleton instance
const weatherManagerInstance = new WeatherManager();
export default weatherManagerInstance;