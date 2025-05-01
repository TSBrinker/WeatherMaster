// components/weather/ForecastDisplay.jsx

import React, { useState } from "react";
import useWeather from "../../hooks/useWeather";
import ForecastItem from "./ForecastItem";

const ForecastDisplay = () => {
  const { forecast } = useWeather();
  const [collapsed, setCollapsed] = useState(false);

  if (!forecast || forecast.length === 0) {
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
            {forecast.map((hourData, index) => (
              <ForecastItem
                key={index}
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

export default ForecastDisplay;
