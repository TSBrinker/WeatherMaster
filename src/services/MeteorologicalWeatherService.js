// src/services/MeteorologicalWeatherService.js
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
    console.error("METEO SERVICE CREATED - VERSION FIX 1.0"); // Check this appears in console

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

    // Initialize core state with realistic starting values
    this.temperature = this.temperatureService.calculateBaseTemperature(
      profile,
      seasonalBaseline,
      date,
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
  console.log(`Starting weather generation for hour ${hour}`); // Simple log to verify function execution
  
  // Get seasonal baseline
  const seasonalBaseline = this.regionProfileService.getSeasonalBaseline(profile, season);

  // ... [all your existing code until validatedTemp is calculated] ...

  // Validate temperature for the condition
  const validatedTemp = this.temperatureService.validateTemperatureForCondition(hourTemp, condition);

  // Calculate "feels like" temperature
  const feelsLikeTemp = this.temperatureService.calculateFeelsLikeTemperature(
    
    validatedTemp,
    hourHumidity,
    this.currentWind.speed
  );
  console.log('//////////////////calculateFeelsLikeTemperature called with:', temperature, humidity, windSpeed);


  // Debug log AFTER the calculations are done
  console.log(`LOOK HERE: Temperature calculations:
    Actual: ${validatedTemp}°F
    Feels like: ${feelsLikeTemp}°F
    Difference: ${feelsLikeTemp - validatedTemp}°F
    Humidity: ${hourHumidity}%
    Wind: ${this.currentWind.speed} mph`);
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