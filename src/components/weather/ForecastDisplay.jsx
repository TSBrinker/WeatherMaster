// components/weather/ForecastDisplay.jsx
import React, { useState, useMemo } from "react";
import useUnifiedWeather from "../../hooks/useUnifiedWeather";
import ForecastItem from "./ForecastItem";

const ForecastDisplay = () => {
  // Get the forecast data from our unified weather hook
  const { regionForecast, forecastVersion } = useUnifiedWeather();

  // Local state for UI
  const [collapsed, setCollapsed] = useState(false);

  // Use useMemo to create a stable forecast array reference
  const stableForecast = useMemo(() => {
    return regionForecast || [];
  }, [regionForecast, forecastVersion]); // Only update when forecast changes or version increments

  // If there's no forecast data at all, don't render anything
  if (!stableForecast || stableForecast.length === 0) {
    return null;
  }

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
            {stableForecast.map((hourData, index) => (
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