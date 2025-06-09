// src/services/meteorological/WindService.js
// Service for wind-related calculations and patterns
// Meteorologically correct: Wind drives conditions, not the reverse

import { windIntensityEffects } from '../../data-tables/weather-effects';

class WindService {
  constructor() {
    // Wind directions
    this.windDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    
    // Wind change parameters
    this.parameters = {
      maxSpeedChange: 15,       // Maximum mph change per hour
      changeFrequency: 0.3,     // Probability of wind changing direction in an hour
      directionVariability: 1,  // How many steps in the wind rose winds can change at once
      
      // METEOROLOGICAL APPROACH: These are SUGGESTED ranges for typical conditions,
      // not hard limits. Wind can exceed these if atmospheric conditions warrant it.
      typicalWindRanges: {
        "Clear Skies": { min: 0, max: 15 },        // Can be calm OR windy with clear skies
        "Light Clouds": { min: 2, max: 20 },
        "Heavy Clouds": { min: 5, max: 25 },
        "Rain": { min: 5, max: 30 },
        "Heavy Rain": { min: 8, max: 35 },
        "Freezing Cold": { min: 0, max: 25 },      // Can be calm and cold
        "Snow": { min: 5, max: 30 },
        "Scorching Heat": { min: 0, max: 20 },     // Desert heat can be calm
        "Cold Winds": { min: 20, max: 45 },        // By definition, windy
        "Thunderstorm": { min: 15, max: 55 },
        "Blizzard": { min: 25, max: 70 },          // By definition, very windy
        "High Humidity Haze": { min: 0, max: 8 },  // Usually calm conditions
        "Cold Snap": { min: 5, max: 30 },
        
        // Additional conditions
        "Fog": { min: 0, max: 5 },                 // Fog needs calm conditions
        "Heavy Fog": { min: 0, max: 3 },
        "Hail": { min: 15, max: 45 },              // Requires strong updrafts
        "Sleet": { min: 8, max: 35 },
        "Freezing Rain": { min: 5, max: 25 }
      }
    };
  }

  /**
   * Initialize wind state with random direction and speed
   * @returns {object} - Initial wind state with direction and speed
   */
  initializeWind() {
    return {
      direction: this.getRandomWindDirection(),
      speed: 8 // More realistic starting wind speed
    };
  }

  /**
   * Get random wind direction
   * @returns {string} - Random wind direction (N, NE, E, etc.)
   */
  getRandomWindDirection() {
    return this.windDirections[Math.floor(Math.random() * this.windDirections.length)];
  }
  
  /**
   * Get wind intensity level based on wind speed
   * @param {number} windSpeed - Wind speed in mph
   * @returns {object} - Wind intensity information (level and effect)
   */
  getWindIntensity(windSpeed) {
    for (const [level, data] of Object.entries(windIntensityEffects)) {
      if (windSpeed >= data.min && windSpeed <= data.max) {
        return { level, effect: data.effect };
      }
    }
    return { level: "Calm", effect: windIntensityEffects["Calm"].effect };
  }

  /**
   * Generate wind speed based on atmospheric conditions (METEOROLOGICAL APPROACH)
   * Wind is calculated from pressure gradients, then conditions are determined
   * @param {number} pressureGradient - Pressure gradient strength
   * @param {Array} weatherSystems - Active weather systems
   * @param {number} temperature - Current temperature
   * @param {number} previousTemp - Previous temperature
   * @param {number} hour - Hour of day (0-23)
   * @returns {number} - Wind speed in mph
   */
  calculateWindFromAtmosphere(pressureGradient, weatherSystems, temperature, previousTemp, hour) {
    // BASE WIND: Start with pressure gradient effects
    let windSpeed = Math.abs(pressureGradient) * 3; // Strong pressure gradients = wind
    
    // WEATHER SYSTEM EFFECTS: Low pressure = more wind, high pressure = less wind
    if (weatherSystems && Array.isArray(weatherSystems)) {
      for (const system of weatherSystems) {
        const centralEffect = Math.max(0, 1 - Math.abs(system.position - 0.5));
        
        if (system.type === "low-pressure") {
          // Low pressure creates wind through pressure gradients
          windSpeed += system.intensity * centralEffect * 12;
        } else if (system.type === "high-pressure") {
          // High pressure generally calms winds
          windSpeed -= system.intensity * centralEffect * 6;
        } else if (system.type === "cold-front" || system.type === "warm-front") {
          // Fronts create significant wind as they pass
          if (system.age < 12) {
            windSpeed += system.intensity * centralEffect * 15;
          }
        }
      }
    }
    
    // TEMPERATURE DIFFERENTIAL: Temperature differences drive wind
    const tempDifferential = Math.abs(temperature - previousTemp);
    windSpeed += tempDifferential * 0.8;
    
    // DIURNAL EFFECTS: Natural daily wind patterns
    const hourAngle = (2 * Math.PI * hour) / 24;
    const diurnalEffect = Math.sin(hourAngle + Math.PI) * 3; // Peak in afternoon
    windSpeed += diurnalEffect;
    
    // RANDOM ATMOSPHERIC TURBULENCE
    const randomEffect = (Math.random() * 2 - 1) * 4; // ±4 mph
    windSpeed += randomEffect;
    
    // ENSURE REASONABLE BOUNDS: Wind can't be negative, rarely exceeds 80 mph
    return Math.max(0, Math.min(80, Math.round(windSpeed)));
  }

  /**
   * Get next wind direction (allowing only gradual changes)
   * @param {string} currentDirection - Current wind direction
   * @returns {string} - Next wind direction
   */
  getNextWindDirection(currentDirection) {
    const currentIndex = this.windDirections.indexOf(currentDirection);
    if (currentIndex === -1) {
      return this.getRandomWindDirection();
    }
    
    // Only change direction sometimes
    if (Math.random() > this.parameters.changeFrequency) {
      return currentDirection;
    }
    
    // Gradual direction changes
    const directionChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    const variability = this.parameters.directionVariability;
    const shift = directionChange * variability;
    
    const newIndex = (currentIndex + shift + this.windDirections.length) % this.windDirections.length;
    
    return this.windDirections[newIndex];
  }

  /**
   * Get next wind speed (allowing for gradual changes)
   * @param {number} currentSpeed - Current wind speed
   * @param {number} targetSpeed - Target wind speed from atmospheric calculations
   * @returns {number} - Next wind speed
   */
  getNextWindSpeed(currentSpeed, targetSpeed) {
    let speedDifference = targetSpeed - currentSpeed;
    
    // Add some atmospheric turbulence
    const randomFactor = (Math.random() * 2 - 1) * 3; // ±3 mph
    speedDifference += randomFactor;
    
    // Limit the change to prevent unrealistic jumps
    if (Math.abs(speedDifference) > this.parameters.maxSpeedChange) {
      speedDifference = Math.sign(speedDifference) * this.parameters.maxSpeedChange;
    }
    
    return Math.max(0, Math.round(currentSpeed + speedDifference));
  }
  
  /**
   * Check if wind speed is typical for a weather condition
   * This is for validation/warning purposes, not hard limits
   * @param {string} condition - Weather condition
   * @param {number} windSpeed - Wind speed in mph
   * @returns {object} - {isTypical: boolean, message: string}
   */
  validateWindForCondition(condition, windSpeed) {
    const range = this.parameters.typicalWindRanges[condition];
    if (!range) {
      return { isTypical: true, message: "" };
    }
    
    if (windSpeed < range.min) {
      return { 
        isTypical: false, 
        message: `Unusually calm for ${condition} (${windSpeed} mph, typical: ${range.min}-${range.max} mph)` 
      };
    } else if (windSpeed > range.max) {
      return { 
        isTypical: false, 
        message: `Unusually windy for ${condition} (${windSpeed} mph, typical: ${range.min}-${range.max} mph)` 
      };
    }
    
    return { isTypical: true, message: "" };
  }
  
  /**
   * MAIN METHOD: Update wind factors based on meteorological conditions
   * This follows the meteorological principle: atmospheric conditions → wind → weather conditions
   * @param {object} currentWind - Current wind state {direction, speed}
   * @param {number} hour - Hour of the day (0-23)
   * @param {number} temperature - Temperature in °F
   * @param {number} previousTemperature - Previous hour's temperature
   * @param {number} pressureTrend - Pressure trend in hPa/hour
   * @param {Array} weatherSystems - Active weather systems
   * @param {string} currentWeatherCondition - Current weather condition (for validation only)
   * @returns {object} - Updated wind state {direction, speed, validation}
   */
  updateWindFactors(
    currentWind,
    hour,
    temperature,
    previousTemperature,
    pressureTrend,
    weatherSystems,
    currentWeatherCondition = "Clear Skies"
  ) {
    // Ensure we have valid current wind
    if (!currentWind || typeof currentWind.speed !== 'number') {
      currentWind = this.initializeWind();
    }

    // STEP 1: Calculate target wind speed from atmospheric conditions
    const targetSpeed = this.calculateWindFromAtmosphere(
      pressureTrend,
      weatherSystems,
      temperature,
      previousTemperature,
      hour
    );

    // STEP 2: Apply gradual change to current wind speed
    const nextSpeed = this.getNextWindSpeed(currentWind.speed, targetSpeed);

    // STEP 3: Update wind direction based on systems and gradual change
    let nextDirection = currentWind.direction;
    
    // Check for system-driven direction changes
    let systemDirectionChange = false;
    if (weatherSystems && Array.isArray(weatherSystems)) {
      for (const system of weatherSystems) {
        const centralEffect = Math.max(0, 1 - Math.abs(system.position - 0.5));
        
        if ((system.type === "low-pressure" && centralEffect > 0.5) ||
            ((system.type === "cold-front" || system.type === "warm-front") && centralEffect > 0.6)) {
          if (Math.random() < 0.4) {
            systemDirectionChange = true;
            const directionIndex = this.windDirections.indexOf(currentWind.direction);
            if (directionIndex !== -1) {
              const shift = system.movementDirection > 0 ? 1 : -1;
              const newIndex = (directionIndex + shift + this.windDirections.length) % this.windDirections.length;
              nextDirection = this.windDirections[newIndex];
            }
            break; // Only one system affects direction per hour
          }
        }
      }
    }
    
    // If no system change, apply normal gradual change
    if (!systemDirectionChange) {
      nextDirection = this.getNextWindDirection(currentWind.direction);
    }

    // STEP 4: Validate against typical ranges (informational only)
    const validation = this.validateWindForCondition(currentWeatherCondition, nextSpeed);

    return {
      direction: nextDirection,
      speed: nextSpeed,
      validation: validation,
      atmosphericData: {
        targetSpeed: targetSpeed,
        pressureEffect: Math.abs(pressureTrend) * 3,
        systemEffect: weatherSystems ? weatherSystems.length * 5 : 0,
        tempEffect: Math.abs(temperature - previousTemperature) * 0.8
      }
    };
  }
}

export default WindService;