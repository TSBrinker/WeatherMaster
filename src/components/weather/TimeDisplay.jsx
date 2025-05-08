// src/components/weather/TimeDisplay.jsx
import React from "react";

const TimeDisplay = ({ currentDate, currentWeather, currentSeason }) => {
  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    });
  };

  return (
    <div className="time-display">
      <div className="date-display">{formatDate(currentDate)}</div>
      <div className="time-display-large">{formatTime(currentDate)}</div>
      <div className="current-weather-label">
        {currentWeather} {currentSeason ? `• ${currentSeason}` : ""}
      </div>
    </div>
  );
};

export default TimeDisplay;
