// components/weather/EnhancedForecastDisplay.jsx
import React, { useState } from "react";
import useRegionWeather from "../../hooks/useRegionWeather";
import WeatherIcon from "./WeatherIcon";
import { isDaytime } from "../../utils/celestialUtils";

const EnhancedForecastDisplay = ({ forecast }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { inTransition } = useRegionWeather();

  // Use provided forecast or get it from the region weather hook
  const forecastData = forecast || [];

  if (!forecastData || forecastData.length === 0) {
    return null;
  }

  // Get transition indicator if we're traveling between regions
  const getTransitionIndicator = (hourData) => {
    if (!hourData.isTransitional) return null;

    // Create a color that changes as transition progresses
    // Start with source region color (blue) and end with target region color (green)
    const blueComponent = Math.round(255 * (1 - hourData.transitionProgress));
    const greenComponent = Math.round(255 * hourData.transitionProgress);

    return (
      <div
        className="transition-indicator"
        style={{
          position: "absolute",
          top: "-4px",
          left: "-4px",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: `rgb(${blueComponent}, ${greenComponent}, 0)`,
        }}
      />
    );
  };

  return (
    <div className="forecast-display card w-full max-w-full overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2>
          24-Hour Forecast
          {inTransition && (
            <span className="text-sm font-normal text-gray-400 ml-2">
              (Transitional Weather)
            </span>
          )}
        </h2>
        <button className="btn btn-sm" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "Show Forecast" : "Hide Forecast"}
        </button>
      </div>

      {!collapsed && (
        <div className="forecast-scroll overflow-x-auto w-full">
          <div className="forecast-container flex gap-2 p-2 min-w-max">
            {forecastData.map((hourData, index) => (
              <div
                key={index}
                className={`forecast-item flex-shrink-0 w-24 p-3 rounded-lg text-center ${
                  index === 0 ? "bg-surface-light border-2 border-primary" : ""
                }`}
                style={{
                  position: "relative",
                  backgroundColor:
                    index === 0 ? "" : getWeatherBackground(hourData.condition),
                }}
              >
                {/* Transition indicator if applicable */}
                {getTransitionIndicator(hourData)}

                {/* Time indicator */}
                <div className="time text-sm text-gray-400 mb-1">
                  {index === 0 ? "Now" : formatHour(hourData.date)}
                </div>

                {/* Weather icon */}
                <div
                  className="icon-container mb-2"
                  style={{ position: "relative" }}
                >
                  <WeatherIcon
                    condition={hourData.condition}
                    hour={hourData.date.getHours()}
                    size="medium"
                  />

                  {/* Celestial event indicator */}
                  {(hourData.hasShootingStar || hourData.hasMeteorImpact) && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        backgroundColor: hourData.hasMeteorImpact
                          ? "red"
                          : "gold",
                        borderRadius: "50%",
                        width: "16px",
                        height: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                      }}
                    >
                      {hourData.hasMeteorImpact ? "💥" : "☄️"}
                    </div>
                  )}
                </div>

                {/* Condition name (shortened for space) */}
                <div
                  className="condition text-xs font-semibold mb-1"
                  title={hourData.condition}
                >
                  {hourData.condition.length > 12
                    ? hourData.condition.substring(0, 12) + "..."
                    : hourData.condition}
                </div>

                {/* Temperature */}
                <div className="temperature font-bold mb-1">
                  {hourData.temperature}°F
                </div>

                {/* Wind info */}
                <div className="wind-info text-xs text-gray-400 flex items-center justify-center">
                  {getWindIcon(hourData.windIntensity) && (
                    <span
                      className="wind-icon mr-1"
                      style={{ fontSize: "0.7rem" }}
                    >
                      {getWindIcon(hourData.windIntensity)}
                    </span>
                  )}
                  <span>
                    {hourData.windSpeed} mph {hourData.windDirection}
                  </span>
                </div>

                {/* Day/night indicator */}
                <div
                  className="day-night-indicator"
                  style={{
                    position: "absolute",
                    bottom: "4px",
                    right: "4px",
                    fontSize: "8px",
                  }}
                >
                  {isDaytime(hourData.date) ? "☀️" : "🌙"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format hour display
const formatHour = (date) => {
  return date.toLocaleString("en-US", {
    hour: "numeric",
    hour12: true,
  });
};

// Helper function to get background color based on weather
const getWeatherBackground = (condition) => {
  // Use very subtle background colors that work with dark theme
  switch (condition) {
    case "Clear Skies":
      return "rgba(233, 245, 219, 0.1)";
    case "Light Clouds":
      return "rgba(233, 245, 219, 0.05)";
    case "Heavy Clouds":
      return "rgba(216, 226, 220, 0.1)";
    case "Rain":
      return "rgba(207, 226, 243, 0.1)";
    case "Heavy Rain":
      return "rgba(182, 208, 226, 0.1)";
    case "Snow":
      return "rgba(232, 240, 240, 0.1)";
    case "Freezing Cold":
      return "rgba(224, 243, 248, 0.1)";
    case "Scorching Heat":
      return "rgba(255, 232, 214, 0.1)";
    case "Thunderstorm":
      return "rgba(201, 204, 213, 0.1)";
    case "Blizzard":
      return "rgba(213, 214, 234, 0.1)";
    default:
      return "rgba(233, 245, 219, 0.05)";
  }
};

// Helper function to get wind icon
const getWindIcon = (intensity) => {
  switch (intensity) {
    case "Calm":
      return null; // No icon for calm winds
    case "Breezy":
      return "🍃";
    case "Windy":
      return "💨";
    case "Strong Winds":
      return "🌪️";
    case "Gale Force":
      return "🌀";
    case "Storm Force":
      return "🌪️";
    default:
      return null;
  }
};

export default EnhancedForecastDisplay;
