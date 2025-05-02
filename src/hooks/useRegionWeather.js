// hooks/useRegionWeather.js
import { useState, useCallback, useEffect, useRef } from 'react';
import useWorld from './useWorld';
import useWeather from './useWeather';
import RegionWeatherService from '../services/region-weather-service';

/**
 * Custom hook for managing region-based weather and transitions
 */
const useRegionWeather = () => {
  // Get necessary state from world and weather contexts
  const { 
    getActiveRegion, 
    activeRegionId,
    getActiveWorld,
    activeWorldId
  } = useWorld();
  
  const {
    currentDate,
    initialized: weatherInitialized,
    forecast,
    setDate,
    advanceTime: advanceWeatherTime
  } = useWeather();
  
  // Create refs to prevent recreating objects
  const regionWeatherServiceRef = useRef(null);
  
  // Create state for tracking transitions
  const [inTransition, setInTransition] = useState(false);
  const [targetRegionId, setTargetRegionId] = useState(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [regionForecast, setRegionForecast] = useState([]);
  
  // Initialize region weather service if needed
  if (!regionWeatherServiceRef.current) {
    regionWeatherServiceRef.current = new RegionWeatherService();
  }
  
  // Alias the ref for easier use
  const regionWeatherService = regionWeatherServiceRef.current;
  
  // Initialize weather based on active region
  const initializeRegionWeather = useCallback(() => {
    const activeRegion = getActiveRegion();
    if (!activeRegion) return;
    
    const currentWorld = getActiveWorld();
    if (!currentWorld) return;
    
    // Initialize weather for the region
    regionWeatherService.initializeRegionWeather(activeRegion, currentDate);
    
    // Update forecast
    const newForecast = regionWeatherService.getRegionForecast(activeRegion);
    setRegionForecast(newForecast);
  }, [getActiveRegion, getActiveWorld, currentDate, regionWeatherService]);
  
  // Start a transition to a new region
  const startRegionTransition = useCallback((targetRegion) => {
    if (!targetRegion || !targetRegion.id) return false;
    
    const activeRegion = getActiveRegion();
    if (!activeRegion) return false;
    
    // Don't start transition if we're already in the target region
    if (targetRegion.id === activeRegion.id) return false;
    
    // Start transition in the service
    regionWeatherService.startTransition(activeRegion, targetRegion);
    
    // Update state
    setInTransition(true);
    setTargetRegionId(targetRegion.id);
    setTransitionProgress(0);
    
    // Get the initial transition weather
    const transitionForecast = regionWeatherService.getTransitionWeather();
    setRegionForecast(transitionForecast);
    
    return true;
  }, [getActiveRegion, regionWeatherService]);
  
  // Advance time, handling transitions if active
  const advanceTime = useCallback((hours) => {
    const activeRegion = getActiveRegion();
    
    if (inTransition) {
      // Advance the transition
      regionWeatherService.advanceTransition(hours);
      
      // Get updated transition info
      const transitionInfo = regionWeatherService.getTransitionInfo();
      
      if (transitionInfo) {
        // Still in transition
        setTransitionProgress(transitionInfo.progress);
        
        // Update the forecast
        const transitionForecast = regionWeatherService.getTransitionWeather();
        setRegionForecast(transitionForecast);
      } else {
        // Transition completed
        setInTransition(false);
        setTransitionProgress(1);
        
        // Get forecast from destination region
        const newRegionForecast = regionWeatherService.getRegionForecast(
          { id: targetRegionId }
        );
        setRegionForecast(newRegionForecast);
      }
    } else if (activeRegion) {
      // Normal time advancement for the active region
      regionWeatherService.advanceRegionTime(activeRegion, hours, currentDate);
      
      // Update forecast
      const newForecast = regionWeatherService.getRegionForecast(activeRegion);
      setRegionForecast(newForecast);
    }
    
    // Also advance time in the weather context to keep date synchronized
    advanceWeatherTime(hours);
  }, [
    getActiveRegion, 
    inTransition, 
    targetRegionId, 
    regionWeatherService, 
    currentDate,
    advanceWeatherTime
  ]);
  
  // End transition immediately (arrive at destination)
  const endTransition = useCallback(() => {
    if (!inTransition) return;
    
    // End the transition in the service
    regionWeatherService.endTransition();
    
    // Update state
    setInTransition(false);
    setTransitionProgress(1);
    
    // Get forecast for the destination region
    const newRegionForecast = regionWeatherService.getRegionForecast(
      { id: targetRegionId }
    );
    setRegionForecast(newRegionForecast);
  }, [inTransition, targetRegionId, regionWeatherService]);
  
  // Get information about the current transition
  const getTransitionInfo = useCallback(() => {
    if (!inTransition) return null;
    
    return regionWeatherService.getTransitionInfo();
  }, [inTransition, regionWeatherService]);
  
  // Initialize region weather when component mounts or when active region changes
  useEffect(() => {
    if (activeRegionId && weatherInitialized && !inTransition) {
      initializeRegionWeather();
    }
  }, [activeRegionId, weatherInitialized, inTransition, initializeRegionWeather]);
  
  // Return current region weather and transition state
  return {
    regionForecast,
    inTransition,
    transitionProgress,
    targetRegionId,
    initializeRegionWeather,
    startRegionTransition,
    advanceTime,
    endTransition,
    getTransitionInfo
  };
};

export default useRegionWeather;