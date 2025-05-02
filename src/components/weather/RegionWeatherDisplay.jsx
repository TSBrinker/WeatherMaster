// components/weather/RegionWeatherDisplay.jsx
import React, { useState, useEffect, useRef } from "react";
import useWorld from "../../hooks/useWorld";
import useRegionWeather from "../../hooks/useRegionWeather";
import WeatherIcon from "./WeatherIcon";
import WindDisplay from "./WindDisplay";
import { getCelestialData } from "../../utils/celestialUtils";

const RegionWeatherDisplay = () => {
  // Define all hooks at the top level - never conditionally
  const { getActiveRegion, getActiveWorld } = useWorld();
  const {
    regionForecast,
    inTransition,
    transitionProgress,
    targetRegionId,
    getTransitionInfo,
  } = useRegionWeather();

  const [celestialData, setCelestialData] = useState(null);
  const [transitionInfo, setTransitionInfo] = useState(null);

  // Use refs to store values that shouldn't trigger re-renders
  const currentWeatherRef = useRef(null);
  const firstRenderRef = useRef(true);
  const renderCountRef = useRef(0);

  // Increment render counter on each render
  renderCountRef.current++;

  // Get the active region
  const activeRegion = getActiveRegion();
  const activeWorld = getActiveWorld();

  // Update the current weather ref when the forecast changes
  useEffect(() => {
    if (regionForecast && regionForecast.length > 0) {
      // Only update on first render or when the hour/date of the first forecast item changes
      if (
        firstRenderRef.current ||
        !currentWeatherRef.current ||
        currentWeatherRef.current.date.getHours() !==
          regionForecast[0].date.getHours() ||
        currentWeatherRef.current.date.getDate() !==
          regionForecast[0].date.getDate()
      ) {
        // Store the new current weather
        currentWeatherRef.current = regionForecast[0];

        // Mark first render as complete
        if (firstRenderRef.current) {
          firstRenderRef.current = false;
        }

        // Also update celestial data if region is available
        if (activeRegion) {
          const data = getCelestialData(
            regionForecast[0].date,
            activeRegion.climate || "temperate-deciduous"
          );

          setCelestialData(data);
        }
      }
    }
  }, [regionForecast, activeRegion]);

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
  if (!currentWeatherRef.current || !activeRegion) {
    return (
      <div className="region-weather-display card">
        <div className="empty-state text-center py-6">
          <p>No weather data available for this region.</p>
        </div>
      </div>
    );
  }

  // Use the stored current weather from the ref
  const currentWeather = currentWeatherRef.current;

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

      {/* Debug panel - now fixed to avoid hook errors */}
      <div
        className="debug-info mt-4 p-3 bg-surface rounded-lg text-xs"
        style={{ display: "none" }}
      >
        <p>Re-render count: {renderCountRef.current}</p>
        <p>Current weather date: {currentWeather.date.toLocaleString()}</p>
        <p>First render: {firstRenderRef.current ? "true" : "false"}</p>
      </div>
    </div>
  );
};

export default RegionWeatherDisplay;
