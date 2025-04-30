// components/weather/ForecastDisplay.jsx
import React from 'react';
import useWeather from '../../hooks/useWeather';
import ForecastItem from './ForecastItem';

const ForecastDisplay = () => {
  const { forecast } = useWeather();

  if (!forecast || forecast.length === 0) {
    return (
      <div className="forecast-display card">
        <div className="empty-state">
          <p>No forecast data available. Please initialize weather settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="forecast-display card">
      <h2 className="text-center mb-4">24-Hour Forecast</h2>
      
      <div className="forecast-scroll">
        <div className="forecast-container flex overflow-x-auto gap-2 p-2">
          {forecast.map((hourData, index) => (
            <ForecastItem 
              key={index} 
              hourData={hourData} 
              isNow={index === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ForecastDisplay;