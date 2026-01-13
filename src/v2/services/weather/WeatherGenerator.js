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
  THUNDERSTORM: 'Thunderstorm',
  LIGHT_SNOW: 'Light Snow',
  SNOW: 'Snow',
  HEAVY_SNOW: 'Heavy Snow',
  BLIZZARD: 'Blizzard',
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

    // Generate dew point (the physically-based moisture metric)
    const dewPoint = this.generateDewPoint(region, date, pattern);

    // Calculate humidity from temperature and dew point (Magnus formula)
    // This ensures physically realistic humidity values
    const humidity = this.calculateHumidityFromDewPoint(temperature, dewPoint);

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
    const condition = this.determineCondition(region, pattern, precipitation, temperature, humidity, date, wind);

    // Apply storm wind boost for thunderstorms and blizzards
    // Base: 3d6 (3-18 mph) for all storms - represents basic gustiness
    // Bonus: tornadoRisk × 6d6 for thunderstorms in tornado-prone regions
    let finalWindSpeed = wind.speed;
    if (condition === CONDITIONS.THUNDERSTORM || condition === CONDITIONS.BLIZZARD) {
      const stormWindSeed = generateSeed(region.id, date, `stormwind-${date.hour}`);
      const stormWindRng = new SeededRandom(stormWindSeed);

      // Base boost: 3d6 (range 3-18, avg 10.5) - all storms are gusty
      let windBoost = 0;
      for (let i = 0; i < 3; i++) {
        windBoost += 1 + Math.floor(stormWindRng.next() * 6);
      }

      // Tornado risk bonus for thunderstorms only (not blizzards)
      // tornadoRisk × 6d6 represents intense updrafts/downdrafts in tornado-prone regions
      if (condition === CONDITIONS.THUNDERSTORM) {
        const params = region.climate || region.parameters || {};
        const tornadoRisk = params.specialFactors?.tornadoRisk || 0;
        if (tornadoRisk > 0) {
          // Roll 6d6, then scale by tornadoRisk (e.g., 0.5 = use ~3 of the 6 dice worth)
          let tornadoBoost = 0;
          for (let i = 0; i < 6; i++) {
            tornadoBoost += 1 + Math.floor(stormWindRng.next() * 6);
          }
          windBoost += Math.round(tornadoBoost * tornadoRisk);
        }
      }

      finalWindSpeed = wind.speed + windBoost;
    }

    // Create wind object with potentially boosted speed for effects
    const effectiveWind = { speed: finalWindSpeed, direction: wind.direction };

    // Get visibility
    const visibility = this.atmosphericService.getVisibility(cloudCover, precipitation, humidity);

    // Generate any weather effects (including look-ahead for approaching storms)
    // Use effectiveWind so storm severity thresholds account for boosted wind
    const effects = this.generateEffects(condition, effectiveWind, temperature, precipitation, region, date);

    const weather = {
      temperature,
      feelsLike,
      condition,
      windSpeed: finalWindSpeed,
      windDirection: wind.direction,
      humidity,
      dewPoint,
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
          dewPoint,
          humidity,
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
   * Generate dew point temperature based on regional moisture availability
   * Dew point is the key constraint on humidity - it represents actual moisture in the air
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @param {Object} pattern - Current weather pattern
   * @returns {number} Dew point temperature in °F
   */
  generateDewPoint(region, date, pattern) {
    const params = region.climate || region.parameters || {};
    const dewPointProfile = params.dewPointProfile;

    // If no dew point profile, fall back to estimating from humidity profile
    if (!dewPointProfile) {
      return this.estimateDewPointFromHumidity(region, date, pattern);
    }

    const season = this.getSeason(date.month);
    const seasonalDewPoint = dewPointProfile[season] || dewPointProfile.annual;

    if (!seasonalDewPoint) {
      return this.estimateDewPointFromHumidity(region, date, pattern);
    }

    const seed = generateSeed(region.id, date, 'dewpoint');
    const rng = new SeededRandom(seed);

    // Base dew point from seasonal mean with variance
    const variance = seasonalDewPoint.variance || 8;
    let dewPoint = seasonalDewPoint.mean + rng.range(-variance, variance);

    // Precipitation chance increases moisture (raises dew point)
    const precipChance = pattern.characteristics.precipitation || 0;
    const moistureBoost = precipChance * 8; // Up to +8°F dew point during storms
    dewPoint += moistureBoost;

    // Cap at regional maximum (physical limit based on moisture sources)
    const maxDewPoint = seasonalDewPoint.max || (seasonalDewPoint.mean + 15);
    dewPoint = Math.min(dewPoint, maxDewPoint);

    // Dew point can never exceed air temperature (would mean supersaturation)
    // This is handled in the humidity calculation, not here

    return Math.round(dewPoint);
  }

  /**
   * Estimate dew point from humidity profile (fallback for regions without dew point profile)
   * Uses a rough approximation based on typical humidity-dewpoint relationships
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @param {Object} pattern - Current weather pattern
   * @returns {number} Estimated dew point in °F
   */
  estimateDewPointFromHumidity(region, date, pattern) {
    const params = region.climate || region.parameters || {};
    const humidityProfile = params.humidityProfile;
    const tempProfile = params.temperatureProfile;

    if (!humidityProfile || !tempProfile) {
      return 55; // Default moderate dew point
    }

    const season = this.getSeason(date.month);
    const seasonalHumidity = humidityProfile[season] || humidityProfile.annual;
    const seasonalTemp = tempProfile[season] || tempProfile.annual;

    if (!seasonalHumidity || !seasonalTemp) {
      return 55;
    }

    // Rough estimate: dew point depression is larger when humidity is lower
    // At 100% RH, dewpoint = temperature
    // At 50% RH, dewpoint ≈ temperature - 20°F
    // At 20% RH, dewpoint ≈ temperature - 45°F
    const avgHumidity = seasonalHumidity.mean;
    const avgTemp = seasonalTemp.mean;

    // Approximate dew point depression based on humidity
    const dewPointDepression = (100 - avgHumidity) * 0.45;
    const baseDewPoint = avgTemp - dewPointDepression;

    const seed = generateSeed(region.id, date, 'dewpoint-est');
    const rng = new SeededRandom(seed);
    const variance = 6;
    let dewPoint = baseDewPoint + rng.range(-variance, variance);

    // Add moisture boost during precipitation
    const precipChance = pattern.characteristics.precipitation || 0;
    dewPoint += precipChance * 6;

    return Math.round(dewPoint);
  }

  /**
   * Calculate relative humidity from temperature and dew point using Magnus formula
   * This is the physically accurate way to determine humidity
   * @param {number} tempF - Air temperature in °F
   * @param {number} dewPointF - Dew point temperature in °F
   * @returns {number} Relative humidity percentage (0-100)
   */
  calculateHumidityFromDewPoint(tempF, dewPointF) {
    // Dew point cannot exceed temperature (would mean supersaturation)
    const effectiveDewPoint = Math.min(dewPointF, tempF);

    // Convert to Celsius for Magnus formula
    const T = (tempF - 32) * 5 / 9;
    const Td = (effectiveDewPoint - 32) * 5 / 9;

    // Magnus formula coefficients (valid for -45°C to 60°C)
    const a = 17.625;
    const b = 243.04;

    // Calculate relative humidity
    const RH = 100 * Math.exp((a * Td) / (b + Td)) / Math.exp((a * T) / (b + T));

    return Math.min(100, Math.max(0, Math.round(RH)));
  }

  /**
   * Get precipitation type for a past hour (simplified, for persistence checking)
   * This uses a simpler temperature-only check to avoid recursion
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @returns {string|null} Precipitation type or null if not precipitating
   */
  getPastPrecipitationType(region, date) {
    const pattern = this.patternService.getCurrentPattern(region, date);
    const seed = generateSeed(region.id, date, 'precipitation');
    const isOccurring = this.patternService.shouldPrecipitate(pattern, region, date, seed);

    if (!isOccurring) return null;

    // Get temperature for this hour
    const baseTemp = this.tempService.getTemperature(region, date);
    const patternMod = this.patternService.getTemperatureModifier(pattern, region, date);
    const temp = Math.round(baseTemp + patternMod);

    // Simple temperature-based type (no persistence check to avoid recursion)
    if (temp <= 28) return 'snow';
    if (temp <= 32) return 'mixed'; // Could be freezing-rain or sleet
    if (temp <= 38) return 'mixed'; // Transition zone
    return 'rain';
  }

  /**
   * Go back one hour from a given date
   * @param {Object} date - Game date
   * @returns {Object} Date one hour earlier
   */
  getPreviousHourDate(date) {
    const prevDate = { ...date };
    prevDate.hour -= 1;
    if (prevDate.hour < 0) {
      prevDate.hour = 23;
      prevDate.day -= 1;
      if (prevDate.day < 1) {
        prevDate.day = 30;
        prevDate.month -= 1;
        if (prevDate.month < 1) {
          prevDate.month = 12;
          prevDate.year -= 1;
        }
      }
    }
    return prevDate;
  }

  /**
   * Find the dominant precipitation type and temperature trend from recent hours
   * Uses type momentum/hysteresis to prevent rapid cycling in transition zones.
   *
   * Key insight: Precipitation type should persist until there's a SUSTAINED
   * temperature trend in one direction, not just momentary fluctuations.
   *
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @returns {Object} { dominantType, streakLength, avgTemp, tempTrend, trendStrength, consecutiveTrendHours }
   */
  getRecentPrecipitationTrend(region, date) {
    const types = [];
    const temps = [];
    let currentDate = { ...date };

    // Look back up to 12 hours for better trend detection
    for (let i = 1; i <= 12; i++) {
      currentDate = this.getPreviousHourDate(currentDate);

      const pastType = this.getPastPrecipitationType(region, currentDate);
      if (pastType === null) break; // Stop if we hit a dry hour

      types.push(pastType);

      // Also get temperature
      const pattern = this.patternService.getCurrentPattern(region, currentDate);
      const baseTemp = this.tempService.getTemperature(region, currentDate);
      const patternMod = this.patternService.getTemperatureModifier(pattern, region, currentDate);
      temps.push(Math.round(baseTemp + patternMod));
    }

    if (types.length === 0) {
      return {
        dominantType: null,
        streakLength: 0,
        avgTemp: null,
        tempTrend: 'stable',
        trendStrength: 0,
        consecutiveTrendHours: 0
      };
    }

    // Find dominant type (most common in recent hours)
    const snowCount = types.filter(t => t === 'snow').length;
    const rainCount = types.filter(t => t === 'rain').length;
    const mixedCount = types.filter(t => t === 'mixed').length;

    let dominantType;
    if (snowCount >= rainCount && snowCount >= mixedCount) {
      dominantType = 'snow';
    } else if (rainCount >= snowCount && rainCount >= mixedCount) {
      dominantType = 'rain';
    } else {
      dominantType = 'mixed';
    }

    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;

    // Calculate temperature trend direction and strength
    // temps[0] is 1 hour ago, temps[n] is n+1 hours ago
    // So warming means temps[0] > temps[n] (recent is warmer than older)
    const { tempTrend, trendStrength, consecutiveTrendHours } =
      this.calculateTemperatureTrend(temps);

    return {
      dominantType,
      streakLength: types.length,
      avgTemp,
      tempTrend,        // 'warming', 'cooling', or 'stable'
      trendStrength,    // degrees change over lookback period
      consecutiveTrendHours  // how many consecutive hours temp has moved in same direction
    };
  }

  /**
   * Calculate temperature trend from a series of temperatures
   * temps[0] is most recent (1 hour ago), temps[n] is oldest
   *
   * @param {number[]} temps - Array of temperatures, newest first
   * @returns {Object} { tempTrend, trendStrength, consecutiveTrendHours }
   */
  calculateTemperatureTrend(temps) {
    if (temps.length < 2) {
      return { tempTrend: 'stable', trendStrength: 0, consecutiveTrendHours: 0 };
    }

    // Overall trend: compare recent 3 hours to older 3 hours
    const recentAvg = temps.slice(0, Math.min(3, temps.length))
      .reduce((a, b) => a + b, 0) / Math.min(3, temps.length);
    const olderStart = Math.min(3, temps.length);
    const olderTemps = temps.slice(olderStart, olderStart + 3);

    let overallChange = 0;
    if (olderTemps.length > 0) {
      const olderAvg = olderTemps.reduce((a, b) => a + b, 0) / olderTemps.length;
      overallChange = recentAvg - olderAvg;
    }

    // Count consecutive hours of consistent temperature movement
    // Going backwards: if temp[i] > temp[i+1], that hour was warming
    let consecutiveTrendHours = 0;
    let lastDirection = null;

    for (let i = 0; i < temps.length - 1; i++) {
      const hourChange = temps[i] - temps[i + 1]; // positive = warming
      const direction = hourChange > 1 ? 'warming' : (hourChange < -1 ? 'cooling' : 'stable');

      if (i === 0) {
        lastDirection = direction;
        if (direction !== 'stable') consecutiveTrendHours = 1;
      } else if (direction === lastDirection && direction !== 'stable') {
        consecutiveTrendHours++;
      } else if (direction !== 'stable' && direction !== lastDirection) {
        break; // Trend reversed
      }
      // If stable, continue counting but don't reset
    }

    // Determine trend based on overall change (need at least 3°F to call it a trend)
    let tempTrend;
    if (overallChange >= 3) {
      tempTrend = 'warming';
    } else if (overallChange <= -3) {
      tempTrend = 'cooling';
    } else {
      tempTrend = 'stable';
    }

    return {
      tempTrend,
      trendStrength: Math.abs(overallChange),
      consecutiveTrendHours
    };
  }

  /**
   * Generate precipitation data with smooth transitions and type momentum/hysteresis.
   *
   * Type Momentum System:
   * - Once precipitation establishes a type (snow or rain), it persists until there's
   *   a SUSTAINED temperature trend in the opposite direction
   * - Requires 3+ consecutive hours of temperature movement to trigger a transition
   * - All transitions must go through sleet/freezing-rain (no direct snow↔rain)
   * - Sleet acts as a "buffer zone" that resists quick reversals
   *
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

    // Get recent precipitation trend for type persistence
    const trend = this.getRecentPrecipitationTrend(region, date);

    // Determine type using momentum/hysteresis system
    const type = this.determineTypeWithMomentum(temperature, trend, seed);

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
   * Determine precipitation type using momentum/hysteresis system.
   *
   * The key principle: established precipitation types have "inertia" and require
   * sustained temperature trends to change. This prevents ping-ponging when
   * temperature oscillates around the freezing point.
   *
   * Temperature zones:
   * - ≤22°F: Always snow (hard freeze)
   * - ≥45°F: Always rain (clearly warm)
   * - 22-45°F: Transition zone - use momentum
   *
   * Momentum rules:
   * - Snow persists unless warming trend (3+ hours) AND temp crosses 34°F
   * - Rain persists unless cooling trend (3+ hours) AND temp drops below 32°F
   * - Sleet requires sustained trend (3+ hours moving same direction) to exit
   *
   * @param {number} temperature - Current temperature in °F
   * @param {Object} trend - Trend data from getRecentPrecipitationTrend()
   * @param {number} seed - Random seed for tie-breaking
   * @returns {string} Precipitation type
   */
  determineTypeWithMomentum(temperature, trend, seed) {
    const {
      dominantType,
      streakLength,
      avgTemp,
      tempTrend,
      consecutiveTrendHours
    } = trend;

    // Hard boundaries - no ambiguity
    if (temperature <= 22) return 'snow';
    if (temperature >= 45) return 'rain';

    // Check if there's an established precipitation type with momentum
    const hasSnowMomentum = dominantType === 'snow' && streakLength >= 3;
    const hasRainMomentum = dominantType === 'rain' && streakLength >= 3;
    const inSleetTransition = dominantType === 'mixed' && streakLength >= 2;

    // For sustained trend, require 3+ consecutive hours
    const hasSustainedWarming = tempTrend === 'warming' && consecutiveTrendHours >= 3;
    const hasSustainedCooling = tempTrend === 'cooling' && consecutiveTrendHours >= 3;

    // SNOW MOMENTUM: Snow persists until sustained warming pushes temp above 34°F
    if (hasSnowMomentum) {
      // Continue snow unless sustained warming AND warm enough
      if (hasSustainedWarming && temperature >= 34) {
        // Begin transition to rain - must go through sleet
        return 'sleet';
      }
      // Persist snow even if temp fluctuates into low 30s
      if (temperature <= 36) {
        return 'snow';
      }
      // Temperature jumped high - transition through sleet
      return 'sleet';
    }

    // RAIN MOMENTUM: Rain persists until sustained cooling drops temp below 32°F
    if (hasRainMomentum) {
      // Continue rain unless sustained cooling AND cold enough
      if (hasSustainedCooling && temperature <= 32) {
        // Begin transition to snow - must go through sleet
        return 'sleet';
      }
      // Persist rain even if temp fluctuates into mid 30s
      if (temperature >= 30) {
        return 'rain';
      }
      // Temperature dropped sharply - transition through sleet
      return 'sleet';
    }

    // SLEET/TRANSITION STATE: Act as a buffer that resists quick reversals
    if (inSleetTransition) {
      // Only exit sleet if there's a sustained trend AND we've clearly moved to one side
      if (hasSustainedCooling && temperature <= 28) {
        return 'snow'; // Committed to snow
      }
      if (hasSustainedWarming && temperature >= 38) {
        return 'rain'; // Committed to rain
      }
      // Stay in mixed precipitation - pick sleet or freezing rain
      const rng = new SeededRandom(seed + 999);
      // Freezing rain more likely when near/below freezing with rain momentum
      if (temperature <= 32) {
        return rng.next() < 0.6 ? 'freezing-rain' : 'sleet';
      }
      return 'sleet';
    }

    // NO ESTABLISHED MOMENTUM - New precipitation event or weak trend
    // Use temperature zones with bias toward maintaining recent type if any

    if (streakLength >= 1 && dominantType) {
      // Some recent history - lean toward it if temperature supports it
      if (dominantType === 'snow' && temperature <= 34) return 'snow';
      if (dominantType === 'rain' && temperature >= 32) return 'rain';
    }

    // Fresh start - use temperature with slight overlap in transition zone
    if (temperature <= 30) {
      return 'snow';
    } else if (temperature >= 36) {
      return 'rain';
    } else {
      // Middle of transition zone (30-36°F) - start with sleet
      const rng = new SeededRandom(seed + 999);
      return rng.next() < 0.5 ? 'sleet' : 'freezing-rain';
    }
  }

  /**
   * Determine final weather condition string
   * @param {Object} region - Region data
   * @param {Object} pattern - Weather pattern
   * @param {Object} precipitation - Precipitation data
   * @param {number} temperature - Temperature
   * @param {number} humidity - Humidity
   * @param {Object} date - Game date
   * @param {Object} wind - Wind data {speed, direction}
   * @returns {string} Weather condition
   */
  determineCondition(region, pattern, precipitation, temperature, humidity, date, wind) {
    // Precipitation conditions take precedence
    if (precipitation.isOccurring) {
      const { type, intensity } = precipitation;

      if (type === 'rain') {
        if (intensity === 'light') return CONDITIONS.LIGHT_RAIN;
        if (intensity === 'heavy') {
          // Check for thunderstorm conditions
          const thunderstormCondition = this.checkThunderstorm(region, date, temperature, wind);
          if (thunderstormCondition) return thunderstormCondition;
          return CONDITIONS.HEAVY_RAIN;
        }
        return CONDITIONS.RAIN;
      }

      if (type === 'snow') {
        if (intensity === 'light') return CONDITIONS.LIGHT_SNOW;
        if (intensity === 'heavy') {
          // Check for blizzard conditions: heavy snow + wind >= 30 mph + temp <= 20°F
          if (wind.speed >= 30 && temperature <= 20) {
            return CONDITIONS.BLIZZARD;
          }
          return CONDITIONS.HEAVY_SNOW;
        }
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
   * Check if heavy rain should be a thunderstorm
   * @param {Object} region - Region data
   * @param {Object} date - Game date
   * @param {number} temperature - Current temperature
   * @param {Object} wind - Wind data {speed, direction}
   * @returns {string|null} Thunderstorm condition or null
   */
  checkThunderstorm(region, date, temperature, wind) {
    const params = region.climate || region.parameters || {};
    const specialFactors = params.specialFactors || {};
    const thunderstormFactor = specialFactors.thunderstorms || 0;

    // No thunderstorm potential in this region
    if (thunderstormFactor <= 0) return null;

    // Thunderstorms need warm air for convection (at least 55°F)
    if (temperature < 55) return null;

    // Use seeded random for deterministic thunderstorm occurrence
    const seed = generateSeed(region.id, date, 'thunderstorm');
    const rng = new SeededRandom(seed);

    // Base chance from thunderstorm factor (0.6-0.7 in templates)
    let chance = thunderstormFactor * 0.6;

    // Afternoon/evening bonus (peak convection time: 2pm-8pm)
    if (date.hour >= 14 && date.hour <= 20) {
      chance += 0.15;
    }

    // Summer months boost (more unstable air)
    const month = date.month;
    if (month >= 5 && month <= 8) {
      chance += 0.1;
    }

    // Higher temperature = more convective energy
    if (temperature >= 80) {
      chance += 0.1;
    }

    // Roll for thunderstorm
    if (rng.next() < chance) {
      return CONDITIONS.THUNDERSTORM;
    }

    return null;
  }

  /**
   * Generate weather effects that impact gameplay
   * @param {string} condition - Weather condition
   * @param {Object} wind - Wind data
   * @param {number} temperature - Temperature
   * @param {Object} precipitation - Precipitation data
   * @param {Object} region - Region data (for look-ahead)
   * @param {Object} date - Current date (for look-ahead)
   * @returns {Array} Array of effect strings
   */
  generateEffects(condition, wind, temperature, precipitation, region, date) {
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

    // Thunderstorm effects - severity tied to wind speed
    if (condition === CONDITIONS.THUNDERSTORM) {
      effects.push('Thunderstorm: Lightning risk, seek shelter');
      effects.push('Disadvantage on Perception checks (thunder)');
      if (wind.speed >= 40) {
        effects.push('Severe Thunderstorm: Dangerous winds, flying debris');
      } else if (wind.speed >= 25) {
        effects.push('Strong Thunderstorm: Gusty winds');
      }
    }

    // Blizzard effects
    if (condition === CONDITIONS.BLIZZARD) {
      effects.push('Blizzard: Whiteout conditions, visibility near zero');
      effects.push('Travel extremely dangerous without shelter');
      effects.push('Frostbite risk: CON save every hour exposed');
    }

    // Distant thunder - look ahead for approaching thunderstorms
    if (condition !== CONDITIONS.THUNDERSTORM && region && date) {
      const distantThunder = this.checkDistantThunder(region, date, temperature);
      if (distantThunder) {
        effects.push(distantThunder);
      }
    }

    return effects;
  }

  /**
   * Check if a thunderstorm is approaching in the next 1-2 hours
   * @param {Object} region - Region data
   * @param {Object} date - Current date
   * @param {number} currentTemp - Current temperature
   * @returns {string|null} Distant thunder effect or null
   */
  checkDistantThunder(region, date, currentTemp) {
    const params = region.climate || region.parameters || {};
    const specialFactors = params.specialFactors || {};
    const thunderstormFactor = specialFactors.thunderstorms || 0;

    // No thunderstorm potential in this region
    if (thunderstormFactor <= 0) return null;

    // Check next 1-2 hours for thunderstorms
    for (let hoursAhead = 1; hoursAhead <= 2; hoursAhead++) {
      const futureHour = (date.hour + hoursAhead) % 24;
      const futureDay = date.hour + hoursAhead >= 24 ? date.day + 1 : date.day;
      const futureDate = { ...date, hour: futureHour, day: futureDay };

      // Generate future weather to check for thunderstorm
      // Use a simpler check to avoid recursion - just check if conditions favor thunderstorm
      const seed = generateSeed(region.id, futureDate, 'thunderstorm');
      const rng = new SeededRandom(seed);

      // Estimate future temperature (assume similar to current for simplicity)
      const estimatedTemp = currentTemp;

      if (estimatedTemp < 55) continue;

      // Calculate chance (same logic as checkThunderstorm)
      let chance = thunderstormFactor * 0.6;
      if (futureHour >= 14 && futureHour <= 20) chance += 0.15;
      if (date.month >= 5 && date.month <= 8) chance += 0.1;
      if (estimatedTemp >= 80) chance += 0.1;

      // Also need precipitation to occur - check pattern
      const pattern = this.patternService.getCurrentPattern(region, futureDate);
      const precipSeed = generateSeed(region.id, futureDate, 'precipitation');
      const willPrecipitate = this.patternService.shouldPrecipitate(pattern, region, futureDate, precipSeed);

      if (willPrecipitate && rng.next() < chance) {
        // Thunderstorm is coming!
        if (hoursAhead === 1) {
          return 'Distant thunder heard to the horizon';
        } else {
          return 'Faint rumbles of thunder in the distance';
        }
      }
    }

    return null;
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
