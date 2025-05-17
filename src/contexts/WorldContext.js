// src/contexts/WorldContext.js
import React, { createContext, useReducer, useContext, useEffect, useCallback } from 'react';
import { storageUtils } from '../utils/storageUtils';
import { useWorldSettings } from './WorldSettings';

// Storage keys
const WORLD_KEY = 'gm-weather-companion-world';
const WORLD_TIME_KEY = 'gm-weather-companion-world-time';

// Initial state
const initialState = {
  currentDate: new Date().toISOString(),
  weatherHistory: {}, // Will store weather history by regionId
  lastUpdateTimes: {}, // Track when each region was last updated
  isLoading: false,
  error: null
};

// Create context
export const WorldContext = createContext();

// Action types
export const ACTIONS = {
  SET_CURRENT_DATE: 'set_current_date',
  ADVANCE_TIME: 'advance_time',
  UPDATE_REGION_WEATHER: 'update_region_weather',
  UPDATE_REGION_TIMESTAMP: 'update_region_timestamp',
  SET_LOADING: 'set_loading',
  SET_ERROR: 'set_error',
  SYNC_WITH_SETTINGS: 'sync_with_settings'
};

// Reducer function
const worldReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_CURRENT_DATE:
      return {
        ...state,
        currentDate: action.payload
      };
    
    case ACTIONS.ADVANCE_TIME: {
      // Calculate new date by adding hours
      const currentDate = new Date(state.currentDate);
      currentDate.setHours(currentDate.getHours() + action.payload);
      
      return {
        ...state,
        currentDate: currentDate.toISOString()
      };
    }
    
    case ACTIONS.UPDATE_REGION_WEATHER: {
      const { regionId, weatherData } = action.payload;
      
      return {
        ...state,
        weatherHistory: {
          ...state.weatherHistory,
          [regionId]: weatherData
        }
      };
    }
    
    case ACTIONS.UPDATE_REGION_TIMESTAMP: {
      const { regionId, timestamp } = action.payload;
      
      return {
        ...state,
        lastUpdateTimes: {
          ...state.lastUpdateTimes,
          [regionId]: timestamp
        }
      };
    }
    
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case ACTIONS.SYNC_WITH_SETTINGS: {
      // Only update if the date is different
      const currentDate = new Date(state.currentDate);
      const settingsDate = new Date(action.payload);
      
      // Check if dates are significantly different (more than 1 second)
      if (Math.abs(currentDate - settingsDate) > 1000) {
        // console.log("Syncing world time with settings:", settingsDate.toISOString());
        return {
          ...state,
          currentDate: settingsDate.toISOString()
        };
      }
      return state;
    }
      
    default:
      return state;
  }
};

// Provider component
export const WorldProvider = ({ children }) => {
  const [state, dispatch] = useReducer(worldReducer, initialState);
  
  // Get access to WorldSettings context
  const { state: worldSettings } = useWorldSettings();
  
  // Load world data on initial render
  useEffect(() => {
    const loadWorldData = () => {
      // Debug - list all localStorage keys
      storageUtils.listKeys();
      
      // Load world settings first to get the proper game time
      const worldSettings = storageUtils.loadData('gm-weather-companion-world-settings', null);
      
      // Load world time from settings if available, otherwise use from world time storage
      let worldTime;
      if (worldSettings && worldSettings.gameTime) {
        worldTime = worldSettings.gameTime;
        // console.log('Using time from world settings:', worldTime);
      } else {
        worldTime = storageUtils.loadData(WORLD_TIME_KEY, new Date().toISOString());
        // console.log('Using time from world time storage:', worldTime);
      }
      
      dispatch({ type: ACTIONS.SET_CURRENT_DATE, payload: worldTime });
      
      // Load world data
      const worldData = storageUtils.loadData(WORLD_KEY, { weatherHistory: {}, lastUpdateTimes: {} });
      
      // console.log("Loaded world data:", worldData);
      
      // Restore weather history
      if (worldData.weatherHistory) {
        Object.entries(worldData.weatherHistory).forEach(([regionId, weatherData]) => {
          dispatch({ 
            type: ACTIONS.UPDATE_REGION_WEATHER, 
            payload: { regionId, weatherData } 
          });
        });
      }
      
      // Restore last update times
      if (worldData.lastUpdateTimes) {
        Object.entries(worldData.lastUpdateTimes).forEach(([regionId, timestamp]) => {
          dispatch({ 
            type: ACTIONS.UPDATE_REGION_TIMESTAMP, 
            payload: { regionId, timestamp } 
          });
        });
      }
    };
    
    loadWorldData();
  }, []);
  
  // Sync with WorldSettings when it changes
  useEffect(() => {
    if (worldSettings.gameTime && worldSettings.isConfigured) {
      dispatch({ 
        type: ACTIONS.SYNC_WITH_SETTINGS, 
        payload: worldSettings.gameTime 
      });
    }
  }, [worldSettings.gameTime, worldSettings.isConfigured]);
  
  // Save world data when it changes
  useEffect(() => {
    // Save world time
    storageUtils.saveData(WORLD_TIME_KEY, state.currentDate);
    
    // Save world data
    const worldData = {
      weatherHistory: state.weatherHistory,
      lastUpdateTimes: state.lastUpdateTimes
    };
    
    const regionIds = Object.keys(state.weatherHistory);
    if (regionIds.length > 0) {
      // console.log(`Saving weather data for ${regionIds.length} regions`);
      storageUtils.saveData(WORLD_KEY, worldData);
    }
  }, [state.currentDate, state.weatherHistory, state.lastUpdateTimes]);
  
  // Callbacks for context functions
  const setCurrentDate = useCallback((date) => {
    // Accept either Date object or ISO string
    const dateValue = date instanceof Date ? date.toISOString() : date;
    // console.log("Setting current date:", dateValue);
    dispatch({ type: ACTIONS.SET_CURRENT_DATE, payload: dateValue });
  }, []);

  const advanceTime = useCallback((hours) => {
    // console.log(`Advancing world time by ${hours} hours`);
    dispatch({ type: ACTIONS.ADVANCE_TIME, payload: hours });
  }, []);

  const getRegionWeather = useCallback((regionId) => {
    return state.weatherHistory[regionId] || null;
  }, [state.weatherHistory]);

  const updateRegionWeather = useCallback((regionId, weatherData) => {
    dispatch({
      type: ACTIONS.UPDATE_REGION_WEATHER,
      payload: { regionId, weatherData }
    });
  }, []);

  const getRegionLastUpdateTime = useCallback((regionId) => {
    return state.lastUpdateTimes[regionId] || null;
  }, [state.lastUpdateTimes]);

  const updateRegionTimestamp = useCallback((regionId, timestamp = new Date().toISOString()) => {
    dispatch({
      type: ACTIONS.UPDATE_REGION_TIMESTAMP,
      payload: { regionId, timestamp }
    });
  }, []);
  
  // Create memoized context value
  const value = React.useMemo(() => {
    return {
      currentDate: new Date(state.currentDate), // Convert ISO string to Date object
      weatherHistory: state.weatherHistory,
      lastUpdateTimes: state.lastUpdateTimes,
      isLoading: state.isLoading,
      error: state.error,
      setCurrentDate,
      advanceTime,
      getRegionWeather,
      updateRegionWeather,
      getRegionLastUpdateTime,
      updateRegionTimestamp
    };
  }, [
    state.currentDate, 
    state.weatherHistory, 
    state.lastUpdateTimes, 
    state.isLoading, 
    state.error,
    setCurrentDate,
    advanceTime,
    getRegionWeather,
    updateRegionWeather,
    getRegionLastUpdateTime,
    updateRegionTimestamp
  ]);
  
  return (
    <WorldContext.Provider value={value}>
      {children}
    </WorldContext.Provider>
  );
};

// Custom hook
export const useWorld = () => {
  const context = useContext(WorldContext);
  if (!context) {
    throw new Error('useWorld must be used within a WorldProvider');
  }
  return context;
};