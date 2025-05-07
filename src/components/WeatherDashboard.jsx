// src/components/WeatherDashboard.jsx - Complete with Moon Phase Display
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRegion } from "../contexts/RegionContext";
import { useWorld } from "../contexts/WorldContext";
import { useWorldSettings } from "../contexts/WorldSettings";
import weatherManager from "../services/weatherManager";
import WeatherDisplay from "./weather/WeatherDisplay";
import TimeControls from "./weather/TimeControls";
import ForecastDisplay from "./weather/ForecastDisplay";
import MoonPhaseDisplay from "./weather/MoonPhaseDisplay";

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
  const {
    state: worldSettings,
    formatGameDate,
    formatGameTime,
    advanceGameTime,
  } = useWorldSettings();

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

    // Check if this region needs time synchronization
    if (savedWeather && lastUpdateTime) {
      const lastUpdateDate = new Date(lastUpdateTime);
      const currentWorldDate = new Date(currentDate);

      // Calculate time difference in milliseconds
      const timeDiffMs = currentWorldDate.getTime() - lastUpdateDate.getTime();

      // If there's a time difference greater than 1 minute
      if (Math.abs(timeDiffMs) > 60000) {
        console.log(`Time sync needed for region ${regionId}`);
        console.log(`Last update: ${lastUpdateDate.toISOString()}`);
        console.log(`Current world time: ${currentWorldDate.toISOString()}`);
        console.log(`Time difference: ${timeDiffMs / (1000 * 60 * 60)} hours`);

        // Calculate hours to advance (can be negative if going backward in time)
        const hoursDiff = Math.round(timeDiffMs / (1000 * 60 * 60));

        if (hoursDiff !== 0) {
          console.log(
            `Syncing region time by ${hoursDiff} hours to match world time`
          );

          // For very large time jumps (more than 3 days), reinitialize weather
          if (Math.abs(hoursDiff) > 72) {
            console.log(
              `Time gap exceeds 3 days (${hoursDiff} hours). Reinitializing weather.`
            );

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

            // Use absolute value for advancing time - weatherManager needs positive hours
            const absHoursDiff = Math.abs(hoursDiff);

            // Advance weather for this region
            let newForecast;

            if (hoursDiff > 0) {
              // Advancing forward in time
              newForecast = weatherManager.advanceTime(
                regionId,
                absHoursDiff,
                activeRegion.climate,
                season === "auto" ? actualSeason : season,
                new Date(lastUpdateDate.getTime()) // Start from last update time
              );
            } else {
              // Going backward in time or any other case - reinitialize
              newForecast = weatherManager.initializeWeather(
                regionId,
                activeRegion.climate,
                season === "auto" ? actualSeason : season,
                currentWorldDate
              );
            }

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

          // Update timestamp to current world time
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

      // Also advance game time in WorldSettings to handle year progression
      advanceGameTime(hours);

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
      advanceGameTime,
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
          {/* Use formatted game date from WorldSettings */}
          <div className="font-bold">{formatGameDate(currentDate)}</div>
          <div>
            {formatGameTime(currentDate)}
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

        {/* Right sidebar - 1 column */}
        <div className="space-y-4">
          {/* Time controls */}
          <TimeControls
            currentDate={currentDate}
            onAdvanceTime={handleAdvanceTime}
            currentHour={forecast.length > 0 ? forecast[0].date.getHours() : 0}
          />

          {/* Moon phase display */}
          <MoonPhaseDisplay currentDate={currentDate} />
        </div>
      </div>

      {/* Forecast display */}
      <div className="mb-4">
        {forecast.length > 0 && <ForecastDisplay forecast={forecast} />}
      </div>
    </div>
  );
};

export default WeatherDashboard;
