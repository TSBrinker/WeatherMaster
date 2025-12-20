/**
 * Unit conversion utilities
 * - Temperature: Fahrenheit <-> Celsius
 * - Wind speed: MPH <-> KPH <-> Knots
 */

// ===== TEMPERATURE =====

export const fahrenheitToCelsius = (f) => {
  return (f - 32) * (5 / 9);
};

export const celsiusToFahrenheit = (c) => {
  return (c * 9 / 5) + 32;
};

export const formatTemperature = (tempF, unit = 'F', decimals = 0) => {
  if (unit === 'C') {
    const tempC = fahrenheitToCelsius(tempF);
    return `${tempC.toFixed(decimals)}°C`;
  }
  return `${tempF.toFixed(decimals)}°F`;
};

// ===== WIND SPEED =====

export const mphToKph = (mph) => {
  return mph * 1.60934;
};

export const mphToKnots = (mph) => {
  return mph * 0.868976;
};

export const kphToMph = (kph) => {
  return kph / 1.60934;
};

export const knotsToMph = (knots) => {
  return knots / 0.868976;
};

export const formatWindSpeed = (speedMph, unit = 'mph', decimals = 0) => {
  switch (unit) {
    case 'kph':
      return `${mphToKph(speedMph).toFixed(decimals)} kph`;
    case 'knots':
      return `${mphToKnots(speedMph).toFixed(decimals)} knots`;
    default:
      return `${speedMph.toFixed(decimals)} mph`;
  }
};

// ===== WIND DESCRIPTIONS =====

export const getWindDescription = (speedMph) => {
  if (speedMph < 1) return 'Calm';
  if (speedMph < 4) return 'Light air';
  if (speedMph < 8) return 'Light breeze';
  if (speedMph < 13) return 'Gentle breeze';
  if (speedMph < 19) return 'Moderate breeze';
  if (speedMph < 25) return 'Fresh breeze';
  if (speedMph < 32) return 'Strong breeze';
  if (speedMph < 39) return 'Moderate gale';
  if (speedMph < 47) return 'Fresh gale';
  if (speedMph < 55) return 'Strong gale';
  if (speedMph < 64) return 'Whole gale';
  if (speedMph < 73) return 'Storm';
  return 'Hurricane';
};
