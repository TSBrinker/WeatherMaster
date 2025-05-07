// src/components/WeatherDashboard.jsx - Complete redesigned version with overlay
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRegion } from "../contexts/RegionContext";
import { useWorld } from "../contexts/WorldContext";
import { useWorldSettings } from "../contexts/WorldSettings";
import weatherManager from "../services/weatherManager";
import skyColorService from "../services/SkyColorService";
import sunriseSunsetService from "../services/SunriseSunsetService";
import ForecastDisplay from "./weather/ForecastDisplay";
import CelestialArcDisplay from "./weather/CelestialArcDisplay";
import "../weatherDashboard.css"; // Make sure to create this CSS file

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
  const [activeSection, setActiveSection] = useState(null); // null, 'forecast', 'region', or 'effects'
  const [customHours, setCustomHours] = useState(1);

  const {
    state: worldSettings,
    formatGameDate,
    formatGameTime,
    advanceGameTime,
  } = useWorldSettings();

  // Add state for dynamic theme colors
  const [themeColors, setThemeColors] = useState({
    backgroundColor: "#1f2937", // Default background
    textColor: "#f9fafb", // Default text
    backgroundImage: "none", // Default no image
  });

  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Refs for tracking previous values to prevent effect re-runs
  const prevRegionIdRef = useRef(null);
  const prevDateRef = useRef(null);

  // Get current celestial data for displaying sunrise/sunset info
  const getCelestialInfo = useCallback(() => {
    if (!activeRegion) return { 
      sunrise: null, sunset: null, isDaytime: false, 
      sunriseTime: "N/A", sunsetTime: "N/A" 
    };

    return sunriseSunsetService.getFormattedSunriseSunset(
      activeRegion.latitudeBand || "temperate", 
      currentDate
    );
  }, [activeRegion, currentDate]);
  
  const celestialInfo = getCelestialInfo();

  // Update theme colors based on time of day and weather
  useEffect(() => {
    if (forecast.length > 0 && activeRegion) {
      const currentWeather = forecast[0];
      try {
        const skyColors = skyColorService.calculateSkyColor(
          currentWeather.date,
          currentWeather.condition,
          activeRegion.latitudeBand || "temperate"
        );

        // Log to check if colors are updating correctly
        console.log("Sky colors updated:", skyColors);

        setThemeColors({
          backgroundColor: skyColors.backgroundColor,
          textColor: skyColors.textColor,
          backgroundImage: skyColors.backgroundImage,
        });
      } catch (error) {
        console.error("Error calculating sky colors:", error);
      }
    }
  }, [forecast, activeRegion, currentDate]);

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

  // Handle custom time advance
  const handleCustomTimeAdvance = () => {
    if (customHours > 0) {
      handleAdvanceTime(customHours);
    }
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

  // Create a dynamic style for the weather display based on theme colors
  const dynamicWeatherStyle = {
    backgroundColor: themeColors.backgroundColor,
    color: themeColors.textColor,
    backgroundImage:
      themeColors.backgroundImage !== "none"
        ? themeColors.backgroundImage
        : "none",
    transition: "background-color 2s, color 2s, background-image 2s",
  };
  
  // Get weather condition icon as emoji
  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'Clear Skies':
        return celestialInfo.isDaytime ? '☀️' : '🌙';
      case 'Light Clouds':
        return celestialInfo.isDaytime ? '🌤️' : '☁️';
      case 'Heavy Clouds':
        return '☁️';
      case 'Rain':
        return '🌧️';
      case 'Heavy Rain':
        return '⛈️';
      case 'Snow':
        return '❄️';
      case 'Freezing Cold':
        return '🥶';
      case 'Cold Winds':
        return '🌬️';
      case 'Scorching Heat':
        return '🔥';
      case 'Thunderstorm':
        return '⚡';
      case 'Blizzard':
        return '🌨️';
      case 'High Humidity Haze':
        return '🌫️';
      case 'Cold Snap':
        return '❄️';
      default:
        return '❓';
    }
  };

  return (
    <div className="weather-dashboard">
      {/* Top Section: Time and Controls */}
      <div className="time-control-panel">
        <div className="custom-time-controls">
          <div className="custom-time-input">
            <input
              type="number"
              min="1"
              value={customHours}
              onChange={(e) => setCustomHours(parseInt(e.target.value) || 1)}
              className="custom-hours-input"
              aria-label="Custom hours"
            />
            <button 
              onClick={handleCustomTimeAdvance}
              className="custom-advance-button"
            >
              Advance
            </button>
          </div>
        </div>
        
        <div className="time-display">
          <div className="date-display">{formatGameDate(currentDate)}</div>
          <div className="time-display-large">{formatGameTime(currentDate)}</div>
          <div className="current-weather-label">
            {forecast.length > 0 ? forecast[0].condition : "Loading..."}
            {season === "auto" && currentSeason ? ` • ${currentSeason}` : ""}
          </div>
        </div>
        
        <div className="quick-time-controls">
          <button onClick={() => handleAdvanceTime(1)}>+1h</button>
          <button onClick={() => handleAdvanceTime(4)}>+4h</button>
          <button onClick={() => handleAdvanceTime(24)}>+24h</button>
        </div>
      </div>
      
      {/* Central Section: Celestial Display with Weather Overlay */}
      <div className="celestial-display-container" style={dynamicWeatherStyle}>
        {forecast.length > 0 && (
          <>
            <div className="weather-overlay">
              <div className="weather-icon-large">
                {getWeatherIcon(forecast[0].condition)}
              </div>
              <div className="weather-details">
                <div className="temperature-display-large">
                  {forecast[0].temperature}°F
                </div>
                <div className="wind-display-large">
                  {forecast[0].windSpeed} mph {forecast[0].windDirection}
                  <span className="wind-intensity">
                    • {forecast[0].windIntensity}
                  </span>
                </div>
                <div className="next-event-display">
                  Next {celestialInfo.isDaytime ? "sunset" : "sunrise"}: {celestialInfo.isDaytime ? celestialInfo.sunsetTime : celestialInfo.sunriseTime}
                </div>
              </div>
            </div>
            
            <CelestialArcDisplay
              currentDate={currentDate}
              latitudeBand={activeRegion.latitudeBand || "temperate"}
            />
          </>
        )}
        
        {/* Region name at the bottom of the display */}
        <div className="region-name-overlay">
          {activeRegion.name}
        </div>
      </div>
      
      {/* Bottom Section: Action Buttons */}
      <div className="action-buttons">
        <button 
          className={`forecast-button ${activeSection === 'forecast' ? 'active' : ''}`}
          onClick={() => setActiveSection(activeSection === 'forecast' ? null : 'forecast')}
        >
          Forecast
        </button>
        <button 
          className={`region-details-button ${activeSection === 'region' ? 'active' : ''}`}
          onClick={() => setActiveSection(activeSection === 'region' ? null : 'region')}
        >
          Region Details
        </button>
        <button 
          className={`weather-effects-button ${activeSection === 'effects' ? 'active' : ''}`}
          onClick={() => setActiveSection(activeSection === 'effects' ? null : 'effects')}
        >
          Weather Effects
        </button>
      </div>
      
      {/* Expandable sections - now controlled by activeSection */}
      {activeSection === 'forecast' && (
        <div className="forecast-section">
          <ForecastDisplay forecast={forecast} />
        </div>
      )}
      
      {activeSection === 'region' && (
        <div className="region-details-section">
          <div className="card p-4">
            <h2 className="text-xl font-semibold mb-4">Region Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Climate:</span> {activeRegion.climate.replace("-", " ")}
              </div>
              <div>
                <span className="text-gray-400">Latitude:</span> {activeRegion.latitudeBand || "temperate"}
              </div>
              <div>
                <span className="text-gray-400">Season:</span> {currentSeason}
              </div>
              <div>
                <span className="text-gray-400">Weather Mode:</span> 
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="ml-2 p-1 bg-surface-light border border-border rounded"
                >
                  <option value="auto">Auto (from date)</option>
                  <option value="winter">Winter</option>
                  <option value="spring">Spring</option>
                  <option value="summer">Summer</option>
                  <option value="fall">Fall</option>
                </select>
              </div>
            </div>
            <button 
              onClick={regenerateWeather} 
              className="btn btn-primary mt-4"
            >
              Regenerate Weather
            </button>
          </div>
        </div>
      )}
      
      {activeSection === 'effects' && (
        <div className="weather-effects-section">
          <div className="card p-4">
            <h2 className="text-xl font-semibold mb-4">Weather Effects</h2>
            <div className="weather-effects-content">
              {forecast.length > 0 && (
                <p className="whitespace-pre-line">{forecast[0].effects}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherDashboard;