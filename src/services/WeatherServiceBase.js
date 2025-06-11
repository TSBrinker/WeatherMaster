// src/services/WeatherServiceBase.js
// Base class with shared functionality for all weather services

export default class WeatherServiceBase {
    constructor() {
      // Wind directions
      this.windDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      this.currentWindDirection = this.getRandomWindDirection();
      this.currentWindSpeed = 5; // Default starting wind speed (mph)
    }
  
    // Get the season based on the date
    getSeasonFromDate(date) {
      // Default solstice and equinox dates (month is 0-based in JS Date)
      const springEquinox = new Date(date.getFullYear(), 2, 20); // March 20
      const summerSolstice = new Date(date.getFullYear(), 5, 21); // June 21
      const fallEquinox = new Date(date.getFullYear(), 8, 22); // September 22
      const winterSolstice = new Date(date.getFullYear(), 11, 21); // December 21
      
      // Set time to noon to avoid day boundary issues
      const noon = new Date(date);
      noon.setHours(12, 0, 0, 0);
      springEquinox.setHours(12, 0, 0, 0);
      summerSolstice.setHours(12, 0, 0, 0);
      fallEquinox.setHours(12, 0, 0, 0);
      winterSolstice.setHours(12, 0, 0, 0);
      
      // Determine season based on date
      if (noon >= winterSolstice || noon < springEquinox) {
        return "winter";
      } else if (noon >= springEquinox && noon < summerSolstice) {
        return "spring";
      } else if (noon >= summerSolstice && noon < fallEquinox) {
        return "summer";
      } else {
        return "fall";
      }
    }
  
    // Helper to get a random wind direction
    getRandomWindDirection() {
      return this.windDirections[Math.floor(Math.random() * this.windDirections.length)];
    }
  
    // Roll dice helper methods
    rollD4() {
      return Math.floor(Math.random() * 4) + 1;
    }
  
    rollD6() {
      return Math.floor(Math.random() * 6) + 1;
    }
  
    rollD8() {
      return Math.floor(Math.random() * 8) + 1;
    }
  
    rollD20() {
      return Math.floor(Math.random() * 20) + 1;
    }
  
    rollD100() {
      return Math.floor(Math.random() * 100) + 1;
    }
  
    // Roll 3d6 to get a bell curve (3-18) then normalize to 1-100
    weightedD100() {
      const roll = this.rollD6() + this.rollD6() + this.rollD6();
      const normalized = Math.floor(((roll - 3) / 15) * 100) + 1;
      return Math.min(Math.max(normalized, 1), 100);
    }
  
    // Calculate seasonal blend factor (0.0 to 1.0) for smooth transitions
    getSeasonalBlendFactor(date) {
      const currentSeason = this.getSeasonFromDate(date);
      let nextSeason;
      let transitionDate;
      let nextTransitionDate;
      
      const year = date.getFullYear();
      const springEquinox = new Date(year, 2, 20);
      const summerSolstice = new Date(year, 5, 21);
      const fallEquinox = new Date(year, 8, 22);
      const winterSolstice = new Date(year, 11, 21);
      
      // Set time to noon to avoid day boundary issues
      const noon = new Date(date);
      noon.setHours(12, 0, 0, 0);
      springEquinox.setHours(12, 0, 0, 0);
      summerSolstice.setHours(12, 0, 0, 0);
      fallEquinox.setHours(12, 0, 0, 0);
      winterSolstice.setHours(12, 0, 0, 0);
      
      // Determine current transition boundaries
      if (currentSeason === "winter") {
        if (noon < springEquinox) {
          transitionDate = new Date(year, 0, 1); // Jan 1
          nextTransitionDate = springEquinox;
          nextSeason = "spring";
        } else {
          // This is for dates after Dec 21 (winter solstice)
          transitionDate = winterSolstice;
          nextTransitionDate = new Date(year + 1, 2, 20); // Next year's spring equinox
          nextSeason = "spring";
        }
      } else if (currentSeason === "spring") {
        transitionDate = springEquinox;
        nextTransitionDate = summerSolstice;
        nextSeason = "summer";
      } else if (currentSeason === "summer") {
        transitionDate = summerSolstice;
        nextTransitionDate = fallEquinox;
        nextSeason = "fall";
      } else { // fall
        transitionDate = fallEquinox;
        nextTransitionDate = winterSolstice;
        nextSeason = "winter";
      }
      
      // Calculate blend factor (0 = fully current season, 1 = fully next season)
      const totalDays = (nextTransitionDate - transitionDate) / (1000 * 60 * 60 * 24);
      const daysPassed = (noon - transitionDate) / (1000 * 60 * 60 * 24);
      
      // Only blend within 14 days of a transition
      const blendPeriod = Math.min(14, totalDays / 2);
      if (daysPassed >= totalDays - blendPeriod) {
        // Last 14 days of the season, blend toward next season
        return (daysPassed - (totalDays - blendPeriod)) / blendPeriod;
      }
      
      return 0; // Middle of season, no blending
    }
    
    // Helper to get previous season
    getPreviousSeason(season) {
      const seasons = ["winter", "spring", "summer", "fall"];
      const index = seasons.indexOf(season);
      return seasons[(index + 3) % 4]; // +3 instead of -1 to handle the modulo correctly
    }
  
    // Get the next season
    getNextSeason(season) {
      const seasons = ["winter", "spring", "summer", "fall"];
      const index = seasons.indexOf(season);
      return seasons[(index + 1) % 4];
    }
  }