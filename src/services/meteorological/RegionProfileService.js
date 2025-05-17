// src/services/meteorological/RegionProfileService.js
// Service for handling region profiles and parameters

class RegionProfileService {
    constructor() {
      // Cache for processed profiles to avoid repetitive calculations
      this.profileCache = new Map();
      
      // Map latitude bands to specific latitude values
      this.latitudeBandMap = {
        "equatorial": 5,    // 0-10 degrees
        "tropical": 20,     // 10-30 degrees
        "temperate": 45,    // 30-60 degrees
        "subarctic": 65,    // 60-75 degrees
        "polar": 80         // 75-90 degrees
      };
    }

    /**
     * Clear the profile cache
     */
    clearCache() {
      this.profileCache.clear();
    }

    /**
     * Get detailed region profile from biome and parameters
     * @param {string} biome - Biome type
     * @param {object} parameters - Custom region parameters (optional)
     * @returns {object} - Detailed region profile
     */
    getRegionProfile(biome, parameters = {}) {
      // Check cache first
      const cacheKey = `${biome}-${JSON.stringify(parameters)}`;
      if (this.profileCache.has(cacheKey)) {
        return this.profileCache.get(cacheKey);
      }

      // Determine latitude based on latitude band first, fallback to biome-based latitude
      let latitude;
      if (parameters.latitudeBand && this.latitudeBandMap[parameters.latitudeBand]) {
        latitude = this.latitudeBandMap[parameters.latitudeBand];
      } else {
        latitude = parameters.latitude || this.getBiomeLatitude(biome);
      }
      
      const elevation = parameters.elevation || this.getBiomeElevation(biome);
      const maritimeInfluence = parameters.maritimeInfluence || this.getBiomeMaritimeInfluence(biome);
      
      // Get temperature profile with latitude adjustments
      const temperatureProfile = this.getBiomeTemperatureProfile(biome, {
        ...parameters,
        latitude  // Pass the determined latitude
      });
      
      const humidityProfile = this.getBiomeHumidityProfile(biome, parameters);
      const terrainRoughness = parameters.terrainRoughness || this.getBiomeTerrainRoughness(biome);

      // Optional special factors (region-specific)
      const specialFactors = {
        ...this.getBiomeSpecialFactors(biome),
        ...parameters.specialFactors
      };

      // Create the complete profile
      const profile = {
        name: parameters.name || biome,
        biome,
        latitude,  // Use the determined latitude value
        elevation,
        maritimeInfluence,
        temperatureProfile,
        humidityProfile,
        terrainRoughness,
        specialFactors,
        latitudeBand: parameters.latitudeBand  // Store the original latitude band
      };

      // Cache the result
      this.profileCache.set(cacheKey, profile);

      return profile;
    }

    /**
     * Get seasonal baseline values based on profile and season
     * @param {object} profile - The region profile
     * @param {string} season - The current season
     * @returns {object} - Seasonal baseline values
     */
    getSeasonalBaseline(profile, season) {
      // Get base temperature and humidity for the season
      const tempProfile = profile.temperatureProfile[season];
      const humidityProfile = profile.humidityProfile[season];

      // Calculate pressure baseline slightly higher in winter, lower in summer
      let pressureOffset = 0;
      if (season === "winter") pressureOffset = 5; // Winter
      else if (season === "summer") pressureOffset = -5; // Summer

      // Return seasonal baseline values
      return {
        temperature: tempProfile,
        humidity: humidityProfile,
        pressureOffset,
      };
    }

    /**
     * Map biome to typical latitude
     * @param {string} biome - Biome type
     * @returns {number} - Typical latitude
     */
    getBiomeLatitude(biome) {
      const latitudeMap = {
        "tropical-rainforest": 5, // Near equator
        "tropical-seasonal": 15, // Tropical
        "desert": 25, // Desert regions
        "temperate-grassland": 40, // Temperate prairie regions
        "temperate-deciduous": 45, // Temperate forest
        "temperate-rainforest": 45, // Pacific Northwest type
        "boreal-forest": 55, // Taiga
        "tundra": 70, // Arctic regions
      };

      return latitudeMap[biome] || 45; // Default to temperate
    }

    /**
     * Map biome to typical elevation
     * @param {string} biome - Biome type
     * @returns {number} - Typical elevation in feet
     */
    getBiomeElevation(biome) {
      const elevationMap = {
        "tropical-rainforest": 500, // Typically lower elevation
        "tropical-seasonal": 800, // Often on plateaus
        "desert": 2000, // Many deserts are higher elevation
        "temperate-grassland": 1500, // Often on plains/prairies
        "temperate-deciduous": 800, // Lower to mid elevation
        "temperate-rainforest": 500, // Often coastal/lower
        "boreal-forest": 1200, // Variable
        "tundra": 1500, // Often higher plateaus
      };

      return elevationMap[biome] || 1000; // Default elevation
    }

    /**
     * Map biome to maritime influence factor
     * @param {string} biome - Biome type
     * @returns {number} - Maritime influence (0-1)
     */
    getBiomeMaritimeInfluence(biome) {
      const maritimeMap = {
        "tropical-rainforest": 0.8, // Often coastal or influenced
        "tropical-seasonal": 0.4, // Moderate influence
        "desert": 0.1, // Low maritime influence
        "temperate-grassland": 0.2, // Continental climate
        "temperate-deciduous": 0.5, // Moderate influence
        "temperate-rainforest": 0.9, // Strong maritime influence
        "boreal-forest": 0.3, // Moderate to low
        "tundra": 0.5, // Variable
      };

      return maritimeMap[biome] || 0.5; // Default influence
    }

    /**
     * Map biome to terrain roughness factor
     * @param {string} biome - Biome type
     * @returns {number} - Terrain roughness (0-1)
     */
    getBiomeTerrainRoughness(biome) {
      const roughnessMap = {
        "tropical-rainforest": 0.6, // Hills and mountains
        "tropical-seasonal": 0.4, // Often on plateaus
        "desert": 0.7, // Sandy dunes and rocky outcrops
        "temperate-grassland": 0.3, // Relatively flat
        "temperate-deciduous": 0.5, // Rolling hills
        "temperate-rainforest": 0.7, // Often mountainous coastal areas
        "boreal-forest": 0.6, // Variable terrain
        "tundra": 0.4, // Often flat with some hills
      };

      return roughnessMap[biome] || 0.5; // Default roughness
    }

    /**
     * Map biome to special factors
     * @param {string} biome - Biome type
     * @returns {object} - Special factors
     */
    getBiomeSpecialFactors(biome) {
      // Special factors unique to each biome
      const specialFactorsMap = {
        "tropical-rainforest": {
          hasMonsoonSeason: true,
          highRainfall: true,
          forestDensity: 0.9
        },
        "tropical-seasonal": {
          hasMonsoonSeason: true,
          hasDrySeason: true,
          forestDensity: 0.7
        },
        "desert": {
          hasDrySeason: true,
          highDiurnalVariation: true,
          forestDensity: 0.1,
          grasslandDensity: 0.3
        },
        "temperate-grassland": {
          seasonalPrecipitation: true,
          grasslandDensity: 0.8,
          forestDensity: 0.2
        },
        "temperate-deciduous": {
          deciduousForest: true,
          forestDensity: 0.8,
          grasslandDensity: 0.2
        },
        "temperate-rainforest": {
          hasFog: true,
          highRainfall: true,
          forestDensity: 0.9,
        },
        "boreal-forest": {
          coniferousForest: true,
          coldWinters: true,
          forestDensity: 0.8
        },
        "tundra": {
          hasPermafrost: true,
          polarDay: true,
          polarNight: true,
          forestDensity: 0.1
        },
      };

      return specialFactorsMap[biome] || {}; // Default empty factors
    }

    /**
     * Get seasonal temperature profile for a biome
     * @param {string} biome - Biome type
     * @param {object} parameters - Custom parameters including latitude
     * @returns {object} - Temperature profiles by season
     */
    getBiomeTemperatureProfile(biome, parameters = {}) {
      // Base profiles by biome
      const profileMap = {
        "tropical-rainforest": {
          annual: { mean: 82, variance: 10 },
          winter: { mean: 80, variance: 8 },
          spring: { mean: 82, variance: 8 },
          summer: { mean: 85, variance: 8 },
          fall: { mean: 83, variance: 8 },
        },
        "tropical-seasonal": {
          annual: { mean: 80, variance: 15 },
          winter: { mean: 75, variance: 10 },
          spring: { mean: 82, variance: 12 },
          summer: { mean: 88, variance: 10 },
          fall: { mean: 80, variance: 12 },
        },
        "desert": {
          annual: { mean: 75, variance: 35 },
          winter: { mean: 55, variance: 20 },
          spring: { mean: 75, variance: 20 },
          summer: { mean: 95, variance: 15 },
          fall: { mean: 70, variance: 20 },
        },
        "temperate-grassland": {
          annual: { mean: 55, variance: 30 },
          winter: { mean: 30, variance: 15 },
          spring: { mean: 55, variance: 20 },
          summer: { mean: 80, variance: 15 },
          fall: { mean: 55, variance: 20 },
        },
        "temperate-deciduous": {
          annual: { mean: 55, variance: 30 },
          winter: { mean: 35, variance: 15 },
          spring: { mean: 55, variance: 15 },
          summer: { mean: 75, variance: 15 },
          fall: { mean: 55, variance: 15 },
        },
        "temperate-rainforest": {
          annual: { mean: 50, variance: 15 },
          winter: { mean: 40, variance: 10 },
          spring: { mean: 50, variance: 10 },
          summer: { mean: 65, variance: 10 },
          fall: { mean: 50, variance: 10 },
        },
        "boreal-forest": {
          annual: { mean: 35, variance: 40 },
          winter: { mean: 5, variance: 20 },
          spring: { mean: 35, variance: 15 },
          summer: { mean: 65, variance: 15 },
          fall: { mean: 40, variance: 15 },
        },
        "tundra": {
          annual: { mean: 20, variance: 40 },
          winter: { mean: -10, variance: 15 },
          spring: { mean: 20, variance: 15 },
          summer: { mean: 50, variance: 15 },
          fall: { mean: 25, variance: 15 },
        },
      };

      // Get base profile for the biome
      const baseProfile = profileMap[biome] || {
        annual: { mean: 55, variance: 30 },
        winter: { mean: 35, variance: 15 },
        spring: { mean: 55, variance: 15 },
        summer: { mean: 75, variance: 15 },
        fall: { mean: 55, variance: 15 },
      };

      // Adjust for latitude if provided
      let latitudeAdjustedProfile = JSON.parse(JSON.stringify(baseProfile)); // Deep clone
      
      // Apply latitude adjustments - more extreme at lower latitudes
      if (parameters.latitude !== undefined) {
        const latitudeEffect = this.calculateLatitudeEffect(parameters.latitude, biome);
        
        // Apply to each season
        for (const season in latitudeAdjustedProfile) {
          if (season === 'annual') continue; // Skip annual, we'll recalculate it
          
          latitudeAdjustedProfile[season].mean += latitudeEffect[season] || 0;
          
          // Make sure variance makes sense for the latitude
          if (parameters.latitude < 30) {
            // Lower variance near equator
            latitudeAdjustedProfile[season].variance = 
              Math.max(5, latitudeAdjustedProfile[season].variance * 0.7);
          } else if (parameters.latitude > 60) {
            // Higher variance near poles
            latitudeAdjustedProfile[season].variance = 
              Math.min(50, latitudeAdjustedProfile[season].variance * 1.3);
          }
        }
        
        // Recalculate annual mean
        const seasonalMeans = [
          latitudeAdjustedProfile.winter.mean,
          latitudeAdjustedProfile.spring.mean,
          latitudeAdjustedProfile.summer.mean,
          latitudeAdjustedProfile.fall.mean
        ];
        latitudeAdjustedProfile.annual.mean = 
          seasonalMeans.reduce((sum, val) => sum + val, 0) / seasonalMeans.length;
      }

      // If no custom parameters, return the latitude-adjusted profile
      if (!parameters.temperatureProfile) {
        return latitudeAdjustedProfile;
      }

      // Apply custom parameters if provided
      const customProfile = parameters.temperatureProfile;
      const mergedProfile = {};

      // Merge adjusted profile with custom values
      for (const season in latitudeAdjustedProfile) {
        mergedProfile[season] = {
          mean: customProfile[season]?.mean !== undefined ? 
                customProfile[season].mean : latitudeAdjustedProfile[season].mean,
          variance: customProfile[season]?.variance !== undefined ? 
                   customProfile[season].variance : latitudeAdjustedProfile[season].variance
        };
      }

      return mergedProfile;
    }
    
    /**
     * Calculate latitude-based temperature adjustments
     * @param {number} latitude - Latitude in degrees
     * @param {string} biome - Biome type
     * @returns {object} - Temperature adjustments by season
     */
    calculateLatitudeEffect(latitude, biome) {
      // Get the default latitude for this biome
      const defaultLatitude = this.getBiomeLatitude(biome);
      
      // Calculate difference from biome's default latitude
      const latitudeDiff = defaultLatitude - latitude;
      
      // Temperature effect per degree latitude (more pronounced in winter)
      // In reality, this varies by location, but roughly 1°F per degree latitude in winter
      // and 0.5°F per degree latitude in summer
      const winterEffect = latitudeDiff * 1.0;
      const summerEffect = latitudeDiff * 0.5;
      const shoulderEffect = latitudeDiff * 0.7; // Spring/Fall
      
      return {
        winter: winterEffect,
        spring: shoulderEffect,
        summer: summerEffect,
        fall: shoulderEffect
      };
    }

    /**
     * Get humidity profile for a biome
     * @param {string} biome - Biome type
     * @param {object} parameters - Custom parameters
     * @returns {object} - Humidity profiles by season
     */
    getBiomeHumidityProfile(biome, parameters = {}) {
      const profileMap = {
        "tropical-rainforest": {
          annual: { mean: 85, variance: 10, peakDay: 172 }, // Peaks mid-year
          winter: { mean: 85, variance: 10 },
          spring: { mean: 80, variance: 10 },
          summer: { mean: 75, variance: 10 },
          fall: { mean: 80, variance: 10 },
        },
        "tropical-seasonal": {
          annual: { mean: 65, variance: 30, peakDay: 172 }, // Peaks mid-year (summer)
          winter: { mean: 50, variance: 20 },
          spring: { mean: 60, variance: 20 },
          summer: { mean: 80, variance: 15 },
          fall: { mean: 70, variance: 20 },
        },
        "desert": {
          annual: { mean: 25, variance: 15, peakDay: 172 }, // Slight summer peak
          winter: { mean: 30, variance: 10 },
          spring: { mean: 20, variance: 10 },
          summer: { mean: 15, variance: 5 },
          fall: { mean: 25, variance: 10 },
        },
        "temperate-grassland": {
          annual: { mean: 60, variance: 20, peakDay: 172 }, // Summer peak
          winter: { mean: 65, variance: 15 },
          spring: { mean: 60, variance: 20 },
          summer: { mean: 50, variance: 20 },
          fall: { mean: 65, variance: 15 },
        },
        "temperate-deciduous": {
          annual: { mean: 65, variance: 15, peakDay: 172 }, // Summer peak
          winter: { mean: 70, variance: 10 },
          spring: { mean: 65, variance: 15 },
          summer: { mean: 60, variance: 20 },
          fall: { mean: 70, variance: 15 },
        },
        "temperate-rainforest": {
          annual: { mean: 80, variance: 15, peakDay: 355 }, // Winter peak (rainy season)
          winter: { mean: 85, variance: 10 },
          spring: { mean: 80, variance: 10 },
          summer: { mean: 75, variance: 15 },
          fall: { mean: 80, variance: 10 },
        },
        "boreal-forest": {
          annual: { mean: 70, variance: 20, peakDay: 172 }, // Summer peak
          winter: { mean: 75, variance: 10 },
          spring: { mean: 70, variance: 15 },
          summer: { mean: 65, variance: 20 },
          fall: { mean: 70, variance: 15 },
        },
        "tundra": {
          annual: { mean: 75, variance: 15, peakDay: 172 }, // Summer peak
          winter: { mean: 80, variance: 10 },
          spring: { mean: 75, variance: 10 },
          summer: { mean: 70, variance: 15 },
          fall: { mean: 75, variance: 10 },
        },
      };

      // Get base profile for the biome
      const baseProfile = profileMap[biome] || {
        annual: { mean: 65, variance: 15, peakDay: 172 },
        winter: { mean: 65, variance: 15 },
        spring: { mean: 60, variance: 20 },
        summer: { mean: 50, variance: 25 },
        fall: { mean: 70, variance: 15 },
      };

      // If no custom parameters, return the base profile
      if (!parameters.humidityProfile) {
        return baseProfile;
      }

      // Apply custom parameters if provided
      const customProfile = parameters.humidityProfile;
      const mergedProfile = {};

      // Merge base profile with custom values
      for (const season in baseProfile) {
        mergedProfile[season] = {
          mean: customProfile[season]?.mean !== undefined ? 
                customProfile[season].mean : baseProfile[season].mean,
          variance: customProfile[season]?.variance !== undefined ? 
                   customProfile[season].variance : baseProfile[season].variance
        };
      }

      // Add annual data if it exists in base profile
      if (baseProfile.annual) {
        mergedProfile.annual = {
          mean: customProfile.annual?.mean !== undefined ? 
                customProfile.annual.mean : baseProfile.annual.mean,
          variance: customProfile.annual?.variance !== undefined ? 
                   customProfile.annual.variance : baseProfile.annual.variance,
          peakDay: customProfile.annual?.peakDay !== undefined ? 
                  customProfile.annual.peakDay : baseProfile.annual.peakDay
        };
      }

      return mergedProfile;
    }

    /**
     * Generate a natural language description of the region
     * @param {object} profile - Region profile
     * @returns {string} - Natural language description
     */
    generateRegionDescription(profile) {
      // Latitude description
      let latitudeDesc = "temperate";
      if (profile.latitude <= 10) latitudeDesc = "equatorial";
      else if (profile.latitude <= 30) latitudeDesc = "tropical";
      else if (profile.latitude <= 60) latitudeDesc = "temperate";
      else if (profile.latitude <= 75) latitudeDesc = "subarctic";
      else latitudeDesc = "polar";
      
      // Elevation description
      let elevationDesc = "low-elevation";
      if (profile.elevation >= 5000) elevationDesc = "high mountain";
      else if (profile.elevation >= 3000) elevationDesc = "mountainous";
      else if (profile.elevation >= 1500) elevationDesc = "high-elevation";
      else if (profile.elevation >= 500) elevationDesc = "hilly";
      else elevationDesc = "low-elevation";
      
      // Maritime influence
      let maritimeDesc = "";
      if (profile.maritimeInfluence >= 0.8) maritimeDesc = "with strong coastal influence";
      else if (profile.maritimeInfluence >= 0.5) maritimeDesc = "with moderate maritime influence";
      else if (profile.maritimeInfluence >= 0.2) maritimeDesc = "with slight maritime influence";
      else maritimeDesc = "with continental (inland) climate";
      
      // Terrain effect
      let terrainDesc = "";
      if (profile.terrainRoughness >= 0.8) terrainDesc = " and varied, rugged terrain";
      else if (profile.terrainRoughness >= 0.5) terrainDesc = " and hilly, variable terrain";
      else if (profile.terrainRoughness >= 0.3) terrainDesc = " and gently rolling terrain";
      else terrainDesc = " and predominantly flat terrain";
      
      // Put it all together
      return `A ${elevationDesc} ${latitudeDesc} region ${maritimeDesc}${terrainDesc}. ` +
             this.generateWeatherPrediction(profile);
    }
    
    /**
     * Generate a prediction of typical weather patterns for the region
     * @param {object} profile - Region profile
     * @returns {string} - Weather prediction description
     */
    generateWeatherPrediction(profile) {
      const seasonalVariation = profile.latitude / 90; // Higher latitude = more seasonal variation
      
      // Temperature description
      let tempDesc = "";
      if (profile.latitude <= 20) {
        tempDesc = "Consistently warm temperatures throughout the year";
      } else if (profile.maritimeInfluence >= 0.7) {
        tempDesc = "Moderate temperatures with limited seasonal variation";
      } else if (profile.latitude >= 60) {
        tempDesc = "Very cold winters and short, cool summers";
      } else {
        tempDesc = "Distinct seasonal temperature changes";
      }
      
      // Precipitation prediction
      let precipDesc = "";
      if (profile.maritimeInfluence >= 0.7 && profile.latitude < 40) {
        precipDesc = " and high humidity with frequent rainfall";
      } else if (profile.maritimeInfluence >= 0.7) {
        precipDesc = " and regular precipitation throughout the year";
      } else if (profile.maritimeInfluence <= 0.2 && profile.elevation >= 3000) {
        precipDesc = " and generally dry conditions with sporadic precipitation";
      } else if (profile.maritimeInfluence <= 0.3) {
        precipDesc = " and limited precipitation, especially in summer";
      } else {
        precipDesc = " and moderate, seasonal precipitation patterns";
      }
      
      return tempDesc + precipDesc + ".";
    }
    
    /**
     * For a provided region, find the closest real-world analog
     * @param {object} profile - Region profile
     * @returns {string} - Description of real-world analog
     */
    findRealWorldAnalog(profile) {
      // Sample mapping of combinations to real-world locations
      const analogs = [
        {
          conditions: {
            latitude: { min: 0, max: 10 },
            elevation: { min: 0, max: 1000 },
            maritimeInfluence: { min: 0.7, max: 1.0 }
          },
          location: "Costa Rica or Singapore"
        },
        {
          conditions: {
            latitude: { min: 20, max: 35 },
            elevation: { min: 1500, max: 5000 },
            maritimeInfluence: { min: 0, max: 0.2 }
          },
          location: "Arizona or Northern Mexico"
        },
        {
          conditions: {
            latitude: { min: 40, max: 50 },
            elevation: { min: 0, max: 1000 },
            maritimeInfluence: { min: 0.7, max: 1.0 }
          },
          location: "Pacific Northwest or Southern England"
        },
        {
          conditions: {
            latitude: { min: 40, max: 50 },
            elevation: { min: 0, max: 1000 },
            maritimeInfluence: { min: 0, max: 0.3 }
          },
          location: "American Midwest or Ukraine"
        },
        {
          conditions: {
            latitude: { min: 40, max: 55 },
            elevation: { min: 3000, max: 10000 },
            maritimeInfluence: { min: 0, max: 0.3 }
          },
          location: "Rocky Mountains or Alps"
        },
        {
          conditions: {
            latitude: { min: 55, max: 65 },
            elevation: { min: 0, max: 2000 },
            maritimeInfluence: { min: 0, max: 0.4 }
          },
          location: "Siberia or Northern Canada"
        },
        {
          conditions: {
            latitude: { min: 65, max: 90 },
            elevation: { min: 0, max: 2000 },
            maritimeInfluence: { min: 0, max: 1.0 }
          },
          location: "Northern Alaska or Greenland"
        },
        {
          conditions: {
            latitude: { min: 10, max: 30 },
            elevation: { min: 0, max: 1500 },
            maritimeInfluence: { min: 0.4, max: 1.0 }
          },
          location: "Southern Florida or Northern Thailand"
        },
        {
          conditions: {
            latitude: { min: 10, max: 30 },
            biome: "tropical-seasonal",
            maritimeInfluence: { min: 0, max: 0.4 }
          },
          location: "Central India or Northern Australia"
        },
        {
          conditions: {
            latitude: { min: 10, max: 30 },
            biome: "temperate-deciduous",
            maritimeInfluence: { min: 0.4, max: 1.0 }
          },
          location: "Central and Southern Mexico"
        }
      ];
      
      // Find matching analogs
      const matches = analogs.filter(analog => {
        const conditions = analog.conditions;
        let matches = true;
        
        // Check latitude
        if (conditions.latitude) {
          matches = matches && 
                 profile.latitude >= conditions.latitude.min &&
                 profile.latitude <= conditions.latitude.max;
        }
        
        // Check elevation
        if (conditions.elevation && matches) {
          matches = matches &&
                 profile.elevation >= conditions.elevation.min &&
                 profile.elevation <= conditions.elevation.max;
        }
        
        // Check maritime influence
        if (conditions.maritimeInfluence && matches) {
          matches = matches &&
                 profile.maritimeInfluence >= conditions.maritimeInfluence.min &&
                 profile.maritimeInfluence <= conditions.maritimeInfluence.max;
        }
        
        // Check biome if specified
        if (conditions.biome && matches) {
          matches = matches && profile.biome === conditions.biome;
        }
        
        return matches;
      });
      
      if (matches.length > 0) {
        return `This region has similar climate characteristics to ${matches[0].location}.`;
      }
      
      return "This region has a unique combination of characteristics without a simple real-world analog.";
    }
  }
  
  export default RegionProfileService;