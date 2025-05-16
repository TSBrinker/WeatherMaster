// src/components/weather/WeatherEffects.jsx
import React, { useState, useEffect } from "react";
import moonService from "../../services/MoonService";
import sunriseSunsetService from "../../services/SunriseSunsetService";
import weatherDescriptionService from "../../services/WeatherDescriptionService";

const WeatherEffects = ({
  weatherEffects,
  currentWeather,
  currentDate,
  latitudeBand = "temperate",
  biome = "temperate-deciduous",
  regionId = null,
  cachedDescription = null,
}) => {
  const [moonInfo, setMoonInfo] = useState(null);
  const [isNighttime, setIsNighttime] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [weatherDescription, setWeatherDescription] = useState("");
  const [gameEffects, setGameEffects] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Generate weather description first, using cache when available
  useEffect(() => {
    if (!currentWeather || !currentDate) return;

    try {
      // Check if we have a cached description either from props or localStorage
      if (cachedDescription) {
        setWeatherDescription(cachedDescription);
      } else if (regionId) {
        const storedDescription = localStorage.getItem(
          `weather_description_${regionId}`
        );
        if (storedDescription) {
          setWeatherDescription(storedDescription);
        } else {
          // Generate a new description only if no cached ones exist
          const description = weatherDescriptionService.generateDescription(
            currentWeather,
            biome,
            currentDate,
            regionId
          );
          setWeatherDescription(description);

          // Store the description for future use
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
        // No region ID or cache, generate on demand but won't be cached
        const description = weatherDescriptionService.generateDescription(
          currentWeather,
          biome,
          currentDate
        );
        setWeatherDescription(description);
      }

      // Format game effects
      const formattedEffects =
        weatherDescriptionService.formatGameEffects(weatherEffects);
      setGameEffects(formattedEffects);
    } catch (error) {
      console.error("Error generating weather description:", error);
      setError("Failed to generate weather description");
    }
  }, [
    currentWeather,
    weatherEffects,
    biome,
    currentDate,
    regionId,
    cachedDescription,
  ]);

  // Get moon information in a separate effect to prevent circular dependencies
  useEffect(() => {
    if (!currentDate) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Safely get moon phase with error handling
      let phase = null;
      try {
        phase = moonService.getMoonPhase(currentDate);
      } catch (error) {
        console.error("Error getting moon phase:", error);
        // Continue without moon phase
      }

      // Safely get daytime info with error handling
      let isDaytime = true; // Default to daytime if error
      try {
        const sunInfo = sunriseSunsetService.getFormattedSunriseSunset(
          latitudeBand,
          currentDate
        );
        isDaytime = sunInfo.isDaytime;
      } catch (error) {
        console.error("Error getting sunrise/sunset info:", error);
        // Continue with default daytime value
      }

      setMoonInfo(phase);
      setIsNighttime(!isDaytime);
      setIsLoading(false);
    } catch (error) {
      console.error("Error in moon/sun calculations:", error);
      setError("Error calculating celestial data");
      setIsLoading(false);
    }
  }, [currentDate, latitudeBand]);

  // Render a loading state if weather effects are not available
  if (!weatherEffects && !currentWeather) return null;

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
            {/* Weather description */}
            <div className="p-3 rounded bg-surface-light mb-4">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="italic text-gray-100">{weatherDescription}</p>
            </div>

            {/* Weather effects */}
            <div className="weather-effects-content mb-4">
              <h3 className="text-lg font-semibold mb-2">Game Effects</h3>
              <div className="whitespace-pre-line">
                {gameEffects || weatherEffects}
              </div>
            </div>

            {/* Moon info section */}
            {isLoading ? (
              <div className="text-center p-4">Loading celestial data...</div>
            ) : error ? (
              <div className="text-red-500 p-4">{error}</div>
            ) : (
              moonInfo && (
                <div className="moon-effects-content mt-4 border-t border-gray-700 pt-4">
                  <h3 className="text-lg font-semibold mb-2">Moon Phase</h3>
                  <div className="flex items-center mb-2">
                    <span className="text-3xl mr-3">{moonInfo.icon}</span>
                    <div>
                      <div className="font-semibold">{moonInfo.name}</div>
                      <div className="text-sm text-gray-400">
                        {moonInfo.exactPercentage}% illuminated •{" "}
                        {moonInfo.isWaxing ? "Waxing" : "Waning"}
                      </div>
                    </div>
                  </div>

                  {/* D&D 5E Light Level - Only show at night */}
                  {isNighttime && (
                    <div className="mt-3 p-3 rounded bg-surface-light">
                      {moonInfo.name === "Full Moon" ||
                      moonInfo.name === "Waxing Gibbous" ||
                      moonInfo.name === "Waning Gibbous" ? (
                        <p>
                          <span className="font-semibold">Light Level:</span>{" "}
                          Dim Light in open areas <br />
                          <span className="text-sm block mt-1 text-gray-400">
                            Characters without darkvision can see up to 60 feet
                            but have disadvantage on Perception checks.
                          </span>
                        </p>
                      ) : (
                        <p>
                          <span className="font-semibold">Light Level:</span>{" "}
                          Darkness <br />
                          <span className="text-sm block mt-1 text-gray-400">
                            Characters without darkvision cannot see.
                          </span>
                        </p>
                      )}

                      {/* Lycanthropy note only on full moon */}
                      {moonInfo.name === "Full Moon" && (
                        <p className="mt-2 text-amber-300">
                          <span className="font-semibold">Lycanthropy:</span>{" "}
                          Lycanthropes are forced to transform.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherEffects;
