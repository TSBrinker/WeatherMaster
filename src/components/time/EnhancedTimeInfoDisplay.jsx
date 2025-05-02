// components/time/EnhancedTimeInfoDisplay.jsx
import React, { useState, useEffect } from "react";
import useWorld from "../../hooks/useWorld";
import { getCelestialData, formatTime } from "../../utils/celestialUtils";

const EnhancedTimeInfoDisplay = ({ currentDate }) => {
  const { getActiveRegion } = useWorld();
  const [celestialData, setCelestialData] = useState(null);

  // Get the active region to determine climate
  const activeRegion = getActiveRegion();

  // Calculate celestial data whenever date or region changes
  useEffect(() => {
    if (!currentDate || !activeRegion) return;

    // Get climate from region
    const climate = activeRegion.climate || "temperate-deciduous";

    // Calculate all celestial data
    const data = getCelestialData(currentDate, climate);
    setCelestialData(data);
  }, [currentDate, activeRegion]);

  // If no data available yet, show loading
  if (!celestialData) {
    return (
      <div className="time-info-display card">
        <h3 className="card-title">Celestial Information</h3>
        <div className="text-center py-4">
          <p>Loading celestial data...</p>
        </div>
      </div>
    );
  }

  // Destructure celestial data
  const {
    sunrise,
    sunset,
    daylightHours,
    isDaytime,
    moonrise,
    moonset,
    phaseName,
    phaseIcon,
    latitudeBand,
  } = celestialData;

  // Format the daylight duration
  const formatDaylight = (hours) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  return (
    <div className="time-info-display card">
      <h3 className="card-title mb-4">Celestial Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="sun-info p-3 bg-surface-light rounded-lg">
          <h4 className="text-lg font-semibold mb-2 flex items-center">
            <span className="mr-2" role="img" aria-label="Sun">
              {isDaytime ? "☀️" : "🌙"}
            </span>
            Sun
            <span className="ml-auto text-xs text-gray-400">
              ({latitudeBand})
            </span>
          </h4>

          <div className="info-list">
            <div className="info-item flex justify-between mb-2">
              <span className="label">Sunrise:</span>
              <span className="value font-semibold">{formatTime(sunrise)}</span>
            </div>
            <div className="info-item flex justify-between mb-2">
              <span className="label">Sunset:</span>
              <span className="value font-semibold">{formatTime(sunset)}</span>
            </div>
            <div className="info-item flex justify-between">
              <span className="label">Daylight:</span>
              <span className="value font-semibold">
                {formatDaylight(daylightHours)}
              </span>
            </div>

            {/* Status indicator */}
            <div className="status-indicator mt-3 text-center p-1 rounded-lg bg-surface">
              <span
                className={`text-sm ${
                  isDaytime ? "text-yellow-300" : "text-blue-400"
                }`}
              >
                {isDaytime ? "Daytime" : "Nighttime"}
              </span>
            </div>
          </div>
        </div>

        <div className="moon-info p-3 bg-surface-light rounded-lg">
          <h4 className="text-lg font-semibold mb-2 flex items-center">
            <span className="mr-2" role="img" aria-label="Moon">
              {phaseIcon}
            </span>
            Moon
          </h4>

          <div className="info-list">
            <div className="info-item flex justify-between mb-2">
              <span className="label">Moonrise:</span>
              <span className="value font-semibold">
                {formatTime(moonrise)}
              </span>
            </div>
            <div className="info-item flex justify-between mb-2">
              <span className="label">Moonset:</span>
              <span className="value font-semibold">{formatTime(moonset)}</span>
            </div>
            <div className="info-item flex justify-between mb-2">
              <span className="label">Phase:</span>
              <span className="value font-semibold">{phaseName}</span>
            </div>

            {/* Moon visibility indicator */}
            <div className="status-indicator mt-3 text-center p-1 rounded-lg bg-surface">
              <span className="text-sm">
                {isMoonVisible(currentDate, moonrise, moonset)
                  ? "Moon is visible"
                  : "Moon is not visible"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Information about current celestial effects */}
      <div className="celestial-effects mt-4">
        <h4 className="text-lg font-semibold">Celestial Effects</h4>
        <div className="p-3 bg-surface-light rounded-lg mt-2">
          <p className="text-sm">
            {getCelestialEffects(phaseName, isDaytime, daylightHours)}
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper function to determine if moon is visible
const isMoonVisible = (currentTime, moonrise, moonset) => {
  // Convert all to minutes since midnight for easier comparison
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const moonriseMinutes = moonrise.getHours() * 60 + moonrise.getMinutes();
  const moonsetMinutes = moonset.getHours() * 60 + moonset.getMinutes();

  // Check if moon is up (handling cases where moonrise and moonset cross midnight)
  if (moonriseMinutes < moonsetMinutes) {
    // Simple case: moonrise and moonset on same day
    return currentMinutes >= moonriseMinutes && currentMinutes < moonsetMinutes;
  } else {
    // Complex case: moonrise and moonset cross midnight
    return currentMinutes >= moonriseMinutes || currentMinutes < moonsetMinutes;
  }
};

// Helper function to get game effects based on celestial conditions
const getCelestialEffects = (moonPhase, isDaytime, daylightHours) => {
  let effects = [];

  // Daylight/darkness effects
  if (isDaytime) {
    if (daylightHours >= 16) {
      effects.push(
        "Extended daylight: Creatures with sunlight sensitivity suffer disadvantage for longer periods."
      );
    } else if (daylightHours <= 8) {
      effects.push(
        "Brief daylight: Limited time for travel before darkness falls."
      );
    }
  } else {
    // Nighttime effects
    if (daylightHours <= 4) {
      effects.push(
        "Extended darkness: Advantage on stealth checks for creatures with darkvision."
      );
    }
  }

  // Moon phase effects
  if (moonPhase === "Full Moon") {
    effects.push(
      "Full Moon: Lycanthropes transform. Night visibility is improved (dim light instead of darkness in open areas)."
    );
  } else if (moonPhase === "New Moon") {
    effects.push(
      "New Moon: Complete darkness at night. Disadvantage on Perception checks relying on sight."
    );
  } else if (moonPhase.includes("Crescent")) {
    effects.push("Crescent Moon: Limited natural light at night.");
  } else if (moonPhase.includes("Quarter") || moonPhase.includes("Gibbous")) {
    effects.push("Partial Moon: Moderate natural light at night.");
  }

  // If no specific effects, give a general description
  if (effects.length === 0) {
    effects.push(
      isDaytime ? "Normal daylight conditions." : "Normal nighttime conditions."
    );
  }

  return effects.join(" ");
};

export default EnhancedTimeInfoDisplay;
