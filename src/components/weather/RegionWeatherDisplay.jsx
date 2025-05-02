import React, { useState, useEffect, useMemo } from "react";
import useWorld from "../../hooks/useWorld";
import useUnifiedWeather from "../../hooks/useUnifiedWeather";
import WeatherIcon from "./WeatherIcon";
import WindDisplay from "./WindDisplay";
import { getCelestialData } from "../../utils/celestialUtils";

const RegionWeatherDisplay = React.memo(() => {
  // Get world data
  const { getActiveRegion, getActiveWorld } = useWorld();

  // Get unified weather data
  const {
    regionForecast,
    inTransition,
    transitionProgress,
    targetRegionId,
    getTransitionInfo,
    forecastVersion,
  } = useUnifiedWeather();

  // Local state for UI components
  const [celestialData, setCelestialData] = useState(null);
  const [transitionInfo, setTransitionInfo] = useState(null);

  // Get references to active region and world
  const activeRegion = useMemo(() => getActiveRegion(), [getActiveRegion]);
  const activeWorld = useMemo(() => getActiveWorld(), [getActiveWorld]);

  // Create a stable reference to the current weather using useMemo
  const currentWeather = useMemo(() => {
    if (!regionForecast || regionForecast.length === 0) return null;
    return regionForecast[0];
  }, [regionForecast, forecastVersion]);

  // Update celestial data when the current weather changes
  useEffect(() => {
    if (currentWeather && activeRegion) {
      const data = getCelestialData(
        currentWeather.date,
        activeRegion.climate || "temperate-deciduous"
      );
      setCelestialData(data);
    }
  }, [currentWeather, activeRegion]);

  // Update transition info when in transition
  useEffect(() => {
    if (inTransition) {
      const info = getTransitionInfo();
      setTransitionInfo(info);
    } else {
      setTransitionInfo(null);
    }
  }, [inTransition, transitionProgress, getTransitionInfo]);

  // Rest of the component remains the same...
  
  // If no weather or region data, show empty state
  if (!currentWeather || !activeRegion) {
    return (
      <div className="region-weather-display card">
        <div className="empty-state text-center py-6">
          <p>No weather data available for this region.</p>
        </div>
      </div>
    );
  }

  // Rest of your component render logic...

  // Format date for display
  const formattedDate = currentWeather.date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    hour12: true,
  });

  // Rest of your render code...
});

export default RegionWeatherDisplay;