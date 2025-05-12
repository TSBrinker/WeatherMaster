// src/services/meteorological/ExtremeWeatherService.js
// Service for managing extreme weather events and rare occurrences

class ExtremeWeatherService {
    /**
     * Check for extreme weather events
     * @param {object} profile - Region profile
     * @param {Date} date - Current date
     * @param {number} temperature - Current temperature
     * @param {number} humidity - Current humidity
     * @param {number} pressure - Current pressure
     * @param {Array} weatherSystems - Active weather systems
     * @param {Array} forecast - Recent weather forecast
     * @param {number} instability - Atmospheric instability value
     * @returns {object} - Extreme weather event details if one occurs
     */
    checkExtremeWeatherEvents(
      profile,
      date,
      temperature,
      humidity,
      pressure,
      weatherSystems,
      forecast,
      instability
    ) {
      const events = {
        type: null,
        intensity: 0,
        duration: 0,
      };
  
      // Check weather-dependent extreme events
      if (this.checkForTornado(profile, date, temperature, humidity, instability, weatherSystems)) {
        events.type = "tornado";
        events.intensity = this.calculateTornadoIntensity();
        events.duration = 1 + Math.floor(Math.random() * 3); // 1-3 hours
      } else if (this.checkForHurricane(profile, date, temperature, humidity, forecast)) {
        events.type = "hurricane";
        events.intensity = this.calculateHurricaneIntensity();
        events.duration = 24 + Math.floor(Math.random() * 48); // 24-72 hours
      } else if (this.checkForFlood(profile, date, forecast)) {
        events.type = "flood";
        events.intensity = this.calculateFloodIntensity(forecast);
        events.duration = 12 + Math.floor(Math.random() * 36); // 12-48 hours
      }
  
      // Also check geological events (separate from weather)
      if (this.checkForGeologicalEvent(profile, date)) {
        const geoEvent = this.getGeologicalEvent(profile);
        if (geoEvent.type && (!events.type || Math.random() < 0.5)) {
          // Either no weather event or 50% chance to override
          events.type = geoEvent.type;
          events.intensity = geoEvent.intensity;
          events.duration = geoEvent.duration;
        }
      }
  
      return events;
    }
  
    /**
     * Check for tornado conditions
     * @param {object} profile - Region profile
     * @param {Date} date - Current date
     * @param {number} temperature - Current temperature
     * @param {number} humidity - Current humidity
     * @param {number} instability - Atmospheric instability value
     * @param {Array} weatherSystems - Active weather systems
     * @returns {boolean} - True if tornado conditions present
     */
    checkForTornado(profile, date, temperature, humidity, instability, weatherSystems) {
      // Tornados require:
      // 1. Warm, humid air
      // 2. Wind shear (changing winds at different heights)
      // 3. Atmospheric instability
      // 4. Often occurs with cold fronts or in spring/summer
  
      // Simplified model:
      const hasTornadoRisk = profile.latitude > 25 && profile.latitude < 50; // Tornado alley
      const month = date.getMonth();
      const isActiveMonth = (month >= 2 && month <= 7); // Spring and summer months
      
      // Basic conditions must be met
      const basicConditions = hasTornadoRisk && 
                             isActiveMonth && 
                             temperature > 70 && 
                             humidity > 60 && 
                             instability > 7;
      
      if (!basicConditions) return false;
  
      // Check for cold front (which can trigger tornadoes)
      const hasColdFront = weatherSystems.some(
        (system) =>
          system.type === "cold-front" &&
          system.age < 12 &&
          system.position > 0.3 &&
          system.position < 0.7
      );
  
      // Need either very high instability or a cold front
      if (instability > 9 || hasColdFront) {
        // Still very rare even with perfect conditions (0.05% chance)
        return Math.random() < 0.0005;
      }
  
      return false;
    }
  
    /**
     * Calculate tornado intensity (EF scale, 0-5)
     * @returns {number} - Tornado intensity
     */
    calculateTornadoIntensity() {
      // Weighted random distribution favoring weaker tornadoes
      const r = Math.random();
      if (r < 0.75) return Math.floor(Math.random() * 3); // 75% chance of EF0-EF2
      if (r < 0.95) return 3; // 20% chance of EF3
      if (r < 0.99) return 4; // 4% chance of EF4
      return 5; // 1% chance of EF5
    }
  
    /**
     * Check for hurricane conditions
     * @param {object} profile - Region profile
     * @param {Date} date - Current date
     * @param {number} temperature - Current temperature
     * @param {number} humidity - Current humidity
     * @param {Array} forecast - Recent weather history
     * @returns {boolean} - True if hurricane conditions present
     */
    checkForHurricane(profile, date, temperature, humidity, forecast) {
      // Hurricanes require:
      // 1. Warm ocean temperatures (>80°F)
      // 2. High humidity
      // 3. Usually within specific season
      // 4. Often at specific latitudes (10-30°)
  
      // Check basic conditions
      const hasHurricaneRisk =
        profile.maritimeInfluence > 0.7 &&
        profile.latitude > 8 &&
        profile.latitude < 35;
  
      // Hurricane season check
      const month = date.getMonth();
      const isHurricaneSeason =
        (profile.latitude > 0 && month >= 5 && month <= 10) || // Northern hemisphere
        (profile.latitude < 0 && (month >= 11 || month <= 4)); // Southern hemisphere
  
      if (!hasHurricaneRisk || !isHurricaneSeason) return false;
  
      // Must have been very hot and humid for several days
      if (!forecast || forecast.length < 48) return false; // Need at least 2 days of history
  
      const highTemps = forecast.filter(
        (hour) => hour._meteoData?.humidity > 80 && hour.temperature > 82
      ).length;
      const hasHighTempHistory = highTemps > 48; // At least 2 days of high temps
  
      // All conditions are met
      if (hasHighTempHistory) {
        // Still extremely rare (0.01% chance per check)
        return Math.random() < 0.0001;
      }
  
      return false;
    }
  
    /**
     * Calculate hurricane intensity (Saffir-Simpson scale, 1-5)
     * @returns {number} - Hurricane intensity
     */
    calculateHurricaneIntensity() {
      // Weighted random distribution
      const r = Math.random();
      if (r < 0.3) return 1; // Category 1: 30%
      if (r < 0.6) return 2; // Category 2: 30%
      if (r < 0.85) return 3; // Category 3: 25%
      if (r < 0.97) return 4; // Category 4: 12%
      return 5; // Category 5: 3%
    }
  
    /**
     * Check for flooding conditions
     * @param {object} profile - Region profile
     * @param {Date} date - Current date
     * @param {Array} forecast - Recent weather with precipitation history
     * @returns {boolean} - True if flooding conditions present
     */
    checkForFlood(profile, date, forecast) {
      if (!forecast || forecast.length < 24) return false; // Need at least 24 hours of history
      
      // Check for prolonged heavy precipitation
      let consecutiveRain = 0;
      let totalPrecip = 0;
  
      // Count consecutive hours of significant precipitation
      for (let i = forecast.length - 1; i >= 0; i--) {
        if (forecast[i]._meteoData && forecast[i]._meteoData.precipAmount > 0.5) {
          consecutiveRain++;
          totalPrecip += forecast[i]._meteoData.precipAmount;
        } else {
          break; // End of consecutive rain
        }
      }
  
      // Need significant consecutive rain to cause flooding
      if (consecutiveRain > 10) {
        // Basic flooding chance increases with duration and amount
        const baseChance = (consecutiveRain * totalPrecip) * 0.0002; // Scales with duration and intensity
  
        // Modify based on terrain - flat terrain floods more easily
        const terrainModifier = 1 - profile.terrainRoughness;
  
        // Calculate final chance
        return Math.random() < baseChance * terrainModifier;
      }
  
      return false;
    }
  
    /**
     * Calculate flood intensity (1-5 scale)
     * @param {Array} forecast - Recent weather with precipitation history
     * @returns {number} - Flood intensity
     */
    calculateFloodIntensity(forecast) {
      // Calculate flood intensity from precipitation history
      let recentPrecip = 0;
      
      // Sum precipitation from the last 24 hours
      for (let i = Math.min(forecast.length - 1, 23); i >= 0; i--) {
        if (forecast[i]._meteoData && forecast[i]._meteoData.precipAmount) {
          recentPrecip += forecast[i]._meteoData.precipAmount;
        }
      }
      
      // Scale from 1-5 based on total precipitation
      const intensity = Math.min(5, Math.floor(recentPrecip / 8) + 1);
      return intensity;
    }
  
    /**
     * Check for geological events (earthquakes, volcanoes, etc.)
     * @param {object} profile - Region profile
     * @param {Date} date - Current date
     * @returns {boolean} - True if geological event occurs
     */
    checkForGeologicalEvent(profile, date) {
      // These are based on region traits rather than weather
      const tectonicActivity = profile.specialFactors?.tectonicActivity || 0;
      const volcanicActivity = profile.specialFactors?.volcanicActivity || 0;
  
      // Base chance: 0.001% for tectonic regions, much less for stable ones
      const earthquakeChance = tectonicActivity * 0.00001;
      const volcanicChance = volcanicActivity * 0.000005;
  
      // Check for event
      return Math.random() < earthquakeChance || Math.random() < volcanicChance;
    }
  
    /**
     * Get geological event details
     * @param {object} profile - Region profile
     * @returns {object} - Geological event details
     */
    getGeologicalEvent(profile) {
      const event = {
        type: null,
        intensity: 0,
        duration: 0,
      };
  
      // Determine whether earthquake or volcanic eruption
      const tectonicActivity = profile.specialFactors?.tectonicActivity || 0;
      const volcanicActivity = profile.specialFactors?.volcanicActivity || 0;
  
      // Weight by intensity
      const total = tectonicActivity + volcanicActivity;
      if (total === 0) return event; // No geological activity
  
      const earthquakeWeight = tectonicActivity / total;
  
      if (Math.random() < earthquakeWeight) {
        event.type = "earthquake";
        event.intensity = Math.min(1 + Math.floor(tectonicActivity * 9), 9); // 1-9 scale
        event.duration = 1; // Hours (aftershocks would be separate)
      } else {
        event.type = "volcanic_eruption";
        event.intensity = Math.min(1 + Math.floor(volcanicActivity * 7), 7); // 1-7 scale
        event.duration = 12 + Math.floor(Math.random() * 72); // 12-84 hours
      }
  
      return event;
    }
    
    /**
     * Check for wildfire conditions
     * @param {object} profile - Region profile
     * @param {Date} date - Current date
     * @param {number} temperature - Current temperature
     * @param {number} humidity - Current humidity
     * @param {Array} forecast - Recent weather history
     * @returns {boolean} - True if wildfire conditions present
     */
    checkForWildfire(profile, date, temperature, humidity, forecast) {
      // Wildfires are more likely with:
      // 1. Hot, dry conditions
      // 2. Low humidity
      // 3. Extended periods without precipitation
      // 4. Certain terrain types (forests, grasslands)
      
      // Basic conditions
      const isHotAndDry = temperature > 85 && humidity < 30;
      if (!isHotAndDry) return false;
      
      // Check for extended dry period
      if (!forecast || forecast.length < 72) return false; // Need at least 3 days of history
      
      // Check for precipitation in the last 72 hours
      const hasPrecipitation = forecast.some(hour => 
        hour._meteoData && hour._meteoData.precipAmount > 0.1
      );
      
      if (hasPrecipitation) return false; // No wildfire if recent precipitation
      
      // Check for wildfire-prone vegetation
      const hasWildfireProneTerrain = profile.specialFactors?.forestDensity > 0.3 || 
                                     profile.specialFactors?.grasslandDensity > 0.4;
      
      if (!hasWildfireProneTerrain) return false;
      
      // Base chance after all conditions are met
      const baseProbability = 0.0002; // 0.02% chance per hour
      
      // Adjust for extreme conditions
      let modifier = 1.0;
      if (temperature > 100) modifier *= 2;
      if (humidity < 15) modifier *= 2;
      
      return Math.random() < baseProbability * modifier;
    }
    
    /**
     * Calculate wildfire intensity (1-5 scale)
     * @param {number} temperature - Current temperature
     * @param {number} humidity - Current humidity
     * @param {number} windSpeed - Current wind speed
     * @returns {number} - Wildfire intensity
     */
    calculateWildfireIntensity(temperature, humidity, windSpeed) {
      // Base intensity
      let intensity = 1;
      
      // Adjust for temperature
      if (temperature > 90) intensity += 1;
      if (temperature > 100) intensity += 1;
      
      // Adjust for humidity
      if (humidity < 25) intensity += 1;
      if (humidity < 15) intensity += 1;
      
      // Adjust for wind
      if (windSpeed > 15) intensity += 1;
      
      // Cap at 5
      return Math.min(5, intensity);
    }
    
    /**
     * Check for drought conditions
     * @param {object} profile - Region profile
     * @param {Date} date - Current date
     * @param {Array} forecast - Last 30 days of weather data
     * @returns {boolean} - True if drought conditions present
     */
    checkForDrought(profile, date, forecast) {
      // This would typically require 30+ days of data to calculate
      // For simplicity, we'll just assume drought is pre-calculated from longer-term data
      
      // Check if the region already has drought status
      const hasDrought = profile.specialFactors?.droughtStatus || false;
      
      // Drought conditions persist but can intensify
      if (hasDrought) {
        // Check if drought is worsening
        if (forecast && forecast.length > 120) { // Need at least 5 days of hourly data
          const precipEvents = forecast.filter(hour => 
            hour._meteoData && hour._meteoData.precipAmount > 0.1
          ).length;
          
          // Drought intensifies if still no precipitation
          if (precipEvents === 0) {
            return 0.75; // 75% chance to intensify existing drought
          }
        }
        
        return 0.5; // 50% chance to maintain drought status
      }
      
      // If no existing drought, would need long-term data (beyond scope of hourly weather)
      return false;
    }
    
    /**
     * Check for heatwave conditions
     * @param {object} profile - Region profile
     * @param {Date} date - Current date
     * @param {number} temperature - Current temperature
     * @param {Array} forecast - Recent weather history
     * @returns {boolean} - True if heatwave conditions present
     */
    checkForHeatwave(profile, date, temperature, forecast) {
      // Heatwave definition: abnormally high temps for multiple consecutive days
      
      // First, calculate seasonal average high
      const month = date.getMonth();
      let seasonalAvgHigh;
      
      // Northern hemisphere seasons
      if (profile.latitude >= 0) {
        if (month >= 11 || month <= 1) seasonalAvgHigh = profile.temperatureProfile.winter.mean + 5; // Winter
        else if (month >= 2 && month <= 4) seasonalAvgHigh = profile.temperatureProfile.spring.mean + 8; // Spring
        else if (month >= 5 && month <= 7) seasonalAvgHigh = profile.temperatureProfile.summer.mean + 10; // Summer
        else seasonalAvgHigh = profile.temperatureProfile.fall.mean + 7; // Fall
      } 
      // Southern hemisphere (opposite seasons)
      else {
        if (month >= 11 || month <= 1) seasonalAvgHigh = profile.temperatureProfile.summer.mean + 10; // Summer
        else if (month >= 2 && month <= 4) seasonalAvgHigh = profile.temperatureProfile.fall.mean + 7; // Fall
        else if (month >= 5 && month <= 7) seasonalAvgHigh = profile.temperatureProfile.winter.mean + 5; // Winter
        else seasonalAvgHigh = profile.temperatureProfile.spring.mean + 8; // Spring
      }
      
      // Check if current temperature is significantly above average
      const isHeatwave = temperature > (seasonalAvgHigh + 15); // 15°F above seasonal high avg
      
      if (!isHeatwave) return false;
      
      // Check if it's been hot for several days
      if (forecast && forecast.length >= 72) { // Need at least 3 days of data
        // Count hours above threshold
        const hoursAboveThreshold = forecast.filter(hour => 
          hour.temperature > (seasonalAvgHigh + 10)
        ).length;
        
        // Need at least 2 days of elevated temperatures (48+ hours)
        if (hoursAboveThreshold >= 48) {
          return true;
        }
      }
      
      return false;
    }
  }
  
  export default ExtremeWeatherService;