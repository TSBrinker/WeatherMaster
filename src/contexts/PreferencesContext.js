// src/contexts/PreferencesContext.js
import React, { createContext, useReducer, useContext, useEffect, useRef } from 'react';
import { storageUtils } from '../utils/storageUtils';

// Storage key for preferences
const PREFS_STORAGE_KEY = 'gm-weather-companion-preferences';
const REGIONS_STORAGE_KEY = 'gm-weather-companion-regions';

// Initial preferences
const initialPreferences = {
  weatherSystem: 'diceTable', // 'diceTable' or 'meteorological'
  debugMode: false,
  isOpen: false // Whether the preferences menu is open
};

// Create context
export const PreferencesContext = createContext();

// Action types
export const ACTIONS = {
  SET_WEATHER_SYSTEM: 'set_weather_system',
  SET_DEBUG_MODE: 'set_debug_mode',
  TOGGLE_PREFERENCES_MENU: 'toggle_preferences_menu',
  LOAD_PREFERENCES: 'load_preferences'
};

// Reducer function
const preferencesReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_WEATHER_SYSTEM:
      return {
        ...state,
        weatherSystem: action.payload
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
      return {
        ...state,
        ...action.payload,
        isOpen: state.isOpen // Preserve UI state
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
        
        // Initialize the ref with the loaded value
        previousWeatherSystem.current = savedPrefs.weatherSystem || 'diceTable';
      }
    };
    
    loadPreferences();
  }, []);
  
  // Save preferences when they change and update regions if weather system changes
  useEffect(() => {
    // Don't save the isOpen state as that's just UI state
    const prefsToSave = {
      weatherSystem: state.weatherSystem,
      debugMode: state.debugMode
    };
    
    storageUtils.saveData(PREFS_STORAGE_KEY, prefsToSave);
    
    // Check if the weather system has changed
    if (previousWeatherSystem.current !== state.weatherSystem) {
      console.log(`Weather system changed from ${previousWeatherSystem.current} to ${state.weatherSystem}`);
      updateAllRegionsWeatherType(state.weatherSystem);
      previousWeatherSystem.current = state.weatherSystem;
    }
  }, [state.weatherSystem, state.debugMode]);
  
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
      
      // Update each region's weatherType
      const updatedRegions = regions.map(region => ({
        ...region,
        weatherType: weatherSystem
      }));
      
      // Save the updated regions
      storageUtils.saveData(REGIONS_STORAGE_KEY, updatedRegions);
      console.log('Regions updated successfully');
      
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
  
  // Create context value
  const value = {
    state,
    setWeatherSystem: (system) => {
      dispatch({ type: ACTIONS.SET_WEATHER_SYSTEM, payload: system });
    },
    setDebugMode: (enabled) => {
      dispatch({ type: ACTIONS.SET_DEBUG_MODE, payload: enabled });
    },
    togglePreferencesMenu: () => {
      dispatch({ type: ACTIONS.TOGGLE_PREFERENCES_MENU });
    },
    // Expose the function to update all regions
    updateAllRegionsWeatherType
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