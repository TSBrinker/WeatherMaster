/**
 * IndexedDB storage - Replaces localStorage for larger storage capacity
 * Uses idb library for cleaner async/await API
 * All data stored in 'weathermaster' database
 */

import { openDB } from 'idb';

const DB_NAME = 'weathermaster';
const DB_VERSION = 1;
const STORE_NAME = 'data';

// Storage keys (same as before)
export const STORAGE_KEYS = {
  WORLDS: 'worlds',
  ACTIVE_WORLD_ID: 'active-world-id',
  ACTIVE_REGION_ID: 'active-region-id',
  PREFERENCES: 'preferences',
  SETUP_COMPLETE: 'setup-complete',
};

// Database instance (lazily initialized)
let dbPromise = null;

/**
 * Get or create the database connection
 */
const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create a simple key-value store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};

/**
 * Save data to IndexedDB
 */
const save = async (key, data) => {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, data, key);
    return true;
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
    return false;
  }
};

/**
 * Load data from IndexedDB
 */
const load = async (key, defaultValue = null) => {
  try {
    const db = await getDB();
    const result = await db.get(STORE_NAME, key);
    return result !== undefined ? result : defaultValue;
  } catch (error) {
    console.error('Error loading from IndexedDB:', error);
    return defaultValue;
  }
};

/**
 * Remove item from IndexedDB
 */
const remove = async (key) => {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, key);
    return true;
  } catch (error) {
    console.error('Error removing from IndexedDB:', error);
    return false;
  }
};

/**
 * Clear all WeatherMaster data
 */
const clearAll = async () => {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
    return true;
  } catch (error) {
    console.error('Error clearing IndexedDB:', error);
    return false;
  }
};

// === WORLDS ===

export const saveWorlds = async (worlds) => {
  return save(STORAGE_KEYS.WORLDS, worlds);
};

export const loadWorlds = async () => {
  return load(STORAGE_KEYS.WORLDS, []);
};

export const saveActiveWorldId = async (worldId) => {
  return save(STORAGE_KEYS.ACTIVE_WORLD_ID, worldId);
};

export const loadActiveWorldId = async () => {
  return load(STORAGE_KEYS.ACTIVE_WORLD_ID, null);
};

export const saveActiveRegionId = async (regionId) => {
  return save(STORAGE_KEYS.ACTIVE_REGION_ID, regionId);
};

export const loadActiveRegionId = async () => {
  return load(STORAGE_KEYS.ACTIVE_REGION_ID, null);
};

// === PREFERENCES ===

export const savePreferences = async (preferences) => {
  return save(STORAGE_KEYS.PREFERENCES, preferences);
};

export const loadPreferences = async () => {
  return load(STORAGE_KEYS.PREFERENCES, {
    temperatureUnit: 'F',
    windSpeedUnit: 'mph',
    timeFormat: 12,
    showFeelsLike: true,
    debugMode: false,
  });
};

// === SETUP ===

export const markSetupComplete = async () => {
  return save(STORAGE_KEYS.SETUP_COMPLETE, true);
};

export const isSetupComplete = async () => {
  return load(STORAGE_KEYS.SETUP_COMPLETE, false);
};

// === EXPORT/IMPORT ===

/**
 * Export all data as JSON
 */
export const exportAllData = async () => {
  return {
    version: '2.0',
    exportDate: new Date().toISOString(),
    worlds: await loadWorlds(),
    preferences: await loadPreferences(),
    activeWorldId: await loadActiveWorldId(),
    activeRegionId: await loadActiveRegionId(),
  };
};

/**
 * Import data from JSON
 */
export const importAllData = async (data) => {
  try {
    if (data.worlds) await saveWorlds(data.worlds);
    if (data.preferences) await savePreferences(data.preferences);
    if (data.activeWorldId) await saveActiveWorldId(data.activeWorldId);
    if (data.activeRegionId) await saveActiveRegionId(data.activeRegionId);
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

// === MIGRATION ===

/**
 * Migrate data from localStorage to IndexedDB (one-time operation)
 * Returns true if migration occurred, false if no data to migrate
 */
export const migrateFromLocalStorage = async () => {
  const OLD_PREFIX = 'wm2-';
  const oldKeys = {
    WORLDS: `${OLD_PREFIX}worlds`,
    ACTIVE_WORLD_ID: `${OLD_PREFIX}active-world-id`,
    ACTIVE_REGION_ID: `${OLD_PREFIX}active-region-id`,
    PREFERENCES: `${OLD_PREFIX}preferences`,
    SETUP_COMPLETE: `${OLD_PREFIX}setup-complete`,
  };

  try {
    // Check if there's localStorage data to migrate
    const oldWorldsRaw = localStorage.getItem(oldKeys.WORLDS);
    if (!oldWorldsRaw) {
      return false; // Nothing to migrate
    }

    // Check if we've already migrated (IndexedDB has data)
    const existingWorlds = await loadWorlds();
    if (existingWorlds.length > 0) {
      return false; // Already have data, don't overwrite
    }

    console.log('Migrating data from localStorage to IndexedDB...');

    // Migrate each piece of data
    const oldWorlds = JSON.parse(oldWorldsRaw);
    if (oldWorlds) await saveWorlds(oldWorlds);

    const oldActiveWorldId = localStorage.getItem(oldKeys.ACTIVE_WORLD_ID);
    if (oldActiveWorldId) await saveActiveWorldId(JSON.parse(oldActiveWorldId));

    const oldActiveRegionId = localStorage.getItem(oldKeys.ACTIVE_REGION_ID);
    if (oldActiveRegionId) await saveActiveRegionId(JSON.parse(oldActiveRegionId));

    const oldPreferences = localStorage.getItem(oldKeys.PREFERENCES);
    if (oldPreferences) await savePreferences(JSON.parse(oldPreferences));

    const oldSetupComplete = localStorage.getItem(oldKeys.SETUP_COMPLETE);
    if (oldSetupComplete) await save(STORAGE_KEYS.SETUP_COMPLETE, JSON.parse(oldSetupComplete));

    // Clear old localStorage data
    Object.values(oldKeys).forEach(key => localStorage.removeItem(key));

    console.log('Migration complete! localStorage data cleared.');
    return true;
  } catch (error) {
    console.error('Error migrating from localStorage:', error);
    return false;
  }
};

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
  migrateFromLocalStorage,
};
