// src/services/WeatherServiceBase.js
// Base weather service with solar-angle based season calculation

import WeatherUtils from '../utils/weatherUtils.js';
import sunriseSunsetService from './SunriseSunsetService.js';

export default class WeatherServiceBase {
  constructor() {
    this.forecast = [];
    this.currentProfile = null;
    console.log("WeatherServiceBase initialized with solar season support");
  }

  /**
   * Get season from date using solar angle calculation
   * @param {Date} date - Date to check
   * @param {object} profile - Region profile (optional, for latitude)
   * @returns {string} - Season name
   */
  getSeasonFromDate(date, profile = null) {
    // Get latitude from profile if available
    let latitude = 40; // Default to temperate
    let latitudeBand = "temperate";
    
    if (profile && profile.latitude) {
      latitude = profile.latitude;
      latitudeBand = profile.latitudeBand || this.getLatitudeBandFromDegrees(latitude);
    } else if (this.currentProfile && this.currentProfile.latitude) {
      latitude = this.currentProfile.latitude;
      latitudeBand = this.currentProfile.latitudeBand || this.getLatitudeBandFromDegrees(latitude);
    }
    
    console.log(`[WeatherServiceBase] Getting season for lat: ${latitude}° (${latitudeBand})`);
    
    // Use the new solar-angle based season calculation
    return WeatherUtils.getSeasonFromDate(date, latitude);
  }

  /**
   * Convert latitude degrees to latitude band
   * @param {number} latitude - Latitude in degrees
   * @returns {string} - Latitude band name
   */
  getLatitudeBandFromDegrees(latitude) {
    const absLat = Math.abs(latitude);
    if (absLat >= 70) return "polar";
    if (absLat >= 60) return "subarctic";
    if (absLat >= 40) return "temperate";
    if (absLat >= 30) return "subtropical";
    return "tropical";
  }

  /**
   * Get season information including solar details
   * @param {Date} date - Date to check
   * @param {object} profile - Region profile (optional)
   * @returns {object} - Detailed season information
   */
  getSeasonInfo(date, profile = null) {
    let latitude = 40;
    let latitudeBand = "temperate";
    
    if (profile && profile.latitude) {
      latitude = profile.latitude;
      latitudeBand = profile.latitudeBand || this.getLatitudeBandFromDegrees(latitude);
    } else if (this.currentProfile && this.currentProfile.latitude) {
      latitude = this.currentProfile.latitude;
      latitudeBand = this.currentProfile.latitudeBand || this.getLatitudeBandFromDegrees(latitude);
    }
    
    return sunriseSunsetService.getSeasonInfo(date, latitudeBand);
  }

  /**
   * Check if a season transition is occurring
   * @param {Date} date - Current date
   * @param {object} profile - Region profile
   * @returns {object} - Transition information
   */
  checkSeasonTransition(date, profile = null) {
    const currentSeason = this.getSeasonFromDate(date, profile);
    
    // Check previous and next day to detect transitions
    const yesterday = new Date(date);
    yesterday.setDate(date.getDate() - 1);
    const tomorrow = new Date(date);
    tomorrow.setDate(date.getDate() + 1);
    
    const yesterdaySeason = this.getSeasonFromDate(yesterday, profile);
    const tomorrowSeason = this.getSeasonFromDate(tomorrow, profile);
    
    const isTransitioning = (yesterdaySeason !== currentSeason) || (currentSeason !== tomorrowSeason);
    
    return {
      currentSeason,
      isTransitioning,
      fromSeason: yesterdaySeason !== currentSeason ? yesterdaySeason : null,
      toSeason: currentSeason !== tomorrowSeason ? tomorrowSeason : null,
      transitionType: this.getTransitionType(yesterdaySeason, currentSeason, tomorrowSeason)
    };
  }

  /**
   * Get the type of season transition
   * @param {string} yesterday - Yesterday's season
   * @param {string} current - Current season
   * @param {string} tomorrow - Tomorrow's season
   * @returns {string} - Transition type
   */
  getTransitionType(yesterday, current, tomorrow) {
    if (yesterday !== current) return "entering";
    if (current !== tomorrow) return "leaving";
    return "stable";
  }

  /**
   * Get blended seasonal parameters during transitions
   * @param {Date} date - Current date
   * @param {object} profile - Region profile
   * @returns {object} - Blended seasonal data
   */
  getBlendedSeasonalData(date, profile) {
    const transition = this.checkSeasonTransition(date, profile);
    
    if (!transition.isTransitioning) {
      // No transition, return current season data
      return {
        season: transition.currentSeason,
        blendFactor: 0,
        primarySeason: transition.currentSeason,
        secondarySeason: null
      };
    }
    
    // Calculate blend factor based on solar angle progression
    const latitude = profile?.latitude || this.currentProfile?.latitude || 40;
    const dayOfYear = WeatherUtils.getDayOfYear(date);
    const declination = WeatherUtils.getSolarDeclination(dayOfYear);
    
    // Get the seasonal thresholds for this latitude
    const thresholds = this.getSeasonalThresholds(latitude);
    
    // Calculate how far through the transition we are
    let blendFactor = 0;
    let primarySeason = transition.currentSeason;
    let secondarySeason = null;
    
    if (transition.fromSeason && transition.fromSeason !== transition.currentSeason) {
      // Entering new season
      blendFactor = this.calculateTransitionProgress(declination, thresholds, transition.fromSeason, transition.currentSeason);
      primarySeason = transition.currentSeason;
      secondarySeason = transition.fromSeason;
    } else if (transition.toSeason && transition.toSeason !== transition.currentSeason) {
      // Leaving current season
      blendFactor = this.calculateTransitionProgress(declination, thresholds, transition.currentSeason, transition.toSeason);
      primarySeason = transition.currentSeason;
      secondarySeason = transition.toSeason;
    }
    
    return {
      season: transition.currentSeason,
      blendFactor: Math.max(0, Math.min(1, blendFactor)),
      primarySeason,
      secondarySeason,
      isTransitioning: true
    };
  }

  /**
   * Get seasonal thresholds for a given latitude
   * @param {number} latitude - Latitude in degrees
   * @returns {object} - Seasonal threshold angles
   */
  getSeasonalThresholds(latitude) {
    const absLat = Math.abs(latitude);
    
    if (absLat >= 66.5) {
      // Polar regions - based on daylight hours
      return {
        type: "polar",
        summer: { min: 20, max: 23.5 },    // High declination = polar day
        winter: { min: -23.5, max: -20 },   // Low declination = polar night
        spring: { min: 0, max: 20 },        // Increasing declination
        fall: { min: -20, max: 0 }          // Decreasing declination
      };
    } else if (absLat >= 30) {
      // Temperate regions - solar angle based
      return {
        type: "temperate",
        summer: { min: 20, max: 23.5 },
        winter: { min: -23.5, max: -20 },
        spring: { min: 0, max: 20 },
        fall: { min: -20, max: 0 }
      };
    } else {
      // Tropical regions - minimal variation
      return {
        type: "tropical",
        summer: { min: -10, max: 10 },      // Sun overhead
        winter: { min: -23.5, max: -10 },   // Sun distant (dry season)
        spring: { min: 10, max: 23.5 },     // Transition
        fall: { min: -10, max: 10 }         // Transition
      };
    }
  }

  /**
   * Calculate transition progress between seasons
   * @param {number} declination - Current solar declination
   * @param {object} thresholds - Seasonal thresholds
   * @param {string} fromSeason - Season transitioning from
   * @param {string} toSeason - Season transitioning to
   * @returns {number} - Progress (0-1)
   */
  calculateTransitionProgress(declination, thresholds, fromSeason, toSeason) {
    const fromRange = thresholds[fromSeason];
    const toRange = thresholds[toSeason];
    
    if (!fromRange || !toRange) return 0;
    
    // Calculate where we are in the transition
    const totalTransition = Math.abs(toRange.min - fromRange.max);
    const currentProgress = Math.abs(declination - fromRange.max);
    
    return Math.min(1, currentProgress / totalTransition);
  }

  /**
   * Enhanced seasonal baseline with solar-based blending
   * @param {object} profile - Region profile
   * @param {string} season - Primary season
   * @param {Date} date - Current date
   * @returns {object} - Enhanced seasonal baseline
   */
  getEnhancedSeasonalBaseline(profile, season, date) {
    const blendedData = this.getBlendedSeasonalData(date, profile);
    
    // Get base seasonal data (this would call the existing method)
    let baseline = this.getSeasonalBaseline ? this.getSeasonalBaseline(profile, season) : {
      temperature: { mean: 50, variance: 20 },
      humidity: { mean: 50, variance: 20 },
      pressure: { mean: 1013, variance: 20 }
    };
    
    // If we're transitioning, blend with secondary season
    if (blendedData.isTransitioning && blendedData.secondarySeason) {
      const secondaryBaseline = this.getSeasonalBaseline ? 
        this.getSeasonalBaseline(profile, blendedData.secondarySeason) : baseline;
      
      // Blend the two baselines
      baseline = this.blendSeasonalBaselines(baseline, secondaryBaseline, blendedData.blendFactor);
    }
    
    // Add solar metadata
    baseline._solarData = {
      season: blendedData.season,
      isTransitioning: blendedData.isTransitioning,
      blendFactor: blendedData.blendFactor,
      primarySeason: blendedData.primarySeason,
      secondarySeason: blendedData.secondarySeason
    };
    
    return baseline;
  }

  /**
   * Blend two seasonal baselines
   * @param {object} primary - Primary season baseline
   * @param {object} secondary - Secondary season baseline
   * @param {number} blendFactor - Blend factor (0-1)
   * @returns {object} - Blended baseline
   */
  blendSeasonalBaselines(primary, secondary, blendFactor) {
    const blended = JSON.parse(JSON.stringify(primary)); // Deep clone
    
    // Blend each parameter
    Object.keys(primary).forEach(key => {
      if (typeof primary[key] === 'object' && primary[key].mean !== undefined) {
        blended[key].mean = primary[key].mean * (1 - blendFactor) + secondary[key].mean * blendFactor;
        blended[key].variance = primary[key].variance * (1 - blendFactor) + secondary[key].variance * blendFactor;
      }
    });
    
    return blended;
  }

  // Placeholder methods for backwards compatibility
  initializeWeather(biome, season, currentDate) {
    throw new Error("initializeWeather must be implemented by subclass");
  }

  advanceTime(hours, date) {
    throw new Error("advanceTime must be implemented by subclass");
  }

  get24HourForecast() {
    return this.forecast.slice(0, 24);
  }

  getCurrentWeather() {
    return this.forecast.length > 0 ? this.forecast[0] : null;
  }
}