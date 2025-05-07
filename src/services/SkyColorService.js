// src/services/SkyColorService.js - FIXED version
// Service for calculating dynamic sky colors based on time, weather and moon phase
import sunriseSunsetService from './SunriseSunsetService';
import moonService from './MoonService';

// Sky color palette for different times of day
const COLOR_PALETTES = {
  // Dawn colors (just before sunrise, orange-pink glow)
  dawn: {
    base: '#FF7E45', // Orange-pink  
    clouds: {
      light: '#FFA07A', // Light orange
      heavy: '#CD5C5C', // Indian red
    }
  },
  
  // Sunrise colors (orange-yellow)
  sunrise: {
    base: '#FFA500', // Orange
    clouds: {
      light: '#FFD700', // Gold
      heavy: '#E6923F', // Darker orange
    }
  },
  
  // Morning colors (blue with slight yellow tint)
  morning: {
    base: '#87CEEB', // Sky blue
    clouds: {
      light: '#B0E2FF', // Light sky blue
      heavy: '#87AFC7', // Dark sky blue
    }
  },
  
  // Midday colors (bright blue)
  midday: {
    base: '#1E90FF', // Dodger blue
    clouds: {
      light: '#87CEEB', // Sky blue
      heavy: '#4682B4', // Steel blue
    }
  },
  
  // Afternoon colors (blue with slight orange tint)
  afternoon: {
    base: '#4682B4', // Steel blue
    clouds: {
      light: '#87CEFA', // Light sky blue
      heavy: '#4169E1', // Royal blue
    }
  },
  
  // Sunset colors (orange-red)
  sunset: {
    base: '#FF4500', // Orange-red
    clouds: {
      light: '#FF7F50', // Coral
      heavy: '#CD5C5C', // Indian red
    }
  },
  
  // Dusk colors (purple-blue)
  dusk: {
    base: '#483D8B', // Dark slate blue
    clouds: {
      light: '#9370DB', // Medium purple
      heavy: '#4B0082', // Indigo
    }
  },
  
  // Night colors (dark blue)
  night: {
    base: '#191970', // Midnight blue
    moon: {
      // Additional brightness based on moon phase
      new: '#000033', // Very dark blue (no moon)
      quarter: '#000044', // Slightly brighter
      full: '#000066', // Brighter with full moon
    },
    clouds: {
      light: '#2F4F4F', // Dark slate gray
      heavy: '#000033', // Very dark blue
    }
  }
};

// Time ranges for periods of the day (represented as fraction of day 0-1)
const TIME_PERIODS = {
  dawn: { start: 0.17, end: 0.21 },      // ~4:00 - 5:00 AM
  sunrise: { start: 0.21, end: 0.25 },   // ~5:00 - 6:00 AM
  morning: { start: 0.25, end: 0.33 },   // ~6:00 - 8:00 AM
  midday: { start: 0.33, end: 0.58 },    // ~8:00 AM - 2:00 PM
  afternoon: { start: 0.58, end: 0.75 }, // ~2:00 - 6:00 PM
  sunset: { start: 0.75, end: 0.79 },    // ~6:00 - 7:00 PM
  dusk: { start: 0.79, end: 0.83 },      // ~7:00 - 8:00 PM
  night: { start: 0.83, end: 0.17 }      // ~8:00 PM - 4:00 AM
};

class SkyColorService {
  /**
   * Calculate sky color based on time, weather, and moon phase
   * @param {Date} dateTime - Current date and time
   * @param {string} weatherCondition - Current weather condition
   * @param {string} latitudeBand - Latitude band for sunrise/sunset calc
   * @returns {object} - Color information for background styling
   */
  calculateSkyColor(dateTime, weatherCondition, latitudeBand = 'temperate') {
    // Get sunrise/sunset times
    const { sunrise, sunset, isDaytime } = sunriseSunsetService.getFormattedSunriseSunset(
      latitudeBand, 
      dateTime
    );
    
    // Get moon information for night lighting
    const moonInfo = moonService.getMoonPhase(dateTime);
    
    // Get position in the day (0-1)
    const solarPosition = sunriseSunsetService.getSolarPosition(
      dateTime, 
      sunrise, 
      sunset
    );
    
    // Determine current period of day
    const period = this.determineTimePeriod(solarPosition);
    
    // Get base color for this period
    const colors = this.getColorForPeriod(period, weatherCondition, moonInfo);
    
    // Calculate transition
    let transitionColors = colors;
    let transitionProgress = 0;
    
    // Check if we're in a transition between periods
    const nextPeriod = this.getNextPeriod(period);
    if (nextPeriod) {
      const periodDef = TIME_PERIODS[period];
      const periodDuration = this.getPeriodDuration(periodDef);
      
      // Calculate progress through current period (0-1)
      const periodStart = periodDef.start;
      const periodProgress = (solarPosition - periodStart) / periodDuration;
      
      // If we're in the last 25% of the period, start transitioning to next
      if (periodProgress > 0.75) {
        // Calculate transition progress (0-1)
        transitionProgress = (periodProgress - 0.75) * 4; // Scale to 0-1
        const nextColors = this.getColorForPeriod(nextPeriod, weatherCondition, moonInfo);
        
        // Blend colors
        transitionColors = this.blendColors(colors, nextColors, transitionProgress);
      }
    }
    
    return {
      ...transitionColors,
      period,
      nextPeriod: transitionProgress > 0 ? nextPeriod : null,
      transitionProgress: Math.round(transitionProgress * 100),
      isDaytime
    };
  }
  
  /**
   * Determine the current time period based on solar position
   * @param {number} solarPosition - Position in day cycle (0-1)
   * @returns {string} - Time period name
   */
  determineTimePeriod(solarPosition) {
    for (const [period, range] of Object.entries(TIME_PERIODS)) {
      // Handle night which wraps around midnight
      if (period === 'night') {
        if (solarPosition >= range.start || solarPosition < range.end) {
          return period;
        }
      } 
      // All other periods
      else if (solarPosition >= range.start && solarPosition < range.end) {
        return period;
      }
    }
    
    // Default to midday if something goes wrong
    return 'midday';
  }
  
  /**
   * Get the next time period
   * @param {string} currentPeriod - Current time period 
   * @returns {string} - Next time period
   */
  getNextPeriod(currentPeriod) {
    const periods = Object.keys(TIME_PERIODS);
    const currentIndex = periods.indexOf(currentPeriod);
    
    if (currentIndex === -1) return 'midday';
    
    // Get next period (wrap around to dawn after night)
    return periods[(currentIndex + 1) % periods.length];
  }
  
  /**
   * Get the duration of a time period
   * @param {object} periodDef - Period definition with start and end times
   * @returns {number} - Duration as fraction of day
   */
  getPeriodDuration(periodDef) {
    let { start, end } = periodDef;
    
    // Handle night which wraps around midnight
    if (end < start) {
      end += 1.0; // Add a full day
    }
    
    return end - start;
  }
  
  /**
   * Get color for a specific time period, adjusted for weather and moon
   * @param {string} period - Time period name
   * @param {string} weatherCondition - Weather condition
   * @param {object} moonInfo - Moon phase information
   * @returns {object} - Color information
   */
  getColorForPeriod(period, weatherCondition, moonInfo) {
    const palette = COLOR_PALETTES[period];
    
    // Start with base color
    let result = {
      backgroundColor: palette.base,
      backgroundImage: 'none',
      textColor: this.getContrastColor(palette.base)
    };
    
    // Adjust for weather conditions
    if (weatherCondition) {
      const cloudLevel = this.getCloudLevel(weatherCondition);
      
      if (cloudLevel && palette.clouds) {
        const cloudColor = palette.clouds[cloudLevel];
        
        if (cloudColor) {
          // For heavy clouds, replace the base color
          if (cloudLevel === 'heavy') {
            result.backgroundColor = cloudColor;
            result.textColor = this.getContrastColor(cloudColor);
          } 
          // For light clouds, create a gradient
          else if (cloudLevel === 'light') {
            result.backgroundImage = `linear-gradient(to bottom, ${palette.base} 0%, ${cloudColor} 100%)`;
          }
        }
      }
    }
    
    // Adjust for moon at night
    if (period === 'night' && palette.moon) {
      const moonLevel = this.getMoonLevel(moonInfo);
      
      if (moonLevel && palette.moon[moonLevel]) {
        // For full moon, lighten the background
        if (moonLevel === 'full') {
          if (result.backgroundImage === 'none') {
            result.backgroundImage = `linear-gradient(to bottom, ${palette.moon[moonLevel]} 0%, ${result.backgroundColor} 100%)`;
          }
          
          // Also add a subtle radial gradient if the moon is visible
          const moonTime = this.isMoonVisible(moonInfo);
          if (moonTime) {
            result.backgroundImage = `radial-gradient(circle at ${moonTime === 'rising' ? 'left' : 'right'} top, rgba(255,255,255,0.2), transparent 50%), ${result.backgroundImage}`;
          }
        }
        // For other moon phases, slightly adjust color
        else {
          // Fixed: Add cloudLevel check and initialize to null if it's not defined
          const cloudLevelCheck = cloudLevel || null;
          
          if (cloudLevelCheck !== 'heavy') {
            result.backgroundColor = this.blendColors(
              {backgroundColor: result.backgroundColor}, 
              {backgroundColor: palette.moon[moonLevel]}, 
              0.3
            ).backgroundColor;
          }
        }
      }
    }
    
    return result;
  }
  
  /**
   * Get cloud level based on weather condition
   * @param {string} weatherCondition - Weather condition
   * @returns {string|null} - Cloud level or null
   */
  getCloudLevel(weatherCondition) {
    // Make sure weatherCondition is a string and convert to lowercase
    const condition = String(weatherCondition).toLowerCase();
    
    if (
      condition.includes('heavy clouds') || 
      condition.includes('thunderstorm') || 
      condition.includes('heavy rain') || 
      condition.includes('blizzard')
    ) {
      return 'heavy';
    }
    
    if (
      condition.includes('light clouds') || 
      condition.includes('rain') || 
      condition.includes('snow')
    ) {
      return 'light';
    }
    
    return null;
  }
  
  /**
   * Get moon level based on phase
   * @param {object} moonInfo - Moon phase information
   * @returns {string} - Moon level (new, quarter, full)
   */
  getMoonLevel(moonInfo) {
    const illumination = moonInfo.exactPercentage;
    
    if (illumination < 25) {
      return 'new';
    } else if (illumination < 75) {
      return 'quarter';
    } else {
      return 'full';
    }
  }
  
  /**
   * Check if moon is visible and whether it's rising or setting
   * @param {object} moonInfo - Moon phase information
   * @returns {string|null} - 'rising', 'setting' or null
   */
  isMoonVisible(moonInfo) {
    // This is a simplified approximation
    // In reality would need to check current time against moonrise/moonset
    
    const hour = new Date().getHours();
    
    // Moon is visible at night with illumination > 10%
    if (moonInfo.exactPercentage > 10) {
      if (hour > 18 && hour < 24) {
        return 'rising';
      } else if (hour >= 0 && hour < 6) {
        return 'setting';
      }
    }
    
    return null;
  }
  
  /**
   * Blend two color objects based on progress
   * @param {object} color1 - First color object
   * @param {object} color2 - Second color object
   * @param {number} progress - Blend progress (0-1)
   * @returns {object} - Blended color object
   */
  blendColors(color1, color2, progress) {
    const result = {};
    
    // Blend backgroundColor if both colors have it
    if (color1.backgroundColor && color2.backgroundColor) {
      result.backgroundColor = this.blendHexColors(
        color1.backgroundColor, 
        color2.backgroundColor, 
        progress
      );
    } else {
      result.backgroundColor = color1.backgroundColor || color2.backgroundColor;
    }
    
    // Blend backgroundImage
    // For simplicity, just switch between images at 50% progress
    result.backgroundImage = progress < 0.5 ? color1.backgroundImage : color2.backgroundImage;
    
    // Calculate text color based on background
    result.textColor = this.getContrastColor(result.backgroundColor);
    
    return result;
  }
  
  /**
   * Blend two hex colors
   * @param {string} color1 - First hex color
   * @param {string} color2 - Second hex color
   * @param {number} progress - Blend progress (0-1)
   * @returns {string} - Blended hex color
   */
  blendHexColors(color1, color2, progress) {
    // Parse hex colors
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    // Blend components
    const r = Math.round(r1 + (r2 - r1) * progress);
    const g = Math.round(g1 + (g2 - g1) * progress);
    const b = Math.round(b1 + (b2 - b1) * progress);
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  /**
   * Get a contrasting text color (black or white) based on background
   * @param {string} backgroundColor - Hex background color 
   * @returns {string} - '#ffffff' or '#000000'
   */
  getContrastColor(backgroundColor) {
    // Parse hex color
    const r = parseInt(backgroundColor.slice(1, 3), 16);
    const g = parseInt(backgroundColor.slice(3, 5), 16);
    const b = parseInt(backgroundColor.slice(5, 7), 16);
    
    // Calculate luminance (perceived brightness)
    // Formula: 0.299*R + 0.587*G + 0.114*B
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Use white text on dark backgrounds, black text on light backgrounds
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
}

// Export singleton instance
const skyColorService = new SkyColorService();
export default skyColorService;