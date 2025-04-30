// contexts/WeatherContext.js
import React, { createContext, useReducer, useContext } from 'react';
import WeatherService from '../services/weather-service';

// Initial state for the weather context
const initialState = {
  forecast: [],
  currentWeather: null,
  biome: 'temperate',
  season: 'auto',
  currentDate: new Date(),
  isLoading: false,
  error: null,
  initialized: false
};

// Create the context
export const WeatherContext = createContext();

// Action types for the reducer
export const ACTIONS = {
  INITIALIZE_WEATHER: 'initialize_weather',
  UPDATE_FORECAST: 'update_forecast',
  SET_BIOME: 'set_biome',
  SET_SEASON: 'set_season',
  SET_DATE: 'set_date',
  ADVANCE_TIME: 'advance_time',
  SET_LOADING: 'set_loading',
  SET_ERROR: 'set_error',
  RESET: 'reset'
};

// Reducer function to handle state updates
const weatherReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.INITIALIZE_WEATHER:
      return {
        ...state,
        forecast: action.payload.forecast,
        currentWeather: action.payload.forecast[0] || null,
        initialized: true,
        isLoading: false
      };
    case ACTIONS.UPDATE_FORECAST:
      return {
        ...state,
        forecast: action.payload,
        currentWeather: action.payload[0] || state.currentWeather,
        isLoading: false
      };
    case ACTIONS.SET_BIOME:
      return {
        ...state,
        biome: action.payload
      };
    case ACTIONS.SET_SEASON:
      return {
        ...state,
        season: action.payload
      };
    case ACTIONS.SET_DATE:
      return {
        ...state,
        currentDate: action.payload
      };
    case ACTIONS.ADVANCE_TIME:
      return {
        ...state,
        currentDate: action.payload.newDate,
        forecast: action.payload.forecast,
        currentWeather: action.payload.forecast[0] || state.currentWeather,
        isLoading: false
      };
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
    case ACTIONS.RESET:
      return {
        ...initialState,
        currentDate: new Date()
      };
    default:
      return state;
  }
};

// Weather context provider component
export const WeatherProvider = ({ children }) => {
  const [state, dispatch] = useReducer(weatherReducer, initialState);
  
  // Create a memoized value to avoid unnecessary re-renders
  const value = React.useMemo(() => ({
    state,
    dispatch
  }), [state]);

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
};

// Custom hook to use the weather context
export const useWeatherContext = () => {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeatherContext must be used within a WeatherProvider');
  }
  return context;
};