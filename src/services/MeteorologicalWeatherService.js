// src/services/MeteorologicalWeatherService.js
import WeatherServiceBase from './WeatherServiceBase.js';
import TemperatureService from './meteorological/TemperatureService.js';
import AtmosphericService from './meteorological/AtmosphericService.js';
import WindService from './meteorological/WindService.js';
import WeatherSystemService from './meteorological/WeatherSystemService.js';
import WeatherConditionService from './meteorological/WeatherConditionService.js';
import RegionProfileService from './meteorological/RegionProfileService.js';
import PrecipitationService from './meteorological/PrecipitationService.js';
import ExtremeWeatherService from './meteorological/ExtremeWeatherService.js';
import sunriseSunsetService from './SunriseSunsetService.js';
import WeatherUtils from '../utils/weatherUtils.js';

/**
 * Meteorological Weather Service
 * This service extends the base weather service but produces more realistic hour-by-hour
 * weather instead of using dice tables.
 * ENHANCED VERSION with solar-angle based seasons and proper polar region support.
 */
export default class MeteorologicalWeatherService extends WeatherServiceBase {
  constructor() {
    super();
    console.log("METEO SERVICE CREATED - SOLAR SEASON ENHANCED VERSION 5.0");

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
   * Initialize weather for a region - ENHANCED WITH SOLAR SEASONS
   * @param {string} biome - The biome type
   * @param {string} season - The season, or 'auto' to determine from date
   * @param {Date} currentDate - The current date
   * @returns {object} - The current weather
   */
  initializeWeather(biome, season, currentDate = new Date()) {
    console.log(`MeteorologicalWeatherService initializing weather: ${biome}, ${season}`);
    
    // Clear any existing forecast
    this.forecast = [];

    // Get the region profile based on biome
    const profile = this.regionProfileService.getRegionProfile(biome);
    this.currentProfile = profile;

    // SOLAR-BASED SEASON DETERMINATION
    let actualSeason = season;
    if (season === "auto") {
      // Use the new solar-angle based season calculation
      actualSeason = this.getSeasonFromDate(currentDate, profile);
      console.log(`[Solar Season] Auto-determined season: ${actualSeason} for lat ${profile.latitude}°`);
    }

    // Get enhanced seasonal baseline with solar blending
    const seasonalBaseline = this.getEnhancedSeasonalBaseline(profile, actualSeason, currentDate);
    
    console.log(`[Solar Season] Using baseline for ${seasonalBaseline._solarData?.primarySeason || actualSeason}` +
                (seasonalBaseline._solarData?.isTransitioning ? 
                 ` (transitioning to ${seasonalBaseline._solarData.secondarySeason}, blend: ${(seasonalBaseline._solarData.blendFactor * 100).toFixed(1)}%)` : 
                 ''));

    // Store these for later use (needed for initialization)
    this.currentProfile = profile;
    this.currentSeason = actualSeason;
    this.currentBiome = biome;
    this.currentDate = new Date(currentDate);

    // Initialize starting weather conditions from seasonal baseline
    this.temperature = seasonalBaseline.temperature.mean + 
                      (Math.random() - 0.5) * seasonalBaseline.temperature.variance;
    this.humidity = Math.max(10, Math.min(95, 
                    seasonalBaseline.humidity.mean + 
                    (Math.random() - 0.5) * seasonalBaseline.humidity.variance));
    this.pressure = seasonalBaseline.pressure.mean + 
                   (Math.random() - 0.5) * seasonalBaseline.pressure.variance;
    this.cloudCover = Math.max(0, Math.min(100, 
                      seasonalBaseline.cloudCover?.mean || 50 + 
                      (Math.random() - 0.5) * (seasonalBaseline.cloudCover?.variance || 40)));

    console.log(`Starting conditions: T=${Math.round(this.temperature)}°F, ` +
                `H=${Math.round(this.humidity)}%, P=${Math.round(this.pressure)}hPa, ` +
                `Cloud=${Math.round(this.cloudCover)}%`);

    // Initialize wind conditions
    this.currentWind = this.windService.generateWind(profile, actualSeason);

    // Generate 24-hour forecast starting from current time
    return this.generate24HourForecast(currentDate, profile, actualSeason);
  }

  /**
   * Generate 24-hour forecast using solar seasons
   * @param {Date} startDate - Starting date/time
   * @param {object} profile - Region profile
   * @param {string} season - Current season
   * @returns {Array} - 24-hour forecast array
   */
  generate24HourForecast(startDate, profile, season) {
    console.log("GENERATING 24-HOUR FORECAST WITH SOLAR SEASONS");
    
    // Clear existing forecast
    this.forecast = [];

    // Generate weather for each hour
    for (let hour = 0; hour < 24; hour++) {
      const currentHour = (startDate.getHours() + hour) % 24;
      
      // Create date object for this specific hour
      const hourDate = new Date(startDate);
      hourDate.setHours(startDate.getHours() + hour);
      
      // Check if we've crossed into a new day and need to recalculate season
      if (hour > 0 && currentHour === 0) {
        // We've moved to the next day - check if season changed
        const newSeason = this.getSeasonFromDate(hourDate, profile);
        if (newSeason !== season) {
          console.log(`[Solar Season] Season changed from ${season} to ${newSeason} at day boundary`);
          season = newSeason;
        }
      }

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
   * Generate weather for a specific hour - ENHANCED WITH SOLAR SEASONS
   * @param {number} hour - Hour of the day (0-23)
   * @param {Date} date - Date object for this hour
   * @param {object} profile - Region profile
   * @param {string} season - Current season (may change during forecast)
   * @returns {object} - Weather data for this hour
   */
  generateHourlyWeather(hour, date, profile, season) {
    console.log(`SOLAR-ENHANCED WEATHER GENERATION for hour ${hour}, season: ${season}`);
    
    // Get enhanced seasonal baseline with potential blending
    const seasonalBaseline = this.getEnhancedSeasonalBaseline(profile, season, date);

    // Get active weather systems
    const weatherSystems = this.weatherSystemService.getWeatherSystems();

    // Calculate pressure trend from recent history
    const pressureTrend = this.atmosphericService.calculatePressureTrend(this.pressure);

    // Update weather parameters based on time, weather systems, and profile
    // KEY CHANGE - USING THE PHYSICS-BASED TEMPERATURE CALCULATION WITH SOLAR ENHANCEMENTS
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

    // Update humidity with solar season considerations
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

    // Update cloud cover with solar season considerations
    const hourCloudCover = this.atmosphericService.calculateCloudCover(
      profile,
      seasonalBaseline,
      date, // Pass full date object
      hour,
      this.cloudCover,
      hourHumidity,
      hourPressure,
      weatherSystems
    );

    // Validate and constrain values
    const validatedTemp = Math.max(-80, Math.min(130, hourTemp));
    const validatedHumidity = Math.max(0, Math.min(100, hourHumidity));
    const validatedPressure = Math.max(900, Math.min(1080, hourPressure));
    const validatedCloudCover = Math.max(0, Math.min(100, hourCloudCover));

    // Calculate feels-like temperature
    const feelsLikeTemp = this.temperatureService.calculateFeelsLikeTemperature(
      validatedTemp,
      validatedHumidity,
      this.currentWind.speed
    );

    // Update wind (with some persistence)
    this.currentWind = this.windService.updateWind(
      this.currentWind,
      profile,
      season,
      weatherSystems
    );

    // Calculate precipitation and weather condition
    const precipitationPotential = this.precipitationService.calculatePrecipitationPotential(
      validatedHumidity,
      validatedCloudCover,
      hourPressure,
      validatedTemp,
      this.currentWind.speed
    );

    const precipAmount = this.precipitationService.calculatePrecipitationAmount(
      precipitationPotential,
      validatedTemp,
      seasonalBaseline
    );

    // Store precipitation for future calculations
    this.precipitationService.addPrecipitation(precipAmount);

    // Calculate atmospheric instability
    const instability = this.atmosphericService.calculateInstability(
      validatedTemp,
      validatedHumidity,
      hourPressure,
      this.currentWind.speed
    );

    // Determine weather condition
    const condition = this.weatherConditionService.determineCondition(
      validatedTemp,
      validatedHumidity,
      validatedCloudCover,
      precipitationPotential,
      this.currentWind.speed,
      instability,
      validatedTemp < 32 ? "snow" : "rain"
    );

    // Check for celestial events (shooting stars, meteor impacts, aurora)
    const celestialEvents = this.weatherConditionService.generateCelestialEvents(
      profile.latitudeBand // Pass latitude band for aurora calculations
    );

    // Generate weather description and effects
    const effects = this.weatherConditionService.getWeatherEffects(condition);

    // Update internal state for next hour
    this.temperature = validatedTemp;
    this.humidity = validatedHumidity;
    this.pressure = validatedPressure;
    this.cloudCover = validatedCloudCover;

    // Log solar season information for debugging
    if (seasonalBaseline._solarData?.isTransitioning) {
      console.log(`SOLAR TRANSITION: ${seasonalBaseline._solarData.primarySeason} -> ${seasonalBaseline._solarData.secondarySeason} ` +
                  `(${(seasonalBaseline._solarData.blendFactor * 100).toFixed(1)}% blend)`);
    }

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
      hasAurora: celestialEvents.aurora, // Aurora for polar regions
      
      // Meteorological details stored in a sub-object
      _meteoData: {
        humidity: validatedHumidity,
        pressure: validatedPressure,
        cloudCover: validatedCloudCover,
        instability,
        precipitationPotential,
        precipAmount,
        pressureTrend,
        weatherSystems: [...weatherSystems], // Clone the array to avoid reference issues
        
        // ENHANCED: Store solar season context
        profile: JSON.parse(JSON.stringify(profile)), // Deep clone
        season,
        seasonalBaseline: JSON.parse(JSON.stringify(seasonalBaseline)), // Include solar blend data
        biome: this.currentBiome || "temperate-deciduous",
        latitudeBand: profile.latitudeBand,
        
        // NEW: Solar season metadata
        solarSeasonData: seasonalBaseline._solarData || null
      }
    };

    return hourlyWeather;
  }

  /**
   * Advance time by a number of hours - ENHANCED WITH SOLAR SEASONS
   * @param {number} hours - Number of hours to advance
   * @param {Date} currentDate - Current date/time
   * @returns {Array} - Updated forecast
   */
  advanceTime(hours, currentDate) {
    console.log(`ADVANCING TIME by ${hours} hours with solar season support`);
    
    if (!this.currentProfile) {
      console.error("No current profile - cannot advance time");
      return [];
    }

    // Calculate new date
    const newDate = new Date(currentDate);
    newDate.setHours(newDate.getHours() + hours);

    // Check if the season has changed due to solar angle changes
    const newSeason = this.getSeasonFromDate(newDate, this.currentProfile);
    if (newSeason !== this.currentSeason) {
      console.log(`[Solar Season] Season changed from ${this.currentSeason} to ${newSeason} during time advance`);
      this.currentSeason = newSeason;
    }

    // Remove the hours we're advancing from the beginning of the forecast
    this.forecast.splice(0, hours);

    // Generate new hours at the end to maintain 24-hour forecast
    const startHour = this.forecast.length > 0 ? 
      (this.forecast[this.forecast.length - 1].hour + 1) % 24 : 
      newDate.getHours();

    for (let i = 0; i < hours; i++) {
      const futureHour = (startHour + i) % 24;
      const futureDate = new Date(newDate);
      futureDate.setHours(newDate.getHours() + this.forecast.length + i);
      
      // Check for season changes during the extended forecast
      const hourSeason = this.getSeasonFromDate(futureDate, this.currentProfile);
      
      const hourlyWeather = this.generateHourlyWeather(
        futureHour,
        futureDate,
        this.currentProfile,
        hourSeason
      );
      
      this.forecast.push(hourlyWeather);
    }

    // Keep only 24 hours of forecast
    this.forecast = this.forecast.slice(0, 24);

    return this.get24HourForecast();
  }

  /**
   * Calculate the day of year (0-365) - moved here from utils for consistency
   * @param {Date} date - Date to calculate for
   * @returns {number} - Day of year
   */
  getDayOfYear(date) {
    // Check for valid date
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.error("Invalid date in getDayOfYear:", date);
      return 0;
    }
    
    return WeatherUtils.getDayOfYear(date);
  }

  /**
   * Get detailed season information for current state
   * @param {Date} date - Date to check
   * @returns {object} - Detailed season information
   */
  getCurrentSeasonInfo(date = new Date()) {
    if (!this.currentProfile) {
      return { error: "No profile available" };
    }
    
    const seasonInfo = this.getSeasonInfo(date, this.currentProfile);
    const transitionInfo = this.checkSeasonTransition(date, this.currentProfile);
    
    return {
      ...seasonInfo,
      ...transitionInfo,
      profile: {
        biome: this.currentBiome,
        latitude: this.currentProfile.latitude,
        latitudeBand: this.currentProfile.latitudeBand
      }
    };
  }
}