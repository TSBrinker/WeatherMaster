// src/components/weather/WeatherDashboardExtensions.jsx
import React, { useState } from "react";
import WeatherSystemsVisualization from "./WeatherSystemsVisualization";

/**
 * Extensions for the Weather Dashboard to display meteorological-specific data
 * This component is conditionally rendered when the meteorological system is in use
 */
const WeatherDashboardExtensions = ({ forecast = [], weatherService }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Extract weather systems if weather service is meteorological
  // Handle case where _meteoData might not exist yet
  const weatherSystems =
    weatherService && weatherService._meteoData
      ? weatherService._meteoData.weatherSystems || []
      : weatherService && weatherService.weatherSystems
      ? weatherService.weatherSystems
      : [];

  // Get current weather for detailed meteorological data
  const currentWeather = forecast && forecast.length > 0 ? forecast[0] : null;
  const meteoData =
    currentWeather && currentWeather._meteoData
      ? currentWeather._meteoData
      : null;

  // If no meteorological data or not using meteorological system, don't render
  if (!meteoData && !weatherSystems.length) {
    return (
      <div className="weather-dashboard-extensions my-4 p-4 bg-surface rounded">
        <p className="text-gray-400 text-center">
          Meteorological data is loading or not available.
        </p>
      </div>
    );
  }

  // Safe values for when data might be missing
  const safeMeteoData = meteoData || {
    humidity: 0,
    pressure: 1013.25,
    cloudCover: 0,
    precipitationPotential: 0,
    precipAmount: 0,
  };

  return (
    <div className="weather-dashboard-extensions my-4">
      {/* Meteorological systems visualization - only show if we have systems */}
      {weatherSystems && weatherSystems.length > 0 && (
        <div className="weather-systems-section mb-4">
          <WeatherSystemsVisualization
            weatherSystems={weatherSystems}
            width={400}
            height={200}
          />
        </div>
      )}

      {/* Additional meteorological data */}
      <div className="meteo-data-section">
        <div
          className="section-header flex justify-between items-center cursor-pointer p-2 bg-surface rounded mb-2"
          onClick={() => setShowDetails(!showDetails)}
        >
          <h3 className="text-lg font-semibold">Meteorological Details</h3>
          <span>{showDetails ? "▼" : "▲"}</span>
        </div>

        {showDetails && (
          <div className="meteo-data-content p-4 bg-surface rounded">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="current-parameters">
                <h4 className="font-semibold mb-2">Current Parameters</h4>

                <div className="parameter-item flex justify-between mb-2">
                  <span className="parameter-label">Humidity:</span>
                  <span className="parameter-value">
                    {safeMeteoData.humidity?.toFixed(1) || "0.0"}%
                  </span>
                </div>

                <div className="parameter-item flex justify-between mb-2">
                  <span className="parameter-label">Pressure:</span>
                  <span className="parameter-value">
                    {safeMeteoData.pressure?.toFixed(1) || "1013.2"} hPa
                  </span>
                </div>

                <div className="parameter-item flex justify-between mb-2">
                  <span className="parameter-label">Cloud Cover:</span>
                  <span className="parameter-value">
                    {safeMeteoData.cloudCover?.toFixed(1) || "0.0"}%
                  </span>
                </div>

                <div className="parameter-item flex justify-between mb-2">
                  <span className="parameter-label">
                    Precipitation Potential:
                  </span>
                  <span className="parameter-value">
                    {safeMeteoData.precipitationPotential?.toFixed(1) || "0.0"}%
                  </span>
                </div>

                {safeMeteoData.precipAmount > 0 && (
                  <div className="parameter-item flex justify-between mb-2">
                    <span className="parameter-label">
                      Precipitation Amount:
                    </span>
                    <span className="parameter-value">
                      {safeMeteoData.precipAmount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                )}
              </div>

              <div className="trends">
                <h4 className="font-semibold mb-2">Weather Trends</h4>

                <div className="parameter-item flex justify-between mb-2">
                  <span className="parameter-label">Pressure Trend:</span>
                  <span
                    className={`parameter-value ${
                      weatherService?.pressureTrend > 0
                        ? "text-green-400"
                        : weatherService?.pressureTrend < 0
                        ? "text-red-400"
                        : ""
                    }`}
                  >
                    {weatherService?.pressureTrend > 0
                      ? "↑ "
                      : weatherService?.pressureTrend < 0
                      ? "↓ "
                      : ""}
                    {weatherService?.pressureTrend?.toFixed(2) || "0.00"} hPa/hr
                  </span>
                </div>

                {currentWeather && (
                  <div className="parameter-item flex justify-between mb-2">
                    <span className="parameter-label">
                      Atmospheric Instability:
                    </span>
                    <span
                      className={`parameter-value ${
                        weatherService?.calculateAtmosphericInstability &&
                        weatherService.calculateAtmosphericInstability(
                          currentWeather.temperature,
                          safeMeteoData.pressure
                        ) > 7
                          ? "text-red-400"
                          : weatherService?.calculateAtmosphericInstability &&
                            weatherService.calculateAtmosphericInstability(
                              currentWeather.temperature,
                              safeMeteoData.pressure
                            ) > 4
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      {(weatherService?.calculateAtmosphericInstability &&
                        weatherService
                          .calculateAtmosphericInstability(
                            currentWeather.temperature,
                            safeMeteoData.pressure
                          )
                          ?.toFixed(1)) ||
                        "0.0"}
                      /10
                    </span>
                  </div>
                )}

                <div className="parameter-item flex justify-between mb-2">
                  <span className="parameter-label">Recent Precipitation:</span>
                  <span className="parameter-value">
                    {weatherService?.getRecentPrecipitation?.()?.toFixed(2) ||
                      "0.00"}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Weather Systems List */}
            {weatherSystems && weatherSystems.length > 0 && (
              <div className="weather-systems-list mt-4 pt-4 border-t border-gray-700">
                <h4 className="font-semibold mb-2">Active Weather Systems</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {weatherSystems.map((system, idx) => (
                    <div
                      key={`system-${idx}`}
                      className={`system-item p-2 rounded ${
                        system.type === "high-pressure"
                          ? "bg-blue-900 bg-opacity-30"
                          : system.type === "low-pressure"
                          ? "bg-red-900 bg-opacity-30"
                          : system.type === "cold-front"
                          ? "bg-indigo-900 bg-opacity-30"
                          : "bg-orange-900 bg-opacity-30"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">
                          {system.type === "high-pressure"
                            ? "High Pressure System"
                            : system.type === "low-pressure"
                            ? "Low Pressure System"
                            : system.type === "cold-front"
                            ? "Cold Front"
                            : "Warm Front"}
                        </span>
                        <span className="text-sm opacity-80">
                          {Math.round(system.intensity * 100)}% intensity
                        </span>
                      </div>
                      <div className="text-sm mt-1">
                        Age: {system.age} hours | Position:{" "}
                        {Math.round(system.position * 100)}%
                      </div>
                      <div className="text-sm opacity-70">
                        {system.type === "high-pressure"
                          ? "Brings clear skies and stable conditions"
                          : system.type === "low-pressure"
                          ? "Brings clouds and potential precipitation"
                          : system.type === "cold-front"
                          ? "Temperature drops as it passes, may trigger precipitation"
                          : "Gradual warming with persistent clouds and precipitation"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation of Meteorological System */}
            <div className="explainer mt-4 text-sm text-gray-400">
              <p>
                This region uses the advanced meteorological weather system,
                which generates weather based on physical parameters like
                pressure, humidity, and cloud cover. Weather systems form and
                move through the region, creating more realistic patterns.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherDashboardExtensions;
