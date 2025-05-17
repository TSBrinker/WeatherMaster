// src/components/weather/CurrentWeatherDisplay.jsx
import React from "react";
import { formatTimeWithMinutes } from "../../utils/timeUtils";
import WeatherIcon from "./WeatherIcon";
import "../../weatherDashboard.css";

const CurrentWeatherDisplay = ({
  currentWeather,
  celestialInfo,
  isDaytime,
}) => {
  if (!currentWeather) return null;

  const nextEvent = isDaytime ? "sunset" : "sunrise";
  const nextEventTime = isDaytime
    ? formatTimeWithMinutes(celestialInfo.sunset)
    : formatTimeWithMinutes(celestialInfo.sunrise);

  // Handle case where feelsLikeTemperature might not be available
  const hasFeelsLike = currentWeather.feelsLikeTemperature !== undefined;
  const feelsLikeTemp = hasFeelsLike
    ? currentWeather.feelsLikeTemperature
    : currentWeather.temperature;
  const tempDiff = feelsLikeTemp - currentWeather.temperature;

  // Show "feels like" if any noticeable difference exists (reduced threshold)
  const showFeelsLike = hasFeelsLike && Math.abs(tempDiff) >= 1;

  // Debugging
  if (hasFeelsLike) {
    console.log(
      `Weather display: Actual ${currentWeather.temperature}°F, Feels like ${feelsLikeTemp}°F, Diff: ${tempDiff}°F`
    );
  }

  return (
    <div className="weather-overlay">
      <div className="weather-icon-large">
        <WeatherIcon
          condition={currentWeather.condition}
          isDaytime={isDaytime}
          size={64}
          color="white"
        />
      </div>
      <div className="weather-details">
        <div className="weather-condition">{currentWeather.condition}</div>
        <div className="temperature-display-large">
          {currentWeather.temperature}°F
          {showFeelsLike && (
            <span
              className={`feels-like-temp ${
                tempDiff < 0 ? "feels-colder" : "feels-warmer"
              }`}
            >
              Feels like {feelsLikeTemp}°F
            </span>
          )}
        </div>
        <div className="wind-display-large">
          {currentWeather.windSpeed} mph {currentWeather.windDirection}
          <span className="wind-intensity">
            • {currentWeather.windIntensity}
          </span>
        </div>
        <div className="next-event-display">
          Next {nextEvent}: {nextEventTime}
        </div>
      </div>
    </div>
  );
};

export default CurrentWeatherDisplay;
