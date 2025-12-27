/**
 * IndexedDB storage - Replaces localStorage for larger storage capacity
 * Uses idb library for cleaner async/await API
 * All data stored in 'weathermaster' database
 *
 * Version History:
 * - v1: Initial IndexedDB migration from localStorage
 * - v2: Added continents support (maps moved from World to Continent)
 */

import { openDB } from 'idb';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'weathermaster';
const DB_VERSION = 2;
const STORE_NAME = 'data';

// Storage keys (same as before)
export const STORAGE_KEYS = {
  WORLDS: 'worlds',
  CONTINENTS: 'continents',
  ACTIVE_WORLD_ID: 'active-world-id',
  ACTIVE_REGION_ID: 'active-region-id',
  ACTIVE_CONTINENT_ID: 'active-continent-id',
  PREFERENCES: 'preferences',
  SETUP_COMPLETE: 'setup-complete',
};

// Database instance (lazily initialized)
let dbPromise = null;

/**
 * Get or create the database connection
 * Handles migrations between versions
 */
const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create a simple key-value store (v1)
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }

        // v1 -> v2 migration: Move maps from World to Continent
        // This happens automatically when the app first loads with the new code
        // The actual data migration is handled in migrateWorldMapsToContinent()
        // because we need async access to the data
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

// === CONTINENTS ===

export const saveContinents = async (continents) => {
  return save(STORAGE_KEYS.CONTINENTS, continents);
};

export const loadContinents = async () => {
  return load(STORAGE_KEYS.CONTINENTS, []);
};

export const saveActiveContinentId = async (continentId) => {
  return save(STORAGE_KEYS.ACTIVE_CONTINENT_ID, continentId);
};

export const loadActiveContinentId = async () => {
  return load(STORAGE_KEYS.ACTIVE_CONTINENT_ID, null);
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
    version: '2.1',
    exportDate: new Date().toISOString(),
    worlds: await loadWorlds(),
    continents: await loadContinents(),
    preferences: await loadPreferences(),
    activeWorldId: await loadActiveWorldId(),
    activeRegionId: await loadActiveRegionId(),
    activeContinentId: await loadActiveContinentId(),
  };
};

/**
 * Import data from JSON
 */
export const importAllData = async (data) => {
  try {
    if (data.worlds) await saveWorlds(data.worlds);
    if (data.continents) await saveContinents(data.continents);
    if (data.preferences) await savePreferences(data.preferences);
    if (data.activeWorldId) await saveActiveWorldId(data.activeWorldId);
    if (data.activeRegionId) await saveActiveRegionId(data.activeRegionId);
    if (data.activeContinentId) await saveActiveContinentId(data.activeContinentId);
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

// === CONTINENT MIGRATION ===

/**
 * Migrate world maps to continents (v1 -> v2 data migration)
 * - Creates a default continent for each world that has a map
 * - Moves the mapImage/mapScale to the continent
 * - Assigns regions with mapPosition to that continent
 * - Clears mapImage/mapScale from world
 *
 * Returns { worlds, continents } with migrated data
 */
export const migrateWorldMapsToContinent = async () => {
  try {
    const worlds = await loadWorlds();
    const existingContinents = await loadContinents();

    // If we already have continents, no migration needed
    if (existingContinents.length > 0) {
      return { migrated: false, worlds, continents: existingContinents };
    }

    // Check if any world has a map to migrate
    const worldsWithMaps = worlds.filter(w => w.mapImage);
    if (worldsWithMaps.length === 0) {
      return { migrated: false, worlds, continents: [] };
    }

    console.log('Migrating world maps to continents...');

    const newContinents = [];
    const updatedWorlds = worlds.map(world => {
      if (!world.mapImage) {
        return world; // No map to migrate
      }

      // Create a default continent for this world's map
      const continent = {
        id: uuidv4(),
        worldId: world.id,
        name: 'Main Continent',
        mapImage: world.mapImage,
        mapScale: world.mapScale,
        isCollapsed: false,
      };
      newContinents.push(continent);

      // Update regions with mapPosition to belong to this continent
      const updatedRegions = world.regions.map(region => {
        if (region.mapPosition) {
          return { ...region, continentId: continent.id };
        }
        return region; // No mapPosition = uncategorized (continentId: undefined)
      });

      // Return world without map data (it's now on the continent)
      const { mapImage, mapScale, ...worldWithoutMap } = world;
      return {
        ...worldWithoutMap,
        regions: updatedRegions,
      };
    });

    // Save the migrated data
    await saveWorlds(updatedWorlds);
    await saveContinents(newContinents);

    console.log(`Migration complete: created ${newContinents.length} continent(s)`);
    return { migrated: true, worlds: updatedWorlds, continents: newContinents };
  } catch (error) {
    console.error('Error migrating world maps to continents:', error);
    return { migrated: false, worlds: await loadWorlds(), continents: [] };
  }
};

// === LOCALSTORAGE MIGRATION ===

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
  saveContinents,
  loadContinents,
  saveActiveContinentId,
  loadActiveContinentId,
  savePreferences,
  loadPreferences,
  markSetupComplete,
  isSetupComplete,
  exportAllData,
  importAllData,
  clearAllData,
  migrateFromLocalStorage,
  migrateWorldMapsToContinent,
};
