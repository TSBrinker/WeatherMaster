import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  saveWorlds,
  loadWorlds,
  saveActiveWorldId,
  loadActiveWorldId,
  saveActiveRegionId,
  loadActiveRegionId,
} from '../services/storage/localStorage';
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
  const [worlds, setWorlds] = useState(() => loadWorlds());
  const [activeWorldId, setActiveWorldId] = useState(() => loadActiveWorldId());
  const [activeRegionId, setActiveRegionId] = useState(() => loadActiveRegionId());

  // Derived state
  const activeWorld = worlds.find(w => w.id === activeWorldId) || null;
  const activeRegion = activeWorld?.regions.find(r => r.id === activeRegionId) || null;

  // Save to localStorage whenever worlds change
  useEffect(() => {
    saveWorlds(worlds);
  }, [worlds]);

  useEffect(() => {
    saveActiveWorldId(activeWorldId);
  }, [activeWorldId]);

  useEffect(() => {
    saveActiveRegionId(activeRegionId);
  }, [activeRegionId]);

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
      // Map configuration (optional)
      mapImage: null,           // base64 string or null
      mapScale: null            // { milesPerPixel, topEdgeDistanceFromCenter } or null
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
    setWorlds(prev => prev.filter(w => w.id !== worldId));
    if (activeWorldId === worldId) {
      setActiveWorldId(null);
      setActiveRegionId(null);
    }
  }, [activeWorldId]);

  const selectWorld = useCallback((worldId) => {
    setActiveWorldId(worldId);
    // Clear active region when switching worlds
    setActiveRegionId(null);
  }, []);

  const updateWorldMap = useCallback((mapImage, mapScale) => {
    if (!activeWorldId) return;

    setWorlds(prev => prev.map(world =>
      world.id === activeWorldId
        ? { ...world, mapImage, mapScale }
        : world
    ));
  }, [activeWorldId]);

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
    activeWorld,
    activeRegion,
    activeWorldId,
    activeRegionId,

    // World methods
    createWorld,
    updateWorld,
    deleteWorld,
    selectWorld,
    updateWorldMap,

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
