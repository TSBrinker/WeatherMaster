// src/components/weather/CelestialInfo.jsx
import React from "react";
import { formatTimeWithMinutes } from "../../utils/timeUtils";

const CelestialInfo = ({ celestialInfo }) => {
  if (!celestialInfo) return null;

  const {
    sunrise,
    sunset,
    moonrise,
    moonset,
    sunriseTime,
    sunsetTime,
    moonriseTime,
    moonsetTime,
  } = celestialInfo;

  // Format times with minutes if they exist but aren't formatted yet
  const formattedSunriseTime =
    sunrise && !sunriseTime
      ? formatTimeWithMinutes(sunrise)
      : sunriseTime || "N/A";
  const formattedSunsetTime =
    sunset && !sunsetTime ? formatTimeWithMinutes(sunset) : sunsetTime || "N/A";
  const formattedMoonriseTime =
    moonrise && !moonriseTime
      ? formatTimeWithMinutes(moonrise)
      : moonriseTime || "N/A";
  const formattedMoonsetTime =
    moonset && !moonsetTime
      ? formatTimeWithMinutes(moonset)
      : moonsetTime || "N/A";

  return (
    <div className="celestial-info">
      <div className="celestial-info-left">
        <div className="celestial-time">
          <span className="label">Sunrise:</span> {formattedSunriseTime}
        </div>
        <div className="celestial-time">
          <span className="label">Moonrise:</span> {formattedMoonriseTime}
        </div>
      </div>
      <div className="celestial-info-right">
        <div className="celestial-time">
          <span className="label">Sunset:</span> {formattedSunsetTime}
        </div>
        <div className="celestial-time">
          <span className="label">Moonset:</span> {formattedMoonsetTime}
        </div>
      </div>
    </div>
  );
};

export default CelestialInfo;
