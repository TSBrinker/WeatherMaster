// src/components/WeatherDashboard.jsx - COMPLETELY FIXED VERSION
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
  renderCount.current++;

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

  // ============ FIXED: Add refs to prevent infinite loops ============
  const lastInitializedRef = useRef(null);
  const isInitializingRef = useRef(false);
  const updateWeatherRef = useRef(updateRegionWeather);
  const getWeatherRef = useRef(getRegionWeather);
  const getLastUpdateRef = useRef(getRegionLastUpdateTime);

  // Update refs when context functions change
  useEffect(() => {
    updateWeatherRef.current = updateRegionWeather;
    getWeatherRef.current = getRegionWeather;
    getLastUpdateRef.current = getRegionLastUpdateTime;
  }, [updateRegionWeather, getRegionWeather, getRegionLastUpdateTime]);

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
  const [forceUpdate, setForceUpdate] = useState(0);
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

  const validCurrentDate = useMemo(
    () => getValidDate(currentDate),
    [currentDate]
  );

  // Current weather memo (first item in forecast)
  const currentWeather = useMemo(() => forecast[0] || null, [forecast]);

  // Current weather system type
  const weatherSystemType = "meteorological";

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

  // ============ FIXED: Improved initializeWeather function with error handling ============
  const initializeWeather = useCallback(() => {
    // Don't run if no active region or already processing
    if (!activeRegion || isLoading || isInitializingRef.current) return;

    const regionId = activeRegion.id;
    const weatherCacheKey = `${regionId}-${validCurrentDate.getTime()}-${season}`;

    // Prevent duplicate initialization
    if (lastInitializedRef.current === weatherCacheKey) {
      return;
    }

    console.log("🔄 Starting weather initialization for:", regionId);
    setIsLoading(true);
    isInitializingRef.current = true;

    try {
      // Try to get existing weather using refs to avoid dependency issues
      const savedWeather = getWeatherRef.current(regionId);
      const lastUpdateTime = getLastUpdateRef.current(regionId);
      const savedDescription = getStoredWeatherDescription(regionId);

      console.log("📊 Saved weather:", savedWeather ? "Found" : "None");
      console.log("🕐 Last update:", lastUpdateTime || "None");

      // Check for time sync needs
      if (savedWeather && lastUpdateTime) {
        const lastUpdateDate = new Date(lastUpdateTime);
        const timeDiffMs =
          validCurrentDate.getTime() - lastUpdateDate.getTime();

        if (Math.abs(timeDiffMs) > 60000) {
          const hoursDiff = Math.round(timeDiffMs / (1000 * 60 * 60));

          if (hoursDiff !== 0) {
            // For large time jumps, reinitialize
            if (Math.abs(hoursDiff) > 72) {
              console.log(
                "🔄 Large time jump detected, reinitializing weather"
              );

              const actualSeason =
                season === "auto"
                  ? weatherManager.getSeasonFromDate(validCurrentDate)
                  : season;

              const regionClimate =
                activeRegion.climate ||
                activeRegion.profile?.climate ||
                activeRegion.profile?.biome ||
                "temperate-deciduous";

              console.log("🌍 Region climate:", regionClimate);
              console.log("🌱 Season:", actualSeason);

              setCurrentSeason(actualSeason);

              // ============ CRITICAL: Add error handling around weather initialization ============
              let newForecast;
              try {
                console.log("🔧 Calling weatherManager.initializeWeather...");
                newForecast = weatherManager.initializeWeather(
                  regionId,
                  regionClimate,
                  actualSeason,
                  validCurrentDate
                );
                console.log(
                  "✅ Weather initialization result:",
                  newForecast ? `${newForecast.length} hours` : "null/undefined"
                );
              } catch (error) {
                console.error("❌ Weather initialization failed:", error);
                // Create fallback weather
                newForecast = createFallbackWeather(
                  regionClimate,
                  validCurrentDate
                );
                console.log(
                  "🆘 Using fallback weather:",
                  newForecast.length,
                  "hours"
                );
              }

              // Validate forecast
              if (
                !newForecast ||
                !Array.isArray(newForecast) ||
                newForecast.length === 0
              ) {
                console.warn("⚠️ Invalid forecast, creating fallback");
                newForecast = createFallbackWeather(
                  regionClimate,
                  validCurrentDate
                );
              }

              const newDescription =
                weatherDescriptionService.generateDescription(
                  newForecast[0],
                  regionClimate,
                  validCurrentDate,
                  regionId
                );

              setWeatherDescription(newDescription);
              storeWeatherDescription(regionId, newDescription);
              setForecast(newForecast);

              // Use refs to avoid triggering re-renders
              updateWeatherRef.current(regionId, {
                season,
                currentSeason: actualSeason,
                forecast: newForecast.map((hour) => ({
                  ...hour,
                  date: hour.date.toISOString(),
                })),
              });

              updateRegionTimestamp(regionId, validCurrentDate.toISOString());
            } else {
              // Normal advancement logic...
              console.log("🔄 Normal time advancement");

              const actualSeason =
                season === "auto"
                  ? weatherManager.getSeasonFromDate(validCurrentDate)
                  : season;

              const regionClimate =
                activeRegion.climate ||
                activeRegion.profile?.climate ||
                activeRegion.profile?.biome ||
                "temperate-deciduous";

              let newForecast;

              if (hoursDiff > 0) {
                try {
                  newForecast = weatherManager.advanceTime(
                    regionId,
                    Math.abs(hoursDiff),
                    regionClimate,
                    actualSeason,
                    new Date(lastUpdateDate.getTime())
                  );
                } catch (error) {
                  console.error("❌ Weather advance failed:", error);
                  newForecast = createFallbackWeather(
                    regionClimate,
                    validCurrentDate
                  );
                }
              } else {
                try {
                  newForecast = weatherManager.initializeWeather(
                    regionId,
                    regionClimate,
                    actualSeason,
                    validCurrentDate
                  );
                } catch (error) {
                  console.error("❌ Weather initialization failed:", error);
                  newForecast = createFallbackWeather(
                    regionClimate,
                    validCurrentDate
                  );
                }
              }

              if (!newForecast || newForecast.length === 0) {
                newForecast = createFallbackWeather(
                  regionClimate,
                  validCurrentDate
                );
              }

              const newDescription =
                weatherDescriptionService.generateDescription(
                  newForecast[0],
                  regionClimate,
                  validCurrentDate,
                  regionId
                );

              setWeatherDescription(newDescription);
              storeWeatherDescription(regionId, newDescription);
              setForecast(newForecast);
              setCurrentSeason(actualSeason);

              updateWeatherRef.current(regionId, {
                season,
                currentSeason: actualSeason,
                forecast: newForecast.map((hour) => ({
                  ...hour,
                  date: hour.date.toISOString(),
                })),
              });

              updateRegionTimestamp(regionId, validCurrentDate.toISOString());
            }
          } else {
            // No time difference - use existing weather
            console.log("📋 Using existing weather data");
            const loadedForecast =
              savedWeather.forecast?.map((hour) => ({
                ...hour,
                date: new Date(hour.date),
              })) || [];

            if (loadedForecast.length === 0) {
              console.warn("⚠️ Existing weather has no forecast, creating new");
              const newForecast = createFallbackWeather(
                activeRegion.climate || "temperate-deciduous",
                validCurrentDate
              );
              setForecast(newForecast);
            } else {
              setForecast(loadedForecast);
            }

            setCurrentSeason(savedWeather.currentSeason || "spring");

            if (savedDescription) {
              setWeatherDescription(savedDescription);
            }
          }
        } else {
          // Use existing weather
          console.log("📋 Using cached weather (no time difference)");
          const loadedForecast =
            savedWeather.forecast?.map((hour) => ({
              ...hour,
              date: new Date(hour.date),
            })) || [];

          if (loadedForecast.length === 0) {
            console.warn("⚠️ Cached weather has no forecast, creating new");
            const newForecast = createFallbackWeather(
              activeRegion.climate || "temperate-deciduous",
              validCurrentDate
            );
            setForecast(newForecast);
          } else {
            setForecast(loadedForecast);
          }

          setCurrentSeason(savedWeather.currentSeason || "spring");

          if (savedDescription) {
            setWeatherDescription(savedDescription);
          }
        }
      } else {
        // No existing weather - initialize new
        console.log("🆕 No existing weather, creating fresh forecast");

        const actualSeason =
          season === "auto"
            ? weatherManager.getSeasonFromDate(validCurrentDate)
            : season;

        const regionClimate =
          activeRegion.climate ||
          activeRegion.profile?.climate ||
          activeRegion.profile?.biome ||
          "temperate-deciduous";

        console.log("🌍 Creating weather for climate:", regionClimate);
        console.log("🌱 Season:", actualSeason);

        setCurrentSeason(actualSeason);

        let newForecast;
        try {
          console.log("🔧 Calling weatherManager.initializeWeather (new)...");
          newForecast = weatherManager.initializeWeather(
            regionId,
            regionClimate,
            actualSeason,
            validCurrentDate
          );
          console.log(
            "✅ New weather result:",
            newForecast ? `${newForecast.length} hours` : "null/undefined"
          );
        } catch (error) {
          console.error("❌ New weather initialization failed:", error);
          newForecast = createFallbackWeather(regionClimate, validCurrentDate);
          console.log("🆘 Using fallback weather for new region");
        }

        // Validate forecast
        if (
          !newForecast ||
          !Array.isArray(newForecast) ||
          newForecast.length === 0
        ) {
          console.warn("⚠️ Invalid new forecast, creating fallback");
          newForecast = createFallbackWeather(regionClimate, validCurrentDate);
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

        updateWeatherRef.current(regionId, {
          season,
          currentSeason: actualSeason,
          forecast: newForecast.map((hour) => ({
            ...hour,
            date: hour.date.toISOString(),
          })),
        });

        updateRegionTimestamp(regionId, validCurrentDate.toISOString());
      }

      lastInitializedRef.current = weatherCacheKey;
      console.log("✅ Weather initialization completed successfully");
    } catch (error) {
      console.error("💥 Critical error in weather initialization:", error);
      // Last resort fallback
      const fallbackForecast = createFallbackWeather(
        "temperate-deciduous",
        validCurrentDate
      );
      setForecast(fallbackForecast);
      setCurrentSeason("spring");
      setWeatherDescription("Clear skies with moderate temperatures.");
    } finally {
      setIsLoading(false);
      isInitializingRef.current = false;
      setInitialized(true);
      console.log("🏁 Weather initialization process finished");
    }
  }, [
    activeRegion?.id,
    validCurrentDate.getTime(),
    season,
    updateRegionTimestamp,
    storeWeatherDescription,
    getStoredWeatherDescription,
  ]);

  // ============ FALLBACK WEATHER CREATION FUNCTION ============
  const createFallbackWeather = useCallback((climate, date) => {
    console.log("🆘 Creating fallback weather for climate:", climate);

    const baseTemp = climate.includes("tropical")
      ? 85
      : climate.includes("desert")
      ? 95
      : climate.includes("tundra")
      ? 20
      : climate.includes("polar")
      ? 10
      : 65;

    const fallbackForecast = [];

    for (let i = 0; i < 24; i++) {
      const hour = new Date(date);
      hour.setHours(hour.getHours() + i);

      // Simple temperature variation
      const tempVariation = Math.sin((i * Math.PI) / 12) * 10; // Day/night cycle
      const temperature = baseTemp + tempVariation + (Math.random() - 0.5) * 5;

      fallbackForecast.push({
        date: hour,
        temperature: Math.round(temperature),
        condition: "Clear",
        windSpeed: Math.round(5 + Math.random() * 10),
        windDirection: "SW",
        windIntensity: "Light",
        humidity: 50 + Math.round(Math.random() * 30),
        pressure: 1013 + Math.round((Math.random() - 0.5) * 20),
        cloudCover: Math.round(Math.random() * 40),
        precipAmount: 0,
        precipType: "None",
        effects: "Normal weather conditions.",
        _meteoData: {
          humidity: 50,
          pressure: 1013,
          cloudCover: 20,
          precipAmount: 0,
          weatherSystems: [],
        },
      });
    }

    console.log(
      "🆘 Fallback weather created:",
      fallbackForecast.length,
      "hours"
    );
    return fallbackForecast;
  }, []);

  // ============ FIXED: Initialize weather effect ============
  useEffect(() => {
    if (!activeRegion || isInitializingRef.current) return;

    const shouldInitialize =
      !lastInitializedRef.current ||
      !lastInitializedRef.current.includes(activeRegion.id);

    if (shouldInitialize) {
      initializeWeather();
    }
  }, [activeRegion?.id, validCurrentDate.getTime(), season]);

  // Updated handleAdvanceTime function
  const handleAdvanceTime = useCallback(
    (hours) => {
      if (!activeRegion) return;

      setIsUpdating(true);

      const beforeDate = new Date(validCurrentDate);

      // Advance time in the contexts
      advanceTime(hours);
      advanceGameTime(hours);

      // Calculate the new date after advancement
      const afterDate = new Date(beforeDate);
      afterDate.setHours(afterDate.getHours() + hours);

      const actualSeason =
        season === "auto"
          ? weatherManager.getSeasonFromDate(afterDate)
          : season;

      const regionClimate =
        activeRegion.climate ||
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
    },
    [
      activeRegion?.id,
      validCurrentDate.getTime(),
      season,
      forecast,
      advanceTime,
      advanceGameTime,
      updateRegionWeather,
      updateRegionTimestamp,
      storeWeatherDescription,
    ]
  );

  // Regenerate weather
  const regenerateWeather = useCallback(() => {
    if (!activeRegion) return;

    setIsLoading(true);

    const actualSeason =
      season === "auto"
        ? weatherManager.getSeasonFromDate(validCurrentDate)
        : season;

    const regionClimate =
      activeRegion.climate ||
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
    activeRegion?.id,
    season,
    validCurrentDate.getTime(),
    updateRegionWeather,
    updateRegionTimestamp,
    storeWeatherDescription,
  ]);

  // Celestial info calculation
  const celestialInfo = useMemo(() => {
    if (!activeRegion || !validCurrentDate) return {};

    const latitudeBand =
      activeRegion.latitudeBand ||
      activeRegion.profile?.latitudeBand ||
      "temperate";

    try {
      const sunriseData = sunriseSunsetService.getFormattedSunriseSunset(
        latitudeBand,
        validCurrentDate
      );
      const moonData = moonService.getMoonPhase(validCurrentDate);
      const moonTimes = moonService.getMoonTimes(
        validCurrentDate,
        latitudeBand
      );

      return {
        ...sunriseData,
        ...moonData,
        ...moonTimes,
      };
    } catch (error) {
      console.error("Error calculating celestial info:", error);
      return {};
    }
  }, [activeRegion?.id, validCurrentDate.getTime(), forceUpdate]);

  // Toggle forecast expansion
  const toggleForecast = useCallback(() => {
    setIsForecastExpanded(!isForecastExpanded);
  }, [isForecastExpanded]);

  // Change weather generation system (removed since we only have meteorological now)
  const changeWeatherSystem = useCallback(() => {
    // This function is kept for compatibility but does nothing
    console.log("Weather system is fixed to meteorological");
  }, []);

  // ============ DEBUG REGION STATUS ============
  console.log("=== REGION DEBUG ===");
  console.log("Regions:", activeRegion ? "Region found" : "No region");
  console.log(
    "Current Weather:",
    currentWeather ? "Weather found" : "No weather"
  );
  console.log("Forecast Length:", forecast?.length || 0);
  console.log("Initialized:", initialized);
  console.log("Is Loading:", isLoading);

  // ============ IMMEDIATE WEATHER FIX ============
  // If we have a region but no forecast, create weather RIGHT NOW
  if (
    activeRegion &&
    (!forecast || forecast.length === 0) &&
    !isInitializingRef.current
  ) {
    console.log(
      "🔧 IMMEDIATE FIX: Creating weather now for",
      activeRegion.name
    );

    // ============ TRY REAL WEATHER FIRST ============
    console.log("🎲 Attempting REAL weather generation...");
    try {
      const actualSeason =
        season === "auto"
          ? weatherManager.getSeasonFromDate(validCurrentDate)
          : season;

      const regionClimate =
        activeRegion.climate ||
        activeRegion.profile?.climate ||
        activeRegion.profile?.biome ||
        "temperate-deciduous";

      console.log("🌍 Climate:", regionClimate);
      console.log("🌱 Season:", actualSeason);
      console.log("📅 Date:", validCurrentDate);

      const realWeather = weatherManager.initializeWeather(
        activeRegion.id,
        regionClimate,
        actualSeason,
        validCurrentDate
      );

      console.log(
        "🌤️ Real weather result:",
        realWeather ? `${realWeather.length} hours` : "null/failed"
      );

      if (realWeather && Array.isArray(realWeather) && realWeather.length > 0) {
        console.log("✅ REAL WEATHER SUCCESS! Using dynamic weather");
        console.log("🌡️ First hour temp:", realWeather[0].temperature);
        console.log("☁️ First hour condition:", realWeather[0].condition);

        setTimeout(() => {
          setForecast(realWeather);
          setCurrentSeason(actualSeason);
          setWeatherDescription(`Dynamic weather in ${activeRegion.name}.`);
          setInitialized(true);
          setIsLoading(false);
        }, 0);

        return; // Exit early - we got real weather!
      } else {
        console.log(
          "❌ Real weather failed, falling back to emergency weather"
        );
      }
    } catch (error) {
      console.error("💥 Real weather generation error:", error);
      console.log("🆘 Falling back to emergency weather");
    }

    // ============ FALLBACK TO EMERGENCY WEATHER ============
    console.log("🚨 Creating emergency fallback weather");

    // Create weather immediately in the render cycle
    const immediateForecast = [];
    const now = new Date();

    for (let i = 0; i < 24; i++) {
      const hour = new Date(now);
      hour.setHours(hour.getHours() + i);

      const baseTemp = 70;
      const tempVariation = Math.sin((i * Math.PI) / 12) * 15;
      const temperature = Math.round(
        baseTemp + tempVariation + (Math.random() - 0.5) * 8
      );

      immediateForecast.push({
        date: hour,
        temperature: temperature,
        condition: "Clear",
        windSpeed: Math.round(5 + Math.random() * 10),
        windDirection: "SW",
        windIntensity: "Light",
        humidity: 60,
        pressure: 1013,
        cloudCover: 20,
        precipAmount: 0,
        precipType: "None",
        effects: "Normal weather conditions.",
        _meteoData: {
          humidity: 60,
          pressure: 1013,
          cloudCover: 20,
          precipAmount: 0,
          weatherSystems: [],
        },
      });
    }

    console.log("✅ EMERGENCY weather created, forcing update");

    // Force the state updates immediately
    setTimeout(() => {
      setForecast(immediateForecast);
      setCurrentSeason("spring");
      setWeatherDescription(
        `Emergency weather in ${activeRegion.name} (fallback mode).`
      );
      setInitialized(true);
      setIsLoading(false);
    }, 0);
  }

  // ============ ENHANCED LOADING/NO-REGION HANDLING ============

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

  // Enhanced no-region handling with auto-fix options
  if (!activeRegion) {
    const { regions, hasRegions, createRegion, setActiveRegion } = useRegion();

    console.log("No active region. Regions available:", regions?.length || 0);

    return (
      <div className="weather-dashboard loading">
        <div className="loading-spinner">
          <div style={{ textAlign: "center", padding: "2rem", color: "white" }}>
            <h2 style={{ marginBottom: "1rem" }}>No Active Region</h2>
            <p style={{ marginBottom: "1rem" }}>
              Regions found: {regions?.length || 0}
            </p>

            {hasRegions ? (
              <div>
                <p style={{ marginBottom: "1rem" }}>
                  Regions exist but none is active. Select one:
                </p>
                {regions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => {
                      console.log("Selecting region:", region.name);
                      setActiveRegion(region.id);
                    }}
                    style={{
                      display: "block",
                      margin: "0.5rem auto",
                      padding: "0.5rem 1rem",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "0.25rem",
                      cursor: "pointer",
                    }}
                  >
                    Select: {region.name}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <p style={{ marginBottom: "1rem" }}>
                  No regions found. Create a default one:
                </p>
                <button
                  onClick={() => {
                    console.log("Creating default region");
                    const defaultRegion = {
                      name: "Default Region",
                      climate: "temperate-deciduous",
                      latitudeBand: "temperate",
                      templateId: "temperate-deciduous-forest",
                    };
                    createRegion(defaultRegion);
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "0.25rem",
                    cursor: "pointer",
                  }}
                >
                  Create Default Region
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show loading if no current weather but we have a region
  if (!currentWeather && activeRegion) {
    return (
      <div className="weather-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Generating weather for {activeRegion.name}...</p>
          <p style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: "0.5rem" }}>
            Forecast items: {forecast?.length || 0}
          </p>
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
        <TimeDisplay
          currentDate={validCurrentDate}
          currentSeason={currentSeason}
        />
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
