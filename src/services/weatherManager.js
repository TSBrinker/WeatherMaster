// src/services/weatherManager.js
// Enhanced Weather Manager with solar-angle based season support

import MeteorologicalWeatherService from './MeteorologicalWeatherService.js';
import WeatherUtils from '../utils/weatherUtils.js';

/**
 * Weather Manager - Centralized weather service management with solar seasons
 * Handles multiple regions and their weather services
 */
class WeatherManager {
  constructor() {
    this.weatherServices = {}; // regionId -> WeatherService instance
    this.forecasts = {}; // regionId -> forecast array
    console.log("WeatherManager initialized with solar season support");
  }

  /**
   * Initialize weather for a region with solar-based season calculation
   * @param {string} regionId - Unique region identifier
   * @param {string} biome - Region biome/climate type
   * @param {string} season - Season or 'auto' for solar calculation
   * @param {Date} currentDate - Current date/time
   * @param {object} regionProfile - Optional region profile with latitude data
   * @returns {Array} - 24-hour forecast
   */
  initializeWeather(regionId, biome, season, currentDate = new Date(), regionProfile = null) {
    console.log(`WeatherManager initializing weather for region ${regionId}: ${biome}, ${season}`);
    
    // Create a new meteorological weather service for this region
    const weatherService = new MeteorologicalWeatherService();
    this.weatherServices[regionId] = weatherService;

    // Enhanced season determination using solar angles
    let actualSeason = season;
    if (season === "auto" && regionProfile) {
      // Use solar-angle based season calculation with region's latitude
      actualSeason = WeatherUtils.getSeasonFromDate(currentDate, regionProfile.latitude || 40);
      console.log(`[Solar Season] Auto-determined season for region ${regionId}: ${actualSeason} ` +
                  `(lat: ${regionProfile.latitude || 40}°)`);
    } else if (season === "auto") {
      // Fallback to default latitude if no profile provided
      actualSeason = WeatherUtils.getSeasonFromDate(currentDate, 40);
      console.log(`[Solar Season] Auto-determined season for region ${regionId}: ${actualSeason} (default lat: 40°)`);
    }

    // Initialize weather with the determined season
    const forecast = weatherService.initializeWeather(biome, actualSeason, currentDate);
    
    // Store the forecast
    this.forecasts[regionId] = forecast;
    
    console.log(`Weather initialized for region ${regionId} with ${forecast.length} hours of forecast`);
    return forecast;
  }

  /**
   * Advance time for a specific region with solar season updates
   * @param {string} regionId - Region identifier
   * @param {number} hours - Hours to advance
   * @param {Date} currentDate - Current date/time
   * @returns {Array} - Updated forecast
   */
  advanceTime(regionId, hours, currentDate) {
    console.log(`WeatherManager advancing time for region ${regionId} by ${hours} hours`);
    
    const weatherService = this.weatherServices[regionId];
    if (!weatherService) {
      console.error(`No weather service found for region ${regionId}`);
      return [];
    }

    // Advance time using the service's enhanced solar season support
    const updatedForecast = weatherService.advanceTime(hours, currentDate);
    
    // Update stored forecast
    this.forecasts[regionId] = updatedForecast;
    
    // Log any season changes that occurred
    const currentSeasonInfo = weatherService.getCurrentSeasonInfo(currentDate);
    if (currentSeasonInfo.isTransitioning) {
      console.log(`[Solar Season] Region ${regionId} is transitioning: ${currentSeasonInfo.fromSeason || currentSeasonInfo.currentSeason} -> ${currentSeasonInfo.toSeason || currentSeasonInfo.currentSeason}`);
    }
    
    return updatedForecast;
  }

  /**
   * Extend forecast using stateless generation (for backward compatibility)
   * @param {string} regionId - Region identifier
   * @param {Array} currentForecast - Current 24-hour forecast
   * @param {number} hours - Hours to advance
   * @param {string} climate - Climate type
   * @param {string} season - Current season
   * @returns {Array} - Extended forecast
   */
  extendForecast(regionId, currentForecast, hours, climate, season) {
    console.log(`WeatherManager extending forecast for region ${regionId} by ${hours} hours`);
    
    if (!currentForecast || currentForecast.length === 0) {
      console.error(`No current forecast available for region ${regionId}`);
      return [];
    }

    // Get the weather service for this region
    let weatherService = this.weatherServices[regionId];
    
    if (!weatherService) {
      // Create a new service if one doesn't exist
      weatherService = new MeteorologicalWeatherService();
      this.weatherServices[regionId] = weatherService;
    }

    // Get the last forecast item to continue from
    const lastForecastItem = currentForecast[currentForecast.length - 1];
    const lastDate = new Date(lastForecastItem.date);
    
    // Calculate new start date (after the last forecast item)
    const newStartDate = new Date(lastDate);
    newStartDate.setHours(newStartDate.getHours() + 1);

    // Use advance time method
    const updatedForecast = this.advanceTime(regionId, hours, newStartDate);
    
    return updatedForecast;
  }

  /**
   * Get current weather for a region
   * @param {string} regionId - Region identifier
   * @returns {object|null} - Current weather data
   */
  getCurrentWeather(regionId) {
    const forecast = this.forecasts[regionId];
    return forecast && forecast.length > 0 ? forecast[0] : null;
  }

  /**
   * Get 24-hour forecast for a region
   * @param {string} regionId - Region identifier
   * @returns {Array} - 24-hour forecast array
   */
  get24HourForecast(regionId) {
    return this.forecasts[regionId] || [];
  }

  /**
   * Get season from date using solar angle calculation
   * @param {Date} date - Date to check
   * @param {number} latitude - Latitude for solar calculations (optional)
   * @returns {string} - Season name
   */
  getSeasonFromDate(date, latitude = 40) {
    return WeatherUtils.getSeasonFromDate(date, latitude);
  }

  /**
   * Get detailed season information for a region
   * @param {string} regionId - Region identifier
   * @param {Date} date - Date to check (optional, defaults to current)
   * @returns {object} - Detailed season information
   */
  getSeasonInfo(regionId, date = new Date()) {
    const weatherService = this.weatherServices[regionId];
    if (!weatherService) {
      console.error(`No weather service found for region ${regionId}`);
      return { error: "No weather service available" };
    }

    return weatherService.getCurrentSeasonInfo(date);
  }

  /**
   * Check if a region is experiencing a season transition
   * @param {string} regionId - Region identifier
   * @param {Date} date - Date to check (optional)
   * @returns {object} - Transition information
   */
  checkSeasonTransition(regionId, date = new Date()) {
    const weatherService = this.weatherServices[regionId];
    if (!weatherService) {
      return { isTransitioning: false, error: "No weather service available" };
    }

    return weatherService.checkSeasonTransition(date, weatherService.currentProfile);
  }

  /**
   * Get seasonal boundaries for a given latitude (informational)
   * @param {number} latitude - Latitude in degrees
   * @returns {object} - Season boundary information
   */
  getSeasonalBoundaries(latitude) {
    return WeatherUtils.getSeasonBoundaries(latitude);
  }

  /**
   * Update weather generation for all regions when date changes significantly
   * @param {Date} newDate - New date
   * @returns {object} - Update results for all regions
   */
  updateAllRegionsForDate(newDate) {
    const results = {};
    
    Object.keys(this.weatherServices).forEach(regionId => {
      const weatherService = this.weatherServices[regionId];
      if (weatherService && weatherService.currentProfile) {
        // Check if season has changed
        const oldSeason = weatherService.currentSeason;
        const newSeason = this.getSeasonFromDate(newDate, weatherService.currentProfile.latitude);
        
        if (oldSeason !== newSeason) {
          console.log(`[Solar Season] Region ${regionId} season changed: ${oldSeason} -> ${newSeason}`);
          
          // Reinitialize weather for the new season
          const newForecast = this.initializeWeather(
            regionId,
            weatherService.currentBiome,
            newSeason,
            newDate,
            weatherService.currentProfile
          );
          
          results[regionId] = {
            seasonChanged: true,
            oldSeason,
            newSeason,
            forecastUpdated: true,
            forecastLength: newForecast.length
          };
        } else {
          results[regionId] = {
            seasonChanged: false,
            currentSeason: newSeason
          };
        }
      }
    });
    
    return results;
  }

  /**
   * Clear weather data for a region
   * @param {string} regionId - Region identifier
   */
  clearRegionWeather(regionId) {
    delete this.weatherServices[regionId];
    delete this.forecasts[regionId];
    console.log(`Cleared weather data for region ${regionId}`);
  }

  /**
   * Clear all weather data
   */
  clearAllWeather() {
    this.weatherServices = {};
    this.forecasts = {};
    console.log("Cleared all weather data");
  }

  /**
   * Export weather state for persistence
   * @returns {object} - Serializable weather state
   */
  exportState() {
    return {
      forecasts: this.forecasts,
      // Note: Services are not exported as they contain complex state
      // They will be recreated when needed
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
      
      console.log("Imported weather state for", Object.keys(this.forecasts).length, "regions");
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

  /**
   * Get debug information for all regions
   * @returns {object} - Debug information
   */
  getDebugInfo() {
    const info = {
      totalRegions: Object.keys(this.weatherServices).length,
      activeForecasts: Object.keys(this.forecasts).length,
      regions: {}
    };

    Object.keys(this.weatherServices).forEach(regionId => {
      const service = this.weatherServices[regionId];
      const forecast = this.forecasts[regionId];
      
      info.regions[regionId] = {
        hasService: !!service,
        hasForecast: !!forecast,
        forecastLength: forecast ? forecast.length : 0,
        currentBiome: service?.currentBiome || 'unknown',
        currentSeason: service?.currentSeason || 'unknown',
        latitude: service?.currentProfile?.latitude || 'unknown',
        latitudeBand: service?.currentProfile?.latitudeBand || 'unknown'
      };
      
      // Add season info if available
      if (service) {
        try {
          const seasonInfo = service.getCurrentSeasonInfo();
          info.regions[regionId].seasonInfo = {
            season: seasonInfo.season,
            isTransitioning: seasonInfo.isTransitioning,
            method: seasonInfo.seasonalMethod,
            daylightHours: seasonInfo.daylightHours
          };
        } catch (e) {
          info.regions[regionId].seasonInfo = { error: e.message };
        }
      }
    });

    return info;
  }

  /**
   * Validate that all regions have consistent solar season data
   * @returns {object} - Validation results
   */
  validateSolarSeasons() {
    const validation = {
      valid: true,
      issues: [],
      regions: {}
    };

    Object.keys(this.weatherServices).forEach(regionId => {
      const service = this.weatherServices[regionId];
      const regionValidation = {
        hasProfile: !!service?.currentProfile,
        hasLatitude: !!(service?.currentProfile?.latitude),
        hasLatitudeBand: !!(service?.currentProfile?.latitudeBand),
        seasonMethod: 'unknown'
      };

      if (service?.currentProfile?.latitude) {
        const latitude = service.currentProfile.latitude;
        regionValidation.seasonMethod = this.getSeasonalMethod(latitude);
        
        // Check for reasonable latitude values
        if (Math.abs(latitude) > 90) {
          validation.valid = false;
          validation.issues.push(`Region ${regionId} has invalid latitude: ${latitude}`);
        }
        
        // Check for latitude/band consistency
        const expectedBand = this.getLatitudeBandFromDegrees(latitude);
        const actualBand = service.currentProfile.latitudeBand;
        if (actualBand && actualBand !== expectedBand) {
          validation.issues.push(`Region ${regionId} latitude band mismatch: expected ${expectedBand}, got ${actualBand}`);
        }
      } else {
        validation.valid = false;
        validation.issues.push(`Region ${regionId} missing latitude data`);
      }

      validation.regions[regionId] = regionValidation;
    });

    return validation;
  }

  /**
   * Get the seasonal method used for a given latitude
   * @param {number} latitude - Latitude in degrees
   * @returns {string} - Seasonal method name
   */
  getSeasonalMethod(latitude) {
    const absLat = Math.abs(latitude);
    if (absLat >= 66.5) return "polar-daylight";
    if (absLat >= 60) return "subpolar-mixed";
    if (absLat >= 30) return "temperate-solar";
    return "tropical-minimal";
  }

  /**
   * Convert latitude degrees to latitude band
   * @param {number} latitude - Latitude in degrees
   * @returns {string} - Latitude band name
   */
  getLatitudeBandFromDegrees(latitude) {
    const absLat = Math.abs(latitude);
    if (absLat >= 70) return "polar";
    if (absLat >= 60) return "subarctic";
    if (absLat >= 40) return "temperate";
    if (absLat >= 30) return "subtropical";
    return "tropical";
  }
}

// Singleton instance
const weatherManager = new WeatherManager();
export default weatherManager;