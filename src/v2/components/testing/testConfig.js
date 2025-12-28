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

/**
 * Configuration for flood risk analysis
 * Tests flood calculation accuracy across different scenarios:
 * - Winter with snow accumulation (should NOT trigger flood alerts)
 * - Spring thaw with rapid snow melt (SHOULD trigger flood alerts)
 * - Rain-on-snow events (SHOULD trigger flood alerts)
 * - Normal rainfall periods (depends on amount)
 */
export const FLOOD_ANALYSIS_CONFIG = {
  // Test late winter through spring (Jan 15 - Apr 15) to capture thaw
  startDate: { year: 1, month: 1, day: 15, hour: 0 },
  // 90 days covers deep winter through spring thaw
  daysToAnalyze: 90,
  // Check at noon daily for consistency
  hourToCheck: 12,
  // Only analyze biomes that can have snow (winter mean <= 40°F)
  winterTempThreshold: 40,
  // Thresholds for flagging issues
  thresholds: {
    // Snow depth above which flood alerts are suspicious if temp is freezing
    snowDepthForSuppression: 2, // inches
    // Temp below which flood alerts during snowfall are suspicious
    freezingTemp: 32,
    // Melt rate (inches/day) that should increase flood risk
    significantMeltRate: 3,
    // Snow depth drop that indicates rapid melt
    rapidMeltThreshold: 5 // inches in lookback period
  }
};

/**
 * Configuration for heat index / dew point analysis
 * Tests that dew point-based humidity system produces realistic heat indices
 */
export const HEAT_INDEX_CONFIG = {
  // Test summer months (peak heat season)
  startMonth: 6,
  startDay: 1,
  // 60 days covers June-July peak season
  daysToAnalyze: 60,
  // Test hours throughout the day, focusing on heat of day
  hoursToTest: [6, 10, 12, 14, 16, 18, 20],
  // Only analyze biomes where summer temps can exceed 80°F (heat index threshold)
  minSummerMean: 70,
  // Threshold for showing "Feels Like" in UI
  feelsLikeDifferenceThreshold: 3,
  // Number of years to test
  yearsToTest: 3
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
