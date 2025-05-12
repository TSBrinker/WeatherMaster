// src/services/meteorological/TemperatureService.js
// Service for temperature-related calculations in the meteorological system

class TemperatureService {
    constructor() {
      // Temperature constraints for weather conditions
      this.conditionTemperatureConstraints = {
        "Snow": { max: 32 }, // Snow can only form below freezing
        "Blizzard": { max: 30 }, // Blizzards are typically colder
        "Freezing Cold": { max: 32 }, // Freezing is defined by temperature
        "Scorching Heat": { min: 90 }, // Scorching heat should be hot
        "Cold Snap": { max: 40 } // Cold snaps are... cold
      };
    }
  
    /**
     * Calculate base temperature at initialization
     * @param {object} profile - Region profile
     * @param {object} seasonalBaseline - Seasonal baseline data
     * @param {Date} date - Current date
     * @param {number} hour - Current hour (0-23)
     * @returns {number} - Temperature in °F
     */
    calculateBaseTemperature(profile, seasonalBaseline, date, hour) {
      // Get the seasonal mean temperature
      const { mean, variance } = seasonalBaseline.temperature;
  
      // Add diurnal variation (time of day effect)
      const hourAngle = 2 * Math.PI * ((hour - 14) / 24); // Peak at 2PM
      const diurnalVariation = variance * 0.5 * Math.sin(hourAngle);
  
      // Add some randomness
      const randomFactor = (Math.random() * 2 - 1) * variance * 0.2;
  
      // Calculate baseline temperature
      return mean + diurnalVariation + randomFactor;
    }
  
    /**
     * Calculate temperature based on all physical factors
     * @param {object} profile - Region profile
     * @param {object} seasonalBaseline - Seasonal baseline data
     * @param {Date} date - Current date
     * @param {number} hour - Current hour (0-23)
     * @param {number} currentTemperature - Current temperature for inertia calculation
     * @param {number} cloudCover - Current cloud cover percentage
     * @param {Array} weatherSystems - Active weather systems
     * @param {Function} getRecentPrecipitation - Function to get recent precipitation
     * @param {Function} getDayOfYear - Function to get day of year
     * @returns {number} - Temperature in °F
     */
    calculateTemperature(
      profile, 
      seasonalBaseline, 
      date, 
      hour, 
      currentTemperature, 
      cloudCover, 
      weatherSystems, 
      getRecentPrecipitation,
      getDayOfYear
    ) {
      // Get the day of year for seasonal calculations
      const dayOfYear = getDayOfYear(date);
  
      // Calculate the seasonal factor - varies throughout the year (-1 to 1)
      // Northern hemisphere: negative in winter, positive in summer
      const seasonalFactor = Math.sin(2 * Math.PI * ((dayOfYear - 172) / 365));
  
      // Adjust for southern hemisphere if needed
      const adjustedSeasonalFactor =
        profile.latitude < 0 ? -seasonalFactor : seasonalFactor;
  
      // Latitude effect - stronger seasonal variations at higher latitudes
      const latitudeEffect = Math.abs(profile.latitude) / 90;
      const seasonalVariation =
        seasonalBaseline.temperature.variance *
        adjustedSeasonalFactor *
        latitudeEffect;
  
      // Diurnal (daily) cycle - peak at ~2-3pm, minimum at ~4-5am
      const hourAngle = 2 * Math.PI * ((hour - 14) / 24);
      const diurnalVariation =
        seasonalBaseline.temperature.variance * 0.5 * Math.sin(hourAngle);
  
      // Elevation effect - approximately -3.5°F per 1000ft
      const elevationEffect = -0.0035 * profile.elevation;
  
      // Maritime influence - reduces temperature extremes
      const maritimeEffect =
        profile.maritimeInfluence * 5 * (1 - Math.abs(adjustedSeasonalFactor));
  
      // Weather system effects on temperature
      const systemEffect = this.calculateSystemTemperatureEffect(weatherSystems);
  
      // Cloud cover effect - clouds reduce daytime heating and nighttime cooling
      const cloudEffect = this.calculateCloudTemperatureEffect(hour, cloudCover);
  
      // Get the baseline temperature from the seasonal mean
      const baseTemp = seasonalBaseline.temperature.mean;
  
      // Recent precipitation has cooling effect through evaporation
      const recentPrecip = getRecentPrecipitation();
      const precipEffect = recentPrecip * -5; // Cooling effect from evaporation
  
      // Random variation - weather isn't perfectly predictable
      const randomVariation = (Math.random() * 2 - 1) * 2;
  
      // Calculate final temperature
      let temp =
        baseTemp +
        seasonalVariation +
        diurnalVariation +
        elevationEffect +
        maritimeEffect +
        systemEffect +
        cloudEffect +
        precipEffect +
        randomVariation;
  
      // Inertia - temperature changes gradually, not instantly
      // If we have a previous temperature, blend with it
      if (currentTemperature !== null) {
        // Blend with 70% of new calculation, 30% of previous temperature
        temp = temp * 0.7 + currentTemperature * 0.3;
      }
  
      // Return the temperature, ensuring it's a reasonable value
      return Math.max(-60, Math.min(130, temp));
    }
  
    /**
     * Calculate how cloud cover affects temperature
     * @param {number} hour - Hour of the day (0-23)
     * @param {number} cloudCover - Cloud cover percentage (0-100)
     * @returns {number} - Temperature effect in °F
     */
    calculateCloudTemperatureEffect(hour, cloudCover) {
      // Cloud cover has different effects day vs night
      const isDay = hour >= 6 && hour < 18;
  
      if (isDay) {
        // During day, clouds block solar heating
        // Reduce temperature up to 10 degrees based on cloud cover
        return -10 * (cloudCover / 100);
      } else {
        // At night, clouds trap heat
        // Increase temperature up to 5 degrees based on cloud cover
        return 5 * (cloudCover / 100);
      }
    }
  
    /**
     * Calculate system temperature effect
     * @param {Array} weatherSystems - Active weather systems
     * @returns {number} - Temperature effect in °F
     */
    calculateSystemTemperatureEffect(weatherSystems) {
      let effect = 0;
  
      // Check all active weather systems
      for (const system of weatherSystems) {
        // How close is this system to the center of our region?
        const distanceFromCenter = Math.abs(system.position - 0.5) * 2; // 0-1 (0 = center, 1 = edge)
        const centralEffect = 1 - distanceFromCenter; // Stronger in center
  
        if (system.type === "cold-front") {
          // Cold fronts cause temperature drop
          if (system.age < 12) {
            // Front approaching
            effect -= system.intensity * centralEffect * 5; // Small drop ahead of front
          } else {
            // Front passing
            effect -= system.intensity * centralEffect * 15; // Larger drop after front
          }
        } else if (system.type === "warm-front") {
          // Warm fronts cause temperature rise
          effect += system.intensity * centralEffect * 10; // Up to +10°F
        }
      }
  
      return effect;
    }
  
    /**
     * Validate that temperatures make sense for the condition
     * @param {string} condition - Weather condition
     * @param {number} temperature - Temperature in °F
     * @returns {string} - Valid weather condition
     */
    validateConditionForTemperature(condition, temperature) {
      const constraints = this.conditionTemperatureConstraints[condition];
  
      if (!constraints) {
        return condition; // No constraints for this condition
      }
  
      const { min, max } = constraints;
  
      // Check if temperature violates constraints
      if (
        (min !== undefined && temperature < min) ||
        (max !== undefined && temperature > max)
      ) {
        console.log(
          `Condition ${condition} invalid at ${temperature}°F, adjusting...`
        );
  
        // Choose an alternative condition appropriate for the temperature
        if (condition === "Snow" || condition === "Blizzard") {
          return temperature > max ? "Rain" : condition;
        } else if (condition === "Freezing Cold") {
          return temperature > max ? "Heavy Clouds" : condition;
        } else if (condition === "Scorching Heat") {
          return temperature < min ? "Clear Skies" : condition;
        } else if (condition === "Cold Snap") {
          return temperature > max ? "Cold Winds" : condition;
        }
      }
  
      return condition; // No violations, keep original condition
    }
  
    /**
     * Validate that temperature makes sense for the condition
     * @param {number} temperature - Temperature in °F
     * @param {string} condition - Weather condition
     * @returns {number} - Valid temperature
     */
    validateTemperatureForCondition(temperature, condition) {
      const constraints = this.conditionTemperatureConstraints[condition];
      
      if (!constraints) {
        return temperature; // No constraints for this condition
      }
      
      const { min, max } = constraints;
      
      if (min !== undefined && temperature < min) {
        console.log(`Adjusting temperature for ${condition}: ${temperature}°F -> ${min}°F (minimum)`);
        return min;
      }
      
      if (max !== undefined && temperature > max) {
        console.log(`Adjusting temperature for ${condition}: ${temperature}°F -> ${max}°F (maximum)`);
        return max;
      }
      
      return temperature;
    }
  }
  
  export default TemperatureService;