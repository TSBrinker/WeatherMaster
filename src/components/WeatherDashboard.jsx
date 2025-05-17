// src/components/WeatherDashboard.jsx
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

// Import CSS
import "../weatherDashboard.css";

const WeatherDashboard = () => {
  // Debug render counter
  const renderCount = useRef(0);

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
  const [activeSection, setActiveSection] = useState(null);
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

  // Refs for tracking previous values
  const prevRegionIdRef = useRef(null);
  const prevDateRef = useRef(null);
  const lastThemeUpdateRef = useRef(null);

  // Logging render count (development only)
  useEffect(() => {
    renderCount.current += 1;
    console.log(`WeatherDashboard render #${renderCount.current}`);
  });

  // Get current celestial data - MEMOIZED to prevent recalculations
  const getCelestialInfo = useCallback(() => {
    if (!activeRegion)
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

    try {
      // Get sun data
      const sunData = sunriseSunsetService.getFormattedSunriseSunset(
        activeRegion.latitudeBand || "temperate",
        currentDate
      );

      // Get moon data - now uses the cached implementation
      const { moonrise, moonset } = moonService.getMoonTimes(
        currentDate,
        activeRegion.latitudeBand || "temperate"
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
        sunriseTime: formatTimeString(sunData.sunrise),
        sunsetTime: formatTimeString(sunData.sunset),
        moonriseTime: formatTimeString(moonrise),
        moonsetTime: formatTimeString(moonset),
      };
    } catch (error) {
      console.error("Error calculating celestial info:", error);
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
  }, [activeRegion, currentDate]);

  // Memoize celestial info to prevent recalculation on every render
  const celestialInfo = useMemo(() => getCelestialInfo(), [getCelestialInfo]);

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
        activeRegion.latitudeBand || "temperate"
      );

      // Update theme colors
      setThemeColors({
        backgroundColor: skyColors.backgroundColor,
        textColor: skyColors.textColor,
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

    console.log(`Initializing weather: region=${regionId}, date=${dateString}`);
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
        console.log(`Time sync needed for region ${regionId}`);
        const hoursDiff = Math.round(timeDiffMs / (1000 * 60 * 60));

        if (hoursDiff !== 0) {
          console.log(`Syncing region time by ${hoursDiff} hours`);

          // For large time jumps, reinitialize
          if (Math.abs(hoursDiff) > 72) {
            console.log(`Large time gap, reinitializing weather`);
            const actualSeason =
              season === "auto"
                ? weatherManager.getSeasonFromDate(currentWorldDate)
                : season;

            // Use the weatherType from region settings (default to 'diceTable')
            const weatherType = activeRegion.weatherType || "diceTable";

            const newForecast = weatherManager.initializeWeather(
              regionId,
              activeRegion.climate,
              actualSeason,
              currentWorldDate,
              weatherType
            );

            // Generate new description for the current weather
            const newDescription =
              weatherDescriptionService.generateDescription(
                newForecast[0],
                activeRegion.climate,
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
            const weatherType = activeRegion.weatherType || "diceTable";
            let newForecast;

            if (hoursDiff > 0) {
              newForecast = weatherManager.advanceTime(
                regionId,
                absHoursDiff,
                activeRegion.climate,
                actualSeason,
                new Date(lastUpdateDate.getTime())
              );
            } else {
              newForecast = weatherManager.initializeWeather(
                regionId,
                activeRegion.climate,
                actualSeason,
                currentWorldDate,
                weatherType
              );
            }

            // Generate new description for the current weather
            const newDescription =
              weatherDescriptionService.generateDescription(
                newForecast[0],
                activeRegion.climate,
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
      console.log("Loading saved weather");
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
          activeRegion.climate,
          currentDate,
          regionId
        );
        setWeatherDescription(newDescription);
        storeWeatherDescription(regionId, newDescription);
      }

      updateRegionTimestamp(regionId, currentDate.toISOString());
    } else {
      console.log("Generating new weather");
      const actualSeason =
        season === "auto"
          ? weatherManager.getSeasonFromDate(currentDate)
          : season;

      // Default to dice table if not specified
      const weatherType = activeRegion.weatherType || "diceTable";

      setCurrentSeason(actualSeason);
      const newForecast = weatherManager.initializeWeather(
        regionId,
        activeRegion.climate,
        actualSeason,
        currentDate,
        weatherType
      );

      // Generate a new description for the current weather
      const newDescription = weatherDescriptionService.generateDescription(
        newForecast[0],
        activeRegion.climate,
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
  ]);

  // Initialize weather effect - with stable dependencies
  useEffect(() => {
    initializeWeather();
  }, [initializeWeather]);

  // Handle time advancement
  const handleAdvanceTime = useCallback(
    (hours) => {
      if (!activeRegion) return;

      setIsLoading(true);
      console.log(`Advancing time by ${hours} hours`);

      const beforeDate = new Date(currentDate);
      advanceTime(hours);
      advanceGameTime(hours);

      const afterDate = new Date(beforeDate);
      afterDate.setHours(afterDate.getHours() + hours);

      const actualSeason =
        season === "auto"
          ? weatherManager.getSeasonFromDate(afterDate)
          : season;

      // Get weather type (default to dice table if not specified)
      const weatherType = activeRegion.weatherType || "diceTable";

      // Handle weather advancement
      const newForecast = weatherManager.advanceTime(
        activeRegion.id,
        hours,
        activeRegion.climate,
        actualSeason,
        afterDate
      );

      // Generate a new description for the current weather
      const newDescription = weatherDescriptionService.generateDescription(
        newForecast[0],
        activeRegion.climate,
        afterDate,
        activeRegion.id
      );

      setWeatherDescription(newDescription);
      storeWeatherDescription(activeRegion.id, newDescription);

      setForecast(newForecast);
      setCurrentSeason(actualSeason);
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

      setIsLoading(false);
      // Force update celestial calculations after time change
      setForceUpdate((prev) => prev + 1);
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

    // Get weather type from region settings
    const weatherType = activeRegion.weatherType || "diceTable";

    setCurrentSeason(actualSeason);
    const newForecast = weatherManager.initializeWeather(
      activeRegion.id,
      activeRegion.climate,
      actualSeason,
      currentDate,
      weatherType
    );

    // Generate a new description for the current weather
    const newDescription = weatherDescriptionService.generateDescription(
      newForecast[0],
      activeRegion.climate,
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
    updateRegionWeather,
    updateRegionTimestamp,
    storeWeatherDescription,
  ]);

  // Change weather generation system
  const changeWeatherSystem = useCallback(
    (newType) => {
      if (!activeRegion || !activeRegion.id) return;

      setIsLoading(true);
      console.log(`Changing weather system to: ${newType}`);

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

      // Initialize weather with new type
      const newForecast = weatherManager.initializeWeather(
        activeRegion.id,
        activeRegion.climate,
        actualSeason,
        currentDate,
        newType
      );

      // Generate a new description for the current weather
      const newDescription = weatherDescriptionService.generateDescription(
        newForecast[0],
        activeRegion.climate,
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

  // Create a dynamic style for the weather display
  const dynamicWeatherStyle = {
    backgroundImage: themeColors.backgroundImage,
    color: themeColors.textColor,
    transition: "background-color 2s, background-image 2s, color 2s",
  };

  // Current weather from forecast
  const currentWeather = forecast.length > 0 ? forecast[0] : null;

  // Current weather system type
  const weatherSystemType = activeRegion.weatherType || "diceTable";

  return (
    <div className="weather-dashboard">
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
          />
        )}
      </div>

      {/* Time Controls - below weather display */}
      <div className="time-control-panel">
        <QuickTimeControls onAdvanceTime={handleAdvanceTime} />
        <CustomTimeControls onAdvanceTime={handleAdvanceTime} />
      </div>

      {/* Forecast Section - expandable */}
      <div className="forecast-section">
        <div className="forecast-header" onClick={toggleForecast}>
          <h3 className="forecast-title">
            {isForecastExpanded ? "24-Hour Forecast" : "Upcoming Hours"}
          </h3>
          <span className="expand-icon">
            {isForecastExpanded ? "See Less" : "See More"}
          </span>
        </div>

        {/* No extra wrapper divs! ForecastDisplay directly here */}
        <ForecastDisplay
          forecast={isForecastExpanded ? forecast : forecast.slice(0, 6)}
          latitudeBand={activeRegion.latitudeBand || "temperate"}
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
              latitudeBand={activeRegion?.latitudeBand || "temperate"}
              biome={activeRegion?.climate || "temperate-deciduous"}
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
