// src/components/weather/CelestialInfo.jsx
import React from "react";

const CelestialInfo = ({ celestialInfo }) => {
  if (!celestialInfo) return null;

  // Direct use of the values from celestialInfo
  const {
    sunriseTime = "N/A",
    sunsetTime = "N/A",
    moonriseTime = "N/A",
    moonsetTime = "N/A",
  } = celestialInfo;

  return (
    <div className="celestial-info">
      {/* Left column - Sun info */}
      <div className="celestial-info-left">
        <div className="celestial-time">
          <span className="label">Sunrise:</span> {sunriseTime}
        </div>
        <div className="celestial-time">
          <span className="label">Sunset:</span> {sunsetTime}
        </div>
      </div>

      {/* Right column - Moon info */}
      <div className="celestial-info-right">
        <div className="celestial-time">
          <span className="label">Moonrise:</span> {moonriseTime}
        </div>
        <div className="celestial-time">
          <span className="label">Moonset:</span> {moonsetTime}
        </div>
      </div>
    </div>
  );
};

export default CelestialInfo;
