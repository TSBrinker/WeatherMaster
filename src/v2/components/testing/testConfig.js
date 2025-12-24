/**
 * Test Harness Configuration
 * Centralized configuration for weather generation testing
 */

export const TEST_CONFIG = {
  year: 1,
  daysToTest: 365,
  hoursToTest: [0, 6, 12, 18], // Midnight, dawn, noon, dusk
  // Flat disc world latitude bands (center to edge)
  latitudeBands: ['polar', 'subarctic', 'boreal', 'temperate', 'subtropical', 'tropical', 'special'],
  // Seasonal transition windows (±5 days around each boundary)
  seasonalTransitionDays: {
    springEquinox: { center: 80, start: 75, end: 85 },
    summerSolstice: { center: 172, start: 167, end: 177 },
    fallEquinox: { center: 266, start: 261, end: 271 },
    winterSolstice: { center: 356, start: 351, end: 361 }
  }
};

/**
 * Configuration for precipitation/accumulation analysis
 * Used to diagnose snow accumulation and melt rate issues
 */
export const PRECIP_ANALYSIS_CONFIG = {
  // Duration of the analysis in hours (30 days = 720 hours)
  hoursToAnalyze: 720,
  // Start in mid-winter (January 15) for maximum cold weather exposure
  startDate: { year: 1, month: 1, day: 15, hour: 0 },
  // Only analyze biomes where winter mean temp is at or below this threshold
  freezingThreshold: 32,
  // Temperature threshold for snow vs rain transitions
  precipTransitionZone: { low: 28, high: 38 }
};

/**
 * Configuration for thunderstorm analysis
 * Tests thunderstorm-prone biomes during peak conditions
 */
export const THUNDERSTORM_CONFIG = {
  // Test summer months (peak thunderstorm season)
  startMonth: 6,
  startDay: 1,
  // 60 days covers June-July peak season
  daysToAnalyze: 60,
  // Focus on afternoon hours (peak convection)
  hoursToTest: [12, 14, 16, 18, 20],
  // Minimum thunderstorm factor to include biome
  minThunderstormFactor: 0.5,
  // Number of years to test (aggregates results for statistical validity)
  yearsToTest: 5
};

export const THRESHOLDS = {
  temperature: { min: -100, max: 150 },
  humidity: { min: 0, max: 100 },
  pressure: { min: 28, max: 32 },
  cloudCover: { min: 0, max: 100 },
  maxTempChangePerHour: 15, // Maximum realistic temp change in 1 hour
  maxWeeklySeasonalJump: 12, // Max weekly average temp change during season transitions
  expectedTempDeviation: 15, // Flag if annual avg deviates more than this from template
  biomeSimilarityThreshold: 3 // Flag biomes with avg temps within this range as similar
};
