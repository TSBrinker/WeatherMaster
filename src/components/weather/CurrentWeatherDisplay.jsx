// components/weather/CurrentWeatherDisplay.jsx
import React from 'react';
import useWeather from '../../hooks/useWeather';
import WeatherIcon from './WeatherIcon';
import WindDisplay from './WindDisplay';
import CelestialEventIndicator from './CelestialEventIndicator';

const CurrentWeatherDisplay = () => {
  const { currentWeather, currentDate } = useWeather();

  if (!currentWeather) {
    return (
      <div className="current-weather card">
        <div className="empty-state">
          <p>No weather data available. Please initialize weather settings.</p>
        </div>
      </div>
    );
  }

  // Format date for display
  const formattedDate = currentDate.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    hour12: true
  });

  return (
    <div className="current-weather-display card">
      <h2 className="text-center mb-4">Current Weather</h2>
      <div className="weather-header flex items-center justify-center gap-4 mb-4">
        <div className="weather-icon-container" style={{ position: 'relative' }}>
          <WeatherIcon 
            condition={currentWeather.condition} 
            hour={currentDate.getHours()} 
            size="large" 
          />
          
          {/* Celestial event indicator */}
          {(currentWeather.hasShootingStar || currentWeather.hasMeteorImpact) && (
            <CelestialEventIndicator 
              hasShootingStar={currentWeather.hasShootingStar}
              hasMeteorImpact={currentWeather.hasMeteorImpact}
            />
          )}
        </div>
        
        <div className="weather-info">
          <div className="condition text-xl font-semibold mb-2">
            {currentWeather.condition}
          </div>
          <div className="temperature text-2xl font-bold mb-2">
            {currentWeather.temperature}°F
          </div>
          <WindDisplay 
            direction={currentWeather.windDirection}
            speed={currentWeather.windSpeed}
            intensity={currentWeather.windIntensity}
          />
        </div>
      </div>

      <div className="current-date text-center mb-4">
        {formattedDate}
      </div>
      
      {currentWeather.effects && (
        <div className="weather-effects p-4 rounded-lg bg-surface-light mb-4">
          <h3 className="text-lg font-semibold mb-2">Weather Effects:</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{currentWeather.effects}</p>
        </div>
      )}
    </div>
  );
};

export default CurrentWeatherDisplay;