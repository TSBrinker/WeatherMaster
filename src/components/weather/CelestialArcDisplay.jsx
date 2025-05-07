// src/components/weather/CelestialArcDisplay.jsx
import React, { useState, useEffect } from "react";
import sunriseSunsetService from "../../services/SunriseSunsetService";
import moonService from "../../services/MoonService";
import { useWorldSettings } from "../../contexts/WorldSettings";
import { formatTimeWithMinutes } from "../../utils/timeUtils";

const CelestialArcDisplay = ({ currentDate, latitudeBand = "temperate" }) => {
  const { formatGameTime } = useWorldSettings();
  const [dimensions, setDimensions] = useState({ width: 500, height: 250 });
  const [debug, setDebug] = useState({
    sunPosition: null,
    moonPosition: null,
    currentHour: 0,
    sunriseHour: 0,
    sunsetHour: 0,
    moonriseHour: 0,
    moonsetHour: 0,
  });

  // Adjust dimensions based on container size
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.querySelector(".celestial-arc-container");
      if (container) {
        const width = container.clientWidth;
        setDimensions({
          width: width - 32, // Account for padding
          height: Math.max(250, width / 2),
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Get sun info
  const { sunrise, sunset, sunriseTime, sunsetTime } =
    sunriseSunsetService.getFormattedSunriseSunset(latitudeBand, currentDate);

  // Get moon info
  const moonInfo = moonService.getMoonPhase(currentDate);
  const { moonrise, moonset } = moonService.getMoonTimes(currentDate);
  const moonriseTime = formatTimeWithMinutes(moonrise);
  const moonsetTime = formatTimeWithMinutes(moonset);

  

  // Convert a Date to decimal hours (0-24)
  const getDecimalHours = (date) => {
    if (!(date instanceof Date)) return null;
    return date.getHours() + date.getMinutes() / 60;
  };

  // Current hour of day as decimal
  const currentHour = getDecimalHours(currentDate);

  // Convert sunrise/sunset to decimal hours
  const sunriseHour = getDecimalHours(sunrise);
  const sunsetHour = getDecimalHours(sunset);

  // Convert moonrise/moonset to decimal hours
  const moonriseHour = getDecimalHours(moonrise);
  const moonsetHour = getDecimalHours(moonset);

  // SVG dimensions
  const { width, height } = dimensions;

  // The arc is a semicircle
  const arcCenterX = width / 2;
  const arcCenterY = height;
  const arcRadius = Math.min(width / 2, height) * 0.9; // 90% of available space

  // Function to map hour of day (0-24) to position on the horizon (0-width)
  const hourToHorizonPosition = (hour) => {
    if (hour === null) return null;
    return (hour / 24) * width;
  };

  // Function to map progress (0-1) along arc to SVG coordinates
  const progressToArcCoordinates = (progress) => {
    // Progress should be between 0 and 1
    // 0 = left horizon, 0.5 = zenith, 1 = right horizon
    if (progress === null) return null;

    // Clamp progress to 0-1 range
    const clampedProgress = Math.max(0, Math.min(1, progress));

    // Convert progress to angle in radians
    // We want to map 0->1 to π->0 (180°->0°)
    const angle = Math.PI * (1 - clampedProgress);

    // Calculate coordinates on arc
    const x = arcCenterX + arcRadius * Math.cos(angle);
    const y = arcCenterY - arcRadius * Math.sin(angle);

    return { x, y };
  };

  // Calculate sun position on arc (returns progress 0-1)
  const calculateSunProgress = () => {
    // If current time is before sunrise or after sunset, sun is below horizon
    if (currentHour < sunriseHour || currentHour > sunsetHour) {
      return null; // Below horizon
    }

    // Calculate progress (0-1) between sunrise and sunset
    const dayLength = sunsetHour - sunriseHour;
    const timeSinceSunrise = currentHour - sunriseHour;

    return timeSinceSunrise / dayLength;
  };

  // Calculate moon position on arc (returns progress 0-1)
  const calculateMoonProgress = () => {
    // Check if moonrise and moonset are defined
    if (moonriseHour === null || moonsetHour === null) {
      return null;
    }

    // Handle case where moon crosses midnight
    const moonCrossesMidnight = moonsetHour < moonriseHour;

    // Check if moon is currently visible
    let moonIsVisible = false;
    if (moonCrossesMidnight) {
      // Moon is visible if time is after moonrise OR before moonset
      moonIsVisible = currentHour >= moonriseHour || currentHour <= moonsetHour;
    } else {
      // Moon is visible if time is between moonrise and moonset
      moonIsVisible = currentHour >= moonriseHour && currentHour <= moonsetHour;
    }

    if (!moonIsVisible) {
      return null; // Moon is below horizon
    }

    // Calculate progress along arc
    let progress;
    if (moonCrossesMidnight) {
      // Handle case where moon crosses midnight
      const visibleHours = 24 - moonriseHour + moonsetHour;
      if (currentHour >= moonriseHour) {
        // After moonrise, before midnight
        progress = (currentHour - moonriseHour) / visibleHours;
      } else {
        // After midnight, before moonset
        progress = (24 - moonriseHour + currentHour) / visibleHours;
      }
    } else {
      // Normal case (moonrise and moonset on same day)
      const visibleHours = moonsetHour - moonriseHour;
      progress = (currentHour - moonriseHour) / visibleHours;
    }

    return progress;
  };

  // Calculate positions as progress (0-1) along the arc
  const sunProgress = calculateSunProgress();
  const moonProgress = calculateMoonProgress();

  // Convert progress to coordinates
  const sunCoords =
    sunProgress !== null ? progressToArcCoordinates(sunProgress) : null;
  const moonCoords =
    moonProgress !== null ? progressToArcCoordinates(moonProgress) : null;

  // Update debug info
  useEffect(() => {
    setDebug({
      sunPosition: sunProgress,
      moonPosition: moonProgress,
      currentHour,
      sunriseHour,
      sunsetHour,
      moonriseHour,
      moonsetHour,
    });
  }, [
    currentHour,
    sunriseHour,
    sunsetHour,
    moonriseHour,
    moonsetHour,
    sunProgress,
    moonProgress,
  ]);

  // Colors for different times
  const getSkyGradient = () => {
    const hour = currentDate.getHours();

    if (hour >= 5 && hour < 8) {
      return "url(#dawnSky)"; // Dawn
    } else if (hour >= 8 && hour < 17) {
      return "url(#daySky)"; // Day
    } else if (hour >= 17 && hour < 20) {
      return "url(#sunsetSky)"; // Sunset/Dusk
    } else {
      return "url(#nightSky)"; // Night
    }
  };

  return (
    <div className="card p-4 celestial-arc-container">
      {/* <h2 className="card-title mb-4">Celestial Arc</h2> */}

      <div className="flex justify-center mb-4">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Sky gradients */}
          <defs>
            <linearGradient id="dawnSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF7E45" />
              <stop offset="100%" stopColor="#FFB347" />
            </linearGradient>
            <linearGradient id="daySky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#87CEEB" />
              <stop offset="100%" stopColor="#1E90FF" />
            </linearGradient>
            <linearGradient id="sunsetSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF7E45" />
              <stop offset="100%" stopColor="#FF4500" />
            </linearGradient>
            <linearGradient id="nightSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#191970" />
              <stop offset="100%" stopColor="#000033" />
            </linearGradient>
          </defs>

          {/* Sky background */}
          <path
            d={`M 0,${height} A ${arcRadius},${arcRadius} 0 0,1 ${width},${height}`}
            fill={getSkyGradient()}
            stroke="#4b5563"
            strokeWidth="2"
          />

          {/* Horizon line */}
          <line
            x1="0"
            y1={height}
            x2={width}
            y2={height}
            stroke="#4b5563"
            strokeWidth="2"
          />

          {/* Time indicators along horizon */}
          {[0, 6, 12, 18, 24].map((hour) => (
            <g key={hour}>
              <line
                x1={hourToHorizonPosition(hour)}
                y1={height}
                x2={hourToHorizonPosition(hour)}
                y2={height - 10}
                stroke="#4b5563"
                strokeWidth="1"
              />
              <text
                x={hourToHorizonPosition(hour)}
                y={height - 15}
                textAnchor="middle"
                fill="white"
                fontSize="10"
              >
                {hour === 0
                  ? "12 AM"
                  : hour === 12
                  ? "12 PM"
                  : hour > 12
                  ? `${hour - 12} PM`
                  : `${hour} AM`}
              </text>
            </g>
          ))}

          {/* Current time marker */}
          <line
            x1={hourToHorizonPosition(currentHour)}
            y1={height}
            x2={hourToHorizonPosition(currentHour)}
            y2={height - 15}
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <circle
            cx={hourToHorizonPosition(currentHour)}
            cy={height - 15}
            r="4"
            fill="#FFFFFF"
          />

          {/* Sunrise/sunset markers */}
          {sunriseHour !== null && (
            <g>
              <line
                x1={hourToHorizonPosition(sunriseHour)}
                y1={height}
                x2={hourToHorizonPosition(sunriseHour)}
                y2={height - 20}
                stroke="#FFD700"
                strokeWidth="2"
                strokeDasharray="2,2"
              />
              <text
                x={hourToHorizonPosition(sunriseHour)}
                y={height - 25}
                textAnchor="middle"
                fill="#FFD700"
                fontSize="10"
              >
                ↑
              </text>
            </g>
          )}

          {sunsetHour !== null && (
            <g>
              <line
                x1={hourToHorizonPosition(sunsetHour)}
                y1={height}
                x2={hourToHorizonPosition(sunsetHour)}
                y2={height - 20}
                stroke="#FF4500"
                strokeWidth="2"
                strokeDasharray="2,2"
              />
              <text
                x={hourToHorizonPosition(sunsetHour)}
                y={height - 25}
                textAnchor="middle"
                fill="#FF4500"
                fontSize="10"
              >
                ↓
              </text>
            </g>
          )}

          {/* Moonrise/moonset markers */}
          {moonriseHour !== null && (
            <g>
              <line
                x1={hourToHorizonPosition(moonriseHour)}
                y1={height}
                x2={hourToHorizonPosition(moonriseHour)}
                y2={height - 20}
                stroke="#E6E6FA"
                strokeWidth="2"
                strokeDasharray="2,2"
              />
              <text
                x={hourToHorizonPosition(moonriseHour)}
                y={height - 25}
                textAnchor="middle"
                fill="#E6E6FA"
                fontSize="10"
              >
                ↑
              </text>
            </g>
          )}

          {moonsetHour !== null && (
            <g>
              <line
                x1={hourToHorizonPosition(moonsetHour)}
                y1={height}
                x2={hourToHorizonPosition(moonsetHour)}
                y2={height - 20}
                stroke="#C0C0C0"
                strokeWidth="2"
                strokeDasharray="2,2"
              />
              <text
                x={hourToHorizonPosition(moonsetHour)}
                y={height - 25}
                textAnchor="middle"
                fill="#C0C0C0"
                fontSize="10"
              >
                ↓
              </text>
            </g>
          )}

          {/* Sun position marker - only if above horizon */}
          {sunCoords && (
            <g>
              {/* Sun glow */}
              <circle
                cx={sunCoords.x}
                cy={sunCoords.y}
                r="15"
                fill="rgba(255, 215, 0, 0.3)"
              />
              {/* Sun */}
              <circle
                cx={sunCoords.x}
                cy={sunCoords.y}
                r="10"
                fill="#FFD700"
                stroke="#FFA500"
                strokeWidth="1"
              />
            </g>
          )}

          {/* Moon position marker - only if above horizon */}
          {moonCoords && (
            <g>
              {/* Moon with appropriate phase */}
              <circle
                cx={moonCoords.x}
                cy={moonCoords.y}
                r="8"
                fill="#E6E6FA"
                stroke="#C0C0C0"
                strokeWidth="1"
              />
              {/* Add moon phase icon based on illumination */}
              <text
                x={moonCoords.x}
                y={moonCoords.y + 3}
                textAnchor="middle"
                fontSize="10"
                fill="#C0C0C0"
              >
                {moonInfo.icon}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-400">Sunrise:</span> {sunriseTime}
        </div>
        <div>
          <span className="text-gray-400">Sunset:</span> {sunsetTime}
        </div>
        <div>
          <span className="text-gray-400">Moonrise:</span>{" "}
          {moonriseTime || "N/A"}
        </div>
        <div>
          <span className="text-gray-400">Moonset:</span> {moonsetTime || "N/A"}
        </div>
      </div>

      {/* Debug panel - comment this out in production */}
      {/* <div className="mt-2 p-2 bg-surface-light text-xs rounded overflow-auto" style={{maxHeight: "100px"}}>
        <div>Current: {debug.currentHour.toFixed(2)}h</div>
        <div>Sun: Rise={debug.sunriseHour?.toFixed(2)}h Set={debug.sunsetHour?.toFixed(2)}h Pos={debug.sunPosition?.toFixed(2)}</div>
        <div>Moon: Rise={debug.moonriseHour?.toFixed(2)}h Set={debug.moonsetHour?.toFixed(2)}h Pos={debug.moonPosition?.toFixed(2)}</div>
      </div> */}
    </div>
  );
};

export default CelestialArcDisplay;
