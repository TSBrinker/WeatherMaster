// src/components/weather/WeatherDashboardIntegration.jsx
import React, { useEffect, useState } from "react";
import WeatherDashboardExtensions from "./WeatherDashboardExtensions";
import weatherManager from "../../services/WeatherManager";

/**
 * This component integrates the meteorological extensions into the existing WeatherDashboard
 * It's designed to be included in the WeatherDashboard component without modifying its core code
 */
const WeatherDashboardIntegration = ({ regionId, forecast }) => {
  const [weatherService, setWeatherService] = useState(null);
  const [isMeteorologicalSystem, setIsMeteorologicalSystem] = useState(false);

  // Get the weather service for the region when component mounts or region changes
  useEffect(() => {
    if (!regionId) return;

    const service = weatherManager.getWeatherService(regionId);
    setWeatherService(service);

    // Determine if this is the meteorological system
    // We check the constructor name since instance of might not work due to module boundaries
    const isMeteorological =
      service && service.constructor.name === "MeteorologicalWeatherService";
    setIsMeteorologicalSystem(isMeteorological);
  }, [regionId]);

  // If not using meteorological system, don't render anything
  if (!isMeteorologicalSystem || !weatherService) {
    return null;
  }

  // Ensure forecast is not null before passing it to the extensions
  const safeForecast = Array.isArray(forecast) ? forecast : [];

  return (
    <WeatherDashboardExtensions
      forecast={safeForecast}
      weatherService={weatherService}
    />
  );
};

export default WeatherDashboardIntegration;
