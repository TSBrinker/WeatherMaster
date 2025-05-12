// src/services/meteorological/WeatherConditionService.js
// Service for determining weather conditions from meteorological parameters

import { weatherEffects } from '../../data-tables/weather-effects';

class WeatherConditionService {
  constructor() {
    // This service is responsible for converting meteorological parameters into weather conditions
  }

  /**
   * Calculate atmospheric instability - key for thunderstorm formation
   * @param {number} temperature - Temperature in °F
   * @param {number} pressure - Atmospheric pressure in hPa
   * @param {number} pressureTrend - Pressure trend in hPa/hour
   * @param {number} recentPrecipitation - Recent precipitation amount (0-1)
   * @returns {number} - Instability value (0-10 scale)
   */
  calculateAtmosphericInstability(temperature, pressure, pressureTrend, recentPrecipitation) {
    // This is a simplified model that considers:
    // - Temperature (warmer air = more instability)
    // - Pressure (lower pressure = more instability)
    // - Pressure trend (falling pressure = more instability)

    let instability = 0;

    // Temperature contribution - warmer air is more unstable
    if (temperature > 70) {
      instability += (temperature - 70) * 0.1; // Up to 3-4 points for very hot temps
    }

    // Low pressure increases instability
    if (pressure < 1013) {
      instability += (1013 - pressure) * 0.05; // Up to 2 points for low pressure
    }

    // Pressure trend contribution - falling pressure increases instability
    if (pressureTrend < 0) {
      instability += Math.abs(pressureTrend) * 5; // Up to 5 points for rapidly falling pressure
    }

    // Recent precipitation stabilizes the atmosphere
    instability -= recentPrecipitation * 2; // Recent rain reduces instability

    // Add random component
    instability += Math.random() * 2 - 1;

    // Clamp to 0-10 scale
    return Math.max(0, Math.min(10, instability));
  }

  /**
   * Determine weather condition from meteorological factors
   * @param {number} temperature - Temperature in °F
   * @param {number} humidity - Relative humidity (0-100)
   * @param {number} pressure - Atmospheric pressure in hPa
   * @param {number} cloudCover - Cloud cover percentage (0-100)
   * @param {number} precipPotential - Precipitation potential (0-100)
   * @param {number} windSpeed - Wind speed in mph
   * @param {number} instability - Atmospheric instability (0-10)
   * @returns {string} - Weather condition
   */
  determineWeatherCondition(
    temperature,
    humidity,
    pressure,
    cloudCover,
    precipPotential,
    windSpeed,
    instability
  ) {
    // Determine basic condition from cloud cover and precipitation
    let condition;

    if (precipPotential > 75) {
      // High precipitation potential means precipitation
      if (temperature <= 32) {
        if (windSpeed > 20) {
          condition = "Blizzard";
        } else {
          condition = "Snow";
        }
      } else if (precipPotential > 90) {
        condition = "Heavy Rain";
      } else {
        condition = "Rain";
      }
    } else if (cloudCover > 80) {
      condition = "Heavy Clouds";
    } else if (cloudCover > 30) {
      condition = "Light Clouds";
    } else {
      condition = "Clear Skies";
    }

    // Check for thunderstorm conditions - requires warmth, humidity and instability
    if (precipPotential > 65 && temperature > 60 && instability > 7) {
      condition = "Thunderstorm";
    }

    // Check for extreme temperature conditions
    if (temperature > 95 && cloudCover < 40) {
      condition = "Scorching Heat";
    } else if (temperature < 20) {
      condition = "Freezing Cold";
    }

    // Special conditions check for high winds
    if (windSpeed > 30 && temperature < 40) {
      condition = "Cold Winds";
    } else if (temperature > 80 && humidity > 85 && cloudCover < 40) {
      condition = "High Humidity Haze";
    }
    
    // Add fog conditions
    if (humidity > 90 && cloudCover > 20 && temperature < 60 && windSpeed < 8) {
      condition = "Fog";
    } else if (humidity > 95 && cloudCover > 40 && temperature < 45 && windSpeed < 5) {
      condition = "Heavy Fog";
    }

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
   * @returns {object} - Celestial events {shootingStar, meteorImpact}
   */
  generateCelestialEvents() {
    // Base chance for shooting star: 1%
    const hasShootingStar = Math.random() < 0.01;
    
    // If shooting star occurs, 5% chance of meteor impact
    const hasMeteorImpact = hasShootingStar && Math.random() < 0.05;
    
    return {
      shootingStar: hasShootingStar,
      meteorImpact: hasMeteorImpact
    };
  }
}

export default WeatherConditionService;