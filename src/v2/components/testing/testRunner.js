/**
 * Test Runner
 * Core logic for running weather generation tests across all biomes
 */

import { regionTemplates } from '../../data/region-templates';
import { WeatherGenerator } from '../../services/weather/WeatherGenerator';
import { EnvironmentalConditionsService } from '../../services/weather/EnvironmentalConditionsService';
import { SnowAccumulationService } from '../../services/weather/SnowAccumulationService';
import { extractClimateProfile } from '../../data/templateHelpers';
import { TEST_CONFIG, THRESHOLDS, PRECIP_ANALYSIS_CONFIG, THUNDERSTORM_CONFIG, FLOOD_ANALYSIS_CONFIG, HEAT_INDEX_CONFIG } from './testConfig';
import { validateWeather } from './weatherValidation';

/**
 * Check if a day is within a seasonal transition window
 */
const isInSeasonalTransition = (dayOfYear) => {
  const windows = TEST_CONFIG.seasonalTransitionDays;
  for (const [, window] of Object.entries(windows)) {
    if (dayOfYear >= window.start && dayOfYear <= window.end) {
      return true;
    }
    // Handle year wraparound for winter solstice
    if (window.start > 350 && (dayOfYear >= window.start || dayOfYear <= 5)) {
      return true;
    }
  }
  return false;
};

/**
 * Get season from month number
 */
const getSeason = (month) => {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
};

/**
 * Calculate standard deviation of an array of values
 */
const calcStdDev = (values) => {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
};

/**
 * Initialize stats object for a biome
 */
const initBiomeStats = (latitudeBand, expectedAnnualTemp) => ({
  tempMin: Infinity,
  tempMax: -Infinity,
  tempSum: 0,
  count: 0,
  precipCount: 0,
  latitudeBand,
  expectedAnnualTemp,
  dailyTemps: [],
  seasonalTemps: { winter: [], spring: [], summer: [], fall: [] },
  currentDryStreak: 0,
  currentWetStreak: 0,
  longestDryStreak: 0,
  longestWetStreak: 0,
  lastPrecipState: null,
  seasonalTransitionTemps: {}
});

/**
 * Initialize precipitation streaks tracker
 */
const initPrecipStreaks = () => ({
  longestDry: 0,
  longestWet: 0,
  currentDry: 0,
  currentWet: 0
});

/**
 * Initialize environmental stats tracker
 */
const initEnvironmentalStats = () => ({
  droughtDays: { none: 0, abnormallyDry: 0, moderate: 0, severe: 0, extreme: 0 },
  floodingDays: { none: 0, elevated: 0, moderate: 0, high: 0 },
  heatWaveDays: { none: 0, advisory: 0, warning: 0, extreme: 0 },
  coldSnapDays: { none: 0, advisory: 0, warning: 0, extreme: 0 },
  wildfireDays: { low: 0, moderate: 0, high: 0, veryHigh: 0, extreme: 0 },
  maxDroughtLevel: 0,
  maxFloodLevel: 0,
  maxHeatLevel: 0,
  maxColdLevel: 0,
  maxFireLevel: 0
});

/**
 * Initialize snow stats tracker
 */
const initSnowStats = () => ({
  maxSnowDepth: 0,
  maxIceAccumulation: 0,
  daysWithSnow: 0,
  daysWithIce: 0,
  groundConditionCounts: {
    snowCovered: 0,
    icy: 0,
    frozen: 0,
    thawing: 0,
    muddy: 0,
    dry: 0
  }
});

/**
 * Track environmental conditions for a given day
 */
const trackEnvironmentalConditions = (envConditions, envStats) => {
  // Track drought levels
  const droughtLevel = envConditions.drought.level;
  if (droughtLevel === 0) envStats.droughtDays.none++;
  else if (droughtLevel === 1) envStats.droughtDays.abnormallyDry++;
  else if (droughtLevel === 2) envStats.droughtDays.moderate++;
  else if (droughtLevel === 3) envStats.droughtDays.severe++;
  else if (droughtLevel >= 4) envStats.droughtDays.extreme++;
  envStats.maxDroughtLevel = Math.max(envStats.maxDroughtLevel, droughtLevel);

  // Track flooding levels
  const floodLevel = envConditions.flooding.level;
  if (floodLevel === 0) envStats.floodingDays.none++;
  else if (floodLevel === 1) envStats.floodingDays.elevated++;
  else if (floodLevel === 2) envStats.floodingDays.moderate++;
  else if (floodLevel >= 3) envStats.floodingDays.high++;
  envStats.maxFloodLevel = Math.max(envStats.maxFloodLevel, floodLevel);

  // Track heat wave levels
  const heatLevel = envConditions.heatWave.level;
  if (heatLevel === 0) envStats.heatWaveDays.none++;
  else if (heatLevel === 1) envStats.heatWaveDays.advisory++;
  else if (heatLevel === 2) envStats.heatWaveDays.warning++;
  else if (heatLevel >= 3) envStats.heatWaveDays.extreme++;
  envStats.maxHeatLevel = Math.max(envStats.maxHeatLevel, heatLevel);

  // Track cold snap levels
  const coldLevel = envConditions.coldSnap.level;
  if (coldLevel === 0) envStats.coldSnapDays.none++;
  else if (coldLevel === 1) envStats.coldSnapDays.advisory++;
  else if (coldLevel === 2) envStats.coldSnapDays.warning++;
  else if (coldLevel >= 3) envStats.coldSnapDays.extreme++;
  envStats.maxColdLevel = Math.max(envStats.maxColdLevel, coldLevel);

  // Track wildfire risk levels
  const fireLevel = envConditions.wildfireRisk.level;
  if (fireLevel === 0) envStats.wildfireDays.low++;
  else if (fireLevel === 1) envStats.wildfireDays.moderate++;
  else if (fireLevel === 2) envStats.wildfireDays.high++;
  else if (fireLevel === 3) envStats.wildfireDays.veryHigh++;
  else if (fireLevel >= 4) envStats.wildfireDays.extreme++;
  envStats.maxFireLevel = Math.max(envStats.maxFireLevel, fireLevel);
};

/**
 * Track snow accumulation for a given day
 */
const trackSnowAccumulation = (snowAccum, snowStats) => {
  snowStats.maxSnowDepth = Math.max(snowStats.maxSnowDepth, snowAccum.snowDepth);
  snowStats.maxIceAccumulation = Math.max(snowStats.maxIceAccumulation, snowAccum.iceAccumulation);

  if (snowAccum.snowDepth >= 0.5) snowStats.daysWithSnow++;
  if (snowAccum.iceAccumulation >= 0.1) snowStats.daysWithIce++;

  const conditionName = snowAccum.groundCondition.name.toLowerCase().replace(' ', '');
  if (conditionName === 'snowcovered') snowStats.groundConditionCounts.snowCovered++;
  else if (conditionName === 'icy') snowStats.groundConditionCounts.icy++;
  else if (conditionName === 'frozen') snowStats.groundConditionCounts.frozen++;
  else if (conditionName === 'thawing') snowStats.groundConditionCounts.thawing++;
  else if (conditionName === 'muddy') snowStats.groundConditionCounts.muddy++;
  else snowStats.groundConditionCounts.dry++;
};

/**
 * Analyze seasonal transitions for abrupt temperature jumps
 */
const analyzeSeasonalTransitions = (stats) => {
  for (const [biomeName, biomeStats] of Object.entries(stats.biomeStats)) {
    const transitionTemps = biomeStats.seasonalTransitionTemps;
    const days = Object.keys(transitionTemps).map(Number).sort((a, b) => a - b);

    const seasonalWindows = TEST_CONFIG.seasonalTransitionDays;
    for (const [seasonName, window] of Object.entries(seasonalWindows)) {
      const beforeTemps = [];
      const afterTemps = [];

      for (const day of days) {
        const temp = transitionTemps[day];
        if (temp === undefined) continue;

        let effectiveDay = day;
        if (window.start > 350 && day <= 5) {
          effectiveDay = day + 365;
        }

        const effectiveEnd = window.start > 350 ? window.end + 365 : window.end;

        if (effectiveDay >= window.start && effectiveDay < window.center) {
          beforeTemps.push(temp);
        } else if (effectiveDay >= window.center && effectiveDay <= effectiveEnd) {
          afterTemps.push(temp);
        }
      }

      if (beforeTemps.length >= 3 && afterTemps.length >= 3) {
        const beforeAvg = beforeTemps.reduce((a, b) => a + b, 0) / beforeTemps.length;
        const afterAvg = afterTemps.reduce((a, b) => a + b, 0) / afterTemps.length;
        const weeklyChange = Math.abs(afterAvg - beforeAvg);

        if (weeklyChange > THRESHOLDS.maxWeeklySeasonalJump) {
          stats.seasonalTransitionAnomalies.push({
            biome: biomeName,
            latitudeBand: biomeStats.latitudeBand,
            season: seasonName,
            beforeAvg: beforeAvg.toFixed(1),
            afterAvg: afterAvg.toFixed(1),
            weeklyChange: weeklyChange.toFixed(1),
            daysAnalyzed: beforeTemps.length + afterTemps.length
          });
        }
      }
    }

    // Calculate temperature variance stats
    biomeStats.dailyTempVariance = calcStdDev(biomeStats.dailyTemps);
    biomeStats.seasonalVariance = {};
    for (const [season, temps] of Object.entries(biomeStats.seasonalTemps)) {
      biomeStats.seasonalVariance[season] = calcStdDev(temps);
    }

    // Calculate expected vs actual deviation
    const actualAvg = biomeStats.tempSum / biomeStats.count;
    biomeStats.actualAnnualTemp = actualAvg;
    if (biomeStats.expectedAnnualTemp !== undefined) {
      biomeStats.tempDeviation = actualAvg - biomeStats.expectedAnnualTemp;
    }
  }
};

/**
 * Find biomes with similar weather patterns
 */
const findBiomeSimilarities = (stats) => {
  const biomeNames = Object.keys(stats.biomeStats);
  for (let i = 0; i < biomeNames.length; i++) {
    for (let j = i + 1; j < biomeNames.length; j++) {
      const biome1 = biomeNames[i];
      const biome2 = biomeNames[j];
      const avg1 = stats.biomeStats[biome1].tempSum / stats.biomeStats[biome1].count;
      const avg2 = stats.biomeStats[biome2].tempSum / stats.biomeStats[biome2].count;
      const precip1 = (stats.biomeStats[biome1].precipCount / stats.biomeStats[biome1].count) * 100;
      const precip2 = (stats.biomeStats[biome2].precipCount / stats.biomeStats[biome2].count) * 100;

      const tempDiff = Math.abs(avg1 - avg2);
      const precipDiff = Math.abs(precip1 - precip2);

      if (tempDiff < THRESHOLDS.biomeSimilarityThreshold && precipDiff < 5) {
        stats.biomeSimilarities.push({
          biome1,
          biome2,
          avgTempDiff: tempDiff.toFixed(1),
          precipDiff: precipDiff.toFixed(1),
          band1: stats.biomeStats[biome1].latitudeBand,
          band2: stats.biomeStats[biome2].latitudeBand
        });
      }
    }
  }
};

/**
 * Identify biomes with issues
 */
const identifyProblemBiomes = (stats) => {
  for (const [biomeName, biomeStats] of Object.entries(stats.biomeStats)) {
    const problems = [];

    // Check expected vs actual deviation
    if (biomeStats.tempDeviation !== undefined &&
        Math.abs(biomeStats.tempDeviation) > THRESHOLDS.expectedTempDeviation) {
      problems.push(`Temp deviation: ${biomeStats.tempDeviation > 0 ? '+' : ''}${biomeStats.tempDeviation.toFixed(1)}°F from expected`);
    }

    // Check for validation anomalies
    const biomeAnomalies = stats.anomalies.filter(a => a.biome === biomeName);
    if (biomeAnomalies.length > 10) {
      problems.push(`${biomeAnomalies.length} validation anomalies`);
    }

    // Check for transition anomalies
    const biomeTransitions = stats.transitionAnomalies.filter(a => a.biome === biomeName);
    if (biomeTransitions.length > 5) {
      problems.push(`${biomeTransitions.length} hourly transition anomalies`);
    }

    // Check for seasonal transition anomalies
    const seasonalAnomalies = stats.seasonalTransitionAnomalies.filter(a => a.biome === biomeName);
    if (seasonalAnomalies.length > 0) {
      problems.push(`${seasonalAnomalies.length} abrupt seasonal transition(s)`);
    }

    // Check for extreme precipitation streaks
    const streaks = stats.precipitationStreaks[biomeName];
    const precipRate = biomeStats.precipCount / biomeStats.count;

    const wetStreakThreshold = Math.min(60, Math.max(14, Math.round(14 / (1 - precipRate + 0.01))));
    const dryStreakThreshold = Math.min(90, Math.max(14, Math.round(14 / (precipRate + 0.01))));

    if (streaks && streaks.longestWet > wetStreakThreshold) {
      problems.push(`Long wet streak: ${streaks.longestWet} days (threshold: ${wetStreakThreshold})`);
    }
    if (streaks && streaks.longestDry > dryStreakThreshold) {
      problems.push(`Long dry streak: ${streaks.longestDry} days (threshold: ${dryStreakThreshold})`);
    }

    if (problems.length > 0) {
      stats.problemBiomes.push({
        biome: biomeName,
        latitudeBand: biomeStats.latitudeBand,
        problems
      });
    }
  }
};

/**
 * Run the full test suite across all biomes
 * @param {Function} onProgress - Callback for progress updates (0-100)
 * @param {Object} options - Test options
 * @param {boolean} options.newOnly - Only test templates with isNew flag
 * @returns {Promise<Object>} Test results
 */
export const runTests = async (onProgress, options = {}) => {
  const { newOnly = false } = options;
  const stats = {
    totalTests: 0,
    successfulTests: 0,
    anomalies: [],
    transitionAnomalies: [],
    seasonalTransitionAnomalies: [],
    biomeStats: {},
    precipitationStreaks: {},
    biomeSimilarities: [],
    problemBiomes: [],
    environmentalStats: {},
    snowStats: {}
  };

  const weatherGen = new WeatherGenerator();
  const envService = new EnvironmentalConditionsService();
  const snowService = new SnowAccumulationService();
  let completedTests = 0;

  // Calculate total tests (accounting for filter)
  const totalBiomes = TEST_CONFIG.latitudeBands.reduce((sum, band) => {
    const templates = regionTemplates[band] || {};
    if (newOnly) {
      return sum + Object.values(templates).filter(t => t.isNew).length;
    }
    return sum + Object.keys(templates).length;
  }, 0);
  const totalTests = totalBiomes * TEST_CONFIG.daysToTest * TEST_CONFIG.hoursToTest.length;

  // Test each latitude band
  for (const latitudeBand of TEST_CONFIG.latitudeBands) {
    const templates = regionTemplates[latitudeBand];
    if (!templates) continue;

    // Test each biome
    for (const [templateId, template] of Object.entries(templates)) {
      // Skip non-new templates if filter is active
      if (newOnly && !template.isNew) continue;

      const biomeName = template.name;
      const expectedAnnualTemp = template.parameters?.temperatureProfile?.annual?.mean;

      // Initialize trackers
      if (!stats.biomeStats[biomeName]) {
        stats.biomeStats[biomeName] = initBiomeStats(latitudeBand, expectedAnnualTemp);
      }
      if (!stats.precipitationStreaks[biomeName]) {
        stats.precipitationStreaks[biomeName] = initPrecipStreaks();
      }
      if (!stats.environmentalStats[biomeName]) {
        stats.environmentalStats[biomeName] = initEnvironmentalStats();
      }
      if (!stats.snowStats[biomeName]) {
        stats.snowStats[biomeName] = initSnowStats();
      }

      const region = {
        id: `test-${latitudeBand}-${templateId}`,
        name: `Test ${biomeName}`,
        latitudeBand: latitudeBand,
        templateId: templateId,
        climate: extractClimateProfile(template)
      };

      let previousWeather = null;
      let previousDate = null;

      // Test full year
      for (let day = 1; day <= TEST_CONFIG.daysToTest; day++) {
        const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let remainingDays = day;
        let month = 0;
        while (remainingDays > monthDays[month]) {
          remainingDays -= monthDays[month];
          month++;
        }
        month++;

        for (const hour of TEST_CONFIG.hoursToTest) {
          const date = {
            year: TEST_CONFIG.year,
            month: month,
            day: remainingDays,
            hour: hour
          };

          try {
            const weather = weatherGen.generateWeather(region, date);
            const context = {
              biome: biomeName,
              latitudeBand: latitudeBand,
              date: `${date.month}/${date.day} ${date.hour}:00`
            };

            const validation = validateWeather(weather, context);

            stats.totalTests++;
            completedTests++;

            if (validation.isValid) {
              stats.successfulTests++;
            } else {
              stats.anomalies.push({ ...context, issues: validation.issues });
            }

            // Check temperature transition smoothness
            if (previousWeather && previousDate) {
              const tempChange = Math.abs(weather.temperature - previousWeather.temperature);
              const hoursDiff = (date.day - previousDate.day) * 24 + (date.hour - previousDate.hour);

              if (hoursDiff === 6) {
                const maxChangeAllowed = THRESHOLDS.maxTempChangePerHour * hoursDiff;

                if (tempChange > maxChangeAllowed) {
                  stats.transitionAnomalies.push({
                    biome: biomeName,
                    latitudeBand: latitudeBand,
                    from: `${previousDate.month}/${previousDate.day} ${previousDate.hour}:00`,
                    to: `${date.month}/${date.day} ${date.hour}:00`,
                    tempChange: `${previousWeather.temperature}°F → ${weather.temperature}°F (Δ${tempChange}°F)`,
                    precipChange: `${previousWeather.condition} → ${weather.condition}`
                  });
                }
              }
            }

            previousWeather = weather;
            previousDate = date;

            // Track biome stats
            const biomeStats = stats.biomeStats[biomeName];
            biomeStats.tempMin = Math.min(biomeStats.tempMin, weather.temperature);
            biomeStats.tempMax = Math.max(biomeStats.tempMax, weather.temperature);
            biomeStats.tempSum += weather.temperature;
            biomeStats.count++;
            if (weather.precipitation) {
              biomeStats.precipCount++;
            }

            // Track noon-specific data
            if (hour === 12) {
              biomeStats.dailyTemps.push(weather.temperature);
              const season = getSeason(date.month);
              biomeStats.seasonalTemps[season].push(weather.temperature);

              if (isInSeasonalTransition(day)) {
                biomeStats.seasonalTransitionTemps[day] = weather.temperature;
              }

              // Track precipitation streaks
              const streaks = stats.precipitationStreaks[biomeName];
              if (weather.precipitation) {
                streaks.currentWet++;
                streaks.longestWet = Math.max(streaks.longestWet, streaks.currentWet);
                streaks.currentDry = 0;
              } else {
                streaks.currentDry++;
                streaks.longestDry = Math.max(streaks.longestDry, streaks.currentDry);
                streaks.currentWet = 0;
              }

              // Track environmental conditions
              try {
                const envConditions = envService.getEnvironmentalConditions(region, date);
                trackEnvironmentalConditions(envConditions, stats.environmentalStats[biomeName]);
              } catch (envError) {
                console.warn(`Environmental check failed for ${biomeName}:`, envError.message);
              }

              // Track snow accumulation
              try {
                const snowAccum = snowService.getAccumulation(region, date);
                trackSnowAccumulation(snowAccum, stats.snowStats[biomeName]);
              } catch (snowError) {
                console.warn(`Snow check failed for ${biomeName}:`, snowError.message);
              }
            }

            // Update progress
            if (completedTests % 1000 === 0) {
              onProgress((completedTests / totalTests) * 100);
              await new Promise(resolve => setTimeout(resolve, 0));
            }

          } catch (error) {
            stats.anomalies.push({
              biome: biomeName,
              latitudeBand: latitudeBand,
              date: `${date.month}/${date.day} ${date.hour}:00`,
              issues: [`Exception: ${error.message}`]
            });
          }
        }
      }
    }
  }

  // Post-processing analysis
  analyzeSeasonalTransitions(stats);
  findBiomeSimilarities(stats);
  identifyProblemBiomes(stats);

  onProgress(100);
  return stats;
};

/**
 * Get biomes that experience freezing temperatures
 * Filters to biomes where winter mean temp is at or below the freezing threshold
 * @returns {Array} Array of {latitudeBand, templateId, template, biomeName, winterMean}
 */
const getColdClimateBiomes = () => {
  const coldBiomes = [];
  const threshold = PRECIP_ANALYSIS_CONFIG.freezingThreshold;

  for (const latitudeBand of TEST_CONFIG.latitudeBands) {
    const templates = regionTemplates[latitudeBand];
    if (!templates) continue;

    for (const [templateId, template] of Object.entries(templates)) {
      const winterMean = template.parameters?.temperatureProfile?.winter?.mean;

      // Include biomes where winter mean is at or below freezing
      if (winterMean !== undefined && winterMean <= threshold) {
        coldBiomes.push({
          latitudeBand,
          templateId,
          template,
          biomeName: template.name,
          winterMean
        });
      }
    }
  }

  return coldBiomes;
};

/**
 * Run precipitation and snow accumulation analysis
 * Captures hourly time-series data for cold-climate biomes over 30 days
 *
 * @param {Function} onProgress - Callback for progress updates (0-100)
 * @returns {Promise<Object>} Analysis results with time-series data per biome
 */
export const runPrecipitationAnalysis = async (onProgress) => {
  const { advanceDate } = await import('../../utils/dateUtils');

  const coldBiomes = getColdClimateBiomes();
  const hoursToAnalyze = PRECIP_ANALYSIS_CONFIG.hoursToAnalyze;
  const startDate = { ...PRECIP_ANALYSIS_CONFIG.startDate };

  const results = {
    config: {
      hoursAnalyzed: hoursToAnalyze,
      startDate: `${startDate.month}/${startDate.day} Year ${startDate.year}`,
      freezingThreshold: PRECIP_ANALYSIS_CONFIG.freezingThreshold,
      biomesAnalyzed: coldBiomes.length
    },
    biomes: {},
    summary: {
      totalPrecipTypeChanges: 0,
      totalRainOnSnowEvents: 0,
      maxSnowDepthObserved: 0,
      biomesWithFullMelt: []
    }
  };

  const weatherGen = new WeatherGenerator();
  const snowService = new SnowAccumulationService();

  let completedHours = 0;
  const totalOperations = coldBiomes.length * hoursToAnalyze;

  for (const biomeInfo of coldBiomes) {
    const { latitudeBand, templateId, template, biomeName, winterMean } = biomeInfo;

    // Create region object
    const region = {
      id: `precip-test-${latitudeBand}-${templateId}`,
      name: `Test ${biomeName}`,
      latitudeBand,
      templateId,
      climate: extractClimateProfile(template)
    };

    // Initialize biome results
    const biomeResult = {
      biomeName,
      latitudeBand,
      winterMean,
      timeSeries: [],
      stats: {
        hoursWithPrecip: 0,
        precipTypeBreakdown: { snow: 0, sleet: 0, rain: 0, 'freezing-rain': 0, none: 0 },
        precipTypeChanges: 0,
        rainOnSnowEvents: 0,
        maxSnowDepth: 0,
        maxMeltRate: 0,
        hoursAboveFreezing: 0,
        hoursBelowFreezing: 0,
        tempRange: { min: Infinity, max: -Infinity }
      }
    };

    let currentDate = { ...startDate };
    let previousPrecipType = null;
    let previousSnowDepth = 0;

    // Clear caches for clean run
    weatherGen.clearCache();
    snowService.clearCache();

    // Run hour-by-hour analysis
    for (let hour = 0; hour < hoursToAnalyze; hour++) {
      try {
        const weather = weatherGen.generateWeather(region, currentDate);
        const snowAccum = snowService.getAccumulation(region, currentDate);

        const precipType = weather.precipitation ? weather.precipitationType : 'none';
        const snowDepth = snowAccum.snowDepth;
        const meltAmount = previousSnowDepth > snowDepth ? previousSnowDepth - snowDepth : 0;

        // Track time series entry
        const entry = {
          hour,
          date: `${currentDate.month}/${currentDate.day} ${currentDate.hour}:00`,
          temperature: weather.temperature,
          precipType,
          precipIntensity: weather.precipitationIntensity || null,
          snowDepth,
          snowDepthChange: snowDepth - previousSnowDepth,
          meltAmount: Math.round(meltAmount * 100) / 100,
          groundCondition: snowAccum.groundCondition.name
        };
        biomeResult.timeSeries.push(entry);

        // Update stats
        if (weather.precipitation) {
          biomeResult.stats.hoursWithPrecip++;
        }
        biomeResult.stats.precipTypeBreakdown[precipType]++;

        if (previousPrecipType !== null && previousPrecipType !== precipType &&
            previousPrecipType !== 'none' && precipType !== 'none') {
          biomeResult.stats.precipTypeChanges++;
        }

        // Detect rain-on-snow events (rain while snow on ground)
        if (precipType === 'rain' && previousSnowDepth >= 0.5) {
          biomeResult.stats.rainOnSnowEvents++;
        }

        biomeResult.stats.maxSnowDepth = Math.max(biomeResult.stats.maxSnowDepth, snowDepth);
        biomeResult.stats.maxMeltRate = Math.max(biomeResult.stats.maxMeltRate, meltAmount);

        if (weather.temperature > 32) {
          biomeResult.stats.hoursAboveFreezing++;
        } else {
          biomeResult.stats.hoursBelowFreezing++;
        }

        biomeResult.stats.tempRange.min = Math.min(biomeResult.stats.tempRange.min, weather.temperature);
        biomeResult.stats.tempRange.max = Math.max(biomeResult.stats.tempRange.max, weather.temperature);

        previousPrecipType = precipType;
        previousSnowDepth = snowDepth;

      } catch (error) {
        biomeResult.timeSeries.push({
          hour,
          date: `${currentDate.month}/${currentDate.day} ${currentDate.hour}:00`,
          error: error.message
        });
      }

      currentDate = advanceDate(currentDate, 1);
      completedHours++;

      // Update progress every 50 hours
      if (completedHours % 50 === 0) {
        onProgress((completedHours / totalOperations) * 100);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    // Check for complete melt events (had snow, then went to 0)
    const hadSignificantSnow = biomeResult.stats.maxSnowDepth >= 5;
    const endedWithNoSnow = biomeResult.timeSeries[biomeResult.timeSeries.length - 1]?.snowDepth < 0.5;
    if (hadSignificantSnow && endedWithNoSnow) {
      results.summary.biomesWithFullMelt.push(biomeName);
    }

    // Update summary stats
    results.summary.totalPrecipTypeChanges += biomeResult.stats.precipTypeChanges;
    results.summary.totalRainOnSnowEvents += biomeResult.stats.rainOnSnowEvents;
    results.summary.maxSnowDepthObserved = Math.max(
      results.summary.maxSnowDepthObserved,
      biomeResult.stats.maxSnowDepth
    );

    results.biomes[biomeName] = biomeResult;
  }

  onProgress(100);
  return results;
};

/**
 * Get biomes with thunderstorm potential
 * @returns {Array} Array of biome info objects
 */
const getThunderstormBiomes = () => {
  const thunderstormBiomes = [];
  const minFactor = THUNDERSTORM_CONFIG.minThunderstormFactor;

  for (const latitudeBand of TEST_CONFIG.latitudeBands) {
    const templates = regionTemplates[latitudeBand];
    if (!templates) continue;

    for (const [templateId, template] of Object.entries(templates)) {
      const thunderstormFactor = template.parameters?.specialFactors?.thunderstorms || 0;

      if (thunderstormFactor >= minFactor) {
        thunderstormBiomes.push({
          latitudeBand,
          templateId,
          template,
          biomeName: template.name,
          thunderstormFactor
        });
      }
    }
  }

  return thunderstormBiomes;
};

/**
 * Run thunderstorm analysis on biomes with thunderstorm potential
 * Tests during summer afternoons for peak thunderstorm conditions
 *
 * @param {Function} onProgress - Callback for progress updates (0-100)
 * @returns {Promise<Object>} Analysis results
 */
export const runThunderstormAnalysis = async (onProgress) => {
  const { advanceDate } = await import('../../utils/dateUtils');

  const thunderstormBiomes = getThunderstormBiomes();
  const { daysToAnalyze, hoursToTest, startMonth, startDay, yearsToTest } = THUNDERSTORM_CONFIG;

  const results = {
    config: {
      daysAnalyzed: daysToAnalyze,
      hoursPerDay: hoursToTest.length,
      yearsAnalyzed: yearsToTest,
      startDate: `${startMonth}/${startDay} (Years 1-${yearsToTest})`,
      biomesAnalyzed: thunderstormBiomes.length
    },
    biomes: {},
    summary: {
      totalThunderstorms: 0,
      totalHeavyRain: 0,
      totalTestHours: 0,
      overallThunderstormRate: 0,
      biomeWithMostThunderstorms: null,
      maxThunderstormsInBiome: 0
    }
  };

  const weatherGen = new WeatherGenerator();

  let completedTests = 0;
  const totalTests = thunderstormBiomes.length * daysToAnalyze * hoursToTest.length * yearsToTest;

  for (const biomeInfo of thunderstormBiomes) {
    const { latitudeBand, templateId, template, biomeName, thunderstormFactor } = biomeInfo;

    const region = {
      id: `thunderstorm-test-${latitudeBand}-${templateId}`,
      name: `Test ${biomeName}`,
      latitudeBand,
      templateId,
      climate: extractClimateProfile(template)
    };

    const biomeResult = {
      biomeName,
      latitudeBand,
      thunderstormFactor,
      stats: {
        totalHours: 0,
        thunderstormHours: 0,
        heavyRainHours: 0,
        moderateRainHours: 0,
        lightRainHours: 0,
        noRainHours: 0,
        thunderstormRate: 0,
        conversionRate: 0, // % of heavy rain that became thunderstorms
        avgTempDuringThunderstorms: 0,
        thunderstormsByHour: {},
        severityBreakdown: { normal: 0, strong: 0, severe: 0 }
      },
      thunderstormEvents: []
    };

    // Initialize hourly tracking
    for (const hour of hoursToTest) {
      biomeResult.stats.thunderstormsByHour[hour] = 0;
    }

    weatherGen.clearCache();

    let thunderstormTemps = [];

    // Test across multiple years for statistical validity
    for (let year = 1; year <= yearsToTest; year++) {
      let currentDate = { year, month: startMonth, day: startDay, hour: 0 };

      for (let day = 0; day < daysToAnalyze; day++) {
        for (const hour of hoursToTest) {
          const testDate = { ...currentDate, hour };

          try {
            const weather = weatherGen.generateWeather(region, testDate);
            biomeResult.stats.totalHours++;

            if (weather.condition === 'Thunderstorm') {
              biomeResult.stats.thunderstormHours++;
              biomeResult.stats.thunderstormsByHour[hour]++;
              thunderstormTemps.push(weather.temperature);

              // Determine severity from effects
              let severity = 'normal';
              if (weather.effects.some(e => e.includes('Severe Thunderstorm'))) {
                severity = 'severe';
              } else if (weather.effects.some(e => e.includes('Strong Thunderstorm'))) {
                severity = 'strong';
              }
              biomeResult.stats.severityBreakdown[severity]++;

              biomeResult.thunderstormEvents.push({
                date: `Y${year} ${testDate.month}/${testDate.day} ${hour}:00`,
                temperature: weather.temperature,
                windSpeed: weather.windSpeed,
                severity
              });
            } else if (weather.condition === 'Heavy Rain') {
              biomeResult.stats.heavyRainHours++;
            } else if (weather.condition === 'Rain') {
              biomeResult.stats.moderateRainHours++;
            } else if (weather.condition === 'Light Rain') {
              biomeResult.stats.lightRainHours++;
            } else {
              biomeResult.stats.noRainHours++;
            }

          } catch (error) {
            console.warn(`Thunderstorm test error for ${biomeName}:`, error.message);
          }

          completedTests++;
        }

        // Advance to next day
        currentDate = advanceDate({ ...currentDate, hour: 0 }, 24);

        // Update progress periodically
        if (completedTests % 100 === 0) {
          onProgress((completedTests / totalTests) * 100);
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }

    // Calculate rates
    biomeResult.stats.thunderstormRate =
      (biomeResult.stats.thunderstormHours / biomeResult.stats.totalHours) * 100;

    const totalHeavyRainOpportunities =
      biomeResult.stats.thunderstormHours + biomeResult.stats.heavyRainHours;
    biomeResult.stats.conversionRate = totalHeavyRainOpportunities > 0
      ? (biomeResult.stats.thunderstormHours / totalHeavyRainOpportunities) * 100
      : 0;

    biomeResult.stats.avgTempDuringThunderstorms = thunderstormTemps.length > 0
      ? Math.round(thunderstormTemps.reduce((a, b) => a + b, 0) / thunderstormTemps.length)
      : null;

    // Update summary
    results.summary.totalThunderstorms += biomeResult.stats.thunderstormHours;
    results.summary.totalHeavyRain += biomeResult.stats.heavyRainHours;
    results.summary.totalTestHours += biomeResult.stats.totalHours;

    if (biomeResult.stats.thunderstormHours > results.summary.maxThunderstormsInBiome) {
      results.summary.maxThunderstormsInBiome = biomeResult.stats.thunderstormHours;
      results.summary.biomeWithMostThunderstorms = biomeName;
    }

    results.biomes[biomeName] = biomeResult;
  }

  results.summary.overallThunderstormRate =
    (results.summary.totalThunderstorms / results.summary.totalTestHours) * 100;

  onProgress(100);
  return results;
};

/**
 * Get biomes that can experience snow/freezing conditions
 * @returns {Array} Array of biome info objects
 */
const getSnowCapableBiomes = () => {
  const snowBiomes = [];
  const threshold = FLOOD_ANALYSIS_CONFIG.winterTempThreshold;

  for (const latitudeBand of TEST_CONFIG.latitudeBands) {
    const templates = regionTemplates[latitudeBand];
    if (!templates) continue;

    for (const [templateId, template] of Object.entries(templates)) {
      const winterMean = template.parameters?.temperatureProfile?.winter?.mean;

      if (winterMean !== undefined && winterMean <= threshold) {
        snowBiomes.push({
          latitudeBand,
          templateId,
          template,
          biomeName: template.name,
          winterMean
        });
      }
    }
  }

  return snowBiomes;
};

/**
 * Run flood risk analysis
 * Validates that flood alerts correlate with actual flood-causing conditions
 *
 * Tracks:
 * - Flood alerts triggered while snow is accumulating (FALSE POSITIVES)
 * - Rapid snow melt without flood alerts (MISSED ALERTS)
 * - Rain-on-snow events and their flood response
 * - Correlation between flood level and actual water release
 *
 * @param {Function} onProgress - Callback for progress updates (0-100)
 * @returns {Promise<Object>} Analysis results
 */
export const runFloodAnalysis = async (onProgress) => {
  const { advanceDate } = await import('../../utils/dateUtils');

  const snowBiomes = getSnowCapableBiomes();
  const { daysToAnalyze, hourToCheck, startDate, thresholds } = FLOOD_ANALYSIS_CONFIG;

  const results = {
    config: {
      daysAnalyzed: daysToAnalyze,
      startDate: `${startDate.month}/${startDate.day} Year ${startDate.year}`,
      biomesAnalyzed: snowBiomes.length,
      thresholds
    },
    biomes: {},
    summary: {
      totalDaysAnalyzed: 0,
      totalFloodAlerts: 0,
      suspiciousAlerts: 0,        // Flood alerts when conditions don't warrant them
      missedAlerts: 0,            // Rapid melt without flood alert
      correctAlerts: 0,           // Flood alerts that seem appropriate
      correctNoAlerts: 0,         // No alert when conditions are stable
      falsePositiveRate: 0,
      missedAlertRate: 0
    },
    issues: []  // Specific problematic scenarios found
  };

  const weatherGen = new WeatherGenerator();
  const envService = new EnvironmentalConditionsService();
  const snowService = new SnowAccumulationService();

  let completedDays = 0;
  const totalOperations = snowBiomes.length * daysToAnalyze;

  for (const biomeInfo of snowBiomes) {
    const { latitudeBand, templateId, template, biomeName, winterMean } = biomeInfo;

    const region = {
      id: `flood-test-${latitudeBand}-${templateId}`,
      name: `Test ${biomeName}`,
      latitudeBand,
      templateId,
      climate: extractClimateProfile(template)
    };

    const biomeResult = {
      biomeName,
      latitudeBand,
      winterMean,
      timeSeries: [],
      stats: {
        daysWithFloodAlert: 0,
        daysWithSnowAccumulating: 0,
        daysWithRapidMelt: 0,
        daysWithRainOnSnow: 0,
        suspiciousAlerts: 0,      // Alert when snow accumulating & frozen
        missedAlerts: 0,          // Rapid melt with no alert
        correctAlerts: 0,
        correctNoAlerts: 0
      },
      suspiciousEvents: [],
      missedEvents: []
    };

    // Clear caches
    weatherGen.clearCache();
    envService.clearCache();
    snowService.clearCache();

    let currentDate = { ...startDate };
    let previousSnowDepth = 0;
    const recentSnowDepths = []; // Track last 3 days for melt rate

    for (let day = 0; day < daysToAnalyze; day++) {
      const testDate = { ...currentDate, hour: hourToCheck };

      try {
        const weather = weatherGen.generateWeather(region, testDate);
        const envConditions = envService.getEnvironmentalConditions(region, testDate);
        const snowAccum = snowService.getAccumulation(region, testDate);

        const temp = weather.temperature;
        const snowDepth = snowAccum.snowDepth;
        const floodLevel = envConditions.flooding.level;
        const precipType = weather.precipitation ? weather.precipitationType : 'none';

        // Calculate melt rate (snow depth change over last 3 days)
        recentSnowDepths.push(snowDepth);
        if (recentSnowDepths.length > 3) recentSnowDepths.shift();

        const meltRate = recentSnowDepths.length >= 2
          ? Math.max(0, recentSnowDepths[0] - snowDepth)
          : 0;

        const snowDepthDrop3Day = recentSnowDepths.length >= 3
          ? Math.max(0, recentSnowDepths[0] - snowDepth)
          : 0;

        // Analyze conditions
        const isFreezing = temp <= thresholds.freezingTemp;
        const hasSignificantSnow = snowDepth >= thresholds.snowDepthForSuppression;
        const isSnowAccumulating = snowDepth > previousSnowDepth && isFreezing;
        const isRapidMelt = snowDepthDrop3Day >= thresholds.rapidMeltThreshold;
        const isRainOnSnow = precipType === 'rain' && hasSignificantSnow;

        // Determine if alert is appropriate
        let alertAssessment = 'unknown';

        if (floodLevel > 0) {
          biomeResult.stats.daysWithFloodAlert++;

          // SUSPICIOUS: Flood alert while snow is accumulating and it's freezing
          if (isSnowAccumulating && isFreezing && !isRainOnSnow) {
            alertAssessment = 'suspicious';
            biomeResult.stats.suspiciousAlerts++;
            biomeResult.suspiciousEvents.push({
              date: `${testDate.month}/${testDate.day}`,
              floodLevel,
              temp,
              snowDepth,
              precipType,
              reason: 'Flood alert while snow accumulating in freezing temps'
            });
          }
          // SUSPICIOUS: Flood alert with heavy snow on ground and freezing, no melt
          else if (hasSignificantSnow && isFreezing && meltRate === 0 && !isRainOnSnow) {
            alertAssessment = 'suspicious';
            biomeResult.stats.suspiciousAlerts++;
            biomeResult.suspiciousEvents.push({
              date: `${testDate.month}/${testDate.day}`,
              floodLevel,
              temp,
              snowDepth,
              precipType,
              reason: 'Flood alert with frozen snow cover, no melt occurring'
            });
          }
          // CORRECT: Flood alert during rapid melt or rain-on-snow
          else if (isRapidMelt || isRainOnSnow) {
            alertAssessment = 'correct';
            biomeResult.stats.correctAlerts++;
          }
          // CORRECT: Flood alert when above freezing with precipitation
          else if (!isFreezing && weather.precipitation) {
            alertAssessment = 'correct';
            biomeResult.stats.correctAlerts++;
          }
          // Unclear - count as correct (benefit of doubt)
          else {
            alertAssessment = 'correct';
            biomeResult.stats.correctAlerts++;
          }
        } else {
          // No flood alert

          // MISSED: Rapid melt happening but no alert
          if (isRapidMelt && !isFreezing) {
            alertAssessment = 'missed';
            biomeResult.stats.missedAlerts++;
            biomeResult.missedEvents.push({
              date: `${testDate.month}/${testDate.day}`,
              temp,
              snowDepth,
              snowDepthDrop3Day,
              reason: `Rapid melt (${snowDepthDrop3Day.toFixed(1)}" in 3 days) with no flood alert`
            });
          }
          // MISSED: Heavy rain on significant snow
          else if (isRainOnSnow && weather.precipitationIntensity === 'heavy') {
            alertAssessment = 'missed';
            biomeResult.stats.missedAlerts++;
            biomeResult.missedEvents.push({
              date: `${testDate.month}/${testDate.day}`,
              temp,
              snowDepth,
              precipType,
              reason: 'Heavy rain on snow with no flood alert'
            });
          }
          // CORRECT: No alert when conditions are stable
          else {
            alertAssessment = 'correct-none';
            biomeResult.stats.correctNoAlerts++;
          }
        }

        // Track other stats
        if (isSnowAccumulating) biomeResult.stats.daysWithSnowAccumulating++;
        if (isRapidMelt) biomeResult.stats.daysWithRapidMelt++;
        if (isRainOnSnow) biomeResult.stats.daysWithRainOnSnow++;

        // Record time series entry
        biomeResult.timeSeries.push({
          day,
          date: `${testDate.month}/${testDate.day}`,
          temp,
          snowDepth: Math.round(snowDepth * 10) / 10,
          snowChange: Math.round((snowDepth - previousSnowDepth) * 10) / 10,
          precipType,
          floodLevel,
          floodName: envConditions.flooding.name,
          alertAssessment
        });

        previousSnowDepth = snowDepth;

      } catch (error) {
        biomeResult.timeSeries.push({
          day,
          date: `${currentDate.month}/${currentDate.day}`,
          error: error.message
        });
      }

      currentDate = advanceDate(currentDate, 24);
      completedDays++;

      if (completedDays % 50 === 0) {
        onProgress((completedDays / totalOperations) * 100);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    // Add to summary
    results.summary.totalDaysAnalyzed += daysToAnalyze;
    results.summary.totalFloodAlerts += biomeResult.stats.daysWithFloodAlert;
    results.summary.suspiciousAlerts += biomeResult.stats.suspiciousAlerts;
    results.summary.missedAlerts += biomeResult.stats.missedAlerts;
    results.summary.correctAlerts += biomeResult.stats.correctAlerts;
    results.summary.correctNoAlerts += biomeResult.stats.correctNoAlerts;

    // Flag biomes with significant issues
    if (biomeResult.stats.suspiciousAlerts > 5 || biomeResult.stats.missedAlerts > 3) {
      results.issues.push({
        biomeName,
        suspiciousAlerts: biomeResult.stats.suspiciousAlerts,
        missedAlerts: biomeResult.stats.missedAlerts,
        sampleSuspicious: biomeResult.suspiciousEvents.slice(0, 3),
        sampleMissed: biomeResult.missedEvents.slice(0, 3)
      });
    }

    results.biomes[biomeName] = biomeResult;
  }

  // Calculate rates
  const totalAlerts = results.summary.totalFloodAlerts;
  const totalMeltOpportunities = Object.values(results.biomes)
    .reduce((sum, b) => sum + b.stats.daysWithRapidMelt + b.stats.daysWithRainOnSnow, 0);

  results.summary.falsePositiveRate = totalAlerts > 0
    ? (results.summary.suspiciousAlerts / totalAlerts) * 100
    : 0;

  results.summary.missedAlertRate = totalMeltOpportunities > 0
    ? (results.summary.missedAlerts / totalMeltOpportunities) * 100
    : 0;

  onProgress(100);
  return results;
};

/**
 * Get biomes that can have significant heat (summer mean >= threshold)
 * These are biomes where heat index matters
 */
const getHotClimateBiomes = () => {
  const hotBiomes = [];
  const threshold = HEAT_INDEX_CONFIG.minSummerMean;

  for (const latitudeBand of TEST_CONFIG.latitudeBands) {
    const templates = regionTemplates[latitudeBand];
    if (!templates) continue;

    for (const [templateId, template] of Object.entries(templates)) {
      const summerMean = template.parameters?.temperatureProfile?.summer?.mean;
      const hasDewPointProfile = !!template.parameters?.dewPointProfile;

      if (summerMean !== undefined && summerMean >= threshold) {
        hotBiomes.push({
          latitudeBand,
          templateId,
          template,
          biomeName: template.name,
          summerMean,
          hasDewPointProfile
        });
      }
    }
  }

  return hotBiomes;
};

/**
 * Run heat index / dew point analysis
 * Tests that the dew point-based humidity system produces realistic heat indices
 *
 * @param {Function} onProgress - Callback for progress updates (0-100)
 * @returns {Promise<Object>} Analysis results
 */
export const runHeatIndexAnalysis = async (onProgress) => {
  const { advanceDate } = await import('../../utils/dateUtils');

  const hotBiomes = getHotClimateBiomes();
  const { daysToAnalyze, hoursToTest, startMonth, startDay, yearsToTest, feelsLikeDifferenceThreshold } = HEAT_INDEX_CONFIG;

  const results = {
    config: {
      daysAnalyzed: daysToAnalyze,
      hoursPerDay: hoursToTest.length,
      yearsAnalyzed: yearsToTest,
      startDate: `${startMonth}/${startDay} (Years 1-${yearsToTest})`,
      biomesAnalyzed: hotBiomes.length,
      feelsLikeThreshold: feelsLikeDifferenceThreshold
    },
    biomes: {},
    summary: {
      totalTestHours: 0,
      hoursAbove80F: 0,
      hoursWithHeatIndex: 0,
      hoursShowingFeelsLike: 0,
      maxHeatIndex: 0,
      maxHeatIndexBiome: null,
      avgHumidityWhenHot: 0,
      avgDewPointWhenHot: 0,
      biomesWithNoFeelsLike: []
    }
  };

  const weatherGen = new WeatherGenerator();

  let completedTests = 0;
  const totalTests = hotBiomes.length * daysToAnalyze * hoursToTest.length * yearsToTest;

  // Track global stats
  let totalHotHours = 0;
  let totalHumidityWhenHot = 0;
  let totalDewPointWhenHot = 0;

  for (const biomeInfo of hotBiomes) {
    const { latitudeBand, templateId, template, biomeName, summerMean, hasDewPointProfile } = biomeInfo;

    const region = {
      id: `heatindex-test-${latitudeBand}-${templateId}`,
      name: `Test ${biomeName}`,
      latitudeBand,
      templateId,
      climate: extractClimateProfile(template)
    };

    const biomeResult = {
      biomeName,
      latitudeBand,
      summerMean,
      hasDewPointProfile,
      stats: {
        totalHours: 0,
        hoursAbove80F: 0,
        hoursAbove90F: 0,
        hoursAbove100F: 0,
        hoursWithFeelsLikeShowing: 0,
        maxTemp: 0,
        maxHeatIndex: 0,
        maxHeatIndexDiff: 0,
        avgHumidityWhenHot: 0,
        avgDewPointWhenHot: 0,
        humidityRange: { min: 100, max: 0 },
        dewPointRange: { min: 100, max: -50 },
        heatIndexRange: { min: 200, max: 0 }
      },
      significantHeatEvents: [], // Times when feels like showed
      hotDryEvents: [], // Hot but low humidity (no heat index boost)
      samples: [] // Sample data points for debugging
    };

    weatherGen.clearCache();

    let hotHumiditySum = 0;
    let hotDewPointSum = 0;
    let hotHoursCount = 0;

    for (let year = 1; year <= yearsToTest; year++) {
      let currentDate = { year, month: startMonth, day: startDay, hour: 0 };

      for (let day = 0; day < daysToAnalyze; day++) {
        for (const hour of hoursToTest) {
          const testDate = { ...currentDate, hour };

          try {
            const weather = weatherGen.generateWeather(region, testDate);
            biomeResult.stats.totalHours++;

            const temp = weather.temperature;
            const humidity = weather.humidity;
            const dewPoint = weather.dewPoint;
            const feelsLike = weather.feelsLike;
            const heatIndexDiff = feelsLike - temp;

            // Track humidity/dewpoint ranges
            biomeResult.stats.humidityRange.min = Math.min(biomeResult.stats.humidityRange.min, humidity);
            biomeResult.stats.humidityRange.max = Math.max(biomeResult.stats.humidityRange.max, humidity);
            biomeResult.stats.dewPointRange.min = Math.min(biomeResult.stats.dewPointRange.min, dewPoint);
            biomeResult.stats.dewPointRange.max = Math.max(biomeResult.stats.dewPointRange.max, dewPoint);

            // Track temps above 80F (heat index threshold)
            if (temp >= 80) {
              biomeResult.stats.hoursAbove80F++;
              hotHumiditySum += humidity;
              hotDewPointSum += dewPoint;
              hotHoursCount++;

              // Track heat index range
              biomeResult.stats.heatIndexRange.min = Math.min(biomeResult.stats.heatIndexRange.min, feelsLike);
              biomeResult.stats.heatIndexRange.max = Math.max(biomeResult.stats.heatIndexRange.max, feelsLike);

              if (temp >= 90) biomeResult.stats.hoursAbove90F++;
              if (temp >= 100) biomeResult.stats.hoursAbove100F++;

              // Would "Feels Like" show in UI?
              if (heatIndexDiff >= feelsLikeDifferenceThreshold) {
                biomeResult.stats.hoursWithFeelsLikeShowing++;
                results.summary.hoursShowingFeelsLike++;

                // Record significant heat events (limit to avoid huge arrays)
                if (biomeResult.significantHeatEvents.length < 20) {
                  biomeResult.significantHeatEvents.push({
                    date: `Y${year} ${testDate.month}/${testDate.day} ${hour}:00`,
                    temp,
                    humidity,
                    dewPoint,
                    feelsLike,
                    diff: heatIndexDiff
                  });
                }
              } else if (temp >= 90 && biomeResult.hotDryEvents.length < 10) {
                // Hot but no significant heat index - record for debugging
                biomeResult.hotDryEvents.push({
                  date: `Y${year} ${testDate.month}/${testDate.day} ${hour}:00`,
                  temp,
                  humidity,
                  dewPoint,
                  feelsLike,
                  diff: heatIndexDiff,
                  reason: humidity < 40 ? 'Low humidity' : 'Moderate humidity'
                });
              }
            }

            // Track max values
            if (temp > biomeResult.stats.maxTemp) {
              biomeResult.stats.maxTemp = temp;
            }
            if (feelsLike > biomeResult.stats.maxHeatIndex) {
              biomeResult.stats.maxHeatIndex = feelsLike;
            }
            if (heatIndexDiff > biomeResult.stats.maxHeatIndexDiff) {
              biomeResult.stats.maxHeatIndexDiff = heatIndexDiff;
            }

            // Sample some data points
            if (biomeResult.samples.length < 10 && temp >= 85 && day % 10 === 0) {
              biomeResult.samples.push({
                date: `Y${year} ${testDate.month}/${testDate.day} ${hour}:00`,
                temp, humidity, dewPoint, feelsLike, diff: heatIndexDiff
              });
            }

          } catch (error) {
            console.warn(`Heat index test error for ${biomeName}:`, error.message);
          }

          completedTests++;
          if (completedTests % 500 === 0) {
            onProgress((completedTests / totalTests) * 100);
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }

        currentDate = advanceDate(currentDate, 24);
      }
    }

    // Calculate averages for this biome
    if (hotHoursCount > 0) {
      biomeResult.stats.avgHumidityWhenHot = Math.round(hotHumiditySum / hotHoursCount);
      biomeResult.stats.avgDewPointWhenHot = Math.round(hotDewPointSum / hotHoursCount);
    }

    // Update global stats
    results.summary.totalTestHours += biomeResult.stats.totalHours;
    results.summary.hoursAbove80F += biomeResult.stats.hoursAbove80F;
    totalHotHours += hotHoursCount;
    totalHumidityWhenHot += hotHumiditySum;
    totalDewPointWhenHot += hotDewPointSum;

    if (biomeResult.stats.maxHeatIndex > results.summary.maxHeatIndex) {
      results.summary.maxHeatIndex = biomeResult.stats.maxHeatIndex;
      results.summary.maxHeatIndexBiome = biomeName;
    }

    // Flag biomes that never showed "Feels Like"
    if (biomeResult.stats.hoursAbove80F > 100 && biomeResult.stats.hoursWithFeelsLikeShowing === 0) {
      results.summary.biomesWithNoFeelsLike.push({
        biomeName,
        hoursAbove80F: biomeResult.stats.hoursAbove80F,
        maxTemp: biomeResult.stats.maxTemp,
        maxHeatIndex: biomeResult.stats.maxHeatIndex,
        avgHumidity: biomeResult.stats.avgHumidityWhenHot,
        avgDewPoint: biomeResult.stats.avgDewPointWhenHot
      });
    }

    results.biomes[biomeName] = biomeResult;
  }

  // Calculate global averages
  if (totalHotHours > 0) {
    results.summary.avgHumidityWhenHot = Math.round(totalHumidityWhenHot / totalHotHours);
    results.summary.avgDewPointWhenHot = Math.round(totalDewPointWhenHot / totalHotHours);
  }

  results.summary.hoursWithHeatIndex = results.summary.hoursAbove80F;
  results.summary.feelsLikeShowRate = results.summary.hoursAbove80F > 0
    ? ((results.summary.hoursShowingFeelsLike / results.summary.hoursAbove80F) * 100).toFixed(1) + '%'
    : '0%';

  onProgress(100);
  return results;
};
