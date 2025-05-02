// services/regionWeatherService.js
// Enhanced weather service that supports region-based weather and transitions

import WeatherService from './weather-service';
import { mapBiomeToClimate } from '../utils/weatherUtils';

class RegionWeatherService {
  constructor() {
    // Create a weather service instance for each region
    this.weatherServices = {};
    
    // Track current transition state
    this.inTransition = false;
    this.sourceRegion = null;
    this.targetRegion = null;
    this.transitionProgress = 0;
    
    // Transition settings
    this.transitionDuration = 12; // Hours to transition between regions
  }
  
  // Get or create a weather service for a specific region
  getRegionWeatherService(regionId) {
    if (!this.weatherServices[regionId]) {
      this.weatherServices[regionId] = new WeatherService();
    }
    return this.weatherServices[regionId];
  }
  
  // Initialize weather for a region
  initializeRegionWeather(region, date) {
    if (!region) return null;
    
    const regionService = this.getRegionWeatherService(region.id);
    
    // Map region climate to appropriate biome for weather service
    const biome = this.getRegionBiome(region);
    
    // Initialize with region settings
    return regionService.initializeWeather(biome, 'auto', date);
  }
  
  // Advance time for a region
  advanceRegionTime(region, hours, date) {
    if (!region) return null;
    
    const regionService = this.getRegionWeatherService(region.id);
    const biome = this.getRegionBiome(region);
    
    return regionService.advanceTime(hours, biome, 'auto', date);
  }
  
  // Get 24-hour forecast for a region
  getRegionForecast(region) {
    if (!region) return [];
    
    const regionService = this.getRegionWeatherService(region.id);
    return regionService.get24HourForecast();
  }
  
  // Get biome name from region climate
  getRegionBiome(region) {
    // Default to temperate if region or climate is missing
    if (!region || !region.climate) return 'temperate';
    
    // Find the UI biome name for this climate
    const climateMap = mapBiomeToClimate();
    
    // Inverse lookup - find key by value
    for (const [biomeName, climate] of Object.entries(climateMap)) {
      if (climate === region.climate) {
        return biomeName;
      }
    }
    
    // Default fallback
    return 'temperate';
  }
  
  // Start a transition between regions
  startTransition(sourceRegion, targetRegion) {
    this.inTransition = true;
    this.sourceRegion = sourceRegion;
    this.targetRegion = targetRegion;
    this.transitionProgress = 0;
    
    // Make sure both regions have initialized weather
    this.initializeRegionWeather(sourceRegion, new Date());
    this.initializeRegionWeather(targetRegion, new Date());
    
    return this.getTransitionWeather();
  }
  
  // Advance transition progress
  advanceTransition(hours) {
    if (!this.inTransition) return null;
    
    // Advance the transition progress
    this.transitionProgress += hours / this.transitionDuration;
    
    // If transition is complete, end it
    if (this.transitionProgress >= 1) {
      this.inTransition = false;
      this.transitionProgress = 1;
      
      // Return the target region's weather
      return this.getRegionForecast(this.targetRegion);
    }
    
    // Otherwise return the blended transitional weather
    return this.getTransitionWeather();
  }
  
  // Get current weather during a transition
  getTransitionWeather() {
    if (!this.inTransition || !this.sourceRegion || !this.targetRegion) {
      return null;
    }
    
    // Get forecasts from both regions
    const sourceForecast = this.getRegionForecast(this.sourceRegion);
    const targetForecast = this.getRegionForecast(this.targetRegion);
    
    // If either forecast is missing, return the other
    if (!sourceForecast || sourceForecast.length === 0) {
      return targetForecast;
    }
    if (!targetForecast || targetForecast.length === 0) {
      return sourceForecast;
    }
    
    // Blend the forecasts based on progress
    return this.blendForecasts(sourceForecast, targetForecast, this.transitionProgress);
  }
  
  // Blend two forecasts based on transition progress
  blendForecasts(sourceForecast, targetForecast, progress) {
    // Create a new forecast array with the same length as source (using the shorter length if different)
    const blendedForecast = [];
    const forecastLength = Math.min(sourceForecast.length, targetForecast.length);
    
    for (let i = 0; i < forecastLength; i++) {
      const sourceHour = sourceForecast[i];
      const targetHour = targetForecast[i];
      
      // For the condition, we'll use a weighted random selection
      // As progress increases, chance of using target condition increases
      const useTargetCondition = Math.random() < progress;
      const condition = useTargetCondition ? targetHour.condition : sourceHour.condition;
      
      // For numerical values, do a weighted average
      const temperature = Math.round(
        sourceHour.temperature * (1 - progress) + 
        targetHour.temperature * progress
      );
      
      // For wind, we'll blend both direction and speed
      // Wind direction transition - find shortest path around compass
      const sourceWindDir = this.windDirectionToAngle(sourceHour.windDirection);
      const targetWindDir = this.windDirectionToAngle(targetHour.windDirection);
      
      // Find the shortest path around the compass
      let angleDiff = targetWindDir - sourceWindDir;
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;
      
      const blendedAngle = (sourceWindDir + (angleDiff * progress) + 360) % 360;
      const windDirection = this.angleToWindDirection(blendedAngle);
      
      // Blend wind speed
      const windSpeed = Math.round(
        sourceHour.windSpeed * (1 - progress) +
        targetHour.windSpeed * progress
      );
      
      // Get corresponding wind intensity based on blended speed
      const windIntensity = this.getWindIntensityForSpeed(windSpeed);
      
      // Blend celestial events - if either has an event, keep it
      const hasShootingStar = sourceHour.hasShootingStar || targetHour.hasShootingStar;
      const hasMeteorImpact = sourceHour.hasMeteorImpact || targetHour.hasMeteorImpact;
      
      // Create the blended effects description
      let effects = `You are traveling between regions. `;
      
      // As progress increases, blend more toward target region's effects
      if (progress < 0.25) {
        effects += `${sourceHour.effects} The climate is beginning to change as you travel.`;
      } else if (progress < 0.75) {
        effects += `You're experiencing a mixture of weather from both regions. `;
        effects += useTargetCondition ? targetHour.effects : sourceHour.effects;
      } else {
        effects += `${targetHour.effects} You're almost at your destination.`;
      }
      
      // Build the blended hour
      blendedForecast.push({
        condition,
        temperature,
        hour: sourceHour.hour,
        date: sourceHour.date,
        windDirection,
        windSpeed,
        windIntensity,
        effects,
        hasShootingStar,
        hasMeteorImpact,
        isTransitional: true,
        transitionProgress: progress
      });
    }
    
    return blendedForecast;
  }
  
  // Convert wind direction to angle (degrees)
  windDirectionToAngle(direction) {
    const directionMap = {
      'N': 0,
      'NE': 45,
      'E': 90,
      'SE': 135,
      'S': 180,
      'SW': 225,
      'W': 270,
      'NW': 315
    };
    
    return directionMap[direction] || 0;
  }
  
  // Convert angle back to wind direction
  angleToWindDirection(angle) {
    // Normalize angle to 0-359
    angle = (angle + 360) % 360;
    
    // Convert angle to nearest compass direction
    if (angle < 22.5) return 'N';
    if (angle < 67.5) return 'NE';
    if (angle < 112.5) return 'E';
    if (angle < 157.5) return 'SE';
    if (angle < 202.5) return 'S';
    if (angle < 247.5) return 'SW';
    if (angle < 292.5) return 'W';
    if (angle < 337.5) return 'NW';
    return 'N';
  }
  
  // Get wind intensity level for a given speed
  getWindIntensityForSpeed(speed) {
    if (speed <= 5) return 'Calm';
    if (speed <= 14) return 'Breezy';
    if (speed <= 25) return 'Windy';
    if (speed <= 39) return 'Strong Winds';
    if (speed <= 54) return 'Gale Force';
    return 'Storm Force';
  }
  
  // Check if transition is active
  isInTransition() {
    return this.inTransition;
  }
  
  // Get transition information
  getTransitionInfo() {
    if (!this.inTransition) return null;
    
    return {
      sourceRegion: this.sourceRegion,
      targetRegion: this.targetRegion,
      progress: this.transitionProgress,
      remainingHours: Math.ceil(this.transitionDuration * (1 - this.transitionProgress))
    };
  }
  
  // End a transition immediately (arrive at destination)
  endTransition() {
    if (!this.inTransition) return null;
    
    this.inTransition = false;
    this.transitionProgress = 1;
    
    // Return the target region's weather
    return this.getRegionForecast(this.targetRegion);
  }
}

export default RegionWeatherService
