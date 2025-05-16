// src/components/weather/MeteorologicalParameters.jsx
import React from "react";

const MeteorologicalParameters = ({ weatherData }) => {
  // If using the dice table system or no meteo data, don't show anything
  if (!weatherData || !weatherData._meteoData) {
    return null;
  }

  const meteoData = weatherData._meteoData;

  return (
    <div className="p-4 bg-surface-light rounded-lg">
      <h3 className="text-lg font-semibold mb-3">
        Advanced Weather Parameters
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-400">Humidity</h4>
          <div className="text-xl">{Math.round(meteoData.humidity)}%</div>
        </div>

        <div>
          <h4 className="font-medium text-gray-400">Pressure</h4>
          <div className="text-xl">{Math.round(meteoData.pressure)} hPa</div>
        </div>

        <div>
          <h4 className="font-medium text-gray-400">Cloud Cover</h4>
          <div className="text-xl">{Math.round(meteoData.cloudCover)}%</div>
        </div>

        <div>
          <h4 className="font-medium text-gray-400">Precipitation</h4>
          <div className="text-xl">
            {meteoData.precipAmount > 0
              ? `${(meteoData.precipAmount * 100).toFixed(1)}%`
              : "None"}
          </div>
        </div>
      </div>

      {meteoData.instability > 0 && (
        <div className="mt-3">
          <h4 className="font-medium text-gray-400">Atmospheric Instability</h4>
          <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
            <div
              className="bg-blue-500 h-2.5 rounded-full"
              style={{ width: `${meteoData.instability * 10}%` }}
            ></div>
          </div>
          <div className="text-xs text-right mt-1">
            {meteoData.instability.toFixed(1)}/10
          </div>
        </div>
      )}

      {meteoData.pressureTrend !== undefined && (
        <div className="mt-3">
          <h4 className="font-medium text-gray-400">Pressure Trend</h4>
          <div className="flex items-center mt-1">
            {meteoData.pressureTrend < -0.5 && (
              <span className="text-red-400">↓ Falling</span>
            )}
            {meteoData.pressureTrend > 0.5 && (
              <span className="text-green-400">↑ Rising</span>
            )}
            {meteoData.pressureTrend >= -0.5 &&
              meteoData.pressureTrend <= 0.5 && (
                <span className="text-gray-400">→ Stable</span>
              )}
            <span className="text-sm ml-2">
              ({meteoData.pressureTrend > 0 ? "+" : ""}
              {meteoData.pressureTrend.toFixed(1)} hPa/hr)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeteorologicalParameters;
