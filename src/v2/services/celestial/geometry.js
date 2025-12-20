/**
 * Celestial Geometry Utilities
 * Core geometric calculations for flat disc world model
 * All formulas per FLAT_DISC_WORLD.md specification
 */

import {
  SUN_ORBITAL_RADIUS_MEAN,
  SUN_ORBITAL_RADIUS_AMPLITUDE,
  YEAR_LENGTH_DAYS,
  MOON_ORBITAL_PERIOD_HOURS,
  DEG_TO_RAD,
  DEGREES_PER_HOUR_SUN,
  DEGREES_PER_HOUR_MOON,
  PI
} from '../../models/constants.js';

/**
 * Normalize an angle to the range [0, 360)
 * @param {number} angle - Angle in degrees
 * @returns {number} Normalized angle in [0, 360)
 */
export function normalizeAngle(angle) {
  let normalized = angle % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

/**
 * Calculate the sun's orbital radius for a given day of year
 * Uses seasonal variation: R_sun(t) = R_mean + A * cos(2π * t / T_year)
 *
 * @param {number} dayOfYear - Day of year (1-365)
 * @returns {number} Sun's orbital radius in miles
 */
export function getSunOrbitalRadius(dayOfYear) {
  const R_mean = SUN_ORBITAL_RADIUS_MEAN;
  const A = SUN_ORBITAL_RADIUS_AMPLITUDE;
  const T_year = YEAR_LENGTH_DAYS;

  return R_mean + A * Math.cos(2 * PI * dayOfYear / T_year);
}

/**
 * Calculate the sun's angular position at a given hour
 * θ_sun(t) = (360° / 24h) * t + φ_sun
 *
 * @param {number} hour - Hour of day (0-23, can include fractional hours)
 * @param {number} φ_sun - Phase offset in degrees (default 0)
 * @returns {number} Sun's angular position in degrees [0, 360)
 */
export function getSunAngle(hour, φ_sun = 0) {
  const angle = DEGREES_PER_HOUR_SUN * hour + φ_sun;
  return normalizeAngle(angle);
}

/**
 * Calculate the moon's angular position for a given hour
 * θ_moon(t) = (360° / T_moon_orbit) * t + φ_moon
 * Moon orbits every 24.8 hours (slightly slower than sun)
 *
 * @param {number} hour - Hours since reference epoch (can include fractional hours)
 * @param {number} φ_moon - Phase offset in degrees (default 0)
 * @returns {number} Moon's angular position in degrees [0, 360)
 */
export function getMoonAngle(hour, φ_moon = 0) {
  const angle = DEGREES_PER_HOUR_MOON * hour + φ_moon;
  return normalizeAngle(angle);
}

/**
 * Calculate the lunar phase angle (angular separation between moon and sun)
 * phase_angle = (θ_sun - θ_moon) mod 360
 *
 * Phase angle increases as sun "laps" the slower-moving moon:
 * - 0°: New Moon (sun and moon aligned)
 * - 90°: First Quarter (sun 90° ahead)
 * - 180°: Full Moon (sun opposite moon)
 * - 270°: Last Quarter (sun 270° ahead)
 *
 * @param {number} θ_moon - Moon's angular position in degrees
 * @param {number} θ_sun - Sun's angular position in degrees
 * @returns {number} Phase angle in degrees [0, 360)
 */
export function getLunarPhaseAngle(θ_moon, θ_sun) {
  const phaseAngle = θ_sun - θ_moon;
  return normalizeAngle(phaseAngle);
}

/**
 * Calculate distance from observer to sun using law of cosines
 * d² = R_obs² + R_sun² - 2 * R_obs * R_sun * cos(θ_sun - θ_obs)
 *
 * @param {number} R_obs - Observer's distance from disc center in miles
 * @param {number} θ_obs - Observer's angular position in degrees
 * @param {number} θ_sun - Sun's angular position in degrees
 * @param {number} R_sun - Sun's orbital radius in miles
 * @returns {number} Distance from observer to sun in miles
 */
export function distanceToSun(R_obs, θ_obs, θ_sun, R_sun) {
  // Calculate angle difference
  const angleDiff = θ_sun - θ_obs;
  const angleDiffRad = angleDiff * DEG_TO_RAD;

  // Law of cosines: d² = a² + b² - 2ab*cos(C)
  const d_squared =
    R_obs * R_obs +
    R_sun * R_sun -
    2 * R_obs * R_sun * Math.cos(angleDiffRad);

  return Math.sqrt(Math.max(0, d_squared)); // Ensure non-negative before sqrt
}

/**
 * Calculate distance from observer to moon using law of cosines
 * d² = R_obs² + R_moon² - 2 * R_obs * R_moon * cos(θ_moon - θ_obs)
 *
 * @param {number} R_obs - Observer's distance from disc center in miles
 * @param {number} θ_obs - Observer's angular position in degrees
 * @param {number} θ_moon - Moon's angular position in degrees
 * @param {number} R_moon - Moon's orbital radius in miles
 * @returns {number} Distance from observer to moon in miles
 */
export function distanceToMoon(R_obs, θ_obs, θ_moon, R_moon) {
  const angleDiff = θ_moon - θ_obs;
  const angleDiffRad = angleDiff * DEG_TO_RAD;

  const d_squared =
    R_obs * R_obs +
    R_moon * R_moon -
    2 * R_obs * R_moon * Math.cos(angleDiffRad);

  return Math.sqrt(Math.max(0, d_squared));
}

/**
 * Calculate illumination percentage from phase angle
 * Uses simple cosine model: illumination = 50% * (1 - cos(phaseAngle))
 *
 * @param {number} phaseAngle - Phase angle in degrees [0, 360)
 * @returns {number} Illumination percentage [0, 100]
 */
export function calculateIlluminationPercentage(phaseAngle) {
  const phaseRad = phaseAngle * DEG_TO_RAD;
  const illumination = 50 * (1 - Math.cos(phaseRad));
  return Math.max(0, Math.min(100, illumination)); // Clamp to [0, 100]
}

/**
 * Determine if moon is waxing (growing) or waning (shrinking)
 * Waxing: 0° < phaseAngle < 180°
 * Waning: 180° < phaseAngle < 360°
 *
 * @param {number} phaseAngle - Phase angle in degrees [0, 360)
 * @returns {boolean} True if waxing, false if waning
 */
export function isWaxing(phaseAngle) {
  return phaseAngle > 0 && phaseAngle < 180;
}

/**
 * Calculate the angular difference between two angles (shortest path)
 * Useful for determining if moon/sun is approaching or receding
 *
 * @param {number} angle1 - First angle in degrees
 * @param {number} angle2 - Second angle in degrees
 * @returns {number} Angular difference in degrees [-180, 180]
 */
export function angularDifference(angle1, angle2) {
  let diff = normalizeAngle(angle1 - angle2);
  if (diff > 180) {
    diff -= 360;
  }
  return diff;
}

/**
 * Check if an angle is within a range (handling wraparound at 0°/360°)
 *
 * @param {number} angle - Angle to check in degrees
 * @param {number} rangeStart - Start of range in degrees
 * @param {number} rangeEnd - End of range in degrees
 * @returns {boolean} True if angle is within range
 */
export function isAngleInRange(angle, rangeStart, rangeEnd) {
  const normalizedAngle = normalizeAngle(angle);
  const normalizedStart = normalizeAngle(rangeStart);
  const normalizedEnd = normalizeAngle(rangeEnd);

  if (normalizedStart <= normalizedEnd) {
    // Range doesn't cross 0°
    return normalizedAngle >= normalizedStart && normalizedAngle <= normalizedEnd;
  } else {
    // Range crosses 0° boundary
    return normalizedAngle >= normalizedStart || normalizedAngle <= normalizedEnd;
  }
}
