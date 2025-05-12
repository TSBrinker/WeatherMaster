// src/components/weather/CelestialArcDisplay.jsx
import React, { useState, useEffect } from "react";
import sunriseSunsetService from "../../services/SunriseSunsetService";
import moonService from "../../services/MoonService";
import { formatTimeWithMinutes } from "../../utils/timeUtils";
import SkyBackground from "./SkyBackground";
import TimelineMarkers from "./TimelineMarkers";
import SunPosition from "./SunPosition";
import MoonPosition from "./MoonPosition";
import { useCelestialCalculations } from "../../hooks/useCelestialCalculations";

const CelestialArcDisplay = ({ currentDate, latitudeBand = "temperate" }) => {
  const [dimensions, setDimensions] = useState({ width: 500, height: 250 });

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

  // Use the celestial calculations hook
  const {
    sunriseHour,
    sunsetHour,
    moonriseHour,
    moonsetHour,
    currentHour,
    sunProgress,
    moonProgress,
    visualMoonPhase,
    isDaytime,
  } = useCelestialCalculations(currentDate, latitudeBand);

  // SVG dimensions
  const { width, height } = dimensions;

  return (
    <div className="card p-4 celestial-arc-container">
      <div className="flex justify-center mb-4">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Sky background with gradients */}
          <SkyBackground
            width={width}
            height={height}
            hourOfDay={currentDate.getHours()}
          />

          {/* Timeline markers along the horizon */}
          <TimelineMarkers
            width={width}
            height={height}
            currentHour={currentHour}
          />

          {/* Sun position with rise/set markers */}
          <SunPosition
            width={width}
            height={height}
            sunriseHour={sunriseHour}
            sunsetHour={sunsetHour}
            sunProgress={sunProgress}
          />

          {/* Moon position with rise/set markers */}
          <MoonPosition
            width={width}
            height={height}
            moonriseHour={moonriseHour}
            moonsetHour={moonsetHour}
            moonProgress={moonProgress}
            moonPhase={visualMoonPhase}
          />
        </svg>
      </div>
    </div>
  );
};

export default CelestialArcDisplay;
