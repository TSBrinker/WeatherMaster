// components/weather/ForecastDisplay.jsx
import React, { useState, useRef, useEffect } from "react";
import useRegionWeather from "../../hooks/useRegionWeather";
import ForecastItem from "./ForecastItem";

const ForecastDisplay = () => {
  // Get the forecast data from the region weather hook
  const { regionForecast } = useRegionWeather();

  // Local state for UI
  const [collapsed, setCollapsed] = useState(false);

  // Use a ref to store the forecast data to prevent re-renders
  const forecastRef = useRef(null);

  // Track first render
  const firstRenderRef = useRef(true);

  // Update the forecastRef when regionForecast changes
  useEffect(() => {
    // Only update on first render or when the forecast significantly changes
    if (
      firstRenderRef.current ||
      !forecastRef.current ||
      (regionForecast &&
        regionForecast.length > 0 &&
        (!forecastRef.current ||
          forecastRef.current.length === 0 ||
          // Check if the first hour has changed
          forecastRef.current[0]?.date.getTime() !==
            regionForecast[0]?.date.getTime()))
    ) {
      // Store the new forecast
      forecastRef.current = regionForecast;
      firstRenderRef.current = false;
    }
  }, [regionForecast]);

  // If there's no forecast data at all, don't render anything
  if (!forecastRef.current || forecastRef.current.length === 0) {
    return null;
  }

  // Use the stored forecast data from the ref
  const displayForecast = forecastRef.current;

  return (
    <div className="forecast-display card w-full max-w-full overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2>24-Hour Forecast</h2>
        <button className="btn btn-sm" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "Show Forecast" : "Hide Forecast"}
        </button>
      </div>

      {!collapsed && (
        <div className="forecast-scroll overflow-x-auto w-full">
          <div className="forecast-container flex gap-2 p-2 min-w-max">
            {displayForecast.map((hourData, index) => (
              <ForecastItem
                key={`forecast-${index}-${hourData.date.getTime()}`}
                hourData={hourData}
                isNow={index === 0}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(ForecastDisplay);
