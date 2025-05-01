// hooks/useWeatherIntegration.js
import { useCallback, useEffect } from 'react';
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
    setBiome,
    setSeason,
    initializeWeather,
    applySettings
  } = useWeather();
  
  // Get active location data
  const activeLocation = getActiveLocation();
  const activeRegion = getActiveRegion();
  
  // Initialize weather based on location data
  const initializeLocationWeather = useCallback(() => {
    if (!activeLocation) return;
    
    // Set initial date from location
    if (activeLocation.currentDate) {
      const locationDate = new Date(activeLocation.currentDate);
      
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
  }, [activeLocation, activeRegion, setBiome, initializeWeather]);
  
  // Save current weather data to the active location
  const saveCurrentWeather = useCallback(() => {
    if (!activeLocation || !forecast || forecast.length === 0) return;
    
    const weatherData = {
      forecast,
      currentDate,
      biome,
      season,
      lastUpdated: new Date().toISOString()
    };
    
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
    if (!activeLocation || !activeLocation.weatherData) {
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
  
  // Initialize or load weather when location changes
  useEffect(() => {
    if (activeLocation) {
      loadSavedWeather();
    }
  }, [activeLocationId, loadSavedWeather]);
  
  // Save weather data when it changes
  useEffect(() => {
    if (activeLocation && forecast && forecast.length > 0) {
      saveCurrentWeather();
    }
  }, [forecast, saveCurrentWeather]);
  
  return {
    activeLocation,
    activeRegion,
    initializeLocationWeather,
    saveCurrentWeather,
    loadSavedWeather
  };
};

export default useWeatherIntegration;