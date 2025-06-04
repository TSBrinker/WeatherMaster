// src/services/MeteorologicalWeatherService.js - UPDATED
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
    console.error("METEO SERVICE CREATED - VERSION FIX 2.0"); // Check this appears in console

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
    console.error("Added default systems in constructor:", 
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
        weatherSystems: [...weatherSystems] // Clone the array to avoid reference issues
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


extendForecast(currentForecast, hours, climate, season) {
  console.log(`[MeteorologicalWeatherService] Extending forecast by ${hours} hours`);
  
  if (!currentForecast || currentForecast.length === 0) {
    console.error("[MeteorologicalWeatherService] No current forecast provided to extend");
    return [];
  }
  
  // Make a copy of the current forecast to avoid mutating the original
  const extendedForecast = [...currentForecast];
  
  console.log(`[MeteorologicalWeatherService] Starting with ${extendedForecast.length} existing hours`);
  
  // STEP 1: Generate new hours at the end of the forecast
  // Get the last hour in the current forecast to continue from
  const lastHour = extendedForecast[extendedForecast.length - 1];
  const lastHourTime = new Date(lastHour.date);
  
  console.log(`[MeteorologicalWeatherService] Extending from: ${lastHourTime.toISOString()}`);
  
  // Generate the requested number of new hours
  for (let i = 1; i <= hours; i++) {
    const newHourTime = new Date(lastHourTime);
    newHourTime.setHours(newHourTime.getHours() + i);
    
    // Generate weather for this new hour, continuing from the previous hour
    const previousHour = i === 1 ? lastHour : extendedForecast[extendedForecast.length - 1];
    const newHourWeather = this.generateContinuousWeatherHour(newHourTime, previousHour);
    
    extendedForecast.push(newHourWeather);
    
    console.log(`[MeteorologicalWeatherService] Generated hour ${i}/${hours}: ${newHourTime.toISOString()} - ${newHourWeather.condition}`);
  }
  
  console.log(`[MeteorologicalWeatherService] After extension: ${extendedForecast.length} hours`);
  
  // STEP 2: Remove the first N hours to shift the forecast forward
  const finalForecast = extendedForecast.slice(hours);
  
  console.log(`[MeteorologicalWeatherService] After removing first ${hours} hours: ${finalForecast.length} hours`);
  console.log(`[MeteorologicalWeatherService] New forecast starts at: ${finalForecast[0]?.date.toISOString()}`);
  console.log(`[MeteorologicalWeatherService] New forecast ends at: ${finalForecast[finalForecast.length - 1]?.date.toISOString()}`);
  
  // Update internal forecast state
  this.forecast = finalForecast;
  
  return finalForecast;
}

// Add this helper method for generating continuous weather hours
generateContinuousWeatherHour(dateTime, previousHour) {
  console.log(`[MeteorologicalWeatherService] Generating continuous hour for ${dateTime.toISOString()}`);
  
  // Use previous hour's meteorological data as baseline for continuity
  if (previousHour && previousHour._meteoData) {
    // Set current meteorological state from previous hour
    this.temperature = previousHour.temperature;
    this.humidity = previousHour._meteoData.humidity;
    this.pressure = previousHour._meteoData.pressure;
    this.cloudCover = previousHour._meteoData.cloudCover;
    this.precipitationPotential = previousHour._meteoData.precipitationPotential || 0;
    this.instability = previousHour._meteoData.instability || 0;
    
    // Continue wind from previous hour
    this.currentWind = {
      speed: previousHour.windSpeed,
      direction: previousHour.windDirection
    };
    
    // Update weather systems (advance them by 1 hour)
    this.weatherSystemService.updateWeatherSystems(1, previousHour.condition);
  }
  
  const hour = dateTime.getHours();
  
  // Calculate new meteorological parameters with continuity
  const temperature = this.temperatureService.calculateTemperature(
    this.regionProfile,
    this.seasonalBaseline,
    dateTime,
    hour,
    this.temperature, // Use previous temperature for inertia
    this.cloudCover,
    this.weatherSystemService.getWeatherSystems(),
    () => this.precipitationService.getRecentPrecipitation(),
    (date) => this.getDayOfYear(date)
  );
  
  const humidity = this.atmosphericService.calculateHumidity(
    this.regionProfile,
    this.seasonalBaseline,
    dateTime,
    hour,
    this.humidity, // Use previous humidity for inertia
    temperature,
    this.weatherSystemService.getWeatherSystems(),
    () => this.precipitationService.getRecentPrecipitation(),
    (date) => this.getDayOfYear(date)
  );
  
  const pressure = this.atmosphericService.calculatePressure(
    this.regionProfile,
    dateTime,
    hour,
    this.pressure, // Use previous pressure for inertia
    this.weatherSystemService.getWeatherSystems()
  );
  
  // Update cloud cover
  this.cloudCover = this.atmosphericService.calculateCloudCover(
    this.regionProfile,
    this.seasonalBaseline,
    dateTime,
    hour,
    this.cloudCover, // Use previous cloud cover for inertia
    humidity,
    this.weatherSystemService.getWeatherSystems()
  );
  
  // Calculate precipitation potential
  this.precipitationPotential = this.atmosphericService.calculatePrecipitationPotential(
    humidity,
    temperature,
    pressure,
    this.cloudCover,
    this.instability,
    this.weatherSystemService.getWeatherSystems(),
    () => this.precipitationService.getRecentPrecipitation()
  );
  
  // Update wind
  this.currentWind = this.windService.updateWindFactors(
    this.currentWind,
    hour,
    temperature,
    this.temperature, // Previous temperature
    this.atmosphericService.getPressureTrend(),
    this.weatherSystemService.getWeatherSystems()
  );
  
  // Calculate atmospheric instability
  this.instability = this.weatherConditionService.calculateAtmosphericInstability(
    temperature,
    pressure,
    this.atmosphericService.getPressureTrend(),
    this.precipitationService.getRecentPrecipitation()
  );
  
  // Determine weather condition
  const condition = this.weatherConditionService.determineWeatherCondition(
    temperature,
    humidity,
    pressure,
    this.cloudCover,
    this.precipitationPotential,
    this.currentWind.speed,
    this.instability
  );
  
  // Update internal state for next iteration
  this.temperature = temperature;
  this.humidity = humidity;
  this.pressure = pressure;
  
  // Update precipitation tracking
  const precipAmount = this.atmosphericService.calculatePrecipitationAmount(condition, this.precipitationPotential);
  if (precipAmount > 0) {
    this.precipitationService.updatePrecipitation(precipAmount, condition.includes("Snow") ? "snow" : "rain");
  } else {
    this.precipitationService.updatePrecipitation(0, null);
  }
  
  console.log(`[MeteorologicalWeatherService] Generated: ${condition} at ${temperature}°F`);
  
  return {
    date: new Date(dateTime),
    temperature,
    condition,
    windSpeed: this.currentWind.speed,
    windDirection: this.currentWind.direction,
    windIntensity: this.windService.getWindIntensity(this.currentWind.speed).level,
    effects: this.weatherConditionService.getWeatherEffects(condition),
    _meteoData: {
      humidity,
      pressure,
      cloudCover: this.cloudCover,
      precipAmount,
      instability: this.instability,
      weatherSystems: [...this.weatherSystemService.getWeatherSystems()],
      precipitationPotential: this.precipitationPotential,
      pressureTrend: this.atmosphericService.getPressureTrend()
    }
  };
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
console.log("METEO SERVICE FILE LOADED COMPLETELY - VERSION 2.0");
console.log("Methods available:", Object.getOwnPropertyNames(MeteorologicalWeatherService.prototype));