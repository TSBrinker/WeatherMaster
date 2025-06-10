// src/components/WeatherDashboard.jsx - Corrected version preserving original structure
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useRegion } from "../contexts/RegionContext";
import { useWorld } from "../contexts/WorldContext";
import { useWorldSettings } from "../contexts/WorldSettings";
import weatherManager from "../services/weatherManager";
import skyColorService from "../services/SkyColorService";
import sunriseSunsetService from "../services/SunriseSunsetService";
import moonService from "../services/MoonService";
import weatherDescriptionService from "../services/WeatherDescriptionService";
import { getPreciseSkyGradient } from "../utils/SkyGradients";
import MeteorologicalDebugPanel from "./debug/MeteorologicalDebugPanel";
import RegionDebug from "./debug/RegionDebug";

// Import components
import TimeDisplay from "./weather/TimeDisplay";
import CustomTimeControls from "./weather/CustomTimeControls";
import QuickTimeControls from "./weather/QuickTimeControls";
import CurrentWeatherDisplay from "./weather/CurrentWeatherDisplay";
import CelestialInfo from "./weather/CelestialInfo";
import ActionTabs from "./weather/ActionTabs";
import ForecastDisplay from "./weather/ForecastDisplay";
import RegionDetails from "./region/RegionDetails";
import WeatherEffects from "./weather/WeatherEffects";
import { usePreferences } from "../contexts/PreferencesContext";
import TimeControls from "./weather/TimeControls";

// Import CSS
import "../weatherDashboard.css";

const WeatherDashboard = () => {
  // Debug render counter
  const renderCount = useRef(0);

  const { state: preferences } = usePreferences();

  // Context hooks
  const { activeRegion } = useRegion();
  const {
    currentDate,
    advanceTime,
    getRegionWeather,
    updateRegionWeather,
    getRegionLastUpdateTime,
    updateRegionTimestamp,
  } = useWorld();

  const {
    state: worldSettings,
    formatGameDate,
    formatGameTime,
    advanceGameTime,
  } = useWorldSettings();

  // Component state
  const [season, setSeason] = useState("auto");
  const [currentSeason, setCurrentSeason] = useState("");
  const [forecast, setForecast] = useState([]);
  const [activeSection, setActiveSection] = useState("effects");
  const [themeColors, setThemeColors] = useState({
    backgroundColor: "#1f2937",
    textColor: "#f9fafb",
    backgroundImage: "none",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0); // Added to force updates when needed
  const [weatherDescription, setWeatherDescription] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  const [isForecastExpanded, setIsForecastExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Helper function to ensure we have a valid Date object
  const getValidDate = (date) => {
    if (!date) return new Date();
    if (date instanceof Date && !isNaN(date.getTime())) return date;
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const validCurrentDate = useMemo(() => getValidDate(currentDate), [currentDate]);

  // Current weather memo (first item in forecast)
  const currentWeather = useMemo(() => forecast[0] || null, [forecast]);

  // Current weather system type
  const weatherSystemType = "meteorological"; // Simplified since we removed dice tables

  // Helper function to store weather description in localStorage
  const storeWeatherDescription = useCallback((regionId, description) => {
    if (!regionId || !description) return;

    try {
      localStorage.setItem(`weather_description_${regionId}`, description);
    } catch (error) {
      console.error("Error storing weather description:", error);
    }
  }, []);

  // Helper function to get weather description from localStorage
  const getStoredWeatherDescription = useCallback((regionId) => {
    if (!regionId) return null;

    try {
      return localStorage.getItem(`weather_description_${regionId}`);
    } catch (error) {
      console.error("Error retrieving weather description:", error);
      return null;
    }
  }, []);

  // Handle weather initialization - with stable dependency handling
  const initializeWeather = useCallback(() => {
    // Don't run if no active region
    if (!activeRegion) return;

    // Get the region ID
    const regionId = activeRegion.id;
    const dateString = validCurrentDate.toISOString();

    setIsLoading(true);

    // Try to get existing weather
    const savedWeather = getRegionWeather(regionId);
    const lastUpdateTime = getRegionLastUpdateTime(regionId);
    // Try to get saved description
    const savedDescription = getStoredWeatherDescription(regionId);

    // Check for time sync needs
    if (savedWeather && lastUpdateTime) {
      const lastUpdateDate = new Date(lastUpdateTime);
      const timeDiffMs = validCurrentDate.getTime() - lastUpdateDate.getTime();

      if (Math.abs(timeDiffMs) > 60000) {
        const hoursDiff = Math.round(timeDiffMs / (1000 * 60 * 60));

        if (hoursDiff !== 0) {
          // For large time jumps, reinitialize
          if (Math.abs(hoursDiff) > 72) {
            const actualSeason = season === "auto" 
              ? weatherManager.getSeasonFromDate(validCurrentDate)
              : season;

            const regionClimate = activeRegion.climate ||
              activeRegion.profile?.climate ||
              activeRegion.profile?.biome ||
              "temperate-deciduous";

            const newForecast = weatherManager.initializeWeather(
              regionId,
              regionClimate,
              actualSeason,
              validCurrentDate
            );

            const newDescription = weatherDescriptionService.generateDescription(
              newForecast[0],
              regionClimate,
              validCurrentDate,
              regionId
            );

            setWeatherDescription(newDescription);
            storeWeatherDescription(regionId, newDescription);
            setForecast(newForecast);
            setCurrentSeason(actualSeason);
            
            updateRegionWeather(regionId, {
              season,
              currentSeason: actualSeason,
              forecast: newForecast.map((hour) => ({
                ...hour,
                date: hour.date.toISOString(),
              })),
            });
            
            updateRegionTimestamp(regionId, validCurrentDate.toISOString());
            setIsLoading(false);
            setInitialized(true);
            return;
          } else {
            // Normal advancement
            const actualSeason = season === "auto"
              ? weatherManager.getSeasonFromDate(validCurrentDate)
              : season;

            const regionClimate = activeRegion.climate ||
              activeRegion.profile?.climate ||
              activeRegion.profile?.biome ||
              "temperate-deciduous";

            let newForecast;

            if (hoursDiff > 0) {
              newForecast = weatherManager.advanceTime(
                regionId,
                Math.abs(hoursDiff),
                regionClimate,
                actualSeason,
                new Date(lastUpdateDate.getTime())
              );
            } else {
              newForecast = weatherManager.initializeWeather(
                regionId,
                regionClimate,
                actualSeason,
                validCurrentDate
              );
            }

            const newDescription = weatherDescriptionService.generateDescription(
              newForecast[0],
              regionClimate,
              validCurrentDate,
              regionId
            );

            setWeatherDescription(newDescription);
            storeWeatherDescription(regionId, newDescription);
            setForecast(newForecast);
            setCurrentSeason(actualSeason);
            
            updateRegionWeather(regionId, {
              season,
              currentSeason: actualSeason,
              forecast: newForecast.map((hour) => ({
                ...hour,
                date: hour.date.toISOString(),
              })),
            });
            
            updateRegionTimestamp(regionId, validCurrentDate.toISOString());
            setIsLoading(false);
            setInitialized(true);
            return;
          }
        }
      }
    }

    // Normal loading logic
    if (savedWeather && savedWeather.forecast) {
      setSeason(savedWeather.season);
      setCurrentSeason(savedWeather.currentSeason);

      // Load the forecast
      const loadedForecast = savedWeather.forecast.map((hour) => ({
        ...hour,
        date: new Date(hour.date),
      }));

      setForecast(loadedForecast);

      // If we have a saved description, use it, otherwise generate a new one
      if (savedDescription) {
        setWeatherDescription(savedDescription);
      } else {
        const newDescription = weatherDescriptionService.generateDescription(
          loadedForecast[0],
          activeRegion.climate ||
            activeRegion.profile?.biome ||
            "temperate-deciduous",
          validCurrentDate,
          regionId
        );
        setWeatherDescription(newDescription);
        storeWeatherDescription(regionId, newDescription);
      }

      updateRegionTimestamp(regionId, validCurrentDate.toISOString());
    } else {
      const actualSeason = season === "auto"
        ? weatherManager.getSeasonFromDate(validCurrentDate)
        : season;

      const regionClimate = activeRegion.climate ||
        activeRegion.profile?.climate ||
        activeRegion.profile?.biome ||
        "temperate-deciduous";

      setCurrentSeason(actualSeason);
      const newForecast = weatherManager.initializeWeather(
        regionId,
        regionClimate,
        actualSeason,
        validCurrentDate
      );

      const newDescription = weatherDescriptionService.generateDescription(
        newForecast[0],
        regionClimate,
        validCurrentDate,
        regionId
      );

      setWeatherDescription(newDescription);
      storeWeatherDescription(regionId, newDescription);

      setForecast(newForecast);
      updateRegionWeather(regionId, {
        season,
        currentSeason: actualSeason,
        forecast: newForecast.map((hour) => ({
          ...hour,
          date: hour.date.toISOString(),
        })),
      });
      
      updateRegionTimestamp(regionId, validCurrentDate.toISOString());
    }

    setIsLoading(false);
    setInitialized(true);
  }, [
    activeRegion,
    validCurrentDate,
    season,
    getRegionWeather,
    updateRegionWeather,
    updateRegionTimestamp,
    initialized,
    storeWeatherDescription,
    getStoredWeatherDescription,
    getRegionLastUpdateTime,
  ]);

  // Initialize weather effect - with stable dependencies
  useEffect(() => {
    initializeWeather();
  }, [initializeWeather]);

  // Updated handleAdvanceTime function:
  const handleAdvanceTime = useCallback((hours) => {
    if (!activeRegion) return;

    setIsUpdating(true);

    const beforeDate = new Date(validCurrentDate);

    // Advance time in the contexts
    advanceTime(hours);
    advanceGameTime(hours);

    // Calculate the new date after advancement
    const afterDate = new Date(beforeDate);
    afterDate.setHours(afterDate.getHours() + hours);

    const actualSeason = season === "auto"
      ? weatherManager.getSeasonFromDate(afterDate)
      : season;
      
    const regionClimate = activeRegion.climate ||
      activeRegion.profile?.climate ||
      activeRegion.profile?.biome ||
      "temperate-deciduous";

    let newForecast;

    if (hours > 168) {
      // Large time jumps - regenerate from scratch
      newForecast = weatherManager.initializeWeather(
        activeRegion.id,
        regionClimate,
        actualSeason,
        afterDate
      );
    } else {
      // Normal advancement - extend existing forecast
      newForecast = weatherManager.extendForecast(
        activeRegion.id,
        forecast,
        hours,
        regionClimate,
        actualSeason
      );
    }

    // Validate forecast
    if (!newForecast || newForecast.length !== 24) {
      newForecast = weatherManager.initializeWeather(
        activeRegion.id,
        regionClimate,
        actualSeason,
        afterDate
      );
    }

    // Generate new description
    const newDescription = weatherDescriptionService.generateDescription(
      newForecast[0],
      regionClimate,
      afterDate,
      activeRegion.id
    );

    // Update state
    setWeatherDescription(newDescription);
    storeWeatherDescription(activeRegion.id, newDescription);
    setForecast(newForecast);
    setCurrentSeason(actualSeason);

    // Update storage
    updateRegionWeather(activeRegion.id, {
      season,
      currentSeason: actualSeason,
      forecast: newForecast.map((hour) => ({
        ...hour,
        date: hour.date.toISOString(),
      })),
    });
    
    updateRegionTimestamp(activeRegion.id, afterDate.toISOString());

    setTimeout(() => {
      setIsUpdating(false);
      setForceUpdate((prev) => prev + 1);
    }, 300);
  }, [
    activeRegion,
    validCurrentDate,
    season,
    forecast,
    advanceTime,
    advanceGameTime,
    updateRegionWeather,
    updateRegionTimestamp,
    storeWeatherDescription,
  ]);

  // Regenerate weather
  const regenerateWeather = useCallback(() => {
    if (!activeRegion) return;

    setIsLoading(true);
    
    const actualSeason = season === "auto"
      ? weatherManager.getSeasonFromDate(validCurrentDate)
      : season;
      
    const regionClimate = activeRegion.climate ||
      activeRegion.profile?.climate ||
      activeRegion.profile?.biome ||
      "temperate-deciduous";

    setCurrentSeason(actualSeason);
    const newForecast = weatherManager.initializeWeather(
      activeRegion.id,
      regionClimate,
      actualSeason,
      validCurrentDate
    );

    const newDescription = weatherDescriptionService.generateDescription(
      newForecast[0],
      regionClimate,
      validCurrentDate,
      activeRegion.id
    );

    setWeatherDescription(newDescription);
    storeWeatherDescription(activeRegion.id, newDescription);
    weatherDescriptionService.clearCache(activeRegion.id);

    setForecast(newForecast);
    updateRegionWeather(activeRegion.id, {
      season,
      currentSeason: actualSeason,
      forecast: newForecast.map((hour) => ({
        ...hour,
        date: hour.date.toISOString(),
      })),
    });
    
    updateRegionTimestamp(activeRegion.id, validCurrentDate.toISOString());

    setIsLoading(false);
    setForceUpdate((prev) => prev + 1);
  }, [
    activeRegion,
    season,
    validCurrentDate,
    updateRegionWeather,
    updateRegionTimestamp,
    storeWeatherDescription,
  ]);

  // Celestial info calculation
  const celestialInfo = useMemo(() => {
    if (!activeRegion || !validCurrentDate) return {};

    const latitudeBand = activeRegion.latitudeBand ||
      activeRegion.profile?.latitudeBand ||
      "temperate";

    try {
      const sunriseData = sunriseSunsetService.getFormattedSunriseSunset(latitudeBand, validCurrentDate);
      const moonData = moonService.getMoonPhase(validCurrentDate);
      const moonTimes = moonService.getMoonTimes(validCurrentDate, latitudeBand);

      return {
        ...sunriseData,
        ...moonData,
        ...moonTimes,
      };
    } catch (error) {
      console.error("Error calculating celestial info:", error);
      return {};
    }
  }, [activeRegion, validCurrentDate, forceUpdate]);

  // Toggle forecast expansion
  const toggleForecast = useCallback(() => {
    setIsForecastExpanded(!isForecastExpanded);
  }, [isForecastExpanded]);

  // Change weather generation system (removed since we only have meteorological now)
  const changeWeatherSystem = useCallback(() => {
    // This function is kept for compatibility but does nothing
    console.log("Weather system is fixed to meteorological");
  }, []);

  // Show loading screen during initial load
  if (isLoading && !initialized) {
    return (
      <div className="weather-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading weather data...</p>
        </div>
      </div>
    );
  }

  // Don't render if no active region or current weather
  if (!activeRegion || !currentWeather) {
    return (
      <div className="weather-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>No active region selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="weather-dashboard">
      {/* Debug panels */}
      {preferences.debugMode && (
        <>
          <MeteorologicalDebugPanel
            weatherData={currentWeather}
            region={activeRegion}
            preferences={preferences}
          />
          <RegionDebug region={activeRegion} />
        </>
      )}

      {/* Loading overlay for time updates */}
      {isUpdating && (
        <div className="time-update-overlay">
          <div className="time-update-spinner"></div>
        </div>
      )}

      {/* Single World/Region selector - top right */}
      <div className="region-selector">
        <div className="region-selector-world">
          {worldSettings?.worldName || "Worldlandia"}
        </div>
        <div className="region-selector-region">
          {activeRegion.name}
          <span className="dropdown-arrow">▼</span>
        </div>
      </div>

      {/* Time display - large and centered at top */}
      <div className="time-display-container">
        <TimeDisplay currentDate={validCurrentDate} currentSeason={currentSeason} />
      </div>

      {/* Weather display */}
      <div className="celestial-section">
        {currentWeather && (
          <CurrentWeatherDisplay
            currentWeather={{
              ...currentWeather,
              regionName: activeRegion.name,
            }}
            celestialInfo={celestialInfo}
            isDaytime={celestialInfo.isDaytime}
            themeColors={themeColors}
          />
        )}
      </div>

      {/* Time Controls - below weather display */}
      <div className="time-control-panel">
        <TimeControls
          onAdvanceTime={handleAdvanceTime}
          currentDate={validCurrentDate}
        />
      </div>

      {/* Forecast Section - expandable */}
      <div className="forecast-section">
        <div className="forecast-header" onClick={toggleForecast}>
          <h3 className="forecast-title">
            {isForecastExpanded ? "24-Hour Forecast" : "6-Hour Forecast"}
          </h3>
          <span className="expand-icon">
            {isForecastExpanded ? "See Less" : "See More"}
          </span>
        </div>

        <ForecastDisplay
          forecast={isForecastExpanded ? forecast : forecast.slice(0, 6)}
          latitudeBand={
            activeRegion.latitudeBand ||
            (activeRegion.profile && activeRegion.profile.latitudeBand) ||
            "temperate"
          }
          celestialInfo={celestialInfo}
          isExpanded={isForecastExpanded}
        />
      </div>

      {/* Action Tabs - WITHOUT the forecast option since it's now a separate section */}
      <div className="tabs-container">
        <ActionTabs
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          excludeForecast={true} // New prop to exclude forecast tab
        />

        {/* Tab Content */}
        {activeSection === "effects" && (
          <div className="tab-content">
            <WeatherEffects
              weatherEffects={currentWeather?.effects || ""}
              currentWeather={currentWeather}
              currentDate={validCurrentDate}
              latitudeBand={
                activeRegion?.latitudeBand ||
                activeRegion.profile?.latitudeBand ||
                "temperate"
              }
              biome={
                activeRegion?.climate ||
                activeRegion.profile?.climate ||
                activeRegion.profile?.biome ||
                "temperate-deciduous"
              }
              regionId={activeRegion.id}
              cachedDescription={weatherDescription}
            />
          </div>
        )}

        {activeSection === "region" && (
          <div className="tab-content">
            <RegionDetails
              region={activeRegion}
              celestialInfo={celestialInfo}
              currentSeason={currentSeason}
              season={season}
              setSeason={setSeason}
              onRegenerateWeather={regenerateWeather}
              weatherSystemType={weatherSystemType}
              onChangeWeatherSystem={changeWeatherSystem}
              showDebug={showDebug}
              setShowDebug={setShowDebug}
              currentWeather={currentWeather}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherDashboard;