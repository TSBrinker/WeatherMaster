// src/components/weather/TimeDisplay.jsx
import React from "react";
import { useWorldSettings } from "../../contexts/WorldSettings";

const TimeDisplay = ({ currentDate, currentWeather, currentSeason }) => {
  const { formatGameDate, formatGameTime } = useWorldSettings();

  return (
    <div className="time-display">
      <div className="date-display">{formatGameDate(currentDate)}</div>
      <div className="time-display-large">{formatGameTime(currentDate)}</div>
      <div className="current-weather-label">
        {currentWeather} {currentSeason ? `• ${currentSeason}` : ""}
      </div>
    </div>
  );
};

export default TimeDisplay;
