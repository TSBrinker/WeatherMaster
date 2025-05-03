// src/contexts/WorldContext.js

import React, { createContext, useReducer, useContext, useEffect } from 'react';

// Storage keys
const WORLD_KEY = 'gm-weather-companion-world';
const WORLD_TIME_KEY = 'gm-weather-companion-world-time';

// Initial state
const initialState = {
  currentDate: new Date().toISOString(),
  weatherHistory: {}, // Will store weather history by regionId
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
  SET_LOADING: 'set_loading',
  SET_ERROR: 'set_error'
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
      
    default:
      return state;
  }
};

// Provider component
export const WorldProvider = ({ children }) => {
  const [state, dispatch] = useReducer(worldReducer, initialState);
  
  // Load world state from localStorage on init
  useEffect(() => {
    try {
      // Load world time
      const savedWorldTime = localStorage.getItem(WORLD_TIME_KEY);
      if (savedWorldTime) {
        dispatch({ type: ACTIONS.SET_CURRENT_DATE, payload: savedWorldTime });
      }
      
      // Load weather history
      const savedWorldData = localStorage.getItem(WORLD_KEY);
      if (savedWorldData) {
        const parsedData = JSON.parse(savedWorldData);
        // Only restore weather history, not the full state
        if (parsedData.weatherHistory) {
          Object.entries(parsedData.weatherHistory).forEach(([regionId, weatherData]) => {
            dispatch({ 
              type: ACTIONS.UPDATE_REGION_WEATHER, 
              payload: { regionId, weatherData } 
            });
          });
        }
      }
    } catch (error) {
      console.error('Error loading world data from localStorage:', error);
    }
  }, []);
  
  // Save world state to localStorage
  useEffect(() => {
    try {
      // Save current time
      localStorage.setItem(WORLD_TIME_KEY, state.currentDate);
      
      // Save weather history
      localStorage.setItem(WORLD_KEY, JSON.stringify({
        weatherHistory: state.weatherHistory
      }));
    } catch (error) {
      console.error('Error saving world data to localStorage:', error);
    }
  }, [state.currentDate, state.weatherHistory]);
  
  // Create memoized context value
  const value = React.useMemo(() => ({ state, dispatch }), [state]);
  
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
  
  const { state, dispatch } = context;
  
  // Current date as a Date object
  const currentDate = new Date(state.currentDate);
  
  // Advance time for all regions
  const advanceTime = (hours) => {
    dispatch({ type: ACTIONS.ADVANCE_TIME, payload: hours });
  };
  
  // Get weather for a specific region
  const getRegionWeather = (regionId) => {
    return state.weatherHistory[regionId] || null;
  };
  
  // Update weather for a specific region
  const updateRegionWeather = (regionId, weatherData) => {
    dispatch({
      type: ACTIONS.UPDATE_REGION_WEATHER,
      payload: { regionId, weatherData }
    });
  };
  
  return {
    currentDate,
    weatherHistory: state.weatherHistory,
    isLoading: state.isLoading,
    error: state.error,
    advanceTime,
    getRegionWeather,
    updateRegionWeather
  };
};