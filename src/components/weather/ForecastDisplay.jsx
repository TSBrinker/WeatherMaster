// src/components/weather/ForecastDisplay.jsx
import React from "react";
import { useEffect } from "react";
import sunriseSunsetService from "../../services/SunriseSunsetService";
import WeatherIcon from "./WeatherIcon";
import { Wind } from "lucide-react";

const ForecastDisplay = ({
  forecast,
  latitudeBand = "temperate",
  celestialInfo,
  isExpanded = false,
}) => {
  // Format hour with minutes
  const formatHour = (date) => {
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Check if it's daytime for a given hour
  const isDaytime = (date) => {
    if (!celestialInfo) {
      const { sunrise, sunset } =
        sunriseSunsetService.getFormattedSunriseSunset(latitudeBand, date);
      return date >= sunrise && date <= sunset;
    }

    // Use provided celestial info when available
    const sunriseTime = celestialInfo.sunrise?.getTime();
    const sunsetTime = celestialInfo.sunset?.getTime();
    const dateTime = date.getTime();

    return sunriseTime && sunsetTime
      ? dateTime >= sunriseTime && dateTime <= sunsetTime
      : true; // Default to daytime if no info available
  };

  // Check if hour contains sunrise or sunset
  const isSunrise = (date) => {
    if (!celestialInfo || !celestialInfo.sunrise) return false;
    const hourStart = new Date(date);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourEnd.getHours() + 1);

    return (
      celestialInfo.sunrise >= hourStart && celestialInfo.sunrise < hourEnd
    );
  };

  const isSunset = (date) => {
    if (!celestialInfo || !celestialInfo.sunset) return false;
    const hourStart = new Date(date);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourEnd.getHours() + 1);

    return celestialInfo.sunset >= hourStart && celestialInfo.sunset < hourEnd;
  };

  useEffect(() => {
    // Get the scroll container
    const scrollContainer = document.querySelector(".forecast-scroll");
    if (scrollContainer) {
      // Check if scrolling is possible
      const isScrollable =
        scrollContainer.scrollWidth > scrollContainer.clientWidth;

      // Add or remove the scrollable class
      if (isScrollable) {
        scrollContainer.classList.add("scrollable");
      } else {
        scrollContainer.classList.remove("scrollable");
      }
    }
  }, [forecast, isExpanded]); // Re-run when forecast data or expanded state changes

  return (
    <div className="forecast-scroll">
      <div className={`forecast-hours ${isExpanded ? "expanded" : ""}`}>
        {forecast.map((hour, index) => {
          const hourIsDaytime = isDaytime(hour.date);
          const hourHasSunrise = isSunrise(hour.date);
          const hourHasSunset = isSunset(hour.date);

          // Special classes for sunrise/sunset hours
          const specialClasses = hourHasSunrise
            ? "sunrise-hour"
            : hourHasSunset
            ? "sunset-hour"
            : "";

          // Background based on daytime/nighttime
          const timeClass = hourIsDaytime
            ? "day-background"
            : "night-background";

          return (
            <div
              key={index}
              className={`forecast-item ${timeClass} ${specialClasses}`}
            >
              <div className="forecast-time">
                {formatHour(hour.date)}
                {hourHasSunrise && (
                  <div className="celestial-marker sunrise-marker">↑</div>
                )}
                {hourHasSunset && (
                  <div className="celestial-marker sunset-marker">↓</div>
                )}
              </div>

              <div className="forecast-icon">
                <WeatherIcon
                  condition={hour.condition}
                  isDaytime={hourIsDaytime}
                  size={32}
                />
              </div>

              <div className="forecast-condition">{hour.condition}</div>
              <div className="forecast-temp">{hour.temperature}°</div>

              {/* Show wind in both compact and expanded view */}
              <div className="forecast-wind">
                <Wind size={12} />
                <span>{hour.windSpeed} mph</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ForecastDisplay;
