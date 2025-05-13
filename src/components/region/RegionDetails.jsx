// src/components/region/RegionDetails.jsx
import React from "react";
// import CelestialInfoDisplay from "../weather/CelestialInfoDisplay";

const RegionDetails = ({
  region,
  celestialInfo,
  currentSeason,
  season,
  setSeason,
  onRegenerateWeather,
  weatherSystemType = "diceTable",
  onChangeWeatherSystem,
}) => {
  if (!region) return null;

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
            <span className="text-gray-400">Sunrise:</span>{" "}
            {celestialInfo.sunriseTime || "N/A"}
          </div>
          <div>
            <span className="text-gray-400">Sunset:</span>{" "}
            {celestialInfo.sunsetTime || "N/A"}
          </div>
          <div>
            <span className="text-gray-400">Climate:</span>{" "}
            {region.climate.replace("-", " ")}
          </div>
          <div>
            <span className="text-gray-400">Season:</span> {currentSeason}
          </div>
          <div className="col-span-2">
            <span className="text-gray-400">Daylight:</span>{" "}
            {celestialInfo.dayLengthFormatted || "N/A"}
          </div>
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
              <option value="meteorological" disabled>
                Advanced (Meteorological) - Coming Soon
              </option>
            </select>
            <div className="text-sm text-gray-400 mt-1">
              {weatherSystemType === "diceTable"
                ? "Using simplified dice-based weather generation"
                : "Using physically-based meteorological modeling"}
            </div>
          </div>
        </div>

        <button onClick={onRegenerateWeather} className="btn btn-primary mt-4">
          Regenerate Weather
        </button>
      </div>
    </div>
  );
};

export default RegionDetails;
