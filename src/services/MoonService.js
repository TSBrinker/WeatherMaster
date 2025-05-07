// src/services/MoonService.js - Fixed illumination calculation
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
   * Get the current moon phase for a given date
   * @param {Date} date - The date to get the moon phase for
   * @returns {object} Moon phase information including name, icon, illumination percentage
   */
  getMoonPhase(date) {
    const moonAge = this.calculateMoonAge(date);
    const exactIllumination = this.calculateIllumination(moonAge);
    
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
          exactPercentage: exactIllumination
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
      exactPercentage: 0
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
   * Calculate moonrise and moonset times (approximation)
   * This is a simplified version for a fantasy game - real calculations would be more complex
   * @param {Date} date - The date to calculate for
   * @param {number} phase - The moon phase illumination percentage
   * @returns {object} The approximate moonrise and moonset times
   */
  getMoonTimes(date) {
    const phase = this.getMoonPhase(date);
    
    // Calculate a more realistic moonrise/moonset based on phase
    // Full moon rises at sunset, sets at sunrise
    // New moon rises at sunrise, sets at sunset
    // First quarter rises at noon, sets at midnight
    // Last quarter rises at midnight, sets at noon
    
    // Start with base date
    const baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);
    
    // Get the phase percentage (0-100)
    const phasePercent = phase.exactPercentage;
    
    // Calculate approximate moonrise time (using a simple model)
    const moonrise = new Date(baseDate);
    // For phase 0% (new moon): rise at 6 AM
    // For phase 50% (quarter): rise at 12 PM or 12 AM
    // For phase 100% (full moon): rise at 6 PM
    const moonriseHour = (6 + (phasePercent / 100) * 12) % 24;
    moonrise.setHours(Math.floor(moonriseHour));
    moonrise.setMinutes(Math.floor((moonriseHour % 1) * 60));
    
    // Calculate approximate moonset time
    const moonset = new Date(baseDate);
    // For phase 0% (new moon): set at 6 PM
    // For phase 50% (quarter): set at 12 AM or 12 PM
    // For phase 100% (full moon): set at 6 AM (next day)
    const moonsetHour = (18 + (phasePercent / 100) * 12) % 24;
    
    // If moonset is on the next day
    if (phasePercent > 50 && moonsetHour < 12) {
      moonset.setDate(moonset.getDate() + 1);
    }
    
    moonset.setHours(Math.floor(moonsetHour));
    moonset.setMinutes(Math.floor((moonsetHour % 1) * 60));
    
    return {
      moonrise: moonrise,
      moonset: moonset
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
      return `${month} ${day}, ${worldSettings.gameYear}`;
    };

    // Return formatted information
    return {
      ...phase,
      moonriseTime: formatMoonTime(moonrise),
      moonsetTime: formatMoonTime(moonset),
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