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
  const { currentDate, advanceTime, getRegionWeather, updateRegionWeather } =
    useWorld();
  const [season, setSeason] = useState("auto");
  const [currentSeason, setCurrentSeason] = useState("");
  const [forecast, setForecast] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize or load weather data
  useEffect(() => {
    if (!activeRegion) return;

    setIsLoading(true);

    // Try to get existing weather from world state
    const savedWeather = getRegionWeather(activeRegion.id);

    if (savedWeather && savedWeather.forecast) {
      // Load saved weather
      setSeason(savedWeather.season);
      setCurrentSeason(savedWeather.currentSeason);
      setForecast(
        savedWeather.forecast.map((hour) => ({
          ...hour,
          date: new Date(hour.date), // Convert date strings to Date objects
        }))
      );
    } else {
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
        season,
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
    }

    setIsLoading(false);
  }, [activeRegion, currentDate]);

  // Handle time advancement
  const handleAdvanceTime = (hours) => {
    if (!activeRegion) return;

    setIsLoading(true);

    // Advance global time
    advanceTime(hours);

    // Now we need to explicitly update the weather for this region
    const actualSeason =
      season === "auto"
        ? weatherManager.getSeasonFromDate(currentDate)
        : season;

    // Use the weatherManager to advance time for this specific region
    const newForecast = weatherManager.advanceTime(
      activeRegion.id,
      hours,
      activeRegion.climate,
      season,
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
      season,
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
