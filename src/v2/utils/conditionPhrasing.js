/**
 * Condition Phrasing Utility
 * Transforms weather condition strings between standard and descriptive styles
 */

/**
 * Mapping from standard condition names to descriptive phrasing
 * Standard: "Mist", "Heavy Rain" (noun-based)
 * Descriptive: "Misty", "Raining Heavily" (adjective/verb-based)
 */
const PHRASING_MAP = {
  // Clear conditions
  'Clear': 'Clear Skies',

  // Cloud conditions
  'Partly Cloudy': 'Partly Cloudy',
  'Cloudy': 'Cloudy',
  'Overcast': 'Overcast',

  // Rain conditions
  'Light Rain': 'Raining Lightly',
  'Rain': 'Raining',
  'Heavy Rain': 'Raining Heavily',

  // Snow conditions
  'Light Snow': 'Snowing Lightly',
  'Snow': 'Snowing',
  'Heavy Snow': 'Snowing Heavily',

  // Mixed precipitation
  'Sleet': 'Sleeting',
  'Freezing Rain': 'Freezing Rain',

  // Visibility conditions
  'Fog': 'Foggy',
  'Mist': 'Misty'
};

/**
 * Transform a condition string based on phrasing preference
 * @param {string} condition - The standard condition string (e.g., "Heavy Rain")
 * @param {string} phrasing - Either 'standard' or 'descriptive'
 * @returns {string} The transformed condition string
 */
export const transformCondition = (condition, phrasing = 'standard') => {
  if (!condition) return condition;

  if (phrasing === 'descriptive') {
    return PHRASING_MAP[condition] || condition;
  }

  // Standard phrasing - return as-is
  return condition;
};

/**
 * Get the phrasing label for display in settings
 * @param {string} phrasing - Either 'standard' or 'descriptive'
 * @returns {string} Human-readable label
 */
export const getPhrasingLabel = (phrasing) => {
  return phrasing === 'descriptive' ? 'Descriptive' : 'Standard';
};

/**
 * Get example text for each phrasing style
 * @param {string} phrasing - Either 'standard' or 'descriptive'
 * @returns {string} Example conditions in that style
 */
export const getPhrasingExample = (phrasing) => {
  return phrasing === 'descriptive'
    ? 'Misty, Raining Heavily, Snowing'
    : 'Mist, Heavy Rain, Snow';
};
