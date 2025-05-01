// hooks/useWorld.js
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWorldContext, ACTIONS } from '../contexts/WorldContext';
import StorageService from '../services/storage-service';

const useWorld = () => {
  const { state, dispatch } = useWorldContext();
  const storageService = new StorageService();

  // Load all worlds from storage
  const loadWorlds = useCallback(() => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      const data = storageService.initialize();
      dispatch({ type: ACTIONS.SET_WORLDS, payload: data.worlds || [] });
      
      // Set active IDs from storage if available
      if (data.activeWorldId) {
        dispatch({ type: ACTIONS.SET_ACTIVE_WORLD, payload: data.activeWorldId });
        
        if (data.activeRegionId) {
          dispatch({ type: ACTIONS.SET_ACTIVE_REGION, payload: data.activeRegionId });
          
          if (data.activeLocationId) {
            dispatch({ type: ACTIONS.SET_ACTIVE_LOCATION, payload: data.activeLocationId });
          }
        }
      }
    } catch (error) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: `Failed to load worlds: ${error.message}` 
      });
    }
  }, [dispatch, storageService]);

  // Create a new world
  const createWorld = useCallback((worldData) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      const newWorld = {
        id: uuidv4(),
        name: worldData.name,
        calendar: worldData.calendar || 'gregorian',
        startDate: worldData.startDate || new Date().toISOString(),
        winterSolstice: worldData.winterSolstice || '12-21',
        summerSolstice: worldData.summerSolstice || '06-21',
        springEquinox: worldData.springEquinox || '03-20',
        fallEquinox: worldData.fallEquinox || '09-22',
        regions: []
      };
      
      storageService.saveWorld(newWorld);
      dispatch({ type: ACTIONS.ADD_WORLD, payload: newWorld });
      
      return newWorld;
    } catch (error) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: `Failed to create world: ${error.message}` 
      });
    }
  }, [dispatch, storageService]);

  // Update an existing world
  const updateWorld = useCallback((worldId, worldData) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      const existingWorld = state.worlds.find(w => w.id === worldId);
      
      if (!existingWorld) {
        throw new Error(`World with ID ${worldId} not found`);
      }
      
      const updatedWorld = {
        ...existingWorld,
        ...worldData,
        id: worldId // Ensure ID doesn't change
      };
      
      storageService.saveWorld(updatedWorld);
      dispatch({ type: ACTIONS.UPDATE_WORLD, payload: updatedWorld });
      
      return updatedWorld;
    } catch (error) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: `Failed to update world: ${error.message}` 
      });
    }
  }, [state.worlds, dispatch, storageService]);

  // Delete a world
  const deleteWorld = useCallback((worldId) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      storageService.deleteWorld(worldId);
      dispatch({ type: ACTIONS.DELETE_WORLD, payload: worldId });
    } catch (error) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: `Failed to delete world: ${error.message}` 
      });
    }
  }, [dispatch, storageService]);

  // Set the active world
  const setActiveWorld = useCallback((worldId) => {
    try {
      storageService.setActiveWorld(worldId);
      dispatch({ type: ACTIONS.SET_ACTIVE_WORLD, payload: worldId });
    } catch (error) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: `Failed to set active world: ${error.message}` 
      });
    }
  }, [dispatch, storageService]);

  // Create a new region in a world
  const createRegion = useCallback((worldId, regionData) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      const newRegion = {
        id: uuidv4(),
        name: regionData.name,
        climate: regionData.climate || 'temperate',
        description: regionData.description || '',
        locations: []
      };
      
      storageService.saveRegion(worldId, newRegion);
      dispatch({ 
        type: ACTIONS.ADD_REGION, 
        payload: { worldId, region: newRegion } 
      });
      
      return newRegion;
    } catch (error) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: `Failed to create region: ${error.message}` 
      });
    }
  }, [dispatch, storageService]);

  // Update an existing region
  const updateRegion = useCallback((worldId, regionId, regionData) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      const world = state.worlds.find(w => w.id === worldId);
      
      if (!world) {
        throw new Error(`World with ID ${worldId} not found`);
      }
      
      const existingRegion = world.regions.find(r => r.id === regionId);
      
      if (!existingRegion) {
        throw new Error(`Region with ID ${regionId} not found`);
      }
      
      const updatedRegion = {
        ...existingRegion,
        ...regionData,
        id: regionId // Ensure ID doesn't change
      };
      
      storageService.saveRegion(worldId, updatedRegion);
      dispatch({ 
        type: ACTIONS.UPDATE_REGION, 
        payload: { worldId, region: updatedRegion } 
      });
      
      return updatedRegion;
    } catch (error) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: `Failed to update region: ${error.message}` 
      });
    }
  }, [state.worlds, dispatch, storageService]);

  // Delete a region
  const deleteRegion = useCallback((worldId, regionId) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      storageService.deleteRegion(worldId, regionId);
      dispatch({ 
        type: ACTIONS.DELETE_REGION, 
        payload: { worldId, regionId } 
      });
    } catch (error) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: `Failed to delete region: ${error.message}` 
      });
    }
  }, [dispatch, storageService]);

  // Set the active region
  const setActiveRegion = useCallback((worldId, regionId) => {
    try {
      storageService.setActiveRegion(worldId, regionId);
      dispatch({ type: ACTIONS.SET_ACTIVE_REGION, payload: regionId });
    } catch (error) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: `Failed to set active region: ${error.message}` 
      });
    }
  }, [dispatch, storageService]);

  // Create a new location in a region
  const createLocation = useCallback((worldId, regionId, locationData) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      const newLocation = {
        id: uuidv4(),
        name: locationData.name,
        description: locationData.description || '',
        currentDate: locationData.currentDate || new Date().toISOString(),
        weatherData: null
      };
      
      storageService.saveLocation(worldId, regionId, newLocation);
      dispatch({ 
        type: ACTIONS.ADD_LOCATION, 
        payload: { worldId, regionId, location: newLocation } 
      });
      
      return newLocation;
    } catch (error) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: `Failed to create location: ${error.message}` 
      });
    }
  }, [dispatch, storageService]);

  // Update an existing location
  const updateLocation = useCallback((worldId, regionId, locationId, locationData) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      const world = state.worlds.find(w => w.id === worldId);
      
      if (!world) {
        throw new Error(`World with ID ${worldId} not found`);
      }
      
      const region = world.regions.find(r => r.id === regionId);
      
      if (!region) {
        throw new Error(`Region with ID ${regionId} not found`);
      }
      
      const existingLocation = region.locations.find(l => l.id === locationId);
      
      if (!existingLocation) {
        throw new Error(`Location with ID ${locationId} not found`);
      }
      
      const updatedLocation = {
        ...existingLocation,
        ...locationData,
        id: locationId // Ensure ID doesn't change
      };
      
      storageService.saveLocation(worldId, regionId, updatedLocation);
      dispatch({ 
        type: ACTIONS.UPDATE_LOCATION, 
        payload: { worldId, regionId, location: updatedLocation } 
      });
      
      return updatedLocation;
    } catch (error) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: `Failed to update location: ${error.message}` 
      });
    }
  }, [state.worlds, dispatch, storageService]);

  // Delete a location
  const deleteLocation = useCallback((worldId, regionId, locationId) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      storageService.deleteLocation(worldId, regionId, locationId);
      dispatch({ 
        type: ACTIONS.DELETE_LOCATION, 
        payload: { worldId, regionId, locationId } 
      });
    } catch (error) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: `Failed to delete location: ${error.message}` 
      });
    }
  }, [dispatch, storageService]);

  // Set the active location
  const setActiveLocation = useCallback((worldId, regionId, locationId) => {
    try {
      storageService.setActiveLocation(worldId, regionId, locationId);
      dispatch({ type: ACTIONS.SET_ACTIVE_LOCATION, payload: locationId });
    } catch (error) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: `Failed to set active location: ${error.message}` 
      });
    }
  }, [dispatch, storageService]);

  // Save weather data for a location
  const saveWeatherData = useCallback((worldId, regionId, locationId, weatherData) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      storageService.saveWeatherData(worldId, regionId, locationId, weatherData);
      dispatch({ 
        type: ACTIONS.UPDATE_WEATHER_DATA, 
        payload: { worldId, regionId, locationId, weatherData } 
      });
    } catch (error) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: `Failed to save weather data: ${error.message}` 
      });
    }
  }, [dispatch, storageService]);

  // Get the active world object
  const getActiveWorld = useCallback(() => {
    return state.worlds.find(world => world.id === state.activeWorldId) || null;
  }, [state.worlds, state.activeWorldId]);

  // Get the active region object
  const getActiveRegion = useCallback(() => {
    const activeWorld = getActiveWorld();
    
    if (!activeWorld || !state.activeRegionId) {
      return null;
    }
    
    return activeWorld.regions.find(region => region.id === state.activeRegionId) || null;
  }, [getActiveWorld, state.activeRegionId]);

  // Get the active location object
  const getActiveLocation = useCallback(() => {
    const activeRegion = getActiveRegion();
    
    if (!activeRegion || !state.activeLocationId) {
      return null;
    }
    
    return activeRegion.locations.find(location => location.id === state.activeLocationId) || null;
  }, [getActiveRegion, state.activeLocationId]);

  // Create example world for first-time users
  const createExampleWorld = useCallback(() => {
    const worldId = uuidv4();
    const regionId = uuidv4();
    const locationId = uuidv4();
    
    const exampleWorld = {
      id: worldId,
      name: 'Example World',
      calendar: 'gregorian',
      startDate: new Date().toISOString(),
      winterSolstice: '12-21', // MM-DD format
      summerSolstice: '06-21',
      springEquinox: '03-20',
      fallEquinox: '09-22',
      regions: [
        {
          id: regionId,
          name: 'Temperate Region',
          climate: 'temperate',
          locations: [
            {
              id: locationId,
              name: 'Starting Village',
              currentDate: new Date().toISOString(),
              weatherData: null // Will be initialized when first viewed
            }
          ]
        }
      ]
    };
    
    storageService.saveWorld(exampleWorld);
    storageService.setActiveLocation(worldId, regionId, locationId);
    
    dispatch({ type: ACTIONS.SET_WORLDS, payload: [exampleWorld] });
    dispatch({ type: ACTIONS.SET_ACTIVE_WORLD, payload: worldId });
    dispatch({ type: ACTIONS.SET_ACTIVE_REGION, payload: regionId });
    dispatch({ type: ACTIONS.SET_ACTIVE_LOCATION, payload: locationId });
    
    return exampleWorld;
  }, [dispatch, storageService]);

  return {
    worlds: state.worlds,
    activeWorldId: state.activeWorldId,
    activeRegionId: state.activeRegionId,
    activeLocationId: state.activeLocationId,
    isLoading: state.isLoading,
    error: state.error,
    getActiveWorld,
    getActiveRegion,
    getActiveLocation,
    loadWorlds,
    createWorld,
    updateWorld,
    deleteWorld,
    setActiveWorld,
    createRegion,
    updateRegion,
    deleteRegion,
    setActiveRegion,
    createLocation,
    updateLocation,
    deleteLocation,
    setActiveLocation,
    saveWeatherData,
    createExampleWorld
  };
};

export default useWorld