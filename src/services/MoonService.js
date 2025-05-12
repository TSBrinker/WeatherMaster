// src/services/MoonService.js - UPDATED with improved phase calculation and emoji selection
// Service for calculating and managing moon phases

// Lunar cycle constants
const LUNAR_CYCLE_DAYS = 29.53059; // Average synodic month in days
const LUNAR_CYCLE_MS = LUNAR_CYCLE_DAYS * 24 * 60 * 60 * 1000; // Convert to milliseconds

// Reference new moon date - January 6, 2000 (a known new moon)
const REFERENCE_NEW_MOON = new Date('2000-01-06T00:00:00Z');

// Moon phases and their respective age ranges in days
const MOON_PHASES = [
  { name: "New Moon", min: 0, max: 1.84, icon: "🌑", illumination: 0 },
  { name: "Waxing Crescent", min: 1.84, max: 7.38, icon: "🌒", illumination: 25 },
  { name: "First Quarter", min: 7.38, max: 11.13, icon: "🌓", illumination: 50 },
  { name: "Waxing Gibbous", min: 11.13, max: 14.77, icon: "🌔", illumination: 75 },
  { name: "Full Moon", min: 14.77, max: 18.45, icon: "🌕", illumination: 100 },
  { name: "Waning Gibbous", min: 18.45, max: 22.13, icon: "🌖", illumination: 75 },
  { name: "Last Quarter", min: 22.13, max: 25.90, icon: "🌗", illumination: 50 },
  { name: "Waning Crescent", min: 25.90, max: 29.53, icon: "🌘", illumination: 25 }
];

// D&D 5E light levels per moon phase
const MOON_LIGHT_LEVELS = {
  "New Moon": "Darkness",
  "Waxing Crescent": "Darkness",
  "First Quarter": "Darkness",
  "Waxing Gibbous": "Dim Light in open areas",
  "Full Moon": "Dim Light in open areas",
  "Waning Gibbous": "Dim Light in open areas",
  "Last Quarter": "Darkness",
  "Waning Crescent": "Darkness"
};

/**
 * Moon service that provides moon phase calculations and information
 */
class MoonService {
  /**
   * Calculate the age of the moon in days for a given date
   * @param {Date} date - The date to calculate the moon age for
   * @returns {number} The age of the moon in days (0 to 29.53)
   */
  calculateMoonAge(date) {
    // Find the time difference in milliseconds
    const timeDiff = date.getTime() - REFERENCE_NEW_MOON.getTime();
    
    // Calculate days since reference new moon and apply modulo to get current age
    const daysSinceReferenceNewMoon = timeDiff / (24 * 60 * 60 * 1000);
    const moonAge = daysSinceReferenceNewMoon % LUNAR_CYCLE_DAYS;
    
    // Ensure the value is positive
    return moonAge >= 0 ? moonAge : moonAge + LUNAR_CYCLE_DAYS;
  }

  /**
   * Calculate moon illumination percentage based on age
   * @param {number} moonAge - The age of the moon in days
   * @returns {number} Illumination percentage (0-100)
   */
  calculateIllumination(moonAge) {
    // Convert moon age to a position in the cycle (0 to 1)
    const cyclePosition = moonAge / LUNAR_CYCLE_DAYS;
    
    // Calculate illumination - follows a sinusoidal pattern
    // From new moon (0%) to full moon (100%) and back to new moon (0%)
    // Using sin function shifted and scaled to get 0-100% range
    return Math.round(50 * (1 - Math.cos(cyclePosition * 2 * Math.PI)));
  }

  /**
   * Determine if the moon is waxing or waning
   * @param {number} moonAge - The age of the moon in days
   * @returns {boolean} True if waxing (growing), false if waning (shrinking)
   */
  isWaxing(moonAge) {
    return moonAge < LUNAR_CYCLE_DAYS / 2;
  }

  /**
   * Get the moon phase icon based on illumination percentage and waxing/waning status
   * @param {number} illumination - Percentage of moon illuminated (0-100)
   * @param {boolean} isWaxing - Whether the moon is waxing (growing) or waning (shrinking)
   * @returns {string} Moon phase emoji
   */
  getMoonPhaseIcon(illumination, isWaxing) {
    if (illumination < 5) return "🌑"; // New moon
    if (illumination < 35) return isWaxing ? "🌒" : "🌘"; // Crescent
    if (illumination < 65) return isWaxing ? "🌓" : "🌗"; // Quarter
    if (illumination < 95) return isWaxing ? "🌔" : "🌖"; // Gibbous
    return "🌕"; // Full moon
  }

  /**
   * Get the current moon phase for a given date
   * @param {Date} date - The date to get the moon phase for
   * @returns {object} Moon phase information including name, icon, illumination percentage
   */
  getMoonPhase(date) {
    const moonAge = this.calculateMoonAge(date);
    const exactIllumination = this.calculateIllumination(moonAge);
    const isWaxing = this.isWaxing(moonAge);
    
    // Find the matching phase based on moon age
    for (const phase of MOON_PHASES) {
      if (moonAge >= phase.min && moonAge < phase.max) {
        // Return detailed information about the phase
        return {
          name: phase.name,
          icon: phase.icon,
          illumination: phase.illumination,
          age: moonAge,
          ageInDays: Math.floor(moonAge),
          ageHours: Math.floor((moonAge % 1) * 24),
          exactPercentage: exactIllumination,
          lightLevel: MOON_LIGHT_LEVELS[phase.name] || "Darkness",
          isWaxing
        };
      }
    }
    
    // Fallback to new moon (shouldn't happen, but just in case)
    return {
      name: "New Moon",
      icon: "🌑",
      illumination: 0,
      age: 0,
      ageInDays: 0,
      ageHours: 0,
      exactPercentage: 0,
      lightLevel: MOON_LIGHT_LEVELS["New Moon"],
      isWaxing: true
    };
  }

  /**
   * Get the moon phase specifically for visualization
   * @param {Date} date - The date to check
   * @param {boolean} isDaytime - Whether the sun is currently in the sky
   * @param {boolean} isMoonVisible - Whether the moon is currently visible
   * @returns {object} Adjusted moon phase for visualization
   */
  getVisualMoonPhase(date, isDaytime, isMoonVisible) {
    // Get the actual phase first
    const basePhase = this.getMoonPhase(date);
    
    // If the moon is not visible, just return the regular phase
    if (!isMoonVisible) {
      return basePhase;
    }
    
    // If it's daytime and the moon is visible, adjust the illumination
    // to show a more realistic daytime moon appearance
    if (isDaytime) {
      // For daytime, typically only crescent and quarter moons are easily visible
      // Reduce the apparent illumination to reflect this
      const daytimeIllumination = Math.min(basePhase.exactPercentage, 50);
      
      // Get appropriate icon based on adjusted illumination
      const icon = this.getMoonPhaseIcon(
        daytimeIllumination, 
        basePhase.isWaxing
      );
      
      return {
        ...basePhase,
        exactPercentage: daytimeIllumination,
        icon
      };
    }
    
    // At night, return the regular phase with the correct icon
    return {
      ...basePhase,
      icon: this.getMoonPhaseIcon(basePhase.exactPercentage, basePhase.isWaxing)
    };
  }

  /**
   * Get the next full moon date from a given date
   * @param {Date} date - The starting date
   * @returns {Date} The date of the next full moon
   */
  getNextFullMoon(date) {
    const moonAge = this.calculateMoonAge(date);
    const daysToFullMoon = moonAge < 14.77 
      ? 14.77 - moonAge
      : LUNAR_CYCLE_DAYS - moonAge + 14.77;

    const nextFullMoon = new Date(date);
    nextFullMoon.setDate(nextFullMoon.getDate() + Math.floor(daysToFullMoon));
    nextFullMoon.setHours(
      nextFullMoon.getHours() + 
      Math.floor((daysToFullMoon % 1) * 24)
    );
    
    return nextFullMoon;
  }
  
  /**
   * Get the next new moon date from a given date
   * @param {Date} date - The starting date
   * @returns {Date} The date of the next new moon
   */
  getNextNewMoon(date) {
    const moonAge = this.calculateMoonAge(date);
    const daysToNewMoon = moonAge < 1 
      ? 1 - moonAge 
      : LUNAR_CYCLE_DAYS - moonAge + 1;
      
    const nextNewMoon = new Date(date);
    nextNewMoon.setDate(nextNewMoon.getDate() + Math.floor(daysToNewMoon));
    nextNewMoon.setHours(
      nextNewMoon.getHours() + 
      Math.floor((daysToNewMoon % 1) * 24)
    );
    
    return nextNewMoon;
  }

  /**
   * Calculate moonrise and moonset times (more accurate version)
   * @param {Date} date - The date to calculate for
   * @returns {object} The moonrise and moonset times
   */
  getMoonTimes(date) {
    // Get the phase for this date
    const phase = this.getMoonPhase(date);
    
    // Get base date without time
    const baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);
    
    // Phase position in the lunar cycle (0-1)
    const cyclePosition = phase.age / LUNAR_CYCLE_DAYS;
    
    // Calculate moonrise time
    // Full moon (0.5 cycle) rises at sunset (~6 PM)
    // New moon (0.0 cycle) rises at sunrise (~6 AM)
    // This creates a full 24-hour cycle with phase offset
    const baseRiseHour = 6 + 12 * cyclePosition;
    
    // Add daily shift (moon rises ~50 mins later each day - approx 12.2 hours per lunar cycle)
    // We'll use 0.84 hours (50 mins) per day × the day within the cycle
    const dailyShift = 0.84 * cyclePosition * LUNAR_CYCLE_DAYS;
    
    // Combine for total rise hour
    let riseHour = (baseRiseHour + dailyShift) % 24;
    
    // Convert to hours and minutes
    const riseHours = Math.floor(riseHour);
    const riseMinutes = Math.floor((riseHour - riseHours) * 60);
    
    // Create moonrise date
    const moonrise = new Date(baseDate);
    moonrise.setHours(riseHours, riseMinutes, 0, 0);
    
    // Moonset is ~12 hours after moonrise (approximate)
    // We add a slight variation based on phase (full moon sets at sunrise)
    const setHourOffset = 12 + (cyclePosition * 0.5); // 12-12.5 hours later
    let setHour = (riseHour + setHourOffset) % 24;
    
    // Convert to hours and minutes
    const setHours = Math.floor(setHour);
    const setMinutes = Math.floor((setHour - setHours) * 60);
    
    // Create moonset date
    const moonset = new Date(baseDate);
    moonset.setHours(setHours, setMinutes, 0, 0);
    
    // If moonset time is earlier than moonrise, it must be the next day
    if (moonset <= moonrise) {
      moonset.setDate(moonset.getDate() + 1);
    }
    
    return {
      moonrise,
      moonset
    };
  }

  /**
   * Get formatted moon information for display that's compatible with the game date
   * @param {Date} date - The game date
   * @param {object} worldSettings - The world settings object from context
   * @returns {object} Formatted moon information for display
   */
  getFormattedMoonInfo(date, worldSettings) {
    const phase = this.getMoonPhase(date);
    const { moonrise, moonset } = this.getMoonTimes(date);
    const nextFullMoon = this.getNextFullMoon(date);
    const nextNewMoon = this.getNextNewMoon(date);

    // Format for the moon times using the world's game year
    const formatMoonTime = (moonDate) => {
      // Get just the time in the correct format
      return moonDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    // Format for next moon dates using the world's game year
    const formatMoonDate = (moonDate) => {
      if (!worldSettings) return moonDate.toLocaleDateString();

      // Clone the original date to avoid modifying it
      const displayDate = new Date(moonDate);
      
      // Calculate days difference from current date
      const currentGameDate = new Date(date);
      const daysDiff = Math.round((displayDate - currentGameDate) / (24 * 60 * 60 * 1000));
      
      // For dates within the next week, show relative days
      if (daysDiff <= 7) {
        if (daysDiff === 0) return "Today";
        if (daysDiff === 1) return "Tomorrow";
        return `In ${daysDiff} days`;
      }
      
      // For dates further away, use the month and day with game year
      const month = displayDate.toLocaleString('en-US', { month: 'short' });
      const day = displayDate.getDate();
      
      // If worldSettings has a gameYear property, use it
      let year = displayDate.getFullYear();
      if (worldSettings && worldSettings.gameYear) {
        year = worldSettings.gameYear;
      }
      
      return `${month} ${day}, ${year}`;
    };

    // Return formatted information
    return {
      ...phase,
      moonriseTime: formatMoonTime(moonrise),
      moonsetTime: formatMoonTime(moonset),
      moonrise: moonrise, // Include the actual Date objects
      moonset: moonset,
      nextFullMoonDate: formatMoonDate(nextFullMoon),
      nextNewMoonDate: formatMoonDate(nextNewMoon),
      daysToFullMoon: Math.round((nextFullMoon - date) / (24 * 60 * 60 * 1000)),
      daysToNewMoon: Math.round((nextNewMoon - date) / (24 * 60 * 60 * 1000))
    };
  }
}

// Export a singleton instance
const moonService = new MoonService();
export default moonService;