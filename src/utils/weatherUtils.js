// src/services/meteorological/WeatherUtils.js
// Utility functions for meteorological calculations

class WeatherUtils {
  /**
   * Calculate day of year (0-365)
   * @param {Date} date - Date object
   * @returns {number} - Day of year
   */
  static getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  /**
   * Calculate season from date
   * @param {Date} date - Date to calculate season for
   * @param {number} latitude - Latitude (-90 to 90)
   * @returns {string} - Season name
   */
  static getSeasonFromDate(date, latitude = 40) {
    // For southern hemisphere, invert the seasons
    if (latitude < 0) {
      const month = date.getMonth();
      if (month >= 2 && month <= 4) return "fall";
      if (month >= 5 && month <= 7) return "winter";
      if (month >= 8 && month <= 10) return "spring";
      return "summer";
    }

    // Northern hemisphere
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "fall";
    return "winter";
  }

  /**
   * Get sunrise/sunset hours based on latitude and day of year
   * @param {number} latitude - Latitude in degrees
   * @param {number} dayOfYear - Day of year (0-365)
   * @returns {object} - Sunrise and sunset hours
   */
  static getDaylightHours(latitude, dayOfYear) {
    // Calculate the solar declination angle for the given day of year
    // This is the angle between the rays of the sun and the equatorial plane
    const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
    
    // Convert latitude to radians
    const latRad = latitude * (Math.PI / 180);
    const decRad = declination * (Math.PI / 180);
    
    // Calculate day length in hours
    const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad * (Math.PI / 180));
    
    // Handle special cases (polar day/night)
    if (cosHourAngle < -1) {
      return { sunrise: 0, sunset: 24 }; // Polar day
    } else if (cosHourAngle > 1) {
      return { sunrise: 12, sunset: 12 }; // Polar night
    }
    
    const hourAngle = Math.acos(cosHourAngle) * (180 / Math.PI);
    const dayLength = (2 * hourAngle) / 15;
    
    // Calculate sunrise and sunset
    const sunrise = 12 - dayLength / 2;
    const sunset = 12 + dayLength / 2;
    
    return { sunrise, sunset, dayLength };
  }

  /**
   * Get moon phase for a date
   * @param {Date} date - Date to check
   * @returns {object} - Moon phase information
   */
  static getMoonPhase(date) {
    // JDN stands for Julian Day Number
    // Algorithm from "Astronomical Algorithms" by Jean Meeus
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    let jdn = day - 32075 + Math.floor(1461 * (year + 4800 + Math.floor((month - 14) / 12)) / 4) +
             Math.floor(367 * (month - 2 - 12 * Math.floor((month - 14) / 12)) / 12) -
             Math.floor(3 * Math.floor((year + 4900 + Math.floor((month - 14) / 12)) / 100) / 4);
    
    // Calculate current phase
    const phase = (jdn - 2451550.1) % 29.530588853;
    const normalizedPhase = phase / 29.530588853;
    
    // Determine the phase name and percentage illumination
    let phaseName;
    let illumination;
    let isWaxing = true;
    
    if (normalizedPhase < 0.025 || normalizedPhase >= 0.975) {
      phaseName = "New Moon";
      illumination = 0;
      isWaxing = normalizedPhase >= 0.975 ? false : true;
    } else if (normalizedPhase < 0.25) {
      phaseName = "Waxing Crescent";
      illumination = normalizedPhase * 4 * 100;
      isWaxing = true;
    } else if (normalizedPhase < 0.275) {
      phaseName = "First Quarter";
      illumination = 50;
      isWaxing = true;
    } else if (normalizedPhase < 0.475) {
      phaseName = "Waxing Gibbous";
      illumination = 50 + (normalizedPhase - 0.25) * 2 * 100;
      isWaxing = true;
    } else if (normalizedPhase < 0.525) {
      phaseName = "Full Moon";
      illumination = 100;
      isWaxing = false;
    } else if (normalizedPhase < 0.725) {
      phaseName = "Waning Gibbous";
      illumination = 100 - (normalizedPhase - 0.5) * 2 * 100;
      isWaxing = false;
    } else if (normalizedPhase < 0.775) {
      phaseName = "Last Quarter";
      illumination = 50;
      isWaxing = false;
    } else {
      phaseName = "Waning Crescent";
      illumination = 50 - (normalizedPhase - 0.75) * 2 * 100;
      isWaxing = false;
    }
    
    // Determine appropriate emoji
    let icon;
    if (phaseName === "New Moon") icon = "🌑";
    else if (phaseName === "Waxing Crescent") icon = "🌒";
    else if (phaseName === "First Quarter") icon = "🌓";
    else if (phaseName === "Waxing Gibbous") icon = "🌔";
    else if (phaseName === "Full Moon") icon = "🌕";
    else if (phaseName === "Waning Gibbous") icon = "🌖";
    else if (phaseName === "Last Quarter") icon = "🌗";
    else icon = "🌘"; // Waning Crescent
    
    return {
      phase: normalizedPhase,
      phaseName,
      illumination: Math.round(illumination),
      exactPercentage: illumination.toFixed(1),
      isWaxing,
      icon
    };
  }
  
  /**
   * Convert between temperature units
   * @param {number} temp - Temperature value
   * @param {string} from - Source unit ('F', 'C', or 'K')
   * @param {string} to - Target unit ('F', 'C', or 'K')
   * @returns {number} - Converted temperature
   */
  static convertTemperature(temp, from, to) {
    // First convert to Celsius
    let celsius;
    switch (from.toUpperCase()) {
      case 'F':
        celsius = (temp - 32) * 5/9;
        break;
      case 'K':
        celsius = temp - 273.15;
        break;
      case 'C':
      default:
        celsius = temp;
    }
    
    // Then convert to target unit
    switch (to.toUpperCase()) {
      case 'F':
        return celsius * 9/5 + 32;
      case 'K':
        return celsius + 273.15;
      case 'C':
      default:
        return celsius;
    }
  }

  /**
   * Gets the appropriate weather icon based on condition and time
   * @param {string} condition - The weather condition
   * @param {number} hour - The hour (0-23)
   * @returns {string} - The emoji icon
   */
  static getWeatherIcon(condition, hour = 12) {
    // Determine if it's day or night (simplified)
    const isNight = hour < 6 || hour >= 18;
    
    switch (condition) {
      case 'Clear Skies':
        return isNight ? '🌙' : '☀️';
      case 'Light Clouds':
        return isNight ? '☁️🌙' : '🌤️';
      case 'Heavy Clouds':
        return '☁️';
      case 'Rain':
        return '🌧️';
      case 'Heavy Rain':
        return '⛈️';
      case 'Snow':
        return '❄️';
      case 'Freezing Cold':
        return '🥶';
      case 'Cold Winds':
        return '🌬️';
      case 'Scorching Heat':
        return '🔥';
      case 'Thunderstorm':
        return '⚡';
      case 'Blizzard':
        return '🌨️';
      case 'High Humidity Haze':
        return '🌫️';
      case 'Cold Snap':
        return '❄️';
      case 'Fog':
        return '🌫️';
      case 'Heavy Fog':
        return '🌫️';
      default:
        return '❓';
    }
  }
  
  /**
   * Gets the appropriate wind icon based on intensity
   * @param {string} intensity - The wind intensity
   * @returns {string|null} - The emoji icon or null for calm winds
   */
  static getWindIcon(intensity) {
    switch (intensity) {
      case 'Calm':
        return null; // No icon for calm winds
      case 'Breezy':
        return '🍃';
      case 'Windy':
        return '💨';
      case 'Strong Winds':
        return '🌪️';
      case 'Gale Force':
        return '🌀';
      case 'Storm Force':
        return '🌪️';
      default:
        return null;
    }
  }
  
  /**
   * Gets the background color for a weather condition
   * @param {string} condition - The weather condition
   * @param {boolean} isDarkMode - Whether dark mode is enabled
   * @returns {string} - CSS color value
   */
  static getWeatherBackground(condition, isDarkMode = true) {
    // Base colors that work with dark mode
    if (isDarkMode) {
      switch (condition) {
        case 'Clear Skies':
          return 'rgba(233, 245, 219, 0.2)';
        case 'Light Clouds':
          return 'rgba(233, 245, 219, 0.1)';
        case 'Heavy Clouds':
          return 'rgba(216, 226, 220, 0.2)';
        case 'Rain':
          return 'rgba(207, 226, 243, 0.2)';
        case 'Heavy Rain':
          return 'rgba(182, 208, 226, 0.2)';
        case 'Snow':
          return 'rgba(232, 240, 240, 0.2)';
        case 'Freezing Cold':
          return 'rgba(224, 243, 248, 0.2)';
        case 'Scorching Heat':
          return 'rgba(255, 232, 214, 0.2)';
        case 'Thunderstorm':
          return 'rgba(201, 204, 213, 0.2)';
        case 'Blizzard':
          return 'rgba(213, 214, 234, 0.2)';
        default:
          return 'rgba(233, 245, 219, 0.1)';
      }
    }
    
    // Light mode colors
    switch (condition) {
      case 'Clear Skies':
        return '#e9f5db';
      case 'Light Clouds':
        return '#e9f5db';
      case 'Heavy Clouds':
        return '#d8e2dc';
      case 'Rain':
        return '#cfe2f3';
      case 'Heavy Rain':
        return '#b6d0e2';
      case 'Snow':
        return '#e8f0f0';
      case 'Freezing Cold':
        return '#e0f3f8';
      case 'Scorching Heat':
        return '#ffe8d6';
      case 'Thunderstorm':
        return '#c9ccd5';
      case 'Blizzard':
        return '#d5d6ea';
      default:
        return '#e9f5db';
    }
  }
  
  /**
   * Gets the style class based on wind intensity
   * @param {string} intensity - The wind intensity
   * @returns {string} - CSS class name
   */
  static getWindIntensityClass(intensity) {
    switch (intensity) {
      case 'Calm':
        return 'text-gray-400';
      case 'Breezy':
        return 'text-gray-100';
      case 'Windy':
        return 'text-warning font-semibold';
      case 'Strong Winds':
        return 'text-warning font-bold';
      case 'Gale Force':
        return 'text-danger font-bold';
      case 'Storm Force':
        return 'text-danger font-bold';
      default:
        return '';
    }
  }
  
  /**
   * Gets formatted temperature with appropriate color based on value
   * @param {number} temperature - Temperature in Fahrenheit
   * @returns {Object} - Contains formatted value and CSS color class
   */
  static getFormattedTemperature(temperature) {
    let colorClass = '';
    
    if (temperature <= 32) {
      colorClass = 'text-blue-400'; // Cold
    } else if (temperature <= 50) {
      colorClass = 'text-blue-200'; // Cool
    } else if (temperature <= 70) {
      colorClass = 'text-green-300'; // Mild
    } else if (temperature <= 85) {
      colorClass = 'text-yellow-300'; // Warm
    } else if (temperature <= 95) {
      colorClass = 'text-orange-400'; // Hot
    } else {
      colorClass = 'text-red-500'; // Very hot
    }
    
    return {
      value: `${temperature}°F`,
      colorClass
    };
  }
  
  /**
   * Maps biome name to climate table key
   * @param {string} biome - UI biome name
   * @returns {string} - Climate table key
   */
  static mapBiomeToClimate(biome) {
    const biomeMap = {
      "temperate": "temperate-deciduous",
      "desert": "desert",
      "arctic": "tundra",
      "tropical": "tropical-rainforest",
      "coastal": "temperate-rainforest",
      "mountain": "boreal-forest",
      "forest": "temperate-deciduous",
      "swamp": "tropical-seasonal"
    };
    
    console.log(`Mapping biome "${biome}" to climate table key:`, biomeMap[biome] || biome);
    return biome ? biomeMap[biome] || biome : "temperate-deciduous";
  }

  /**
   * Get detailed climate classification based on latitude, elevation, and maritime influence
   * @param {number} latitude - Latitude in degrees
   * @param {number} elevation - Elevation in feet
   * @param {number} maritimeInfluence - Maritime influence factor (0-1)
   * @returns {object} - Detailed climate classification
   */
  static getDetailedClimateClassification(latitude, elevation, maritimeInfluence) {
    // Absolute latitude for calculations
    const absLatitude = Math.abs(latitude);
    
    // Base climate from latitude
    let baseClimate = "";
    
    if (absLatitude < 10) {
      baseClimate = "equatorial";
    } else if (absLatitude < 30) {
      baseClimate = "tropical";
    } else if (absLatitude < 45) {
      baseClimate = "subtropical";
    } else if (absLatitude < 60) {
      baseClimate = "temperate";
    } else if (absLatitude < 75) {
      baseClimate = "subarctic";
    } else {
      baseClimate = "polar";
    }
    
    // Calculate continentality (opposite of maritime influence)
    const continentality = 1 - maritimeInfluence;
    
    // Continental vs. maritime modifier
    let continentalityType = "";
    
    if (maritimeInfluence > 0.7) {
      continentalityType = "maritime";
    } else if (maritimeInfluence < 0.3) {
      continentalityType = "continental";
    } else {
      continentalityType = "moderate";
    }
    
    // Elevation effects
    let elevationType = "";
    
    if (elevation > 8000) {
      elevationType = "alpine";
    } else if (elevation > 4000) {
      elevationType = "montane";
    } else if (elevation > 1500) {
      elevationType = "upland";
    } else {
      elevationType = "lowland";
    }
    
    // Combine factors for detailed classification
    return {
      baseClimate,
      continentalityType,
      elevationType,
      
      // Annual temperature range estimate (°F)
      // Higher for continental, lower for maritime
      annualTemperatureRange: 20 + (continentality * 50) + 
                           (absLatitude > 30 ? (absLatitude - 30) * 0.6 : 0),
      
      // Precipitation seasonality
      precipitationSeasonality: this.getPrecipitationSeasonality(latitude, maritimeInfluence),
      
      // Day length variation (hours between longest and shortest day)
      dayLengthVariation: this.getDayLengthVariation(absLatitude)
    };
  }

  /**
   * Calculate precipitation seasonality based on latitude and maritime influence
   * @param {number} latitude - Latitude in degrees
   * @param {number} maritimeInfluence - Maritime influence factor (0-1)
   * @returns {object} - Precipitation seasonality details
   */
  static getPrecipitationSeasonality(latitude, maritimeInfluence) {
    const absLatitude = Math.abs(latitude);
    
    // Precipitation seasonality depends on latitude and maritime influence
    let seasonality = "moderate";
    let wetSeason = null;
    
    // Equatorial regions often have two wet seasons
    if (absLatitude < 10) {
      seasonality = maritimeInfluence > 0.5 ? "low" : "moderate";
      wetSeason = "year-round";
    }
    // Tropical monsoon regions have strong wet seasons
    else if (absLatitude < 30) {
      if (latitude > 0) { // Northern Hemisphere
        wetSeason = "summer"; // Northern summer (Jun-Aug)
      } else { // Southern Hemisphere
        wetSeason = "winter"; // Southern summer (Dec-Feb) is Northern winter
      }
      seasonality = "high";
    }
    // Mediterranean climates (specific regions at 30-40° with summer drought)
    else if ((absLatitude > 30 && absLatitude < 40) && 
           (maritimeInfluence > 0.5 && maritimeInfluence < 0.8)) {
      if (latitude > 0) { // Northern Hemisphere
        wetSeason = "winter"; // Mediterranean pattern
      } else { // Southern Hemisphere
        wetSeason = "summer"; // Southern Mediterranean pattern
      }
      seasonality = "very high"; // Very distinct wet and dry seasons
    }
    // Mid-latitude maritime has moderate year-round precipitation
    else if (absLatitude < 60 && maritimeInfluence > 0.7) {
      seasonality = "low";
      wetSeason = "year-round";
    }
    // Mid-latitude continental has summer maximum
    else if (absLatitude < 60) {
      if (latitude > 0) { // Northern Hemisphere
        wetSeason = "summer"; // Northern summer
      } else { // Southern Hemisphere
        wetSeason = "winter"; // Southern summer
      }
      seasonality = "moderate";
    }
    // High latitudes often have low precipitation year-round
    else {
      seasonality = "moderate";
      wetSeason = maritimeInfluence > 0.5 ? "winter" : "summer";
    }
    
    return { seasonality, wetSeason };
  }

  /**
   * Calculate day length variation based on latitude
   * @param {number} latitude - Absolute latitude in degrees
   * @returns {number} - Variation in hours between longest and shortest day
   */
  static getDayLengthVariation(latitude) {
    // Approximate hours difference between longest and shortest day
    // Based on calculation: 12 * sin(latitude * pi/180)
    const variation = 12 * Math.sin(latitude * Math.PI / 180);
    
    // Cap the variation for very high latitudes where formula breaks down
    return Math.min(24, variation);
  }
  
  /**
   * Get the actual latitude value from a latitude band
   * @param {string} latitudeBand - The latitude band name
   * @returns {number} - Approximate central latitude value for the band
   */
  static getLatitudeFromBand(latitudeBand) {
    // Center point of each latitude band
    const latitudeMap = {
      "equatorial": 5,   // 0° - 10°
      "tropical": 20,    // 10° - 30°
      "subtropical": 38, // 30° - 45°
      "temperate": 45,   // 30° - 60° (or 45° - 60° with subtropical split)
      "subarctic": 65,   // 60° - 75°
      "polar": 80        // 75° - 90°
    };
    
    return latitudeMap[latitudeBand] || 45; // Default to temperate
  }
  
  /**
   * Calculate the appropriate temperature range for a given biome and latitude band
   * @param {string} biome - The biome type
   * @param {string} latitudeBand - The latitude band
   * @param {number} maritimeInfluence - Maritime influence factor (0-1)
   * @returns {object} - Seasonal temperature ranges
   */
  static getSeasonalTemperatureRanges(biome, latitudeBand, maritimeInfluence = 0.5) {
    // Get base ranges from biome
    const biomeRanges = this.getBiomeTemperatureRanges(biome);
    
    // Get latitude value
    const latitude = this.getLatitudeFromBand(latitudeBand);
    
    // Apply latitude and continentality modifiers
    const continentality = 1 - maritimeInfluence;
    
    // Calculate annual range (larger for continental, smaller for maritime)
    const annualRange = biomeRanges.annualRange * (0.7 + continentality * 0.6);
    
    // Calculate diurnal range (day-night difference)
    const diurnalRange = biomeRanges.diurnalRange * (0.8 + continentality * 0.4);
    
    // Calculate mean temperatures (adjusted for latitude)
    const latitudeEffect = (latitude - 45) * -0.5; // Cooler as latitude increases
    
    const winterMean = biomeRanges.winter + latitudeEffect - (annualRange / 2);
    const summerMean = biomeRanges.summer + latitudeEffect + (annualRange / 2);
    const springMean = (winterMean + summerMean) * 0.4 + biomeRanges.mean * 0.2;
    const fallMean = (winterMean + summerMean) * 0.45 + biomeRanges.mean * 0.1;
    
    return {
      winter: { mean: winterMean, range: diurnalRange * 0.8 },
      spring: { mean: springMean, range: diurnalRange },
      summer: { mean: summerMean, range: diurnalRange * 1.2 },
      fall: { mean: fallMean, range: diurnalRange },
      annual: { mean: (winterMean + summerMean) / 2, range: annualRange }
    };
  }
  
  /**
   * Get base temperature ranges for different biomes
   * @param {string} biome - The biome type
   * @returns {object} - Base temperature ranges
   */
  static getBiomeTemperatureRanges(biome) {
    // These are more detailed and realistic temperature ranges
    switch (biome) {
      case "tropical-rainforest":
        return {
          mean: 80, winter: 78, summer: 82, 
          annualRange: 8, diurnalRange: 20
        };
      case "tropical-seasonal":
        return {
          mean: 78, winter: 72, summer: 84, 
          annualRange: 15, diurnalRange: 22
        };
      case "desert":
        return {
          mean: 70, winter: 50, summer: 90, 
          annualRange: 40, diurnalRange: 30
        };
      case "temperate-grassland":
        return {
          mean: 55, winter: 30, summer: 80, 
          annualRange: 50, diurnalRange: 25
        };
      case "temperate-deciduous":
        return {
          mean: 50, winter: 30, summer: 70, 
          annualRange: 40, diurnalRange: 20
        };
      case "temperate-rainforest":
        return {
          mean: 50, winter: 40, summer: 65, 
          annualRange: 25, diurnalRange: 15
        };
      case "boreal-forest":
        return {
          mean: 35, winter: 10, summer: 65, 
          annualRange: 55, diurnalRange: 20
        };
      case "tundra":
        return {
          mean: 20, winter: -10, summer: 50, 
          annualRange: 60, diurnalRange: 15
        };
      default:
        return {
          mean: 55, winter: 35, summer: 75, 
          annualRange: 40, diurnalRange: 20
        };
    }
  }
}

export default WeatherUtils;