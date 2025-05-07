// src/components/weather/CelestialInfoDisplay.jsx
import React from "react";
import { formatTimeWithMinutes } from "../../utils/timeUtils";

const CelestialInfoDisplay = ({ celestialInfo }) => {
  const { 
    sunrise, sunset, 
    sunriseTime, sunsetTime, 
    moonrise, moonset,
    moonriseTime, moonsetTime
  } = celestialInfo;

  // Format times with minutes if they exist but aren't formatted yet
  const formattedSunriseTime = sunrise ? formatTimeWithMinutes(sunrise) : "N/A";
  const formattedSunsetTime = sunset ? formatTimeWithMinutes(sunset) : "N/A";
  const formattedMoonriseTime = moonrise ? formatTimeWithMinutes(moonrise) : "N/A";
  const formattedMoonsetTime = moonset ? formatTimeWithMinutes(moonset) : "N/A";

  return (
    <div className="celestial-info-display">
      <div className="celestial-times sunrise-sunset">
        <div className="celestial-time">
          <span className="label">Sunrise:</span> {formattedSunriseTime}
        </div>
        <div className="celestial-time">
          <span className="label">Sunset:</span> {formattedSunsetTime}
        </div>
      </div>
      <div className="celestial-times moonrise-moonset">
        <div className="celestial-time">
          <span className="label">Moonrise:</span> {formattedMoonriseTime}
        </div>
        <div className="celestial-time">
          <span className="label">Moonset:</span> {formattedMoonsetTime}
        </div>
      </div>
    </div>
  );
};

export default CelestialInfoDisplay;