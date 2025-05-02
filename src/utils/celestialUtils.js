// utils/celestialUtils.js
// Functions for celestial calculations such as sunrise/sunset and moon phases

/**
 * Calculate sunrise and sunset times based on latitude band and date
 * @param {Date} date - The date to calculate for
 * @param {string} latitudeBand - One of: 'equatorial', 'tropical', 'temperate', 'subarctic', 'polar'
 * @returns {Object} - Contains sunrise, sunset, and daylight hours
 */
export const calculateSunriseSunset = (date, latitudeBand = 'temperate') => {
    // Define approximate daylight hours by latitude band and month
    // Values are average daylight hours for each month of the year
    const daylightHours = {
      'equatorial': [12.0, 12.0, 12.0, 12.0, 12.0, 12.0, 12.0, 12.0, 12.0, 12.0, 12.0, 12.0], // Almost constant 12h
      'tropical': [11.0, 11.5, 12.0, 12.5, 13.0, 13.0, 13.0, 12.5, 12.0, 11.5, 11.0, 11.0],
      'temperate': [9.0, 10.0, 11.5, 13.0, 14.5, 15.5, 15.0, 13.5, 12.0, 10.5, 9.0, 8.5],
      'subarctic': [6.0, 8.0, 10.0, 13.0, 16.0, 18.0, 17.0, 14.0, 11.0, 8.0, 6.0, 5.0],
      'polar': [0.0, 4.0, 10.0, 16.0, 24.0, 24.0, 24.0, 18.0, 12.0, 6.0, 0.0, 0.0] // 24h day/night cycles
    };
    
    // Default to temperate if unknown band is provided
    const band = daylightHours[latitudeBand] ? latitudeBand : 'temperate';
    
    const month = date.getMonth(); // 0-11
    const daylight = daylightHours[band][month];
    
    // Calculate sunrise/sunset around solar noon (12:00)
    const sunriseHour = 12 - (daylight / 2);
    const sunsetHour = 12 + (daylight / 2);
    
    // Create date objects
    const sunrise = new Date(date);
    sunrise.setHours(Math.floor(sunriseHour), Math.round((sunriseHour % 1) * 60), 0);
    
    const sunset = new Date(date);
    sunset.setHours(Math.floor(sunsetHour), Math.round((sunsetHour % 1) * 60), 0);
    
    return { 
      sunrise, 
      sunset, 
      daylightHours: daylight,
      isDaytime: isDaytime(date, sunrise, sunset)
    };
  };
  
  /**
   * Check if the given time is during daylight hours
   * @param {Date} currentTime - The time to check
   * @param {Date} sunrise - Sunrise time
   * @param {Date} sunset - Sunset time
   * @returns {boolean} - True if it's daytime
   */
  export const isDaytime = (currentTime, sunrise, sunset) => {
    // If sunrise or sunset aren't provided, calculate them
    if (!sunrise || !sunset) {
      const { sunrise: calculatedSunrise, sunset: calculatedSunset } = 
        calculateSunriseSunset(currentTime, 'temperate');
      sunrise = calculatedSunrise;
      sunset = calculatedSunset;
    }
  
    // Special case for polar regions - check if we're in 24h daylight or night
    if (sunrise.getHours() === sunset.getHours()) {
      // If sunrise and sunset are at the same time, check if it's 0h or 24h
      return sunrise.getHours() > 0; // True for 24h daylight, false for 24h night
    }
    
    // Convert all to minutes since midnight for easier comparison
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const sunriseMinutes = sunrise.getHours() * 60 + sunrise.getMinutes();
    const sunsetMinutes = sunset.getHours() * 60 + sunset.getMinutes();
    
    return currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes;
  };
  
  /**
   * Calculate moon phase and moonrise/moonset times (simplified)
   * @param {Date} date - The date to calculate for
   * @param {Object} sunriseSunset - Sunrise/sunset data from calculateSunriseSunset
   * @returns {Object} - Contains phase, moonrise, moonset, and phase name
   */
  export const calculateMoonPhase = (date, sunriseSunset = null) => {
    // Simplified lunar cycle (29.53 days)
    const LUNAR_CYCLE = 29.53;
    
    // Known new moon date for reference
    const REF_NEW_MOON = new Date(2000, 0, 6); // January 6, 2000
    
    // Days since reference new moon
    const daysSinceRef = (date - REF_NEW_MOON) / (1000 * 60 * 60 * 24);
    
    // Position in lunar cycle (0 to 1)
    const phase = (daysSinceRef % LUNAR_CYCLE) / LUNAR_CYCLE;
    
    // Calculate sunrise/sunset if not provided
    const { sunrise, sunset } = sunriseSunset || 
      calculateSunriseSunset(date, 'temperate');
    
    // Calculate moonrise/moonset (this is simplified)
    // Full moon rises at sunset, new moon rises at sunrise
    // Offset based on phase - this is approximate
    const moonriseOffset = Math.round(12 * (phase - 0.5)); // -6h to +6h offset
    
    const moonrise = new Date(sunrise);
    moonrise.setHours(moonrise.getHours() + 12 * phase); // Simplified formula
    
    const moonset = new Date(moonrise);
    moonset.setHours(moonset.getHours() + 12); // Moon is up for ~12 hours
    
    // Determine moon phase name and icon
    let phaseName = '';
    let phaseIcon = '';
    
    if (phase < 0.025) {
      phaseName = 'New Moon';
      phaseIcon = '🌑';
    } else if (phase < 0.125) {
      phaseName = 'Waxing Crescent';
      phaseIcon = '🌒';
    } else if (phase < 0.25) {
      phaseName = 'First Quarter';
      phaseIcon = '🌓';
    } else if (phase < 0.375) {
      phaseName = 'Waxing Gibbous';
      phaseIcon = '🌔';
    } else if (phase < 0.475) {
      phaseName = 'Full Moon';
      phaseIcon = '🌕';
    } else if (phase < 0.625) {
      phaseName = 'Waning Gibbous';
      phaseIcon = '🌖';
    } else if (phase < 0.75) {
      phaseName = 'Last Quarter';
      phaseIcon = '🌗';
    } else if (phase < 0.875) {
      phaseName = 'Waning Crescent';
      phaseIcon = '🌘';
    } else {
      phaseName = 'New Moon';
      phaseIcon = '🌑';
    }
    
    return {
      phase,
      phaseName,
      phaseIcon,
      moonrise,
      moonset
    };
  };
  
  /**
   * Get latitude band based on climate type
   * @param {string} climate - Climate type from region data
   * @returns {string} - Latitude band for celestial calculations
   */
  export const getLatitudeBandFromClimate = (climate) => {
    // Map climate types to latitude bands
    const climateBands = {
      'tropical-rainforest': 'equatorial',
      'tropical-seasonal': 'tropical',
      'temperate-deciduous': 'temperate',
      'temperate-rainforest': 'temperate',
      'temperate-grassland': 'temperate',
      'desert': 'tropical', // Most deserts are in tropical regions
      'boreal-forest': 'subarctic',
      'tundra': 'polar'
    };
    
    return climateBands[climate] || 'temperate'; // Default to temperate
  };
  
  /**
   * Format time for display
   * @param {Date} date - The date to format
   * @returns {string} - Formatted time string (e.g., "6:30 AM")
   */
  export const formatTime = (date) => {
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  /**
   * Get all celestial information for a given date and climate
   * @param {Date} date - The date to calculate for
   * @param {string} climate - Climate type from region data
   * @returns {Object} - Contains all celestial data
   */
  export const getCelestialData = (date, climate) => {
    const latitudeBand = getLatitudeBandFromClimate(climate);
    const sunriseSunset = calculateSunriseSunset(date, latitudeBand);
    const moonData = calculateMoonPhase(date, sunriseSunset);
    
    return {
      ...sunriseSunset,
      ...moonData,
      latitudeBand
    };
  };