// components/weather/RegionWeatherDisplay.jsx
import React, { useState, useEffect, useMemo } from "react";
import useWorld from "../../hooks/useWorld";
import useUnifiedWeather from "../../hooks/useUnifiedWeather";
import WeatherIcon from "./WeatherIcon";
import WindDisplay from "./WindDisplay";
import { getCelestialData } from "../../utils/celestialUtils";

const RegionWeatherDisplay = () => {
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
  const activeRegion = getActiveRegion();
  const activeWorld = getActiveWorld();

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

  // Format date for display
  const formattedDate = currentWeather.date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    hour12: true,
  });

  // Get the target region name if in transition
  const getTargetRegionName = () => {
    if (!inTransition || !activeWorld || !targetRegionId) return "";

    const targetRegion = activeWorld.regions.find(
      (r) => r.id === targetRegionId
    );
    return targetRegion ? targetRegion.name : "destination region";
  };

  // Format transition progress as percentage
  const formattedProgress = Math.round(transitionProgress * 100);

  // Format remaining journey time
  const formatRemainingTime = () => {
    if (!transitionInfo) return "";

    const hours = transitionInfo.remainingHours;

    if (hours === 1) return "1 hour";
    if (hours < 24) return `${hours} hours`;

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (remainingHours === 0) {
      return days === 1 ? "1 day" : `${days} days`;
    }

    return days === 1
      ? `1 day and ${remainingHours} hours`
      : `${days} days and ${remainingHours} hours`;
  };

  return (
    <div className="region-weather-display card">
      {/* Location and transition information */}
      <div className="location-header mb-4">
        <h2 className="text-xl font-bold mb-1">
          {activeRegion.name}
          {inTransition && (
            <span className="text-primary ml-2">⟶ {getTargetRegionName()}</span>
          )}
        </h2>

        {inTransition && (
          <div className="transition-info mb-2">
            <div className="text-sm text-gray-400">
              Traveling between regions - {formattedProgress}% of journey
              complete
            </div>
            <div className="progress-bar mt-1 bg-surface-light rounded-full h-2">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${formattedProgress}%` }}
              ></div>
            </div>
            <div className="remaining-time text-xs text-gray-400 mt-1">
              Estimated time to arrival: {formatRemainingTime()}
            </div>
          </div>
        )}

        <div className="current-date text-sm text-gray-400">
          {formattedDate}
        </div>
      </div>

      {/* Current Weather */}
      <div className="weather-header flex items-center justify-center gap-4 mb-4">
        <div
          className="weather-icon-container"
          style={{ position: "relative" }}
        >
          <WeatherIcon
            condition={currentWeather.condition}
            hour={currentWeather.date.getHours()}
            size="large"
          />

          {/* Celestial event indicator */}
          {(currentWeather.hasShootingStar ||
            currentWeather.hasMeteorImpact) && (
            <div
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                backgroundColor: currentWeather.hasMeteorImpact
                  ? "red"
                  : "gold",
                borderRadius: "50%",
                width: "22px",
                height: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {currentWeather.hasMeteorImpact ? "💥" : "☄️"}
            </div>
          )}
        </div>

        <div className="weather-info">
          <div className="condition text-xl font-semibold mb-2">
            {currentWeather.condition}
            {inTransition && (
              <span className="text-sm text-gray-400 ml-2">
                (transitional weather)
              </span>
            )}
          </div>
          <div className="temperature text-2xl font-bold mb-2">
            {currentWeather.temperature}°F
          </div>
          <WindDisplay
            direction={currentWeather.windDirection}
            speed={currentWeather.windSpeed}
            intensity={currentWeather.windIntensity}
          />
        </div>
      </div>

      {/* Weather effects */}
      <div className="weather-effects p-4 rounded-lg bg-surface-light mb-4">
        <h3 className="text-lg font-semibold mb-2">Weather Effects:</h3>
        <p style={{ whiteSpace: "pre-line" }}>{currentWeather.effects}</p>
      </div>

      {/* Celestial information if available */}
      {celestialData && (
        <div className="celestial-info p-4 rounded-lg bg-surface-light">
          <h3 className="text-lg font-semibold mb-2">Celestial Information:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center mb-1">
                <span className="mr-2">
                  {celestialData.isDaytime ? "☀️" : "🌙"}
                </span>
                <span className="font-semibold">
                  {celestialData.isDaytime ? "Daytime" : "Nighttime"}
                </span>
              </div>
              <div className="text-sm">
                Sunrise:{" "}
                {celestialData.sunrise.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="text-sm">
                Sunset:{" "}
                {celestialData.sunset.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            <div>
              <div className="flex items-center mb-1">
                <span className="mr-2">{celestialData.phaseIcon}</span>
                <span className="font-semibold">{celestialData.phaseName}</span>
              </div>
              <div className="text-sm">
                Moonrise:{" "}
                {celestialData.moonrise.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="text-sm">
                Moonset:{" "}
                {celestialData.moonset.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(RegionWeatherDisplay);
