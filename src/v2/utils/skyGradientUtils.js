/**
 * Sky Gradient Utilities
 * Shared logic for calculating sky colors based on time of day and weather conditions.
 * Used by both the full-screen background and the celestial track display.
 */

/**
 * Check if current hour is golden hour (sunrise or sunset hour)
 * @param {number} hour - Current hour (0-23)
 * @param {number|null} sunriseHour - Hour of sunrise
 * @param {number|null} sunsetHour - Hour of sunset
 * @returns {boolean}
 */
export function isGoldenHour(hour, sunriseHour, sunsetHour) {
  return (sunriseHour !== null && hour === sunriseHour) ||
         (sunsetHour !== null && hour === sunsetHour);
}

/**
 * Check if current hour is nighttime
 * @param {number} hour - Current hour (0-23)
 * @param {number|null} sunriseHour - Hour of sunrise
 * @param {number|null} sunsetHour - Hour of sunset
 * @returns {boolean}
 */
export function isNightTime(hour, sunriseHour, sunsetHour) {
  if (sunsetHour !== null && sunriseHour !== null) {
    return hour > sunsetHour || hour < sunriseHour;
  }
  // Fallback to static times if celestial data unavailable
  return hour < 6 || hour >= 20;
}

/**
 * Calculate the sky gradient based on time of day and weather condition
 * @param {number} hour - Current hour (0-23)
 * @param {number|null} sunriseHour - Hour of sunrise
 * @param {number|null} sunsetHour - Hour of sunset
 * @param {string} condition - Weather condition string
 * @returns {string} CSS gradient string
 */
export function calculateSkyGradient(hour, sunriseHour, sunsetHour, condition) {
  const conditionLower = (condition || '').toLowerCase();
  const goldenHour = isGoldenHour(hour, sunriseHour, sunsetHour);
  const night = isNightTime(hour, sunriseHour, sunsetHour);

  // Golden hour takes precedence for clear/sunny conditions
  if (goldenHour && (conditionLower.includes('clear') || conditionLower.includes('sunny'))) {
    return 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)'; // Warm orange-yellow
  }

  // Clear/Sunny conditions
  if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
    if (night) return 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)'; // Deep indigo
    return 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'; // Bright sky blue
  }

  // Cloudy conditions
  if (conditionLower.includes('cloud')) {
    if (goldenHour) return 'linear-gradient(135deg, #d97706 0%, #92400e 100%)'; // Muted golden
    if (night) return 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'; // Dark gray
    return 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'; // Gray
  }

  // Rain/Storm conditions
  if (conditionLower.includes('rain') || conditionLower.includes('storm')) {
    if (night) return 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'; // Dark slate
    return 'linear-gradient(135deg, #475569 0%, #64748b 100%)'; // Slate
  }

  // Snow conditions
  if (conditionLower.includes('snow')) {
    if (night) return 'linear-gradient(135deg, #334155 0%, #1e293b 100%)'; // Dark gray
    return 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)'; // Light gray
  }

  // Default gradients
  if (goldenHour) return 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)'; // Golden hour
  if (night) return 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'; // Night
  return 'linear-gradient(135deg, #4a90e2 0%, #87ceeb 100%)'; // Day
}

/**
 * Parse a time string like "6:42 AM" to hour number (0-23)
 * @param {string} timeString - Time in format "H:MM AM/PM"
 * @returns {number|null} Hour (0-23) or null if invalid
 */
export function parseTimeToHour(timeString) {
  if (!timeString || timeString === 'Never' || timeString === 'Always') return null;
  const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;

  let hour = parseInt(match[1]);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  return hour;
}
