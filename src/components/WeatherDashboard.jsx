// src/components/WeatherDashboard.jsx - Fully Updated
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

  // Add this debug tracking code
  useEffect(() => {
    if (activeRegion) {
      console.log(
        `[WEATHER TYPE] Region ${activeRegion.id}: "${
          activeRegion.weatherType || "diceTable"
        }" ` +
          `(from localStorage: "${
            getRegionWeather(activeRegion.id)?.weatherType || "N/A"
          }")`
      );
    }
  }, [activeRegion, getRegionWeather]);

  // Refs for tracking previous values
  const prevRegionIdRef = useRef(null);
  const prevDateRef = useRef(null);
  const lastThemeUpdateRef = useRef(null);

  // Logging render count (development only)
  useEffect(() => {
    renderCount.current += 1;
    // console.log(`WeatherDashboard render #${renderCount.current}`);
  });

  // Get current celestial data - MEMOIZED to prevent recalculations
  const getCelestialInfo = useCallback(() => {
    if (!activeRegion) {
      console.log(
        "[WeatherDashboard] No active region, returning default celestial info"
      );
      return {
        sunrise: null,
        sunset: null,
        isDaytime: false,
        sunriseTime: "N/A",
        sunsetTime: "N/A",
        moonrise: null,
        moonset: null,
        moonriseTime: "N/A",
        moonsetTime: "N/A",
        dayLengthFormatted: "N/A",
      };
    }

    try {
      // Get the proper latitude band with fallback logic
      const latitudeBand =
        activeRegion.latitudeBand ||
        (activeRegion.profile && activeRegion.profile.latitudeBand) ||
        "temperate";

      console.log(
        `[WeatherDashboard] Calculating celestial info for ${activeRegion.name}`,
        {
          latitudeBand,
          date: currentDate.toISOString(),
          isDaylight:
            latitudeBand === "polar"
              ? "possible 24hr daylight in summer"
              : "normal daylight cycle",
        }
      );

      // Get sun data with debug info
      const sunData = sunriseSunsetService.getFormattedSunriseSunset(
        latitudeBand,
        currentDate
      );

      console.log("[WeatherDashboard] Sunrise/sunset result:", {
        sunriseTime: sunData.sunriseTime,
        sunsetTime: sunData.sunsetTime,
        dayLength: sunData.dayLengthFormatted,
      });

      // Get moon data - now uses the cached implementation
      const { moonrise, moonset } = moonService.getMoonTimes(
        currentDate,
        latitudeBand
      );

      // Format time strings consistently with hours:minutes
      const formatTimeString = (date) => {
        if (!(date instanceof Date) || isNaN(date.getTime())) return "N/A";

        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        const hour12 = hours % 12 || 12;

        // Ensure minutes are zero-padded
        const minutesStr = minutes < 10 ? `0${minutes}` : minutes;

        return `${hour12}:${minutesStr} ${ampm}`;
      };

      // Create a unified object with all the celestial info
      return {
        ...sunData,
        moonrise,
        moonset,
        // Ensure all time strings are directly created here
        moonriseTime: formatTimeString(moonrise),
        moonsetTime: formatTimeString(moonset),
      };
    } catch (error) {
      console.error("Error calculating celestial info:", error);
      return {
        sunrise: null,
        sunset: null,
        isDaytime: false,
        sunriseTime: "Error",
        sunsetTime: "Error",
        moonrise: null,
        moonset: null,
        moonriseTime: "Error",
        moonsetTime: "Error",
        dayLengthFormatted: "Error",
      };
    }
  }, [activeRegion, currentDate]);

  // Memoize celestial info to prevent recalculation on every render
  const celestialInfo = useMemo(() => getCelestialInfo(), [getCelestialInfo]);

  // Log celestial info changes
  useEffect(() => {
    if (celestialInfo && activeRegion) {
      console.log(
        `[WeatherDashboard] Celestial info updated for ${activeRegion.name}:`,
        {
          dayLength: celestialInfo.dayLengthFormatted,
          latitudeBand:
            activeRegion.latitudeBand ||
            activeRegion.profile?.latitudeBand ||
            "unknown",
          date: currentDate.toISOString().split("T")[0],
        }
      );
    }
  }, [celestialInfo, activeRegion, currentDate]);

  // Update theme colors - with stable dependency check and throttling
  useEffect(() => {
    // Skip if theme was updated recently (throttle updates)
    const now = Date.now();
    if (lastThemeUpdateRef.current && now - lastThemeUpdateRef.current < 500) {
      return;
    }

    // Skip if no forecast or active region
    if (!forecast.length || !activeRegion) return;

    const currentWeather = forecast[0];
    try {
      // Save which weather + date we're calculating themes for
      const weatherCondition = currentWeather.condition;
      const weatherTime = currentWeather.date
        ? new Date(currentWeather.date)
        : currentDate;

      // Get sunrise/sunset times
      const { sunrise, sunset } = celestialInfo;

      // Skip if no sunrise/sunset (calculation failed)
      if (!sunrise || !sunset) return;

      // Calculate background gradient and colors
      const backgroundGradient = getPreciseSkyGradient(
        weatherTime,
        weatherCondition,
        sunrise,
        sunset
      );

      const skyColors = skyColorService.calculateSkyColor(
        weatherTime,
        weatherCondition,
        activeRegion.latitudeBand ||
          activeRegion.profile?.latitudeBand ||
          "temperate"
      );

      // Update theme colors
      setThemeColors({
        backgroundColor: skyColors.backgroundColor,
        textColor: "#ffffff",
        backgroundImage: backgroundGradient,
      });

      // Update last theme time
      lastThemeUpdateRef.current = now;
    } catch (error) {
      console.error("Error calculating sky colors:", error);
    }
  }, [
    forecast.length > 0 ? forecast[0].condition : null,
    forecast.length > 0
      ? forecast[0].date
        ? forecast[0].date.getTime()
        : null
      : null,
    activeRegion?.id,
    celestialInfo.sunrise,
    celestialInfo.sunset,
    currentDate,
  ]);

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

    console.log(`[WeatherDashboard] Initializing weather:`, {
      region: regionId,
      name: activeRegion.name,
      date: dateString,
      latitudeBand:
        activeRegion.latitudeBand ||
        activeRegion.profile?.latitudeBand ||
        "temperate",
    });

    setIsLoading(true);

    // Try to get existing weather
    const savedWeather = getRegionWeather(regionId);
    const lastUpdateTime = getRegionLastUpdateTime(regionId);
    // Try to get saved description
    const savedDescription = getStoredWeatherDescription(regionId);

    // Check for time sync needs
    if (savedWeather && lastUpdateTime) {
      const lastUpdateDate = new Date(lastUpdateTime);
      const currentWorldDate = new Date(currentDate);
      const timeDiffMs = currentWorldDate.getTime() - lastUpdateDate.getTime();

      if (Math.abs(timeDiffMs) > 60000) {
        // console.log(`Time sync needed for region ${regionId}`);
        const hoursDiff = Math.round(timeDiffMs / (1000 * 60 * 60));

        if (hoursDiff !== 0) {
          // console.log(`Syncing region time by ${hoursDiff} hours`);

          // For large time jumps, reinitialize
          if (Math.abs(hoursDiff) > 72) {
            // console.log(`Large time gap, reinitializing weather`);
            const actualSeason =
              season === "auto"
                ? weatherManager.getSeasonFromDate(currentWorldDate)
                : season;

            // Use the weatherType from region settings (default to 'diceTable')
            const weatherType =
              activeRegion.weatherType ||
              preferences.weatherSystem ||
              "diceTable";

            console.log(
              `[WeatherDashboard] Regenerating weather with system: ${weatherType} (preference: ${preferences.weatherSystem}, region: ${activeRegion.weatherType})`
            );

            // Get the proper climate and latitude band values
            const regionClimate =
              activeRegion.climate ||
              (activeRegion.profile && activeRegion.profile.climate) ||
              activeRegion.profile?.biome ||
              "temperate-deciduous";

            const regionLatitudeBand =
              activeRegion.latitudeBand ||
              (activeRegion.profile && activeRegion.profile.latitudeBand) ||
              "temperate";

            console.log(
              `[WeatherDashboard] Using climate: ${regionClimate}, latitudeBand: ${regionLatitudeBand}`
            );

            const newForecast = weatherManager.initializeWeather(
              regionId,
              regionClimate,
              actualSeason,
              currentWorldDate,
              weatherType
            );

            // Generate new description for the current weather
            const newDescription =
              weatherDescriptionService.generateDescription(
                newForecast[0],
                regionClimate,
                currentWorldDate,
                regionId
              );

            setWeatherDescription(newDescription);
            storeWeatherDescription(regionId, newDescription);

            setForecast(newForecast);
            setCurrentSeason(actualSeason);
            updateRegionWeather(regionId, {
              season,
              currentSeason: actualSeason,
              weatherType, // Store the weather type with the region
              forecast: newForecast.map((hour) => ({
                ...hour,
                date: hour.date.toISOString(),
              })),
            });
          } else {
            // Normal advancement
            const actualSeason =
              season === "auto"
                ? weatherManager.getSeasonFromDate(currentWorldDate)
                : season;

            const absHoursDiff = Math.abs(hoursDiff);
            const weatherType =
              activeRegion.weatherType ||
              preferences.weatherSystem ||
              "diceTable";
            let newForecast;

            if (hoursDiff > 0) {
              // Determine climate and latitudeBand for weather advancement
              const regionClimate =
                activeRegion.climate ||
                (activeRegion.profile && activeRegion.profile.climate) ||
                activeRegion.profile?.biome ||
                "temperate-deciduous";

              console.log(
                `[WeatherDashboard] Advancing time with climate: ${regionClimate}`
              );

              newForecast = weatherManager.advanceTime(
                regionId,
                absHoursDiff,
                regionClimate,
                actualSeason,
                new Date(lastUpdateDate.getTime())
              );
            } else {
              // Determine climate and latitudeBand for weather reinitialization
              const regionClimate =
                activeRegion.climate ||
                (activeRegion.profile && activeRegion.profile.climate) ||
                activeRegion.profile?.biome ||
                "temperate-deciduous";

              console.log(
                `[WeatherDashboard] Reinitializing with climate: ${regionClimate}`
              );

              newForecast = weatherManager.initializeWeather(
                regionId,
                regionClimate,
                actualSeason,
                currentWorldDate,
                weatherType
              );
            }

            // Generate new description for the current weather
            const newDescription =
              weatherDescriptionService.generateDescription(
                newForecast[0],
                activeRegion.climate ||
                  activeRegion.profile?.biome ||
                  "temperate-deciduous",
                currentWorldDate,
                regionId
              );

            setWeatherDescription(newDescription);
            storeWeatherDescription(regionId, newDescription);

            setForecast(newForecast);
            setCurrentSeason(actualSeason);
            updateRegionWeather(regionId, {
              season,
              currentSeason: actualSeason,
              weatherType,
              forecast: newForecast.map((hour) => ({
                ...hour,
                date: hour.date.toISOString(),
              })),
            });
          }

          updateRegionTimestamp(regionId, currentWorldDate.toISOString());
          setIsLoading(false);
          setInitialized(true);
          return;
        }
      }
    }

    // Normal loading logic
    if (savedWeather && savedWeather.forecast) {
      // console.log("Loading saved weather");
      setSeason(savedWeather.season);
      setCurrentSeason(savedWeather.currentSeason);

      // If region has a stored weather type, use it
      const weatherType = savedWeather.weatherType || "diceTable";

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
          currentDate,
          regionId
        );
        setWeatherDescription(newDescription);
        storeWeatherDescription(regionId, newDescription);
      }

      updateRegionTimestamp(regionId, currentDate.toISOString());
    } else {
      console.log("[WeatherDashboard] Generating new weather");
      const actualSeason =
        season === "auto"
          ? weatherManager.getSeasonFromDate(currentDate)
          : season;

      // Default to dice table if not specified
      const weatherType =
        activeRegion.weatherType || preferences.weatherSystem || "diceTable";

      // Determine climate and latitudeBand for weather initialization
      const regionClimate =
        activeRegion.climate ||
        (activeRegion.profile && activeRegion.profile.climate) ||
        activeRegion.profile?.biome ||
        "temperate-deciduous";

      const regionLatitudeBand =
        activeRegion.latitudeBand ||
        (activeRegion.profile && activeRegion.profile.latitudeBand) ||
        "temperate";

      console.log(
        `[WeatherDashboard] New weather with climate: ${regionClimate}, latitudeBand: ${regionLatitudeBand}`
      );

      setCurrentSeason(actualSeason);
      const newForecast = weatherManager.initializeWeather(
        regionId,
        regionClimate,
        actualSeason,
        currentDate,
        weatherType
      );

      // Generate a new description for the current weather
      const newDescription = weatherDescriptionService.generateDescription(
        newForecast[0],
        regionClimate,
        currentDate,
        regionId
      );

      setWeatherDescription(newDescription);
      storeWeatherDescription(regionId, newDescription);

      setForecast(newForecast);
      updateRegionWeather(regionId, {
        season,
        currentSeason: actualSeason,
        weatherType,
        forecast: newForecast.map((hour) => ({
          ...hour,
          date: hour.date.toISOString(),
        })),
      });
      updateRegionTimestamp(regionId, currentDate.toISOString());
    }

    setIsLoading(false);
    setInitialized(true);
  }, [
    activeRegion,
    currentDate,
    season,
    getRegionWeather,
    updateRegionWeather,
    updateRegionTimestamp,
    initialized,
    storeWeatherDescription,
    getStoredWeatherDescription,
    preferences,
  ]);

  // Initialize weather effect - with stable dependencies
  useEffect(() => {
    initializeWeather();
  }, [initializeWeather]);

  // Handle time advancement
  const handleAdvanceTime = useCallback(
    (hours) => {
      if (!activeRegion) return;

      // Show loading indicator without full-page refresh
      setIsUpdating(true); // Add a new state variable for this

      console.log(`[WeatherDashboard] Advancing time by ${hours} hours`);

      // Get the current date before advancement
      const beforeDate = new Date(currentDate);

      // Advance time in the contexts
      advanceTime(hours);
      advanceGameTime(hours);

      // Calculate the new date
      const afterDate = new Date(beforeDate);
      afterDate.setHours(afterDate.getHours() + hours);

      const actualSeason =
        season === "auto"
          ? weatherManager.getSeasonFromDate(afterDate)
          : season;

      // Get weather type (default to dice table if not specified)
      const weatherType =
        activeRegion.weatherType || preferences.weatherSystem || "diceTable";

      // Determine climate for weather advancement
      const regionClimate =
        activeRegion.climate ||
        (activeRegion.profile && activeRegion.profile.climate) ||
        activeRegion.profile?.biome ||
        "temperate-deciduous";

      // Handle weather advancement without full page reload
      const newForecast = weatherManager.advanceTime(
        activeRegion.id,
        hours,
        regionClimate,
        actualSeason,
        afterDate
      );

      // Generate a new description for the current weather
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

      // Update stored data
      updateRegionWeather(activeRegion.id, {
        season,
        currentSeason: actualSeason,
        weatherType,
        forecast: newForecast.map((hour) => ({
          ...hour,
          date: hour.date.toISOString(),
        })),
      });
      updateRegionTimestamp(activeRegion.id, afterDate.toISOString());

      // Hide loading indicator after a short delay (for UI feedback)
      setTimeout(() => {
        setIsUpdating(false);
        // Force update to ensure celestial calculations are refreshed
        setForceUpdate((prev) => prev + 1);
      }, 300);
    },
    [
      activeRegion,
      currentDate,
      season,
      advanceTime,
      advanceGameTime,
      updateRegionWeather,
      updateRegionTimestamp,
      storeWeatherDescription,
      preferences,
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

    // Get weather type from region settings or preferences
    const weatherType =
      activeRegion.weatherType || preferences.weatherSystem || "diceTable";

    console.log(
      `[WeatherDashboard] Regenerating weather with type: ${weatherType}`
    );

    // Determine climate and latitudeBand for weather regeneration
    const regionClimate =
      activeRegion.climate ||
      (activeRegion.profile && activeRegion.profile.climate) ||
      activeRegion.profile?.biome ||
      "temperate-deciduous";

    const regionLatitudeBand =
      activeRegion.latitudeBand ||
      (activeRegion.profile && activeRegion.profile.latitudeBand) ||
      "temperate";

    console.log(
      `[WeatherDashboard] Regenerating with climate: ${regionClimate}, latitudeBand: ${regionLatitudeBand}`
    );

    setCurrentSeason(actualSeason);
    const newForecast = weatherManager.initializeWeather(
      activeRegion.id,
      regionClimate,
      actualSeason,
      currentDate,
      weatherType
    );

    // Generate a new description for the current weather
    const newDescription = weatherDescriptionService.generateDescription(
      newForecast[0],
      regionClimate,
      currentDate,
      activeRegion.id
    );

    setWeatherDescription(newDescription);
    storeWeatherDescription(activeRegion.id, newDescription);

    // Clear weather description cache when regenerating
    weatherDescriptionService.clearCache(activeRegion.id);

    setForecast(newForecast);
    updateRegionWeather(activeRegion.id, {
      season,
      currentSeason: actualSeason,
      weatherType,
      forecast: newForecast.map((hour) => ({
        ...hour,
        date: hour.date.toISOString(),
      })),
    });
    updateRegionTimestamp(activeRegion.id, currentDate.toISOString());

    setIsLoading(false);
    setForceUpdate((prev) => prev + 1);
  }, [
    activeRegion,
    season,
    currentDate,
    preferences,
    updateRegionWeather,
    updateRegionTimestamp,
    storeWeatherDescription,
  ]);

  // Change weather generation system
  const changeWeatherSystem = useCallback(
    (newType) => {
      if (!activeRegion || !activeRegion.id) return;

      setIsLoading(true);
      // console.log(`Changing weather system to: ${newType}`);

      // Update region with new weather type
      const updatedRegion = {
        ...activeRegion,
        weatherType: newType,
      };

      // Need to access the updateRegion function from context
      // Assuming it's available in RegionContext and accessible here

      // Generate new weather with the new system
      const actualSeason =
        season === "auto"
          ? weatherManager.getSeasonFromDate(currentDate)
          : season;

      // Determine climate and latitudeBand for weather system change
      const regionClimate =
        activeRegion.climate ||
        (activeRegion.profile && activeRegion.profile.climate) ||
        activeRegion.profile?.biome ||
        "temperate-deciduous";

      const regionLatitudeBand =
        activeRegion.latitudeBand ||
        (activeRegion.profile && activeRegion.profile.latitudeBand) ||
        "temperate";

      console.log(
        `[WeatherDashboard] Changing weather system with climate: ${regionClimate}, latitudeBand: ${regionLatitudeBand}`
      );

      // Initialize weather with new type
      const newForecast = weatherManager.initializeWeather(
        activeRegion.id,
        regionClimate,
        actualSeason,
        currentDate,
        newType
      );

      // Generate a new description for the current weather
      const newDescription = weatherDescriptionService.generateDescription(
        newForecast[0],
        regionClimate,
        currentDate,
        activeRegion.id
      );

      setWeatherDescription(newDescription);
      storeWeatherDescription(activeRegion.id, newDescription);

      // Clear the cache for this region when changing systems
      weatherDescriptionService.clearCache(activeRegion.id);

      setForecast(newForecast);
      setCurrentSeason(actualSeason);
      updateRegionWeather(activeRegion.id, {
        season,
        currentSeason: actualSeason,
        weatherType: newType,
        forecast: newForecast.map((hour) => ({
          ...hour,
          date: hour.date.toISOString(),
        })),
      });
      updateRegionTimestamp(activeRegion.id, currentDate.toISOString());

      setIsLoading(false);
    },
    [
      activeRegion,
      season,
      currentDate,
      updateRegionWeather,
      updateRegionTimestamp,
      storeWeatherDescription,
    ]
  );

  // Toggle forecast expansion
  const toggleForecast = () => {
    setIsForecastExpanded(!isForecastExpanded);
  };

  // Empty state - no region selected
  if (!activeRegion) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🗺️</div>
        <h2 className="empty-state-title">No Region Selected</h2>
        <p className="empty-state-desc">
          To get started, you need to create or select a region.
        </p>
        <div className="mt-4 flex flex-col items-center">
          <button
            onClick={() => {
              const headerButton = document.querySelector(
                'button[title="Regions & Worlds"]'
              );
              if (headerButton) headerButton.click();
            }}
            className="mt-4 btn btn-primary"
          >
            Open Regions Menu
          </button>
        </div>
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

  // Create a dynamic style for the weather display
  const dynamicWeatherStyle = {
    backgroundImage: themeColors.backgroundImage,
    color: themeColors.textColor,
    transition: "background-color 2s, background-image 2s, color 2s",
  };

  // Current weather from forecast
  const currentWeather = forecast.length > 0 ? forecast[0] : null;

  // Current weather system type
  const weatherSystemType =
    activeRegion.weatherType || preferences.weatherSystem || "diceTable";

  return (
    <div className="weather-dashboard">
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
        <TimeDisplay currentDate={currentDate} currentSeason={currentSeason} />
      </div>

      {/* Weather display */}
      <div className="celestial-section" style={dynamicWeatherStyle}>
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
          currentDate={currentDate}
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
              currentDate={currentDate}
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
