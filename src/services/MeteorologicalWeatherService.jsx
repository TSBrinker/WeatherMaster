// src/services/MeteorologicalWeatherService.js
// Advanced weather generation using physical meteorological modeling

import WeatherServiceBase from "./WeatherServiceBase";
import {
  weatherEffects,
  windIntensityEffects,
  shootingStarEffects,
} from "../data-tables/weather-effects";

/**
 * Weather service that generates realistic weather patterns using meteorological principles.
 * This service extends the base weather service but produces more realistic hour-by-hour
 * weather instead of using dice tables.
 */
export default class MeteorologicalWeatherService extends WeatherServiceBase {
  constructor() {
    super();

    // Core meteorological state - these are the key physical parameters
    this.temperature = null; // Base temperature in °F
    this.humidity = null; // Relative humidity (0-100%)
    this.pressure = 1013.25; // Atmospheric pressure (hPa), default sea level pressure
    this.cloudCover = null; // Cloud coverage (0-100%)

    // Tracking pressure trends for weather changes
    this.pressureHistory = []; // Store last 24 hours of pressure readings
    this.pressureTrend = 0; // Current trend (hPa/hour), negative = falling

    // Precipitation tracking
    this.precipHistory = []; // Recent precipitation amounts by hour
    this.precipType = null; // Rain, snow, etc.
    this.precipIntensity = 0; // 0-100 scale

    // Track weather systems (like pressure systems and fronts)
    this.weatherSystems = []; // Active weather systems
    this.forecast = []; // Hourly forecast (compatible with dice table format)

    // Weather condition temperature constraints (for validity checks)
    this.conditionTemperatureConstraints = {
      Snow: { max: 32 }, // Snow can only form below freezing
      Blizzard: { max: 30 }, // Blizzards are typically colder
      "Freezing Cold": { max: 32 }, // Freezing is defined by temperature
      "Scorching Heat": { min: 90 }, // Scorching heat should be hot
      "Cold Snap": { max: 40 }, // Cold snaps are... cold
    };

    // Weather Parameters - initialized with default values
    this.weatherParams = {
      cycleVariability: 0.4, // How much the weather varies from predictable cycles (0-1)
      stormFrequency: 0.3, // Relative frequency of storms (0-1)
      stormIntensity: 0.5, // Typical intensity of storms (0-1)
      seasonalExtremes: 0.5, // How extreme seasonal variations are (0-1)
      humidityBaseline: 0.5, // Baseline humidity level (0-1)
      pressureVariability: 0.5, // How much pressure systems vary (0-1)
      windiness: 0.5, // General windiness of the region (0-1)
    };
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
    const profile = this.getRegionProfile(biome);

    // Initialize base meteorological parameters
    this.initializeBaseParameters(profile, season, currentDate);

    // Initialize weather systems
    this.initializeWeatherSystems(profile, season, currentDate);

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
    const seasonalBaseline = this.getSeasonalBaseline(profile, season);

    // Initialize core state with realistic starting values
    this.temperature = this.calculateBaseTemperature(
      profile,
      seasonalBaseline,
      date,
      hour
    );
    this.humidity = this.calculateBaseHumidity(
      profile,
      seasonalBaseline,
      date,
      hour
    );
    this.pressure = this.calculateBasePressure(profile, date);
    this.cloudCover = this.calculateBaseCloudCover(
      profile,
      seasonalBaseline,
      date,
      hour
    );

    // Initialize pressure history
    this.pressureHistory = Array(24).fill(this.pressure);

    // Initialize precipitation history (empty at start)
    this.precipHistory = Array(24).fill(0);

    // Set weather parameters based on profile
    this.setWeatherParametersFromProfile(profile);

    console.log(`Initialized meteorological parameters for ${profile.name}`);
    console.log(
      `Base temperature: ${this.temperature}°F, Humidity: ${this.humidity}%, Pressure: ${this.pressure} hPa`
    );
  }

  /**
   * Set weather parameters based on the region profile
   * @param {object} profile - The region profile
   */
  setWeatherParametersFromProfile(profile) {
    // Customize parameters based on region characteristics
    this.weatherParams = {
      // Higher latitudes have more variable weather
      cycleVariability: 0.3 + (Math.abs(profile.latitude) / 90) * 0.4,

      // Storm frequency is affected by maritime influence and latitude
      stormFrequency:
        profile.maritimeInfluence * 0.4 +
        (profile.latitude > 30 && profile.latitude < 60 ? 0.3 : 0.1),

      // Storm intensity varies by latitude and terrain
      stormIntensity:
        0.3 +
        profile.terrainRoughness * 0.3 +
        (profile.latitude > 10 && profile.latitude < 30 ? 0.3 : 0.1),

      // Seasonal extremes are stronger at higher latitudes and inland areas
      seasonalExtremes:
        0.2 +
        (Math.abs(profile.latitude) / 90) * 0.6 +
        (1 - profile.maritimeInfluence) * 0.3,

      // Humidity baseline from temperature profile and maritime influence
      humidityBaseline: profile.humidityProfile.annual.mean / 100,

      // Pressure variability based on latitude (mid-latitudes have more storms)
      pressureVariability:
        0.3 + (profile.latitude > 30 && profile.latitude < 60 ? 0.4 : 0.2),

      // Windiness from terrain roughness and latitude
      windiness:
        0.3 +
        profile.terrainRoughness * 0.3 +
        (profile.latitude > 40 ? 0.3 : 0.1),
    };
  }

  /**
   * Get region profile from biome type - maps biomes to detailed region parameters
   * @param {string} biome - The biome type
   * @returns {object} - Detailed region profile
   */
  getRegionProfile(biome) {
    // Get baseline values based on the biome
    const latitude = this.getBiomeLatitude(biome);
    const elevation = this.getBiomeElevation(biome);
    const maritimeInfluence = this.getBiomeMaritimeInfluence(biome);
    const temperatureProfile = this.getBiomeTemperatureProfile(biome);
    const humidityProfile = this.getBiomeHumidityProfile(biome);
    const terrainRoughness = this.getBiomeTerrainRoughness(biome);

    // Optional special factors (region-specific)
    const specialFactors = this.getBiomeSpecialFactors(biome);

    // Return complete profile
    return {
      name: biome,
      latitude,
      elevation,
      maritimeInfluence,
      temperatureProfile,
      humidityProfile,
      terrainRoughness,
      specialFactors,
    };
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
    if (season === "winter") pressureOffset = 5;
    else if (season === "summer") pressureOffset = -5;

    // Return seasonal baseline values
    return {
      temperature: tempProfile,
      humidity: humidityProfile,
      pressureOffset,
    };
  }

  /**
   * Initialize weather systems based on region and date
   * @param {object} profile - The region profile
   * @param {string} season - The current season
   * @param {Date} date - The current date
   */
  initializeWeatherSystems(profile, season, date) {
    // Clear existing systems
    this.weatherSystems = [];

    // Random number of starting systems (0-2)
    const numSystems = Math.floor(Math.random() * 3);

    // Create initial systems
    for (let i = 0; i < numSystems; i++) {
      // Random high or low pressure system
      const isHighPressure = Math.random() > 0.5;

      // More intense systems in winter and fall, less in summer
      let intensityMod = 0;
      if (season === "winter") intensityMod = 0.2;
      else if (season === "summer") intensityMod = -0.1;
      else if (season === "fall") intensityMod = 0.1;

      // Intensity also affected by profile's pressure variability
      const baseIntensity = 0.4 + Math.random() * 0.4;
      const intensity = Math.min(
        1,
        Math.max(0.2, baseIntensity + intensityMod)
      );

      // Create the system
      this.weatherSystems.push({
        type: isHighPressure ? "high-pressure" : "low-pressure",
        intensity,
        age: Math.floor(Math.random() * 48), // 0-48 hours old
        position: Math.random(), // 0-1 relative position across region
        movementSpeed: Math.random() * 0.1 + 0.05, // Movement per hour
        movementDirection: Math.random() > 0.5 ? 1 : -1, // Moving in or out
        maxAge: 72 + Math.floor(Math.random() * 48), // When system dissipates
      });
    }

    // Also check if any fronts should form from the initial systems
    this.checkForFrontGeneration();

    // Log the initial systems
    console.log(`Initialized ${this.weatherSystems.length} weather systems`);
    this.weatherSystems.forEach((system) => {
      console.log(
        `- ${system.type} system, intensity: ${system.intensity.toFixed(2)}`
      );
    });
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
    const profile = this.getRegionProfile(biome);

    // Generate initial 24+ hours individually (not in chunks like dice tables)
    for (let i = 0; i < 24; i++) {
      // Calculate hour of day
      const startHour = currentDate.getHours();
      const currentHour = (startHour + i) % 24;

      // Calculate date for this hour
      const hourDate = new Date(currentDate);
      hourDate.setHours(hourDate.getHours() + i);

      // Before generating each hour, update weather systems
      this.updateWeatherSystems(1); // Update for 1 hour

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
    const seasonalBaseline = this.getSeasonalBaseline(profile, season);

    // Calculate physical parameters for this hour
    const hourTemp = this.calculateTemperature(
      profile,
      seasonalBaseline,
      date,
      hour
    );
    const hourHumidity = this.calculateHumidity(
      profile,
      seasonalBaseline,
      date,
      hour
    );
    const hourPressure = this.calculatePressure(profile, date, hour);
    const hourCloudCover = this.calculateCloudCover(
      profile,
      seasonalBaseline,
      date,
      hour
    );

    // Calculate precipitation potential based on physical factors
    const precipitationPotential = this.calculatePrecipitationPotential(
      hourHumidity,
      hourTemp,
      hourPressure,
      hourCloudCover
    );

    // Update our base values for the next hour
    this.temperature = hourTemp;
    this.humidity = hourHumidity;
    this.pressure = hourPressure;
    this.cloudCover = hourCloudCover;

    // Update pressure history
    this.pressureHistory.push(hourPressure);
    if (this.pressureHistory.length > 24) {
      this.pressureHistory.shift();
    }

    // Calculate the pressure trend (hPa/hour)
    this.calculatePressureTrend();

    // Update wind based on pressure and other factors
    this.updateWindFactors(hour, hourTemp, hourPressure, this.pressureTrend);

    // Determine weather condition from physical factors
    const condition = this.determineWeatherCondition(
      hourTemp,
      hourHumidity,
      hourPressure,
      hourCloudCover,
      precipitationPotential
    );

    // Update precipitation history if it's precipitating
    const isPrecipitating = [
      "Rain",
      "Heavy Rain",
      "Thunderstorm",
      "Snow",
      "Blizzard",
    ].includes(condition);
    const precipAmount = isPrecipitating
      ? this.calculatePrecipitationAmount(condition, precipitationPotential)
      : 0;

    this.precipHistory.push(precipAmount);
    if (this.precipHistory.length > 24) {
      this.precipHistory.shift();
    }

    // Calculate weather effects text
    const effects = this.getWeatherEffects(condition);

    // Generate celestial events
    const celestialEvents = this.generateCelestialEvents();

    // Get wind intensity information
    const windIntensity = this.getWindIntensity(this.currentWindSpeed);

    // Create the weather entry in the same format as dice table service for compatibility
    return {
      condition,
      temperature: Math.round(hourTemp), // Round temperature to whole degrees
      hour: hour,
      date: date,
      windDirection: this.currentWindDirection,
      windSpeed: Math.round(this.currentWindSpeed),
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
    const profile = this.getRegionProfile(biome);

    // Calculate new date for continued forecast
    const newStartDate = new Date(currentDate.getTime() + hours * 3600000);

    // Update weather systems for elapsed time
    this.updateWeatherSystems(hours);

    // Generate additional hours to maintain 24+ hour forecast
    for (let i = 0; i < hours; i++) {
      // Calculate hour and date for this new forecast entry
      const hourToAdd = 24 + i; // Add to end of existing forecast
      const currentHour = (newStartDate.getHours() + hourToAdd) % 24;

      const hourDate = new Date(newStartDate);
      hourDate.setHours(hourDate.getHours() + hourToAdd);

      // Update systems for each hour
      this.updateWeatherSystems(1);

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

  /* ==== METEOROLOGICAL CALCULATIONS ==== */

  /**
   * Calculate base temperature at initialization
   * @param {object} profile - Region profile
   * @param {object} seasonalBaseline - Seasonal baseline data
   * @param {Date} date - Current date
   * @param {number} hour - Current hour (0-23)
   * @returns {number} - Temperature in °F
   */
  calculateBaseTemperature(profile, seasonalBaseline, date, hour) {
    // Get the seasonal mean temperature
    const { mean, variance } = seasonalBaseline.temperature;

    // Add diurnal variation (time of day effect)
    const hourAngle = 2 * Math.PI * ((hour - 14) / 24); // Peak at 2PM
    const diurnalVariation = variance * 0.5 * Math.sin(hourAngle);

    // Add some randomness
    const randomFactor = (Math.random() * 2 - 1) * variance * 0.2;

    // Calculate baseline temperature
    return mean + diurnalVariation + randomFactor;
  }

  /**
   * Calculate temperature based on all physical factors
   * @param {object} profile - Region profile
   * @param {object} seasonalBaseline - Seasonal baseline data
   * @param {Date} date - Current date
   * @param {number} hour - Current hour (0-23)
   * @returns {number} - Temperature in °F
   */
  calculateTemperature(profile, seasonalBaseline, date, hour) {
    // Get the day of year for seasonal calculations
    const dayOfYear = this.getDayOfYear(date);

    // Calculate the seasonal factor - varies throughout the year (-1 to 1)
    // Northern hemisphere: negative in winter, positive in summer
    const seasonalFactor = Math.sin(2 * Math.PI * ((dayOfYear - 172) / 365));

    // Adjust for southern hemisphere if needed
    const adjustedSeasonalFactor =
      profile.latitude < 0 ? -seasonalFactor : seasonalFactor;

    // Latitude effect - stronger seasonal variations at higher latitudes
    const latitudeEffect = Math.abs(profile.latitude) / 90;
    const seasonalVariation =
      seasonalBaseline.temperature.variance *
      adjustedSeasonalFactor *
      latitudeEffect;

    // Diurnal (daily) cycle - peak at ~2-3pm, minimum at ~4-5am
    const hourAngle = 2 * Math.PI * ((hour - 14) / 24);
    const diurnalVariation =
      seasonalBaseline.temperature.variance * 0.5 * Math.sin(hourAngle);

    // Elevation effect - approximately -3.5°F per 1000ft
    const elevationEffect = -0.0035 * profile.elevation;

    // Maritime influence - reduces temperature extremes
    const maritimeEffect =
      profile.maritimeInfluence * 5 * (1 - Math.abs(adjustedSeasonalFactor));

    // Weather system effects on temperature
    const systemEffect = this.calculateSystemTemperatureEffect();

    // Cloud cover effect - clouds reduce daytime heating and nighttime cooling
    const cloudEffect = this.calculateCloudTemperatureEffect(
      hour,
      this.cloudCover
    );

    // Get the baseline temperature from the seasonal mean
    const baseTemp = seasonalBaseline.temperature.mean;

    // Random variation - weather isn't perfectly predictable
    const randomVariation = (Math.random() * 2 - 1) * 2;

    // Calculate final temperature
    let temp =
      baseTemp +
      seasonalVariation +
      diurnalVariation +
      elevationEffect +
      maritimeEffect +
      systemEffect +
      cloudEffect +
      randomVariation;

    // Inertia - temperature changes gradually, not instantly
    // If we have a previous temperature, blend with it
    if (this.temperature !== null) {
      // Blend with 70% of new calculation, 30% of previous temperature
      temp = temp * 0.7 + this.temperature * 0.3;
    }

    // Return the temperature, ensuring it's a reasonable value
    return Math.max(-60, Math.min(130, temp));
  }

  /**
   * Calculate how cloud cover affects temperature
   * @param {number} hour - Hour of the day (0-23)
   * @param {number} cloudCover - Cloud cover percentage (0-100)
   * @returns {number} - Temperature effect in °F
   */
  calculateCloudTemperatureEffect(hour, cloudCover) {
    // Cloud cover has different effects day vs night
    const isDay = hour >= 6 && hour < 18;

    if (isDay) {
      // During day, clouds block solar heating
      // Reduce temperature up to 10 degrees based on cloud cover
      return -10 * (cloudCover / 100);
    } else {
      // At night, clouds trap heat
      // Increase temperature up to 5 degrees based on cloud cover
      return 5 * (cloudCover / 100);
    }
  }

  /**
   * Calculate system temperature effect
   * @returns {number} - Temperature effect in °F
   */
  calculateSystemTemperatureEffect() {
    let effect = 0;

    // Check all active weather systems
    for (const system of this.weatherSystems) {
      // How close is this system to the center of our region?
      const distanceFromCenter = Math.abs(system.position - 0.5) * 2; // 0-1 (0 = center, 1 = edge)
      const centralEffect = 1 - distanceFromCenter; // Stronger in center

      if (system.type === "cold-front") {
        // Cold fronts cause temperature drop
        if (system.age < 12) {
          // Front approaching
          effect -= system.intensity * centralEffect * 5; // Small drop ahead of front
        } else {
          // Front passing
          effect -= system.intensity * centralEffect * 15; // Larger drop after front
        }
      } else if (system.type === "warm-front") {
        // Warm fronts cause temperature rise
        effect += system.intensity * centralEffect * 10; // Up to +10°F
      }
    }

    // Recent precipitation has cooling effect through evaporation
    const recentPrecip = this.getRecentPrecipitation();
    effect -= recentPrecip * 5; // Cooling effect from evaporation

    return effect;
  }

  /**
   * Calculate base humidity at initialization
   * @param {object} profile - Region profile
   * @param {object} seasonalBaseline - Seasonal baseline data
   * @param {Date} date - Current date
   * @param {number} hour - Current hour (0-23)
   * @returns {number} - Humidity percentage (0-100)
   */
  calculateBaseHumidity(profile, seasonalBaseline, date, hour) {
    // Get the seasonal mean humidity
    const { mean, variance } = seasonalBaseline.humidity;

    // Diurnal cycle - humidity typically higher at night, lower during day
    const hourAngle = 2 * Math.PI * ((hour - 2) / 24); // Peak around 2AM
    const diurnalVariation = variance * 0.3 * Math.sin(hourAngle);

    // Add some randomness
    const randomFactor = (Math.random() * 2 - 1) * variance * 0.2;

    // Calculate baseline humidity
    const humidity = mean + diurnalVariation + randomFactor;

    // Ensure value is within valid range
    return Math.max(0, Math.min(100, humidity));
  }

  /**
   * Calculate humidity based on all factors
   * @param {object} profile - Region profile
   * @param {object} seasonalBaseline - Seasonal baseline data
   * @param {Date} date - Current date
   * @param {number} hour - Current hour (0-23)
   * @returns {number} - Humidity percentage (0-100)
   */
  calculateHumidity(profile, seasonalBaseline, date, hour) {
    // Get the day of year for seasonal calculations
    const dayOfYear = this.getDayOfYear(date);

    // Seasonal factor - some regions have wet/dry seasons
    const seasonalOffset = Math.sin(
      2 * Math.PI * ((dayOfYear - profile.humidityProfile.peakDay) / 365)
    );
    const seasonalVariation =
      seasonalBaseline.humidity.variance * 0.3 * seasonalOffset;

    // Diurnal cycle - humidity typically higher at night, lower during day
    const hourAngle = 2 * Math.PI * ((hour - 2) / 24); // Peak around 2AM
    const diurnalVariation =
      seasonalBaseline.humidity.variance * 0.3 * Math.sin(hourAngle);

    // Temperature effect - higher temperatures generally lower relative humidity
    // This is a simplified model - in reality, it depends on absolute humidity
    const tempEffect =
      (this.temperature - seasonalBaseline.temperature.mean) * -0.5;

    // Maritime influence increases humidity
    const maritimeEffect = profile.maritimeInfluence * 10;

    // Weather system effects
    let systemEffect = 0;

    // Each system contributes to humidity based on type and intensity
    for (const system of this.weatherSystems) {
      // How close is this system to the center of our region?
      const distanceFromCenter = Math.abs(system.position - 0.5) * 2; // 0-1
      const centralEffect = 1 - distanceFromCenter; // Stronger in center

      if (system.type === "low-pressure") {
        // Low pressure systems increase humidity
        systemEffect += system.intensity * centralEffect * 20;
      } else if (system.type === "high-pressure") {
        // High pressure systems decrease humidity
        systemEffect -= system.intensity * centralEffect * 15;
      } else if (system.type === "warm-front") {
        // Warm fronts bring moisture
        systemEffect += system.intensity * centralEffect * 25;
      } else if (system.type === "cold-front") {
        // Cold fronts initially increase humidity, then decrease it
        if (system.age < 8) {
          systemEffect += system.intensity * centralEffect * 15;
        } else {
          systemEffect -= system.intensity * centralEffect * 10;
        }
      }
    }

    // Recent precipitation increases humidity
    const recentPrecip = this.getRecentPrecipitation();
    const precipEffect = recentPrecip * 15;

    // Random variation
    const randomVariation = (Math.random() * 2 - 1) * 3;

    // Get base humidity from seasonal mean
    const baseHumidity = seasonalBaseline.humidity.mean;

    // Calculate final humidity
    let humidity =
      baseHumidity +
      seasonalVariation +
      diurnalVariation +
      tempEffect +
      maritimeEffect +
      systemEffect +
      precipEffect +
      randomVariation;

    // Humidity has inertia - it changes gradually
    if (this.humidity !== null) {
      // Blend with 80% of new calculation, 20% of previous humidity
      humidity = humidity * 0.8 + this.humidity * 0.2;
    }

    // Ensure value is within valid range
    return Math.max(0, Math.min(100, humidity));
  }

  /**
   * Calculate base pressure at initialization
   * @param {object} profile - Region profile
   * @param {Date} date - Current date
   * @returns {number} - Pressure in hPa
   */
  calculateBasePressure(profile, date) {
    // Standard sea level pressure is 1013.25 hPa
    const standardPressure = 1013.25;

    // Pressure decreases with elevation (approx -0.12 hPa per meter)
    const elevationFactor = -0.12 * (profile.elevation / 3.281); // Convert feet to meters

    // Seasonal variations - slightly higher in winter, lower in summer
    const month = date.getMonth();
    let seasonalOffset = 0;

    // Northern hemisphere seasons
    if (profile.latitude >= 0) {
      if (month >= 11 || month <= 1) seasonalOffset = 5; // Winter
      else if (month >= 5 && month <= 7) seasonalOffset = -5; // Summer
    }
    // Southern hemisphere (opposite seasons)
    else {
      if (month >= 11 || month <= 1) seasonalOffset = -5; // Summer
      else if (month >= 5 && month <= 7) seasonalOffset = 5; // Winter
    }

    // Random initial variation (+/- 10 hPa)
    const randomVariation = Math.random() * 20 - 10;

    // Calculate base pressure
    return (
      standardPressure + elevationFactor + seasonalOffset + randomVariation
    );
  }

  /**
   * Calculate pressure for a specific hour
   * @param {object} profile - Region profile
   * @param {Date} date - Current date
   * @param {number} hour - Current hour (0-23)
   * @returns {number} - Pressure in hPa
   */
  calculatePressure(profile, date, hour) {
    // Diurnal cycle - small pressure variations through the day
    // Typically has two peaks and two troughs each day
    const hourAngle = 4 * Math.PI * (hour / 24);
    const diurnalVariation = 0.5 * Math.sin(hourAngle);

    // Weather system effects
    let systemEffect = 0;

    // Calculate effect from each weather system
    for (const system of this.weatherSystems) {
      // How close is this system to the center of our region?
      const distanceFromCenter = Math.abs(system.position - 0.5) * 2; // 0-1
      const centralEffect = 1 - distanceFromCenter; // Stronger in center

      if (system.type === "high-pressure") {
        // High pressure systems increase pressure
        systemEffect += system.intensity * centralEffect * 15;
      } else if (system.type === "low-pressure") {
        // Low pressure systems decrease pressure
        systemEffect -= system.intensity * centralEffect * 15;
      } else if (system.type === "cold-front") {
        // Cold fronts cause pressure to drop, then rise
        if (system.age < 6) {
          systemEffect -= system.intensity * centralEffect * 10;
        } else {
          systemEffect += system.intensity * centralEffect * 8;
        }
      } else if (system.type === "warm-front") {
        // Warm fronts cause gradual pressure drop
        systemEffect -= system.intensity * centralEffect * 8;
      }
    }

    // Random small variations
    const randomVariation = Math.random() * 2 - 1;

    // Calculate new pressure
    let newPressure =
      this.pressure + diurnalVariation + systemEffect + randomVariation;

    // Limit extreme values
    return Math.max(970, Math.min(1050, newPressure));
  }

  /**
   * Calculate the pressure trend from recent history
   */
  calculatePressureTrend() {
    // Need at least a few hours of history
    if (this.pressureHistory.length < 3) {
      this.pressureTrend = 0;
      return;
    }

    // Calculate average change over last 3 hours
    const current = this.pressureHistory[this.pressureHistory.length - 1];
    const threeHoursAgo =
      this.pressureHistory[this.pressureHistory.length - 4] ||
      this.pressureHistory[0];

    this.pressureTrend = (current - threeHoursAgo) / 3;
  }

  /**
   * Get the current pressure trend
   * @returns {number} - Pressure change in hPa/hour
   */
  getPressureTrend() {
    return this.pressureTrend;
  }

  /**
   * Calculate base cloud cover at initialization
   * @param {object} profile - Region profile
   * @param {object} seasonalBaseline - Seasonal baseline data
   * @param {Date} date - Current date
   * @param {number} hour - Current hour (0-23)
   * @returns {number} - Cloud cover percentage (0-100)
   */
  calculateBaseCloudCover(profile, seasonalBaseline, date, hour) {
    // Base cloud cover related to humidity
    const baseCloudiness = seasonalBaseline.humidity.mean * 0.8;

    // Random variation
    const randomVariation = Math.random() * 30 - 15;

    // Calculate initial cloud cover
    const cloudCover = baseCloudiness + randomVariation;

    // Ensure value is within valid range
    return Math.max(0, Math.min(100, cloudCover));
  }

  /**
   * Calculate cloud cover based on all factors
   * @param {object} profile - Region profile
   * @param {object} seasonalBaseline - Seasonal baseline data
   * @param {Date} date - Current date
   * @param {number} hour - Current hour (0-23)
   * @returns {number} - Cloud cover percentage (0-100)
   */
  calculateCloudCover(profile, seasonalBaseline, date, hour) {
    // Clouds are strongly related to humidity
    const humidityFactor = this.humidity * 0.6;

    // Pressure effect - falling pressure increases cloud formation
    const pressureTrendEffect = this.getPressureTrend() * -20; // -1 hPa/hr = +20% cloud potential

    // Weather system effects
    let systemEffect = 0;

    // Calculate effect from each weather system
    for (const system of this.weatherSystems) {
      // How close is this system to the center of our region?
      const distanceFromCenter = Math.abs(system.position - 0.5) * 2; // 0-1
      const centralEffect = 1 - distanceFromCenter; // Stronger in center

      if (system.type === "high-pressure") {
        // High pressure systems decrease cloud cover
        systemEffect -= system.intensity * centralEffect * 40;
      } else if (system.type === "low-pressure") {
        // Low pressure systems increase cloud cover
        systemEffect += system.intensity * centralEffect * 40;
      } else if (system.type === "cold-front") {
        // Cold fronts bring clouds initially, then clear
        if (system.age < 10) {
          systemEffect += system.intensity * centralEffect * 50;
        } else {
          systemEffect -= system.intensity * centralEffect * 30;
        }
      } else if (system.type === "warm-front") {
        // Warm fronts bring persistent cloud cover
        systemEffect += system.intensity * centralEffect * 60;
      }
    }

    // Diurnal effects - slight tendency for more clouds in afternoon due to convection
    const hourFactor = Math.sin(2 * Math.PI * ((hour - 14) / 24)); // Peak at 2PM
    const diurnalEffect = hourFactor * 5;

    // Random variation
    const randomVariation = Math.random() * 10 - 5;

    // Calculate cloud cover
    let cloudCover =
      30 +
      humidityFactor +
      pressureTrendEffect +
      systemEffect +
      diurnalEffect +
      randomVariation;

    // Cloud cover has inertia - it changes gradually
    if (this.cloudCover !== null) {
      // Blend with 70% of new calculation, 30% of previous cloud cover
      cloudCover = cloudCover * 0.7 + this.cloudCover * 0.3;
    }

    // Ensure value is within valid range
    return Math.max(0, Math.min(100, cloudCover));
  }

  /**
   * Get the amount of recent precipitation
   * @returns {number} - Recent precipitation amount (0-1 scale)
   */
  getRecentPrecipitation() {
    // Need at least some history
    if (this.precipHistory.length === 0) {
      return 0;
    }

    // Look at recent hours, with more weight to more recent precipitation
    let totalPrecip = 0;
    let totalWeight = 0;

    // Look at up to 6 most recent hours
    const hoursToCheck = Math.min(6, this.precipHistory.length);

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
   * Calculate precipitation potential based on meteorological factors
   * @param {number} humidity - Relative humidity (0-100)
   * @param {number} temp - Temperature in °F
   * @param {number} pressure - Atmospheric pressure in hPa
   * @param {number} cloudCover - Cloud cover percentage (0-100)
   * @returns {number} - Precipitation potential (0-100)
   */
  calculatePrecipitationPotential(humidity, temp, pressure, cloudCover) {
    // Basic factors that influence precipitation
    const humiditySaturation = humidity / 100;
    const pressureTrend = this.getPressureTrend();
    const instability = this.calculateAtmosphericInstability(temp, pressure);

    // Base potential from humidity and cloud cover
    // Both high humidity and cloud cover are needed for precipitation
    const base = Math.pow(humiditySaturation * (cloudCover / 100), 0.8) * 70;

    // Falling pressure increases precipitation chance
    const pressureEffect = pressureTrend < 0 ? Math.abs(pressureTrend) * 20 : 0;

    // Atmospheric instability increases precipitation chance
    const instabilityEffect = instability * 8;

    // Weather system effects
    let systemEffect = 0;

    // Calculate effect from each weather system
    for (const system of this.weatherSystems) {
      // How close is this system to the center of our region?
      const distanceFromCenter = Math.abs(system.position - 0.5) * 2; // 0-1
      const centralEffect = 1 - distanceFromCenter; // Stronger in center

      if (system.type === "low-pressure") {
        // Low pressure systems increase precipitation
        systemEffect += system.intensity * centralEffect * 20;
      } else if (system.type === "cold-front") {
        // Cold fronts cause heavy precipitation as they pass
        if (system.age < 12) {
          systemEffect += system.intensity * centralEffect * 30;
        }
      } else if (system.type === "warm-front") {
        // Warm fronts cause steady precipitation
        systemEffect += system.intensity * centralEffect * 25;
      }
    }

    // Recent precipitation slightly increases chance of continued precipitation
    const recentPrecip = this.getRecentPrecipitation();
    const precipEffect = recentPrecip * 10;

    // Randomize slightly to avoid predictability
    const randomEffect = Math.random() * 10 - 5;

    // Calculate final potential
    let potential =
      base +
      pressureEffect +
      instabilityEffect +
      systemEffect +
      precipEffect +
      randomEffect;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, potential));
  }

  /**
   * Calculate atmospheric instability - key for thunderstorm formation
   * @param {number} temp - Temperature in °F
   * @param {number} pressure - Atmospheric pressure in hPa
   * @returns {number} - Instability value (0-10 scale)
   */
  calculateAtmosphericInstability(temp, pressure) {
    // This is a simplified model that considers:
    // - Temperature (warmer air = more instability)
    // - Pressure (lower pressure = more instability)
    // - Pressure trend (falling pressure = more instability)

    let instability = 0;

    // Temperature contribution - warmer air is more unstable
    if (temp > 70) {
      instability += (temp - 70) * 0.1; // Up to 3-4 points for very hot temps
    }

    // Low pressure increases instability
    if (pressure < 1013) {
      instability += (1013 - pressure) * 0.05; // Up to 2 points for low pressure
    }

    // Pressure trend contribution - falling pressure increases instability
    const pressureTrend = this.getPressureTrend();
    if (pressureTrend < 0) {
      instability += Math.abs(pressureTrend) * 5; // Up to 5 points for rapidly falling pressure
    }

    // Recent precipitation stabilizes the atmosphere
    const recentPrecip = this.getRecentPrecipitation();
    instability -= recentPrecip * 2; // Recent rain reduces instability

    // Add random component
    instability += Math.random() * 2 - 1;

    // Clamp to 0-10 scale
    return Math.max(0, Math.min(10, instability));
  }

  /**
   * Calculate precipitation amount from condition and potential
   * @param {string} condition - Weather condition
   * @param {number} potential - Precipitation potential (0-100)
   * @returns {number} - Precipitation amount (0-1 scale)
   */
  calculatePrecipitationAmount(condition, potential) {
    switch (condition) {
      case "Heavy Rain":
      case "Thunderstorm":
      case "Blizzard":
        return (potential / 100) * (0.7 + Math.random() * 0.3); // 0.7-1.0 scaling
      case "Rain":
      case "Snow":
        return (potential / 100) * (0.3 + Math.random() * 0.4); // 0.3-0.7 scaling
      default:
        return 0;
    }
  }

  /**
   * Update wind factors based on meteorological conditions
   * @param {number} hour - Hour of the day (0-23)
   * @param {number} temp - Temperature in °F
   * @param {number} pressure - Atmospheric pressure in hPa
   * @param {number} pressureTrend - Pressure trend in hPa/hour
   */
  updateWindFactors(hour, temp, pressure, pressureTrend) {
    // Calculate pressure gradient effect on wind speed
    // Stronger pressure gradient = stronger winds
    const pressureGradientEffect = Math.abs(pressureTrend) * 20;

    // Diurnal effect - winds often stronger in afternoon, calmer at night
    const hourFactor = Math.sin(2 * Math.PI * ((hour - 14) / 24)); // Peak at 2PM
    const diurnalEffect = hourFactor * 5;

    // Weather system effects
    let systemEffect = 0;
    let systemDirectionChange = false;
    let newDirection = this.currentWindDirection;

    // Check all weather systems
    for (const system of this.weatherSystems) {
      // How close is this system to the center of our region?
      const distanceFromCenter = Math.abs(system.position - 0.5) * 2; // 0-1
      const centralEffect = 1 - distanceFromCenter; // Stronger in center

      if (system.type === "high-pressure" || system.type === "low-pressure") {
        // Both pressure systems affect wind speed
        systemEffect += system.intensity * centralEffect * 15;

        // High pressure systems: winds blow clockwise and outward
        // Low pressure systems: winds blow counterclockwise and inward
        // This is a simplified model of wind direction around pressure systems
        if (centralEffect > 0.5) {
          systemDirectionChange = true;

          // Wind direction depends on system position relative to center
          const directionIndex = this.windDirections.indexOf(
            this.currentWindDirection
          );
          if (directionIndex !== -1) {
            // Direction change depends on system type and relative position
            const isHighPressure = system.type === "high-pressure";
            const isRightSide = system.position > 0.5;

            // Calculate wind shift
            let shift = 0;
            if (isHighPressure && isRightSide) shift = 1;
            else if (isHighPressure && !isRightSide) shift = -1;
            else if (!isHighPressure && isRightSide) shift = -1;
            else shift = 1;

            // Apply the shift
            const newIndex =
              (directionIndex + shift + this.windDirections.length) %
              this.windDirections.length;
            newDirection = this.windDirections[newIndex];
          }
        }
      } else if (system.type === "cold-front" || system.type === "warm-front") {
        // Fronts temporarily increase wind speed as they pass
        if (system.age < 12) {
          systemEffect += system.intensity * centralEffect * 25;

          // Fronts also affect wind direction
          if (centralEffect > 0.6) {
            systemDirectionChange = true;

            // Front's movement direction influences wind direction
            const directionIndex = this.windDirections.indexOf(
              this.currentWindDirection
            );
            if (directionIndex !== -1) {
              const movementFactor = system.movementDirection;
              const newIndex =
                (directionIndex + movementFactor + this.windDirections.length) %
                this.windDirections.length;
              newDirection = this.windDirections[newIndex];
            }
          }
        }
      }
    }

    // Temperature differences drive wind - more important in still conditions
    const tempDifferential = Math.abs(temp - this.temperature) * 2;

    // Random variation
    const randomEffect = Math.random() * 5 - 2.5;

    // Calculate target wind speed
    const targetSpeed =
      5 +
      pressureGradientEffect +
      diurnalEffect +
      systemEffect +
      tempDifferential +
      randomEffect;

    // Wind speed changes gradually
    this.currentWindSpeed = this.getNextWindSpeed(
      this.currentWindSpeed,
      targetSpeed
    );

    // Check for wind direction change
    if (systemDirectionChange) {
      // System-driven change
      this.currentWindDirection = newDirection;
    } else if (Math.random() < 0.3) {
      // Random direction change (30% chance per hour)
      this.currentWindDirection = this.getNextWindDirection(
        this.currentWindDirection
      );
    }

    // Ensure wind speed is reasonable
    this.currentWindSpeed = Math.max(0, Math.min(100, this.currentWindSpeed));
  }

  /**
   * Update weather systems over time
   * @param {number} hours - Hours to advance
   */
  updateWeatherSystems(hours) {
    // Process each hour individually for more realistic evolution
    for (let hour = 0; hour < hours; hour++) {
      // Age existing systems
      this.weatherSystems = this.weatherSystems.filter((system) => {
        // Increment age
        system.age += 1;

        // Update position based on movement
        system.position += system.movementSpeed * system.movementDirection;

        // Systems weaken as they get older
        if (system.age > system.maxAge / 2) {
          const ageFactor =
            1 - (system.age - system.maxAge / 2) / (system.maxAge / 2);
          system.intensity = Math.max(0.1, system.intensity * ageFactor);
        }

        // Remove systems that are too old or moved out of the region
        return (
          system.age < system.maxAge &&
          system.position >= -0.2 &&
          system.position <= 1.2
        );
      });

      // Chance for new systems to form
      const newSystemChance = 0.05; // 5% chance per hour
      if (Math.random() < newSystemChance) {
        // Determine type of system
        const isHighPressure = Math.random() > 0.5;

        // Add new pressure system
        this.weatherSystems.push({
          type: isHighPressure ? "high-pressure" : "low-pressure",
          intensity: Math.random() * 0.6 + 0.3, // 0.3-0.9 intensity
          age: 0,
          position: Math.random() > 0.5 ? -0.1 : 1.1, // Enter from either side
          movementSpeed: Math.random() * 0.1 + 0.05, // Movement per hour
          movementDirection: Math.random() > 0.5 ? 1 : -1, // Moving in or out
          maxAge: 72 + Math.floor(Math.random() * 48), // When system dissipates
        });
      }

      // Check for front generation
      this.checkForFrontGeneration();
    }
  }

  /**
   * Check if weather fronts should be generated
   */
  checkForFrontGeneration() {
    // Fronts form between high and low pressure systems
    for (let i = 0; i < this.weatherSystems.length; i++) {
      for (let j = i + 1; j < this.weatherSystems.length; j++) {
        const system1 = this.weatherSystems[i];
        const system2 = this.weatherSystems[j];

        // Check if one is high and one is low pressure
        if (
          (system1.type === "high-pressure" &&
            system2.type === "low-pressure") ||
          (system1.type === "low-pressure" && system2.type === "high-pressure")
        ) {
          // Check if they're close enough
          const distance = Math.abs(system1.position - system2.position);
          if (distance < 0.3) {
            // Don't create front if one already exists between these systems
            const frontExists = this.weatherSystems.some(
              (sys) =>
                sys.type.endsWith("-front") &&
                sys.parentSystems &&
                ((sys.parentSystems[0] === i && sys.parentSystems[1] === j) ||
                  (sys.parentSystems[0] === j && sys.parentSystems[1] === i))
            );

            if (!frontExists) {
              // Create a front
              const frontPosition = (system1.position + system2.position) / 2;
              const highPressure =
                system1.type === "high-pressure" ? system1 : system2;
              const lowPressure =
                system1.type === "low-pressure" ? system1 : system2;
              const highPressureIndex =
                system1.type === "high-pressure" ? i : j;
              const lowPressureIndex = system1.type === "low-pressure" ? i : j;

              // Determine if it's a cold or warm front
              const isColdFront = highPressure.position > lowPressure.position;

              this.weatherSystems.push({
                type: isColdFront ? "cold-front" : "warm-front",
                intensity: (highPressure.intensity + lowPressure.intensity) / 2,
                age: 0,
                position: frontPosition,
                movementSpeed: 0.08, // Fronts move faster
                movementDirection: isColdFront ? -1 : 1, // Cold fronts move toward warm air
                maxAge: 48 + Math.floor(Math.random() * 24),
                parentSystems: [highPressureIndex, lowPressureIndex], // Reference to parent systems
              });
            }
          }
        }
      }
    }
  }

  /**
   * Determine weather condition from meteorological factors
   * @param {number} temp - Temperature in °F
   * @param {number} humidity - Relative humidity (0-100)
   * @param {number} pressure - Atmospheric pressure in hPa
   * @param {number} cloudCover - Cloud cover percentage (0-100)
   * @param {number} precipPotential - Precipitation potential (0-100)
   * @returns {string} - Weather condition
   */
  determineWeatherCondition(
    temp,
    humidity,
    pressure,
    cloudCover,
    precipPotential
  ) {
    // Determine basic condition from cloud cover and precipitation
    let condition;

    if (precipPotential > 75) {
      // High precipitation potential means precipitation
      if (temp <= 32) {
        if (this.currentWindSpeed > 20) {
          condition = "Blizzard";
        } else {
          condition = "Snow";
        }
      } else if (precipPotential > 90) {
        condition = "Heavy Rain";
      } else {
        condition = "Rain";
      }
    } else if (cloudCover > 80) {
      condition = "Heavy Clouds";
    } else if (cloudCover > 30) {
      condition = "Light Clouds";
    } else {
      condition = "Clear Skies";
    }

    // Check for thunderstorm conditions - requires warmth, humidity and instability
    const instability = this.calculateAtmosphericInstability(temp, pressure);
    if (precipPotential > 65 && temp > 60 && instability > 7) {
      condition = "Thunderstorm";
    }

    // Check for extreme temperature conditions
    if (temp > 95 && cloudCover < 40) {
      condition = "Scorching Heat";
    } else if (temp < 20) {
      condition = "Freezing Cold";
    }

    // Special conditions check for high winds
    if (this.currentWindSpeed > 30 && temp < 40) {
      condition = "Cold Winds";
    } else if (temp > 80 && humidity > 85 && cloudCover < 40) {
      condition = "High Humidity Haze";
    }

    // Validate temperature constraints for the condition
    return this.validateConditionForTemperature(condition, temp);
  }

  /**
   * Validate that condition makes sense for the temperature
   * @param {string} condition - Weather condition
   * @param {number} temperature - Temperature in °F
   * @returns {string} - Valid weather condition
   */
  validateConditionForTemperature(condition, temperature) {
    const constraints = this.conditionTemperatureConstraints[condition];

    if (!constraints) {
      return condition; // No constraints for this condition
    }

    const { min, max } = constraints;

    // Check if temperature violates constraints
    if (
      (min !== undefined && temperature < min) ||
      (max !== undefined && temperature > max)
    ) {
      console.log(
        `Condition ${condition} invalid at ${temperature}°F, adjusting...`
      );

      // Choose an alternative condition appropriate for the temperature
      if (condition === "Snow" || condition === "Blizzard") {
        return temperature > max ? "Rain" : condition;
      } else if (condition === "Freezing Cold") {
        return temperature > max ? "Heavy Clouds" : condition;
      } else if (condition === "Scorching Heat") {
        return temperature < min ? "Clear Skies" : condition;
      } else if (condition === "Cold Snap") {
        return temperature > max ? "Cold Winds" : condition;
      }
    }

    return condition; // No violations, keep original condition
  }

  /* ==== BIOME PROFILE MAPPING ==== */

  /**
   * Map biome to typical latitude
   * @param {string} biome - Biome type
   * @returns {number} - Typical latitude
   */
  getBiomeLatitude(biome) {
    const latitudeMap = {
      "tropical-rainforest": 5, // Near equator
      "tropical-seasonal": 15, // Tropical
      desert: 25, // Desert regions
      "temperate-grassland": 40, // Temperate prairie regions
      "temperate-deciduous": 45, // Temperate forest
      "temperate-rainforest": 45, // Pacific Northwest type
      "boreal-forest": 55, // Taiga
      tundra: 70, // Arctic regions
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
      desert: 2000, // Many deserts are higher elevation
      "temperate-grassland": 1500, // Often on plains/prairies
      "temperate-deciduous": 800, // Lower to mid elevation
      "temperate-rainforest": 500, // Often coastal/lower
      "boreal-forest": 1200, // Variable
      tundra: 1500, // Often higher plateaus
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
      desert: 0.1, // Low maritime influence
      "temperate-grassland": 0.2, // Continental climate
      "temperate-deciduous": 0.5, // Moderate influence
      "temperate-rainforest": 0.9, // Strong maritime influence
      "boreal-forest": 0.3, // Moderate to low
      tundra: 0.5, // Variable
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
      desert: 0.7, // Sandy dunes and rocky outcrops
      "temperate-grassland": 0.3, // Relatively flat
      "temperate-deciduous": 0.5, // Rolling hills
      "temperate-rainforest": 0.7, // Often mountainous coastal areas
      "boreal-forest": 0.6, // Variable terrain
      tundra: 0.4, // Often flat with some hills
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
      },
      "tropical-seasonal": {
        hasMonsoonSeason: true,
        hasDrySeason: true,
      },
      desert: {
        hasDrySeason: true,
        highDiurnalVariation: true,
      },
      "temperate-rainforest": {
        hasFog: true,
        highRainfall: true,
      },
      tundra: {
        hasPermafrost: true,
        polarDay: true,
        polarNight: true,
      },
    };

    return specialFactorsMap[biome] || {}; // Default empty factors
  }

  /**
   * Get seasonal temperature profile for a biome
   * @param {string} biome - Biome type
   * @returns {object} - Temperature profiles by season
   */
  getBiomeTemperatureProfile(biome) {
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
      desert: {
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
      tundra: {
        annual: { mean: 20, variance: 40 },
        winter: { mean: -10, variance: 15 },
        spring: { mean: 20, variance: 15 },
        summer: { mean: 50, variance: 15 },
        fall: { mean: 25, variance: 15 },
      },
    };

    return (
      profileMap[biome] || {
        annual: { mean: 55, variance: 30 },
        winter: { mean: 35, variance: 15 },
        spring: { mean: 55, variance: 15 },
        summer: { mean: 75, variance: 15 },
        fall: { mean: 55, variance: 15 },
      }
    );
  }

  /**
   * Get humidity profile for a biome
   * @param {string} biome - Biome type
   * @returns {object} - Humidity profiles by season
   */
  getBiomeHumidityProfile(biome) {
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
      desert: {
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
      tundra: {
        annual: { mean: 75, variance: 15, peakDay: 172 }, // Summer peak
        winter: { mean: 80, variance: 10 },
        spring: { mean: 75, variance: 10 },
        summer: { mean: 70, variance: 15 },
        fall: { mean: 75, variance: 10 },
      },
    };

    return (
      profileMap[biome] || {
        annual: { mean: 65, variance: 15, peakDay: 172 },
        winter: { mean: 65, variance: 15 },
        spring: { mean: 60, variance: 20 },
        summer: { mean: 50, variance: 25 },
        fall: { mean: 70, variance: 15 },
      }
    );
  }

  /**
   * Get weather effects description for a condition
   * @param {string} condition - Weather condition
   * @returns {string} - Description of weather effects
   */
  getWeatherEffects(condition) {
    // Get effects text from data table
    return weatherEffects[condition] || "No special effects for this weather.";
  }

  /* ==== EXTREME WEATHER EVENTS ==== */

  /**
   * Check for extreme weather events
   * @param {object} profile - Region profile
   * @param {Date} date - Current date
   * @returns {object} - Extreme weather event details if one occurs
   */
  checkExtremeWeatherEvents(profile, date) {
    const events = {
      type: null,
      intensity: 0,
      duration: 0,
    };

    // Check weather-dependent extreme events
    if (this.checkForTornado(profile, date)) {
      events.type = "tornado";
      events.intensity = this.calculateTornadoIntensity();
      events.duration = 1 + Math.floor(Math.random() * 3); // 1-3 hours
    } else if (this.checkForHurricane(profile, date)) {
      events.type = "hurricane";
      events.intensity = this.calculateHurricaneIntensity();
      events.duration = 24 + Math.floor(Math.random() * 48); // 24-72 hours
    } else if (this.checkForFlood(profile, date)) {
      events.type = "flood";
      events.intensity = this.calculateFloodIntensity();
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
   * @returns {boolean} - True if tornado conditions present
   */
  checkForTornado(profile, date) {
    // Tornados require:
    // 1. Warm, humid air
    // 2. Wind shear (changing winds at different heights)
    // 3. Atmospheric instability
    // 4. Often occurs with cold fronts or in spring/summer

    // Simplified model:
    const hasTornadoRisk = profile.latitude > 25 && profile.latitude < 50; // Tornado alley
    const season = this.getSeasonFromDate(date);
    const isActiveMonth = season === "spring" || season === "summer";

    // Need warm temp, high humidity, and unstable conditions
    const temp = this.temperature;
    const humidity = this.humidity;
    const instability = this.calculateAtmosphericInstability(
      temp,
      this.pressure
    );

    // Check for cold front (which can trigger tornadoes)
    const hasColdFront = this.weatherSystems.some(
      (system) =>
        system.type === "cold-front" &&
        system.age < 12 &&
        system.position > 0.3 &&
        system.position < 0.7
    );

    // Basic conditions must be met
    const basicConditions =
      hasTornadoRisk &&
      isActiveMonth &&
      temp > 70 &&
      humidity > 60 &&
      instability > 7;

    // Need either very high instability or a cold front
    if (basicConditions && (instability > 9 || hasColdFront)) {
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
   * @returns {boolean} - True if hurricane conditions present
   */
  checkForHurricane(profile, date) {
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
      (profile.latitude < 23 && month >= 5 && month <= 10) || // Northern hemisphere
      (profile.latitude > 23 && month >= 11 && month <= 4); // Southern hemisphere

    // Must have been very hot and humid for several days
    const highTemps = this.forecast.filter(
      (hour) => hour._meteoData?.humidity > 80 && hour.temperature > 82
    ).length;
    const hasHighTempHistory = highTemps > 48; // At least 2 days of high temps

    // Basic conditions
    const basicConditions =
      hasHurricaneRisk && isHurricaneSeason && hasHighTempHistory;

    if (basicConditions) {
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
   * @returns {boolean} - True if flooding conditions present
   */
  checkForFlood(profile, date) {
    // Check for prolonged heavy precipitation
    const precipHistory = this.precipHistory;
    let consecutiveRain = 0;

    // Count consecutive hours of significant precipitation
    for (let i = precipHistory.length - 1; i >= 0; i--) {
      if (precipHistory[i] > 0.5) {
        consecutiveRain++;
      } else {
        break; // End of consecutive rain
      }
    }

    // Need significant consecutive rain to cause flooding
    if (consecutiveRain > 10) {
      // Basic flooding chance increases with duration
      const baseChance = consecutiveRain * 0.001; // 1% per 10 hours

      // Modify based on terrain - flat terrain floods more easily
      const terrainModifier = 1 - profile.terrainRoughness;

      // Calculate final chance
      return Math.random() < baseChance * terrainModifier;
    }

    return false;
  }

  /**
   * Calculate flood intensity (1-5 scale)
   * @returns {number} - Flood intensity
   */
  calculateFloodIntensity() {
    // Calculate flood intensity from precipitation history
    const recentPrecip = this.precipHistory
      .slice(-24)
      .reduce((sum, val) => sum + val, 0);
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
}
