// src/contexts/WorldSettings.js
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { storageUtils } from '../utils/storageUtils';

// Storage key
const WORLD_SETTINGS_KEY = 'gm-weather-companion-world-settings';

// Initial state
const initialState = {
  worldName: 'My Fantasy World',
  gameTime: new Date().toISOString(),
  calendar: {
    type: 'gregorian', // gregorian, fantasy
    yearLength: 365,
    monthNames: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    daysPerMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    weekLength: 7,
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  gameYear: 1492,
  gameSeason: 'auto',
  isConfigured: false
};

// Create context
export const WorldSettingsContext = createContext();

// Action types
export const ACTIONS = {
  SET_WORLD_NAME: 'set_world_name',
  SET_GAME_TIME: 'set_game_time',
  SET_GAME_YEAR: 'set_game_year',
  SET_GAME_SEASON: 'set_game_season',
  SET_CALENDAR: 'set_calendar',
  SET_IS_CONFIGURED: 'set_is_configured',
  RESET_SETTINGS: 'reset_settings'
};

// Reducer function
const worldSettingsReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_WORLD_NAME:
      return {
        ...state,
        worldName: action.payload
      };
    
    case ACTIONS.SET_GAME_TIME:
      return {
        ...state,
        gameTime: action.payload
      };
    
    case ACTIONS.SET_GAME_YEAR:
      return {
        ...state,
        gameYear: action.payload
      };
    
    case ACTIONS.SET_GAME_SEASON:
      return {
        ...state,
        gameSeason: action.payload
      };
    
    case ACTIONS.SET_CALENDAR:
      return {
        ...state,
        calendar: action.payload
      };
    
    case ACTIONS.SET_IS_CONFIGURED:
      return {
        ...state,
        isConfigured: action.payload
      };
    
    case ACTIONS.RESET_SETTINGS:
      return {
        ...initialState
      };
    
    default:
      return state;
  }
};

// Provider component
export const WorldSettingsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(worldSettingsReducer, initialState);
  
  // Load settings from localStorage on init
  useEffect(() => {
    const savedSettings = storageUtils.loadData(WORLD_SETTINGS_KEY, null);
    if (savedSettings) {
      // Convert back gameTime to Date object
      const settings = {
        ...savedSettings,
        gameTime: savedSettings.gameTime || new Date().toISOString()
      };
      
      // Handle individual settings
      if (settings.worldName) {
        dispatch({ type: ACTIONS.SET_WORLD_NAME, payload: settings.worldName });
      }
      
      if (settings.gameTime) {
        dispatch({ type: ACTIONS.SET_GAME_TIME, payload: settings.gameTime });
      }
      
      if (settings.gameYear) {
        dispatch({ type: ACTIONS.SET_GAME_YEAR, payload: settings.gameYear });
      }
      
      if (settings.gameSeason) {
        dispatch({ type: ACTIONS.SET_GAME_SEASON, payload: settings.gameSeason });
      }
      
      if (settings.calendar) {
        dispatch({ type: ACTIONS.SET_CALENDAR, payload: settings.calendar });
      }
      
      if (settings.isConfigured) {
        dispatch({ type: ACTIONS.SET_IS_CONFIGURED, payload: settings.isConfigured });
      }
    }
  }, []);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    storageUtils.saveData(WORLD_SETTINGS_KEY, state);
  }, [state]);
  
  // Create value object
  const contextValue = {
    state,
    dispatch,
    
    // Helper methods
    setWorldName: (name) => {
      dispatch({ type: ACTIONS.SET_WORLD_NAME, payload: name });
    },
    
    setGameTime: (time) => {
      dispatch({ type: ACTIONS.SET_GAME_TIME, payload: time });
    },
    
    setGameYear: (year) => {
      dispatch({ type: ACTIONS.SET_GAME_YEAR, payload: year });
    },
    
    setGameSeason: (season) => {
      dispatch({ type: ACTIONS.SET_GAME_SEASON, payload: season });
    },
    
    setCalendar: (calendar) => {
      dispatch({ type: ACTIONS.SET_CALENDAR, payload: calendar });
    },
    
    setIsConfigured: (isConfigured) => {
      dispatch({ type: ACTIONS.SET_IS_CONFIGURED, payload: isConfigured });
    },
    
    resetSettings: () => {
      dispatch({ type: ACTIONS.RESET_SETTINGS });
    }
  };
  
  return (
    <WorldSettingsContext.Provider value={contextValue}>
      {children}
    </WorldSettingsContext.Provider>
  );
};

// Custom hook for using world settings
export const useWorldSettings = () => {
  const context = useContext(WorldSettingsContext);
  if (!context) {
    throw new Error('useWorldSettings must be used within a WorldSettingsProvider');
  }
  return context;
};