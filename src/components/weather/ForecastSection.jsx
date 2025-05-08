// src/components/weather/ForecastSection.jsx
import React from "react";
import ForecastDisplay from "./ForecastDisplay";

const ForecastSection = ({ forecast, latitudeBand }) => {
  return (
    <div className="forecast-section">
      <div className="card p-4">
        <h2 className="text-xl font-semibold mb-4">24-Hour Forecast</h2>
        <ForecastDisplay forecast={forecast} latitudeBand={latitudeBand} />
      </div>
    </div>
  );
};

export default ForecastSection;
