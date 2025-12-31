/**
 * Sea State Service
 * Generates maritime conditions (waves, swell, sea state) for ocean regions.
 *
 * All calculations are deterministic based on region + date + weather conditions.
 * Wave heights correlate with wind speed via the Beaufort scale.
 */

import { WeatherGenerator } from './WeatherGenerator';
import { advanceDate } from '../../utils/dateUtils';

/**
 * Beaufort Scale reference
 * Maps wind speed ranges to sea conditions and wave heights
 */
export const BEAUFORT_SCALE = [
  { force: 0, windMin: 0, windMax: 1, waveHeight: 0, seaState: 'calm', description: 'Calm', seaDescription: 'Sea like a mirror' },
  { force: 1, windMin: 1, windMax: 3, waveHeight: 0.1, seaState: 'calm', description: 'Light air', seaDescription: 'Ripples without crests' },
  { force: 2, windMin: 4, windMax: 7, waveHeight: 0.5, seaState: 'smooth', description: 'Light breeze', seaDescription: 'Small wavelets, crests not breaking' },
  { force: 3, windMin: 8, windMax: 12, waveHeight: 2, seaState: 'slight', description: 'Gentle breeze', seaDescription: 'Large wavelets, scattered whitecaps' },
  { force: 4, windMin: 13, windMax: 18, waveHeight: 4, seaState: 'moderate', description: 'Moderate breeze', seaDescription: 'Small waves, frequent whitecaps' },
  { force: 5, windMin: 19, windMax: 24, waveHeight: 8, seaState: 'moderate', description: 'Fresh breeze', seaDescription: 'Moderate waves, many whitecaps' },
  { force: 6, windMin: 25, windMax: 31, waveHeight: 13, seaState: 'rough', description: 'Strong breeze', seaDescription: 'Large waves, white foam crests' },
  { force: 7, windMin: 32, windMax: 38, waveHeight: 19, seaState: 'rough', description: 'Near gale', seaDescription: 'Sea heaps up, foam blown in streaks' },
  { force: 8, windMin: 39, windMax: 46, waveHeight: 25, seaState: 'very_rough', description: 'Gale', seaDescription: 'Moderately high waves, crests break' },
  { force: 9, windMin: 47, windMax: 54, waveHeight: 32, seaState: 'high', description: 'Strong gale', seaDescription: 'High waves, dense foam, spray' },
  { force: 10, windMin: 55, windMax: 63, waveHeight: 41, seaState: 'very_high', description: 'Storm', seaDescription: 'Very high waves, surface white with foam' },
  { force: 11, windMin: 64, windMax: 72, waveHeight: 52, seaState: 'phenomenal', description: 'Violent storm', seaDescription: 'Exceptionally high waves' },
  { force: 12, windMin: 73, windMax: 999, waveHeight: 60, seaState: 'phenomenal', description: 'Hurricane', seaDescription: 'Air filled with foam and spray' }
];

/**
 * Sea state labels for display
 */
export const SEA_STATE_LABELS = {
  calm: 'Calm',
  smooth: 'Smooth',
  slight: 'Slight',
  moderate: 'Moderate',
  rough: 'Rough',
  very_rough: 'Very Rough',
  high: 'High',
  very_high: 'Very High',
  phenomenal: 'Phenomenal'
};

/**
 * Sailing condition ratings
 */
export const SAILING_CONDITIONS = {
  excellent: { label: 'Excellent', description: 'Perfect sailing weather' },
  good: { label: 'Good', description: 'Favorable conditions for most vessels' },
  fair: { label: 'Fair', description: 'Manageable but requires attention' },
  challenging: { label: 'Challenging', description: 'Difficult sailing, experienced crew recommended' },
  hazardous: { label: 'Hazardous', description: 'Dangerous conditions, seek shelter if possible' },
  dangerous: { label: 'Dangerous', description: 'Life-threatening, stay in port' }
};

/**
 * Sea State Service class
 */
export class SeaStateService {
  constructor() {
    this.seaStateCache = new Map();
    this.weatherGenerator = new WeatherGenerator();
  }

  /**
   * Get sea state for an ocean region
   * @param {Object} region - Ocean region with climate parameters
   * @param {Object} date - Game date {year, month, day, hour}
   * @param {Object} weather - Current weather from WeatherGenerator
   * @returns {Object} Sea state data
   */
  getSeaState(region, date, weather) {
    const cacheKey = `${region.id}:${date.year}:${date.month}:${date.day}:${date.hour}`;

    if (this.seaStateCache.has(cacheKey)) {
      return this.seaStateCache.get(cacheKey);
    }

    const climate = region.climate || region.parameters || {};
    const specialFactors = climate.specialFactors || {};

    // Get wind speed from weather
    const windSpeed = weather.windSpeed || 0;

    // Calculate wave height from wind speed
    const waveData = this.calculateWaveHeight(windSpeed, specialFactors);

    // Get Beaufort scale info
    const beaufort = this.getBeaufortScale(windSpeed);

    // Calculate swell from region parameters and weather pattern
    const swell = this.calculateSwell(specialFactors, weather);

    // Assess overall sailing conditions
    const sailingConditions = this.assessSailingConditions(waveData, swell, weather, specialFactors);

    // Generate hazards and effects
    const { hazards, effects } = this.generateHazardsAndEffects(waveData, swell, weather, specialFactors);

    const seaState = {
      // Wave information
      waveHeight: waveData.height,
      waveHeightRange: waveData.range,
      seaCondition: waveData.seaCondition,

      // Beaufort scale
      beaufortScale: beaufort.force,
      beaufortDescription: beaufort.description,
      beaufortSeaDescription: beaufort.seaDescription,

      // Swell information
      swellHeight: swell.height,
      swellPeriod: swell.period,
      swellDirection: swell.direction,

      // Combined wave height (wind waves + swell)
      combinedSeaHeight: Math.round((waveData.height + swell.height * 0.5) * 10) / 10,

      // Sailing assessment
      sailingConditions: sailingConditions.rating,
      sailingDescription: sailingConditions.description,

      // Hazards and gameplay effects
      hazards,
      effects,

      // Debug info
      _debug: {
        windSpeed,
        seaType: specialFactors.seaType || 'open',
        fetchFactor: this.getFetchFactor(specialFactors),
        baseSwellHeight: specialFactors.baseSwellHeight || 4,
        baseSwellPeriod: specialFactors.baseSwellPeriod || 8
      }
    };

    this.seaStateCache.set(cacheKey, seaState);
    return seaState;
  }

  /**
   * Calculate wave height from wind speed
   * Uses Beaufort scale correlation with fetch adjustment
   * @param {number} windSpeed - Wind speed in mph
   * @param {Object} specialFactors - Region special factors
   * @returns {Object} Wave data { height, range, seaCondition }
   */
  calculateWaveHeight(windSpeed, specialFactors) {
    const beaufort = this.getBeaufortScale(windSpeed);
    const fetchFactor = this.getFetchFactor(specialFactors);

    // Base wave height from Beaufort scale, adjusted by fetch
    const baseHeight = beaufort.waveHeight * fetchFactor;

    // Add some variance (waves vary around the significant height)
    const minHeight = Math.round(baseHeight * 0.6 * 10) / 10;
    const maxHeight = Math.round(baseHeight * 1.4 * 10) / 10;
    const height = Math.round(baseHeight * 10) / 10;

    return {
      height,
      range: [minHeight, maxHeight],
      seaCondition: beaufort.seaState
    };
  }

  /**
   * Get fetch factor based on sea type
   * Fetch is the distance over which wind can build waves
   * @param {Object} specialFactors - Region special factors
   * @returns {number} Fetch factor (0.3 - 1.0)
   */
  getFetchFactor(specialFactors) {
    const seaType = specialFactors.seaType || 'open';

    const fetchFactors = {
      'open': 1.0,      // Full ocean - unlimited fetch
      'coastal': 0.7,   // Limited by nearby land
      'enclosed': 0.5,  // Bay or sea
      'gulf': 0.6,      // Semi-enclosed
      'strait': 0.4     // Very limited, narrow passage
    };

    return fetchFactors[seaType] || 1.0;
  }

  /**
   * Get Beaufort scale data for a wind speed
   * @param {number} windSpeed - Wind speed in mph
   * @returns {Object} Beaufort scale entry
   */
  getBeaufortScale(windSpeed) {
    for (const entry of BEAUFORT_SCALE) {
      if (windSpeed >= entry.windMin && windSpeed <= entry.windMax) {
        return entry;
      }
    }
    // Fallback to hurricane force for extreme winds
    return BEAUFORT_SCALE[BEAUFORT_SCALE.length - 1];
  }

  /**
   * Calculate swell characteristics
   * Swell is generated by distant weather systems and arrives independently of local wind
   * @param {Object} specialFactors - Region special factors
   * @param {Object} weather - Current weather
   * @returns {Object} Swell data { height, period, direction }
   */
  calculateSwell(specialFactors, weather) {
    // Base swell from region template
    const baseHeight = specialFactors.baseSwellHeight || 4;
    const basePeriod = specialFactors.baseSwellPeriod || 8;
    const swellSource = specialFactors.swellSource || 'westerlies';

    // Swell direction based on source
    const swellDirections = {
      'trade': 'NE',      // Trade winds from northeast
      'westerlies': 'W',  // Westerly swell
      'polar': 'N',       // Polar swell from north
      'local': weather.windDirection || 'W'  // Local wind-generated
    };

    // Weather pattern can intensify or reduce swell
    let swellModifier = 1.0;
    if (weather.condition?.includes('Storm') || weather.condition?.includes('Thunder')) {
      swellModifier = 1.5;
    } else if (weather.condition === 'Clear' || weather.condition === 'Sunny') {
      swellModifier = 0.8;
    }

    // Storm frequency from region affects baseline swell
    if (specialFactors.stormFrequency) {
      swellModifier *= (1 + specialFactors.stormFrequency * 0.3);
    }

    return {
      height: Math.round(baseHeight * swellModifier * 10) / 10,
      period: basePeriod,
      direction: swellDirections[swellSource] || 'W'
    };
  }

  /**
   * Assess overall sailing conditions
   * @param {Object} waveData - Calculated wave data
   * @param {Object} swell - Calculated swell data
   * @param {Object} weather - Current weather
   * @param {Object} specialFactors - Region special factors
   * @returns {Object} Sailing assessment { rating, description }
   */
  assessSailingConditions(waveData, swell, weather, specialFactors) {
    let score = 100; // Start perfect, deduct for hazards

    // Wave height penalties
    if (waveData.height > 20) score -= 60;
    else if (waveData.height > 13) score -= 40;
    else if (waveData.height > 8) score -= 25;
    else if (waveData.height > 4) score -= 10;

    // Combined sea height (waves + swell)
    const combinedHeight = waveData.height + swell.height * 0.5;
    if (combinedHeight > 25) score -= 20;
    else if (combinedHeight > 15) score -= 10;

    // Wind speed penalties
    const windSpeed = weather.windSpeed || 0;
    if (windSpeed > 45) score -= 40;
    else if (windSpeed > 30) score -= 20;
    else if (windSpeed > 20) score -= 10;
    // Light wind can also be a problem (doldrums)
    if (windSpeed < 5) score -= 15;

    // Visibility penalties
    if (weather.visibility === 'poor') score -= 20;
    else if (weather.visibility === 'moderate') score -= 10;

    // Precipitation penalties
    if (weather.precipitation) {
      if (weather.precipitationIntensity === 'heavy') score -= 20;
      else score -= 10;
    }

    // Special hazards
    if (specialFactors.icebergs) score -= specialFactors.icebergs * 30;
    if (specialFactors.reefs) score -= specialFactors.reefs * 20;
    if (specialFactors.fog) score -= specialFactors.fog * 15;
    if (specialFactors.tidalCurrents) score -= specialFactors.tidalCurrents * 15;

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Map score to rating
    let rating, description;
    if (score >= 90) {
      rating = 'excellent';
      description = SAILING_CONDITIONS.excellent.description;
    } else if (score >= 75) {
      rating = 'good';
      description = SAILING_CONDITIONS.good.description;
    } else if (score >= 55) {
      rating = 'fair';
      description = SAILING_CONDITIONS.fair.description;
    } else if (score >= 35) {
      rating = 'challenging';
      description = SAILING_CONDITIONS.challenging.description;
    } else if (score >= 15) {
      rating = 'hazardous';
      description = SAILING_CONDITIONS.hazardous.description;
    } else {
      rating = 'dangerous';
      description = SAILING_CONDITIONS.dangerous.description;
    }

    return { rating, description, score };
  }

  /**
   * Generate hazards and gameplay effects
   * @param {Object} waveData - Calculated wave data
   * @param {Object} swell - Calculated swell data
   * @param {Object} weather - Current weather
   * @param {Object} specialFactors - Region special factors
   * @returns {Object} { hazards: [], effects: [] }
   */
  generateHazardsAndEffects(waveData, swell, weather, specialFactors) {
    const hazards = [];
    const effects = [];

    // Wave-based hazards
    if (waveData.height >= 20) {
      hazards.push('Extreme waves');
      effects.push('Ship damage possible without expert handling');
      effects.push('Deck work extremely dangerous');
    } else if (waveData.height >= 13) {
      hazards.push('High seas');
      effects.push('All crew should secure themselves');
      effects.push('Non-essential deck work suspended');
    } else if (waveData.height >= 8) {
      hazards.push('Rough seas');
      effects.push('Seasickness likely for unaccustomed sailors');
      effects.push('Care needed when moving on deck');
    }

    // Wind-based hazards
    const windSpeed = weather.windSpeed || 0;
    if (windSpeed >= 45) {
      hazards.push('Gale force winds');
      effects.push('Reduced sail or bare poles recommended');
    } else if (windSpeed >= 30) {
      hazards.push('Strong winds');
      effects.push('Reef sails');
    }

    if (windSpeed < 5) {
      hazards.push('Becalmed');
      effects.push('No wind for sailing - row, drift, or wait');
    }

    // Visibility hazards
    if (weather.visibility === 'poor' || specialFactors.fog > 0.5) {
      hazards.push('Reduced visibility');
      effects.push('Navigation by instruments or dead reckoning');
      effects.push('Risk of collision or grounding');
    }

    // Region-specific hazards
    if (specialFactors.icebergs > 0.5) {
      hazards.push('Iceberg danger');
      effects.push('Lookouts required at all times');
      effects.push('Reduced speed in ice waters');
    }

    if (specialFactors.reefs > 0.5) {
      hazards.push('Reef hazards');
      effects.push('Local pilot recommended');
      effects.push('Daytime passage only advised');
    }

    if (specialFactors.tidalCurrents > 0.5) {
      hazards.push('Strong currents');
      effects.push('Time passage for slack water if possible');
    }

    if (specialFactors.hurricaneRisk > 0.5 && weather.condition?.includes('Storm')) {
      hazards.push('Tropical storm activity');
      effects.push('Seek shelter immediately');
    }

    if (specialFactors.squalls > 0.3 && weather.precipitation) {
      hazards.push('Squalls');
      effects.push('Sudden wind shifts and heavy rain possible');
    }

    // Crossing seas (when swell and wind waves from different directions)
    if (swell.direction !== weather.windDirection && waveData.height > 4 && swell.height > 3) {
      hazards.push('Crossing seas');
      effects.push('Confused wave pattern, uncomfortable motion');
    }

    return { hazards, effects };
  }

  /**
   * Get short-term sea state forecast (next 6 hours)
   * Helps sailors anticipate changing conditions
   * @param {Object} region - Ocean region with climate parameters
   * @param {Object} date - Current game date {year, month, day, hour}
   * @param {Object} currentWeather - Current weather from WeatherGenerator
   * @returns {Object} Forecast with trend and upcoming conditions
   */
  getSeaStateForecast(region, date, currentWeather) {
    const currentSeaState = this.getSeaState(region, date, currentWeather);
    const forecastHours = [1, 2, 3, 6]; // Check 1, 2, 3, and 6 hours ahead
    const forecasts = [];

    for (const hoursAhead of forecastHours) {
      const futureDate = advanceDate(date, hoursAhead);
      const futureWeather = this.weatherGenerator.generateWeather(region, futureDate);
      const futureSeaState = this.getSeaState(region, futureDate, futureWeather);

      forecasts.push({
        hoursAhead,
        waveHeight: futureSeaState.waveHeight,
        seaCondition: futureSeaState.seaCondition,
        sailingConditions: futureSeaState.sailingConditions,
        windSpeed: futureWeather.windSpeed,
        beaufortScale: futureSeaState.beaufortScale
      });
    }

    // Determine overall trend
    const currentWaves = currentSeaState.waveHeight;
    const futureWaves3h = forecasts.find(f => f.hoursAhead === 3)?.waveHeight || currentWaves;
    const futureWaves6h = forecasts.find(f => f.hoursAhead === 6)?.waveHeight || currentWaves;

    let trend = 'steady';
    let trendDescription = 'Conditions expected to remain stable';

    // Check for significant changes (more than 25% change in wave height)
    const change3h = (futureWaves3h - currentWaves) / Math.max(currentWaves, 1);
    const change6h = (futureWaves6h - currentWaves) / Math.max(currentWaves, 1);

    if (change3h > 0.5 || change6h > 0.75) {
      trend = 'deteriorating_rapidly';
      trendDescription = 'Conditions deteriorating rapidly - seek shelter';
    } else if (change3h > 0.25 || change6h > 0.5) {
      trend = 'deteriorating';
      trendDescription = 'Seas building - conditions worsening';
    } else if (change3h < -0.5 || change6h < -0.75) {
      trend = 'improving_rapidly';
      trendDescription = 'Conditions improving quickly';
    } else if (change3h < -0.25 || change6h < -0.5) {
      trend = 'improving';
      trendDescription = 'Seas calming - conditions improving';
    }

    // Check for sailing condition changes
    const currentRating = currentSeaState.sailingConditions;
    const ratingIn3h = forecasts.find(f => f.hoursAhead === 3)?.sailingConditions;
    const sailingRatings = ['excellent', 'good', 'fair', 'challenging', 'hazardous', 'dangerous'];
    const currentRatingIndex = sailingRatings.indexOf(currentRating);
    const futureRatingIndex = sailingRatings.indexOf(ratingIn3h);

    let sailingTrendWarning = null;
    if (futureRatingIndex > currentRatingIndex + 1) {
      sailingTrendWarning = `Sailing conditions expected to become ${ratingIn3h} within 3 hours`;
    } else if (futureRatingIndex < currentRatingIndex - 1) {
      sailingTrendWarning = `Sailing conditions expected to improve to ${ratingIn3h} within 3 hours`;
    }

    // Find the worst conditions in the forecast window
    const worstCondition = forecasts.reduce((worst, f) => {
      return f.waveHeight > worst.waveHeight ? f : worst;
    }, { waveHeight: currentWaves, hoursAhead: 0, seaCondition: currentSeaState.seaCondition });

    return {
      current: {
        waveHeight: currentWaves,
        seaCondition: currentSeaState.seaCondition,
        sailingConditions: currentRating
      },
      forecasts,
      trend,
      trendDescription,
      sailingTrendWarning,
      peakConditions: worstCondition.hoursAhead > 0 ? {
        hoursAhead: worstCondition.hoursAhead,
        waveHeight: worstCondition.waveHeight,
        seaCondition: worstCondition.seaCondition
      } : null
    };
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.seaStateCache.clear();
  }
}

// Singleton instance
const seaStateService = new SeaStateService();
export default seaStateService;
