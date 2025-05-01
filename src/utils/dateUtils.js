// utils/dateUtils.js

/**
 * Formats a date object for display
 * @param {Date} date - The date to format
 * @param {string} format - The format type ('full', 'dateOnly', 'timeOnly', 'short')
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, format = 'full') => {
    if (!date) return '';
    
    // Ensure we have a valid Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    switch (format) {
      case 'full':
        return dateObj.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });
      
      case 'dateOnly':
        return dateObj.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      
      case 'timeOnly':
        return dateObj.toLocaleString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });
      
      case 'short':
        return dateObj.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });
        
      default:
        return dateObj.toLocaleString();
    }
  };
  
  /**
   * Calculates the number of hours between two dates
   * @param {Date} startDate - The start date
   * @param {Date} endDate - The end date
   * @returns {number} - The number of hours between the dates
   */
  export const hoursBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const diffMs = end - start;
    return Math.floor(diffMs / (1000 * 60 * 60));
  };
  
  /**
   * Adds a specified number of hours to a date
   * @param {Date} date - The date to modify
   * @param {number} hours - Number of hours to add
   * @returns {Date} - The new date
   */
  export const addHours = (date, hours) => {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
  };
  
  /**
   * Determines if a date is during daytime (between 6am and 6pm)
   * @param {Date} date - The date to check
   * @returns {boolean} - True if daytime
   */
  export const isDaytime = (date) => {
    const hours = date.getHours();
    return hours >= 6 && hours < 18;
  };
  
  /**
   * Gets the season for a date based on northern hemisphere seasons
   * @param {Date} date - The date to check
   * @returns {string} - The season name ('winter', 'spring', 'summer', 'fall')
   */
  export const getSeason = (date) => {
    const month = date.getMonth();
    
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };
  
  /**
   * Parses a date string in MM-DD format
   * @param {string} dateString - Date string in MM-DD format (e.g., "12-21")
   * @param {number} year - The year to use
   * @returns {Date} - Date object representing the date
   */
  export const parseSeasonalDate = (dateString, year) => {
    if (!dateString || !dateString.includes('-')) {
      return null;
    }
    
    const [month, day] = dateString.split('-').map(num => parseInt(num, 10));
    
    // Check for valid month and day
    if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }
    
    return new Date(year, month - 1, day); // Month is 0-indexed in JS Date
  };
  
  /**
   * Calculate sunrise and sunset times based on date and latitude
   * @param {Date} date - The date to calculate for
   * @param {number} latitude - Latitude (-90 to 90)
   * @returns {Object} - Contains sunrise and sunset as Date objects
   */
  export const calculateSunriseSunset = (date, latitude = 40) => {
    // This is a simplified calculation that approximates sunrise/sunset
    // A real implementation would use solar calculations
    
    const day = date.getDate();
    const month = date.getMonth(); // 0-11
    const year = date.getFullYear();
    
    // Day of year (approximate)
    const dayOfYear = Math.floor((date - new Date(year, 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Adjust for latitude and day of year
    // Northern hemisphere seasons
    let sunriseHour = 6; // Default sunrise at 6am
    let sunsetHour = 18; // Default sunset at 6pm
    
    // Latitude adjustment (simplified)
    // Higher latitudes have more extreme day/night changes
    const latitudeAdjust = Math.abs(latitude) / 90; // 0 to 1
    
    // Day of year adjustment (simplified)
    // More extreme at solstices, less at equinoxes
    const dayAdjust = Math.sin((dayOfYear / 365) * Math.PI * 2) * 2; // -2 to 2
    
    // Calculate adjustments differently for northern/southern hemispheres
    const isNorthern = latitude >= 0;
    
    if (isNorthern) {
      // Northern hemisphere (summer = longer days)
      sunriseHour = Math.round(6 - (latitudeAdjust * dayAdjust));
      sunsetHour = Math.round(18 + (latitudeAdjust * dayAdjust));
    } else {
      // Southern hemisphere (winter = shorter days when north is summer)
      sunriseHour = Math.round(6 + (latitudeAdjust * dayAdjust));
      sunsetHour = Math.round(18 - (latitudeAdjust * dayAdjust));
    }
    
    // Clamp values to valid hours
    sunriseHour = Math.max(0, Math.min(12, sunriseHour));
    sunsetHour = Math.max(12, Math.min(23, sunsetHour));
    
    // Create Date objects
    const sunrise = new Date(year, month, day, sunriseHour, 0, 0);
    const sunset = new Date(year, month, day, sunsetHour, 0, 0);
    
    return { sunrise, sunset };
  };
  
  /**
   * Calculate the moon phase for a given date
   * @param {Date} date - The date to calculate for
   * @returns {Object} - Contains phase name and icon
   */
  export const calculateMoonPhase = (date) => {
    // Simplified calculation based on lunar cycle
    // A real implementation would use astronomical calculations
    
    // Lunar cycle is approximately 29.53 days
    const LUNAR_CYCLE = 29.53;
    
    // Known new moon date for reference
    const REF_NEW_MOON = new Date(2000, 0, 6); // Jan 6, 2000
    
    // Days since reference new moon
    const daysSinceRef = (date - REF_NEW_MOON) / (1000 * 60 * 60 * 24);
    
    // Position in lunar cycle (0 to 1)
    const phase = (daysSinceRef % LUNAR_CYCLE) / LUNAR_CYCLE;
    
    // Determine moon phase name and icon
    if (phase < 0.025) return { name: 'New Moon', icon: '🌑' };
    if (phase < 0.125) return { name: 'Waxing Crescent', icon: '🌒' };
    if (phase < 0.25) return { name: 'First Quarter', icon: '🌓' };
    if (phase < 0.375) return { name: 'Waxing Gibbous', icon: '🌔' };
    if (phase < 0.475) return { name: 'Full Moon', icon: '🌕' };
    if (phase < 0.625) return { name: 'Waning Gibbous', icon: '🌖' };
    if (phase < 0.75) return { name: 'Last Quarter', icon: '🌗' };
    if (phase < 0.875) return { name: 'Waning Crescent', icon: '🌘' };
    return { name: 'New Moon', icon: '🌑' };
  };