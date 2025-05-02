// contexts/WeatherContext.js
import React, { createContext, useReducer, useContext, useRef, useEffect } from 'react';
import WeatherService from '../services/weather-service';
import RegionWeatherService from '../services/region-weather-service';

// Create the context
export const WeatherContext = createContext();

// Initial state for the weather context
const initialState = {
  currentWeather: null,
  forecast: [],
  regionForecast: [],
  biome: 'temperate',
  season: 'auto',
  currentDate: new Date(),
  inTransition: false,
  targetRegionId: null,
  transitionProgress: 0,
  isLoading: false,
  error: null,
  initialized: false,
  forecastVersion: 0
};

// Action types for the reducer
export const ACTIONS = {
  INITIALIZE_WEATHER: 'initialize_weather',
  UPDATE_FORECAST: 'update_forecast',
  UPDATE_REGION_FORECAST: 'update_region_forecast',
  SET_BIOME: 'set_biome',
  SET_SEASON: 'set_season',
  SET_DATE: 'set_date',
  ADVANCE_TIME: 'advance_time',
  START_TRANSITION: 'start_transition',
  UPDATE_TRANSITION: 'update_transition',
  END_TRANSITION: 'end_transition',
  SET_LOADING: 'set_loading',
  SET_ERROR: 'set_error',
  INCREMENT_VERSION: 'increment_version',
  RESET: 'reset'
};

// Reducer function to handle state updates
const weatherReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.INITIALIZE_WEATHER:
      return {
        ...state,
        forecast: action.payload.forecast,
        regionForecast: action.payload.regionForecast || action.payload.forecast,
        currentWeather: action.payload.forecast[0] || null,
        initialized: true,
        isLoading: false,
        forecastVersion: state.forecastVersion + 1
      };
    case ACTIONS.UPDATE_FORECAST:
      return {
        ...state,
        forecast: action.payload,
        currentWeather: action.payload[0] || state.currentWeather,
        isLoading: false,
        forecastVersion: state.forecastVersion + 1
      };
    case ACTIONS.UPDATE_REGION_FORECAST:
      return {
        ...state,
        regionForecast: action.payload,
        isLoading: false,
        forecastVersion: state.forecastVersion + 1
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
        regionForecast: action.payload.regionForecast || action.payload.forecast,
        currentWeather: (action.payload.regionForecast || action.payload.forecast)[0] || state.currentWeather,
        isLoading: false,
        forecastVersion: state.forecastVersion + 1
      };
    case ACTIONS.START_TRANSITION:
      return {
        ...state,
        inTransition: true,
        targetRegionId: action.payload.targetRegionId,
        transitionProgress: 0,
        regionForecast: action.payload.transitionForecast,
        forecastVersion: state.forecastVersion + 1
      };
    case ACTIONS.UPDATE_TRANSITION:
      return {
        ...state,
        transitionProgress: action.payload.progress,
        regionForecast: action.payload.transitionForecast,
        forecastVersion: state.forecastVersion + 1
      };
    case ACTIONS.END_TRANSITION:
      return {
        ...state,
        inTransition: false,
        transitionProgress: 1,
        targetRegionId: null,
        regionForecast: action.payload.regionForecast,
        forecastVersion: state.forecastVersion + 1
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
    case ACTIONS.INCREMENT_VERSION:
      return {
        ...state,
        forecastVersion: state.forecastVersion + 1
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
  
  // Create services as refs so they persist between renders
  const weatherServiceRef = useRef(null);
  const regionWeatherServiceRef = useRef(null);
  
  // Initialize services on first render
  if (!weatherServiceRef.current) {
    weatherServiceRef.current = new WeatherService();
  }
  
  if (!regionWeatherServiceRef.current) {
    regionWeatherServiceRef.current = new RegionWeatherService();
  }
  
  // Create a memoized value to avoid unnecessary re-renders
  const value = React.useMemo(() => ({
    state,
    dispatch,
    weatherService: weatherServiceRef.current,
    regionWeatherService: regionWeatherServiceRef.current
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