// src/components/debug/MeteorologicalDebugPanel.jsx
import React, { useState } from "react";
import meteoUtils from "../../utils/meteoUtils";
import { usePreferences } from "../../contexts/PreferencesContext";

const MeteorologicalDebugPanel = ({ weatherData, region, weatherService }) => {
  const [debugMessage, setDebugMessage] = useState("");
  const { state: preferences } = usePreferences();

  // Helper to fix weather systems
  // const fixWeatherSystems = () => {
  //   if (!weatherService || !weatherService.weatherSystemService) {
  //     setDebugMessage("No weather service available to fix");
  //     return;
  //   }

  //   try {
  //     // Force reset everything
  //     meteoUtils.forceReset(weatherService);
  //     setDebugMessage(
  //       "Forced reset of weather systems. Refresh or advance time to see changes."
  //     );
  //   } catch (error) {
  //     setDebugMessage(`Error: ${error.message}`);
  //   }
  // };

  // Get the effective weather system type (region setting or global preference)
  const effectiveWeatherType =
    region?.weatherType || preferences?.weatherSystem || "diceTable";

  // Detailed diagnostic check
  let diagnosticMessage = "";

  if (!region) {
    diagnosticMessage = "No region data available";
  } else if (effectiveWeatherType !== "meteorological") {
    diagnosticMessage = `Region using '${effectiveWeatherType}' weather system instead of 'meteorological'. Global preference is: ${preferences.weatherSystem}`;
  } else if (!weatherData) {
    diagnosticMessage = "No weather data available";
  } else if (!weatherData._meteoData) {
    diagnosticMessage = "Weather data exists but no _meteoData property found";
  }

  // Show diagnostic info if needed
  if (diagnosticMessage) {
    return (
      <div className="p-4 bg-surface-light rounded-lg mb-4">
        <h3 className="text-lg font-semibold mb-3">Meteorological Debug</h3>
        <p className="mb-2">
          Not using meteorological system or no data available.
        </p>
        <div className="p-2 bg-red-900 rounded text-xs">
          <strong>Diagnostic:</strong> {diagnosticMessage}
        </div>

        {/* Dump raw data for inspection */}
        <div className="mt-3 p-2 bg-gray-800 rounded text-xs">
          <strong>Region data:</strong>
          <pre className="mt-1 overflow-auto max-h-24">
            {JSON.stringify(region, null, 2)}
          </pre>

          <strong className="mt-2 block">Weather data:</strong>
          <pre className="mt-1 overflow-auto max-h-24">
            {JSON.stringify(weatherData, null, 2)}
          </pre>

          <strong className="mt-2 block">Global Preferences:</strong>
          <pre className="mt-1 overflow-auto max-h-24">
            {JSON.stringify(preferences, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  const meteoData = weatherData._meteoData;
  const weatherSystems = meteoData.weatherSystems || [];

  return (
    <div className="p-4 bg-gray-900 rounded-lg mb-4 border border-blue-500 overflow-auto max-h-[80vh]">
      <h3 className="text-lg font-semibold mb-3 text-blue-400">
        Meteorological Debug Panel
      </h3>

      {/* Fix button */}
      {/* <div className="mb-4">
        <button
          onClick={fixWeatherSystems}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
        >
          Force Fix Weather Systems
        </button>
        {debugMessage && (
          <div className="mt-2 text-sm text-yellow-300">{debugMessage}</div>
        )}
      </div> */}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-2 bg-gray-800 p-3 rounded">
          <h4 className="font-medium text-blue-300 mb-2">Core Parameters</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">Temperature:</span>{" "}
              {Math.round(weatherData.temperature)}°F
            </div>
            <div>
              <span className="text-gray-400">Humidity:</span>{" "}
              {Math.round(meteoData.humidity)}%
            </div>
            <div>
              <span className="text-gray-400">Pressure:</span>{" "}
              {Math.round(meteoData.pressure)} hPa
            </div>
            <div>
              <span className="text-gray-400">Cloud Cover:</span>{" "}
              {Math.round(meteoData.cloudCover)}%
            </div>
            <div>
              <span className="text-gray-400">Precipitation:</span>{" "}
              {meteoData.precipAmount > 0
                ? `${(meteoData.precipAmount * 100).toFixed(1)}%`
                : "None"}
            </div>
            <div>
              <span className="text-gray-400">Instability:</span>{" "}
              {meteoData.instability?.toFixed(1) || 0}/10
            </div>
            <div>
              <span className="text-gray-400">Precipitation Potential:</span>{" "}
              {meteoData.precipitationPotential?.toFixed(1) || 0}%
            </div>
            <div>
              <span className="text-gray-400">Pressure Trend:</span>{" "}
              {meteoData.pressureTrend?.toFixed(2) || 0} hPa/hr
            </div>
          </div>
        </div>
      </div>

      {/* Weather Systems */}
      <div className="mb-4 bg-gray-800 p-3 rounded">
        <h4 className="font-medium text-blue-300 mb-2">Weather Systems</h4>
        {weatherSystems && weatherSystems.length > 0 ? (
          <div className="space-y-2">
            {weatherSystems.map((system, idx) => (
              <div
                key={idx}
                className="border border-gray-700 p-2 rounded text-sm"
              >
                <div className="flex justify-between">
                  <span className="text-yellow-300">{system.type}</span>
                  <span className="text-gray-400">
                    Age: {system.age}h / {system.maxAge}h
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <div>
                    <span className="text-gray-400">Intensity:</span>{" "}
                    {(system.intensity * 100).toFixed(0)}%
                  </div>
                  <div>
                    <span className="text-gray-400">Position:</span>{" "}
                    {system.position.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-gray-400">Movement:</span>{" "}
                    {system.movementSpeed.toFixed(2)} ×{" "}
                    {system.movementDirection > 0 ? "→" : "←"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <p className="text-red-400 font-bold">No active weather systems</p>
            <button
              onClick={fixWeatherSystems}
              className="mt-2 px-2 py-1 bg-red-700 text-white rounded text-xs"
            >
              Add Default Systems
            </button>
          </div>
        )}
      </div>

      {/* Wind Data */}
      <div className="bg-gray-800 p-3 rounded mb-4">
        <h4 className="font-medium text-blue-300 mb-2">Wind Analysis</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-400">Direction:</span>{" "}
            {weatherData.windDirection}
          </div>
          <div>
            <span className="text-gray-400">Speed:</span>{" "}
            {weatherData.windSpeed} mph
          </div>
          <div>
            <span className="text-gray-400">Intensity:</span>{" "}
            {weatherData.windIntensity}
          </div>
        </div>
      </div>

      {/* Recent Calculation */}
      <div className="bg-gray-800 p-3 rounded">
        <h4 className="font-medium text-blue-300 mb-2">Calculation Results</h4>
        <div className="text-sm">
          <div>
            <span className="text-gray-400">Condition:</span>{" "}
            {weatherData.condition}
          </div>
          <div>
            <span className="text-gray-400">Result Temp:</span>{" "}
            {weatherData.temperature}°F
          </div>
          <div className="mt-2 text-gray-400">Result Notes:</div>
          <div className="whitespace-pre-wrap text-xs mt-1 text-gray-300">
            {`${weatherData.condition} determined with:
Instability: ${meteoData.instability?.toFixed(1) || 0}/10
Precip Potential: ${meteoData.precipitationPotential?.toFixed(1) || 0}%
Cloud Cover: ${meteoData.cloudCover?.toFixed(1) || 0}%
Weather System Type: ${effectiveWeatherType}`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeteorologicalDebugPanel;
