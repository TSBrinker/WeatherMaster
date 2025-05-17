// src/services/weatherManager.js
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
  initializeWeather(regionId, climate, season, date, type = 'diceTable') {
    console.log(`WeatherManager initializing weather for region ${regionId} with type ${type}`);
    
    // Force recreation of service to ensure latest code is used
    // This will ensure our fixes are applied even to existing regions
    console.log(`Forcing recreation of weather service for region ${regionId}`);
    this.weatherServices[regionId] = WeatherFactory.createWeatherService(type);
    this.weatherServiceTypes[regionId] = type;
    
    // Initialize weather
    this.weatherServices[regionId].initializeWeather(climate, season, date);
    
    // Store forecast
    this.forecasts[regionId] = this.weatherServices[regionId].get24HourForecast();
    
    console.log(`Weather initialized for region ${regionId}, forecast length: ${this.forecasts[regionId].length}`);
    
    return this.forecasts[regionId];
  }
  
  // Get forecast for a region
  getForecast(regionId) {
    return this.forecasts[regionId] || null;
  }
  
  // Advance time for a region
  advanceTime(regionId, hours, climate, season, currentDate) {
    console.log(`WeatherManager advancing time for region ${regionId} by ${hours} hours`);
    
    // Ensure a WeatherService instance exists
    if (!this.weatherServices[regionId]) {
      const type = this.weatherServiceTypes[regionId] || 'diceTable';
      console.warn(`No weather service found for region ${regionId}, creating new ${type} service`);
      this.weatherServices[regionId] = WeatherFactory.createWeatherService(type);
      this.initializeWeather(regionId, climate, season, currentDate, type);
    }
    
    // Check service type - if it's meteorological, make a debugging check
    if (this.weatherServiceTypes[regionId] === 'meteorological') {
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
    
    // Advance time
    this.weatherServices[regionId].advanceTime(hours, climate, season, currentDate);
    
    // Update forecast
    this.forecasts[regionId] = this.weatherServices[regionId].get24HourForecast();
    
    return this.forecasts[regionId];
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
      this.weatherServiceTypes = state.serviceTypes;
    }
  }
}

// Singleton instance
const weatherManager = new WeatherManager();
export default weatherManager;