// src/services/meteorological/WeatherConditionService.js - ENHANCED FOR POLAR REGIONS
// Service for determining weather conditions from meteorological parameters

import { weatherEffects } from '../../data-tables/weather-effects';

class WeatherConditionService {
  constructor() {
    // This service is responsible for converting meteorological parameters into weather conditions
    this.thunderstormDuration = 0;  // Track how long thunderstorms have been active
    this.thunderstormEnergy = 0;    // Track energy of current thunderstorm
    this.lastCondition = null;      // Track previous condition
    this.stormCycleStage = 0;       // Track storm evolution through cycle stages
  }

  /**
   * Calculate atmospheric instability - key for thunderstorm formation
   * ENHANCED with polar region considerations
   * @param {number} temperature - Temperature in °F
   * @param {number} pressure - Atmospheric pressure in hPa
   * @param {number} pressureTrend - Pressure trend in hPa/hour
   * @param {number} recentPrecipitation - Recent precipitation amount (0-1)
   * @returns {number} - Instability value (0-10 scale)
   */
  calculateAtmosphericInstability(temperature, pressure, pressureTrend, recentPrecipitation) {
    // Ensure all parameters are numbers to prevent NaN
    temperature = Number(temperature) || 70;
    pressure = Number(pressure) || 1013;
    pressureTrend = Number(pressureTrend) || 0;
    recentPrecipitation = Number(recentPrecipitation) || 0;

    // This is a simplified model that considers:
    // - Temperature (warmer air = more instability)
    // - Pressure (lower pressure = more instability)
    // - Pressure trend (falling pressure = more instability)

    let instability = 0;

    // Temperature contribution - warmer air is more unstable
    // BUT in polar regions, even "warm" temperatures don't create much instability
    if (temperature > 70) {
      instability += (temperature - 70) * 0.1; // Up to 3-4 points for very hot temps
    } else if (temperature > 50) {
      // Moderate temperatures contribute less
      instability += (temperature - 50) * 0.05;
    }
    // Temperatures below 50°F contribute minimal instability

    // Low pressure increases instability
    if (pressure < 1013) {
      instability += (1013 - pressure) * 0.05; // Up to 2 points for low pressure
    }

    // Pressure trend contribution - falling pressure increases instability
    if (pressureTrend < 0) {
      instability += Math.abs(pressureTrend) * 5; // Up to 5 points for rapidly falling pressure
    }

    // Recent precipitation stabilizes the atmosphere - STRENGTHENED
    instability -= recentPrecipitation * 4; // Doubled from original 2
    
    // Add additional stabilization factor for prolonged precipitation
    if (recentPrecipitation > 0.5 && this.lastCondition === "Thunderstorm") {
      instability -= this.thunderstormDuration * 0.7; // Progressive stabilization
    }
    
    // Thunderstorm burnout - additional stability after prolonged thunderstorms
    if (this.stormCycleStage > 0) {
      instability -= this.stormCycleStage * 1.5;
    }

    // Add random component - slightly reduced variance
    instability += (Math.random() * 1.6) - 0.8; // Less random variation

    // Clamp to 0-10 scale
    return Math.max(0, Math.min(10, instability));
  }

  /**
   * Determine weather condition from meteorological factors
   * ENHANCED with latitude band awareness for polar regions
   * @param {number} temperature - Temperature in °F
   * @param {number} humidity - Relative humidity (0-100)
   * @param {number} pressure - Atmospheric pressure in hPa
   * @param {number} cloudCover - Cloud cover percentage (0-100)
   * @param {number} precipPotential - Precipitation potential (0-100)
   * @param {number} windSpeed - Wind speed in mph
   * @param {number} instability - Atmospheric instability (0-10)
   * @param {string} latitudeBand - Latitude band for region-specific logic
   * @returns {string} - Weather condition
   */
  determineWeatherCondition(
    temperature,
    humidity,
    pressure,
    cloudCover,
    precipPotential,
    windSpeed,
    instability,
    latitudeBand = "temperate"
  ) {
    // Ensure all parameters are valid numbers to prevent errors
    temperature = Number(temperature) || 70;
    humidity = Number(humidity) || 50;
    pressure = Number(pressure) || 1013;
    cloudCover = Number(cloudCover) || 30;
    precipPotential = Number(precipPotential) || 0;
    windSpeed = Number(windSpeed) || 5;
    instability = Number(instability) || 3;

    // Log inputs for debugging
    console.log("Weather determination inputs:", {
      temperature, humidity, pressure, cloudCover, 
      precipPotential, windSpeed, instability,
      latitudeBand,
      stormCycleStage: this.stormCycleStage
    });

    // Determine basic condition from cloud cover and precipitation
    let condition;

    // If we're in a storm cycle, follow the cycle progression
    if (this.stormCycleStage > 0) {
      this.stormCycleStage--;
      
      // Storm cycle progression stages
      if (this.stormCycleStage >= 6) {
        return temperature <= 32 ? "Snow" : "Heavy Rain";
      } else if (this.stormCycleStage >= 3) {
        return temperature <= 32 ? "Snow" : "Rain";
      } else if (this.stormCycleStage >= 1) {
        return "Light Clouds";
      }
      // When stormCycleStage reaches 0, we exit the cycle and calculate normally
    }

    // ENHANCED PRECIPITATION LOGIC WITH LATITUDE AWARENESS
    if (precipPotential > 75) {
      // POLAR/SUBARCTIC: Almost always snow if below freezing
      if ((latitudeBand === "polar" || latitudeBand === "subarctic") && temperature <= 35) {
        if (windSpeed > 25) {
          condition = "Blizzard";
        } else {
          condition = "Snow";
        }
      }
      // GENERAL: Temperature-based precipitation type
      else if (temperature <= 32) {
        if (windSpeed > 20) {
          condition = "Blizzard";
        } else {
          condition = "Snow";
        }
      } 
      // WARM PRECIPITATION: But check minimums for liquid precipitation
      else if (temperature >= 35 && precipPotential > 90) {
        condition = "Heavy Rain";
      } else if (temperature >= 33) {
        condition = "Rain";
      }
      // EDGE CASE: 32-35°F range - could be sleet/freezing rain, default to snow
      else {
        condition = "Snow";
      }
    } 
    // CLOUD CONDITIONS
    else if (cloudCover > 80) {
      condition = "Heavy Clouds";
    } else if (cloudCover > 30) {
      condition = "Light Clouds";
    } else {
      condition = "Clear Skies";
    }

    // ENHANCED THUNDERSTORM CONDITIONS WITH LATITUDE RESTRICTIONS
    // Polar regions rarely get thunderstorms, subarctic only in warm summer conditions
    const baseThunderstormConditions = precipPotential > 65 && 
                                      temperature > 50 && 
                                      instability > 7;
    
    let thunderstormConditionsMet = false;
    
    if (latitudeBand === "polar") {
      // Polar regions: no thunderstorms
      thunderstormConditionsMet = false;
    } else if (latitudeBand === "subarctic") {
      // Subarctic: only allow thunderstorms in quite warm conditions
      thunderstormConditionsMet = baseThunderstormConditions && temperature > 65;
    } else {
      // All other regions: normal thunderstorm conditions
      thunderstormConditionsMet = baseThunderstormConditions;
    }
    
    if (thunderstormConditionsMet) {
      // Check if we're already in a thunderstorm and track duration
      if (this.lastCondition === "Thunderstorm") {
        this.thunderstormDuration++;
        
        // Deplete thunderstorm energy over time
        this.thunderstormEnergy = Math.max(0, this.thunderstormEnergy - 0.8);
        
        // Realistic thunderstorm duration limits (most last 1-3 hours)
        if (this.thunderstormDuration >= 2) {
          // After 2 hours, increasing chance to transition out
          const transitionChance = Math.min(0.9, 0.4 + (this.thunderstormDuration - 2) * 0.25);
          
          if (Math.random() < transitionChance || this.thunderstormDuration > 4) {
            // Force transition to storm cycle starting with heavy rain
            this.stormCycleStage = 8 + Math.floor(Math.random() * 4); // 8-12 hour cycle
            this.thunderstormDuration = 0;
            this.thunderstormEnergy = 0;
            return temperature <= 32 ? "Snow" : "Heavy Rain"; // First stage of storm cycle
          }
        }
        
        // If energy is depleted, transition out regardless of duration
        if (this.thunderstormEnergy < 2) {
          this.stormCycleStage = 6 + Math.floor(Math.random() * 3); // 6-9 hour cycle
          this.thunderstormDuration = 0;
          this.thunderstormEnergy = 0;
          return temperature <= 32 ? "Snow" : "Heavy Rain";
        }
        
        condition = "Thunderstorm";
      } else {
        // Starting a new thunderstorm - check cooldown first
        if (this.stormCycleStage > 0) {
          // Still in cooldown from previous storm, don't start a new one
          // Continue with the standard condition
        } else {
          // Start a new thunderstorm
          this.thunderstormDuration = 1;
          this.thunderstormEnergy = instability * 1.2; // Initial energy based on instability
          condition = "Thunderstorm";
        }
      }
    } else if (this.lastCondition === "Thunderstorm") {
      // Just exited thunderstorm conditions, start the storm cycle
      this.stormCycleStage = 6 + Math.floor(Math.random() * 3); // 6-9 hour cycle
      this.thunderstormDuration = 0;
      this.thunderstormEnergy = 0;
      condition = temperature <= 32 ? "Snow" : "Heavy Rain"; // First stage of the cycle
    }

    // ENHANCED EXTREME TEMPERATURE CONDITIONS WITH LATITUDE AWARENESS
    if (latitudeBand === "polar") {
      // Polar regions: much lower thresholds for "extreme" conditions
      if (temperature > 45 && cloudCover < 40) {
        // Don't call it "scorching" in polar regions, just clear skies
        condition = "Clear Skies";
      } else if (temperature < -10) {
        condition = "Freezing Cold";
      }
    } else if (latitudeBand === "subarctic") {
      // Subarctic regions: moderate thresholds
      if (temperature > 75 && cloudCover < 40) {
        condition = "Scorching Heat";
      } else if (temperature < 0) {
        condition = "Freezing Cold";
      }
    } else {
      // Temperate and warmer regions: original thresholds
      if (temperature > 95 && cloudCover < 40) {
        condition = "Scorching Heat";
      } else if (temperature < 20) {
        condition = "Freezing Cold";
      }
    }

    // ENHANCED HIGH WINDS WITH LATITUDE CONSIDERATIONS
    if (windSpeed > 30) {
      if (latitudeBand === "polar" || latitudeBand === "subarctic") {
        // Cold regions: high winds with low temps = dangerous wind chill
        if (temperature < 32) {
          condition = "Blizzard"; // Even without precipitation, dangerous conditions
        } else {
          condition = "Cold Winds";
        }
      } else if (temperature < 40) {
        condition = "Cold Winds";
      }
    }

    // ENHANCED FOG CONDITIONS WITH LATITUDE SPECIFICITY
    if (latitudeBand === "polar") {
      // Polar fog often forms when relatively warm air moves over cold surfaces
      if (humidity > 85 && temperature > 28 && temperature < 40 && windSpeed < 8) {
        condition = "Fog";
      }
    } else if (latitudeBand === "subarctic") {
      // Subarctic fog conditions
      if (humidity > 88 && temperature < 50 && windSpeed < 8) {
        condition = "Fog";
      }
    } else {
      // Standard fog conditions for other regions
      if (humidity > 90 && cloudCover > 20 && temperature < 60 && windSpeed < 8) {
        condition = "Fog";
      } else if (humidity > 95 && cloudCover > 40 && temperature < 45 && windSpeed < 5) {
        condition = "Heavy Fog";
      }
    }

    // SPECIAL ARCTIC CONDITIONS
    if (latitudeBand === "polar" && windSpeed > 15 && temperature < 0) {
      // Arctic conditions with dangerous wind chill
      condition = "Blizzard";
    }

    // Log result for debugging
    console.log("Weather determination result:", condition, `for ${latitudeBand} region at ${temperature}°F`);

    // Update last condition for next iteration
    this.lastCondition = condition;
    
    return condition;
  }

  /**
   * Get weather effects description for a condition
   * @param {string} condition - Weather condition
   * @returns {string} - Description of weather effects
   */
  getWeatherEffects(condition) {
    return weatherEffects[condition] || "No special effects for this weather.";
  }

  /**
   * Check if the weather is precipitating
   * @param {string} condition - Weather condition
   * @returns {boolean} - True if precipitation is occurring
   */
  isPrecipitating(condition) {
    return [
      "Rain",
      "Heavy Rain",
      "Thunderstorm",
      "Snow",
      "Blizzard",
      "Sleet",
      "Freezing Rain"
    ].includes(condition);
  }

  /**
   * Generate celestial events (shooting stars, meteor impacts)
   * Enhanced to consider latitude band for aurora activity
   * @param {string} latitudeBand - Latitude band for aurora considerations
   * @returns {object} - Celestial events {shootingStar, meteorImpact, aurora}
   */
  generateCelestialEvents(latitudeBand = "temperate") {
    // Base chance for shooting star: 1%
    const hasShootingStar = Math.random() < 0.01;
    
    // If shooting star occurs, 5% chance of meteor impact
    const hasMeteorImpact = hasShootingStar && Math.random() < 0.05;
    
    // Aurora chances based on latitude
    let hasAurora = false;
    if (latitudeBand === "polar") {
      hasAurora = Math.random() < 0.15; // 15% chance in polar regions
    } else if (latitudeBand === "subarctic") {
      hasAurora = Math.random() < 0.05; // 5% chance in subarctic regions
    }
    // No aurora in lower latitudes under normal conditions
    
    return {
      shootingStar: hasShootingStar,
      meteorImpact: hasMeteorImpact,
      aurora: hasAurora
    };
  }
  
  /**
   * Reset weather condition tracking state
   * Useful when initializing a new region
   */
  resetState() {
    this.thunderstormDuration = 0;
    this.thunderstormEnergy = 0;
    this.lastCondition = null;
    this.stormCycleStage = 0;
  }
}

export default WeatherConditionService;