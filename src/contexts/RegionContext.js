// src/contexts/RegionContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { getLocalStorage, setLocalStorage } from "../utils/storageUtils";
import weatherManager from "../services/WeatherManager";

// Create the context
const RegionContext = createContext();

// Custom hook for using the context
export const useRegion = () => useContext(RegionContext);

// Provider component
export const RegionProvider = ({ children }) => {
  const [regions, setRegions] = useState([]);
  const [activeRegionId, setActiveRegionId] = useState(null);

  // Load regions from localStorage on mount
  useEffect(() => {
    const storedRegions = getLocalStorage("regions") || [];
    if (storedRegions.length > 0) {
      setRegions(storedRegions);
      // Set first region as active if none is active
      if (!activeRegionId && storedRegions.length > 0) {
        setActiveRegionId(storedRegions[0].id);
      }
    }
  }, []);

  // Save regions to localStorage whenever they change
  useEffect(() => {
    if (regions.length > 0) {
      setLocalStorage("regions", regions);
    }
  }, [regions]);

  // Get the active region object
  const getActiveRegion = () => {
    return regions.find((region) => region.id === activeRegionId) || null;
  };

  // Create a new region
  const createRegion = (data) => {
    const newRegion = {
      id: uuidv4(),
      name: data.name,
      climate: data.climate,
      latitudeBand: data.latitudeBand || "temperate", 
      weatherType: data.weatherType || "diceTable", // Add weather type field
      parameters: data.parameters || null, // Add parameters field for meteorological system
      templateId: data.templateId || null, // Add template ID field
      weatherData: null, // Initialize with no weather data
      timestamp: new Date().toISOString(), // Current time
    };

    const updatedRegions = [...regions, newRegion];
    setRegions(updatedRegions);
    setActiveRegionId(newRegion.id);

    return newRegion;
  };

  // Update an existing region
  const updateRegion = (id, data) => {
    // If weather type changed, reset the weather data
    const existingRegion = regions.find(r => r.id === id);
    const weatherTypeChanged = existingRegion && existingRegion.weatherType !== data.weatherType;
    
    // Create updated region with new data
    const updatedRegion = {
      ...existingRegion,
      name: data.name,
      climate: data.climate,
      latitudeBand: data.latitudeBand || existingRegion.latitudeBand,
      weatherType: data.weatherType || existingRegion.weatherType,
      parameters: data.parameters || existingRegion.parameters,
      templateId: data.templateId || existingRegion.templateId,
      
      // Reset weather data if weather type changed
      weatherData: weatherTypeChanged ? null : existingRegion.weatherData
    };

    // Update the regions array
    const updatedRegions = regions.map((region) =>
      region.id === id ? updatedRegion : region
    );

    setRegions(updatedRegions);
    
    // If weather type changed, clear the weather service
    if (weatherTypeChanged) {
      weatherManager.clearWeatherService(id);
    }

    return updatedRegion;
  };

  // Delete a region
  const deleteRegion = (id) => {
    const updatedRegions = regions.filter((region) => region.id !== id);
    setRegions(updatedRegions);

    // If deleting the active region, set a new active region
    if (id === activeRegionId) {
      if (updatedRegions.length > 0) {
        setActiveRegionId(updatedRegions[0].id);
      } else {
        setActiveRegionId(null);
      }
    }
    
    // Clear the weather service for this region
    weatherManager.clearWeatherService(id);
  };

  // Update weather data for a region
  const updateRegionWeather = (id, weatherData) => {
    const updatedRegions = regions.map((region) =>
      region.id === id ? { ...region, weatherData } : region
    );
    setRegions(updatedRegions);
  };

  // Update timestamp for a region
  const updateRegionTimestamp = (id, timestamp) => {
    const updatedRegions = regions.map((region) =>
      region.id === id ? { ...region, timestamp } : region
    );
    setRegions(updatedRegions);
  };

  return (
    <RegionContext.Provider
      value={{
        regions,
        activeRegionId,
        setActiveRegionId,
        getActiveRegion,
        createRegion,
        updateRegion,
        deleteRegion,
        updateRegionWeather,
        updateRegionTimestamp,
      }}
    >
      {children}
    </RegionContext.Provider>
  );
};