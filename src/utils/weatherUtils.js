// src/utils/weatherUtils.js
// Utility functions for meteorological calculations
// UPDATED: Solar angle-based season determination

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
   * Calculate solar declination angle for a given day of year
   * @param {number} dayOfYear - Day of year (0-365)
   * @returns {number} - Solar declination in degrees
   */
  static getSolarDeclination(dayOfYear) {
    // Solar declination formula - angle between sun's rays and equatorial plane
    return 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
  }

  /**
   * Calculate daylight hours for a given latitude and day of year
   * @param {number} latitude - Latitude in degrees
   * @param {number} dayOfYear - Day of year (0-365)
   * @returns {number} - Hours of daylight
   */
  static getDaylightHours(latitude, dayOfYear) {
    const declination = this.getSolarDeclination(dayOfYear);
    
    // Convert to radians
    const latRad = latitude * (Math.PI / 180);
    const decRad = declination * (Math.PI / 180);
    
    // Calculate hour angle
    const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);
    
    // Handle polar day/night
    if (cosHourAngle < -1) return 24; // Polar day
    if (cosHourAngle > 1) return 0;   // Polar night
    
    const hourAngle = Math.acos(cosHourAngle) * (180 / Math.PI);
    return (2 * hourAngle) / 15;
  }

  /**
   * Calculate season based on solar angle and daylight hours - REALISTIC APPROACH
   * @param {Date} date - Date to calculate season for
   * @param {number} latitude - Latitude (-90 to 90)
   * @returns {string} - Season name
   */
  static getSeasonFromDate(date, latitude = 40) {
    const dayOfYear = this.getDayOfYear(date);
    const daylightHours = this.getDaylightHours(latitude, dayOfYear);
    const declination = this.getSolarDeclination(dayOfYear);
    
    // For southern hemisphere, invert the declination-based logic
    const adjustedDeclination = latitude < 0 ? -declination : declination;
    
    console.log(`[Season Calc] Lat: ${latitude}°, Day: ${dayOfYear}, Daylight: ${daylightHours.toFixed(1)}h, Declination: ${adjustedDeclination.toFixed(1)}°`);
    
    // POLAR REGIONS (above/below ~66.5°) - Season based on sun presence
    if (Math.abs(latitude) >= 66.5) {
      return this.getPolarSeason(daylightHours, adjustedDeclination, latitude);
    }
    
    // SUBPOLAR REGIONS (60-66.5°) - Mixed approach
    if (Math.abs(latitude) >= 60) {
      return this.getSubpolarSeason(daylightHours, adjustedDeclination, latitude);
    }
    
    // TEMPERATE REGIONS (30-60°) - Traditional solar angle approach
    if (Math.abs(latitude) >= 30) {
      return this.getTemperateSeason(adjustedDeclination, daylightHours);
    }
    
    // TROPICAL REGIONS (0-30°) - Minimal seasonal variation
    return this.getTropicalSeason(adjustedDeclination, dayOfYear);
  }

  /**
   * Determine season for polar regions based on sun presence
   * @param {number} daylightHours - Hours of daylight
   * @param {number} declination - Solar declination angle
   * @param {number} latitude - Latitude
   * @returns {string} - Season name
   */
  static getPolarSeason(daylightHours, declination, latitude) {
    // Polar day period = summer
    if (daylightHours >= 23) {
      console.log(`[Season] Polar Day -> SUMMER`);
      return "summer";
    }
    
    // Polar night period = winter
    if (daylightHours <= 1) {
      console.log(`[Season] Polar Night -> WINTER`);
      return "winter";
    }
    
    // Transition periods - check if daylight is increasing or decreasing
    // Spring: daylight increasing (positive declination trend)
    // Fall: daylight decreasing (negative declination trend)
    
    if (declination > 10) {
      // Late spring transitioning to summer
      console.log(`[Season] High declination, increasing daylight -> SPRING`);
      return "spring";
    } else if (declination < -10) {
      // Late fall transitioning to winter
      console.log(`[Season] Low declination, decreasing daylight -> FALL`);
      return "fall";
    } else if (declination > 0) {
      // Early spring
      console.log(`[Season] Positive declination, moderate daylight -> SPRING`);
      return "spring";
    } else {
      // Early fall
      console.log(`[Season] Negative declination, moderate daylight -> FALL`);
      return "fall";
    }
  }

  /**
   * Determine season for subpolar regions (mixed solar/calendar approach)
   * @param {number} daylightHours - Hours of daylight
   * @param {number} declination - Solar declination angle
   * @param {number} latitude - Latitude
   * @returns {string} - Season name
   */
  static getSubpolarSeason(daylightHours, declination, latitude) {
    // Very long days = summer
    if (daylightHours >= 18) {
      console.log(`[Season] Very long day (${daylightHours.toFixed(1)}h) -> SUMMER`);
      return "summer";
    }
    
    // Very short days = winter
    if (daylightHours <= 6) {
      console.log(`[Season] Very short day (${daylightHours.toFixed(1)}h) -> WINTER`);
      return "winter";
    }
    
    // Medium days - use declination to distinguish spring vs fall
    if (declination > 5) {
      console.log(`[Season] Medium day, positive declination -> SPRING`);
      return "spring";
    } else if (declination < -5) {
      console.log(`[Season] Medium day, negative declination -> FALL`);
      return "fall";
    } else if (declination > 0) {
      // Borderline - use daylight length as tiebreaker
      return daylightHours > 12 ? "spring" : "summer";
    } else {
      // Borderline - use daylight length as tiebreaker  
      return daylightHours > 12 ? "fall" : "winter";
    }
  }

  /**
   * Determine season for temperate regions using solar angle
   * @param {number} declination - Solar declination angle
   * @param {number} daylightHours - Hours of daylight
   * @returns {string} - Season name
   */
  static getTemperateSeason(declination, daylightHours) {
    // Peak summer: high sun angle
    if (declination >= 20) {
      console.log(`[Season] High solar angle (${declination.toFixed(1)}°) -> SUMMER`);
      return "summer";
    }
    
    // Peak winter: low sun angle
    if (declination <= -20) {
      console.log(`[Season] Low solar angle (${declination.toFixed(1)}°) -> WINTER`);
      return "winter";
    }
    
    // Spring: sun angle increasing
    if (declination > 0) {
      console.log(`[Season] Positive solar angle (${declination.toFixed(1)}°) -> SPRING`);
      return "spring";
    }
    
    // Fall: sun angle decreasing
    console.log(`[Season] Negative solar angle (${declination.toFixed(1)}°) -> FALL`);
    return "fall";
  }

  /**
   * Determine season for tropical regions (minimal variation)
   * @param {number} declination - Solar declination angle
   * @param {number} dayOfYear - Day of year
   * @returns {string} - Season name
   */
  static getTropicalSeason(declination, dayOfYear) {
    // In tropical regions, seasons are more about wet/dry than temperature
    // We'll use a simplified approach based on typical weather patterns
    
    // Wet season (typically when sun is overhead)
    if (Math.abs(declination) < 10) {
      console.log(`[Season] Tropical wet season`);
      return "summer"; // Convention: wet season = summer
    }
    
    // Dry season
    console.log(`[Season] Tropical dry season`);
    return "winter"; // Convention: dry season = winter
  }

  /**
   * Get sunrise/sunset hours based on latitude and day of year
   * @param {number} latitude - Latitude in degrees
   * @param {number} dayOfYear - Day of year (0-365)
   * @returns {object} - Sunrise and sunset hours
   */
  static getDaylightInfo(latitude, dayOfYear) {
    const daylightHours = this.getDaylightHours(latitude, dayOfYear);
    
    // Handle polar conditions
    if (daylightHours >= 24) {
      return { sunrise: 0, sunset: 24, dayLength: 24 };
    }
    if (daylightHours <= 0) {
      return { sunrise: 12, sunset: 12, dayLength: 0 };
    }
    
    // Calculate sunrise and sunset
    const halfDay = daylightHours / 2;
    const sunrise = 12 - halfDay;
    const sunset = 12 + halfDay;
    
    return { 
      sunrise: Math.max(0, sunrise), 
      sunset: Math.min(24, sunset), 
      dayLength: daylightHours 
    };
  }

  /**
   * Get season boundaries for a given latitude (for informational purposes)
   * @param {number} latitude - Latitude in degrees
   * @returns {object} - Season boundary information
   */
  static getSeasonBoundaries(latitude) {
    const boundaries = {
      latitude: latitude,
      approach: "solar-angle-based"
    };
    
    if (Math.abs(latitude) >= 66.5) {
      boundaries.type = "polar";
      boundaries.summer = "Polar day period (sun never sets)";
      boundaries.winter = "Polar night period (sun never rises)";
      boundaries.spring = "Rapid daylight increase";
      boundaries.fall = "Rapid daylight decrease";
    } else if (Math.abs(latitude) >= 60) {
      boundaries.type = "subpolar";
      boundaries.summer = "18+ hours daylight";
      boundaries.winter = "6- hours daylight";
      boundaries.spring = "Daylight increasing, positive solar angle";
      boundaries.fall = "Daylight decreasing, negative solar angle";
    } else if (Math.abs(latitude) >= 30) {
      boundaries.type = "temperate";
      boundaries.summer = "Solar declination +20° to +23.5°";
      boundaries.winter = "Solar declination -20° to -23.5°";
      boundaries.spring = "Solar declination 0° to +20°";
      boundaries.fall = "Solar declination 0° to -20°";
    } else {
      boundaries.type = "tropical";
      boundaries.summer = "Wet season (sun overhead)";
      boundaries.winter = "Dry season (sun distant)";
    }
    
    return boundaries;
  }
}

export default WeatherUtils;