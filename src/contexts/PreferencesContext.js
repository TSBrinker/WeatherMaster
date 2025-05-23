// src/contexts/PreferencesContext.js
import React, { createContext, useReducer, useContext, useEffect, useRef } from 'react';
import { storageUtils } from '../utils/storageUtils';

// Storage key for preferences
const PREFS_STORAGE_KEY = 'gm-weather-companion-preferences';
const REGIONS_STORAGE_KEY = 'gm-weather-companion-regions';

// Initial preferences - FORCED TO METEOROLOGICAL
const initialPreferences = {
  weatherSystem: 'meteorological', 
  debugMode: false,
  isOpen: false, // Whether the preferences menu is open
  temperatureUnit: 'fahrenheit',
  timeFormat: '12hour',
  windSpeedUnit: 'mph',
  showFeelsLike: true
};

// Create context
export const PreferencesContext = createContext();

// Action types
export const ACTIONS = {
  SET_WEATHER_SYSTEM: 'set_weather_system',
  SET_DEBUG_MODE: 'set_debug_mode',
  TOGGLE_PREFERENCES_MENU: 'toggle_preferences_menu',
  LOAD_PREFERENCES: 'load_preferences',
  SET_TEMPERATURE_UNIT: 'set_temperature_unit',
  SET_TIME_FORMAT: 'set_time_format',
  SET_WIND_SPEED_UNIT: 'set_wind_speed_unit',
  SET_SHOW_FEELS_LIKE: 'set_show_feels_like'
};

// Reducer function
const preferencesReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_WEATHER_SYSTEM:
      // ADDED: Force meteorological system only
      console.log('Weather system change blocked - meteorological only mode');
      return {
        ...state,
        weatherSystem: 'meteorological' // Always force meteorological
      };
    
    case ACTIONS.SET_DEBUG_MODE:
      return {
        ...state,
        debugMode: action.payload
      };
    
    case ACTIONS.TOGGLE_PREFERENCES_MENU:
      return {
        ...state,
        isOpen: !state.isOpen
      };
    
    case ACTIONS.LOAD_PREFERENCES:
      // ADDED: Force meteorological even when loading saved preferences
      const loadedPrefs = {
        ...action.payload,
        weatherSystem: 'meteorological', // Override any saved dice table preference
        isOpen: state.isOpen // Preserve UI state
      };
      return {
        ...state,
        ...loadedPrefs
      };
          case ACTIONS.SET_TEMPERATURE_UNIT:
      return {
        ...state,
        temperatureUnit: action.payload
      };
    
    case ACTIONS.SET_TIME_FORMAT:
      return {
        ...state,
        timeFormat: action.payload
      };
    
    case ACTIONS.SET_WIND_SPEED_UNIT:
      return {
        ...state,
        windSpeedUnit: action.payload
      };
    
    case ACTIONS.SET_SHOW_FEELS_LIKE:
      return {
        ...state,
        showFeelsLike: action.payload
      };
    
    default:
      return state;
  }
};

// Provider component
export const PreferencesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(preferencesReducer, initialPreferences);
  
  // Use ref to track previous weather system value
  const previousWeatherSystem = useRef(state.weatherSystem);
  
  // Load preferences on initial render
  useEffect(() => {
    const loadPreferences = () => {
      const savedPrefs = storageUtils.loadData(PREFS_STORAGE_KEY, null);
      
      if (savedPrefs) {
        dispatch({ 
          type: ACTIONS.LOAD_PREFERENCES, 
          payload: savedPrefs 
        });
        
        // CHANGED: Always initialize with meteorological
        previousWeatherSystem.current = 'meteorological';
      }
    };
    
    loadPreferences();
  }, []);
  
  // Save preferences when they change and update regions if weather system changes
useEffect(() => {
  const prefsToSave = {
    weatherSystem: 'meteorological',
    debugMode: state.debugMode,
    temperatureUnit: state.temperatureUnit,
    timeFormat: state.timeFormat,
    windSpeedUnit: state.windSpeedUnit,
    showFeelsLike: state.showFeelsLike
  };
  
  storageUtils.saveData(PREFS_STORAGE_KEY, prefsToSave);
}, [state.weatherSystem, state.debugMode, state.temperatureUnit, state.timeFormat, state.windSpeedUnit, state.showFeelsLike]);
  
  
  // Function to update all regions' weather type
  const updateAllRegionsWeatherType = (weatherSystem) => {
    try {
      // Get all regions from storage
      const regions = storageUtils.loadData(REGIONS_STORAGE_KEY, []);
      
      if (!regions || regions.length === 0) {
        console.log('No regions to update');
        return;
      }
      
      console.log(`Updating ${regions.length} regions to use weather system: ${weatherSystem}`);
      
      // CHANGED: Force all regions to use meteorological
      const updatedRegions = regions.map(region => ({
        ...region,
        weatherType: 'meteorological' // Force meteorological for all regions
      }));
      
      // Save the updated regions
      storageUtils.saveData(REGIONS_STORAGE_KEY, updatedRegions);
      console.log('Regions updated to meteorological system');
      
      // Also clear any cached weather data that might be using the old system
      const weatherDataKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('gm-weather-companion-') && key.includes('weather')
      );
      
      for (const key of weatherDataKeys) {
        if (key !== REGIONS_STORAGE_KEY && key !== PREFS_STORAGE_KEY) {
          console.log(`Clearing cached weather data: ${key}`);
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error updating regions:', error);
    }
  };
  
  // ADDED: Function to migrate any existing dice table regions to meteorological
  const migrateExistingRegionsToMeteorological = () => {
    try {
      const regions = storageUtils.loadData(REGIONS_STORAGE_KEY, []);
      
      if (regions && regions.length > 0) {
        const hasUpdates = regions.some(region => region.weatherType !== 'meteorological');
        
        if (hasUpdates) {
          console.log('Migrating existing regions to meteorological system');
          updateAllRegionsWeatherType('meteorological');
        }
      }
    } catch (error) {
      console.error('Error migrating regions:', error);
    }
  };
  
  // Run migration on component mount
  useEffect(() => {
    migrateExistingRegionsToMeteorological();
  }, []);
  
  // Create context value
  const value = {
    state,
    setWeatherSystem: (system) => {
      // ADDED: Log that weather system changes are disabled
      console.log(`Weather system change to "${system}" ignored - meteorological only mode`);
      // Still dispatch but reducer will force meteorological
      dispatch({ type: ACTIONS.SET_WEATHER_SYSTEM, payload: system });
    },
    setDebugMode: (enabled) => {
      dispatch({ type: ACTIONS.SET_DEBUG_MODE, payload: enabled });
    },
    togglePreferencesMenu: () => {
      dispatch({ type: ACTIONS.TOGGLE_PREFERENCES_MENU });
    },
      setTemperatureUnit: (unit) => {
    dispatch({ type: ACTIONS.SET_TEMPERATURE_UNIT, payload: unit });
  },
  setTimeFormat: (format) => {
    dispatch({ type: ACTIONS.SET_TIME_FORMAT, payload: format });
  },
  setWindSpeedUnit: (unit) => {
    dispatch({ type: ACTIONS.SET_WIND_SPEED_UNIT, payload: unit });
  },
  setShowFeelsLike: (show) => {
    dispatch({ type: ACTIONS.SET_SHOW_FEELS_LIKE, payload: show });
  },
    // Expose the function to update all regions (will always use meteorological now)
    updateAllRegionsWeatherType,
    // ADDED: Expose the migration function
    migrateExistingRegionsToMeteorological
  };
  
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

// Custom hook
export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};