/**
 * Environmental Conditions Service
 * Tracks cumulative environmental states: drought, flooding, heat waves, cold snaps, wildfire risk
 *
 * All calculations are done on-the-fly using the deterministic seed system.
 * Looking back over N days to determine cumulative conditions.
 */

import { WeatherGenerator } from './WeatherGenerator';
import { advanceDate } from '../../utils/dateUtils';
import { SnowAccumulationService } from './SnowAccumulationService';

/**
 * Drought severity levels based on US Drought Monitor categories
 * https://droughtmonitor.unl.edu/About/AbouttheData/DroughtClassification.aspx
 */
export const DROUGHT_LEVELS = {
  NONE: { level: 0, name: 'Normal', description: 'Precipitation near or above normal' },
  ABNORMALLY_DRY: { level: 1, name: 'Abnormally Dry', description: 'Going into drought: short-term dryness slowing growth of crops' },
  MODERATE: { level: 2, name: 'Moderate Drought', description: 'Some crop damage, streams and wells low, water shortages developing' },
  SEVERE: { level: 3, name: 'Severe Drought', description: 'Crop losses likely, water shortages common, water restrictions imposed' },
  EXTREME: { level: 4, name: 'Extreme Drought', description: 'Major crop losses, widespread water shortages, emergency measures' }
};

/**
 * Flood risk levels
 */
export const FLOOD_LEVELS = {
  NONE: { level: 0, name: 'Normal', description: 'Precipitation within normal range' },
  ELEVATED: { level: 1, name: 'Elevated', description: 'Above normal precipitation, minor flooding possible in low areas' },
  MODERATE: { level: 2, name: 'Moderate Risk', description: 'Significant excess precipitation, flooding likely in flood-prone areas' },
  HIGH: { level: 3, name: 'High Risk', description: 'Major flooding expected, evacuations may be necessary' }
};

/**
 * Temperature extreme levels
 */
export const HEAT_WAVE_LEVELS = {
  NONE: { level: 0, name: 'Normal', description: 'Temperatures within seasonal norms' },
  ADVISORY: { level: 1, name: 'Heat Advisory', description: '3+ consecutive days of elevated temperatures' },
  WARNING: { level: 2, name: 'Heat Warning', description: '5+ consecutive days significantly above normal, health risk' },
  EXTREME: { level: 3, name: 'Extreme Heat', description: 'Dangerous prolonged heat, serious health threat' }
};

export const COLD_SNAP_LEVELS = {
  NONE: { level: 0, name: 'Normal', description: 'Temperatures within seasonal norms' },
  ADVISORY: { level: 1, name: 'Cold Advisory', description: '3+ consecutive days of significantly below normal temperatures' },
  WARNING: { level: 2, name: 'Cold Warning', description: '5+ consecutive days well below normal, frostbite risk' },
  EXTREME: { level: 3, name: 'Extreme Cold', description: 'Dangerous prolonged cold, life-threatening conditions' }
};

/**
 * Wildfire risk levels (based on National Fire Danger Rating System concepts)
 */
export const WILDFIRE_LEVELS = {
  NONE: { level: 0, name: 'Low', description: 'Conditions not favorable for wildfire spread' },
  MODERATE: { level: 1, name: 'Moderate', description: 'Fires can start, spread limited' },
  HIGH: { level: 2, name: 'High', description: 'Fires start easily, spread at moderate rate' },
  VERY_HIGH: { level: 3, name: 'Very High', description: 'Fires start very easily, spread rapidly' },
  EXTREME: { level: 4, name: 'Extreme', description: 'Fire situation explosive, extreme fire behavior' }
};

/**
 * Environmental Conditions Service
 */
export class EnvironmentalConditionsService {
  constructor() {
    // We'll use a separate WeatherGenerator instance to look back at historical weather
    // This avoids circular dependencies and keeps concerns separated
    this.weatherGenerator = new WeatherGenerator();
    this.snowService = new SnowAccumulationService();
    this.conditionsCache = new Map();
  }

  /**
   * Get all environmental conditions for a region at a specific date
   * @param {Object} region - Region with climate parameters
   * @param {Object} date - Game date {year, month, day, hour}
   * @returns {Object} Environmental conditions data
   */
  getEnvironmentalConditions(region, date) {
    const cacheKey = `${region.id}:${date.year}:${date.month}:${date.day}`;

    if (this.conditionsCache.has(cacheKey)) {
      return this.conditionsCache.get(cacheKey);
    }

    // Calculate all environmental conditions
    let drought = this.calculateDrought(region, date);
    const flooding = this.calculateFlooding(region, date);
    const heatWave = this.calculateHeatWave(region, date);
    const coldSnap = this.calculateColdSnap(region, date);
    let wildfireRisk = this.calculateWildfireRisk(region, date, drought, heatWave);

    // Get snow accumulation to check for suppression conditions
    const snowData = this.snowService.getAccumulation(region, date);
    const hasSignificantSnow = snowData.snowDepth >= 2; // 2+ inches of snow on ground
    const currentWeather = this.weatherGenerator.generateWeather(region, { ...date, hour: 12 });
    const isFreezing = currentWeather.temperature <= 32;

    // SUPPRESSION LOGIC:
    // Snow cover suppresses drought and wildfire alerts - you can't have a drought
    // or wildfire risk when there's snow on the ground!
    if (hasSignificantSnow) {
      // Suppress drought - snow IS precipitation, and ground is wet beneath it
      if (drought.level > 0) {
        drought = {
          ...DROUGHT_LEVELS.NONE,
          precipDeficitPercent: drought.precipDeficitPercent,
          actualPrecipDays: drought.actualPrecipDays,
          expectedPrecipDays: drought.expectedPrecipDays,
          lookbackDays: drought.lookbackDays,
          gameplayImpacts: [],
          suppressedBySnow: true
        };
      }

      // Suppress wildfire - snow-covered ground can't burn
      if (wildfireRisk.level > 0) {
        wildfireRisk = {
          ...WILDFIRE_LEVELS.NONE,
          riskScore: 0,
          factors: wildfireRisk.factors,
          gameplayImpacts: [],
          suppressedBySnow: true
        };
      }
    }

    // Also suppress wildfire if consistently freezing (even without snow)
    // Frozen vegetation doesn't burn easily
    if (isFreezing && coldSnap.consecutiveDays >= 2 && wildfireRisk.level > 0 && !wildfireRisk.suppressedBySnow) {
      wildfireRisk = {
        ...WILDFIRE_LEVELS.NONE,
        riskScore: Math.min(wildfireRisk.riskScore, 10),
        factors: wildfireRisk.factors,
        gameplayImpacts: [],
        suppressedByFreezing: true
      };
    }

    // Compile active alerts (conditions with level > 0)
    const activeAlerts = [];
    if (drought.level > 0) activeAlerts.push({ type: 'drought', ...drought });
    if (flooding.level > 0) activeAlerts.push({ type: 'flooding', ...flooding });
    if (heatWave.level > 0) activeAlerts.push({ type: 'heatWave', ...heatWave });
    if (coldSnap.level > 0) activeAlerts.push({ type: 'coldSnap', ...coldSnap });
    if (wildfireRisk.level > 0) activeAlerts.push({ type: 'wildfireRisk', ...wildfireRisk });

    const conditions = {
      drought,
      flooding,
      heatWave,
      coldSnap,
      wildfireRisk,
      activeAlerts,
      hasActiveAlerts: activeAlerts.length > 0
    };

    this.conditionsCache.set(cacheKey, conditions);
    return conditions;
  }

  /**
   * Calculate drought conditions by comparing actual vs expected precipitation over 30 days
   * @param {Object} region - Region data
   * @param {Object} date - Current date
   * @returns {Object} Drought assessment
   */
  calculateDrought(region, date) {
    const lookbackDays = 30;
    const { actualPrecipDays, expectedPrecipDays } = this.getPrecipitationHistory(region, date, lookbackDays);

    // Calculate precipitation deficit as a percentage
    // (expected - actual) / expected * 100
    // Positive = deficit (drought), Negative = excess (wet)
    const precipDeficit = expectedPrecipDays > 0
      ? ((expectedPrecipDays - actualPrecipDays) / expectedPrecipDays) * 100
      : 0;

    // Determine drought level based on deficit percentage
    let droughtLevel;
    if (precipDeficit < 15) {
      droughtLevel = DROUGHT_LEVELS.NONE;
    } else if (precipDeficit < 30) {
      droughtLevel = DROUGHT_LEVELS.ABNORMALLY_DRY;
    } else if (precipDeficit < 50) {
      droughtLevel = DROUGHT_LEVELS.MODERATE;
    } else if (precipDeficit < 70) {
      droughtLevel = DROUGHT_LEVELS.SEVERE;
    } else {
      droughtLevel = DROUGHT_LEVELS.EXTREME;
    }

    return {
      ...droughtLevel,
      precipDeficitPercent: Math.round(precipDeficit),
      actualPrecipDays,
      expectedPrecipDays,
      lookbackDays,
      gameplayImpacts: this.getDroughtGameplayImpacts(droughtLevel)
    };
  }

  /**
   * Calculate flooding conditions by detecting excess precipitation
   * @param {Object} region - Region data
   * @param {Object} date - Current date
   * @returns {Object} Flooding assessment
   */
  calculateFlooding(region, date) {
    const lookbackDays = 14; // Shorter window for flooding (more immediate)
    const { actualPrecipDays, expectedPrecipDays, heavyPrecipDays } = this.getPrecipitationHistory(region, date, lookbackDays);

    // Calculate precipitation excess as a percentage
    const precipExcess = expectedPrecipDays > 0
      ? ((actualPrecipDays - expectedPrecipDays) / expectedPrecipDays) * 100
      : (actualPrecipDays > 0 ? 100 : 0);

    // Factor in heavy precipitation (more likely to cause flooding)
    const heavyPrecipFactor = heavyPrecipDays / lookbackDays;

    // Determine flood level
    let floodLevel;
    if (precipExcess < 30 && heavyPrecipFactor < 0.2) {
      floodLevel = FLOOD_LEVELS.NONE;
    } else if (precipExcess < 60 || heavyPrecipFactor < 0.3) {
      floodLevel = FLOOD_LEVELS.ELEVATED;
    } else if (precipExcess < 100 || heavyPrecipFactor < 0.5) {
      floodLevel = FLOOD_LEVELS.MODERATE;
    } else {
      floodLevel = FLOOD_LEVELS.HIGH;
    }

    return {
      ...floodLevel,
      precipExcessPercent: Math.round(precipExcess),
      actualPrecipDays,
      expectedPrecipDays,
      heavyPrecipDays,
      lookbackDays,
      gameplayImpacts: this.getFloodingGameplayImpacts(floodLevel)
    };
  }

  /**
   * Calculate heat wave conditions
   * Heat waves are about dangerous heat for humans, so we require:
   * 1. Absolute temperature threshold (must actually be hot)
   * 2. Temperatures significantly above seasonal norm (so 95°F in Arizona summer isn't a "heat wave")
   * @param {Object} region - Region data
   * @param {Object} date - Current date
   * @returns {Object} Heat wave assessment
   */
  calculateHeatWave(region, date) {
    // Get current temperature to check absolute threshold
    const currentWeather = this.weatherGenerator.generateWeather(region, { ...date, hour: 14 });
    const currentTemp = currentWeather.temperature;

    // Absolute temperature thresholds - heat waves require actually dangerous heat
    const HEAT_ADVISORY_FLOOR = 85;  // Minimum temp for any heat advisory
    const HEAT_WARNING_FLOOR = 90;   // Minimum temp for heat warning
    const HEAT_EXTREME_FLOOR = 95;   // Minimum temp for extreme heat

    // If it's not actually hot, no heat wave regardless of deviation from normal
    if (currentTemp < HEAT_ADVISORY_FLOOR) {
      return {
        ...HEAT_WAVE_LEVELS.NONE,
        consecutiveDays: 0,
        degreesAboveNormal: 0,
        gameplayImpacts: []
      };
    }

    const { consecutiveHotDays, tempAboveNormal } = this.getTemperatureHistory(region, date, 'hot');

    // Determine heat wave level based on consecutive days, severity, AND absolute temp
    let heatLevel;
    if (consecutiveHotDays < 3) {
      heatLevel = HEAT_WAVE_LEVELS.NONE;
    } else if (currentTemp < HEAT_WARNING_FLOOR || consecutiveHotDays < 5 || tempAboveNormal < 10) {
      heatLevel = HEAT_WAVE_LEVELS.ADVISORY;
    } else if (currentTemp < HEAT_EXTREME_FLOOR || consecutiveHotDays < 7 || tempAboveNormal < 15) {
      heatLevel = HEAT_WAVE_LEVELS.WARNING;
    } else {
      heatLevel = HEAT_WAVE_LEVELS.EXTREME;
    }

    return {
      ...heatLevel,
      consecutiveDays: consecutiveHotDays,
      degreesAboveNormal: Math.round(tempAboveNormal),
      gameplayImpacts: this.getHeatWaveGameplayImpacts(heatLevel)
    };
  }

  /**
   * Calculate cold snap conditions
   * Cold snaps are about dangerous cold for humans (frostbite, hypothermia), so we require:
   * 1. Absolute temperature threshold (must actually be dangerously cold)
   * 2. Temperatures significantly below seasonal norm (so 10°F in Minnesota winter isn't a "cold snap")
   * @param {Object} region - Region data
   * @param {Object} date - Current date
   * @returns {Object} Cold snap assessment
   */
  calculateColdSnap(region, date) {
    // Get current temperature to check absolute threshold
    const currentWeather = this.weatherGenerator.generateWeather(region, { ...date, hour: 6 }); // Early morning coldest
    const currentTemp = currentWeather.temperature;

    // Absolute temperature thresholds - cold snaps require actually dangerous cold
    const COLD_ADVISORY_CEILING = 25;  // Maximum temp for any cold advisory
    const COLD_WARNING_CEILING = 10;   // Maximum temp for cold warning
    const COLD_EXTREME_CEILING = 0;    // Maximum temp for extreme cold

    // If it's not actually cold, no cold snap regardless of deviation from normal
    if (currentTemp > COLD_ADVISORY_CEILING) {
      return {
        ...COLD_SNAP_LEVELS.NONE,
        consecutiveDays: 0,
        degreesBelowNormal: 0,
        gameplayImpacts: []
      };
    }

    const { consecutiveColdDays, tempBelowNormal } = this.getTemperatureHistory(region, date, 'cold');

    // Determine cold snap level based on consecutive days, severity, AND absolute temp
    let coldLevel;
    if (consecutiveColdDays < 3) {
      coldLevel = COLD_SNAP_LEVELS.NONE;
    } else if (currentTemp > COLD_WARNING_CEILING || consecutiveColdDays < 5 || tempBelowNormal < 10) {
      coldLevel = COLD_SNAP_LEVELS.ADVISORY;
    } else if (currentTemp > COLD_EXTREME_CEILING || consecutiveColdDays < 7 || tempBelowNormal < 15) {
      coldLevel = COLD_SNAP_LEVELS.WARNING;
    } else {
      coldLevel = COLD_SNAP_LEVELS.EXTREME;
    }

    return {
      ...coldLevel,
      consecutiveDays: consecutiveColdDays,
      degreesBelowNormal: Math.round(tempBelowNormal),
      gameplayImpacts: this.getColdSnapGameplayImpacts(coldLevel)
    };
  }

  /**
   * Calculate wildfire risk (composite of drought, heat, wind, and humidity)
   * @param {Object} region - Region data
   * @param {Object} date - Current date
   * @param {Object} drought - Already-calculated drought data
   * @param {Object} heatWave - Already-calculated heat wave data
   * @returns {Object} Wildfire risk assessment
   */
  calculateWildfireRisk(region, date, drought, heatWave) {
    // Get current weather for wind and humidity
    const currentWeather = this.weatherGenerator.generateWeather(region, { ...date, hour: 14 }); // Afternoon peak

    // Build composite risk score (0-100)
    let riskScore = 0;

    // Drought contribution (0-40 points)
    riskScore += drought.level * 10;

    // Heat wave contribution (0-30 points)
    riskScore += heatWave.level * 10;

    // Low humidity contribution (0-20 points)
    if (currentWeather.humidity < 20) {
      riskScore += 20;
    } else if (currentWeather.humidity < 30) {
      riskScore += 15;
    } else if (currentWeather.humidity < 40) {
      riskScore += 10;
    } else if (currentWeather.humidity < 50) {
      riskScore += 5;
    }

    // Wind contribution (0-20 points)
    if (currentWeather.windSpeed >= 30) {
      riskScore += 20;
    } else if (currentWeather.windSpeed >= 20) {
      riskScore += 15;
    } else if (currentWeather.windSpeed >= 15) {
      riskScore += 10;
    } else if (currentWeather.windSpeed >= 10) {
      riskScore += 5;
    }

    // Recent precipitation reduces risk
    const { actualPrecipDays } = this.getPrecipitationHistory(region, date, 7);
    if (actualPrecipDays > 3) {
      riskScore -= 20;
    } else if (actualPrecipDays > 1) {
      riskScore -= 10;
    }

    // Clamp score
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Determine wildfire level
    let fireLevel;
    if (riskScore < 20) {
      fireLevel = WILDFIRE_LEVELS.NONE;
    } else if (riskScore < 40) {
      fireLevel = WILDFIRE_LEVELS.MODERATE;
    } else if (riskScore < 60) {
      fireLevel = WILDFIRE_LEVELS.HIGH;
    } else if (riskScore < 80) {
      fireLevel = WILDFIRE_LEVELS.VERY_HIGH;
    } else {
      fireLevel = WILDFIRE_LEVELS.EXTREME;
    }

    return {
      ...fireLevel,
      riskScore,
      factors: {
        droughtContribution: drought.level * 10,
        heatContribution: heatWave.level * 10,
        humidityContribution: currentWeather.humidity < 50 ? Math.round((50 - currentWeather.humidity) / 2.5) : 0,
        windContribution: currentWeather.windSpeed >= 10 ? Math.min(20, Math.round((currentWeather.windSpeed - 10) / 1.5)) : 0,
        recentRainReduction: actualPrecipDays > 1 ? (actualPrecipDays > 3 ? -20 : -10) : 0
      },
      gameplayImpacts: this.getWildfireGameplayImpacts(fireLevel)
    };
  }

  /**
   * Get precipitation history for a region over N days
   * @param {Object} region - Region data
   * @param {Object} date - End date (count backwards from here)
   * @param {number} days - Number of days to look back
   * @returns {Object} Precipitation statistics
   */
  getPrecipitationHistory(region, date, days) {
    let actualPrecipDays = 0;
    let heavyPrecipDays = 0;

    // Calculate expected precipitation rate for this biome/season
    const expectedPrecipRate = this.getExpectedPrecipitationRate(region, date);
    const expectedPrecipDays = Math.round(days * expectedPrecipRate);

    // Look back through each day
    for (let i = 0; i < days; i++) {
      // Go back i days
      const checkDate = advanceDate(date, -i * 24);

      // Check noon weather for that day
      const dayWeather = this.weatherGenerator.generateWeather(region, { ...checkDate, hour: 12 });

      if (dayWeather.precipitation) {
        actualPrecipDays++;
        if (dayWeather.precipitationIntensity === 'heavy') {
          heavyPrecipDays++;
        }
      }
    }

    return {
      actualPrecipDays,
      expectedPrecipDays,
      heavyPrecipDays
    };
  }

  /**
   * Get expected precipitation rate for a biome in the current season
   * @param {Object} region - Region data
   * @param {Object} date - Current date
   * @returns {number} Expected precipitation rate (0-1)
   */
  getExpectedPrecipitationRate(region, date) {
    const climate = region.climate || region.parameters || {};
    const specialFactors = climate.specialFactors || {};
    const humidity = climate.humidityProfile || {};

    // Get current season
    const season = this.getSeason(date.month);

    // Base rate from humidity profile
    const seasonalHumidity = humidity[season];
    let baseRate = 0.3; // Default 30% chance

    if (seasonalHumidity) {
      // Higher humidity = higher precipitation expectation
      baseRate = seasonalHumidity.mean / 200; // 50% humidity = 25% rate, 80% humidity = 40% rate
    }

    // Apply biome modifiers (similar to shouldPrecipitate logic)
    if (specialFactors.dryAir) {
      baseRate *= (1 - specialFactors.dryAir * 0.8);
    }
    if (specialFactors.permanentIce && specialFactors.permanentIce > 0.7) {
      baseRate *= 0.15;
    }
    if (specialFactors.coldOceanCurrent) {
      baseRate *= (1 - specialFactors.coldOceanCurrent * 0.85);
    }
    if (specialFactors.highRainfall) {
      baseRate *= 1.6;
    }
    if (specialFactors.hasMonsoonSeason) {
      if (season === 'summer') baseRate *= 2.5;
      else if (season === 'winter') baseRate *= 0.3;
    }

    return Math.max(0.05, Math.min(0.9, baseRate));
  }

  /**
   * Get temperature history to detect heat waves or cold snaps
   * @param {Object} region - Region data
   * @param {Object} date - Current date
   * @param {string} type - 'hot' or 'cold'
   * @returns {Object} Temperature statistics
   */
  getTemperatureHistory(region, date, type) {
    const lookbackDays = 14;
    let consecutiveDays = 0;
    let totalDeviation = 0;

    // Get expected seasonal temperature
    const expectedTemp = this.getExpectedSeasonalTemp(region, date);

    // Threshold for "significant" deviation (in °F)
    const threshold = type === 'hot' ? 10 : -10;

    // Count consecutive days meeting threshold, starting from today going backwards
    for (let i = 0; i < lookbackDays; i++) {
      const checkDate = advanceDate(date, -i * 24);
      const dayWeather = this.weatherGenerator.generateWeather(region, { ...checkDate, hour: 14 }); // Afternoon temp

      const deviation = dayWeather.temperature - expectedTemp;

      const meetsThreshold = type === 'hot'
        ? deviation >= threshold
        : deviation <= threshold;

      if (meetsThreshold) {
        if (i === consecutiveDays) { // Only count if truly consecutive from today
          consecutiveDays++;
          totalDeviation += Math.abs(deviation);
        }
      } else if (consecutiveDays === 0) {
        // Haven't started counting yet, keep going
        continue;
      } else {
        // Streak broken
        break;
      }
    }

    const avgDeviation = consecutiveDays > 0 ? totalDeviation / consecutiveDays : 0;

    return {
      consecutiveHotDays: type === 'hot' ? consecutiveDays : 0,
      consecutiveColdDays: type === 'cold' ? consecutiveDays : 0,
      tempAboveNormal: type === 'hot' ? avgDeviation : 0,
      tempBelowNormal: type === 'cold' ? avgDeviation : 0
    };
  }

  /**
   * Get expected seasonal temperature for a region
   * @param {Object} region - Region data
   * @param {Object} date - Current date
   * @returns {number} Expected temperature in °F
   */
  getExpectedSeasonalTemp(region, date) {
    const climate = region.climate || region.parameters || {};
    const tempProfile = climate.temperatureProfile || {};

    const season = this.getSeason(date.month);
    const seasonalTemp = tempProfile[season];

    if (seasonalTemp) {
      return seasonalTemp.mean;
    }

    // Fallback to annual mean
    return tempProfile.annual?.mean || 60;
  }

  /**
   * Get season from month
   */
  getSeason(month) {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }

  /**
   * Get gameplay impacts for drought
   */
  getDroughtGameplayImpacts(level) {
    const impacts = [];
    if (level.level >= 1) impacts.push('Water sources may be scarce');
    if (level.level >= 2) impacts.push('Crops and vegetation stressed', '+10% wildfire risk');
    if (level.level >= 3) impacts.push('Water rationing likely', 'Grazing animals affected', '+25% wildfire risk');
    if (level.level >= 4) impacts.push('Emergency water restrictions', 'Livestock deaths possible', 'Critical fire danger');
    return impacts;
  }

  /**
   * Get gameplay impacts for flooding
   */
  getFloodingGameplayImpacts(level) {
    const impacts = [];
    if (level.level >= 1) impacts.push('Low-lying areas soggy', 'Minor stream flooding');
    if (level.level >= 2) impacts.push('Roads may be impassable', 'Bridges at risk', 'Basement flooding');
    if (level.level >= 3) impacts.push('Evacuations likely', 'Severe property damage', 'Swift water dangers');
    return impacts;
  }

  /**
   * Get gameplay impacts for heat wave
   */
  getHeatWaveGameplayImpacts(level) {
    const impacts = [];
    if (level.level >= 1) impacts.push('Heat exhaustion risk for strenuous activity');
    if (level.level >= 2) impacts.push('Avoid midday exertion', 'Check on vulnerable individuals', 'Animals need extra water');
    if (level.level >= 3) impacts.push('Heat stroke danger', 'Outdoor work hazardous', 'Fire restrictions likely');
    return impacts;
  }

  /**
   * Get gameplay impacts for cold snap
   */
  getColdSnapGameplayImpacts(level) {
    const impacts = [];
    if (level.level >= 1) impacts.push('Frostbite risk with prolonged exposure');
    if (level.level >= 2) impacts.push('Pipes may freeze', 'Livestock need shelter', 'Limit outdoor time');
    if (level.level >= 3) impacts.push('Life-threatening cold', 'Frostbite in minutes', 'Emergency shelter needed');
    return impacts;
  }

  /**
   * Get gameplay impacts for wildfire risk
   */
  getWildfireGameplayImpacts(level) {
    const impacts = [];
    if (level.level >= 1) impacts.push('Campfires require caution');
    if (level.level >= 2) impacts.push('Open burning restricted', 'Watch for smoke');
    if (level.level >= 3) impacts.push('No open flames', 'Have evacuation plan ready');
    if (level.level >= 4) impacts.push('Extreme fire behavior possible', 'Evacuate if fire spotted');
    return impacts;
  }

  /**
   * Clear the conditions cache
   */
  clearCache() {
    this.conditionsCache.clear();
    this.weatherGenerator.clearCache();
  }
}

// Singleton instance
const environmentalConditionsService = new EnvironmentalConditionsService();
export default environmentalConditionsService;
