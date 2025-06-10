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
      "Cold Snap": { max: 40 }, // Cold snaps are... cold
      "Heavy Rain": { min: 35 }, // Heavy rain unlikely in near-freezing temps
      "Rain": { min: 33 },       // Light rain possible just above freezing
      "Thunderstorm": { min: 50 } // Thunderstorms need warmer temperatures
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
    
    // Enhanced temperature adjustments based on latitude bands
    this.latitudeBandAdjustments = {
      "equatorial": { minMod: +15, maxMod: +10, amplitude: 0.6, seasonal: 0.3 },
      "tropical": { minMod: +10, maxMod: +8, amplitude: 0.8, seasonal: 0.5 },
      "temperate": { minMod: 0, maxMod: 0, amplitude: 1.0, seasonal: 1.0 },
      "subarctic": { minMod: -15, maxMod: -10, amplitude: 1.2, seasonal: 1.3 },
      "polar": { minMod: -35, maxMod: -25, amplitude: 1.8, seasonal: 1.6 } // Much stronger cooling
    };
  }

/**
 * Calculate base temperature at initialization
 * UPDATED to pass profile to calculateSolarBasedTemperature
 */
calculateBaseTemperature(profile, seasonalBaseline, date, hour) {
  try {
    // Guard against undefined profile
    if (!profile) {
      console.error("Missing profile in calculateBaseTemperature");
      return 70; // Default temperature
    }

    // Calculate physics-based temperature from solar factors
    const dayOfYear = this.getDayOfYear(date);
    
    // Get biome temperature range (used as fallback only)
    const biomeRange = this.biomeTemperatureRanges[profile.biome] || 
                      this.biomeTemperatureRanges["temperate-deciduous"];
    
    // Apply latitude band adjustments to biome range
    const adjustedRange = this.adjustBiomeRangeForLatitude(
      biomeRange,
      profile.latitude, 
      profile.latitudeBand || "temperate"
    );
    
    // Calculate baseline temperature from solar angle and day of year
    // UPDATED: Pass profile as the last parameter
    const baseTemp = this.calculateSolarBasedTemperature(
      profile.latitude, 
      dayOfYear, 
      hour,
      adjustedRange,
      date,
      profile.latitudeBand || "temperate",
      profile  // NEW: Pass the profile so temperature calculation can use temperatureProfile
    );
    
    // Add some randomness - scale randomness by the seasonal variance
    let randomFactor = 0;
    
    try {
      if (seasonalBaseline && 
          typeof seasonalBaseline === 'object' && 
          seasonalBaseline.temperature && 
          typeof seasonalBaseline.temperature === 'object' &&
          seasonalBaseline?.temperature?.variance !== undefined && 
          typeof seasonalBaseline?.temperature?.variance === 'number') {
        randomFactor = (Math.random() * 2 - 1) * (seasonalBaseline?.temperature?.variance * 0.2);
      } else {
        // Try to use temperatureProfile variance if available
        if (profile?.temperatureProfile) {
          const currentSeason = this.getCurrentSeason(date);
          const seasonalVariance = profile.temperatureProfile[currentSeason]?.variance || 
                                 profile.temperatureProfile.annual?.variance || 10;
          randomFactor = (Math.random() * 2 - 1) * (seasonalVariance * 0.2);
        } else {
          randomFactor = (Math.random() * 2 - 1) * 2; // Default factor
        }
      }
    } catch (error) {
      console.error("Error calculating temperature randomness:", error);
      randomFactor = (Math.random() * 2 - 1) * 2; // Default factor
    }
    
    return baseTemp + randomFactor;
  } catch (error) {
    console.error("Error in calculateBaseTemperature:", error);
    return 70; // Default fallback temperature
  }
}
  
  /**
   * Adjust biome temperature range based on latitude - ENHANCED FOR POLAR REGIONS
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
    
    // SPECIAL POLAR CORRECTIONS
    if (latitudeBand === "polar") {
      // Polar regions should never exceed 45°F in summer
      adjustedRange.max = Math.min(45, adjustedRange.max);
      // Winter should be much colder
      adjustedRange.min = Math.min(-40, adjustedRange.min);
      // Reduce amplitude - polar regions have less seasonal variation
      adjustedRange.amplitude *= 0.7;
      
      console.log(`Polar temperature range adjusted: ${adjustedRange.min}°F to ${adjustedRange.max}°F`);
    }
    
    // SUBARCTIC CORRECTIONS
    if (latitudeBand === "subarctic") {
      // Cap summer temperatures
      adjustedRange.max = Math.min(65, adjustedRange.max);
      adjustedRange.min = Math.min(-20, adjustedRange.min);
      
      console.log(`Subarctic temperature range adjusted: ${adjustedRange.min}°F to ${adjustedRange.max}°F`);
    }
    
    // Additional adjustment based on actual latitude
    // Apply more extreme temperature range for continental regions
    if (latitude > 40 && latitude < 60) {
      // Continental mid-latitude effect
      adjustedRange.min -= 5;  // Colder winters
      adjustedRange.max += 5;  // Warmer summers
      adjustedRange.amplitude *= 1.2; // More seasonal variation
    }
    
    return adjustedRange;
  }

  /**
   * Calculate temperature based on all physical factors - ENHANCED FOR POLAR REGIONS
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
  
  // Get biome temperature range (fallback only)
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
  // UPDATED: Pass profile as the last parameter
  const solarTemp = this.calculateSolarBasedTemperature(
    profile.latitude, 
    dayOfYear, 
    hour,
    adjustedRange,
    date,
    latitudeBand,
    profile  // NEW: Pass the profile
  );
  
  // 2. Apply geographical adjustments
  const elevationEffect = -0.0035 * profile.elevation;
  
  // Maritime influence
  const seasonalPosition = Math.sin(2 * Math.PI * ((dayOfYear - 172) / 365));
  const maritimeEffect = profile.maritimeInfluence * 5 * (1 - Math.abs(seasonalPosition));
  
  // 3. Enhanced special factor temperature effects (including polar factors)
  const specialFactorEffects = this.calculateSpecialFactorTemperatureEffects(
    profile.specialFactors || {}, 
    hour, 
    isDaytime, 
    seasonalPosition,
    latitudeBand // Pass latitude band for polar-specific logic
  );
  
  // 4. Weather system effects on temperature
  const systemEffect = this.calculateSystemTemperatureEffect(weatherSystems);
  
  // 5. Cloud cover effect
  const cloudEffect = this.calculateCloudTemperatureEffect(hour, cloudCover, date, latitudeBand);
  
  // 6. Recent precipitation cooling effect
  const recentPrecip = getRecentPrecipitation ? getRecentPrecipitation() : 0;
  let precipEffect = recentPrecip * -5;
  
  // POLAR PRECIPITATION EFFECTS - liquid precipitation cools more in polar regions
  if (latitudeBand === "polar" && currentTemperature > 32) {
    precipEffect *= 2; // Double cooling effect for liquid precip in polar regions
  }
  
  // 7. POLAR WIND CHILL SIMULATION
  let windChillEffect = 0;
  if ((latitudeBand === "polar" || latitudeBand === "subarctic") && weatherSystems) {
    // Calculate average wind speed from weather systems
    let avgWindSpeed = 0;
    let systemCount = 0;
    
    for (const system of weatherSystems) {
      if (system && system.intensity) {
        avgWindSpeed += system.intensity * 10; // Rough wind speed estimate
        systemCount++;
      }
    }
    
    if (systemCount > 0) {
      avgWindSpeed /= systemCount;
      
      // Apply wind chill if conditions are right
      if (avgWindSpeed > 5 && solarTemp < 32) {
        windChillEffect = -Math.min(15, avgWindSpeed * 0.3);
        console.log(`Polar wind chill effect: ${windChillEffect.toFixed(1)}°F (wind: ${avgWindSpeed.toFixed(1)} mph)`);
      }
    }
  }
  
  // 8. Random variation
  const randomVariation = (Math.random() * 2 - 1) * 2;
  
  // Calculate final temperature
  let temp = solarTemp + 
             elevationEffect + 
             maritimeEffect + 
             specialFactorEffects + 
             systemEffect + 
             cloudEffect + 
             precipEffect + 
             windChillEffect + 
             randomVariation;
  
  // Apply temperature inertia
  if (currentTemperature !== null) {
    temp = temp * 0.7 + currentTemperature * 0.3;
  }
  
  // Enhanced bounds for polar regions
  if (latitudeBand === "polar") {
    temp = Math.max(-60, Math.min(50, temp)); // Polar regions cap at 50°F
  } else if (latitudeBand === "subarctic") {
    temp = Math.max(-50, Math.min(80, temp)); // Subarctic regions cap at 80°F
  } else {
    temp = Math.max(-60, Math.min(130, temp)); // General bounds
  }
  
  return temp;
}

  /**
   * Calculate temperature effects from special factors - ENHANCED FOR POLAR REGIONS
   * @param {object} specialFactors - Region's special factors
   * @param {number} hour - Current hour (0-23)
   * @param {boolean} isDaytime - Whether it's currently daytime
   * @param {number} seasonalPosition - Seasonal position (-1 to 1, where 1 is summer)
   * @param {string} latitudeBand - Latitude band for polar-specific effects
   * @returns {number} - Combined temperature effect in °F
   */
  calculateSpecialFactorTemperatureEffects(specialFactors, hour, isDaytime, seasonalPosition, latitudeBand = "temperate") {
    let totalEffect = 0;
    
    // ENHANCED PERMAFROST EFFECTS
    if (specialFactors.permafrost) {
      const permafrostLevel = specialFactors.permafrost; // 0-1 scale
      
      // Base cooling effect from permafrost
      let permafrostEffect = permafrostLevel * -8; // Base cooling
      
      // ENHANCED: Permafrost prevents summer warming
      if (seasonalPosition > 0) { // Summer
        // Stronger cooling in summer when permafrost prevents ground warming
        const summerCooling = permafrostLevel * seasonalPosition * -15;
        permafrostEffect += summerCooling;
        
        console.log(`Permafrost summer cooling: ${summerCooling.toFixed(1)}°F (level: ${permafrostLevel}, season: ${seasonalPosition.toFixed(2)})`);
      } else { // Winter
        // Permafrost can actually moderate extreme winter cold slightly
        // (acts as thermal mass)
        const winterModeration = permafrostLevel * Math.abs(seasonalPosition) * 2;
        permafrostEffect += winterModeration;
      }
      
      totalEffect += permafrostEffect;
      console.log(`Total permafrost effect: ${permafrostEffect.toFixed(1)}°F`);
    }
    
    // ENHANCED PERMANENT ICE EFFECTS
    if (specialFactors.permanentIce) {
      const iceLevel = specialFactors.permanentIce;
      
      // Permanent ice creates massive cooling through albedo effect
      let iceEffect = iceLevel * -20; // Base cooling
      
      // Ice reflects solar energy, especially strong in summer
      if (seasonalPosition > 0 && isDaytime) {
        const albedoEffect = iceLevel * seasonalPosition * -10;
        iceEffect += albedoEffect;
        console.log(`Ice albedo effect: ${albedoEffect.toFixed(1)}°F`);
      }
      
      totalEffect += iceEffect;
      console.log(`Total permanent ice effect: ${iceEffect.toFixed(1)}°F (level: ${iceLevel})`);
    }
    
    // Sea ice effects - create significant cooling
    if (specialFactors.seaIce) {
      // Sea ice has cooling effect, but varies seasonally
      const seasonalIceEffect = specialFactors.seaIce * (0.7 + 0.3 * Math.abs(seasonalPosition));
      const seaIceCooling = seasonalIceEffect * -8;
      totalEffect += seaIceCooling;
      console.log(`Sea ice cooling: ${seaIceCooling.toFixed(1)}°F`);
    }
    
    // High diurnal variation - increases temperature swings between day and night
    if (specialFactors.highDiurnalVariation) {
      const diurnalIntensity = specialFactors.highDiurnalVariation;
      if (isDaytime) {
        // Hotter days (but reduced in polar regions)
        const dayHeating = latitudeBand === "polar" ? diurnalIntensity * 4 : diurnalIntensity * 8;
        totalEffect += dayHeating;
      } else {
        // Colder nights (enhanced in polar regions)
        const nightCooling = latitudeBand === "polar" ? diurnalIntensity * -15 : diurnalIntensity * -10;
        totalEffect += nightCooling;
      }
    }
    
    // Cold ocean currents - moderate temperatures year-round
    if (specialFactors.coldOceanCurrent) {
      const currentEffect = specialFactors.coldOceanCurrent;
      if (seasonalPosition > 0) {
        // Cooling effect in summer
        totalEffect += currentEffect * seasonalPosition * -8;
      } else {
        // Warming effect in winter (less extreme cold)
        totalEffect += currentEffect * Math.abs(seasonalPosition) * 3;
      }
    }
    
    // Geothermal features - localized warming
    if (specialFactors.geothermalFeatures) {
      // Consistent warming effect regardless of season
      totalEffect += specialFactors.geothermalFeatures * 5;
    }
    
    // Volcanic activity - can create localized heating
    if (specialFactors.volcanicActivity) {
      // Mild warming from geothermal effects
      totalEffect += specialFactors.volcanicActivity * 2;
    }
    
    // Forest density - moderates temperature through shade and transpiration
    if (specialFactors.forestDensity) {
      const forestEffect = specialFactors.forestDensity;
      if (isDaytime && seasonalPosition > 0) {
        // Cooling effect during hot summer days through shade
        totalEffect += forestEffect * seasonalPosition * -3;
      } else if (!isDaytime) {
        // Warming effect at night through reduced radiative cooling
        totalEffect += forestEffect * 2;
      }
    }
    
    // Standing water - moderates temperature through thermal mass
    if (specialFactors.standingWater) {
      const waterEffect = specialFactors.standingWater;
      // Water moderates temperature extremes - cooling in summer, warming in winter
      if (seasonalPosition > 0) {
        totalEffect += waterEffect * seasonalPosition * -2; // Summer cooling
      } else {
        totalEffect += waterEffect * Math.abs(seasonalPosition) * 1; // Winter warming
      }
    }
    
    return totalEffect;
  }
  
/**
 * Calculate temperature based on solar angle and day of year - ENHANCED FOR HIGH LATITUDES
 * UPDATED to use region's temperatureProfile data instead of generic biome ranges
 * @param {number} latitude - Latitude in degrees
 * @param {number} dayOfYear - Day of year (0-365)
 * @param {number} hour - Hour of day (0-23)
 * @param {object} biomeRange - Biome temperature range parameters (fallback only)
 * @param {Date} date - Current date
 * @param {string} latitudeBand - Latitude band
 * @param {object} profile - Region profile with temperatureProfile data
 * @returns {number} - Base temperature in °F
 */
calculateSolarBasedTemperature(latitude, dayOfYear, hour, biomeRange, date, latitudeBand = "temperate", profile = null) {
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
  
  // 3. NEW: Use region's temperatureProfile if available, otherwise fall back to biome ranges
  let meanAnnualTemp, seasonalAmplitude;
  
  if (profile && profile.temperatureProfile) {
    // Use the region's custom temperature profile
    const tempProfile = profile.temperatureProfile;
    
    // Calculate current season's temperature based on seasonal factor
    let seasonalMean;
    if (adjustedSeasonalFactor >= 0.5) {
      // Peak summer
      seasonalMean = tempProfile.summer.mean;
    } else if (adjustedSeasonalFactor >= -0.5) {
      // Spring or fall - interpolate
      if (seasonalFactor > 0) {
        // Spring to summer transition
        const blend = adjustedSeasonalFactor * 2; // 0 to 1
        seasonalMean = tempProfile.spring.mean + (tempProfile.summer.mean - tempProfile.spring.mean) * blend;
      } else {
        // Fall transition
        const blend = Math.abs(adjustedSeasonalFactor) * 2; // 0 to 1
        seasonalMean = tempProfile.fall.mean + (tempProfile.winter.mean - tempProfile.fall.mean) * blend;
      }
    } else {
      // Peak winter
      seasonalMean = tempProfile.winter.mean;
    }
    
    // Use annual mean as base, seasonal mean for current calculation
    meanAnnualTemp = tempProfile.annual.mean;
    
    // Calculate amplitude based on the difference between seasonal extremes
    const maxSeasonal = Math.max(
      tempProfile.winter.mean, 
      tempProfile.spring.mean, 
      tempProfile.summer.mean, 
      tempProfile.fall.mean
    );
    const minSeasonal = Math.min(
      tempProfile.winter.mean, 
      tempProfile.spring.mean, 
      tempProfile.summer.mean, 
      tempProfile.fall.mean
    );
    seasonalAmplitude = (maxSeasonal - minSeasonal) / 2;
    
    // Use the current season's mean as our base temperature
    meanAnnualTemp = seasonalMean;
    
  } else {
    // Fallback to original biome-based calculation
    console.log("No temperatureProfile found, using biome ranges as fallback");
    meanAnnualTemp = (biomeRange.max + biomeRange.min) / 2;
    seasonalAmplitude = biomeRange.amplitude;
  }
  
  // 4. Get seasonal factor from latitude band
  const bandAdjustment = this.latitudeBandAdjustments[latitudeBand] || this.latitudeBandAdjustments["temperate"];
  const seasonalIntensity = bandAdjustment.seasonal || 1.0;
  
  // 5. HIGH LATITUDE SOLAR CORRECTIONS
  if (latitude > 60) {
    // High latitude corrections for limited solar angle
    const highLatitudeFactor = (latitude - 60) / 30; // 0-1 scale for 60-90°
    
    // Reduce peak solar heating in summer
    if (adjustedSeasonalFactor > 0) {
      const solarReduction = highLatitudeFactor * adjustedSeasonalFactor * -10;
      meanAnnualTemp += solarReduction;
      console.log(`High latitude solar reduction: ${solarReduction.toFixed(1)}°F`);
    }
    
    // Enhance winter cooling from low sun angle
    if (adjustedSeasonalFactor < 0) {
      const winterEnhancement = highLatitudeFactor * Math.abs(adjustedSeasonalFactor) * -5;
      meanAnnualTemp += winterEnhancement;
      console.log(`High latitude winter enhancement: ${winterEnhancement.toFixed(1)}°F`);
    }
  }
  
  // 6. Calculate diurnal oscillation based on day length
  const normalDayLength = 12;
  const dayLengthFactor = Math.min(1.3, Math.max(0.7, dayLengthHours / normalDayLength));
  
  // 7. Calculate diurnal factor based on solar position
  let diurnalFactor;
  
  if (solarPosition >= 0.25 && solarPosition < 0.75) {
    // Daytime: Peak at solar noon (0.5)
    diurnalFactor = 1 - Math.abs((solarPosition - 0.5) * 4);
  } else {
    // Nighttime
    if (solarPosition >= 0.75) {
      diurnalFactor = -((solarPosition - 0.75) * 4);
    } else {
      diurnalFactor = -1.0 + ((solarPosition / 0.25) * 0.2);
    }
  }
  
  // 8. Scale the diurnal oscillation (reduced for polar regions)
  let diurnalAmplitude = seasonalAmplitude * 0.4 * dayLengthFactor;
  
  // Reduce diurnal swings in polar regions (they have less solar heating variation)
  if (latitudeBand === "polar") {
    diurnalAmplitude *= 0.6;
  } else if (latitudeBand === "subarctic") {
    diurnalAmplitude *= 0.8;
  }
  
  const diurnalOscillation = diurnalAmplitude * diurnalFactor;
  
  // 9. Apply Continental Effect
  let continentalEffect = 0;
  if (latitude > 30 && latitude < 70) {
    const continentalFactor = (1 - (profile?.maritimeInfluence || 0.5)) * 0.7;
    if (adjustedSeasonalFactor > 0) {
      continentalEffect = continentalFactor * diurnalFactor * 8;
    } else {
      continentalEffect = -continentalFactor * Math.abs(adjustedSeasonalFactor) * 10;
    }
  }
  
  // 10. Final temperature: base mean + daily variation + continental effect
  // Note: We're not adding seasonal oscillation here since meanAnnualTemp is already seasonal
  return meanAnnualTemp + diurnalOscillation + continentalEffect;
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
      let cooling = -10 * (cloudCover / 100);
      
      // In polar regions, clouds have less impact due to weaker solar heating
      if (latitudeBand === "polar") {
        cooling *= 0.5;
      } else if (latitudeBand === "subarctic") {
        cooling *= 0.7;
      }
      
      return cooling;
    } else {
      // At night, clouds trap heat
      // Increase temperature up to 5 degrees based on cloud cover
      let warming = 5 * (cloudCover / 100);
      
      // In polar regions, cloud warming effect is enhanced due to lower base temperatures
      if (latitudeBand === "polar") {
        warming *= 1.5;
      } else if (latitudeBand === "subarctic") {
        warming *= 1.2;
      }
      
      return warming;
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
      } else if (condition === "Heavy Rain" || condition === "Rain") {
        return temperature < min ? "Snow" : condition;
      } else if (condition === "Thunderstorm") {
        return temperature < min ? (temperature < 32 ? "Snow" : "Rain") : condition;
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

  /**
   * Get current season from date
   * @param {Date} date - Date to calculate season for
   * @returns {string} - Season name
   */
  getCurrentSeason(date) {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "fall";
    return "winter";
  }
}

export default TemperatureService;