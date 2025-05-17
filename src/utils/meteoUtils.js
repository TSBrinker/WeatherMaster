// src/utils/meteoUtils.js
// Helper utilities for meteorological debugging

/**
 * Provides debugging tools for meteorological calculations
 */
export const meteoUtils = {
    /**
     * Verify weather systems exist and add defaults if missing
     * @param {object} weatherSystemService - The weather system service
     * @returns {boolean} - Whether a fix was applied
     */
    verifyWeatherSystems(weatherSystemService) {
      if (!weatherSystemService) {
        console.error("No weather system service provided to verifyWeatherSystems");
        return false;
      }
      
      if (!weatherSystemService.weatherSystems || 
          !Array.isArray(weatherSystemService.weatherSystems) ||
          weatherSystemService.weatherSystems.length === 0) {
        console.error("EMERGENCY FIX: Adding default weather systems");
        weatherSystemService.addDefaultSystems();
        return true;
      }
      
      return false;
    },
    
    /**
     * Check all meteorological services
     * @param {object} meteoService - The meteorological weather service
     * @returns {object} - Diagnostic info
     */
    checkMeteoServices(meteoService) {
      if (!meteoService) {
        console.error("No meteorological service provided to checkMeteoServices");
        return { status: "ERROR", message: "No service" };
      }
      
      const issues = [];
      
      // Check each service
      if (!meteoService.weatherSystemService) {
        issues.push("Missing weatherSystemService");
      } else if (!meteoService.weatherSystemService.weatherSystems) {
        issues.push("weatherSystems array missing");
        meteoService.weatherSystemService.weatherSystems = [];
        meteoService.weatherSystemService.addDefaultSystems();
      } else if (meteoService.weatherSystemService.weatherSystems.length === 0) {
        issues.push("weatherSystems array empty");
        meteoService.weatherSystemService.addDefaultSystems();
      }
      
      // Check other services
      if (!meteoService.windService) issues.push("Missing windService");
      if (!meteoService.temperatureService) issues.push("Missing temperatureService");
      if (!meteoService.atmosphericService) issues.push("Missing atmosphericService");
      
      return {
        status: issues.length > 0 ? "ISSUES" : "OK",
        issues,
        currentSystems: meteoService.weatherSystemService?.weatherSystems?.length || 0
      };
    },
    
    /**
     * Force reset of all meteorological services
     * @param {object} meteoService - The meteorological weather service
     */
    forceReset(meteoService) {
      if (!meteoService) return;
      
      console.log("FORCE RESETTING METEOROLOGICAL SERVICES");
      
      // Reset weather systems
      if (meteoService.weatherSystemService) {
        meteoService.weatherSystemService.weatherSystems = [];
        meteoService.weatherSystemService.addDefaultSystems();
      }
      
      // Reset temperature, humidity, etc.
      meteoService.temperature = 70;
      meteoService.humidity = 50;
      meteoService.pressure = 1013.25;
      meteoService.cloudCover = 30;
      
      // Reset wind
      if (meteoService.windService) {
        meteoService.currentWind = meteoService.windService.initializeWind();
      }
      
      console.log("Meteorological services reset complete");
    }
  };
  
  export default meteoUtils;