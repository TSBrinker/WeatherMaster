// src/components/weather/DayNightDisplay.jsx
import React from "react";
import sunriseSunsetService from "../../services/SunriseSunsetService";
import skyColorService from "../../services/SkyColorService";

const DayNightDisplay = ({ currentDate, latitudeBand, weatherCondition }) => {
  // Get sunrise/sunset information
  const sunInfo = sunriseSunsetService.getFormattedSunriseSunset(
    latitudeBand,
    currentDate
  );

  // Get sky color information based on time, weather, and location
  const skyColors = skyColorService.calculateSkyColor(
    currentDate,
    weatherCondition,
    latitudeBand
  );

  // Create dynamic style based on sky colors
  const skyStyle = {
    backgroundColor: skyColors.backgroundColor,
    backgroundImage: skyColors.backgroundImage,
    color: skyColors.textColor,
    transition: "background-color 2s, background-image 2s, color 2s",
  };

  // Format time display
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    });
  };

  // Get current hour
  const currentHour = currentDate.getHours();

  // Calculate current position for the day progress indicator
  const getDayProgress = () => {
    // Calculate as percentage of 24 hours
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);

    const elapsed = currentDate - startOfDay;
    const percentage = (elapsed / (24 * 60 * 60 * 1000)) * 100;

    return `${percentage}%`;
  };

  return (
    <div className="card p-4">
      <h2 className="card-title mb-4">Day & Night</h2>

      <div
        className="relative rounded-full overflow-hidden mb-4"
        style={{
          height: "40px",
          ...skyStyle,
        }}
      >
        {/* Time markers */}
        <div className="absolute top-0 left-0 h-full w-full">
          {/* Sunrise marker */}
          <div
            className="absolute h-full"
            style={{
              left: `${
                ((sunInfo.sunrise.getHours() +
                  sunInfo.sunrise.getMinutes() / 60) /
                  24) *
                100
              }%`,
              width: "2px",
              backgroundColor: "rgba(255,255,255,0.8)",
            }}
          >
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-lg">
              🌅
            </div>
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 text-xs bg-surface px-1               rounded">
              {sunInfo.sunsetTime}
            </div>
          </div>

          {/* Current time indicator */}
          <div
            className="absolute h-full"
            style={{
              left: getDayProgress(),
              width: "3px",
              backgroundColor: "white",
              boxShadow: "0 0 5px white",
              zIndex: 10,
            }}
          >
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-md" />
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-surface rounded shadow-md text-sm">
              {formatTime(currentDate)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-gray-400 text-sm">Sunrise</div>
          <div>{sunInfo.sunriseTime}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Sunset</div>
          <div>{sunInfo.sunsetTime}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Daylight</div>
          <div>{sunInfo.dayLengthFormatted}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Current</div>
          <div>
            {skyColors.isDaytime ? "Day" : "Night"} ({skyColors.period})
          </div>
        </div>
      </div>

      {/* Debug info - can be removed in production */}
      {false && (
        <div className="mt-4 p-2 bg-surface-light rounded text-xs">
          <div>Period: {skyColors.period}</div>
          {skyColors.nextPeriod && (
            <div>
              Transitioning to: {skyColors.nextPeriod} (
              {skyColors.transitionProgress}%)
            </div>
          )}
          <div>Background: {skyColors.backgroundColor}</div>
          <div>Text: {skyColors.textColor}</div>
        </div>
      )}
    </div>
  );
};

export default DayNightDisplay;
