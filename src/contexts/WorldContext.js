// src/contexts/WorldContext.js
import React, { createContext, useReducer, useContext, useEffect } from 'react';

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
      
    default:
      return state;
  }
};

// Provider component
export const WorldProvider = ({ children }) => {
  const [state, dispatch] = useReducer(worldReducer, initialState);
  
  // Load world state from localStorage on init
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        console.log("Loading world data from localStorage...");
        
        // Load world time
        const savedWorldTime = localStorage.getItem(WORLD_TIME_KEY);
        if (savedWorldTime) {
          console.log("Found saved world time:", savedWorldTime);
          dispatch({ type: ACTIONS.SET_CURRENT_DATE, payload: savedWorldTime });
        } else {
          console.log("No saved world time found, using default");
        }
        
        // Load weather history and timestamps
        const savedWorldData = localStorage.getItem(WORLD_KEY);
        if (savedWorldData) {
          console.log("Found saved world data");
          try {
            const parsedData = JSON.parse(savedWorldData);
            console.log("Parsed world data:", parsedData);
            
            // Restore weather history
            if (parsedData.weatherHistory) {
              const regions = Object.keys(parsedData.weatherHistory);
              console.log("Found weather history for regions:", regions);
              
              Object.entries(parsedData.weatherHistory).forEach(([regionId, weatherData]) => {
                console.log(`Restoring weather for region ${regionId}`);
                dispatch({ 
                  type: ACTIONS.UPDATE_REGION_WEATHER, 
                  payload: { regionId, weatherData } 
                });
              });
            }
            
            // Restore timestamps
            if (parsedData.lastUpdateTimes) {
              Object.entries(parsedData.lastUpdateTimes).forEach(([regionId, timestamp]) => {
                dispatch({ 
                  type: ACTIONS.UPDATE_REGION_TIMESTAMP, 
                  payload: { regionId, timestamp } 
                });
              });
            }
          } catch (parseError) {
            console.error("Error parsing saved world data:", parseError);
          }
        } else {
          console.log("No saved world data found");
        }
      } catch (error) {
        console.error('Error loading world data from localStorage:', error);
      }
    };
    
    loadFromStorage();
  }, []);  // Empty dependency array means this runs once on mount
  
  // Save world state to localStorage
  useEffect(() => {
    const saveToStorage = () => {
      try {
        // Save current time
        console.log("Saving world time to localStorage:", state.currentDate);
        localStorage.setItem(WORLD_TIME_KEY, state.currentDate);
        
        // Save weather history and timestamps
        const dataToSave = {
          weatherHistory: state.weatherHistory,
          lastUpdateTimes: state.lastUpdateTimes
        };
        console.log("Saving weather history for regions:", Object.keys(state.weatherHistory));
        localStorage.setItem(WORLD_KEY, JSON.stringify(dataToSave));
        
        // Verify the save worked
        const savedData = localStorage.getItem(WORLD_KEY);
        console.log("Verification - saved data size:", savedData ? savedData.length : 0, "bytes");
      } catch (error) {
        console.error('Error saving world data to localStorage:', error);
      }
    };
    
    // Save the current state
    saveToStorage();
  }, [state.currentDate, state.weatherHistory, state.lastUpdateTimes]);
  
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
    // First dispatch the time advancement
    dispatch({ type: ACTIONS.ADVANCE_TIME, payload: hours });
    
    // Calculate the new date
    const newDate = new Date(currentDate);
    newDate.setHours(newDate.getHours() + hours);
    const newDateString = newDate.toISOString();
    
    // No need to update timestamps here - we'll handle that
    // in the WeatherDashboard component as needed
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
  
  // Get last update time for a region
  const getRegionLastUpdateTime = (regionId) => {
    return state.lastUpdateTimes[regionId] || null;
  };

  // Update last update time for a region
  const updateRegionTimestamp = (regionId, timestamp = new Date().toISOString()) => {
    dispatch({
      type: ACTIONS.UPDATE_REGION_TIMESTAMP,
      payload: { regionId, timestamp }
    });
  };
  
  return {
    currentDate,
    weatherHistory: state.weatherHistory,
    lastUpdateTimes: state.lastUpdateTimes,
    isLoading: state.isLoading,
    error: state.error,
    advanceTime,
    getRegionWeather,
    updateRegionWeather,
    getRegionLastUpdateTime,
    updateRegionTimestamp
  };
};