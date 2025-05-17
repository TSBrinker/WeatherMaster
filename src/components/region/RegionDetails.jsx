// src/components/region/RegionDetails.jsx
import React, { useState } from "react";
import MeteorologicalDebugPanel from "../debug/MeteorologicalDebugPanel";

const RegionDetails = ({
  region,
  celestialInfo,
  currentSeason,
  season,
  setSeason,
  onRegenerateWeather,
  weatherSystemType = "diceTable",
  onChangeWeatherSystem,
  showDebug,
  setShowDebug,
  currentWeather,
}) => {
  if (!region) return null;

  const [showCelestialInfo, setShowCelestialInfo] = useState(false);

  const handleWeatherSystemChange = (e) => {
    const newType = e.target.value;
    if (onChangeWeatherSystem) {
      onChangeWeatherSystem(newType);
    }
  };

  return (
    <div className="region-details-section">
      <div className="card p-4">
        <h2 className="text-xl font-semibold mb-4">Region Details</h2>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <span className="text-gray-400">Climate:</span>{" "}
            {region.climate.replace("-", " ")}
          </div>
          <div>
            <span className="text-gray-400">Season:</span> {currentSeason}
          </div>
          <div className="col-span-2">
            <span className="text-gray-400">Latitude Band:</span>{" "}
            {region.latitudeBand || "temperate"}
          </div>
          <div className="col-span-2">
            <span className="text-gray-400">Daylight:</span>{" "}
            {celestialInfo.dayLengthFormatted || "N/A"}
          </div>
        </div>

        {/* Collapsible Celestial Info */}
        <div className="mt-4">
          <button
            className="text-left w-full flex justify-between items-center py-2 px-4 bg-surface-light rounded"
            onClick={() => setShowCelestialInfo(!showCelestialInfo)}
          >
            <span>Celestial Information</span>
            <span>{showCelestialInfo ? "▲" : "▼"}</span>
          </button>

          {showCelestialInfo && (
            <div className="mt-2 p-3 bg-surface rounded">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400">Sunrise:</span>{" "}
                  {celestialInfo.sunriseTime || "N/A"}
                </div>
                <div>
                  <span className="text-gray-400">Sunset:</span>{" "}
                  {celestialInfo.sunsetTime || "N/A"}
                </div>
                <div>
                  <span className="text-gray-400">Moonrise:</span>{" "}
                  {celestialInfo.moonriseTime || "N/A"}
                </div>
                <div>
                  <span className="text-gray-400">Moonset:</span>{" "}
                  {celestialInfo.moonsetTime || "N/A"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Weather System Selection */}
        <div className="mt-4 p-3 bg-surface-light rounded">
          <h3 className="font-semibold mb-2">Weather Generation System</h3>
          <div className="mb-3">
            <select
              value={weatherSystemType}
              onChange={handleWeatherSystemChange}
              className="w-full p-2 rounded bg-surface text-white border border-border"
            >
              <option value="diceTable">Basic (Dice Tables)</option>
              <option value="meteorological">Advanced (Meteorological)</option>
            </select>
            <div className="text-sm text-gray-400 mt-1">
              {weatherSystemType === "diceTable"
                ? "Using simplified dice-based weather generation"
                : "Using physically-based meteorological modeling"}
            </div>
          </div>
        </div>

        {/* Debug Toggle */}
        <div className="mt-4">
          <button
            className="text-left w-full flex justify-between items-center py-2 px-4 bg-surface-light rounded"
            onClick={() => setShowDebug(!showDebug)}
          >
            <span>Debug Information</span>
            <span>{showDebug ? "▲" : "▼"}</span>
          </button>

          {showDebug && currentWeather && (
            <div className="mt-2">
              <MeteorologicalDebugPanel
                weatherData={currentWeather}
                region={region}
              />
            </div>
          )}
        </div>

        <button
          onClick={onRegenerateWeather}
          className="btn btn-primary mt-4 w-full"
        >
          Regenerate Weather
        </button>
      </div>
    </div>
  );
};

export default RegionDetails;
