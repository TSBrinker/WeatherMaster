// src/components/weather/WeatherEffects.jsx
import React, { useState, useEffect } from "react";
import moonService from "../../services/MoonService";
import sunriseSunsetService from "../../services/SunriseSunsetService";

const WeatherEffects = ({
  weatherEffects,
  currentDate,
  latitudeBand = "temperate",
}) => {
  const [moonInfo, setMoonInfo] = useState(null);
  const [isNighttime, setIsNighttime] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get moon information
  useEffect(() => {
    if (!currentDate) return;

    try {
      // Get moon phase
      const phase = moonService.getMoonPhase(currentDate);

      // Check if it's night
      const { isDaytime } = sunriseSunsetService.getFormattedSunriseSunset(
        latitudeBand,
        currentDate
      );

      setMoonInfo(phase);
      setIsNighttime(!isDaytime);

      console.log("Moon phase info:", phase); // Debugging
    } catch (error) {
      console.error("Error getting moon info:", error);
    }
  }, [currentDate, latitudeBand]);

  // Render a loading state if weather effects are not available
  if (!weatherEffects) return null;

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
            {/* Weather effects */}
            <div className="weather-effects-content mb-4">
              <h3 className="text-lg font-semibold mb-2">Weather</h3>
              <p className="whitespace-pre-line">{weatherEffects}</p>
            </div>

            {/* Moon info section */}
            {moonInfo ? (
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
                        <span className="font-semibold">Light Level:</span> Dim
                        Light in open areas <br />
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
            ) : (
              <div className="moon-effects-content mt-4 border-t border-gray-700 pt-4">
                <p>Loading moon information...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherEffects;
