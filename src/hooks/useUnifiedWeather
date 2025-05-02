// hooks/useUnifiedWeather.js
import { useCallback, useEffect } from 'react';
import { useWeatherContext, ACTIONS } from '../contexts/WeatherContext';
import useWorld from './useWorld';

/**
 * Unified hook for all weather operations
 * Combines the functionality of useWeather and useRegionWeather
 */
const useUnifiedWeather = () => {
  const { state, dispatch, weatherService, regionWeatherService } = useWeatherContext();
  const { 
    getActiveRegion, 
    getActiveWorld, 
    activeRegionId, 
    activeWorldId 
  } = useWorld();
  
  // Extract all state values for easier access
  const {
    forecast,
    regionForecast,
    currentWeather,
    biome,
    season,
    currentDate,
    inTransition,
    targetRegionId,
    transitionProgress,
    isLoading,
    error,
    initialized,
    forecastVersion
  } = state;
  
  // Initialize weather data
  const initializeWeather = useCallback((activeRegion) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      // Get the active region if not provided
      const region = activeRegion || getActiveRegion();
      
      if (!region) {
        // Initialize with global weather service if no region
        const globalWeather = weatherService.initializeWeather(
          biome, 
          season, 
          currentDate
        );
        
        const globalForecast = weatherService.get24HourForecast();
        
        dispatch({
          type: ACTIONS.INITIALIZE_WEATHER,
          payload: { forecast: globalForecast }
        });
      } else {
        // Initialize with region-specific weather
        regionWeatherService.initializeRegionWeather(region, currentDate);
        
        const regionForecast = regionWeatherService.getRegionForecast(region);
        
        dispatch({
          type: ACTIONS.INITIALIZE_WEATHER,
          payload: { 
            forecast: regionForecast,
            regionForecast: regionForecast
          }
        });
      }
    } catch (error) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: `Failed to initialize weather: ${error.message}` 
      });
    }
  }, [
    biome, 
    season, 
    currentDate, 
    dispatch, 
    weatherService, 
    regionWeatherService, 
    getActiveRegion
  ]);
  
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
      const newDate = new Date(currentDate);
      newDate.setHours(newDate.getHours() + hours);
      
      const activeRegion = getActiveRegion();
      
      if (inTransition) {
        // Advance transition
        regionWeatherService.advanceTransition(hours);
        
        // Get updated transition info
        const transitionInfo = regionWeatherService.getTransitionInfo();
        
        if (transitionInfo) {
          // Still in transition
          const transitionForecast = regionWeatherService.getTransitionWeather();
          
          dispatch({
            type: ACTIONS.UPDATE_TRANSITION,
            payload: {
              progress: transitionInfo.progress,
              transitionForecast
            }
          });
        } else {
          // Transition completed
          const regionForecast = regionWeatherService.getRegionForecast(
            { id: targetRegionId }
          );
          
          dispatch({
            type: ACTIONS.END_TRANSITION,
            payload: { regionForecast }
          });
        }
      } else if (activeRegion) {
        // Advance region weather
        regionWeatherService.advanceRegionTime(activeRegion, hours, currentDate);
        
        // Get updated forecast
        const regionForecast = regionWeatherService.getRegionForecast(activeRegion);
        
        // Also advance time in the global weather service for consistency
        weatherService.advanceTime(hours, biome, season, currentDate);
        const globalForecast = weatherService.get24HourForecast();
        
        dispatch({
          type: ACTIONS.ADVANCE_TIME,
          payload: { 
            newDate, 
            forecast: globalForecast,
            regionForecast
          }
        });
      } else {
        // No region, use global weather
        weatherService.advanceTime(hours, biome, season, currentDate);
        
        const forecast = weatherService.get24HourForecast();
        
        dispatch({
          type: ACTIONS.ADVANCE_TIME,
          payload: { newDate, forecast }
        });
      }
    } catch (error) {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: `Failed to advance time: ${error.message}` 
      });
    }
  }, [
    currentDate, 
    biome, 
    season, 
    inTransition, 
    targetRegionId,
    dispatch, 
    weatherService, 
    regionWeatherService, 
    getActiveRegion
  ]);
  
  // Jump to a specific date
  const jumpToDate = useCallback((targetDate) => {
    if (!(targetDate instanceof Date)) {
      throw new Error('targetDate must be a Date object');
    }
    
    const diffMs = targetDate.getTime() - currentDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours > 0) {
      advanceTime(diffHours);
    } else {
      // Handle past dates - reinitialize with the new date
      dispatch({ type: ACTIONS.SET_DATE, payload: targetDate });
      initializeWeather();
    }
  }, [currentDate, advanceTime, dispatch, initializeWeather]);
  
  // Get the current season based on date
  const getCurrentSeason = useCallback(() => {
    return weatherService.getSeasonFromDate(currentDate);
  }, [weatherService, currentDate]);
  
  // Start a transition to a new region
  const startRegionTransition = useCallback((targetRegion) => {
    if (!targetRegion || !targetRegion.id) return false;
    
    const activeRegion = getActiveRegion();
    if (!activeRegion) return false;
    
    // Don't start transition if we're already in the target region
    if (targetRegion.id === activeRegion.id) return false;
    
    // Start transition in the service
    regionWeatherService.startTransition(activeRegion, targetRegion);
    
    // Get the initial transition weather
    const transitionForecast = regionWeatherService.getTransitionWeather();
    
    dispatch({ 
      type: ACTIONS.START_TRANSITION, 
      payload: {
        targetRegionId: targetRegion.id,
        transitionForecast
      }
    });
    
    return true;
  }, [getActiveRegion, regionWeatherService, dispatch]);
  
  // End transition immediately
  const endTransition = useCallback(() => {
    if (!inTransition) return;
    
    // End the transition in the service
    regionWeatherService.endTransition();
    
    // Get forecast for the destination region
    const regionForecast = regionWeatherService.getRegionForecast(
      { id: targetRegionId }
    );
    
    dispatch({ 
      type: ACTIONS.END_TRANSITION, 
      payload: { regionForecast }
    });
  }, [inTransition, targetRegionId, regionWeatherService, dispatch]);
  
  // Get information about the current transition
  const getTransitionInfo = useCallback(() => {
    if (!inTransition) return null;
    
    return regionWeatherService.getTransitionInfo();
  }, [inTransition, regionWeatherService]);
  
  // Initialize weather on mount
  useEffect(() => {
    if (!initialized && !isLoading) {
      initializeWeather();
    }
  }, [initialized, isLoading, initializeWeather]);
  
  // Initialize or update region weather when active region changes
  useEffect(() => {
    if (activeRegionId && initialized && !inTransition) {
      initializeWeather();
    }
  }, [activeRegionId, initialized, inTransition, initializeWeather]);
  
  // Return all weather state and functions
  return {
    // State values
    forecast,
    regionForecast,
    currentWeather,
    biome,
    season,
    currentDate,
    inTransition,
    targetRegionId,
    transitionProgress,
    isLoading,
    error,
    initialized,
    forecastVersion,
    
    // Weather functions
    setBiome,
    setSeason,
    setDate,
    applySettings,
    advanceTime,
    jumpToDate,
    getCurrentSeason,
    initializeWeather,
    
    // Region & transition functions
    startRegionTransition,
    endTransition,
    getTransitionInfo
  };
};

export default useUnifiedWeather;