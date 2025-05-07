// src/components/weather/ForecastDisplay.jsx
import React from "react";
import sunriseSunsetService from "../../services/SunriseSunsetService";
import WeatherIcon from "./WeatherIcon";

const ForecastDisplay = ({ forecast, latitudeBand = "temperate" }) => {
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
    const { sunrise, sunset } = sunriseSunsetService.getFormattedSunriseSunset(
      latitudeBand,
      date
    );
    return date >= sunrise && date <= sunset;
  };

  return (
    <div className="card p-4">
      <h2 className="card-title mb-4">24-Hour Forecast</h2>

      <div className="forecast-scroll">
        <div className="flex gap-2 pb-2">
          {forecast.map((hour, index) => {
            const hourIsDaytime = isDaytime(hour.date);
            
            return (
            <div
              key={index}
              className={`forecast-item relative ${
                hour.hasShootingStar && !hour.hasMeteorImpact
                  ? "bg-amber-800 bg-opacity-20"
                  : hour.hasMeteorImpact
                  ? "bg-red-800 bg-opacity-20"
                  : "bg-surface-light"
              }`}
            >
              <div className="text-sm text-gray-400 mb-1">
                {formatHour(hour.date)}
              </div>
              <div className="text-2xl mb-1">
                <WeatherIcon 
                  condition={hour.condition} 
                  isDaytime={hourIsDaytime} 
                  size={32} 
                />
              </div>
              <div className="font-semibold mb-1">{hour.condition}</div>
              <div className="mb-2">{hour.temperature}°F</div>
              <div className="text-xs text-gray-400 flex items-center justify-center">
                <span className="mr-1">
                  <Wind size={12} />
                </span>
                <span>{hour.windSpeed} mph</span>
              </div>

              {/* Special event indicators */}
              {hour.hasMeteorImpact && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-sm">
                  💥
                </div>
              )}
              {hour.hasShootingStar && !hour.hasMeteorImpact && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-sm">
                  ☄️
                </div>
              )}
            </div>
          )})}
        </div>
      </div>
    </div>
  );
};

export default ForecastDisplay;