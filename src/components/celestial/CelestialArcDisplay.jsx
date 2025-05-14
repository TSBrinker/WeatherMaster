// src/components/weather/CelestialArcDisplay.jsx
import React, { useState, useEffect } from "react";
import { useCelestialCalculations } from "../../hooks/useCelestialCalculations";
import SkyBackground from "./SkyBackground";
import TimelineMarkers from "./TimelineMarkers";
import CelestialBody from "../celestial/CelestialBody";

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

          {/* Moon using the unified component */}
          <CelestialBody
            width={width}
            height={height}
            riseHour={moonriseHour}
            setHour={moonsetHour}
            progress={moonProgress}
            bodyType="moon"
            customProps={
              visualMoonPhase
                ? {
                    illumination: visualMoonPhase.exactPercentage,
                    visibilityFactor: visualMoonPhase.visibilityFactor || 1,
                  }
                : {}
            }
          />
          {/* Sun using the unified component */}
          <CelestialBody
            width={width}
            height={height}
            riseHour={sunriseHour}
            setHour={sunsetHour}
            progress={sunProgress}
            bodyType="sun"
          />
        </svg>
      </div>
    </div>
  );
};

export default CelestialArcDisplay;
