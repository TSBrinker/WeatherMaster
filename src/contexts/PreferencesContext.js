// src/contexts/PreferencesContext.js - Clean version without weather system selection
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { storageUtils } from '../utils/storageUtils';

// Storage key for preferences
const PREFS_STORAGE_KEY = 'gm-weather-companion-preferences';

// Initial preferences - simplified without weather system selection
const initialPreferences = {
  debugMode: false,
  isOpen: false, // Whether the preferences menu is open
  temperatureUnit: 'fahrenheit',
  timeFormat: '12hour',
  windSpeedUnit: 'mph',
  showFeelsLike: true,
  conditionPhrasing: 'standard' // 'standard' (e.g., "Mist") or 'descriptive' (e.g., "Misty")
};

// Create context
export const PreferencesContext = createContext();

// Action types
export const ACTIONS = {
  SET_DEBUG_MODE: 'set_debug_mode',
  TOGGLE_PREFERENCES_MENU: 'toggle_preferences_menu',
  LOAD_PREFERENCES: 'load_preferences',
  SET_TEMPERATURE_UNIT: 'set_temperature_unit',
  SET_TIME_FORMAT: 'set_time_format',
  SET_WIND_SPEED_UNIT: 'set_wind_speed_unit',
  SET_SHOW_FEELS_LIKE: 'set_show_feels_like',
  SET_CONDITION_PHRASING: 'set_condition_phrasing'
};

// Reducer function
const preferencesReducer = (state, action) => {
  switch (action.type) {
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

    case ACTIONS.SET_CONDITION_PHRASING:
      return {
        ...state,
        conditionPhrasing: action.payload
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
    const prefsToSave = {
      debugMode: state.debugMode,
      temperatureUnit: state.temperatureUnit,
      timeFormat: state.timeFormat,
      windSpeedUnit: state.windSpeedUnit,
      showFeelsLike: state.showFeelsLike,
      conditionPhrasing: state.conditionPhrasing
    };

    storageUtils.saveData(PREFS_STORAGE_KEY, prefsToSave);
  }, [
    state.debugMode,
    state.temperatureUnit,
    state.timeFormat,
    state.windSpeedUnit,
    state.showFeelsLike,
    state.conditionPhrasing
  ]);
  
  // Action creators
  const setDebugMode = (enabled) => {
    dispatch({ type: ACTIONS.SET_DEBUG_MODE, payload: enabled });
  };
  
  const togglePreferencesMenu = () => {
    dispatch({ type: ACTIONS.TOGGLE_PREFERENCES_MENU });
  };
  
  const setTemperatureUnit = (unit) => {
    dispatch({ type: ACTIONS.SET_TEMPERATURE_UNIT, payload: unit });
  };
  
  const setTimeFormat = (format) => {
    dispatch({ type: ACTIONS.SET_TIME_FORMAT, payload: format });
  };
  
  const setWindSpeedUnit = (unit) => {
    dispatch({ type: ACTIONS.SET_WIND_SPEED_UNIT, payload: unit });
  };
  
  const setShowFeelsLike = (show) => {
    dispatch({ type: ACTIONS.SET_SHOW_FEELS_LIKE, payload: show });
  };

  const setConditionPhrasing = (phrasing) => {
    dispatch({ type: ACTIONS.SET_CONDITION_PHRASING, payload: phrasing });
  };

  const value = {
    state,
    setDebugMode,
    togglePreferencesMenu,
    setTemperatureUnit,
    setTimeFormat,
    setWindSpeedUnit,
    setShowFeelsLike,
    setConditionPhrasing
  };
  
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

// Custom hook for using preferences
export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};