/**
 * Weather Generator
 * Core service that generates complete weather data for a region and time
 */

import { generateSeed, SeededRandom } from '../../utils/seedGenerator';
import { TemperatureService } from './TemperatureService';
import { WeatherPatternService } from './WeatherPatternService';
import { AtmosphericService } from './AtmosphericService';

/**
 * Wind directions
 */
const WIND_DIRECTIONS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                         'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

/**
 * Weather conditions based on temperature and precipitation
 */
const CONDITIONS = {
  CLEAR: 'Clear',
  PARTLY_CLOUDY: 'Partly Cloudy',
  CLOUDY: 'Cloudy',
  OVERCAST: 'Overcast',
  LIGHT_RAIN: 'Light Rain',
  RAIN: 'Rain',
  HEAVY_RAIN: 'Heavy Rain',
  LIGHT_SNOW: 'Light Snow',
  SNOW: 'Snow',
  HEAVY_SNOW: 'Heavy Snow',
  SLEET: 'Sleet',
  FREEZING_RAIN: 'Freezing Rain',
  FOG: 'Fog',
  MIST: 'Mist'
};

/**
 * Weather Generator Service
 */
export class WeatherGenerator {
  constructor() {
    this.tempService = new TemperatureService();
    this.patternService = new WeatherPatternService();
    this.atmosphericService = new AtmosphericService();
    this.weatherCache = new Map();
  }

  /**
   * Generate complete weather for a region at a specific date/time
   * @param {Object} region - Region with climate parameters
   * @param {Object} date - Game date {year, month, day, hour}
   * @returns {Object} Complete weather data
   */
  generateWeather(region, date) {
    const cacheKey = `${region.id}:${date.year}:${date.month}:${date.day}:${Math.floor(date.hour)}`;

    if (this.weatherCache.has(cacheKey)) {
      return this.weatherCache.get(cacheKey);
    }

    // Get current weather pattern
    const pattern = this.patternService.getCurrentPattern(region, date);

    // Get atmospheric pressure
    const pressure = this.atmosphericService.getPressure(region, date, pattern);

    // Generate temperature with smooth pattern transitions
    const baseTemp = this.tempService.getTemperature(region, date);
    const patternTempMod = this.patternService.getTemperatureModifier(pattern, region, date);
    const temperature = Math.round(baseTemp + patternTempMod);

    // Generate wind
    const wind = this.generateWind(region, date, pattern);

    // Generate base humidity
    const baseHumidity = this.generateHumidity(region, date, pattern);

    // Enhance humidity with atmospheric effects
    const humidity = this.atmosphericService.getEnhancedHumidity(
      region, date, pattern, pressure, baseHumidity
    );

    // Determine precipitation
    const precipitation = this.generatePrecipitation(region, date, pattern, temperature);

    // Get cloud cover
    const cloudCover = this.atmosphericService.getCloudCover(region, date, pattern, precipitation);

    // Calculate feels-like temperature (with atmospheric contribution)
    const baseFeelsLike = this.tempService.getFeelsLike(temperature, wind.speed, humidity);
    const atmosphericContribution = this.atmosphericService.getAtmosphericFeelsLikeContribution(
      temperature, humidity, pressure
    );
    const feelsLike = Math.round(baseFeelsLike + atmosphericContribution);

    // Determine sky condition and final weather condition
    const condition = this.determineCondition(region, pattern, precipitation, temperature, humidity, date);

    // Get visibility
    const visibility = this.atmosphericService.getVisibility(cloudCover, precipitation, humidity);

    // Generate any weather effects
    const effects = this.generateEffects(condition, wind, temperature, precipitation);

    const weather = {
      temperature,
      feelsLike,
      condition,
      windSpeed: wind.speed,
      windDirection: wind.direction,
      humidity,
      precipitation: precipitation.isOccurring,
      precipitationType: precipitation.type,
      precipitationIntensity: precipitation.intensity,
      pattern: pattern.name,
      effects,
      // New atmospheric data
      pressure: pressure.pressure,
      pressureTrend: pressure.trend,
      cloudCover: cloudCover.percentage,
      cloudCoverType: cloudCover.type,
      visibility: visibility.distance,
      visibilityDescription: visibility.description,
      _debug: {
        pattern: pattern.type,
        dayOfPattern: pattern.dayOfPattern,
        baseTemp,
        patternTempMod,
        temperatureBreakdown: this.tempService.getTemperatureDebug(region, date),
        atmospheric: {
          pressure: pressure._debug,
          baseHumidity,
          enhancedHumidity: humidity,
          cloudCover: cloudCover._debug,
          atmosphericFeelsLikeContribution: atmosphericContribution
        }
      }
    };

    this.weatherCache.set(cacheKey, weather);
    return weather;
  }

  /**
   * Generate wind data
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @param {Object} pattern - Current weather pattern
   * @returns {Object} Wind data {speed, direction}
   */
  generateWind(region, date, pattern) {
    const params = region.climate || region.parameters || {};
    const seed = generateSeed(region.id, date, 'wind');
    const rng = new SeededRandom(seed);

    // Base wind speed from terrain and maritime influence
    const terrainFactor = params.terrainRoughness || 0.5;
    const maritimeFactor = params.maritimeInfluence || 0.5;

    // Base wind is 5-15 mph, modified by terrain and maritime influence
    let baseWind = rng.range(5, 15);
    baseWind *= (1 + maritimeFactor * 0.5); // Coastal areas windier
    baseWind *= (1 + terrainFactor * 0.3);  // Rough terrain creates turbulence

    // Apply pattern modifier
    const patternMod = this.patternService.getWindModifier(pattern);
    const windSpeed = Math.round(baseWind * patternMod);

    // Wind direction (prefer prevailing winds for the region)
    const directionIndex = rng.int(0, WIND_DIRECTIONS.length - 1);
    const direction = WIND_DIRECTIONS[directionIndex];

    return { speed: windSpeed, direction };
  }

  /**
   * Generate humidity
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @param {Object} pattern - Current weather pattern
   * @returns {number} Humidity percentage
   */
  generateHumidity(region, date, pattern) {
    const params = region.climate || region.parameters || {};
    const humidityProfile = params.humidityProfile;

    if (!humidityProfile) {
      return 50; // Default fallback
    }

    const season = this.getSeason(date.month);
    const seasonalHumidity = humidityProfile[season];

    if (!seasonalHumidity) {
      return humidityProfile.annual?.mean || 50;
    }

    const seed = generateSeed(region.id, date, 'humidity');
    const rng = new SeededRandom(seed);

    // Vary humidity within seasonal variance
    const variance = seasonalHumidity.variance || 10;
    const humidity = seasonalHumidity.mean + rng.range(-variance, variance);

    // Precipitation increases humidity
    const patternPrecipChance = pattern.characteristics.precipitation;
    const humidityBoost = patternPrecipChance * 10;

    return Math.max(0, Math.min(100, Math.round(humidity + humidityBoost)));
  }

  /**
   * Generate precipitation data with smooth transitions
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @param {Object} pattern - Current weather pattern
   * @param {number} temperature - Current temperature
   * @returns {Object} Precipitation data
   */
  generatePrecipitation(region, date, pattern, temperature) {
    const seed = generateSeed(region.id, date, 'precipitation');
    const isOccurring = this.patternService.shouldPrecipitate(pattern, region, date, seed);

    if (!isOccurring) {
      return {
        isOccurring: false,
        type: null,
        intensity: null
      };
    }

    // Get previous hour's temperature to detect rapid changes
    const previousHourDate = { ...date, hour: date.hour - 1 >= 0 ? date.hour - 1 : 23 };
    const previousTemp = this.tempService.getTemperature(region, previousHourDate);
    const previousPatternMod = this.patternService.getTemperatureModifier(
      this.patternService.getCurrentPattern(region, previousHourDate),
      region,
      previousHourDate
    );
    const prevTemperature = Math.round(previousTemp + previousPatternMod);

    // Determine type based on temperature with smooth transitions
    let type;
    if (temperature <= 28) {
      type = 'snow'; // Below 28°F = snow
    } else if (temperature <= 32) {
      // 28-32°F = mixed precipitation or freezing rain
      // Use weather pattern to determine which
      const rng = new SeededRandom(seed + 999);
      if (rng.next() < 0.5) {
        type = 'freezing-rain'; // Rain freezes on contact with cold surface
      } else {
        type = 'sleet'; // Mixed frozen/liquid
      }
    } else if (temperature <= 38) {
      // 32-38°F = transition zone
      // If temperature was warmer before and is dropping, favor sleet
      // If temperature was colder before and is rising, favor sleet
      // This creates smoother rain↔snow transitions
      if (prevTemperature > 38) {
        type = 'sleet'; // Transitioning from rain
      } else if (prevTemperature <= 32) {
        type = 'sleet'; // Transitioning from snow
      } else {
        type = 'sleet'; // In the transition zone
      }
    } else {
      type = 'rain'; // Above 38°F = rain
    }

    // Determine intensity
    const rng = new SeededRandom(seed + 1);
    const intensityRoll = rng.next();

    let intensity;
    if (intensityRoll < 0.4) {
      intensity = 'light';
    } else if (intensityRoll < 0.85) {
      intensity = 'moderate';
    } else {
      intensity = 'heavy';
    }

    return {
      isOccurring: true,
      type,
      intensity
    };
  }

  /**
   * Determine final weather condition string
   * @param {Object} region - Region data
   * @param {Object} pattern - Weather pattern
   * @param {Object} precipitation - Precipitation data
   * @param {number} temperature - Temperature
   * @param {number} humidity - Humidity
   * @param {Object} date - Game date
   * @returns {string} Weather condition
   */
  determineCondition(region, pattern, precipitation, temperature, humidity, date) {
    // Precipitation conditions take precedence
    if (precipitation.isOccurring) {
      const { type, intensity } = precipitation;

      if (type === 'rain') {
        if (intensity === 'light') return CONDITIONS.LIGHT_RAIN;
        if (intensity === 'heavy') return CONDITIONS.HEAVY_RAIN;
        return CONDITIONS.RAIN;
      }

      if (type === 'snow') {
        if (intensity === 'light') return CONDITIONS.LIGHT_SNOW;
        if (intensity === 'heavy') return CONDITIONS.HEAVY_SNOW;
        return CONDITIONS.SNOW;
      }

      if (type === 'sleet') return CONDITIONS.SLEET;
      if (type === 'freezing-rain') return CONDITIONS.FREEZING_RAIN;
    }

    // Fog/mist conditions (high humidity, calm conditions)
    if (humidity > 90 && date.hour >= 5 && date.hour <= 9) {
      return CONDITIONS.FOG;
    }

    if (humidity > 85) {
      return CONDITIONS.MIST;
    }

    // Sky conditions based on pattern
    const seed = generateSeed(region.id, date, 'sky');
    const skyCondition = this.patternService.getSkyCondition(pattern, seed);

    if (skyCondition === 'clear') return CONDITIONS.CLEAR;
    if (skyCondition === 'partly-cloudy') return CONDITIONS.PARTLY_CLOUDY;
    if (skyCondition === 'cloudy') return CONDITIONS.CLOUDY;
    return CONDITIONS.OVERCAST;
  }

  /**
   * Generate weather effects that impact gameplay
   * @param {string} condition - Weather condition
   * @param {Object} wind - Wind data
   * @param {number} temperature - Temperature
   * @param {Object} precipitation - Precipitation data
   * @returns {Array} Array of effect strings
   */
  generateEffects(condition, wind, temperature, precipitation) {
    const effects = [];

    // Temperature effects
    if (temperature <= 0) {
      effects.push('Extreme Cold: Risk of frostbite');
    } else if (temperature <= 20) {
      effects.push('Severe Cold: Increased cold exposure risk');
    }

    if (temperature >= 100) {
      effects.push('Extreme Heat: Risk of heat stroke');
    } else if (temperature >= 90) {
      effects.push('Severe Heat: Increased heat exhaustion risk');
    }

    // Wind effects
    if (wind.speed >= 40) {
      effects.push('High Winds: Difficult travel, projectiles affected');
    } else if (wind.speed >= 25) {
      effects.push('Strong Winds: Ranged attacks disadvantaged');
    }

    // Precipitation effects
    if (precipitation.isOccurring) {
      if (precipitation.type === 'snow' && precipitation.intensity === 'heavy') {
        effects.push('Heavy Snow: Visibility reduced, travel slowed');
      }
      if (precipitation.type === 'rain' && precipitation.intensity === 'heavy') {
        effects.push('Heavy Rain: Visibility reduced, surfaces slippery');
      }
      if (precipitation.type === 'freezing-rain') {
        effects.push('Freezing Rain: Extremely slippery surfaces');
      }
    }

    // Fog effects
    if (condition === CONDITIONS.FOG) {
      effects.push('Heavy Fog: Visibility severely limited');
    }

    return effects;
  }

  /**
   * Get season from month
   * @param {number} month - Month (1-12)
   * @returns {string} Season name
   */
  getSeason(month) {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.weatherCache.clear();
    this.tempService.clearCache();
    this.patternService.clearCache();
    this.atmosphericService.clearCache();
  }
}
