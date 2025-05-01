// hooks/useWeather.js
import { useEffect, useCallback, useRef } from 'react';
import WeatherService from '../services/weather-service';
import { useWeatherContext, ACTIONS } from '../contexts/WeatherContext';

const useWeather = () => {
  const { state, dispatch } = useWeatherContext();

  const weatherServiceRef = new useRef(null);

  if (!weatherServiceRef.current) {
    weatherServiceRef.current = new WeatherService();
  }
  
  // Use the reference throughout the hook
  const weatherService = weatherServiceRef.current;

  // Initialize weather data
  const initializeWeather = useCallback(() => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      const currentWeather = weatherService.initializeWeather(
        state.biome, 
        state.season, 
        state.currentDate
      );
      
      const forecast = weatherService.get24HourForecast();
      
      dispatch({
        type: ACTIONS.INITIALIZE_WEATHER,
        payload: { forecast }
      });
    } catch (error) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: `Failed to initialize weather: ${error.message}` 
      });
    }
  }, [weatherService, state.biome, state.season, state.currentDate, dispatch]);

  // Update biome
  const setBiome = useCallback((biome) => {
    dispatch({ type: ACTIONS.SET_BIOME, payload: biome });
  }, [dispatch]);

  // Update season
  const setSeason = useCallback((season) => {
    dispatch({ type: ACTIONS.SET_SEASON, payload: season });
  }, [dispatch]);

  // Set Global Date
  const setDate = useCallback((date) => {
    dispatch({ type: ACTIONS.SET_DATE, payload: date });
  }, [dispatch]);

  // Apply weather settings (biome and season)
  const applySettings = useCallback(() => {
    initializeWeather();
  }, [initializeWeather]);

  // Advance time by specified hours
const advanceTime = useCallback((hours) => {
  dispatch({ type: ACTIONS.SET_LOADING, payload: true });
  
  try {
    const newDate = new Date(state.currentDate);
    newDate.setHours(newDate.getHours() + hours);
    
    // Advance time in the weather service WITHOUT reinitializing
    weatherService.advanceTime(hours, state.biome, state.season, state.currentDate);
    
    // Get the updated forecast WITHOUT resetting the entire thing
    const forecast = weatherService.get24HourForecast();
    
    dispatch({
      type: ACTIONS.ADVANCE_TIME,
      payload: { newDate, forecast }
    });
  } catch (error) {
    dispatch({ 
      type: ACTIONS.SET_ERROR, 
      payload: `Failed to advance time: ${error.message}` 
    });
  }
}, [weatherService, state.biome, state.season, state.currentDate, dispatch]);

  // Jump to a specific date
  const jumpToDate = useCallback((targetDate) => {
    if (!(targetDate instanceof Date)) {
      throw new Error('targetDate must be a Date object');
    }
    
    const diffMs = targetDate - state.currentDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours > 0) {
      advanceTime(diffHours);
    } else {
      // Handle past dates - reinitialize with the new date
      dispatch({ type: ACTIONS.SET_DATE, payload: targetDate });
      initializeWeather();
    }
  }, [state.currentDate, advanceTime, dispatch, initializeWeather]);

  // Get the current season based on date
  const getCurrentSeason = useCallback(() => {
    return weatherService.getSeasonFromDate(state.currentDate);
  }, [weatherService, state.currentDate]);

  // Initialize weather when component mounts or when dependencies change
  useEffect(() => {
    if (!state.initialized) {
      initializeWeather();
    }
  }, [state.initialized, initializeWeather]);

  return {
    forecast: state.forecast,
    currentWeather: state.currentWeather,
    biome: state.biome,
    season: state.season,
    currentDate: state.currentDate,
    isLoading: state.isLoading,
    error: state.error,
    initialized: state.initialized,
    getCurrentSeason,
    setBiome,
    setSeason,
    setDate,
    applySettings,
    advanceTime,
    jumpToDate,
    initializeWeather
  };
};

export default useWeather;