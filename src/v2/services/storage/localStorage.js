/**
 * localStorage utilities - Simple and clean
 * All keys prefixed with 'wm2-' (WeatherMaster 2.0)
 */

const STORAGE_PREFIX = 'wm2-';

// Storage keys
export const STORAGE_KEYS = {
  WORLDS: `${STORAGE_PREFIX}worlds`,
  ACTIVE_WORLD_ID: `${STORAGE_PREFIX}active-world-id`,
  ACTIVE_REGION_ID: `${STORAGE_PREFIX}active-region-id`,
  PREFERENCES: `${STORAGE_PREFIX}preferences`,
  SETUP_COMPLETE: `${STORAGE_PREFIX}setup-complete`,
};

/**
 * Save data to localStorage
 */
const save = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

/**
 * Load data from localStorage
 */
const load = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

/**
 * Remove item from localStorage
 */
const remove = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};

/**
 * Clear all WeatherMaster data
 */
const clearAll = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

// === WORLDS ===

export const saveWorlds = (worlds) => {
  return save(STORAGE_KEYS.WORLDS, worlds);
};

export const loadWorlds = () => {
  return load(STORAGE_KEYS.WORLDS, []);
};

export const saveActiveWorldId = (worldId) => {
  return save(STORAGE_KEYS.ACTIVE_WORLD_ID, worldId);
};

export const loadActiveWorldId = () => {
  return load(STORAGE_KEYS.ACTIVE_WORLD_ID, null);
};

export const saveActiveRegionId = (regionId) => {
  return save(STORAGE_KEYS.ACTIVE_REGION_ID, regionId);
};

export const loadActiveRegionId = () => {
  return load(STORAGE_KEYS.ACTIVE_REGION_ID, null);
};

// === PREFERENCES ===

export const savePreferences = (preferences) => {
  return save(STORAGE_KEYS.PREFERENCES, preferences);
};

export const loadPreferences = () => {
  return load(STORAGE_KEYS.PREFERENCES, {
    temperatureUnit: 'F',
    windSpeedUnit: 'mph',
    timeFormat: 12,
    showFeelsLike: true,
    debugMode: false,
  });
};

// === SETUP ===

export const markSetupComplete = () => {
  return save(STORAGE_KEYS.SETUP_COMPLETE, true);
};

export const isSetupComplete = () => {
  return load(STORAGE_KEYS.SETUP_COMPLETE, false);
};

// === EXPORT/IMPORT ===

/**
 * Export all data as JSON
 */
export const exportAllData = () => {
  return {
    version: '2.0',
    exportDate: new Date().toISOString(),
    worlds: loadWorlds(),
    preferences: loadPreferences(),
    activeWorldId: loadActiveWorldId(),
    activeRegionId: loadActiveRegionId(),
  };
};

/**
 * Import data from JSON
 */
export const importAllData = (data) => {
  try {
    if (data.worlds) saveWorlds(data.worlds);
    if (data.preferences) savePreferences(data.preferences);
    if (data.activeWorldId) saveActiveWorldId(data.activeWorldId);
    if (data.activeRegionId) saveActiveRegionId(data.activeRegionId);
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

/**
 * Clear all data
 */
export const clearAllData = clearAll;

// Default export
export default {
  saveWorlds,
  loadWorlds,
  saveActiveWorldId,
  loadActiveWorldId,
  saveActiveRegionId,
  loadActiveRegionId,
  savePreferences,
  loadPreferences,
  markSetupComplete,
  isSetupComplete,
  exportAllData,
  importAllData,
  clearAllData,
};
