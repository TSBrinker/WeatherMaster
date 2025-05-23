// src/components/weather/TimeDisplay.jsx
import React from "react";
import { useWorldSettings } from "../../contexts/WorldSettings";
import { usePreferences } from "../../contexts/PreferencesContext";

const TimeDisplay = ({ currentDate, currentSeason }) => {
  const { formatGameDate, formatGameTime } = useWorldSettings();
  const { state: preferences } = usePreferences();

  // Calculate the season phase (early, mid, late) based on equinoxes and solstices
  const getSeasonPhase = (date) => {
    // Define approximate equinox and solstice dates (month is 0-based in JS Date)
    const year = date.getFullYear();

    // These are approximate dates - in a complete implementation,
    // these could be calculated more precisely
    const springEquinox = new Date(year, 2, 20); // March 20
    const summerSolstice = new Date(year, 5, 21); // June 21
    const fallEquinox = new Date(year, 8, 22); // September 22
    const winterSolstice = new Date(year, 11, 21); // December 21

    // Set time to noon to avoid day boundary issues
    const noon = new Date(date);
    noon.setHours(12, 0, 0, 0);
    springEquinox.setHours(12, 0, 0, 0);
    summerSolstice.setHours(12, 0, 0, 0);
    fallEquinox.setHours(12, 0, 0, 0);
    winterSolstice.setHours(12, 0, 0, 0);

    // Create previous year's winter solstice for calculations
    const prevWinterSolstice = new Date(year - 1, 11, 21, 12, 0, 0, 0);

    // Calculate days into the current season
    let currentSeasonStart;
    let nextSeasonStart;
    let seasonName;

    // Determine which season we're in and its start date
    if (noon >= winterSolstice || noon < springEquinox) {
      // Winter
      seasonName = "Winter";
      currentSeasonStart =
        noon >= winterSolstice ? winterSolstice : prevWinterSolstice;
      nextSeasonStart =
        noon >= winterSolstice
          ? new Date(year + 1, 2, 20, 12, 0, 0, 0)
          : springEquinox;
    } else if (noon >= springEquinox && noon < summerSolstice) {
      // Spring
      seasonName = "Spring";
      currentSeasonStart = springEquinox;
      nextSeasonStart = summerSolstice;
    } else if (noon >= summerSolstice && noon < fallEquinox) {
      // Summer
      seasonName = "Summer";
      currentSeasonStart = summerSolstice;
      nextSeasonStart = fallEquinox;
    } else {
      // Fall
      seasonName = "Fall";
      currentSeasonStart = fallEquinox;
      nextSeasonStart = winterSolstice;
    }

    // Calculate total season length in days
    const seasonLength =
      (nextSeasonStart - currentSeasonStart) / (1000 * 60 * 60 * 24);

    // Calculate days elapsed in the season
    const daysElapsed = (noon - currentSeasonStart) / (1000 * 60 * 60 * 24);

    // Calculate percentage through the season
    const percentComplete = daysElapsed / seasonLength;

    // Determine early, mid, or late
    if (percentComplete < 0.33) {
      return `Early ${seasonName}`;
    } else if (percentComplete < 0.67) {
      return `${seasonName}`;
    } else {
      return `Late ${seasonName}`;
    }
  };

  // Format time based on preference
  const formatTimeBasedOnPreference = (date) => {
    if (preferences.timeFormat === '24hour') {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    // Use the existing formatGameTime for 12-hour format
    return formatGameTime(date);
  };

  // Get the season phase
  const seasonPhase = getSeasonPhase(currentDate);

  return (
    <div className="time-display">
      {/* Changed the order to match your screenshot */}
      <div className="time-display-large">{formatTimeBasedOnPreference(currentDate)}</div>
      <div className="date-display">{formatGameDate(currentDate)}</div>
      <div className="season-display">{seasonPhase}</div>
    </div>
  );
};

export default TimeDisplay;