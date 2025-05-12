// src/services/meteorological/PrecipitationService.js
// Service for handling precipitation tracking and calculations

class PrecipitationService {
    constructor() {
      // Track precipitation history
      this.precipHistory = []; // Recent precipitation amounts by hour
      this.precipType = null; // Rain, snow, etc.
      this.precipIntensity = 0; // 0-100 scale
    }
  
    /**
     * Initialize precipitation history
     */
    initializePrecipitation() {
      // Initialize with empty precipitation history
      this.precipHistory = Array(24).fill(0);
      this.precipType = null;
      this.precipIntensity = 0;
    }
  
    /**
     * Update precipitation with a new value
     * @param {number} amount - Precipitation amount (0-1 scale)
     * @param {string} type - Precipitation type (rain, snow, etc.)
     */
    updatePrecipitation(amount, type) {
      // Add to history
      this.precipHistory.push(amount);
      
      // Keep only last 24 hours
      if (this.precipHistory.length > 24) {
        this.precipHistory.shift();
      }
      
      // Update type if precipitating
      if (amount > 0) {
        this.precipType = type;
        this.precipIntensity = amount * 100; // Convert to 0-100 scale
      } else {
        this.precipType = null;
        this.precipIntensity = 0;
      }
    }
  
    /**
     * Get the precipitation history
     * @returns {Array} - Precipitation history
     */
    getPrecipitationHistory() {
      return [...this.precipHistory];
    }
  
    /**
     * Get the current precipitation type
     * @returns {string|null} - Precipitation type or null if not precipitating
     */
    getPrecipitationType() {
      return this.precipType;
    }
  
    /**
     * Get the current precipitation intensity
     * @returns {number} - Precipitation intensity (0-100)
     */
    getPrecipitationIntensity() {
      return this.precipIntensity;
    }
  
    /**
     * Get recent precipitation amount (weighted average)
     * @param {number} hours - Number of hours to consider (default 6)
     * @returns {number} - Recent precipitation amount (0-1 scale)
     */
    getRecentPrecipitation(hours = 6) {
      // Need at least some history
      if (this.precipHistory.length === 0) {
        return 0;
      }
  
      // Look at recent hours, with more weight to more recent precipitation
      let totalPrecip = 0;
      let totalWeight = 0;
  
      // Look at up to specified most recent hours
      const hoursToCheck = Math.min(hours, this.precipHistory.length);
  
      for (let i = 0; i < hoursToCheck; i++) {
        const weight = hoursToCheck - i; // More recent hours have more weight
        const precipAmount =
          this.precipHistory[this.precipHistory.length - 1 - i];
  
        totalPrecip += precipAmount * weight;
        totalWeight += weight;
      }
  
      // Normalize to 0-1 scale
      return totalWeight > 0 ? Math.min(1, totalPrecip / totalWeight) : 0;
    }
  
    /**
     * Get total precipitation from the last X hours
     * @param {number} hours - Number of hours to sum (default 24)
     * @returns {number} - Total precipitation
     */
    getTotalPrecipitation(hours = 24) {
      const hoursToCheck = Math.min(hours, this.precipHistory.length);
      let total = 0;
      
      for (let i = 0; i < hoursToCheck; i++) {
        total += this.precipHistory[this.precipHistory.length - 1 - i];
      }
      
      return total;
    }
  
    /**
     * Determine if drought conditions exist
     * @param {number} daysToCheck - Number of days to check
     * @returns {boolean} - True if drought conditions
     */
    isDroughtCondition(daysToCheck = 7) {
      // Simple drought check - less than 0.1 precipitation in the period
      const hoursToCheck = daysToCheck * 24;
      return this.getTotalPrecipitation(hoursToCheck) < 0.1;
    }
  
    /**
     * Determine if flood risk conditions exist
     * @returns {boolean} - True if flood risk is present
     */
    isFloodRiskPresent() {
      // Check for heavy sustained precipitation
      const recent24Hours = this.getTotalPrecipitation(24);
      const recent6Hours = this.getTotalPrecipitation(6);
      
      // Heavy precipitation in the last day or concentrated in last 6 hours
      return recent24Hours > 2.0 || recent6Hours > 1.0;
    }
  
    /**
     * Calculate annual expected precipitation for a region
     * @param {object} profile - Region profile
     * @returns {number} - Annual precipitation in inches
     */
    calculateAnnualPrecipitation(profile) {
      // Base value from maritime influence
      let basePrecip = profile.maritimeInfluence * 30;
      
      // Adjustments for latitude
      if (profile.latitude < 30) {
        // Tropical regions often get more rain
        basePrecip += 20;
      } else if (profile.latitude > 60) {
        // Polar regions often get less precipitation
        basePrecip -= 10;
      }
      
      // Adjustments for special factors
      if (profile.specialFactors?.highRainfall) {
        basePrecip += 25;
      }
      
      if (profile.specialFactors?.hasMonsoonSeason) {
        basePrecip += 15;
      }
      
      if (profile.specialFactors?.hasDrySeason) {
        basePrecip -= 5;
      }
      
      // Ensure reasonable value
      return Math.max(5, Math.min(200, basePrecip));
    }
  }
  
  export default PrecipitationService;