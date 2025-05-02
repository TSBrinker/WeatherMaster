// contexts/WeatherContext.js
import React, { createContext, useReducer, useContext, useRef } from 'react';
import WeatherService from '../services/weather-service';

// Create the context
export const WeatherContext = createContext();

// Initial state for the weather context
const initialState = {
  forecast: [],
  biome: 'temperate',
  season: 'auto',
  currentDate: new Date(),
  inTransition: false,
  targetRegionId: null,
  transitionProgress: 0,
  isLoading: false,
  error: null,
  initialized: false
};

// Action types for the reducer
export const ACTIONS = {
  INITIALIZE_WEATHER: 'initialize_weather',
  UPDATE_FORECAST: 'update_forecast',
  SET_BIOME: 'set_biome',
  SET_SEASON: 'set_season',
  SET_DATE: 'set_date',
  ADVANCE_TIME: 'advance_time',
  START_TRANSITION: 'start_transition',
  UPDATE_TRANSITION: 'update_transition',
  END_TRANSITION: 'end_transition',
  SET_LOADING: 'set_loading',
  SET_ERROR: 'set_error'
};

// Reducer function to handle state updates
const weatherReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.INITIALIZE_WEATHER:
      return {
        ...state,
        forecast: action.payload.forecast,
        initialized: true,
        isLoading: false
      };
    case ACTIONS.UPDATE_FORECAST:
      return {
        ...state,
        forecast: action.payload,
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
        isLoading: false
      };
    case ACTIONS.START_TRANSITION:
      return {
        ...state,
        inTransition: true,
        targetRegionId: action.payload.targetRegionId,
        transitionProgress: 0
      };
    case ACTIONS.UPDATE_TRANSITION:
      return {
        ...state,
        currentDate: action.payload.newDate,
        forecast: action.payload.forecast,
        transitionProgress: action.payload.progress,
        isLoading: false
      };
    case ACTIONS.END_TRANSITION:
      return {
        ...state,
        inTransition: false,
        targetRegionId: null,
        transitionProgress: 0,
        forecast: action.payload.forecast,
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
    default:
      return state;
  }
};

// Weather context provider component
export const WeatherProvider = ({ children }) => {
  const [state, dispatch] = useReducer(weatherReducer, initialState);
  
  // Create the weather service as a ref so it persists between renders
  const weatherServiceRef = useRef(new WeatherService());
  
  // Create a memoized value to avoid unnecessary re-renders
  const value = React.useMemo(() => ({
    state,
    dispatch,
    weatherService: weatherServiceRef.current
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