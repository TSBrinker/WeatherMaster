// src/services/WeatherManager.js

import WeatherService from './weather-service';

class WeatherManager {
  constructor() {
    this.weatherServices = {}; // Will store a WeatherService instance per region
    this.forecasts = {}; // Will store forecast data per region
  }
  
  // Initialize weather for a region
  initializeWeather(regionId, climate, season, date) {
    // Create a new WeatherService instance if needed
    if (!this.weatherServices[regionId]) {
      this.weatherServices[regionId] = new WeatherService();
    }
    
    // Initialize weather
    this.weatherServices[regionId].initializeWeather(climate, season, date);
    
    // Store forecast
    this.forecasts[regionId] = this.weatherServices[regionId].get24HourForecast();
    
    return this.forecasts[regionId];
  }
  
  // Get forecast for a region
  getForecast(regionId) {
    return this.forecasts[regionId] || null;
  }
  
  // Advance time for a region
  advanceTime(regionId, hours, climate, season, currentDate) {
    // Ensure a WeatherService instance exists
    if (!this.weatherServices[regionId]) {
      this.weatherServices[regionId] = new WeatherService();
      this.initializeWeather(regionId, climate, season, currentDate);
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
    
    // If no service exists yet, create a temporary one
    const tempService = new WeatherService();
    return tempService.getSeasonFromDate(date);
  }
  
  // Import/export weather state (for persistence)
  exportState() {
    return {
      forecasts: this.forecasts
    };
  }
  
  importState(state) {
    if (state && state.forecasts) {
      this.forecasts = state.forecasts;
    }
  }
}

// Singleton instance
const weatherManager = new WeatherManager();
export default weatherManager;