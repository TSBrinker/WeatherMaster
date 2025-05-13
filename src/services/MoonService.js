// src/services/MoonService.js
import sunriseSunsetService from './SunriseSunsetService';

class MoonService {
  constructor() {
    // Reference new moon date - January 6, 2000 (a known new moon)
    this.REFERENCE_NEW_MOON = new Date('2000-01-06T00:00:00Z');
    this.LUNAR_CYCLE_DAYS = 29.53059; // Average synodic month
    
    // Moon phases with their age ranges in days
    this.MOON_PHASES = [
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
    this.MOON_LIGHT_LEVELS = {
      "New Moon": "Darkness",
      "Waxing Crescent": "Darkness",
      "First Quarter": "Darkness",
      "Waxing Gibbous": "Dim Light in open areas",
      "Full Moon": "Dim Light in open areas",
      "Waning Gibbous": "Dim Light in open areas",
      "Last Quarter": "Darkness",
      "Waning Crescent": "Darkness"
    };
  }
  
  /**
   * Calculate the age of the moon in days for a given date
   * @param {Date} date - The date to calculate the moon age for
   * @returns {number} The age of the moon in days (0 to 29.53)
   */
  calculateMoonAge(date) {
    // Ensure date is a Date object
    const inputDate = date instanceof Date ? date : new Date(date);
    
    if (isNaN(inputDate.getTime())) {
      console.error("Invalid date provided to calculateMoonAge:", date);
      return 0; // Default to new moon for invalid dates
    }
    
    // Find the time difference in milliseconds
    const timeDiff = inputDate.getTime() - this.REFERENCE_NEW_MOON.getTime();
    
    // Calculate days since reference new moon and apply modulo to get current age
    const daysSinceReferenceNewMoon = timeDiff / (24 * 60 * 60 * 1000);
    const moonAge = daysSinceReferenceNewMoon % this.LUNAR_CYCLE_DAYS;
    
    // Ensure the value is positive
    return moonAge >= 0 ? moonAge : moonAge + this.LUNAR_CYCLE_DAYS;
  }
  
  /**
   * Calculate moon illumination percentage based on age
   * @param {number} moonAge - The age of the moon in days
   * @returns {number} Illumination percentage (0-100)
   */
  calculateIllumination(moonAge) {
    // Convert moon age to a position in the cycle (0 to 1)
    const cyclePosition = moonAge / this.LUNAR_CYCLE_DAYS;
    
    // Calculate illumination - follows a sinusoidal pattern
    // From new moon (0%) to full moon (100%) and back to new moon (0%)
    return Math.round(50 * (1 - Math.cos(cyclePosition * 2 * Math.PI)));
  }
  
  /**
   * Determine if the moon is waxing or waning
   * @param {number} moonAge - The age of the moon in days
   * @returns {boolean} True if waxing (growing), false if waning (shrinking)
   */
  isWaxing(moonAge) {
    return moonAge < this.LUNAR_CYCLE_DAYS / 2;
  }
  
  /**
   * Get the current moon phase for a given date
   * @param {Date} date - The date to get the moon phase for
   * @returns {object} Moon phase information including name, icon, illumination percentage
   */
  getMoonPhase(date) {
    try {
      // Calculate moon age and derived properties
      const moonAge = this.calculateMoonAge(date);
      const exactIllumination = this.calculateIllumination(moonAge);
      const isWaxing = this.isWaxing(moonAge);
      
      // Find the matching phase based on moon age
      for (const phase of this.MOON_PHASES) {
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
            lightLevel: this.MOON_LIGHT_LEVELS[phase.name] || "Darkness",
            isWaxing
          };
        }
      }
      
      // Fallback to new moon (shouldn't happen, but just in case)
      console.warn("Moon phase calculation fell through to default - check phase ranges");
      return {
        name: "New Moon",
        icon: "🌑",
        illumination: 0,
        age: 0,
        ageInDays: 0,
        ageHours: 0,
        exactPercentage: 0,
        lightLevel: "Darkness",
        isWaxing: true
      };
    } catch (error) {
      console.error("Error calculating moon phase:", error);
      // Return a default value on error
      return {
        name: "Unknown",
        icon: "❓",
        illumination: 0,
        age: 0,
        ageInDays: 0,
        ageHours: 0,
        exactPercentage: 0,
        lightLevel: "Unknown",
        isWaxing: true
      };
    }
  }
  
  /**
   * Get the next full moon date from a given date
   * @param {Date} date - The starting date
   * @returns {Date} The date of the next full moon
   */
  getNextFullMoon(date) {
    const moonAge = this.calculateMoonAge(date);
    const fullMoonAge = 14.77; // Age at start of full moon phase
    
    const daysToFullMoon = moonAge < fullMoonAge 
      ? fullMoonAge - moonAge
      : this.LUNAR_CYCLE_DAYS - moonAge + fullMoonAge;

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
      : this.LUNAR_CYCLE_DAYS - moonAge + 1;
      
    const nextNewMoon = new Date(date);
    nextNewMoon.setDate(nextNewMoon.getDate() + Math.floor(daysToNewMoon));
    nextNewMoon.setHours(
      nextNewMoon.getHours() + 
      Math.floor((daysToNewMoon % 1) * 24)
    );
    
    return nextNewMoon;
  }

  /**
   * Calculate moonrise and moonset times based on moon phase and sun's schedule
   * @param {Date} date - The date to calculate for
   * @param {string} latitudeBand - The latitude band for calculations
   * @returns {object} The moonrise and moonset times
   */
  getMoonTimes(date, latitudeBand = "temperate") {
    // Ensure we have a valid date
    const inputDate = date instanceof Date ? date : new Date(date);
    
    if (isNaN(inputDate.getTime())) {
      console.error("Invalid date in getMoonTimes:", date);
      return {
        moonrise: new Date(inputDate),
        moonset: new Date(inputDate)
      };
    }
    
    try {
      // Get the phase for this date
      const moonPhase = this.getMoonPhase(inputDate);
      
      // Get base date without time
      const baseDate = new Date(inputDate);
      baseDate.setHours(0, 0, 0, 0);
      
      // Get sunrise and sunset times from SunriseSunsetService
      const { sunrise, sunset } = sunriseSunsetService.getSunriseSunset(latitudeBand, inputDate);
      
      // Convert to hours for easier calculation
      const sunriseHour = sunrise.getHours() + (sunrise.getMinutes() / 60);
      const sunsetHour = sunset.getHours() + (sunset.getMinutes() / 60);
      
      // Phase position in the lunar cycle (0-1)
      const cyclePosition = moonPhase.age / this.LUNAR_CYCLE_DAYS;
      
      // Calculate moonrise and moonset times based on astronomical principles
      // and the moon's phase in relation to the sun
      let moonriseHour, moonsetHour;
      
      if (cyclePosition <= 0.5) {
        // From new moon to full moon (waxing):
        // - New moon (0.0): Rises and sets with the sun
        // - First quarter (0.25): Rises at noon, sets at midnight
        // - Full moon (0.5): Rises at sunset, sets at sunrise (next day)
        const waxingProgress = cyclePosition / 0.5; // 0 to 1
        
        // For moonrise: linear interpolation from sunrise (new moon) to sunset (full moon)
        moonriseHour = sunriseHour + (waxingProgress * ((sunsetHour - sunriseHour + 24) % 24));
        
        // For moonset: from sunset (new moon) to sunrise+24h (full moon)
        // Need to handle day wraparound
        const nextDaySunrise = sunriseHour + 24;
        moonsetHour = sunsetHour + (waxingProgress * (nextDaySunrise - sunsetHour));
      } else {
        // From full moon back to new moon (waning):
        // - Full moon (0.5): Rises at sunset, sets at sunrise (next day)
        // - Last quarter (0.75): Rises at midnight, sets at noon
        // - New moon (1.0): Rises and sets with the sun
        const waningProgress = (cyclePosition - 0.5) / 0.5; // 0 to 1
        
        // For moonrise: from sunset (full) to sunrise (new)
        // Need to handle night wraparound for moonrise
        const eveningHour = (sunsetHour < sunriseHour) ? sunsetHour + 24 : sunsetHour;
        const interpolatedRise = eveningHour - (waningProgress * (eveningHour - sunriseHour));
        moonriseHour = interpolatedRise >= 24 ? interpolatedRise - 24 : interpolatedRise;
        
        // For moonset: from sunrise+24h (full) back to sunset (new)
        const nextDaySunrise = sunriseHour + 24;
        const interpolatedSet = nextDaySunrise - (waningProgress * (nextDaySunrise - sunsetHour));
        moonsetHour = interpolatedSet >= 24 ? interpolatedSet - 24 : interpolatedSet;
      }
      
      // Add slight random variation (±15 minutes)
      const riseVariation = (Math.random() - 0.5) / 2; // ±0.25 hours
      const setVariation = (Math.random() - 0.5) / 2; // ±0.25 hours
      
      moonriseHour = (moonriseHour + riseVariation + 24) % 24;
      moonsetHour = (moonsetHour + setVariation + 24) % 24;
      
      // Convert to hours and minutes
      const riseHours = Math.floor(moonriseHour);
      const riseMinutes = Math.floor((moonriseHour - riseHours) * 60);
      
      const setHours = Math.floor(moonsetHour);
      const setMinutes = Math.floor((moonsetHour - setHours) * 60);
      
      // Create moonrise date
      const moonrise = new Date(baseDate);
      moonrise.setHours(riseHours, riseMinutes, 0, 0);
      
      // Create moonset date
      const moonset = new Date(baseDate);
      moonset.setHours(setHours, setMinutes, 0, 0);
      
      // Handle the case where moonset is earlier in the day than moonrise
      // This means the moon sets the next day
      if (moonset.getTime() <= moonrise.getTime()) {
        moonset.setDate(moonset.getDate() + 1);
      }
      
      return {
        moonrise,
        moonset
      };
    } catch (error) {
      console.error("Error calculating moon times:", error);
      // Return default values on error
      return {
        moonrise: new Date(inputDate),
        moonset: new Date(inputDate)
      };
    }
  }

  /**
   * Format moonrise/moonset times for display
   * @param {Date} date - The date to calculate for
   * @param {string} latitudeBand - The latitude band
   * @returns {object} Formatted moon times
   */
  getFormattedMoonTimes(date, latitudeBand = "temperate") {
    try {
      const { moonrise, moonset } = this.getMoonTimes(date, latitudeBand);
      
      // Format times
      const formatTime = (date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
      };
      
      return {
        moonriseTime: formatTime(moonrise),
        moonsetTime: formatTime(moonset),
        moonriseDate: moonrise,
        moonsetDate: moonset
      };
    } catch (error) {
      console.error("Error formatting moon times:", error);
      return {
        moonriseTime: "Error",
        moonsetTime: "Error",
        moonriseDate: new Date(),
        moonsetDate: new Date()
      };
    }
  }
  
  /**
   * Comprehensive moon information for display
   * @param {Date} date - The date to calculate for
   * @param {string} latitudeBand - The latitude band
   * @param {object} worldSettings - Optional world settings for calendar display
   * @returns {object} Complete moon information
   */
  getFormattedMoonInfo(date, latitudeBand = "temperate", worldSettings = null) {
    try {
      const phase = this.getMoonPhase(date);
      const times = this.getFormattedMoonTimes(date, latitudeBand);
      const nextFullMoon = this.getNextFullMoon(date);
      const nextNewMoon = this.getNextNewMoon(date);
      
      // Format for next moon dates
      const formatMoonDate = (moonDate) => {
        if (!worldSettings) return moonDate.toLocaleDateString();
  
        // Calculate days difference from current date
        const currentGameDate = new Date(date);
        const daysDiff = Math.round((moonDate - currentGameDate) / (24 * 60 * 60 * 1000));
        
        // For dates within the next week, show relative days
        if (daysDiff <= 7) {
          if (daysDiff === 0) return "Today";
          if (daysDiff === 1) return "Tomorrow";
          return `In ${daysDiff} days`;
        }
        
        // For dates further away, use the month and day with game year
        const month = moonDate.toLocaleString('en-US', { month: 'short' });
        const day = moonDate.getDate();
        
        // If worldSettings has a gameYear property, use it
        let year = moonDate.getFullYear();
        if (worldSettings && worldSettings.gameYear) {
          year = worldSettings.gameYear;
        }
        
        return `${month} ${day}, ${year}`;
      };
      
      return {
        ...phase,
        ...times,
        nextFullMoonDate: formatMoonDate(nextFullMoon),
        nextNewMoonDate: formatMoonDate(nextNewMoon),
        daysToFullMoon: Math.round((nextFullMoon - date) / (24 * 60 * 60 * 1000)),
        daysToNewMoon: Math.round((nextNewMoon - date) / (24 * 60 * 60 * 1000))
      };
    } catch (error) {
      console.error("Error getting formatted moon info:", error);
      return {
        name: "Error",
        icon: "❓",
        illumination: 0,
        exactPercentage: 0,
        moonriseTime: "Error",
        moonsetTime: "Error"
      };
    }
  }
  
  /**
   * Check if the moon is visible at a specific time
   * @param {Date} date - The date and time to check
   * @param {string} latitudeBand - The latitude band
   * @returns {boolean} Whether the moon is above the horizon
   */
  isMoonVisible(date, latitudeBand = "temperate") {
    try {
      const { moonrise, moonset } = this.getMoonTimes(date, latitudeBand);
      const currentTime = date.getTime();
      
      // Handle case where moonset is the next day
      if (moonset.getTime() < moonrise.getTime()) {
        // Moon is visible if current time is after moonrise OR before moonset
        return currentTime >= moonrise.getTime() || currentTime <= moonset.getTime();
      } else {
        // Standard case - moon is visible between moonrise and moonset
        return currentTime >= moonrise.getTime() && currentTime <= moonset.getTime();
      }
    } catch (error) {
      console.error("Error checking moon visibility:", error);
      return false;
    }
  }
}

// Export a singleton instance
const moonService = new MoonService();
export default moonService;