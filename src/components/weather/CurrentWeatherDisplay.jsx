// src/components/weather/CurrentWeatherDisplay.jsx
import React, { useEffect, useState } from "react";
import { usePreferences } from "../../contexts/PreferencesContext";
import { formatTimeWithMinutes } from "../../utils/timeUtils";
import {
  formatTemperature,
  formatTemperatureValue,
  formatWindSpeed,
} from "../../utils/unitConversions";
import WeatherIcon from "./WeatherIcon";
import "../../weatherDashboard.css";

const CurrentWeatherDisplay = ({
  currentWeather,
  celestialInfo,
  isDaytime,
  themeColors,
}) => {
  const { state: preferences } = usePreferences();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Add event listener to track window size
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (!currentWeather) return null;

  const nextEvent = isDaytime ? "sunset" : "sunrise";
  const nextEventTime = isDaytime
    ? formatTimeWithMinutes(celestialInfo.sunset)
    : formatTimeWithMinutes(celestialInfo.sunrise);

  // Calculate feels-like temperature
  const feelsLikeTemp = calculateFeelsLikeTemperature(
    currentWeather.temperature,
    currentWeather._meteoData?.humidity || 50,
    currentWeather.windSpeed
  );

  // Show "feels like" based on preference and if difference exists
  const tempDiff = feelsLikeTemp - currentWeather.temperature;
  const showFeelsLike = preferences.showFeelsLike && Math.abs(tempDiff) >= 1;

  // Determine if we should use side-by-side layout
  const useSideBySide = windowWidth >= 768;

  // Format temperature based on unit preference
  const displayTemp = formatTemperatureValue(
    currentWeather.temperature,
    preferences.temperatureUnit
  );
  const displayFeelsLike = formatTemperatureValue(
    feelsLikeTemp,
    preferences.temperatureUnit
  );
  const tempSymbol = preferences.temperatureUnit === "celsius" ? "C" : "F";

  return (
    <div className={`weather-overlay ${useSideBySide ? "side-by-side" : ""}`}>
      {/* Region name at top */}
      <div className="region-name">
        {currentWeather.regionName || "Placeville"}
      </div>

      {/* Flex container for weather info */}
      <div className="weather-content-container">
        {/* Left side / Top (Temperature section) */}
        <div className="temperature-section">
          <div className="temperature-display-large">
            {displayTemp}° {tempSymbol}
          </div>

          <div className="feels-like-container">
            {showFeelsLike ? (
              <div
                className={`feels-like-temp ${
                  tempDiff < 0 ? "feels-colder" : "feels-warmer"
                }`}
              >
                Feels Like: {displayFeelsLike}°
              </div>
            ) : preferences.showFeelsLike ? (
              <div className="feels-like-temp">Actual Temperature</div>
            ) : null}
          </div>
        </div>

        {/* Right side / Bottom (Condition section) */}
        <div className="condition-section">
          {/* Weather condition with icon */}
          <div className="weather-condition-container">
            <WeatherIcon
              condition={currentWeather.condition}
              isDaytime={isDaytime}
              size={32}
            />
            <div className="weather-condition">{currentWeather.condition}</div>
          </div>

          {/* Wind information */}
          <div className="wind-display-large">
            {formatWindSpeed(
              currentWeather.windSpeed,
              preferences.windSpeedUnit
            )}{" "}
            {currentWeather.windDirection} • {currentWeather.windIntensity}
          </div>

          {/* Next celestial event */}
          <div className="next-event-display">
            Next {nextEvent}: {nextEventTime}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function for feels-like temperature
function calculateFeelsLikeTemperature(temp, humidity, windSpeed) {
  if (temp <= 50) {
    return Math.round(calculateWindChill(temp, windSpeed));
  } else if (temp >= 80) {
    return Math.round(calculateHeatIndex(temp, humidity));
  } else {
    return Math.round(temp);
  }
}

function calculateWindChill(T, V) {
  if (T <= 50 && V > 3) {
    return (
      35.74 +
      0.6215 * T -
      35.75 * Math.pow(V, 0.16) +
      0.4275 * T * Math.pow(V, 0.16)
    );
  }
  return T;
}

function calculateHeatIndex(T, H) {
  if (T >= 80) {
    return 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + H * 0.094);
  }
  return T;
}

export default CurrentWeatherDisplay;
