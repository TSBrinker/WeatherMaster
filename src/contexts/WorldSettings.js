// src/contexts/WorldSettings.js
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { storageUtils } from '../utils/storageUtils';

// Storage key
const WORLD_SETTINGS_KEY = 'gm-weather-companion-world-settings';

// Initial state with unified date handling
const initialState = {
  worldName: 'My Fantasy World',
  gameTime: new Date().toISOString(), // This stores full date including year
  calendar: {
    type: 'gregorian',
    yearLength: 365,
    monthNames: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    daysPerMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    weekLength: 7,
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  isConfigured: false
};

// Create context
export const WorldSettingsContext = createContext();

// Action types
export const ACTIONS = {
  SET_WORLD_NAME: 'set_world_name',
  SET_GAME_TIME: 'set_game_time',
  SET_CALENDAR: 'set_calendar',
  SET_IS_CONFIGURED: 'set_is_configured',
  RESET_SETTINGS: 'reset_settings',
  LOAD_SETTINGS: 'load_settings',
  ADVANCE_GAME_TIME: 'advance_game_time'
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
      const currentDate = new Date(state.gameTime);
      const newDate = new Date(currentDate);
      newDate.setHours(newDate.getHours() + action.payload);
      
      return {
        ...state,
        gameTime: newDate.toISOString()
      };
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
        // console.log('Loading world settings from storage:', savedSettings);
        
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
      // console.log('Saving world settings to storage:', state);
      storageUtils.saveData(WORLD_SETTINGS_KEY, state);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [state]);
  
  // Format a date using the game calendar
  const formatGameDate = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    
    // Format using the current calendar settings
    const month = state.calendar.monthNames[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear(); // Use the year from the date object
    
    return `${month} ${day}, ${year}`;
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
  
  // Helper to advance game time
  const advanceGameTime = (hours) => {
    dispatch({
      type: ACTIONS.ADVANCE_GAME_TIME,
      payload: hours
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
      // Accept either Date object or ISO string
      const timeValue = time instanceof Date ? time.toISOString() : time;
      dispatch({ type: ACTIONS.SET_GAME_TIME, payload: timeValue });
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