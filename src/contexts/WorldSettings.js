// src/contexts/WorldSettings.js - Complete updated version
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
  RESET_SETTINGS: 'reset_settings',
  LOAD_SETTINGS: 'load_settings',
  ADVANCE_GAME_TIME: 'advance_game_time'
};

// Helper function to check if a date crosses a year boundary
const checkYearCrossed = (oldDate, newDate) => {
  const oldDt = new Date(oldDate);
  const newDt = new Date(newDate);
  
  // Check if we crossed from December to January
  return (
    oldDt.getMonth() === 11 && newDt.getMonth() === 0 && 
    newDt.getTime() > oldDt.getTime()
  );
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
    
    case ACTIONS.LOAD_SETTINGS:
      return {
        ...state,
        ...action.payload
      };
    
    case ACTIONS.ADVANCE_GAME_TIME: {
      const oldDate = state.gameTime;
      const newDate = action.payload;
      
      // Check if year boundary crossed
      const yearCrossed = checkYearCrossed(oldDate, newDate);
      
      // If year boundary crossed, increment game year
      if (yearCrossed) {
        return {
          ...state,
          gameTime: newDate,
          gameYear: state.gameYear + 1
        };
      } else {
        return {
          ...state,
          gameTime: newDate
        };
      }
    }
    
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
    const loadSettings = () => {
      const savedSettings = storageUtils.loadData(WORLD_SETTINGS_KEY, null);
      
      if (savedSettings) {
        console.log('Loading world settings from storage:', savedSettings);
        
        // Make sure gameTime is a valid ISO string
        try {
          if (savedSettings.gameTime) {
            // Test that it's a valid date
            new Date(savedSettings.gameTime);
          } else {
            savedSettings.gameTime = new Date().toISOString();
          }
        } catch (error) {
          console.error('Invalid gameTime in savedSettings:', error);
          savedSettings.gameTime = new Date().toISOString();
        }
        
        // Make sure isConfigured is properly set
        if (savedSettings.isConfigured === undefined) {
          savedSettings.isConfigured = false;
        }
        
        // Load all settings at once
        dispatch({ 
          type: ACTIONS.LOAD_SETTINGS, 
          payload: savedSettings 
        });
      }
    };
    
    loadSettings();
  }, []);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    // Wait until after initial load
    const timer = setTimeout(() => {
      console.log('Saving world settings to storage:', state);
      storageUtils.saveData(WORLD_SETTINGS_KEY, state);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [state]);
  
  // Format a date using the game calendar and game year (NOT system year)
  const formatGameDate = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    
    // Format using the current calendar settings but with game year
    const month = state.calendar.monthNames[d.getMonth()];
    const day = d.getDate();
    
    // Use game year instead of system year - no weekday to match screenshot
    return `${month} ${day}, ${state.gameYear}`;
  };
  
  // Format time only - HOURS ONLY, NO MINUTES
  const formatGameTime = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true
    });
  };
  
  // Helper to advance game time (with option to increment game year)
  const advanceGameTime = (hours) => {
    const currentDate = new Date(state.gameTime);
    const newDate = new Date(currentDate);
    newDate.setHours(newDate.getHours() + hours);
    
    dispatch({
      type: ACTIONS.ADVANCE_GAME_TIME,
      payload: newDate.toISOString()
    });
  };
  
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
      dispatch({ type: ACTIONS.SET_GAME_YEAR, payload: parseInt(year, 10) });
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
    },
    
    advanceGameTime,
    
    // Date formatting helpers
    formatGameDate,
    formatGameTime,
    
    // Combined format
    formatGameDateTime: (date) => {
      return `${formatGameDate(date)} ${formatGameTime(date)}`;
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