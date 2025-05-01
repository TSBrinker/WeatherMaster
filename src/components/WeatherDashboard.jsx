// components/WeatherDashboard.jsx
import React, { useEffect } from "react";
import useWeather from "../hooks/useWeather";
import useWorld from "../hooks/useWorld";
import useWeatherIntegration from "../hooks/useWeatherIntegration";

// Weather components
import CurrentWeatherDisplay from "./weather/CurrentWeatherDisplay";
import WeatherEffectsPanel from "./weather/WeatherEffectsPanel";
import ForecastDisplay from "./weather/ForecastDisplay";
import WeatherControlPanel from "./weather/WeatherControlPanel";

// Time components
import TimeControlPanel from "./time/TimeControlPanel";
import TimeInfoDisplay from "./time/TimeInfoDisplay";

const WeatherDashboard = () => {
  const {
    currentDate,
    isLoading: weatherLoading,
    error: weatherError,
    initialized: weatherInitialized,
    initializeWeather,
  } = useWeather();

  const { isLoading: worldLoading, error: worldError } = useWorld();

  const { activeLocation, activeRegion, loadSavedWeather } =
    useWeatherIntegration();

  // Loading state
  const isLoading = weatherLoading || worldLoading;
  const error = weatherError || worldError;

  // If no location is selected, show empty state
  if (!activeLocation) {
    return (
      <div className="weather-dashboard p-4">
        <div className="empty-state text-center py-10">
          <div className="empty-state-icon">🌍</div>
          <div className="empty-state-title">No Location Selected</div>
          <div className="empty-state-desc">
            Please select or create a location to view weather.
          </div>
          <button
            className="btn btn-primary mt-4"
            onClick={() => (window.location.href = "#world-manager")}
          >
            Manage Worlds
          </button>
        </div>
      </div>
    );
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="weather-dashboard p-4">
        <div className="loading-state text-center py-10">
          <div className="text-xl mb-2">Loading weather data...</div>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="weather-dashboard p-4">
        <div className="error-state text-center py-10 text-danger">
          <div className="text-xl mb-2">Error loading weather data</div>
          <div>{error}</div>
          <button
            className="btn btn-primary mt-4"
            onClick={() => loadSavedWeather()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="weather-dashboard p-4">
      <div className="location-header mb-6 text-center">
        <h1 className="text-2xl font-bold mb-1">{activeLocation.name}</h1>
        {activeRegion && (
          <div className="text-gray-400">{activeRegion.name}</div>
        )}
      </div>

      <div className="dashboard-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="main-column lg:col-span-2"
          style={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}
        >
          <CurrentWeatherDisplay />
          <WeatherEffectsPanel />
          <ForecastDisplay />
        </div>

        <div className="sidebar-column">
          <WeatherControlPanel />
          <TimeControlPanel />
          <TimeInfoDisplay currentDate={currentDate} />
        </div>
      </div>
    </div>
  );
};

export default WeatherDashboard;
