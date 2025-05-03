// src/components/WeatherDashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRegion } from "../contexts/RegionContext";
import { useWorld } from "../contexts/WorldContext";
import weatherManager from "../services/weatherManager";
import WeatherDisplay from "./weather/WeatherDisplay";
import TimeControls from "./weather/TimeControls";
import ForecastDisplay from "./weather/ForecastDisplay";

const WeatherDashboard = () => {
  const { activeRegion } = useRegion();
  const {
    currentDate,
    advanceTime,
    getRegionWeather,
    updateRegionWeather,
    getRegionLastUpdateTime,
    updateRegionTimestamp,
  } = useWorld();

  const [season, setSeason] = useState("auto");
  const [currentSeason, setCurrentSeason] = useState("");
  const [forecast, setForecast] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Refs for tracking previous values to prevent effect re-runs
  const prevRegionIdRef = useRef(null);
  const prevDateRef = useRef(null);

  // Initialize or load weather data
  useEffect(() => {
    // Don't run if no active region
    if (!activeRegion) return;

    // Get the region ID
    const regionId = activeRegion.id;

    // Store current date for comparison
    const dateString = currentDate.toISOString();

    // Skip if nothing has changed
    if (
      initialized &&
      prevRegionIdRef.current === regionId &&
      prevDateRef.current === dateString
    ) {
      return;
    }

    // Update refs for next comparison
    prevRegionIdRef.current = regionId;
    prevDateRef.current = dateString;

    console.log(
      `Weather effect running: region=${regionId}, date=${dateString}`
    );
    setIsLoading(true);

    // Try to get existing weather from world state
    const savedWeather = getRegionWeather(regionId);
    const lastUpdateTime = getRegionLastUpdateTime(regionId);

    // Check if this region needs time advancement
    if (savedWeather && lastUpdateTime) {
      const lastUpdateDate = new Date(lastUpdateTime);
      const currentWorldDate = new Date(currentDate);

      // If there's a difference in time, we need to advance this region's weather
      if (currentWorldDate > lastUpdateDate) {
        console.log(`Time sync needed for region ${regionId}`);
        console.log(
          `Last update: ${lastUpdateDate}, Current world time: ${currentWorldDate}`
        );

        // Calculate hours to advance
        const hoursDiff = Math.floor(
          (currentWorldDate - lastUpdateDate) / (1000 * 60 * 60)
        );

        if (hoursDiff > 0) {
          console.log(
            `Advancing region time by ${hoursDiff} hours to catch up with world time`
          );

          // For very large time jumps (more than 7 days), reinitialize weather instead
          if (hoursDiff > 168) {
            // 24 * 7 = 168 hours in a week
            console.log(
              `Time gap exceeds 7 days (${hoursDiff} hours). Reinitializing weather.`
            );
            // Logic to reinitialize weather instead of advancing
            const actualSeason =
              season === "auto"
                ? weatherManager.getSeasonFromDate(currentWorldDate)
                : season;

            // Reinitialize weather for this region
            const newForecast = weatherManager.initializeWeather(
              regionId,
              activeRegion.climate,
              season === "auto" ? actualSeason : season,
              currentWorldDate
            );

            setForecast(newForecast);
            setCurrentSeason(actualSeason);

            // Save to world state
            updateRegionWeather(regionId, {
              season,
              currentSeason: actualSeason,
              forecast: newForecast.map((hour) => ({
                ...hour,
                date: hour.date.toISOString(),
              })),
            });
          } else {
            // Normal time advancement for reasonable gaps
            const actualSeason =
              season === "auto"
                ? weatherManager.getSeasonFromDate(currentWorldDate)
                : season;

            // Advance weather for this region
            const newForecast = weatherManager.advanceTime(
              regionId,
              hoursDiff,
              activeRegion.climate,
              season === "auto" ? actualSeason : season,
              currentWorldDate
            );

            setForecast(newForecast);
            setCurrentSeason(actualSeason);

            // Save to world state
            updateRegionWeather(regionId, {
              season,
              currentSeason: actualSeason,
              forecast: newForecast.map((hour) => ({
                ...hour,
                date: hour.date.toISOString(),
              })),
            });
          }

          // Update timestamp
          updateRegionTimestamp(regionId, currentWorldDate.toISOString());

          setIsLoading(false);
          setInitialized(true);
          return;
        }
      }
    }

    // Normal loading logic
    if (savedWeather && savedWeather.forecast) {
      console.log("Loading saved weather for region");
      // Load saved weather
      setSeason(savedWeather.season);
      setCurrentSeason(savedWeather.currentSeason);
      setForecast(
        savedWeather.forecast.map((hour) => ({
          ...hour,
          date: new Date(hour.date), // Convert date strings to Date objects
        }))
      );

      // Update timestamp
      updateRegionTimestamp(regionId, currentDate.toISOString());
    } else {
      console.log("Generating new weather for region");
      // Generate new weather
      const actualSeason =
        season === "auto"
          ? weatherManager.getSeasonFromDate(currentDate)
          : season;

      setCurrentSeason(actualSeason);

      // Initialize weather for this region
      const newForecast = weatherManager.initializeWeather(
        regionId,
        activeRegion.climate,
        season === "auto" ? actualSeason : season,
        currentDate
      );

      setForecast(newForecast);

      // Save to world state
      updateRegionWeather(regionId, {
        season,
        currentSeason: actualSeason,
        forecast: newForecast.map((hour) => ({
          ...hour,
          date: hour.date.toISOString(), // Convert Date objects to strings for storage
        })),
      });

      // Update timestamp
      updateRegionTimestamp(regionId, currentDate.toISOString());
    }

    setIsLoading(false);
    setInitialized(true);
  }, [activeRegion, currentDate]);

  // Handle time advancement using useCallback to prevent recreations
  const handleAdvanceTime = useCallback(
    (hours) => {
      if (!activeRegion) return;

      setIsLoading(true);
      console.log(`Advancing time by ${hours} hours`);

      // Get the current date before advancing time (for logging)
      const beforeDate = new Date(currentDate);

      // Advance global time
      advanceTime(hours);

      // Use updated date from the context (add hours manually since the context update might not be instant)
      const afterDate = new Date(beforeDate);
      afterDate.setHours(afterDate.getHours() + hours);

      console.log(
        `Time advanced from ${beforeDate.toISOString()} to ${afterDate.toISOString()}`
      );

      // Now we need to explicitly update the weather for this region
      const actualSeason =
        season === "auto"
          ? weatherManager.getSeasonFromDate(afterDate)
          : season;

      console.log(`Using season: ${actualSeason} for weather advancement`);

      // Use the weatherManager to advance time for this specific region
      const newForecast = weatherManager.advanceTime(
        activeRegion.id,
        hours,
        activeRegion.climate,
        season === "auto" ? actualSeason : season,
        afterDate
      );

      console.log(`Generated new forecast with ${newForecast.length} hours`);
      setForecast(newForecast);
      setCurrentSeason(actualSeason);

      // Save to world state
      updateRegionWeather(activeRegion.id, {
        season,
        currentSeason: actualSeason,
        forecast: newForecast.map((hour) => ({
          ...hour,
          date: hour.date.toISOString(),
        })),
      });

      // Update timestamp
      updateRegionTimestamp(activeRegion.id, afterDate.toISOString());

      setIsLoading(false);
    },
    [
      activeRegion,
      currentDate,
      season,
      advanceTime,
      updateRegionWeather,
      updateRegionTimestamp,
    ]
  );

  // Regenerate weather
  const regenerateWeather = useCallback(() => {
    if (!activeRegion) return;

    setIsLoading(true);

    const actualSeason =
      season === "auto"
        ? weatherManager.getSeasonFromDate(currentDate)
        : season;

    setCurrentSeason(actualSeason);

    // Reinitialize weather
    const newForecast = weatherManager.initializeWeather(
      activeRegion.id,
      activeRegion.climate,
      season === "auto" ? actualSeason : season,
      currentDate
    );

    setForecast(newForecast);

    // Save to world state
    updateRegionWeather(activeRegion.id, {
      season,
      currentSeason: actualSeason,
      forecast: newForecast.map((hour) => ({
        ...hour,
        date: hour.date.toISOString(),
      })),
    });

    // Update timestamp
    updateRegionTimestamp(activeRegion.id, currentDate.toISOString());

    setIsLoading(false);
  }, [
    activeRegion,
    season,
    currentDate,
    updateRegionWeather,
    updateRegionTimestamp,
  ]);

  // Empty state - no region selected
  if (!activeRegion) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🗺️</div>
        <h2 className="empty-state-title">No Region Selected</h2>
        <p className="empty-state-desc">
          Please select or create a region to view weather information.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-bold mb-2">Loading Weather</h2>
          <p>Generating weather for {activeRegion.name}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="weather-dashboard">
      {/* Header with region info */}
      <div className="flex justify-between items-center mb-4 p-4 bg-surface rounded-lg">
        <div>
          <h1 className="text-xl font-bold">Weather for {activeRegion.name}</h1>
          <div className="text-gray-400 text-sm">
            Climate: {activeRegion.climate.replace("-", " ")}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold">
            {currentDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div>
            {currentDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              hour12: true,
            })}
            {season === "auto" && ` • ${currentSeason}`}
          </div>
        </div>
      </div>

      {/* Weather controls */}
      <div className="flex items-center gap-4 mb-4 p-4 bg-surface rounded-lg">
        <div>
          <label htmlFor="season-select" className="mr-2">
            Season:
          </label>
          <select
            id="season-select"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="p-2 rounded bg-surface-light text-white border border-border"
          >
            <option value="auto">Auto (from date)</option>
            <option value="winter">Winter</option>
            <option value="spring">Spring</option>
            <option value="summer">Summer</option>
            <option value="fall">Fall</option>
          </select>
        </div>

        <button onClick={regenerateWeather} className="btn btn-primary">
          Regenerate Weather
        </button>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Current weather - 2 columns */}
        <div className="lg:col-span-2">
          {forecast.length > 0 && <WeatherDisplay weather={forecast[0]} />}
        </div>

        {/* Time controls - 1 column */}
        <div>
          <TimeControls
            currentDate={currentDate}
            onAdvanceTime={handleAdvanceTime}
            currentHour={forecast.length > 0 ? forecast[0].date.getHours() : 0}
          />
        </div>
      </div>

      <div className="mb-4">
        {forecast.length > 0 && <ForecastDisplay forecast={forecast} />}
      </div>
    </div>
  );
};

export default WeatherDashboard;
