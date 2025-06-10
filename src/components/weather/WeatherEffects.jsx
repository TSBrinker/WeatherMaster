// src/components/weather/WeatherEffects.jsx - FIXED VERSION
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import moonService from "../../services/MoonService";
import sunriseSunsetService from "../../services/SunriseSunsetService";
import weatherDescriptionService from "../../services/WeatherDescriptionService";
import { weatherEffects as staticWeatherEffects } from "../../data-tables/weather-effects";
import {
  AlertTriangle,
  Wind,
  Droplet,
  Eye,
  Map,
  Footprints,
  Shield,
  Moon,
} from "lucide-react";

const WeatherEffects = ({
  weatherEffects,
  currentWeather,
  currentDate,
  latitudeBand = "temperate",
  biome = "temperate-deciduous",
  regionId = null,
  cachedDescription = null,
}) => {
  // State variables
  const [moonInfo, setMoonInfo] = useState(null);
  const [isNighttime, setIsNighttime] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [weatherDescription, setWeatherDescription] = useState("");
  const [structuredEffects, setStructuredEffects] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs to prevent unnecessary re-renders
  const lastWeatherCondition = useRef(null);
  const lastDescriptionGenerated = useRef(null);

  // Memoize stable values to prevent infinite loops
  const stableCurrentWeather = useMemo(() => {
    if (!currentWeather) return null;
    return {
      condition: currentWeather.condition,
      temperature: currentWeather.temperature,
      windSpeed: currentWeather.windSpeed,
      windDirection: currentWeather.windDirection,
      windIntensity: currentWeather.windIntensity,
    };
  }, [
    currentWeather?.condition,
    currentWeather?.temperature,
    currentWeather?.windSpeed,
    currentWeather?.windDirection,
    currentWeather?.windIntensity,
  ]);

  // Memoize current date as timestamp to prevent object comparison issues
  const currentDateTimestamp = useMemo(() => {
    return currentDate ? currentDate.getTime() : null;
  }, [currentDate]);

  // Generate weather description with proper dependency tracking
  useEffect(() => {
    if (!stableCurrentWeather || !currentDate) {
      setWeatherDescription("");
      return;
    }

    const condition = stableCurrentWeather.condition;
    const cacheKey = `${regionId}-${condition}-${currentDateTimestamp}`;

    // Skip if we've already generated this exact description
    if (lastDescriptionGenerated.current === cacheKey) {
      return;
    }

    try {
      let description = "";

      // Check cached description first
      if (cachedDescription) {
        description = cachedDescription;
      } else if (regionId) {
        const storedDescription = localStorage.getItem(
          `weather_description_${regionId}`
        );
        if (storedDescription) {
          description = storedDescription;
        } else {
          // Generate new description
          description = weatherDescriptionService.generateDescription(
            stableCurrentWeather,
            biome,
            currentDate,
            regionId
          );

          // Store in localStorage
          try {
            localStorage.setItem(
              `weather_description_${regionId}`,
              description
            );
          } catch (error) {
            console.error("Error storing weather description:", error);
          }
        }
      } else {
        // Generate without caching
        description = weatherDescriptionService.generateDescription(
          stableCurrentWeather,
          biome,
          currentDate
        );
      }

      setWeatherDescription(description);
      lastDescriptionGenerated.current = cacheKey;
    } catch (error) {
      console.error("Error generating weather description:", error);
      setError("Failed to generate weather description");
    }
  }, [
    stableCurrentWeather,
    currentDateTimestamp,
    biome,
    regionId,
    cachedDescription,
  ]);

  // Handle structured effects with proper dependency tracking
  useEffect(() => {
    if (!stableCurrentWeather) {
      setStructuredEffects(null);
      return;
    }

    const condition = stableCurrentWeather.condition;

    // Skip if condition hasn't changed
    if (lastWeatherCondition.current === condition) {
      return;
    }

    try {
      // Check if weatherEffects prop contains structured data
      if (typeof weatherEffects === "object" && weatherEffects !== null) {
        setStructuredEffects(weatherEffects);
      } else if (condition && staticWeatherEffects[condition]) {
        // Use statically imported weather effects
        setStructuredEffects(staticWeatherEffects[condition]);
      } else {
        setStructuredEffects(null);
      }

      lastWeatherCondition.current = condition;
    } catch (error) {
      console.error("Error setting structured effects:", error);
      setStructuredEffects(null);
    }
  }, [stableCurrentWeather, weatherEffects]);

  // Handle celestial information (moon/sun) with proper dependency tracking
  useEffect(() => {
    if (!currentDate) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get moon phase safely
      let phase = null;
      try {
        phase = moonService.getMoonPhase(currentDate);
      } catch (error) {
        console.error("Error getting moon phase:", error);
      }

      // Get daytime info safely
      let isDaytime = true;
      try {
        const sunInfo = sunriseSunsetService.getFormattedSunriseSunset(
          latitudeBand,
          currentDate
        );
        isDaytime = sunInfo.isDaytime;
      } catch (error) {
        console.error("Error getting sunrise/sunset info:", error);
      }

      setMoonInfo(phase);
      setIsNighttime(!isDaytime);
      setIsLoading(false);
    } catch (error) {
      console.error("Error in celestial calculations:", error);
      setError("Error calculating celestial data");
      setIsLoading(false);
    }
  }, [currentDateTimestamp, latitudeBand]);

  // Early return if no data available
  if (!weatherEffects && !stableCurrentWeather) return null;

  // Get condition name for display
  const conditionName = stableCurrentWeather?.condition || "Unknown";

  // Memoized render functions to prevent unnecessary re-renders
  const renderStructuredEffects = useCallback(() => {
    if (!structuredEffects) {
      return (
        <div className="text-center p-4 text-gray-400">
          No specific game effects for {conditionName}.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4">
        {/* Visibility Section */}
        {structuredEffects.visibility && (
          <div className="effect-section">
            <div className="effect-header">
              <Eye size={18} className="mr-2" />
              <h4 className="font-medium">Visibility</h4>
            </div>
            <div className="effect-content">{structuredEffects.visibility}</div>
          </div>
        )}

        {/* Movement Section */}
        {structuredEffects.movement && (
          <div className="effect-section">
            <div className="effect-header">
              <Footprints size={18} className="mr-2" />
              <h4 className="font-medium">Movement</h4>
            </div>
            <div className="effect-content">{structuredEffects.movement}</div>
          </div>
        )}

        {/* Rest Section */}
        {structuredEffects.rest && structuredEffects.rest !== "Normal" && (
          <div className="effect-section">
            <div className="effect-header">
              <Moon size={18} className="mr-2" />
              <h4 className="font-medium">Rest</h4>
            </div>
            <div className="effect-content">{structuredEffects.rest}</div>
          </div>
        )}

        {/* Damage Modifiers */}
        {structuredEffects.damage && structuredEffects.damage.length > 0 && (
          <div className="effect-section">
            <div className="effect-header">
              <Shield size={18} className="mr-2" />
              <h4 className="font-medium">Damage Modifiers</h4>
            </div>
            <div className="effect-content">
              <ul className="list-disc pl-6 space-y-1">
                {structuredEffects.damage.map((effect, idx) => (
                  <li key={idx}>{effect}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Check Modifiers */}
        {structuredEffects.checks && structuredEffects.checks.length > 0 && (
          <div className="effect-section">
            <div className="effect-header">
              <AlertTriangle size={18} className="mr-2" />
              <h4 className="font-medium">Check Modifiers</h4>
            </div>
            <div className="effect-content">
              <ul className="list-disc pl-6 space-y-1">
                {structuredEffects.checks.map((effect, idx) => (
                  <li key={idx}>{effect}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Other Effects */}
        {structuredEffects.other && structuredEffects.other.length > 0 && (
          <div className="effect-section">
            <div className="effect-header">
              <Map size={18} className="mr-2" />
              <h4 className="font-medium">Other Effects</h4>
            </div>
            <div className="effect-content">
              <ul className="list-disc pl-6 space-y-1">
                {structuredEffects.other.map((effect, idx) => (
                  <li key={idx}>{effect}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Wind Effects if applicable */}
        {stableCurrentWeather && stableCurrentWeather.windSpeed > 15 && (
          <div className="effect-section mt-2 p-3 bg-surface-light rounded">
            <div className="effect-header">
              <Wind size={18} className="mr-2" />
              <h4 className="font-medium">Wind Effects</h4>
            </div>
            <div className="effect-content">
              {stableCurrentWeather.windIntensity}:{" "}
              {stableCurrentWeather.windSpeed} mph{" "}
              {stableCurrentWeather.windDirection}
            </div>
          </div>
        )}
      </div>
    );
  }, [structuredEffects, conditionName, stableCurrentWeather]);

  const renderClassicEffects = useCallback(() => {
    if (typeof weatherEffects === "string") {
      return <div className="whitespace-pre-line">{weatherEffects}</div>;
    }

    return (
      <div className="text-center p-4 text-gray-400">
        No game effects available for this weather condition.
      </div>
    );
  }, [weatherEffects]);

  const renderMoonInfo = useCallback(() => {
    if (!moonInfo) return null;

    return (
      <div className="p-3 rounded bg-surface-light">
        <div className="flex items-center mb-2">
          <Moon size={18} className="mr-2" />
          <h4 className="font-medium">Moon Phase</h4>
        </div>
        <div className="text-gray-300">
          <div>Phase: {moonInfo.phase}</div>
          <div>Illumination: {moonInfo.illumination}%</div>
          {moonInfo.moonrise && (
            <div>Moonrise: {moonInfo.moonrise.toLocaleTimeString()}</div>
          )}
          {moonInfo.moonset && (
            <div>Moonset: {moonInfo.moonset.toLocaleTimeString()}</div>
          )}
        </div>
      </div>
    );
  }, [moonInfo]);

  return (
    <div className="weather-effects-section">
      <div className="card p-4">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <h2 className="text-xl font-semibold">
            Weather & Environment Effects
          </h2>
          <span>{isCollapsed ? "▼" : "▲"}</span>
        </div>

        {!isCollapsed && (
          <div className="mt-4">
            {/* Weather description - commented out in original */}
            {/*
            <div className="p-3 rounded bg-surface-light mb-4">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="italic text-gray-100">{weatherDescription}</p>
            </div>
            */}

            {/* Weather effects */}
            <div className="weather-effects-content mb-4">
              <div className="p-3 rounded bg-surface-light">
                {structuredEffects
                  ? renderStructuredEffects()
                  : renderClassicEffects()}
              </div>
            </div>

            {/* Celestial info section */}
            {isLoading ? (
              <div className="text-center p-4">Loading celestial data...</div>
            ) : error ? (
              <div className="text-center p-4 text-red-400">Error: {error}</div>
            ) : (
              <>{isNighttime && renderMoonInfo()}</>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherEffects;
