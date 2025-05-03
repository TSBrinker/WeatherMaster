// src/components/weather/WeatherDisplay.jsx

import React, { useState } from "react";
import { getWeatherIcon, getWindIcon } from "../../utils/weatherUtils";

const WeatherDisplay = ({ weather }) => {
  const [effectsCollapsed, setEffectsCollapsed] = useState(false);

  if (!weather) return null;

  return (
    <div className="card p-4">
      <h2 className="card-title mb-2">Current Weather</h2>

      <div className="flex items-center mb-4">
        <div className="text-5xl mr-4 relative">
          {getWeatherIcon(weather.condition, weather.date.getHours())}

          {/* Special event indicators */}
          {weather.hasShootingStar && (
            <span className="absolute -top-2 -right-2 text-lg">☄️</span>
          )}
          {weather.hasMeteorImpact && (
            <span className="absolute -top-2 -right-2 text-lg">💥</span>
          )}
        </div>

        <div>
          <div className="text-2xl font-bold mb-1">{weather.condition}</div>
          <div className="text-3xl mb-2">{weather.temperature}°F</div>
          <div className="flex items-center text-sm bg-surface-light p-2 rounded">
            {getWindIcon(weather.windIntensity) && (
              <span className="mr-1">{getWindIcon(weather.windIntensity)}</span>
            )}
            <span>
              {weather.windIntensity} • {weather.windSpeed} mph{" "}
              {weather.windDirection}
            </span>
          </div>
        </div>
      </div>

      {/* Weather effects */}
      <div>
        <div
          className="flex justify-between items-center p-2 bg-surface-light rounded cursor-pointer"
          onClick={() => setEffectsCollapsed(!effectsCollapsed)}
        >
          <h3 className="font-semibold">Weather Effects</h3>
          <span>{effectsCollapsed ? "▼" : "▲"}</span>
        </div>

        {!effectsCollapsed && (
          <div className="p-4 mt-2 bg-surface h-32 overflow-y-auto rounded">
            <p className="whitespace-pre-line">{weather.effects}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherDisplay;
