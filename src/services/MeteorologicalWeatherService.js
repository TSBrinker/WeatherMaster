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
  }

  /**
   * Initialize weather for a region
   * @param {string} biome - The biome type
   * @param {string} season - The season, or 'auto' to determine from date
   * @param {Date} currentDate - The current date
   * @returns {object} - The current weather
   */
  initializeWeather(biome, season, currentDate = new Date()) {
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

    // Initialize weather systems
    this.weatherSystemService.initializeWeatherSystems(profile, season, currentDate);

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

    console.log(`Initialized meteorological parameters for ${profile.name}`);
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
    // Get seasonal baseline
    const seasonalBaseline = this.regionProfileService.getSeasonalBaseline(profile, season);

    // Get active weather systems
    const weatherSystems = this.weatherSystemService.getWeatherSystems();

    // Calculate physical parameters for this hour
    const hourTemp = this.temperatureService.calculateTemperature(
      profile,
      seasonalBaseline,
      date,
      hour,
      this.temperature,
      this.cloudCover,
      weatherSystems,
      () => this.precipitationService.getRecentPrecipitation(),
      (date) => this.getDayOfYear(date)
    );

    const hourHumidity = this.atmosphericService.calculateHumidity(
      profile,
      seasonalBaseline,
      date,
      hour,
      this.humidity,
      this.temperature,
      weatherSystems,
      () => this.precipitationService.getRecentPrecipitation(),
      (date) => this.getDayOfYear(date)
    );

    const hourPressure = this.atmosphericService.calculatePressure(
      profile,
      date,
      hour,
      this.pressure,
      weatherSystems
    );

    // Calculate pressure trend
    const pressureTrend = this.atmosphericService.calculatePressureTrend(hourPressure);

    const hourCloudCover = this.atmosphericService.calculateCloudCover(
      profile,
      seasonalBaseline,
      date,
      hour,
      this.cloudCover,
      hourHumidity,
      weatherSystems
    );

    // Update wind based on pressure and other factors
    this.currentWind = this.windService.updateWindFactors(
      this.currentWind,
      hour,
      hourTemp,
      this.temperature,
      pressureTrend,
      weatherSystems
    );

    // Calculate atmospheric instability
    const instability = this.weatherConditionService.calculateAtmosphericInstability(
      hourTemp,
      hourPressure,
      pressureTrend,
      this.precipitationService.getRecentPrecipitation()
    );

    // Calculate precipitation potential based on physical factors
    const precipitationPotential = this.atmosphericService.calculatePrecipitationPotential(
      hourHumidity,
      hourTemp,
      hourPressure,
      hourCloudCover,
      instability,
      weatherSystems,
      () => this.precipitationService.getRecentPrecipitation()
    );

    // Update our base values for the next hour
    this.temperature = hourTemp;
    this.humidity = hourHumidity;
    this.pressure = hourPressure;
    this.cloudCover = hourCloudCover;

    // Determine weather condition from physical factors
    const condition = this.weatherConditionService.determineWeatherCondition(
      hourTemp,
      hourHumidity,
      hourPressure,
      hourCloudCover,
      precipitationPotential,
      this.currentWind.speed,
      instability
    );

    // Update precipitation history if it's precipitating
    const isPrecipitating = this.weatherConditionService.isPrecipitating(condition);
    const precipAmount = isPrecipitating
      ? this.atmosphericService.calculatePrecipitationAmount(condition, precipitationPotential)
      : 0;

    this.precipitationService.updatePrecipitation(
      precipAmount,
      condition === "Snow" || condition === "Blizzard" ? "snow" : "rain"
    );

    // Validate temperature for the condition
    const validatedTemp = this.temperatureService.validateTemperatureForCondition(hourTemp, condition);

    // Calculate weather effects text
    const effects = this.weatherConditionService.getWeatherEffects(condition);

    // Generate celestial events
    const celestialEvents = this.weatherConditionService.generateCelestialEvents();

    // Get wind intensity information
    const windIntensity = this.windService.getWindIntensity(this.currentWind.speed);

    // Create the weather entry in the same format as dice table service for compatibility
    return {
      condition,
      temperature: Math.round(validatedTemp), // Round temperature to whole degrees
      hour: hour,
      date: date,
      windDirection: this.currentWind.direction,
      windSpeed: Math.round(this.currentWind.speed),
      windIntensity: windIntensity.level,
      effects: effects,
      hasShootingStar: celestialEvents.shootingStar,
      hasMeteorImpact: celestialEvents.meteorImpact,

      // Additional meteorological data (for internal use only)
      _meteoData: {
        humidity: hourHumidity,
        pressure: hourPressure,
        cloudCover: hourCloudCover,
        precipitationPotential,
        precipAmount,
        instability
      },
    };
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

  /**
   * Calculate season from date
   * @param {Date} date - Date to calculate season for
   * @returns {string} - Season name
   */
  getSeasonFromDate(date) {
    // Inherits from base class but we can override if needed
    return super.getSeasonFromDate(date);
  }

  /**
   * Calculate day of year (0-365)
   * @param {Date} date - Date object
   * @returns {number} - Day of year
   */
  getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  /**
   * Reset all meteorological state
   */
  resetState() {
    this.temperature = null;
    this.humidity = null;
    this.pressure = 1013.25;
    this.cloudCover = null;
    this.forecast = [];
    this.currentWind = this.windService.initializeWind();
    this.atmosphericService.resetPressureHistory(this.pressure);
    this.precipitationService.initializePrecipitation();
    this.weatherSystemService.clearWeatherSystems();
  }

  /**
   * Check for extreme weather events
   * @param {string} biome - The biome type
   * @param {Date} date - Current date
   * @returns {object} - Extreme weather event details if one occurs
   */
  checkExtremeWeatherEvents(biome, date) {
    const profile = this.regionProfileService.getRegionProfile(biome);
    
    return this.extremeWeatherService.checkExtremeWeatherEvents(
      profile,
      date,
      this.temperature,
      this.humidity,
      this.pressure,
      this.weatherSystemService.getWeatherSystems(),
      this.forecast,
      this.weatherConditionService.calculateAtmosphericInstability(
        this.temperature,
        this.pressure,
        this.atmosphericService.getPressureTrend(),
        this.precipitationService.getRecentPrecipitation()
      )
    );
  }

  /**
   * Create an extreme weather event (for manual triggering)
   * @param {string} eventType - Type of event
   * @param {number} intensity - Intensity level
   * @param {string} biome - The biome type
   * @returns {object} - Weather event object
   */
  createExtremeWeatherEvent(eventType, intensity, biome) {
    const profile = this.regionProfileService.getRegionProfile(biome);
    let duration = 0;
    
    // Set appropriate duration based on event type
    switch (eventType) {
      case "tornado":
        duration = 1 + Math.floor(Math.random() * 3); // 1-3 hours
        break;
      case "hurricane":
        duration = 24 + Math.floor(Math.random() * 48); // 24-72 hours
        break;
      case "flood":
        duration = 12 + Math.floor(Math.random() * 36); // 12-48 hours
        break;
      case "wildfire":
        duration = 48 + Math.floor(Math.random() * 72); // 2-5 days
        break;
      case "earthquake":
        duration = 1; // 1 hour (aftershocks would be separate)
        break;
      case "volcanic_eruption":
        duration = 24 + Math.floor(Math.random() * 120); // 1-6 days
        break;
      default:
        duration = 6; // Default 6 hours
    }
    
    return {
      type: eventType,
      intensity: intensity || 3, // Default to medium intensity
      duration: duration,
    };
  }

  /**
   * Generate a natural language summary of the current weather
   * @returns {string} - Weather summary
   */
  generateWeatherSummary() {
    const current = this.getCurrentWeather();
    if (!current) return "No weather data available.";
    
    const tempDesc = this.getTemperatureDescription(current.temperature);
    const windDesc = this.getWindDescription(current.windSpeed, current.windDirection);
    const conditionDesc = current.condition;
    
    let summary = `${tempDesc} with ${conditionDesc.toLowerCase()}. ${windDesc}.`;
    
    // Add special events if present
    if (current.hasShootingStar) {
      summary += " The night sky is graced with shooting stars.";
    }
    
    if (current.hasMeteorImpact) {
      summary += " A meteor was seen impacting in the distance!";
    }
    
    return summary;
  }
  
  /**
   * Get temperature description 
   * @param {number} temperature - Temperature in °F
   * @returns {string} - Temperature description
   */
  getTemperatureDescription(temperature) {
    if (temperature < 0) return "Bitterly cold";
    if (temperature < 20) return "Frigid";
    if (temperature < 32) return "Freezing";
    if (temperature < 45) return "Cold";
    if (temperature < 55) return "Chilly";
    if (temperature < 65) return "Cool";
    if (temperature < 75) return "Mild";
    if (temperature < 85) return "Warm";
    if (temperature < 95) return "Hot";
    return "Scorching hot";
  }
  
  /**
   * Get wind description
   * @param {number} speed - Wind speed in mph
   * @param {string} direction - Wind direction
   * @returns {string} - Wind description
   */
  getWindDescription(speed, direction) {
    let speedDesc;
    
    if (speed < 5) speedDesc = "Calm conditions";
    else if (speed < 10) speedDesc = "Light breeze";
    else if (speed < 15) speedDesc = "Gentle breeze";
    else if (speed < 25) speedDesc = "Moderate wind";
    else if (speed < 35) speedDesc = "Strong wind";
    else if (speed < 45) speedDesc = "Very strong wind";
    else speedDesc = "Gale force winds";
    
    return speed < 5 ? speedDesc : `${speedDesc} from the ${direction}`;
  }
}