/**
 * Weather Validation
 * Validates generated weather data against realistic thresholds
 */

import { THRESHOLDS } from './testConfig';

/**
 * Validate weather data against thresholds and physical constraints
 * @param {Object} weather - Weather data to validate
 * @param {Object} context - Context for error reporting (biome, date, etc.)
 * @returns {Object} { isValid: boolean, issues: string[] }
 */
export const validateWeather = (weather, context) => {
  const issues = [];

  // Check for valid numeric values
  if (typeof weather.temperature !== 'number' || isNaN(weather.temperature)) {
    issues.push('Invalid temperature');
  }
  if (typeof weather.humidity !== 'number' || isNaN(weather.humidity)) {
    issues.push('Invalid humidity');
  }

  // Check temperature range
  if (weather.temperature < THRESHOLDS.temperature.min || weather.temperature > THRESHOLDS.temperature.max) {
    issues.push(`Temp out of range: ${weather.temperature}°F`);
  }

  // Check humidity range
  if (weather.humidity < THRESHOLDS.humidity.min || weather.humidity > THRESHOLDS.humidity.max) {
    issues.push(`Humidity out of range: ${weather.humidity}%`);
  }

  // Check pressure range
  if (weather.pressure && (weather.pressure < THRESHOLDS.pressure.min || weather.pressure > THRESHOLDS.pressure.max)) {
    issues.push(`Pressure out of range: ${weather.pressure} inHg`);
  }

  // Validate precipitation type vs temperature
  if (weather.precipitation && weather.precipitationType) {
    const temp = weather.temperature;
    const precipType = weather.precipitationType.toLowerCase();

    // Snow shouldn't occur above 35°F
    if (precipType.includes('snow') && temp > 35) {
      issues.push(`Snow at ${temp}°F`);
    }

    // Regular rain shouldn't occur below 35°F (but freezing-rain and sleet are valid)
    if (precipType === 'rain' && temp < 35) {
      issues.push(`Rain at ${temp}°F`);
    }

    // Freezing rain requires near-freezing temps
    if (precipType === 'freezing-rain' && (temp < 28 || temp > 35)) {
      issues.push(`Freezing rain at ${temp}°F (should be 28-35°F)`);
    }

    // Sleet occurs in two zones: 29-32°F (mixed with freezing rain) and 32-38°F (rain/snow transition)
    if (precipType === 'sleet' && (temp < 29 || temp > 38)) {
      issues.push(`Sleet at ${temp}°F (should be 29-38°F)`);
    }
  }

  return { isValid: issues.length === 0, issues };
};
