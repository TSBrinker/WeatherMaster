// src/components/weather/WeatherDashboardHeader.jsx
import React from "react";
import TimeDisplay from "./TimeDisplay";
import CustomTimeControls from "./CustomTimeControls";
import QuickTimeControls from "./QuickTimeControls";

const WeatherDashboardHeader = ({
  currentDate,
  currentWeather,
  currentSeason,
  onCustomAdvanceTime,
  onAdvanceTime,
}) => {
  return (
    <div className="weather-dashboard-header">
      <div className="time-control-panel">
        <CustomTimeControls onAdvanceTime={onCustomAdvanceTime} />

        <TimeDisplay
          currentDate={currentDate}
          currentWeather={currentWeather}
          currentSeason={currentSeason}
        />

        <QuickTimeControls onAdvanceTime={onAdvanceTime} />
      </div>
    </div>
  );
};

export default WeatherDashboardHeader;
