// src/components/weather/ForecastDisplay.jsx

import React from "react";
import { getWeatherIcon, getWindIcon } from "../../utils/weatherUtils";

const ForecastDisplay = ({ forecast }) => {
  // Format hour without minutes
  const formatHour = (date) => {
    return date.toLocaleString("en-US", {
      hour: "numeric",
      hour12: true,
    });
  };

  return (
    <div className="card p-4">
      <h2 className="card-title mb-4">24-Hour Forecast</h2>

      <div className="forecast-scroll">
        <div className="flex gap-2 pb-2">
          {forecast.map((hour, index) => (
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
                {getWeatherIcon(hour.condition, hour.date.getHours())}
              </div>
              <div className="font-semibold mb-1">{hour.condition}</div>
              <div className="mb-2">{hour.temperature}°F</div>
              <div className="text-xs text-gray-400 flex items-center justify-center">
                {getWindIcon(hour.windIntensity) && (
                  <span className="mr-1">
                    {getWindIcon(hour.windIntensity)}
                  </span>
                )}
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default ForecastDisplay;
