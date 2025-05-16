// src/services/meteorological/AtmosphericService.js - FIXED VERSION
// Service for atmospheric conditions like humidity, pressure, and cloud cover

class AtmosphericService {
  constructor() {
    // Pressure history for tracking trends
    this.pressureHistory = [];
    this.pressureTrend = 0;
    
    // Tracking previous weather states
    this.lastCondition = null;
    this.stormCooldownPeriod = 0; // Track cooldown after storms
    this.precipitationExhaustion = 0; // Track precipitation system exhaustion
  }

  /**
   * Calculate base humidity at initialization
   * @param {object} profile - Region profile
   * @param {object} seasonalBaseline - Seasonal baseline data
   * @param {Date} date - Current date
   * @param {number} hour - Current hour (0-23)
   * @returns {number} - Humidity percentage (0-100)
   */
  calculateBaseHumidity(profile, seasonalBaseline, date, hour) {
    // Get the seasonal mean humidity
    const { mean = 50, variance = 10 } = seasonalBaseline?.humidity || {};

    // Diurnal cycle - humidity typically higher at night, lower during day
    const hourAngle = 2 * Math.PI * ((hour - 2) / 24); // Peak around 2AM
    const diurnalVariation = variance * 0.3 * Math.sin(hourAngle);

    // Add some randomness
    const randomFactor = (Math.random() * 2 - 1) * variance * 0.2;

    // Calculate baseline humidity
    const humidity = mean + diurnalVariation + randomFactor;

    // Ensure value is within valid range
    return Math.max(0, Math.min(100, humidity));
  }

  /**
   * Calculate humidity based on all factors
   * @param {object} profile - Region profile
   * @param {object} seasonalBaseline - Seasonal baseline data
   * @param {Date} date - Current date
   * @param {number} hour - Current hour (0-23)
   * @param {number} currentHumidity - Current humidity for inertia calculation
   * @param {number} currentTemperature - Current temperature
   * @param {Array} weatherSystems - Active weather systems
   * @param {Function} getRecentPrecipitation - Function to get recent precipitation
   * @param {Function} getDayOfYear - Function to get day of year
   * @returns {number} - Humidity percentage (0-100)
   */
  calculateHumidity(
    profile,
    seasonalBaseline,
    date,
    hour,
    currentHumidity,
    currentTemperature,
    weatherSystems,
    getRecentPrecipitation,
    getDayOfYear
  ) {
    // Safety check for parameters to prevent NaN
    if (!profile || !seasonalBaseline) {
      console.error("Missing profile or seasonalBaseline in calculateHumidity");
      return 50; // Return default humidity
    }
    
    // Ensure all numeric inputs are valid numbers
    currentHumidity = Number(currentHumidity) || 50;
    currentTemperature = Number(currentTemperature) || 70;
    
    // Get the day of year for seasonal calculations
    let dayOfYear;
    try {
      dayOfYear = getDayOfYear(date);
    } catch (error) {
      console.error("Error getting day of year:", error);
      dayOfYear = 0;
    }

    // Get profile humidity peak day with fallback
    const peakDay = profile.humidityProfile?.peakDay || 180;
    
    // Seasonal factor - some regions have wet/dry seasons
    const seasonalOffset = Math.sin(
      2 * Math.PI * ((dayOfYear - peakDay) / 365)
    );
    
    const humidityVariance = seasonalBaseline.humidity?.variance || 10;
    const seasonalVariation = humidityVariance * 0.3 * seasonalOffset;

    // Diurnal cycle - humidity typically higher at night, lower during day
    const hourAngle = 2 * Math.PI * ((hour - 2) / 24); // Peak around 2AM
    const diurnalVariation = humidityVariance * 0.3 * Math.sin(hourAngle);

    // Temperature effect - higher temperatures generally lower relative humidity
    // This is a simplified model - in reality, it depends on absolute humidity
    const tempEffect =
      (currentTemperature - (seasonalBaseline.temperature?.mean || 70)) * -0.5;

    // Maritime influence increases humidity
    const maritimeEffect = (profile.maritimeInfluence || 0.5) * 10;

    // Weather system effects
    let systemEffect = 0;

    // Each system contributes to humidity based on type and intensity
    if (Array.isArray(weatherSystems)) {
      for (const system of weatherSystems) {
        if (!system) continue;
        
        // How close is this system to the center of our region?
        const distanceFromCenter = Math.abs(system.position - 0.5) * 2; // 0-1
        const centralEffect = 1 - distanceFromCenter; // Stronger in center
  
        if (system.type === "low-pressure") {
          // Low pressure systems increase humidity
          systemEffect += system.intensity * centralEffect * 20;
        } else if (system.type === "high-pressure") {
          // High pressure systems decrease humidity
          systemEffect -= system.intensity * centralEffect * 15;
        } else if (system.type === "warm-front") {
          // Warm fronts bring moisture
          systemEffect += system.intensity * centralEffect * 25;
        } else if (system.type === "cold-front") {
          // Cold fronts initially increase humidity, then decrease it
          if (system.age < 8) {
            systemEffect += system.intensity * centralEffect * 15;
          } else {
            systemEffect -= system.intensity * centralEffect * 10;
          }
        }
      }
    }

    // Recent precipitation increases humidity, but with diminishing returns
    let recentPrecip = 0;
    try {
      recentPrecip = getRecentPrecipitation() || 0;
    } catch (error) {
      console.error("Error getting recent precipitation:", error);
    }
    
    let precipEffect = recentPrecip * 15;
    
    // Apply precipitation exhaustion to prevent self-perpetuating cycles
    if (this.precipitationExhaustion > 0) {
      precipEffect *= (1 - (this.precipitationExhaustion / 12));
    }

    // Random variation
    const randomVariation = (Math.random() * 2 - 1) * 3;

    // Get base humidity from seasonal mean
    const baseHumidity = seasonalBaseline.humidity?.mean || 50;

    // Calculate final humidity
    let humidity =
      baseHumidity +
      seasonalVariation +
      diurnalVariation +
      tempEffect +
      maritimeEffect +
      systemEffect +
      precipEffect +
      randomVariation;

    // Humidity has inertia - it changes gradually
    if (currentHumidity !== null) {
      // Blend with 80% of new calculation, 20% of previous humidity
      humidity = humidity * 0.8 + currentHumidity * 0.2;
    }
    
    // Apply storm cooldown effect
    if (this.stormCooldownPeriod > 0) {
      // After a storm, atmosphere dries out temporarily
      humidity -= this.stormCooldownPeriod * 2;
      this.stormCooldownPeriod--;
    }

    // Ensure value is within valid range
    return Math.max(0, Math.min(100, humidity));
  }

  /**
   * Calculate base pressure at initialization
   * @param {object} profile - Region profile
   * @param {Date} date - Current date
   * @returns {number} - Pressure in hPa
   */
  calculateBasePressure(profile, date) {
    // Standard sea level pressure is 1013.25 hPa
    const standardPressure = 1013.25;

    // Safety check for profile
    if (!profile) {
      console.error("Missing profile in calculateBasePressure");
      return standardPressure;
    }

    // Pressure decreases with elevation (approx -0.12 hPa per meter)
    const elevation = Number(profile.elevation) || 0;
    const elevationFactor = -0.12 * (elevation / 3.281); // Convert feet to meters

    // Seasonal variations - slightly higher in winter, lower in summer
    const month = date instanceof Date ? date.getMonth() : 0;
    let seasonalOffset = 0;

    // Northern hemisphere seasons
    if (profile.latitude >= 0) {
      if (month >= 11 || month <= 1) seasonalOffset = 5; // Winter
      else if (month >= 5 && month <= 7) seasonalOffset = -5; // Summer
    }
    // Southern hemisphere (opposite seasons)
    else {
      if (month >= 11 || month <= 1) seasonalOffset = -5; // Summer
      else if (month >= 5 && month <= 7) seasonalOffset = 5; // Winter
    }

    // Random initial variation (+/- 10 hPa)
    const randomVariation = Math.random() * 20 - 10;

    // Calculate base pressure
    return (
      standardPressure + elevationFactor + seasonalOffset + randomVariation
    );
  }

  /**
   * Calculate pressure for a specific hour
   * @param {object} profile - Region profile
   * @param {Date} date - Current date
   * @param {number} hour - Current hour (0-23)
   * @param {number} currentPressure - Current pressure
   * @param {Array} weatherSystems - Active weather systems
   * @returns {number} - Pressure in hPa
   */
  calculatePressure(profile, date, hour, currentPressure, weatherSystems) {
    // Ensure inputs are valid numbers
    currentPressure = Number(currentPressure) || 1013.25;
    hour = Number(hour) || 0;

    // Diurnal cycle - small pressure variations through the day
    // Typically has two peaks and two troughs each day
    const hourAngle = 4 * Math.PI * (hour / 24);
    const diurnalVariation = 0.5 * Math.sin(hourAngle);

    // Weather system effects
    let systemEffect = 0;

    // Calculate effect from each weather system
    if (Array.isArray(weatherSystems)) {
      for (const system of weatherSystems) {
        if (!system) continue;
        
        // How close is this system to the center of our region?
        const distanceFromCenter = Math.abs(system.position - 0.5) * 2; // 0-1
        const centralEffect = 1 - distanceFromCenter; // Stronger in center
  
        if (system.type === "high-pressure") {
          // High pressure systems increase pressure
          systemEffect += system.intensity * centralEffect * 15;
        } else if (system.type === "low-pressure") {
          // Low pressure systems decrease pressure
          systemEffect -= system.intensity * centralEffect * 15;
        } else if (system.type === "cold-front") {
          // Cold fronts cause pressure to drop, then rise
          if (system.age < 6) {
            systemEffect -= system.intensity * centralEffect * 10;
          } else {
            systemEffect += system.intensity * centralEffect * 8;
          }
        } else if (system.type === "warm-front") {
          // Warm fronts cause gradual pressure drop
          systemEffect -= system.intensity * centralEffect * 8;
        }
      }
    }

    // Random small variations
    const randomVariation = Math.random() * 2 - 1;

    // Calculate new pressure
    let newPressure =
      currentPressure + diurnalVariation + systemEffect + randomVariation;
    
    // After thunderstorms, pressure typically rises
    if (this.lastCondition === "Thunderstorm" && this.lastCondition !== "Thunderstorm") {
      newPressure += 3.0; // Significant pressure rise after thunderstorm
    }

    // Limit extreme values
    return Math.max(970, Math.min(1050, newPressure));
  }

  /**
   * Calculate the pressure trend from recent history
   * @param {number} currentPressure - Current atmospheric pressure
   */
  calculatePressureTrend(currentPressure) {
    // Ensure current pressure is a valid number
    currentPressure = Number(currentPressure) || 1013.25;
    
    // Add current pressure to history
    this.pressureHistory.push(currentPressure);
    
    // Keep only the last 24 hours
    if (this.pressureHistory.length > 24) {
      this.pressureHistory.shift();
    }
    
    // Need at least a few hours of history
    if (this.pressureHistory.length < 3) {
      this.pressureTrend = 0;
      return 0;
    }

    // Calculate average change over last 3 hours
    const current = this.pressureHistory[this.pressureHistory.length - 1];
    const threeHoursAgo =
      this.pressureHistory[this.pressureHistory.length - 4] ||
      this.pressureHistory[0];

    this.pressureTrend = (current - threeHoursAgo) / 3;
    
    return this.pressureTrend;
  }

  /**
   * Get the current pressure trend
   * @returns {number} - Pressure change in hPa/hour
   */
  getPressureTrend() {
    return this.pressureTrend || 0;
  }

  /**
   * Calculate base cloud cover at initialization
   * @param {object} profile - Region profile
   * @param {object} seasonalBaseline - Seasonal baseline data
   * @param {Date} date - Current date
   * @param {number} hour - Current hour (0-23)
   * @returns {number} - Cloud cover percentage (0-100)
   */
  calculateBaseCloudCover(profile, seasonalBaseline, date, hour) {
    // Safety check for parameters
    if (!seasonalBaseline || !seasonalBaseline.humidity) {
      console.error("Invalid seasonalBaseline in calculateBaseCloudCover");
      return 30; // Default cloud cover
    }
    
    // Base cloud cover related to humidity
    const humidityMean = seasonalBaseline.humidity.mean || 50;
    const baseCloudiness = humidityMean * 0.8;

    // Random variation
    const randomVariation = Math.random() * 30 - 15;

    // Calculate initial cloud cover
    const cloudCover = baseCloudiness + randomVariation;

    // Ensure value is within valid range
    return Math.max(0, Math.min(100, cloudCover));
  }

  /**
   * Calculate cloud cover based on all factors
   * @param {object} profile - Region profile
   * @param {object} seasonalBaseline - Seasonal baseline data
   * @param {Date} date - Current date
   * @param {number} hour - Current hour (0-23)
   * @param {number} currentCloudCover - Current cloud cover
   * @param {number} humidity - Current humidity
   * @param {Array} weatherSystems - Active weather systems
   * @returns {number} - Cloud cover percentage (0-100)
   */
  calculateCloudCover(
    profile,
    seasonalBaseline,
    date,
    hour,
    currentCloudCover,
    humidity,
    weatherSystems
  ) {
    // Ensure inputs are valid numbers
    humidity = Number(humidity) || 50;
    currentCloudCover = Number(currentCloudCover) || 30;
    hour = Number(hour) || 12;
    
    // Clouds are strongly related to humidity
    const humidityFactor = humidity * 0.6;

    // Pressure effect - falling pressure increases cloud formation
    const pressureTrend = this.getPressureTrend();
    const pressureTrendEffect = pressureTrend * -20; // -1 hPa/hr = +20% cloud potential

    // Weather system effects
    let systemEffect = 0;

    // Calculate effect from each weather system
    if (Array.isArray(weatherSystems)) {
      for (const system of weatherSystems) {
        if (!system) continue;
        
        // How close is this system to the center of our region?
        const distanceFromCenter = Math.abs(system.position - 0.5) * 2; // 0-1
        const centralEffect = 1 - distanceFromCenter; // Stronger in center
  
        if (system.type === "high-pressure") {
          // High pressure systems decrease cloud cover
          systemEffect -= system.intensity * centralEffect * 40;
        } else if (system.type === "low-pressure") {
          // Low pressure systems increase cloud cover
          systemEffect += system.intensity * centralEffect * 40;
        } else if (system.type === "cold-front") {
          // Cold fronts bring clouds initially, then clear
          if (system.age < 10) {
            systemEffect += system.intensity * centralEffect * 50;
          } else {
            systemEffect -= system.intensity * centralEffect * 30;
          }
        } else if (system.type === "warm-front") {
          // Warm fronts bring persistent cloud cover
          systemEffect += system.intensity * centralEffect * 60;
        }
      }
    }

    // Diurnal effects - slight tendency for more clouds in afternoon due to convection
    const hourFactor = Math.sin(2 * Math.PI * ((hour - 14) / 24)); // Peak at 2PM
    const diurnalEffect = hourFactor * 5;

    // Random variation
    const randomVariation = Math.random() * 10 - 5;

    // Calculate cloud cover
    let cloudCover =
      30 +
      humidityFactor +
      pressureTrendEffect +
      systemEffect +
      diurnalEffect +
      randomVariation;
    
    // Apply cloud dissipation after storm events
    if (this.stormCooldownPeriod > 0) {
      // Clouds gradually clear after a storm
      cloudCover -= (6 - this.stormCooldownPeriod) * 5;
    }

    // Cloud cover has inertia - it changes gradually
    if (currentCloudCover !== null) {
      // Blend with 70% of new calculation, 30% of previous cloud cover
      cloudCover = cloudCover * 0.7 + currentCloudCover * 0.3;
    }

    // Ensure value is within valid range
    return Math.max(0, Math.min(100, cloudCover));
  }

  /**
   * Calculate precipitation potential based on meteorological factors
   * @param {number} humidity - Relative humidity (0-100)
   * @param {number} temperature - Temperature in °F
   * @param {number} pressure - Atmospheric pressure in hPa
   * @param {number} cloudCover - Cloud cover percentage (0-100)
   * @param {number} atmosphericInstability - Atmospheric instability (0-10)
   * @param {Array} weatherSystems - Active weather systems
   * @param {Function} getRecentPrecipitation - Function to get recent precipitation
   * @returns {number} - Precipitation potential (0-100)
   */
  calculatePrecipitationPotential(
    humidity,
    temperature,
    pressure,
    cloudCover,
    atmosphericInstability,
    weatherSystems,
    getRecentPrecipitation,
    currentCondition
  ) {
    // Ensure all inputs are valid numbers
    humidity = Number(humidity) || 50;
    temperature = Number(temperature) || 70;
    pressure = Number(pressure) || 1013.25;
    cloudCover = Number(cloudCover) || 30;
    atmosphericInstability = Number(atmosphericInstability) || 3;
    
    // Basic factors that influence precipitation
    const humiditySaturation = humidity / 100;
    const pressureTrend = this.getPressureTrend();

    // Base potential from humidity and cloud cover
    // Both high humidity and cloud cover are needed for precipitation
    const base = Math.pow(humiditySaturation * (cloudCover / 100), 0.8) * 70;

    // Falling pressure increases precipitation chance
    const pressureEffect = pressureTrend < 0 ? Math.abs(pressureTrend) * 20 : 0;

    // Atmospheric instability increases precipitation chance
    const instabilityEffect = atmosphericInstability * 8;

    // Weather system effects
    let systemEffect = 0;

    // Calculate effect from each weather system
    if (Array.isArray(weatherSystems)) {
      for (const system of weatherSystems) {
        if (!system) continue;
        
        // How close is this system to the center of our region?
        const distanceFromCenter = Math.abs(system.position - 0.5) * 2; // 0-1
        const centralEffect = 1 - distanceFromCenter; // Stronger in center
  
        if (system.type === "low-pressure") {
          // Low pressure systems increase precipitation
          systemEffect += system.intensity * centralEffect * 20;
        } else if (system.type === "cold-front") {
          // Cold fronts cause heavy precipitation as they pass
          if (system.age < 12) {
            systemEffect += system.intensity * centralEffect * 30;
          }
        } else if (system.type === "warm-front") {
          // Warm fronts cause steady precipitation
          systemEffect += system.intensity * centralEffect * 25;
        }
      }
    }

    // Recent precipitation initially increases chance of continued precipitation,
    // but decreases over time as moisture is depleted
    let recentPrecip = 0;
    try {
      recentPrecip = getRecentPrecipitation ? getRecentPrecipitation() : 0;
      if (isNaN(recentPrecip)) recentPrecip = 0;
    } catch (error) {
      console.error("Error getting recent precipitation:", error);
    }
    
    let precipEffect = 0;
    
    if (recentPrecip > 0) {
      if (this.precipitationExhaustion < 6) {
        // Early in precipitation event, it reinforces itself
        precipEffect = recentPrecip * 10;
      } else {
        // Later, precipitation systems exhaust their moisture
        precipEffect = recentPrecip * (10 - this.precipitationExhaustion);
      }
    }
    
    // Increase precipitation exhaustion for persistent precipitation
    if (recentPrecip > 0.3) {
      this.precipitationExhaustion = Math.min(12, this.precipitationExhaustion + 1);
    } else {
      // Reset precipitation exhaustion when not precipitating
      this.precipitationExhaustion = Math.max(0, this.precipitationExhaustion - 0.5);
    }

    // Apply storm cooldown if active
    if (this.stormCooldownPeriod > 0) {
      // Reduce precipitation potential during cooldown
      systemEffect *= (1 - (this.stormCooldownPeriod / 10));
    }

    // If a thunderstorm just ended, start cooldown period
    if (this.lastCondition === "Thunderstorm" && currentCondition !== "Thunderstorm") {
      this.stormCooldownPeriod = 6; // 6 hour cooldown after a thunderstorm
    }

    this.lastCondition = currentCondition; // Track for next iteration

    // Randomize slightly to avoid predictability
    const randomEffect = Math.random() * 10 - 5;

    // Calculate final potential
    let potential =
      base +
      pressureEffect +
      instabilityEffect +
      systemEffect +
      precipEffect +
      randomEffect;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, potential));
  }

  /**
   * Calculate precipitation amount from condition and potential
   * @param {string} condition - Weather condition
   * @param {number} potential - Precipitation potential (0-100)
   * @returns {number} - Precipitation amount (0-1 scale)
   */
  calculatePrecipitationAmount(condition, potential) {
    potential = Number(potential) || 0;
    
    switch (condition) {
      case "Heavy Rain":
      case "Thunderstorm":
      case "Blizzard":
        return (potential / 100) * (0.7 + Math.random() * 0.3); // 0.7-1.0 scaling
      case "Rain":
      case "Snow":
        return (potential / 100) * (0.3 + Math.random() * 0.4); // 0.3-0.7 scaling
      default:
        return 0;
    }
  }

  /**
   * Reset pressure history and tracking state
   * @param {number} initialPressure - Initial pressure to fill history with
   */
  resetPressureHistory(initialPressure) {
    initialPressure = Number(initialPressure) || 1013.25;
    this.pressureHistory = Array(24).fill(initialPressure);
    this.pressureTrend = 0;
    this.lastCondition = null;
    this.stormCooldownPeriod = 0;
    this.precipitationExhaustion = 0;
  }
}

export default AtmosphericService;