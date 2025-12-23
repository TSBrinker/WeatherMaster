/**
 * Test Runner
 * Core logic for running weather generation tests across all biomes
 */

import { regionTemplates } from '../../data/region-templates';
import { WeatherGenerator } from '../../services/weather/WeatherGenerator';
import { EnvironmentalConditionsService } from '../../services/weather/EnvironmentalConditionsService';
import { SnowAccumulationService } from '../../services/weather/SnowAccumulationService';
import { extractClimateProfile } from '../../data/templateHelpers';
import { TEST_CONFIG, THRESHOLDS, PRECIP_ANALYSIS_CONFIG } from './testConfig';
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
 * @returns {Promise<Object>} Test results
 */
export const runTests = async (onProgress) => {
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

  // Calculate total tests
  const totalBiomes = TEST_CONFIG.latitudeBands.reduce((sum, band) => {
    return sum + Object.keys(regionTemplates[band] || {}).length;
  }, 0);
  const totalTests = totalBiomes * TEST_CONFIG.daysToTest * TEST_CONFIG.hoursToTest.length;

  // Test each latitude band
  for (const latitudeBand of TEST_CONFIG.latitudeBands) {
    const templates = regionTemplates[latitudeBand];
    if (!templates) continue;

    // Test each biome
    for (const [templateId, template] of Object.entries(templates)) {
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
