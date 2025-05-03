// src/components/WeatherDashboard.jsx
import React, { useState, useEffect } from "react";
import { useRegion } from "../contexts/RegionContext";
import { useWorld } from "../contexts/WorldContext";
import weatherManager from "../services/weatherManager";
import WeatherDisplay from "./weather/WeatherDisplay";
import TimeControls from "./weather/TimeControls";
import ForecastDisplay from "./weather/ForecastDisplay";

const WeatherDashboard = () => {
  const { activeRegion } = useRegion();
  // Make sure we're importing all needed functions from useWorld
  const {
    currentDate,
    advanceTime,
    getRegionWeather,
    updateRegionWeather,
    getRegionLastUpdateTime, // Make sure this is included
    updateRegionTimestamp, // Make sure this is included
  } = useWorld();

  const [season, setSeason] = useState("auto");
  const [currentSeason, setCurrentSeason] = useState("");
  const [forecast, setForecast] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize or load weather data
  useEffect(() => {
    if (!activeRegion) return;

    setIsLoading(true);
    console.log(
      `Weather effect running: region=${activeRegion.id}, date=${currentDate}`
    );

    // Try to get existing weather from world state
    const savedWeather = getRegionWeather(activeRegion.id);
    const lastUpdateTime = getRegionLastUpdateTime(activeRegion.id);

    // Check if this region needs time advancement
    if (savedWeather && lastUpdateTime) {
      const lastUpdateDate = new Date(lastUpdateTime);
      const currentWorldDate = new Date(currentDate);

      // If there's a difference in time, we need to advance this region's weather
      if (currentWorldDate > lastUpdateDate) {
        console.log(`Time sync needed for region ${activeRegion.id}`);
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

          const actualSeason =
            season === "auto"
              ? weatherManager.getSeasonFromDate(currentWorldDate)
              : season;

          // Advance weather for this region
          const newForecast = weatherManager.advanceTime(
            activeRegion.id,
            hoursDiff,
            activeRegion.climate,
            season === "auto" ? actualSeason : season,
            currentWorldDate
          );

          setForecast(newForecast);
          setCurrentSeason(actualSeason);

          // Save updated weather
          updateRegionWeather(activeRegion.id, {
            season,
            currentSeason: actualSeason,
            forecast: newForecast.map((hour) => ({
              ...hour,
              date: hour.date.toISOString(),
            })),
          });

          // Update timestamp
          updateRegionTimestamp(
            activeRegion.id,
            currentWorldDate.toISOString()
          );

          setIsLoading(false);
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
      updateRegionTimestamp(activeRegion.id, currentDate.toISOString());
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
          date: hour.date.toISOString(), // Convert Date objects to strings for storage
        })),
      });

      // Update timestamp
      updateRegionTimestamp(activeRegion.id, currentDate.toISOString());
    }

    setIsLoading(false);
  }, [activeRegion, currentDate]);

  // Handle time advancement
  const handleAdvanceTime = (hours) => {
    if (!activeRegion) return;

    setIsLoading(true);
    console.log(`Advancing time by ${hours} hours`);

    // Get the current date before advancing time (for logging)
    const beforeDate = new Date(currentDate);

    // Advance global time
    advanceTime(hours);

    // Use updated date from the context
    const afterDate = new Date(currentDate);
    afterDate.setHours(afterDate.getHours() + hours); // Add hours since context might not have updated yet

    console.log(
      `Time advanced from ${beforeDate.toISOString()} to ${afterDate.toISOString()}`
    );

    // Now we need to explicitly update the weather for this region
    const actualSeason =
      season === "auto" ? weatherManager.getSeasonFromDate(afterDate) : season;

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
  };

  // Regenerate weather
  const regenerateWeather = () => {
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
  };

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

      {/* Forecast display */}
      <div className="mb-4">
        {forecast.length > 0 && <ForecastDisplay forecast={forecast} />}
      </div>
    </div>
  );
};

export default WeatherDashboard;
