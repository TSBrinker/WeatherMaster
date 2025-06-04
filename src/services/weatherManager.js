// src/services/weatherManager.js - DEBUG VERSION
// Singleton manager for weather services across regions

import WeatherFactory from './WeatherFactory';

class WeatherManager {
  constructor() {
    this.weatherServices = {}; // Will store a WeatherService instance per region
    this.weatherServiceTypes = {}; // Tracks which type of service each region uses
    this.forecasts = {}; // Will store forecast data per region
    
    console.log("WeatherManager initialized");
  }
  
  // Initialize weather for a region
  initializeWeather(regionId, climate, season, date, type = null) {
    console.log(`[WeatherManager] initializeWeather for region ${regionId}`);
    
    // ALWAYS check global preferences first - with detailed logging
    let globalPref = null;
    try {
      const savedPrefs = localStorage.getItem('gm-weather-companion-preferences');
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        globalPref = prefs.weatherSystem;
        console.log(`Found global weather system preference: ${globalPref}`);
      }
    } catch (e) {
      console.error("Error reading preferences:", e);
    }
    
    // CRITICAL FIX: Global preference takes priority over passed type
    const effectiveType = globalPref || type || 'diceTable';
    
    console.log(`EFFECTIVE WEATHER TYPE: ${effectiveType} (passed: ${type}, global: ${globalPref})`);
    
    // Store the service type consistently
    this.weatherServiceTypes[regionId] = effectiveType;
    
    // Force recreation of service
    console.log(`Creating new weather service for region ${regionId}: ${effectiveType}`);
    this.weatherServices[regionId] = WeatherFactory.createWeatherService(effectiveType);
    
    // Ensure climate is valid
    const safeClimate = climate || "temperate-deciduous";
    console.log(`Using climate: ${safeClimate}`);
    
    // Initialize weather
    this.weatherServices[regionId].initializeWeather(safeClimate, season, date);
    
    // Store forecast
    this.forecasts[regionId] = this.weatherServices[regionId].get24HourForecast();
    
    console.log(`[WeatherManager] Weather initialized for region ${regionId}`);
    console.log(`[WeatherManager] Forecast length: ${this.forecasts[regionId].length}`);
    console.log(`[WeatherManager] Forecast timespan: ${this.forecasts[regionId][0]?.date.toISOString()} to ${this.forecasts[regionId][this.forecasts[regionId].length - 1]?.date.toISOString()}`);
    
    return this.forecasts[regionId];
  }
  
  // Get forecast for a region
  getForecast(regionId) {
    return this.forecasts[regionId] || null;
  }
  
  // Original advanceTime method (keep for compatibility)
  advanceTime(regionId, hours, climate, season, currentDate) {
    console.log(`[WeatherManager] ⏰ advanceTime called for region ${regionId} by ${hours} hours`);
    
    // Ensure a WeatherService instance exists
    if (!this.weatherServices[regionId]) {
      const type = this._normalizeWeatherType(this.weatherServiceTypes[regionId] || 'diceTable');
      console.warn(`No weather service found for region ${regionId}, creating new ${type} service`);
      this.weatherServices[regionId] = WeatherFactory.createWeatherService(type);
      this.weatherServiceTypes[regionId] = type;
      this.initializeWeather(regionId, climate, season, currentDate, type);
    }
    
    // Check service type - if it's meteorological, make a debugging check
    if (this.weatherServiceTypes[regionId].toLowerCase() === 'meteorological') {
      const service = this.weatherServices[regionId];
      
      // Check if there are weather systems
      if (service.weatherSystemService && 
          (!service.weatherSystemService.weatherSystems || 
           service.weatherSystemService.weatherSystems.length === 0)) {
        console.error(`EMERGENCY: Weather systems missing before advancing time for region ${regionId}`);
        // Add default systems
        service.weatherSystemService.addDefaultSystems();
      }
    }
    
    console.log(`[WeatherManager] 📊 Before advanceTime: forecast length = ${this.forecasts[regionId]?.length}`);
    console.log(`[WeatherManager] 📊 Current forecast span: ${this.forecasts[regionId]?.[0]?.date.toISOString()} to ${this.forecasts[regionId]?.[this.forecasts[regionId].length - 1]?.date.toISOString()}`);
    
    // Always advance time normally here
    this.weatherServices[regionId].advanceTime(hours, climate, season, currentDate);
    
    // Update forecast
    this.forecasts[regionId] = this.weatherServices[regionId].get24HourForecast();
    
    console.log(`[WeatherManager] 📊 After advanceTime: forecast length = ${this.forecasts[regionId]?.length}`);
    console.log(`[WeatherManager] 📊 New forecast span: ${this.forecasts[regionId]?.[0]?.date.toISOString()} to ${this.forecasts[regionId]?.[this.forecasts[regionId].length - 1]?.date.toISOString()}`);
    
    // ADDED: Validate forecast continuity
    const forecast = this.forecasts[regionId];
    if (!forecast || forecast.length === 0) {
      console.error(`[WeatherManager] ❌ Empty forecast after advancing time for region ${regionId}, regenerating`);
      // Fallback: regenerate from scratch
      this.initializeWeather(regionId, climate, season, currentDate);
      this.forecasts[regionId] = this.weatherServices[regionId].get24HourForecast();
    } else if (forecast.length < 24) {
      console.warn(`[WeatherManager] ⚠️ Incomplete forecast (${forecast.length}/24 hours) for region ${regionId}`);
    }
    
    // CRITICAL: Check for time gaps in forecast
    this._validateForecastContinuity(regionId, forecast, 'advanceTime');
    
    console.log(`[WeatherManager] ✅ Weather advanced for region ${regionId}, forecast length: ${this.forecasts[regionId].length}`);
    return this.forecasts[regionId];
  }

  // NEW: Extend forecast method with fallback - ENHANCED DEBUG VERSION
  extendForecast(regionId, hours, climate, season, currentForecast) {
    console.log(`[WeatherManager] 🔄 extendForecast called for region ${regionId} by ${hours} hours`);
    console.log(`[WeatherManager] 📊 Input forecast length: ${currentForecast?.length}`);
    console.log(`[WeatherManager] 📊 Input forecast span: ${currentForecast?.[0]?.date.toISOString()} to ${currentForecast?.[currentForecast.length - 1]?.date.toISOString()}`);
    
    // Ensure weather service exists
    if (!this.weatherServices[regionId]) {
      const type = this._normalizeWeatherType(this.weatherServiceTypes[regionId] || 'diceTable');
      console.warn(`No weather service found for region ${regionId}, creating new ${type} service`);
      this.weatherServices[regionId] = WeatherFactory.createWeatherService(type);
      this.weatherServiceTypes[regionId] = type;
      // If no current forecast, initialize normally
      if (!currentForecast || currentForecast.length === 0) {
        const currentDate = new Date();
        currentDate.setHours(currentDate.getHours() + hours);
        return this.initializeWeather(regionId, climate, season, currentDate, type);
      }
    }
    
    // Validate current forecast
    if (!currentForecast || currentForecast.length === 0) {
      console.warn(`[WeatherManager] ⚠️ No current forecast provided for region ${regionId}, generating fresh forecast`);
      const currentDate = new Date();
      currentDate.setHours(currentDate.getHours() + hours);
      return this.initializeWeather(regionId, climate, season, currentDate);
    }
    
    // Check if the weather service has the extendForecast method
    if (typeof this.weatherServices[regionId].extendForecast === 'function') {
      console.log(`[WeatherManager] 🎯 Using weather service extendForecast method for region ${regionId}`);
      
      // Use the weather service to extend the forecast
      const extendedForecast = this.weatherServices[regionId].extendForecast(
        currentForecast,
        hours,
        climate,
        season
      );
      
      console.log(`[WeatherManager] 📊 Extended forecast length: ${extendedForecast?.length}`);
      console.log(`[WeatherManager] 📊 Extended forecast span: ${extendedForecast?.[0]?.date.toISOString()} to ${extendedForecast?.[extendedForecast.length - 1]?.date.toISOString()}`);
      
      // Update stored forecast
      this.forecasts[regionId] = extendedForecast;
      
      // Validate result
      if (!extendedForecast || extendedForecast.length !== 24) {
        console.error(`[WeatherManager] ❌ Invalid extended forecast for region ${regionId} (length: ${extendedForecast?.length}), regenerating`);
        const currentDate = new Date();
        currentDate.setHours(currentDate.getHours() + hours);
        return this.initializeWeather(regionId, climate, season, currentDate);
      }
      
      // CRITICAL: Check for time gaps in extended forecast
      this._validateForecastContinuity(regionId, extendedForecast, 'extendForecast');
      
      console.log(`[WeatherManager] ✅ Forecast extended for region ${regionId}: ${extendedForecast.length} hours from ${extendedForecast[0]?.date.toISOString()}`);
      return extendedForecast;
      
    } else {
      // FALLBACK: Manual forecast extension when service doesn't have the method
      console.warn(`[WeatherManager] ⚠️ Weather service for region ${regionId} doesn't have extendForecast method, using fallback`);
      
      return this.extendForecastManually(regionId, currentForecast, hours, climate, season);
    }
  }
  
  // Add this helper method to validate forecast continuity
  _validateForecastContinuity(regionId, forecast, context) {
    if (!forecast || forecast.length === 0) {
      console.error(`[WeatherManager] ❌ ${context}: EMPTY FORECAST for region ${regionId}!`);
      return;
    }

    console.log(`[WeatherManager] 🔍 ${context}: Validating forecast continuity for region ${regionId}`);
    console.log(`[WeatherManager] 📊 Forecast length: ${forecast.length}`);
    console.log(`[WeatherManager] 📊 Time span: ${forecast[0].date.toISOString()} to ${forecast[forecast.length - 1].date.toISOString()}`);

    // Check for time gaps
    const gaps = [];
    for (let i = 1; i < forecast.length; i++) {
      const prevTime = new Date(forecast[i - 1].date).getTime();
      const currTime = new Date(forecast[i].date).getTime();
      const hourDiff = (currTime - prevTime) / (1000 * 60 * 60);

      if (Math.abs(hourDiff - 1) > 0.1) { // Allow small floating point differences
        gaps.push({
          index: i,
          gap: hourDiff,
          from: forecast[i - 1].date.toISOString(),
          to: forecast[i].date.toISOString()
        });
      }
    }

    if (gaps.length > 0) {
      console.error(`[WeatherManager] ❌ ${context}: TIME GAPS FOUND in region ${regionId}:`, gaps);
      gaps.forEach(gap => {
        console.error(`[WeatherManager] 💥 Gap ${gap.index}: ${gap.gap.toFixed(1)}h between ${gap.from} and ${gap.to}`);
      });
    } else {
      console.log(`[WeatherManager] ✅ ${context}: No time gaps found in region ${regionId}`);
    }
    
    // Show first few hours for debugging
    console.log(`[WeatherManager] 🕐 ${context}: First 6 hours:`, 
      forecast.slice(0, 6).map(h => `${h.date.getHours()}:00=${h.condition}`)
    );
  }

  // Fallback method for forecast extension
  extendForecastManually(regionId, currentForecast, hours, climate, season) {
    console.log(`[WeatherManager] 🔧 Manual forecast extension for region ${regionId}`);
    
    // Make a copy of the current forecast
    const extendedForecast = [...currentForecast];
    
    // STEP 1: Generate new hours at the end
    const lastHour = extendedForecast[extendedForecast.length - 1];
    const lastHourTime = new Date(lastHour.date);
    
    console.log(`[WeatherManager] 🔧 Extending from: ${lastHourTime.toISOString()}`);
    
    // Simple approach: duplicate the last hour's pattern and modify slightly
    for (let i = 1; i <= hours; i++) {
      const newHourTime = new Date(lastHourTime);
      newHourTime.setHours(newHourTime.getHours() + i);
      
      // Create a new hour based on the last hour with small variations
      const newHour = {
        date: new Date(newHourTime),
        temperature: lastHour.temperature + (Math.random() * 4 - 2), // ±2 degree variation
        condition: lastHour.condition, // Keep same condition for simplicity
        windSpeed: Math.max(0, lastHour.windSpeed + (Math.random() * 6 - 3)), // ±3 mph variation
        windDirection: lastHour.windDirection,
        windIntensity: lastHour.windIntensity,
        effects: lastHour.effects
      };
      
      // Copy meteorological data if it exists
      if (lastHour._meteoData) {
        newHour._meteoData = {
          ...lastHour._meteoData,
          // Add small variations to meteorological parameters
          humidity: Math.max(0, Math.min(100, lastHour._meteoData.humidity + (Math.random() * 10 - 5))),
          pressure: lastHour._meteoData.pressure + (Math.random() * 2 - 1)
        };
      }
      
      extendedForecast.push(newHour);
      
      console.log(`[WeatherManager] 🔧 Generated hour ${i}/${hours}: ${newHourTime.toISOString()} - ${newHour.condition}`);
    }
    
    console.log(`[WeatherManager] 🔧 After extension: ${extendedForecast.length} hours`);
    
    // STEP 2: Remove the first N hours to shift the forecast forward
    const finalForecast = extendedForecast.slice(hours);
    
    console.log(`[WeatherManager] 🔧 After removing first ${hours} hours: ${finalForecast.length} hours`);
    console.log(`[WeatherManager] 🔧 New forecast starts at: ${finalForecast[0]?.date.toISOString()}`);
    
    // Update stored forecast
    this.forecasts[regionId] = finalForecast;
    
    return finalForecast;
  }
  
  // Get season from date
  getSeasonFromDate(date) {
    // Use any WeatherService instance (they all share the same method)
    const serviceId = Object.keys(this.weatherServices)[0];
    if (serviceId) {
      return this.weatherServices[serviceId].getSeasonFromDate(date);
    }
    
    // If no service exists yet, create a temporary one to get the season
    const tempService = WeatherFactory.createWeatherService();
    return tempService.getSeasonFromDate(date);
  }
  
  // Change weather service type for a region
  changeServiceType(regionId, newType) {
    console.log(`WeatherManager changing service type for region ${regionId} to ${newType}`);
    
    // Normalize weather type
    newType = this._normalizeWeatherType(newType);
    
    if (this.weatherServiceTypes[regionId] === newType) {
      console.log(`Region ${regionId} already using ${newType}`);
      return; // Already using this type
    }
    
    // Get the current state if possible
    const currentForecast = this.forecasts[regionId];
    let currentDate = new Date();
    let climate = 'temperate-deciduous';
    let season = 'auto';
    
    if (currentForecast && currentForecast.length > 0) {
      currentDate = currentForecast[0].date;
      // Note: we'd need to store climate and season somewhere to fully preserve state
    }
    
    // Create a new service and initialize it
    this.weatherServiceTypes[regionId] = newType;
    this.weatherServices[regionId] = WeatherFactory.createWeatherService(newType);
    this.initializeWeather(regionId, climate, season, currentDate, newType);
  }
  
  // Import/export weather state (for persistence)
  exportState() {
    return {
      forecasts: this.forecasts,
      serviceTypes: this.weatherServiceTypes
    };
  }
  
  importState(state) {
    if (state && state.forecasts) {
      this.forecasts = state.forecasts;
    }
    if (state && state.serviceTypes) {
      // Normalize all service types on import
      const normalizedTypes = {};
      for (const regionId in state.serviceTypes) {
        normalizedTypes[regionId] = this._normalizeWeatherType(state.serviceTypes[regionId]);
      }
      this.weatherServiceTypes = normalizedTypes;
    }
  }
  
  // Internal helper to normalize weather type strings
  _normalizeWeatherType(type) {
    // Default to diceTable if invalid
    if (!type || typeof type !== 'string') {
      return 'diceTable';
    }
    
    // Normalize to known values
    const lowerType = type.toLowerCase().trim();
    if (lowerType === 'meteorological') {
      return 'meteorological';
    }
    
    // All other values default to diceTable
    return 'diceTable';
  }
}

// Singleton instance
const weatherManager = new WeatherManager();
export default weatherManager;