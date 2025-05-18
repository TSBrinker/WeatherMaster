// src/contexts/PreferencesContext.js
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { storageUtils } from '../utils/storageUtils';

// Storage key for preferences
const PREFS_STORAGE_KEY = 'gm-weather-companion-preferences';

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
  
  // Load preferences on initial render
  useEffect(() => {
    const loadPreferences = () => {
      const savedPrefs = storageUtils.loadData(PREFS_STORAGE_KEY, null);
      
      if (savedPrefs) {
        dispatch({ 
          type: ACTIONS.LOAD_PREFERENCES, 
          payload: savedPrefs 
        });
      }
    };
    
    loadPreferences();
  }, []);
  
  // Save preferences when they change
  useEffect(() => {
    // Don't save the isOpen state as that's just UI state
    const prefsToSave = {
      weatherSystem: state.weatherSystem,
      debugMode: state.debugMode
    };
    
    storageUtils.saveData(PREFS_STORAGE_KEY, prefsToSave);
  }, [state.weatherSystem, state.debugMode]);
  
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
    }
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