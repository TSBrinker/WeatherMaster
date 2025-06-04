// src/services/MeteorologicalWeatherService.js - FIXED VERSION
// Main coordinator service for meteorological weather generation

import WeatherServiceBase from "./WeatherServiceBase";
import TemperatureService from "./meteorological/TemperatureService";
import AtmosphericService from "./meteorological/AtmosphericService";
import WindService from "./meteorological/WindService";
import WeatherSystemService from "./meteorological/WeatherSystemService";
import WeatherConditionService from "./meteorological/WeatherConditionService";
import RegionProfileService from "./meteorological/RegionProfileService";
import PrecipitationService from "./meteorological/PrecipitationService";
import ExtremeWeatherService from "./meteorological/ExtremeWeatherService";

/**
 * Weather service that generates realistic weather patterns using meteorological principles.
 * This service extends the base weather service but produces more realistic hour-by-hour
 * weather instead of using dice tables.
 */
export default class MeteorologicalWeatherService extends WeatherServiceBase {
  constructor() {
    super();
    console.log("METEO SERVICE CREATED - FIXED VERSION 3.0");

    // Initialize specialized services
    this.temperatureService = new TemperatureService();
    this.atmosphericService = new AtmosphericService();
    this.windService = new WindService();
    this.weatherSystemService = new WeatherSystemService();
    this.weatherConditionService = new WeatherConditionService();
    this.regionProfileService = new RegionProfileService();
    this.precipitationService = new PrecipitationService();
    this.extremeWeatherService = new ExtremeWeatherService();

    // Core meteorological state - these are the key physical parameters
    this.temperature = null; // Base temperature in °F
    this.humidity = null; // Relative humidity (0-100%)
    this.pressure = 1013.25; // Atmospheric pressure (hPa), default sea level pressure
    this.cloudCover = null; // Cloud coverage (0-100%)

    // Track weather forecasts
    this.forecast = []; // Hourly forecast
    
    // Force immediate system creation in constructor
    this.weatherSystemService.weatherSystems = []; // Clear any existing systems
    // Add default systems immediately in constructor
    this.weatherSystemService.addDefaultSystems();
    console.log("Added default systems in constructor:", 
                 this.weatherSystemService.weatherSystems.length);
  }

  /**
   * Initialize weather for a region
   * @param {string} biome - The biome type
   * @param {string} season - The season, or 'auto' to determine from date
   * @param {Date} currentDate - The current date
   * @returns {object} - The current weather
   */
  initializeWeather(biome, season, currentDate = new Date()) {
    console.log(`MeteorologicalWeatherService initializing weather: ${biome}, ${season}`);
    
    // Clear any existing forecast
    this.forecast = [];

    // If season is 'auto', determine from the date
    if (season === "auto") {
      season = this.getSeasonFromDate(currentDate);
    }

    // Get the region profile based on biome
    const profile = this.regionProfileService.getRegionProfile(biome);

    // Store these for later use (needed for initialization)
    this.currentProfile = profile;
    this.currentSeason = season;
    this.currentBiome = biome;

    // Initialize base meteorological parameters
    this.initializeBaseParameters(profile, season, currentDate);

    // Initialize weather systems - CRITICAL STEP
    console.log("About to initialize weather systems");
    this.weatherSystemService.initializeWeatherSystems(profile, season, currentDate);
    
    // EMERGENCY CHECK - Make sure systems were created
    if (!this.weatherSystemService.weatherSystems || 
        this.weatherSystemService.weatherSystems.length === 0) {
      console.error("EMERGENCY: No weather systems created during initialization, adding defaults");
      this.weatherSystemService.addDefaultSystems();
    }
    
    console.log(`After initialization: ${this.weatherSystemService.weatherSystems.length} weather systems`);

    // Initialize precipitation tracking
    this.precipitationService.initializePrecipitation();

    // Generate the weather forecast - at least 24 hours
    this.generateWeatherForecast(biome, season, currentDate);

    return this.getCurrentWeather();
  }

  /**
   * Initialize the base meteorological parameters for the region
   * @param {object} profile - The region profile
   * @param {string} season - The current season
   * @param {Date} date - The current date
   */
  initializeBaseParameters(profile, season, date) {
    // Get the hour of the day
    const hour = date.getHours();

    // Get seasonal baseline values
    const seasonalBaseline = this.regionProfileService.getSeasonalBaseline(profile, season);

    // Initialize core state with realistic starting values using physics-based approach
    console.log("Initializing temperature with physics-based model");
    this.temperature = this.temperatureService.calculateBaseTemperature(
      profile,
      seasonalBaseline,
      date, // Pass full date object
      hour
    );
    
    this.humidity = this.atmosphericService.calculateBaseHumidity(
      profile,
      seasonalBaseline,
      date,
      hour
    );
    
    this.pressure = this.atmosphericService.calculateBasePressure(profile, date);
    
    this.cloudCover = this.atmosphericService.calculateBaseCloudCover(
      profile,
      seasonalBaseline,
      date,
      hour
    );

    // Initialize pressure history
    this.atmosphericService.resetPressureHistory(this.pressure);

    // Initialize wind
    this.currentWind = this.windService.initializeWind();

    console.log(`Initialized meteorological parameters for ${profile.name || "unnamed region"}`);
    console.log(
      `Base temperature: ${this.temperature}°F, Humidity: ${this.humidity}%, Pressure: ${this.pressure} hPa`
    );
  }

  /**
   * Generate a 24+ hour forecast with hour-by-hour meteorological evolution
   * @param {string} biome - The biome type
   * @param {string} season - The current season
   * @param {Date} currentDate - The starting date
   * @returns {Array} - The 24-hour forecast
   */
  generateWeatherForecast(biome, season, currentDate) {
    // Get profile for the region
    const profile = this.regionProfileService.getRegionProfile(biome);

    // Generate initial 24+ hours individually (not in chunks like dice tables)
    for (let i = 0; i < 24; i++) {
      // Calculate hour of day
      const startHour = currentDate.getHours();
      const currentHour = (startHour + i) % 24;

      // Calculate date for this hour
      const hourDate = new Date(currentDate);
      hourDate.setHours(hourDate.getHours() + i);

      // Before generating each hour, update weather systems
      // EMERGENCY CHECK - Force systems to exist
      if (!this.weatherSystemService.weatherSystems || 
          this.weatherSystemService.weatherSystems.length === 0) {
        console.error(`EMERGENCY: No weather systems before hour ${i}, adding defaults`);
        this.weatherSystemService.addDefaultSystems();
      }
      
      this.weatherSystemService.updateWeatherSystems(1); // Update for 1 hour

      // Generate weather for this specific hour
      const hourlyWeather = this.generateHourlyWeather(
        currentHour,
        hourDate,
        profile,
        season
      );

      // Add to forecast
      this.forecast.push(hourlyWeather);
    }

    return this.get24HourForecast();
  }

  /**
   * Generate weather for a specific hour
   * @param {number} hour - Hour of the day (0-23)
   * @param {Date} date - Date object for this hour
   * @param {object} profile - Region profile
   * @param {string} season - Current season
   * @returns {object} - Weather data for this hour
   */
  generateHourlyWeather(hour, date, profile, season) {
    console.log("PHYSICS-BASED WEATHER GENERATION RUNNING");
    
    // Get seasonal baseline
    const seasonalBaseline = this.regionProfileService.getSeasonalBaseline(profile, season);

    // Get active weather systems
    const weatherSystems = this.weatherSystemService.getWeatherSystems();

    // Calculate pressure trend from recent history
    const pressureTrend = this.atmosphericService.calculatePressureTrend(this.pressure);

    // Update weather parameters based on time, weather systems, and profile
    // KEY CHANGE - USING THE PHYSICS-BASED TEMPERATURE CALCULATION
    const hourTemp = this.temperatureService.calculateTemperature(
      profile,
      seasonalBaseline,
      date, // Pass full date object
      hour,
      this.temperature,
      this.cloudCover,
      weatherSystems,
      () => this.precipitationService.getRecentPrecipitation(),
      (d) => this.getDayOfYear(d)
    );

    // Update humidity
    const hourHumidity = this.atmosphericService.calculateHumidity(
      profile,
      seasonalBaseline,
      date, // Pass full date object
      hour,
      this.humidity,
      hourTemp,
      weatherSystems,
      () => this.precipitationService.getRecentPrecipitation(),
      (d) => this.getDayOfYear(d)
    );

    // Update pressure
    const hourPressure = this.atmosphericService.calculatePressure(
      profile,
      date, // Pass full date object
      hour,
      this.pressure,
      weatherSystems
    );

    // Update cloud cover
    const hourCloudCover = this.atmosphericService.calculateCloudCover(
      profile,
      seasonalBaseline,
      date, // Pass full date object
      hour,
      this.cloudCover,
      hourHumidity,
      weatherSystems
    );

    // Calculate atmospheric instability (thunderstorm potential)
    const instability = this.weatherConditionService.calculateAtmosphericInstability(
      hourTemp,
      hourPressure,
      pressureTrend,
      this.precipitationService.getRecentPrecipitation()
    );

    // Calculate precipitation potential
    const precipitationPotential = this.atmosphericService.calculatePrecipitationPotential(
      hourHumidity,
      hourTemp,
      hourPressure,
      hourCloudCover,
      instability,
      weatherSystems,
      () => this.precipitationService.getRecentPrecipitation(),
      this.lastCondition
    );

    // Update wind factors
    this.currentWind = this.windService.updateWindFactors(
      this.currentWind,
      hour,
      hourTemp,
      this.temperature || hourTemp,
      pressureTrend,
      weatherSystems,
      this.lastCondition
    );

    // Determine weather condition
    const condition = this.weatherConditionService.determineWeatherCondition(
      hourTemp,
      hourHumidity,
      hourPressure,
      hourCloudCover,
      precipitationPotential,
      this.currentWind.speed,
      instability
    );

    // Track the condition for next time
    this.lastCondition = condition;

    // Validate temperature for the condition
    const validatedTemp = this.temperatureService.validateTemperatureForCondition(hourTemp, condition);

    // Calculate "feels like" temperature
    const feelsLikeTemp = this.temperatureService.calculateFeelsLikeTemperature(
      validatedTemp,
      hourHumidity,
      this.currentWind.speed
    );

    // Calculate precipitation amount if precipitating
    const precipAmount = this.atmosphericService.calculatePrecipitationAmount(
      condition,
      precipitationPotential
    );

    // Update precipitation tracker
    this.precipitationService.updatePrecipitation(
      precipAmount,
      condition.includes("Snow") ? "snow" : "rain"
    );

    // Check for celestial events (shooting stars, meteor impacts)
    const celestialEvents = this.weatherConditionService.generateCelestialEvents();

    // Generate weather description and effects
    const effects = this.weatherConditionService.getWeatherEffects(condition);

    // Update internal state for next hour
    this.temperature = validatedTemp;
    this.humidity = hourHumidity;
    this.pressure = hourPressure;
    this.cloudCover = hourCloudCover;

    // Build the weather object for this hour
    const hourlyWeather = {
      date,
      hour,
      condition,
      temperature: Math.round(validatedTemp),
      feelsLikeTemperature: Math.round(feelsLikeTemp),
      windDirection: this.currentWind.direction,
      windSpeed: Math.round(this.currentWind.speed),
      windIntensity: this.windService.getWindIntensity(this.currentWind.speed).level,
      effects,
      hasShootingStar: celestialEvents.shootingStar,
      hasMeteorImpact: celestialEvents.meteorImpact,
      
      // Meteological details stored in a sub-object
      _meteoData: {
        humidity: hourHumidity,
        pressure: hourPressure,
        cloudCover: hourCloudCover,
        instability,
        precipitationPotential,
        precipAmount,
        pressureTrend,
        weatherSystems: [...weatherSystems], // Clone the array to avoid reference issues
        
        // CRITICAL: Store all the context needed for stateless generation
        profile: JSON.parse(JSON.stringify(profile)), // Deep clone
        season,
        biome: this.currentBiome || "temperate-deciduous",
        seasonalBaseline: JSON.parse(JSON.stringify(this.regionProfileService.getSeasonalBaseline(profile, season)))
      }
    };

    return hourlyWeather;
  }

  /**
   * Calculate the day of year (0-365)
   * @param {Date} date - Date to calculate for
   * @returns {number} - Day of year
   */
  getDayOfYear(date) {
    // Check for valid date
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.error("Invalid date in getDayOfYear:", date);
      return 0;
    }
    
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  /**
   * Advance time and update the forecast
   * @param {number} hours - Hours to advance
   * @param {string} biome - The biome type
   * @param {string} season - The season
   * @param {Date} currentDate - The current date
   * @returns {object} - Updated current weather
   */
  advanceTime(hours, biome, season, currentDate) {
    console.log(`MeteoWeatherService advancing time: ${hours} hours`);
    
    // If season is 'auto', determine from the date
    if (season === "auto") {
      const newDate = new Date(currentDate.getTime() + hours * 3600000);
      season = this.getSeasonFromDate(newDate);
    }

    // Remove the hours we're advancing
    this.forecast = this.forecast.slice(hours);

    // Get profile for region
    const profile = this.regionProfileService.getRegionProfile(biome);

    // Calculate new date for continued forecast
    const newStartDate = new Date(currentDate.getTime() + hours * 3600000);

    // EMERGENCY CHECK - Ensure weather systems exist
    if (!this.weatherSystemService.weatherSystems || 
        this.weatherSystemService.weatherSystems.length === 0) {
      console.error("EMERGENCY: No weather systems before advanceTime, adding defaults");
      this.weatherSystemService.addDefaultSystems();
    }
    
    // Update weather systems for elapsed time
    this.weatherSystemService.updateWeatherSystems(hours);

    // Generate additional hours to maintain 24+ hour forecast
    for (let i = 0; i < hours; i++) {
      // Calculate hour and date for this new forecast entry
      const hourToAdd = 24 + i; // Add to end of existing forecast
      const currentHour = (newStartDate.getHours() + hourToAdd) % 24;

      const hourDate = new Date(newStartDate);
      hourDate.setHours(hourDate.getHours() + hourToAdd);

      // Update systems for each hour
      this.weatherSystemService.updateWeatherSystems(1);

      // Generate weather for this hour
      const hourlyWeather = this.generateHourlyWeather(
        currentHour,
        hourDate,
        profile,
        season
      );

      // Add to forecast
      this.forecast.push(hourlyWeather);
    }

    return this.getCurrentWeather();
  }

  /**
   * FIXED: Extend forecast using ONLY previous hour's meteorological data (stateless)
   * @param {Array} currentForecast - The current 24-hour forecast array
   * @param {number} hours - Hours to advance and extend
   * @param {string} climate - Climate type (used as fallback)
   * @param {string} season - Season (used as fallback)
   * @returns {Array} - New 24-hour forecast starting from advanced time
   */
  extendForecast(currentForecast, hours, climate, season) {
    console.log(`[MeteorologicalWeatherService] STATELESS extend forecast by ${hours} hours`);
    
    if (!currentForecast || currentForecast.length === 0) {
      console.error("[MeteorologicalWeatherService] No current forecast provided to extend");
      return [];
    }
    
    // Make a copy of the current forecast to avoid mutating the original
    const extendedForecast = [...currentForecast];
    
    console.log(`[MeteorologicalWeatherService] Starting with ${extendedForecast.length} existing hours`);
    
    // STEP 1: Extract all context from the LAST hour in the forecast
    const lastHour = extendedForecast[extendedForecast.length - 1];
    const lastHourTime = new Date(lastHour.date);
    
    console.log(`[MeteorologicalWeatherService] Extending from: ${lastHourTime.toISOString()}`);
    console.log(`[MeteorologicalWeatherService] Last hour condition: ${lastHour.condition} at ${lastHour.temperature}°F`);
    
    // Extract EVERYTHING we need from the last hour's _meteoData
    let profile, seasonalBaseline, extractedSeason, extractedBiome;
    
    if (lastHour._meteoData && lastHour._meteoData.profile) {
      // Perfect! We have all the context stored
      profile = lastHour._meteoData.profile;
      seasonalBaseline = lastHour._meteoData.seasonalBaseline;
      extractedSeason = lastHour._meteoData.season || season;
      extractedBiome = lastHour._meteoData.biome || climate;
      
      console.log(`[MeteorologicalWeatherService] Using stored context: ${extractedBiome}, ${extractedSeason}`);
    } else {
      // Fallback: reconstruct from parameters
      console.warn(`[MeteorologicalWeatherService] No stored context, reconstructing from ${climate}, ${season}`);
      extractedBiome = climate || "temperate-deciduous";
      extractedSeason = season || "spring";
      profile = this.regionProfileService.getRegionProfile(extractedBiome);
      seasonalBaseline = this.regionProfileService.getSeasonalBaseline(profile, extractedSeason);
    }
    
    // STEP 2: Set up atmospheric state from last hour
    let atmosphericState = {
      temperature: lastHour.temperature,
      humidity: lastHour._meteoData?.humidity || 50,
      pressure: lastHour._meteoData?.pressure || 1013.25,
      cloudCover: lastHour._meteoData?.cloudCover || 30,
      precipitationPotential: lastHour._meteoData?.precipitationPotential || 0,
      instability: lastHour._meteoData?.instability || 3,
      weatherSystems: lastHour._meteoData?.weatherSystems ? [...lastHour._meteoData.weatherSystems] : [],
      wind: {
        speed: lastHour.windSpeed,
        direction: lastHour.windDirection
      }
    };
    
    // STEP 3: Create temporary service instances for stateless calculation
    const tempAtmosphericService = new AtmosphericService();
    const tempTemperatureService = new TemperatureService();
    const tempWindService = new WindService();
    const tempWeatherSystemService = new WeatherSystemService();
    const tempWeatherConditionService = new WeatherConditionService();
    const tempPrecipitationService = new PrecipitationService();
    
    // Initialize pressure history in temp service
    tempAtmosphericService.resetPressureHistory(atmosphericState.pressure);
    
    // Set weather systems in temp service
    tempWeatherSystemService.weatherSystems = atmosphericState.weatherSystems;
    
    // If no weather systems, add defaults
    if (tempWeatherSystemService.weatherSystems.length === 0) {
      console.log("[MeteorologicalWeatherService] No weather systems found, adding defaults");
      tempWeatherSystemService.addDefaultSystems();
    }
    
    console.log(`[MeteorologicalWeatherService] Starting atmospheric state:`, {
      temp: atmosphericState.temperature,
      humidity: atmosphericState.humidity,
      pressure: atmosphericState.pressure,
      cloudCover: atmosphericState.cloudCover,
      windSpeed: atmosphericState.wind.speed,
      systems: atmosphericState.weatherSystems.length
    });
    
    // STEP 4: Generate new hours using sophisticated meteorological modeling
    for (let i = 1; i <= hours; i++) {
      const newHourTime = new Date(lastHourTime);
      newHourTime.setHours(newHourTime.getHours() + i);
      const hour = newHourTime.getHours();
      
      // Update weather systems for this hour (they evolve!)
      tempWeatherSystemService.updateWeatherSystems(1, atmosphericState.lastCondition);
      const currentWeatherSystems = tempWeatherSystemService.getWeatherSystems();
      
      // Calculate pressure trend
      const pressureTrend = tempAtmosphericService.calculatePressureTrend(atmosphericState.pressure);
      
      // Calculate new temperature using sophisticated physics model
      const newTemperature = tempTemperatureService.calculateTemperature(
        profile,
        seasonalBaseline,
        newHourTime,
        hour,
        atmosphericState.temperature, // Previous temperature for inertia
        atmosphericState.cloudCover,
        currentWeatherSystems,
        () => 0, // Simplified for stateless operation
        (date) => this.getDayOfYear(date)
      );
      
      // Calculate new humidity
      const newHumidity = tempAtmosphericService.calculateHumidity(
        profile,
        seasonalBaseline,
        newHourTime,
        hour,
        atmosphericState.humidity, // Previous humidity for inertia
        newTemperature,
        currentWeatherSystems,
        () => 0, // Simplified for stateless operation
        (date) => this.getDayOfYear(date)
      );
      
      // Calculate new pressure
      const newPressure = tempAtmosphericService.calculatePressure(
        profile,
        newHourTime,
        hour,
        atmosphericState.pressure, // Previous pressure for inertia
        currentWeatherSystems
      );
      
      // Calculate new cloud cover
      const newCloudCover = tempAtmosphericService.calculateCloudCover(
        profile,
        seasonalBaseline,
        newHourTime,
        hour,
        atmosphericState.cloudCover, // Previous cloud cover for inertia
        newHumidity,
        currentWeatherSystems
      );
      
      // Calculate atmospheric instability
      const newInstability = tempWeatherConditionService.calculateAtmosphericInstability(
        newTemperature,
        newPressure,
        pressureTrend,
        0 // Simplified precipitation for stateless operation
      );
      
      // Calculate precipitation potential
      const newPrecipitationPotential = tempAtmosphericService.calculatePrecipitationPotential(
        newHumidity,
        newTemperature,
        newPressure,
        newCloudCover,
        newInstability,
        currentWeatherSystems,
        () => 0, // Simplified for stateless operation
        atmosphericState.lastCondition
      );
      
      // Update wind
      const newWind = tempWindService.updateWindFactors(
        atmosphericState.wind,
        hour,
        newTemperature,
        atmosphericState.temperature, // Previous temperature
        pressureTrend,
        currentWeatherSystems,
        atmosphericState.lastCondition
      );
      
      // Determine weather condition
      const newCondition = tempWeatherConditionService.determineWeatherCondition(
        newTemperature,
        newHumidity,
        newPressure,
        newCloudCover,
        newPrecipitationPotential,
        newWind.speed,
        newInstability
      );
      
      // Validate temperature for condition
      const validatedTemp = tempTemperatureService.validateTemperatureForCondition(newTemperature, newCondition);
      
      // Calculate precipitation amount
      const precipAmount = tempAtmosphericService.calculatePrecipitationAmount(newCondition, newPrecipitationPotential);
      
      // Get wind intensity
      const windIntensity = tempWindService.getWindIntensity(newWind.speed);
      
      // Get weather effects
      const effects = tempWeatherConditionService.getWeatherEffects(newCondition);
      
      // Create the new hour with complete meteorological data
      const newHourWeather = {
        date: new Date(newHourTime),
        hour,
        condition: newCondition,
        temperature: Math.round(validatedTemp),
        feelsLikeTemperature: Math.round(tempTemperatureService.calculateFeelsLikeTemperature(validatedTemp, newHumidity, newWind.speed)),
        windDirection: newWind.direction,
        windSpeed: Math.round(newWind.speed),
        windIntensity: windIntensity.level,
        effects,
        hasShootingStar: false, // Simplified for stateless operation
        hasMeteorImpact: false,
        
        _meteoData: {
          humidity: newHumidity,
          pressure: newPressure,
          cloudCover: newCloudCover,
          instability: newInstability,
          precipitationPotential: newPrecipitationPotential,
          precipAmount,
          pressureTrend,
          weatherSystems: [...currentWeatherSystems], // Current state of weather systems
          
          // Store context for next extension
          profile: JSON.parse(JSON.stringify(profile)),
          season: extractedSeason,
          biome: extractedBiome,
          seasonalBaseline: JSON.parse(JSON.stringify(seasonalBaseline))
        }
      };
      
      // Add to extended forecast
      extendedForecast.push(newHourWeather);
      
      // Update atmospheric state for next iteration
      atmosphericState = {
        temperature: validatedTemp,
        humidity: newHumidity,
        pressure: newPressure,
        cloudCover: newCloudCover,
        precipitationPotential: newPrecipitationPotential,
        instability: newInstability,
        weatherSystems: [...currentWeatherSystems],
        wind: newWind,
        lastCondition: newCondition
      };
      
      console.log(`[MeteorologicalWeatherService] Generated hour ${i}/${hours}: ${newHourTime.toISOString()} - ${newCondition} at ${Math.round(validatedTemp)}°F`);
    }
    
    console.log(`[MeteorologicalWeatherService] After extension: ${extendedForecast.length} hours`);
    
    // STEP 5: Remove the first N hours to shift the forecast forward
    const finalForecast = extendedForecast.slice(hours);
    
    console.log(`[MeteorologicalWeatherService] After removing first ${hours} hours: ${finalForecast.length} hours`);
    console.log(`[MeteorologicalWeatherService] New forecast starts at: ${finalForecast[0]?.date.toISOString()}`);
    console.log(`[MeteorologicalWeatherService] New forecast ends at: ${finalForecast[finalForecast.length - 1]?.date.toISOString()}`);
    
    return finalForecast;
  }

  /**
   * Get the current weather (first item in the forecast)
   * @returns {object|null} - Current weather or null if forecast is empty
   */
  getCurrentWeather() {
    if (this.forecast.length === 0) {
      return null;
    }
    return this.forecast[0];
  }

  /**
   * Get the 24-hour forecast
   * @returns {Array} - 24-hour forecast
   */
  get24HourForecast() {
    return this.forecast.slice(0, 24);
  }
}

// At the very end of the MeteorologicalWeatherService.js file, after the class closing bracket
console.log("METEO SERVICE FILE LOADED COMPLETELY - FIXED VERSION 3.0");
console.log("Methods available:", Object.getOwnPropertyNames(MeteorologicalWeatherService.prototype));