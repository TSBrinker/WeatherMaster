// src/v2/utils/gameplayEffects.js
// Utility to extract key D&D 5e gameplay impacts from current weather conditions

import { weatherEffects, windIntensityEffects } from '../data/weather-effects';

/**
 * Map weather condition strings to weatherEffects keys
 * The weather generator uses different condition names than our effects data
 */
const conditionToEffectKey = {
  // Clear conditions
  'clear': 'Clear Skies',
  'sunny': 'Clear Skies',
  'clear skies': 'Clear Skies',

  // Cloudy conditions
  'partly cloudy': 'Light Clouds',
  'light clouds': 'Light Clouds',
  'cloudy': 'Heavy Clouds',
  'overcast': 'Heavy Clouds',
  'heavy clouds': 'Heavy Clouds',

  // Fog
  'fog': 'Fog',
  'foggy': 'Fog',
  'mist': 'Fog',
  'misty': 'Fog',

  // Rain
  'rain': 'Rain',
  'light rain': 'Rain',
  'drizzle': 'Rain',
  'heavy rain': 'Heavy Rain',
  'downpour': 'Heavy Rain',

  // Snow
  'snow': 'Snow',
  'light snow': 'Snow',
  'heavy snow': 'Snow',
  'flurries': 'Snow',

  // Storms
  'thunderstorm': 'Thunderstorm',
  'storm': 'Thunderstorm',
  'thunder': 'Thunderstorm',

  // Blizzard
  'blizzard': 'Blizzard',

  // Hail
  'hail': 'Hail',
  'hailing': 'Hail'
};

/**
 * Get the wind intensity category based on speed
 * @param {number} windSpeed - Wind speed in mph
 * @returns {Object|null} Wind intensity data or null
 */
function getWindIntensity(windSpeed) {
  if (!windSpeed || windSpeed < 0) return null;

  for (const [intensity, data] of Object.entries(windIntensityEffects)) {
    if (windSpeed >= data.min && windSpeed <= data.max) {
      return { intensity, ...data };
    }
  }
  return null;
}

/**
 * Extract compact gameplay indicators from current weather
 * Returns the most important mechanical impacts for quick reference
 *
 * @param {Object} weather - Weather data from WeatherService
 * @returns {Object} Gameplay indicators
 */
export function getGameplayIndicators(weather) {
  if (!weather) return null;

  const indicators = {
    visibility: null,      // e.g., "60 ft" for fog
    movement: null,        // e.g., "Half speed"
    ranged: null,          // e.g., "Disadvantage"
    damageModifiers: [],   // e.g., ["+2 cold", "-4 fire"]
    restDC: null,          // e.g., "DC 16"
    hasImpact: false       // True if any meaningful gameplay impact
  };

  // Get weather condition effects
  const condition = weather.condition?.toLowerCase() || '';
  const effectKey = Object.entries(conditionToEffectKey).find(
    ([key]) => condition.includes(key)
  )?.[1];

  const effects = effectKey ? weatherEffects[effectKey] : null;

  if (effects) {
    // Parse visibility
    if (effects.visibility && effects.visibility !== 'Normal') {
      // Extract distance from visibility string
      const distMatch = effects.visibility.match(/(\d+)\s*feet/i);
      if (distMatch) {
        indicators.visibility = `${distMatch[1]} ft`;
        indicators.hasImpact = true;
      } else if (effects.visibility.includes('obscured')) {
        indicators.visibility = 'Obscured';
        indicators.hasImpact = true;
      }
    }

    // Parse movement
    if (effects.movement && effects.movement !== 'Normal') {
      if (effects.movement.toLowerCase().includes('half')) {
        indicators.movement = '½ speed';
        indicators.hasImpact = true;
      } else if (effects.movement.toLowerCase().includes('difficult')) {
        indicators.movement = 'Difficult';
        indicators.hasImpact = true;
      }
    }

    // Parse damage modifiers
    if (effects.damage && effects.damage.length > 0) {
      effects.damage.forEach(dmg => {
        // Extract modifier like "+2 cold" or "-4 fire"
        const match = dmg.match(/([+-]\d+)\s+(?:to\s+)?(?:all\s+)?(\w+)/i);
        if (match) {
          indicators.damageModifiers.push(`${match[1]} ${match[2]}`);
          indicators.hasImpact = true;
        }
      });
    }

    // Parse rest DC
    if (effects.rest && effects.rest !== 'Normal') {
      const dcMatch = effects.rest.match(/DC\s*(\d+)/i);
      if (dcMatch) {
        indicators.restDC = `DC ${dcMatch[1]}`;
        indicators.hasImpact = true;
      }
    }

    // Check for ranged attack disadvantage
    if (effects.checks) {
      const hasRangedDisadvantage = effects.checks.some(
        check => check.toLowerCase().includes('ranged') &&
                 check.toLowerCase().includes('disadvantage')
      );
      if (hasRangedDisadvantage) {
        indicators.ranged = 'Disadv';
        indicators.hasImpact = true;
      }
    }
  }

  // Check wind effects
  const windData = getWindIntensity(weather.windSpeed);
  if (windData && windData.intensity !== 'Calm' && windData.intensity !== 'Breezy') {
    // Strong winds affect ranged attacks
    if (windData.intensity === 'Strong Winds' ||
        windData.intensity === 'Gale Force' ||
        windData.intensity === 'Storm Force') {
      if (!indicators.ranged) {
        indicators.ranged = windData.intensity === 'Strong Winds' ? '-2 ranged' : 'Disadv';
        indicators.hasImpact = true;
      }
    }
  }

  // Temperature effects
  const temp = weather.temperature;
  if (temp !== undefined) {
    if (temp <= 0) {
      if (!indicators.damageModifiers.some(d => d.includes('cold'))) {
        indicators.damageModifiers.push('+2 cold');
        indicators.hasImpact = true;
      }
    } else if (temp >= 100) {
      if (!indicators.damageModifiers.some(d => d.includes('fire'))) {
        indicators.damageModifiers.push('+2 fire');
        indicators.hasImpact = true;
      }
    }
  }

  return indicators;
}

/**
 * Get the full effects data for a weather condition
 * Used when opening the detailed modal
 *
 * @param {string} condition - Weather condition string
 * @returns {Object|null} Full effects data from weather-effects.js
 */
export function getFullWeatherEffects(condition) {
  if (!condition) return null;

  const conditionLower = condition.toLowerCase();
  const effectKey = Object.entries(conditionToEffectKey).find(
    ([key]) => conditionLower.includes(key)
  )?.[1];

  return effectKey ? { key: effectKey, ...weatherEffects[effectKey] } : null;
}

/**
 * Format indicators into a compact display string
 * @param {Object} indicators - From getGameplayIndicators
 * @returns {string} Compact display string
 */
export function formatIndicatorsCompact(indicators) {
  if (!indicators || !indicators.hasImpact) return null;

  const parts = [];

  if (indicators.visibility) parts.push(`Vis: ${indicators.visibility}`);
  if (indicators.movement) parts.push(indicators.movement);
  if (indicators.ranged) parts.push(`Ranged: ${indicators.ranged}`);
  if (indicators.restDC) parts.push(`Rest: ${indicators.restDC}`);

  return parts.join(' | ');
}
