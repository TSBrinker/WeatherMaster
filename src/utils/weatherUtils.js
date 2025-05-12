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
    // Simplified model for day length calculation
    // Based on latitude and day of year
    const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * (Math.PI / 180));
    const latRad = latitude * (Math.PI / 180);
    
    // Calculate day length in hours
    const cosHourAngle = -Math.tan(latRad) * Math.tan(declination * (Math.PI / 180));
    
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
    
    return { sunrise, sunset };
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
    
    if (normalizedPhase < 0.025 || normalizedPhase >= 0.975) {
      phaseName = "New Moon";
      illumination = 0;
    } else if (normalizedPhase < 0.25) {
      phaseName = "Waxing Crescent";
      illumination = normalizedPhase * 4 * 100;
    } else if (normalizedPhase < 0.275) {
      phaseName = "First Quarter";
      illumination = 50;
    } else if (normalizedPhase < 0.475) {
      phaseName = "Waxing Gibbous";
      illumination = 50 + (normalizedPhase - 0.25) * 2 * 100;
    } else if (normalizedPhase < 0.525) {
      phaseName = "Full Moon";
      illumination = 100;
    } else if (normalizedPhase < 0.725) {
      phaseName = "Waning Gibbous";
      illumination = 100 - (normalizedPhase - 0.5) * 2 * 100;
    } else if (normalizedPhase < 0.775) {
      phaseName = "Last Quarter";
      illumination = 50;
    } else {
      phaseName = "Waning Crescent";
      illumination = 50 - (normalizedPhase - 0.75) * 2 * 100;
    }
    
    return {
      phase: normalizedPhase,
      phaseName,
      illumination: Math.round(illumination)
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
}

export default WeatherUtils;