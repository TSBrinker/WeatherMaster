// components/EnhancedWeatherDashboard.jsx
import React, { useEffect } from "react";
import useWorld from "../hooks/useWorld";
import useUnifiedWeather from "../hooks/useUnifiedWeather.js";

// Import Weather Components
import RegionWeatherDisplay from "./weather/RegionWeatherDisplay";
import ForecastDisplay from "./weather/ForecastDisplay";
import RegionTransitionControls from "./weather/RegionTransitionControls";

// Import Time Components
import TimeControlPanel from "./time/TimeControlPanel";
import EnhancedTimeInfoDisplay from "./time/EnhancedTimeInfoDisplay";

const EnhancedWeatherDashboard = () => {
  // Get world data
  const {
    isLoading: worldLoading,
    error: worldError,
    getActiveRegion,
    getActiveLocation,
  } = useWorld();

  // Get unified weather data
  const {
    currentDate,
    regionForecast,
    isLoading: weatherLoading,
    error: weatherError,
    initialized: weatherInitialized,
    inTransition,
    initializeWeather,
  } = useUnifiedWeather();

  // Loading state
  const isLoading = weatherLoading || worldLoading;
  const error = weatherError || worldError;

  // Get active region and location
  const activeRegion = getActiveRegion();
  const activeLocation = getActiveLocation();

  // Initialize weather on component mount
  useEffect(() => {
    if (activeRegion && weatherInitialized) {
      initializeWeather(activeRegion);
    }
  }, [activeRegion, weatherInitialized, initializeWeather]);

  // If no location or region is selected, show empty state
  if (!activeLocation || !activeRegion) {
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
            onClick={() => initializeWeather(activeRegion)}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Check if we have forecast data
  const hasForecast = regionForecast && regionForecast.length > 0;

  return (
    <div className="enhanced-weather-dashboard p-4">
      <div className="location-header mb-6 text-center">
        <h1 className="text-2xl font-bold mb-1">{activeLocation.name}</h1>
        {activeRegion && (
          <div className="text-gray-400">{activeRegion.name} Region</div>
        )}
      </div>

      <div className="dashboard-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="main-column lg:col-span-2">
          {hasForecast ? (
            <>
              <RegionWeatherDisplay />
              <ForecastDisplay />
            </>
          ) : (
            <div className="card">
              <div className="empty-state text-center py-6">
                <p>
                  No weather data available. Please initialize weather settings.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-column">
          {/* Show region transition controls */}
          <RegionTransitionControls />

          {/* Only show time controls if we're not in transition */}
          {!inTransition && <TimeControlPanel />}

          {/* Enhanced celestial information */}
          <EnhancedTimeInfoDisplay currentDate={currentDate} />
        </div>
      </div>
    </div>
  );
};

export default EnhancedWeatherDashboard;
