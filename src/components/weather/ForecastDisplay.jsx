// src/components/weather/ForecastDisplay.jsx
import React from "react";
import { useEffect } from "react";
import { usePreferences } from "../../contexts/PreferencesContext";
import sunriseSunsetService from "../../services/SunriseSunsetService";
import { formatTemperature, formatWindSpeed } from "../../utils/unitConversions";
import WeatherIcon from "./WeatherIcon";
import { Wind, Sun, Moon } from "lucide-react";

const ForecastDisplay = ({
  forecast,
  latitudeBand = "temperate",
  celestialInfo,
  isExpanded = false,
}) => {
  const { state: preferences } = usePreferences();

  // Format hour with minutes based on time format preference
  const formatHour = (date) => {
    if (preferences.timeFormat === '24hour') {
      return date.toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Check if it's daytime for a given hour
  const isDaytime = (date) => {
    if (!celestialInfo || !celestialInfo.sunrise || !celestialInfo.sunset) {
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

  // Check if hour is during dawn or dusk
  const isDawnOrDusk = (date) => {
    if (!celestialInfo || !celestialInfo.sunrise || !celestialInfo.sunset) return false;
    
    const dateTime = date.getTime();
    const sunriseTime = celestialInfo.sunrise.getTime();
    const sunsetTime = celestialInfo.sunset.getTime();
    
    // Dawn: 1 hour before to 30 minutes after sunrise
    const dawnStart = sunriseTime - (60 * 60 * 1000); // 1 hour before
    const dawnEnd = sunriseTime + (30 * 60 * 1000); // 30 min after
    
    // Dusk: 30 minutes before to 1 hour after sunset
    const duskStart = sunsetTime - (30 * 60 * 1000); // 30 min before
    const duskEnd = sunsetTime + (60 * 60 * 1000); // 1 hour after
    
    return (dateTime >= dawnStart && dateTime <= dawnEnd) || 
           (dateTime >= duskStart && dateTime <= duskEnd);
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
          const hourIsDawnDusk = isDawnOrDusk(hour.date);
          const hourHasSunrise = isSunrise(hour.date);
          const hourHasSunset = isSunset(hour.date);

          // Special classes for sunrise/sunset hours
          // const specialClasses = hourHasSunrise
          //   ? "sunrise-hour"
          //   : hourHasSunset
          //   ? "sunset-hour"
          //   : "";

          // Background based on time of day
          const timeClass = hourIsDawnDusk 
            ? "dawn-dusk-background" 
            : hourIsDaytime 
            ? "day-background" 
            : "night-background";

          return (
            <div
              key={index}
              className={`forecast-item ${timeClass}`}
            >
              <div className="forecast-time">
                {formatHour(hour.date)}
                {/* {hourHasSunrise && (
                  <div className="celestial-marker sunrise-marker">↑</div>
                )}
                {hourHasSunset && (
                  <div className="celestial-marker sunset-marker">↓</div>
                )} */}
              </div>

              <div className="forecast-icon">
                <WeatherIcon
                  condition={hour.condition}
                  isDaytime={hourIsDaytime}
                  size={32}
                />
              </div>

              <div className="forecast-condition">{hour.condition}</div>
              <div className="forecast-temp">
                {formatTemperature(hour.temperature, preferences.temperatureUnit)}
              </div>

              {/* Show wind in both compact and expanded view */}
              <div className="forecast-wind">
                <Wind size={12} />
                <span>{formatWindSpeed(hour.windSpeed, preferences.windSpeedUnit)}</span>
              </div>
              
              {/* Day/Night indicator icon */}
              <div className="celestial-indicator">
                {hourIsDaytime ? (
                  <Sun size={14} className="text-yellow-400" />
                ) : (
                  <Moon size={14} className="text-blue-200" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ForecastDisplay;