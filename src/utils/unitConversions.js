// src/utils/unitConversions.js

export const convertTemperature = (fahrenheit, unit) => {
  if (unit === 'celsius') {
    return Math.round((fahrenheit - 32) * 5/9);
  }
  return Math.round(fahrenheit);
};

export const formatTemperature = (fahrenheit, unit) => {
  if (unit === 'both') {
    const celsius = convertTemperature(fahrenheit, 'celsius');
    return `${Math.round(fahrenheit)}°F/${celsius}°C`;
  }
  const temp = convertTemperature(fahrenheit, unit);
  const symbol = unit === 'celsius' ? '°C' : '°F';
  return `${temp}${symbol}`;
};

export const formatTemperatureValue = (fahrenheit, unit) => {
  // Returns just the number part for display
  if (unit === 'celsius') {
    return Math.round((fahrenheit - 32) * 5/9);
  }
  return Math.round(fahrenheit);
};

export const convertWindSpeed = (mph, unit) => {
  switch(unit) {
    case 'kph':
      return Math.round(mph * 1.60934);
    case 'knots':
      return Math.round(mph * 0.868976);
    default:
      return Math.round(mph);
  }
};

export const formatWindSpeed = (mph, unit) => {
  const speed = convertWindSpeed(mph, unit);
  const unitLabel = unit === 'kph' ? 'kph' : unit === 'knots' ? 'kts' : 'mph';
  return `${speed} ${unitLabel}`;
};