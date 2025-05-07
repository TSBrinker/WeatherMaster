// src/services/SunriseSunsetService.js
// Service for calculating sunrise and sunset times based on latitude and date

// Latitude band approximations (degrees latitude)
const LATITUDE_BANDS = {
    "equatorial": 5,    // 0-10 degrees
    "tropical": 20,     // 10-30 degrees
    "temperate": 45,    // 30-60 degrees
    "subarctic": 65,    // 60-75 degrees
    "polar": 80         // 75-90 degrees
  };
  
  // Day length variations by latitude and solstice/equinox (hours)
  const DAY_LENGTH_BY_LATITUDE = {
    "equatorial": {
      summerSolstice: 12.25, // Near-constant daylight hours near equator
      winterSolstice: 11.75,
      equinox: 12
    },
    "tropical": {
      summerSolstice: 13.5,
      winterSolstice: 10.5,
      equinox: 12
    },
    "temperate": {
      summerSolstice: 16,     // Long summer days
      winterSolstice: 8,      // Short winter days
      equinox: 12
    },
    "subarctic": {
      summerSolstice: 20,     // Very long summer days
      winterSolstice: 4,      // Very short winter days
      equinox: 12
    },
    "polar": {
      summerSolstice: 24,     // Midnight sun
      winterSolstice: 0,      // Polar night
      equinox: 12
    }
  };
  
  class SunriseSunsetService {
    /**
     * Calculate day of year (0-365)
     * @param {Date} date - The date
     * @returns {number} - Day of year
     */
    getDayOfYear(date) {
      const start = new Date(date.getFullYear(), 0, 0);
      const diff = date - start;
      const oneDay = 1000 * 60 * 60 * 24;
      return Math.floor(diff / oneDay);
    }
  
    /**
     * Calculate approximate day length based on latitude and day of year
     * @param {string} latitudeBand - Latitude band name
     * @param {Date} date - The date
     * @returns {number} - Day length in hours
     */
    calculateDayLength(latitudeBand, date) {
      // Default to temperate if band not found
      const band = latitudeBand in LATITUDE_BANDS ? latitudeBand : "temperate";
      
      // Day of year where 0 = January 1
      const dayOfYear = this.getDayOfYear(date);
      
      // Calculate day length using a sinusoidal approximation
      // Day 0 = January 1 (winter in Northern Hemisphere)
      // Day 182 = July 1 (summer in Northern Hemisphere)
      
      // Band day length extremes
      const { summerSolstice, winterSolstice, equinox } = DAY_LENGTH_BY_LATITUDE[band];
      
      // Amplitude of variation from equinox
      const amplitude = (summerSolstice - winterSolstice) / 2;
      
      // Average day length
      const averageLength = (summerSolstice + winterSolstice) / 2;
      
      // Position in yearly cycle (0 to 2π)
      // Shifted by 0.5π to align winter solstice with start of year
      const position = 2 * Math.PI * (dayOfYear / 365) - 0.5 * Math.PI;
      
      // Calculate day length
      const dayLength = averageLength + amplitude * Math.sin(position);
      
      return dayLength;
    }
  
    /**
     * Calculate sunrise and sunset times
     * @param {string} latitudeBand - Latitude band
     * @param {Date} date - The date
     * @returns {object} - Sunrise and sunset times as Date objects
     */
    getSunriseSunset(latitudeBand, date) {
      // Get day length in hours
      const dayLength = this.calculateDayLength(latitudeBand, date);
      
      // Set a base date with just the date part (no time)
      const baseDate = new Date(date);
      baseDate.setHours(0, 0, 0, 0);
      
      // Calculate midday (noon)
      const noon = new Date(baseDate);
      noon.setHours(12, 0, 0, 0);
      
      // Calculate sunrise and sunset around noon
      const halfDayLength = dayLength / 2;
      
      const sunrise = new Date(noon);
      sunrise.setHours(12 - halfDayLength, 0, 0, 0);
      
      const sunset = new Date(noon);
      sunset.setHours(12 + halfDayLength, 0, 0, 0);
      
      return {
        sunrise,
        sunset,
        dayLengthHours: dayLength
      };
    }
  
    /**
     * Format a time for display (hour only, AM/PM)
     * @param {Date} date - The date with time
     * @returns {string} - Formatted time
     */
    formatTime(date) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        hour12: true
      });
    }
  
    /**
     * Get formatted sunrise, sunset info with daylight hours
     * @param {string} latitudeBand - Latitude band
     * @param {Date} date - The date
     * @returns {object} - Formatted sunrise/sunset info
     */
    getFormattedSunriseSunset(latitudeBand, date) {
      const { sunrise, sunset, dayLengthHours } = this.getSunriseSunset(latitudeBand, date);
      
      const dayLengthHoursRounded = Math.round(dayLengthHours * 10) / 10; // Round to 1 decimal
      const dayLengthMinutes = Math.round((dayLengthHours % 1) * 60);
      
      return {
        sunrise,
        sunset,
        sunriseTime: this.formatTime(sunrise),
        sunsetTime: this.formatTime(sunset),
        dayLengthHours: dayLengthHoursRounded,
        dayLengthFormatted: `${Math.floor(dayLengthHours)} hr ${dayLengthMinutes} min`,
        isDaytime: this.isDaytime(date, sunrise, sunset)
      };
    }
  
    /**
     * Check if it's currently daytime
     * @param {Date} currentTime - Current time
     * @param {Date} sunrise - Sunrise time
     * @param {Date} sunset - Sunset time
     * @returns {boolean} - True if it's daytime
     */
    isDaytime(currentTime, sunrise, sunset) {
      const current = currentTime.getTime();
      return current >= sunrise.getTime() && current <= sunset.getTime();
    }
  
    /**
     * Get the current solar position as a value between 0 and 1
     * 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 1 = midnight
     * @param {Date} currentTime - Current time
     * @param {Date} sunrise - Sunrise time
     * @param {Date} sunset - Sunset time
     * @returns {number} - Solar position (0-1)
     */
    getSolarPosition(currentTime, sunrise, sunset) {
      // Start from midnight
      const midnight = new Date(currentTime);
      midnight.setHours(0, 0, 0, 0);
      
      // Calculate next midnight
      const nextMidnight = new Date(midnight);
      nextMidnight.setDate(nextMidnight.getDate() + 1);
      
      // Calculate time positions in milliseconds
      const midnightMs = midnight.getTime();
      const nextMidnightMs = nextMidnight.getTime();
      const dayLengthMs = nextMidnightMs - midnightMs;
      
      const currentMs = currentTime.getTime();
      const sunriseMs = sunrise.getTime();
      const sunsetMs = sunset.getTime();
      
      // Calculate position in day cycle (0-1)
      const position = (currentMs - midnightMs) / dayLengthMs;
      
      return position;
    }
  }
  
  // Export singleton instance
  const sunriseSunsetService = new SunriseSunsetService();
  export default sunriseSunsetService;