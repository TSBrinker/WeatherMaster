// src/components/region/RegionDetails.jsx
import React from "react";
import CelestialInfoDisplay from "../weather/CelestialInfoDisplay";

const RegionDetails = ({
  region,
  celestialInfo,
  currentSeason,
  season,
  setSeason,
  onRegenerateWeather,
}) => {
  if (!region) return null;

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
        <button onClick={onRegenerateWeather} className="btn btn-primary mt-4">
          Regenerate Weather
        </button>
      </div>
    </div>
  );
};

export default RegionDetails;
