// src/services/meteorological/TemperatureService.js
// Service for temperature-related calculations in the meteorological system

import sunriseSunsetService from '../SunriseSunsetService';

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
    
    // Biome temperature profiles for determining realistic temperature ranges
    this.biomeTemperatureRanges = {
      "tropical-rainforest": { min: 70, max: 95, amplitude: 8 },
      "tropical-seasonal": { min: 65, max: 100, amplitude: 15 },
      "desert": { min: 20, max: 115, amplitude: 30 },
      "temperate-grassland": { min: 5, max: 95, amplitude: 25 },
      "temperate-deciduous": { min: 10, max: 90, amplitude: 25 },
      "temperate-rainforest": { min: 35, max: 80, amplitude: 15 },
      "boreal-forest": { min: -10, max: 75, amplitude: 35 },
      "tundra": { min: -30, max: 60, amplitude: 40 }
    };
    
    // Temperature adjustments based on latitude bands
    this.latitudeBandAdjustments = {
      "equatorial": { minMod: +15, maxMod: +10, amplitude: 0.6 },
      "tropical": { minMod: +10, maxMod: +8, amplitude: 0.8 },
      "temperate": { minMod: 0, maxMod: 0, amplitude: 1.0 },
      "subarctic": { minMod: -10, maxMod: -5, amplitude: 1.2 },
      "polar": { minMod: -20, maxMod: -12, amplitude: 1.5 }
    };
  }

  /**
   * Calculate base temperature at initialization
   * @param {object} profile - Region profile
   * @param {object} seasonalBaseline - Seasonal baseline data (still used for variance)
   * @param {Date} date - Current date
   * @param {number} hour - Current hour (0-23)
   * @returns {number} - Temperature in °F
   */
  calculateBaseTemperature(profile, seasonalBaseline, date, hour) {
    // Calculate physics-based temperature from solar factors
    const dayOfYear = this.getDayOfYear(date);
    
    // Get biome temperature range
    const biomeRange = this.biomeTemperatureRanges[profile.biome] || 
                      this.biomeTemperatureRanges["temperate-deciduous"];
    
    // Apply latitude band adjustments to biome range
    const adjustedRange = this.adjustBiomeRangeForLatitude(
      biomeRange,
      profile.latitude, 
      profile.latitudeBand || "temperate"
    );
    
    // Calculate baseline temperature from solar angle and day of year
    const baseTemp = this.calculateSolarBasedTemperature(
      profile.latitude, 
      dayOfYear, 
      hour,
      adjustedRange,  // Use adjusted range here
      date,
      profile.latitudeBand || "temperate"
    );
    
    // Add some randomness - scale randomness by the seasonal variance
    const randomFactor = (Math.random() * 2 - 1) * 
                         (seasonalBaseline.temperature.variance * 0.2);
    
    return baseTemp + randomFactor;
  }
  
  /**
   * Adjust biome temperature range based on latitude
   * @param {object} biomeRange - Base temperature range for biome
   * @param {number} latitude - Latitude in degrees
   * @param {string} latitudeBand - Latitude band
   * @returns {object} - Adjusted temperature range
   */
  adjustBiomeRangeForLatitude(biomeRange, latitude, latitudeBand) {
    // Create a copy of the original range
    const adjustedRange = {...biomeRange};
    
    // Get latitude band adjustments
    const bandAdjustments = this.latitudeBandAdjustments[latitudeBand] || 
                            this.latitudeBandAdjustments["temperate"];
    
    // Apply the adjustments
    adjustedRange.min += bandAdjustments.minMod;
    adjustedRange.max += bandAdjustments.maxMod;
    adjustedRange.amplitude *= bandAdjustments.amplitude;
    
    return adjustedRange;
  }

  /**
   * Calculate temperature based on all physical factors
   * @param {object} profile - Region profile
   * @param {object} seasonalBaseline - Seasonal baseline data (used for variance values)
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
    // Get the day of year for solar calculations
    const dayOfYear = getDayOfYear ? getDayOfYear(date) : this.getDayOfYear(date);
    
    // Get biome temperature range
    const biomeRange = this.biomeTemperatureRanges[profile.biome] || 
                      this.biomeTemperatureRanges["temperate-deciduous"];
    
    // Apply latitude band adjustments to biome range
    const adjustedRange = this.adjustBiomeRangeForLatitude(
      biomeRange,
      profile.latitude, 
      profile.latitudeBand || "temperate"
    );
    
    // Get sunrise/sunset info
    const latitudeBand = profile.latitudeBand || "temperate";
    const { isDaytime } = sunriseSunsetService.getFormattedSunriseSunset(
      latitudeBand, 
      date
    );
    
    // PHYSICS-BASED TEMPERATURE CALCULATION
    // 1. Calculate baseline temperature from solar radiation and day of year
    const solarTemp = this.calculateSolarBasedTemperature(
      profile.latitude, 
      dayOfYear, 
      hour,
      adjustedRange,  // Use adjusted range here
      date,
      latitudeBand
    );
    
    // 2. Apply geographical adjustments
    // Elevation effect - approximately -3.5°F per 1000ft
    const elevationEffect = -0.0035 * profile.elevation;
    
    // Maritime influence - reduces temperature extremes
    const seasonalPosition = Math.sin(2 * Math.PI * ((dayOfYear - 172) / 365));
    const maritimeEffect = profile.maritimeInfluence * 5 * (1 - Math.abs(seasonalPosition));
    
    // 3. Weather system effects on temperature
    const systemEffect = this.calculateSystemTemperatureEffect(weatherSystems);
    
    // 4. Cloud cover effect - clouds reduce daytime heating and nighttime cooling
    const cloudEffect = this.calculateCloudTemperatureEffect(hour, cloudCover, date, latitudeBand);
    
    // 5. Recent precipitation has cooling effect through evaporation
    const recentPrecip = getRecentPrecipitation ? getRecentPrecipitation() : 0;
    const precipEffect = recentPrecip * -5; // Cooling effect from evaporation
    
    // 6. Random variation - weather isn't perfectly predictable
    const randomVariation = (Math.random() * 2 - 1) * 2;
    
    // Calculate final temperature
    let temp = solarTemp + 
               elevationEffect + 
               maritimeEffect + 
               systemEffect + 
               cloudEffect + 
               precipEffect + 
               randomVariation;
    
    // Apply temperature inertia - temperature changes gradually, not instantly
    if (currentTemperature !== null) {
      // Blend with 70% of new calculation, 30% of previous temperature
      temp = temp * 0.7 + currentTemperature * 0.3;
    }
    
    // Return the temperature, ensuring it's a reasonable value
    return Math.max(-60, Math.min(130, temp));
  }
  
  /**
   * Calculate temperature based on solar angle and day of year
   * @param {number} latitude - Latitude in degrees
   * @param {number} dayOfYear - Day of year (0-365)
   * @param {number} hour - Hour of day (0-23)
   * @param {object} biomeRange - Biome temperature range parameters
   * @param {Date} date - Current date
   * @param {string} latitudeBand - Latitude band
   * @returns {number} - Base temperature in °F
   */
  calculateSolarBasedTemperature(latitude, dayOfYear, hour, biomeRange, date, latitudeBand = "temperate") {
    // Get actual sunrise/sunset info
    const { sunrise, sunset, isDaytime, dayLengthHours } = sunriseSunsetService.getSunriseSunset(
      latitudeBand, 
      date
    );
    
    // Create hour date for solar position calculation
    const hourDate = new Date(date);
    hourDate.setHours(hour, 0, 0, 0);
    
    // Calculate how far through the day we are (0-1)
    const solarPosition = sunriseSunsetService.getSolarPosition(
      hourDate,
      sunrise,
      sunset
    );
    
    // 1. Seasonal factor - varies throughout the year (-1 to 1)
    const seasonalFactor = Math.sin(2 * Math.PI * ((dayOfYear - 172) / 365));
    
    // 2. Adjust for southern hemisphere if needed
    const adjustedSeasonalFactor = latitude < 0 ? -seasonalFactor : seasonalFactor;
    
    // 3. Calculate annual temperature oscillation based on biome amplitude
    const annualOscillation = biomeRange.amplitude * adjustedSeasonalFactor;
    
    // 4. Adjusting diurnal oscillation based on day length
    // Calculate normalized day length factor (shorter days = less heating)
    const normalDayLength = 12; // Reference "normal" day length in hours
    const dayLengthFactor = Math.min(1.3, Math.max(0.7, dayLengthHours / normalDayLength));
    
    // 5. Calculate diurnal factor based on solar position
    let diurnalFactor;
    
    // Check if we're in daylight hours
    if (solarPosition >= 0.25 && solarPosition < 0.75) {
      // Daytime: Peak at solar noon (0.5)
      // Normalize to -1 to 1 scale, where 1 is at solar noon
      diurnalFactor = 1 - Math.abs((solarPosition - 0.5) * 4);
    } else {
      // Nighttime: Coldest point is just before sunrise
      // For early night (0.75-1.0), temperature decreases
      // For late night (0.0-0.25), temperature starts increasing slightly
      if (solarPosition >= 0.75) {
        // Early night: cooling down (1.0 → 0.0)
        diurnalFactor = -((solarPosition - 0.75) * 4);
      } else {
        // Late night: coldest to slightly warming (−1.0 → -0.8)
        diurnalFactor = -1.0 + ((solarPosition / 0.25) * 0.2);
      }
    }
    
    // 6. Scale the diurnal oscillation and adjust by day length
    const diurnalAmplitude = biomeRange.amplitude * 0.4 * dayLengthFactor;
    const diurnalOscillation = diurnalAmplitude * diurnalFactor;
    
    // 7. Calculate mean annual temperature for this latitude and biome
    const meanAnnualTemp = (biomeRange.max + biomeRange.min) / 2;
    
    // 8. Final temperature: mean + seasonal variation + daily variation
    return meanAnnualTemp + annualOscillation + diurnalOscillation;
  }

  /**
   * Calculate how cloud cover affects temperature
   * @param {number} hour - Hour of the day (0-23)
   * @param {number} cloudCover - Cloud cover percentage (0-100)
   * @param {Date} date - Current date
   * @param {string} latitudeBand - Latitude band for sunrise/sunset calculation
   * @returns {number} - Temperature effect in °F
   */
  calculateCloudTemperatureEffect(hour, cloudCover, date, latitudeBand = "temperate") {
    // Get actual sunrise/sunset times
    const { sunrise, sunset, isDaytime } = sunriseSunsetService.getFormattedSunriseSunset(
      latitudeBand, 
      date
    );
    
    // Create a date object for the current hour
    const hourDate = new Date(date);
    hourDate.setHours(hour, 0, 0, 0);
    
    // Use actual daylight status instead of fixed hours
    const isDay = hourDate >= sunrise && hourDate <= sunset;

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
    if (Array.isArray(weatherSystems)) {
      for (const system of weatherSystems) {
        if (!system) continue; // Skip invalid systems
        
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

  /**
   * Calculate "feels like" temperature based on wind chill and heat index
   * @param {number} temperature - Actual temperature in °F
   * @param {number} humidity - Humidity percentage (0-100)
   * @param {number} windSpeed - Wind speed in mph
   * @returns {number} - "Feels like" temperature in °F
   */
  calculateFeelsLikeTemperature(temperature, humidity, windSpeed) {
    // Ensure parameters are valid numbers
    temperature = Number(temperature) || 0;
    humidity = Number(humidity) || 0;
    windSpeed = Number(windSpeed) || 0;
    
    // Wind chill for cold temperatures (<=50°F with wind)
    if (temperature <= 50 && windSpeed > 3) {
      // Wind chill formula (US National Weather Service)
      const windChill = 35.74 + (0.6215 * temperature) - 
                       (35.75 * Math.pow(windSpeed, 0.16)) + 
                       (0.4275 * temperature * Math.pow(windSpeed, 0.16));
      return Math.round(windChill);
    }
    
    // Heat index for warm temperatures (>=80°F with humidity)
    if (temperature >= 80 && humidity >= 40) {
      // Heat index formula (simplified version of Rothfusz regression)
      const heatIndex = -42.379 + 
                       (2.04901523 * temperature) + 
                       (10.14333127 * humidity) - 
                       (0.22475541 * temperature * humidity) - 
                       (0.00683783 * temperature * temperature) - 
                       (0.05481717 * humidity * humidity) + 
                       (0.00122874 * temperature * temperature * humidity) + 
                       (0.00085282 * temperature * humidity * humidity) - 
                       (0.00000199 * temperature * temperature * humidity * humidity);
      return Math.round(heatIndex);
    }
    
    // For temperatures between 50-80°F or with low wind/humidity, just use actual temp
    return Math.round(temperature);
  }
  
  /**
   * Calculate the day of year (0-365)
   * @param {Date} date - Date to calculate for
   * @returns {number} - Day of year
   */
  getDayOfYear(date) {
    // Check for valid date
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.error("Invalid date in getDayOfYear:", date);
      return 0;
    }
    
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }
}

export default TemperatureService;