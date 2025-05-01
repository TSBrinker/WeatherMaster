// utils/weatherUtils.js

/**
 * Gets the appropriate weather icon based on condition and time
 * @param {string} condition - The weather condition
 * @param {number} hour - The hour (0-23)
 * @returns {string} - The emoji icon
 */
export const getWeatherIcon = (condition, hour = 12) => {
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
      default:
        return '❓';
    }
  };
  
  /**
   * Gets the appropriate wind icon based on intensity
   * @param {string} intensity - The wind intensity
   * @returns {string|null} - The emoji icon or null for calm winds
   */
  export const getWindIcon = (intensity) => {
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
  };
  
  /**
   * Gets the background color for a weather condition
   * @param {string} condition - The weather condition
   * @param {boolean} isDarkMode - Whether dark mode is enabled
   * @returns {string} - CSS color value
   */
  export const getWeatherBackground = (condition, isDarkMode = true) => {
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
  };
  
  /**
   * Gets the style class based on wind intensity
   * @param {string} intensity - The wind intensity
   * @returns {string} - CSS class name
   */
  export const getWindIntensityClass = (intensity) => {
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
  };
  
  /**
   * Gets formatted temperature with appropriate color based on value
   * @param {number} temperature - Temperature in Fahrenheit
   * @returns {Object} - Contains formatted value and CSS color class
   */
  export const getFormattedTemperature = (temperature) => {
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
  };
  
  /**
   * Maps biome name to climate table key
   * @param {string} biome - UI biome name
   * @returns {string} - Climate table key
   */
  export const mapBiomeToClimate = (biome) => {
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
    
    return biome ? biomeMap[biome] || "temperate-deciduous" : biomeMap;
  };