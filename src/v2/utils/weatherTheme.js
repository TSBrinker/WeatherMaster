/**
 * Weather Theme Utilities
 * Determines visual styling based on weather conditions and time of day
 */

/**
 * Get background gradient based on weather condition and time of day
 * @param {string} condition - Weather condition (Clear, Cloudy, Rain, etc.)
 * @param {string} twilightLevel - 'none' | 'civil' | 'nautical' | 'astronomical'
 * @param {boolean} isDaytime - Is it currently daytime?
 * @returns {string} CSS gradient string
 */
export const getWeatherBackground = (condition, twilightLevel, isDaytime) => {
  // Normalize condition for matching
  const normalizedCondition = condition?.toLowerCase() || 'clear';

  // Determine time of day first
  if (twilightLevel && twilightLevel !== 'none') {
    // Twilight - orange/pink gradient regardless of weather
    return 'linear-gradient(135deg, #ff6b6b 0%, #f97316 50%, #fb923c 100%)';
  }

  if (!isDaytime) {
    // Night time - dark blue gradient, slightly affected by weather
    if (normalizedCondition.includes('storm') || normalizedCondition.includes('thunder')) {
      return 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e293b 100%)';
    }
    if (normalizedCondition.includes('rain') || normalizedCondition.includes('snow')) {
      return 'linear-gradient(135deg, #1e293b 0%, #334155 100%)';
    }
    // Clear night
    return 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)';
  }

  // Daytime - vary by weather condition
  if (normalizedCondition.includes('storm') || normalizedCondition.includes('thunder')) {
    // Stormy - dark gray
    return 'linear-gradient(135deg, #374151 0%, #4b5563 50%, #6b7280 100%)';
  }

  if (normalizedCondition.includes('heavy rain') || normalizedCondition.includes('heavy snow')) {
    // Heavy precipitation - medium gray
    return 'linear-gradient(135deg, #4b5563 0%, #6b7280 50%, #9ca3af 100%)';
  }

  if (normalizedCondition.includes('rain') || normalizedCondition.includes('sleet') || normalizedCondition.includes('freezing')) {
    // Rainy - blue-gray
    return 'linear-gradient(135deg, #5b8fb9 0%, #7ba7c7 50%, #94b8d1 100%)';
  }

  if (normalizedCondition.includes('snow')) {
    // Snowy - light gray with blue tint
    return 'linear-gradient(135deg, #9ca3af 0%, #cbd5e1 50%, #e2e8f0 100%)';
  }

  if (normalizedCondition.includes('overcast')) {
    // Overcast - darker gray
    return 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)';
  }

  if (normalizedCondition.includes('cloudy')) {
    // Cloudy - light gray
    return 'linear-gradient(135deg, #9ca3af 0%, #d1d5db 100%)';
  }

  if (normalizedCondition.includes('partly cloudy')) {
    // Partly cloudy - blue with some gray
    return 'linear-gradient(135deg, #4a90e2 0%, #7ba7c7 50%, #9ca3af 100%)';
  }

  if (normalizedCondition.includes('fog') || normalizedCondition.includes('mist')) {
    // Foggy - gray-white
    return 'linear-gradient(135deg, #d1d5db 0%, #e5e7eb 100%)';
  }

  // Clear sky - bright blue gradient
  return 'linear-gradient(135deg, #4a90e2 0%, #60a5fa 50%, #87ceeb 100%)';
};

/**
 * Get text color (light or dark) based on background brightness
 * @param {string} condition - Weather condition
 * @param {string} twilightLevel - Twilight level
 * @param {boolean} isDaytime - Is it daytime?
 * @returns {string} 'light' or 'dark'
 */
export const getTextColor = (condition, twilightLevel, isDaytime) => {
  const normalizedCondition = condition?.toLowerCase() || 'clear';

  // Night and twilight always use light text
  if (!isDaytime || (twilightLevel && twilightLevel !== 'none')) {
    return 'light';
  }

  // Daytime - dark text for bright backgrounds, light for dark
  if (normalizedCondition.includes('storm') || normalizedCondition.includes('rain')) {
    return 'light';
  }

  if (normalizedCondition.includes('heavy snow') || normalizedCondition.includes('snow')) {
    return 'dark'; // Snow is light background during daytime
  }

  if (normalizedCondition.includes('overcast') || normalizedCondition.includes('cloudy')) {
    return 'dark';
  }

  // Clear sky - dark text on bright blue
  return 'dark';
};

/**
 * Get weather icon emoji based on condition
 * @param {string} condition - Weather condition
 * @param {boolean} isDaytime - Is it daytime?
 * @returns {string} Emoji icon
 */
export const getWeatherIcon = (condition, isDaytime) => {
  const normalizedCondition = condition?.toLowerCase() || 'clear';

  if (normalizedCondition.includes('thunder') || normalizedCondition.includes('storm')) {
    return '⛈️';
  }

  if (normalizedCondition.includes('heavy rain')) {
    return '🌧️';
  }

  if (normalizedCondition.includes('rain') || normalizedCondition.includes('sleet')) {
    return '🌦️';
  }

  if (normalizedCondition.includes('heavy snow')) {
    return '❄️';
  }

  if (normalizedCondition.includes('snow')) {
    return '🌨️';
  }

  if (normalizedCondition.includes('fog') || normalizedCondition.includes('mist')) {
    return '🌫️';
  }

  if (normalizedCondition.includes('overcast')) {
    return '☁️';
  }

  if (normalizedCondition.includes('cloudy')) {
    return '⛅';
  }

  // Clear
  return isDaytime ? '☀️' : '🌙';
};

/**
 * Get condition-specific CSS class for animations
 * @param {string} condition - Weather condition
 * @returns {string} CSS class name
 */
export const getWeatherAnimationClass = (condition) => {
  const normalizedCondition = condition?.toLowerCase() || 'clear';

  if (normalizedCondition.includes('storm') || normalizedCondition.includes('thunder')) {
    return 'weather-stormy';
  }

  if (normalizedCondition.includes('rain')) {
    return 'weather-rainy';
  }

  if (normalizedCondition.includes('snow')) {
    return 'weather-snowy';
  }

  return '';
};
