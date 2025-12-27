import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
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
  migrateFromLocalStorage,
  migrateWorldMapsToContinent,
} from '../services/storage/indexedDB';
import { advanceDate as advanceDateUtil } from '../utils/dateUtils';

const WorldContext = createContext();

export const useWorld = () => {
  const context = useContext(WorldContext);
  if (!context) {
    throw new Error('useWorld must be used within WorldProvider');
  }
  return context;
};

export const WorldProvider = ({ children }) => {
  const [worlds, setWorlds] = useState([]);
  const [continents, setContinents] = useState([]);
  const [activeWorldId, setActiveWorldId] = useState(null);
  const [activeRegionId, setActiveRegionId] = useState(null);
  const [activeContinentId, setActiveContinentId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  // Derived state
  const activeWorld = worlds.find(w => w.id === activeWorldId) || null;
  const activeRegion = activeWorld?.regions.find(r => r.id === activeRegionId) || null;
  const activeContinent = continents.find(c => c.id === activeContinentId) || null;

  // Get continents for the active world
  const worldContinents = useMemo(() => {
    if (!activeWorldId) return [];
    return continents.filter(c => c.worldId === activeWorldId);
  }, [continents, activeWorldId]);

  // Group regions by continent for the active world
  const groupedRegions = useMemo(() => {
    if (!activeWorld) return { uncategorized: [], byContinent: {} };

    const byContinent = {};
    const uncategorized = [];

    // Initialize continent groups
    worldContinents.forEach(c => {
      byContinent[c.id] = [];
    });

    // Sort regions into groups
    activeWorld.regions.forEach(region => {
      if (region.continentId && byContinent[region.continentId]) {
        byContinent[region.continentId].push(region);
      } else {
        uncategorized.push(region);
      }
    });

    return { uncategorized, byContinent };
  }, [activeWorld, worldContinents]);

  // Load data from IndexedDB on mount (with migrations)
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // First, try to migrate any existing localStorage data
        await migrateFromLocalStorage();

        // Then run continent migration (moves maps from World to Continent)
        const migrationResult = await migrateWorldMapsToContinent();

        // Load from IndexedDB (or use migrated data)
        let loadedWorlds, loadedContinents;
        if (migrationResult.migrated) {
          loadedWorlds = migrationResult.worlds;
          loadedContinents = migrationResult.continents;
        } else {
          [loadedWorlds, loadedContinents] = await Promise.all([
            loadWorlds(),
            loadContinents(),
          ]);
        }

        const [loadedActiveWorldId, loadedActiveRegionId, loadedActiveContinentId] = await Promise.all([
          loadActiveWorldId(),
          loadActiveRegionId(),
          loadActiveContinentId(),
        ]);

        setWorlds(loadedWorlds);
        setContinents(loadedContinents);
        setActiveWorldId(loadedActiveWorldId);
        setActiveRegionId(loadedActiveRegionId);
        setActiveContinentId(loadedActiveContinentId);
        isInitialized.current = true;
      } catch (error) {
        console.error('Error initializing storage:', error);
        isInitialized.current = true;
      } finally {
        setIsLoading(false);
      }
    };

    initializeStorage();
  }, []);

  // Save to IndexedDB whenever state changes (skip initial load)
  useEffect(() => {
    if (isInitialized.current) {
      saveWorlds(worlds);
    }
  }, [worlds]);

  useEffect(() => {
    if (isInitialized.current) {
      saveContinents(continents);
    }
  }, [continents]);

  useEffect(() => {
    if (isInitialized.current) {
      saveActiveWorldId(activeWorldId);
    }
  }, [activeWorldId]);

  useEffect(() => {
    if (isInitialized.current) {
      saveActiveRegionId(activeRegionId);
    }
  }, [activeRegionId]);

  useEffect(() => {
    if (isInitialized.current) {
      saveActiveContinentId(activeContinentId);
    }
  }, [activeContinentId]);

  // ===== WORLD MANAGEMENT =====

  const createWorld = useCallback((name, description = '', startDate = null) => {
    const newWorld = {
      id: uuidv4(),
      name,
      description,
      currentDate: startDate || {
        year: 1,
        month: 1,
        day: 1,
        hour: 12
      },
      regions: [],
      // Note: Maps are now stored on Continents, not on World
    };

    setWorlds(prev => [...prev, newWorld]);
    setActiveWorldId(newWorld.id);
    return newWorld;
  }, []);

  const updateWorld = useCallback((worldId, updates) => {
    setWorlds(prev => prev.map(world =>
      world.id === worldId
        ? { ...world, ...updates }
        : world
    ));
  }, []);

  const deleteWorld = useCallback((worldId) => {
    // Also delete all continents for this world
    setContinents(prev => prev.filter(c => c.worldId !== worldId));
    setWorlds(prev => prev.filter(w => w.id !== worldId));
    if (activeWorldId === worldId) {
      setActiveWorldId(null);
      setActiveRegionId(null);
      setActiveContinentId(null);
    }
  }, [activeWorldId]);

  const selectWorld = useCallback((worldId) => {
    setActiveWorldId(worldId);
    // Clear active region and continent when switching worlds
    setActiveRegionId(null);
    setActiveContinentId(null);
  }, []);

  // ===== CONTINENT MANAGEMENT =====

  const createContinent = useCallback((name) => {
    if (!activeWorldId) return null;

    const newContinent = {
      id: uuidv4(),
      worldId: activeWorldId,
      name,
      mapImage: null,
      mapScale: null,
      isCollapsed: false,
    };

    setContinents(prev => [...prev, newContinent]);
    setActiveContinentId(newContinent.id);
    return newContinent;
  }, [activeWorldId]);

  const updateContinent = useCallback((continentId, updates) => {
    setContinents(prev => prev.map(continent =>
      continent.id === continentId
        ? { ...continent, ...updates }
        : continent
    ));
  }, []);

  const deleteContinent = useCallback((continentId) => {
    // Move all regions in this continent to uncategorized (remove continentId)
    setWorlds(prev => prev.map(world => ({
      ...world,
      regions: world.regions.map(region =>
        region.continentId === continentId
          ? { ...region, continentId: undefined, mapPosition: undefined }
          : region
      )
    })));

    // Delete the continent
    setContinents(prev => prev.filter(c => c.id !== continentId));

    if (activeContinentId === continentId) {
      setActiveContinentId(null);
    }
  }, [activeContinentId]);

  const selectContinent = useCallback((continentId) => {
    setActiveContinentId(continentId);
  }, []);

  const toggleContinentCollapsed = useCallback((continentId) => {
    setContinents(prev => prev.map(continent =>
      continent.id === continentId
        ? { ...continent, isCollapsed: !continent.isCollapsed }
        : continent
    ));
  }, []);

  const updateContinentMap = useCallback((continentId, mapImage, mapScale) => {
    setContinents(prev => prev.map(continent =>
      continent.id === continentId
        ? { ...continent, mapImage, mapScale }
        : continent
    ));
  }, []);

  // ===== TIME MANAGEMENT =====

  const updateWorldTime = useCallback((newDate) => {
    if (!activeWorldId) return;

    setWorlds(prev => prev.map(world =>
      world.id === activeWorldId
        ? { ...world, currentDate: newDate }
        : world
    ));
  }, [activeWorldId]);

  const advanceTime = useCallback((hours) => {
    if (!activeWorld) return;

    const newDate = advanceDateUtil(activeWorld.currentDate, hours);
    updateWorldTime(newDate);
    return newDate;
  }, [activeWorld, updateWorldTime]);

  const setSpecificTime = useCallback((year, month, day, hour) => {
    if (!activeWorldId) return;

    const newDate = { year, month, day, hour };
    updateWorldTime(newDate);
    return newDate;
  }, [activeWorldId, updateWorldTime]);

  const jumpToDate = useCallback((year, month, day, hour = 12) => {
    if (!activeWorld) return;

    const newDate = {
      year: year ?? activeWorld.currentDate.year,
      month,
      day,
      hour
    };
    updateWorldTime(newDate);
    return newDate;
  }, [activeWorld, updateWorldTime]);

  // ===== REGION MANAGEMENT =====

  const createRegion = useCallback((regionData) => {
    if (!activeWorldId) return null;

    const newRegion = {
      id: uuidv4(),
      worldId: activeWorldId,
      ...regionData,
      locations: []
    };

    setWorlds(prev => prev.map(world =>
      world.id === activeWorldId
        ? { ...world, regions: [...world.regions, newRegion] }
        : world
    ));

    // Auto-select the new region
    setActiveRegionId(newRegion.id);
    return newRegion;
  }, [activeWorldId]);

  const updateRegion = useCallback((regionId, updates) => {
    if (!activeWorldId) return;

    setWorlds(prev => prev.map(world =>
      world.id === activeWorldId
        ? {
          ...world,
          regions: world.regions.map(region =>
            region.id === regionId
              ? { ...region, ...updates }
              : region
          )
        }
        : world
    ));
  }, [activeWorldId]);

  const deleteRegion = useCallback((regionId) => {
    if (!activeWorldId) return;

    setWorlds(prev => prev.map(world =>
      world.id === activeWorldId
        ? {
          ...world,
          regions: world.regions.filter(r => r.id !== regionId)
        }
        : world
    ));

    if (activeRegionId === regionId) {
      setActiveRegionId(null);
    }
  }, [activeWorldId, activeRegionId]);

  const selectRegion = useCallback((regionId) => {
    setActiveRegionId(regionId);
  }, []);

  // ===== LOCATION MANAGEMENT =====

  const createLocation = useCallback((locationData) => {
    if (!activeWorldId || !activeRegionId) return null;

    const newLocation = {
      id: uuidv4(),
      regionId: activeRegionId,
      ...locationData
    };

    setWorlds(prev => prev.map(world =>
      world.id === activeWorldId
        ? {
          ...world,
          regions: world.regions.map(region =>
            region.id === activeRegionId
              ? { ...region, locations: [...region.locations, newLocation] }
              : region
          )
        }
        : world
    ));

    return newLocation;
  }, [activeWorldId, activeRegionId]);

  const updateLocation = useCallback((locationId, updates) => {
    if (!activeWorldId || !activeRegionId) return;

    setWorlds(prev => prev.map(world =>
      world.id === activeWorldId
        ? {
          ...world,
          regions: world.regions.map(region =>
            region.id === activeRegionId
              ? {
                ...region,
                locations: region.locations.map(loc =>
                  loc.id === locationId ? { ...loc, ...updates } : loc
                )
              }
              : region
          )
        }
        : world
    ));
  }, [activeWorldId, activeRegionId]);

  const deleteLocation = useCallback((locationId) => {
    if (!activeWorldId || !activeRegionId) return;

    setWorlds(prev => prev.map(world =>
      world.id === activeWorldId
        ? {
          ...world,
          regions: world.regions.map(region =>
            region.id === activeRegionId
              ? {
                ...region,
                locations: region.locations.filter(loc => loc.id !== locationId)
              }
              : region
          )
        }
        : world
    ));
  }, [activeWorldId, activeRegionId]);

  const contextValue = {
    // State
    worlds,
    continents,
    activeWorld,
    activeRegion,
    activeContinent,
    activeWorldId,
    activeRegionId,
    activeContinentId,
    isLoading,

    // Derived state
    worldContinents,
    groupedRegions,

    // World methods
    createWorld,
    updateWorld,
    deleteWorld,
    selectWorld,

    // Continent methods
    createContinent,
    updateContinent,
    deleteContinent,
    selectContinent,
    toggleContinentCollapsed,
    updateContinentMap,

    // Time methods
    updateWorldTime,
    advanceTime,
    setSpecificTime,
    jumpToDate,

    // Region methods
    createRegion,
    updateRegion,
    deleteRegion,
    selectRegion,

    // Location methods
    createLocation,
    updateLocation,
    deleteLocation,
  };

  return (
    <WorldContext.Provider value={contextValue}>
      {children}
    </WorldContext.Provider>
  );
};
