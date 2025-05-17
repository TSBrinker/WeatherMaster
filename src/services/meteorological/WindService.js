// src/services/meteorological/WindService.js
// Service for wind-related calculations and patterns

import { windIntensityEffects } from '../../data-tables/weather-effects';
import { windParameters, baseWindSpeedRanges } from '../../data-tables/temperature-ranges';

class WindService {
  constructor() {
    // Wind directions
    this.windDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    
    // Wind parameters (from config)
    this.parameters = { 
      ...windParameters,
      baseWindSpeedRanges: baseWindSpeedRanges // Store this for condition-based limits
    };
  }

  /**
   * Initialize wind state with random direction and speed
   * @returns {object} - Initial wind state with direction and speed
   */
  initializeWind() {
    return {
      direction: this.getRandomWindDirection(),
      speed: 5 // Default starting wind speed (mph)
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
   * Generate a random wind speed for a condition
   * @param {string} condition - Weather condition
   * @returns {number} - Wind speed in mph
   */
  getRandomWindSpeed(condition) {
    const range = this.parameters.baseWindSpeedRanges[condition] || { min: 0, max: 10 };
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  /**
   * Get next wind direction (allowing only gradual changes)
   * @param {string} currentDirection - Current wind direction
   * @returns {string} - Next wind direction
   */
  getNextWindDirection(currentDirection) {
    const currentIndex = this.windDirections.indexOf(currentDirection);
    if (currentIndex === -1) {
      // Invalid direction, just pick a random one
      return this.getRandomWindDirection();
    }
    
    // Only change direction sometimes
    if (Math.random() > this.parameters.changeFrequency) {
      return currentDirection;
    }
    
    // Roll to determine direction change
    const directionChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    const variability = this.parameters.directionVariability;
    const shift = directionChange * variability;
    
    // Calculate new index with wrap-around
    const newIndex = (currentIndex + shift + this.windDirections.length) % this.windDirections.length;
    
    return this.windDirections[newIndex];
  }

  /**
   * Get next wind speed (allowing for more significant changes)
   * @param {number} currentSpeed - Current wind speed
   * @param {number} targetSpeed - Target wind speed
   * @returns {number} - Next wind speed
   */
  getNextWindSpeed(currentSpeed, targetSpeed) {
    // Determine how much the wind speed should change
    let speedDifference = targetSpeed - currentSpeed;
    
    // Add some randomness to the speed change - REDUCED from 5 to 3
    const randomFactor = (Math.random() * 2 - 1) * 3; // -3 to +3
    speedDifference += randomFactor;
    
    // Limit the change to the max allowed per hour
    if (Math.abs(speedDifference) > this.parameters.maxSpeedChange) {
      speedDifference = Math.sign(speedDifference) * this.parameters.maxSpeedChange;
    }
    
    // Ensure wind speed doesn't go negative
    return Math.max(0, Math.round(currentSpeed + speedDifference));
  }
  
  /**
   * Get condition-specific wind speed range
   * @param {string} condition - Weather condition
   * @returns {object} - Min/max wind speed range
   */
  getConditionWindRange(condition) {
    // Default range for unknown conditions
    const defaultRange = { min: 0, max: 10 };
    
    // Get range from baseWindSpeedRanges
    return this.parameters.baseWindSpeedRanges[condition] || defaultRange;
  }
  
  /**
   * Update wind factors based on meteorological conditions
   * @param {object} currentWind - Current wind state {direction, speed}
   * @param {number} hour - Hour of the day (0-23)
   * @param {number} temperature - Temperature in °F
   * @param {number} currentTemperature - Previous hour's temperature for differential
   * @param {number} pressureTrend - Pressure trend in hPa/hour
   * @param {Array} weatherSystems - Active weather systems
   * @param {string} currentWeatherCondition - Current weather condition
   * @returns {object} - Updated wind state {direction, speed}
   */
  updateWindFactors(
    currentWind,
    hour,
    temperature,
    currentTemperature,
    pressureTrend,
    weatherSystems,
    currentWeatherCondition = "Clear Skies" // Default to clear if not provided
  ) {
    // Log inputs for debugging
    console.log(`Wind update for condition: ${currentWeatherCondition}`);
    console.log(`Current wind: ${currentWind.speed} mph ${currentWind.direction}`);
    console.log(`Weather systems: ${weatherSystems ? weatherSystems.length : 0}`);
    
    // Calculate pressure gradient effect on wind speed - REDUCED from 8 to 5
    const pressureGradientEffect = Math.abs(pressureTrend) * 5;

    // Diurnal effect - winds often stronger in afternoon, calmer at night
    const hourFactor = Math.sin(2 * Math.PI * ((hour - 14) / 24)); // Peak at 2PM
    const diurnalEffect = hourFactor * 3; // Reduced from 5 to 3

    // Weather system effects
    let systemEffect = 0;
    let systemDirectionChange = false;
    let newDirection = currentWind.direction;

    // Check all weather systems
    if (Array.isArray(weatherSystems) && weatherSystems.length > 0) {
      for (const system of weatherSystems) {
        // Skip invalid systems
        if (!system) continue;
        
        // How close is this system to the center of our region?
        const distanceFromCenter = Math.abs(system.position - 0.5) * 2; // 0-1
        const centralEffect = 1 - distanceFromCenter; // Stronger in center

        if (system.type === "high-pressure" || system.type === "low-pressure") {
          // Both pressure systems affect wind speed - REDUCED from 8 to 5
          systemEffect += system.intensity * centralEffect * 5;

          // High pressure systems: winds blow clockwise and outward
          // Low pressure systems: winds blow counterclockwise and inward
          if (centralEffect > 0.5) {
            systemDirectionChange = true;

            // Wind direction depends on system position relative to center
            const directionIndex = this.windDirections.indexOf(currentWind.direction);
            if (directionIndex !== -1) {
              // Direction change depends on system type and relative position
              const isHighPressure = system.type === "high-pressure";
              const isRightSide = system.position > 0.5;

              // Calculate wind shift
              let shift = 0;
              if (isHighPressure && isRightSide) shift = 1;
              else if (isHighPressure && !isRightSide) shift = -1;
              else if (!isHighPressure && isRightSide) shift = -1;
              else shift = 1;

              // Apply the shift
              const newIndex =
                (directionIndex + shift + this.windDirections.length) %
                this.windDirections.length;
              newDirection = this.windDirections[newIndex];
            }
          }
        } else if (system.type === "cold-front" || system.type === "warm-front") {
          // Fronts temporarily increase wind speed as they pass - REDUCED from 12 to 8
          if (system.age < 12) {
            systemEffect += system.intensity * centralEffect * 8;

            // Fronts also affect wind direction
            if (centralEffect > 0.6) {
              systemDirectionChange = true;

              // Front's movement direction influences wind direction
              const directionIndex = this.windDirections.indexOf(currentWind.direction);
              if (directionIndex !== -1) {
                const movementFactor = system.movementDirection;
                const newIndex =
                  (directionIndex + movementFactor + this.windDirections.length) %
                  this.windDirections.length;
                newDirection = this.windDirections[newIndex];
              }
            }
          }
        }
      }
    } else {
      console.log("No weather systems available for wind calculation");
    }

    // Temperature differences drive wind - REDUCED from 1 to 0.5
    const tempDifferential = Math.abs(temperature - currentTemperature) * 0.5;

    // Random variation - REDUCED from -1.5/+1.5 to -1/+1
    const randomEffect = Math.random() * 2 - 1;

    // Calculate target wind speed - REDUCED base from 3 to 2
    const targetSpeed =
      2 +
      pressureGradientEffect +
      diurnalEffect +
      systemEffect +
      tempDifferential +
      randomEffect;

    // Wind speed changes gradually
    const nextSpeed = this.getNextWindSpeed(currentWind.speed, targetSpeed);

    // Check for wind direction change
    let nextDirection;
    if (systemDirectionChange) {
      // System-driven change
      nextDirection = newDirection;
    } else if (Math.random() < 0.3) {
      // Random direction change (30% chance per hour)
      nextDirection = this.getNextWindDirection(currentWind.direction);
    } else {
      nextDirection = currentWind.direction;
    }

    // Get condition-specific wind range
    const conditionWindRange = this.getConditionWindRange(currentWeatherCondition);
    
    // Calculate max allowed wind for this condition
    // Allow up to 30% higher than normal max if weather systems are active (reduced from 50%)
    const hasActiveSystems = systemEffect > 5;
    const conditionMaxWind = conditionWindRange.max * (hasActiveSystems ? 1.3 : 1.0);
    
    // Identify extreme weather conditions that allow higher winds
    const extremeWeatherTypes = ["Thunderstorm", "Blizzard", "High Winds", "Storm Force", "Gale Force"];
    const isExtremeWeather = extremeWeatherTypes.includes(currentWeatherCondition);
    
    // Determine max cap based on weather type - REDUCED normal cap from 50 to 40 mph
    const maxAllowedWind = isExtremeWeather 
      ? Math.min(80, conditionMaxWind) // Extreme weather can still reach 80 mph
      : Math.min(40, conditionMaxWind); // Normal weather capped at 40 mph
    
    const finalWindSpeed = Math.max(0, Math.min(maxAllowedWind, nextSpeed));
    
    // Log the calculation components for debugging
    console.log(`Wind calculation components:
      Base: 2
      Pressure gradient: ${pressureGradientEffect.toFixed(1)}
      Diurnal effect: ${diurnalEffect.toFixed(1)}
      System effect: ${systemEffect.toFixed(1)}
      Temp differential: ${tempDifferential.toFixed(1)}
      Random effect: ${randomEffect.toFixed(1)}
      Target speed: ${targetSpeed.toFixed(1)}
      Condition max: ${conditionMaxWind}
      Final wind speed: ${finalWindSpeed}`);
    
    return {
      direction: nextDirection,
      speed: finalWindSpeed
    };
  }
}

export default WindService;