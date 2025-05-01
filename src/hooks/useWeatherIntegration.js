// hooks/useWeatherIntegration.js
import { useCallback, useEffect, useRef } from 'react';
import useWorld from './useWorld';
import useWeather from './useWeather';
import { mapBiomeToClimate } from '../utils/weatherUtils';

/**
 * Custom hook to integrate weather and world contexts
 * Handles loading and saving weather data for locations
 */
const useWeatherIntegration = () => {
  const {
    getActiveWorld,
    getLocationDate,
    getActiveRegion,
    getActiveLocation,
    saveWeatherData,
    activeWorldId,
    activeRegionId,
    activeLocationId
  } = useWorld();
  
  const {
    forecast,
    biome,
    season,
    currentDate,
    isLoading,
    initialized,
    setBiome,
    setSeason,
    setDate,
    initializeWeather,
    applySettings
  } = useWeather();
  
  // Reference to track actual location changes
  const locationChangeRef = useRef(false);
  // Reference to track the last saved timestamp to prevent infinite save cycles
  const lastSavedRef = useRef(null);
  
  // Get active location data
  const activeLocation = getActiveLocation();
  const activeRegion = getActiveRegion();
  
  // Initialize weather based on location data
  const initializeLocationWeather = useCallback(() => {
    if (!activeLocation) return;
    
    // Set initial date from location
    if (activeLocation.currentDate) {
      const locationDate = getLocationDate();
      
      setDate(locationDate)

      // Set biome based on region climate
      if (activeRegion && activeRegion.climate) {
        // Map region climate to biome for weather service
        const locationBiome = Object.entries(mapBiomeToClimate())
          .find(([_, climate]) => climate === activeRegion.climate)?.[0] || 'temperate';
          
        setBiome(locationBiome);
      }
      
      // Initialize weather with location settings
      initializeWeather();
    }
  }, [activeLocation, activeRegion, setBiome, setDate, initializeWeather]);
  
  // Save current weather data to the active location
  const saveCurrentWeather = useCallback(() => {
    if (!activeLocation || !forecast || forecast.length === 0) return;
    
    // Generate a timestamp for this save
    const saveTimestamp = new Date().toISOString();
    
    // Only save if we haven't just saved (prevents infinite loops)
    if (lastSavedRef.current === saveTimestamp) {
      return;
    }
    
    const weatherData = {
      forecast,
      currentDate,
      biome,
      season,
      lastUpdated: saveTimestamp
    };
    
    lastSavedRef.current = saveTimestamp;
    
    saveWeatherData(
      activeWorldId,
      activeRegionId,
      activeLocationId,
      weatherData
    );
  }, [
    activeLocation, 
    forecast, 
    currentDate, 
    biome, 
    season, 
    saveWeatherData, 
    activeWorldId, 
    activeRegionId, 
    activeLocationId
  ]);
  
  // Load saved weather data from location
  const loadSavedWeather = useCallback(() => {
    if (!activeLocation) return;
    
    if (!activeLocation.weatherData) {
      // No saved weather data, initialize new weather
      initializeLocationWeather();
      return;
    }
    
    // Restore saved weather state
    const { biome: savedBiome, season: savedSeason } = activeLocation.weatherData;
    
    if (savedBiome) setBiome(savedBiome);
    if (savedSeason) setSeason(savedSeason);
    
    // Apply settings to initialize weather with saved values
    applySettings();
  }, [
    activeLocation, 
    initializeLocationWeather, 
    setBiome, 
    setSeason, 
    applySettings
  ]);
  
  // Track when the location actually changes
  useEffect(() => {
    if (activeLocationId) {
      locationChangeRef.current = true;
    }
  }, [activeLocationId]);
  
  // Initialize or load weather when location changes
  useEffect(() => {
    if (activeLocation && locationChangeRef.current) {
      loadSavedWeather();
      // Reset the flag after handling
      locationChangeRef.current = false;
    }
  }, [activeLocationId, activeLocation, loadSavedWeather]);
  
  // Save weather data when it changes but not on every render
  useEffect(() => {
    if (activeLocation && forecast && forecast.length > 0 && !isLoading && initialized) {
      // Use a debounce approach - only save after changes have settled
      const saveTimer = setTimeout(() => {
        saveCurrentWeather();
      }, 300);
      
      return () => clearTimeout(saveTimer);
    }
  }, [forecast, currentDate, saveCurrentWeather, activeLocation, isLoading, initialized]);
  
  return {
    activeLocation,
    activeRegion,
    initializeLocationWeather,
    saveCurrentWeather,
    loadSavedWeather
  };
};

export default useWeatherIntegration; 