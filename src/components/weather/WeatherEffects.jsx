// src/components/weather/WeatherEffects.jsx
import React from "react";

const WeatherEffects = ({ weatherEffects }) => {
  if (!weatherEffects) return null;

  return (
    <div className="weather-effects-section">
      <div className="card p-4">
        <h2 className="text-xl font-semibold mb-4">Weather Effects</h2>
        <div className="weather-effects-content">
          <p className="whitespace-pre-line">{weatherEffects}</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherEffects;
