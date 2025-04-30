// components/weather/ForecastItem.jsx
import React from 'react';
import WeatherIcon from './WeatherIcon';
import CelestialEventIndicator from './CelestialEventIndicator';

const ForecastItem = ({ hourData, isNow }) => {
  // Helper to format the hour for display
  const formatHour = (date) => {
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      hour12: true
    });
  };
  
  // Get background color based on weather condition for visual cue
  const getWeatherBackground = (condition) => {
    switch (condition) {
      case 'Clear Skies':
        return 'rgba(233, 245, 219, 0.2)';
      case 'Light Clouds':
        return 'rgba(233, 245, 219, 0.1)';
      case 'Heavy Clouds':
        return 'rgba(216, 226, 220, 0.2)';
      case 'Rain':
        return 'rgba(207, 226, 243, 0.2)';
      case 'Heavy Rain':
        return 'rgba(182, 208, 226, 0.2)';
      case 'Snow':
        return 'rgba(232, 240, 240, 0.2)';
      case 'Freezing Cold':
        return 'rgba(224, 243, 248, 0.2)';
      case 'Scorching Heat':
        return 'rgba(255, 232, 214, 0.2)';
      case 'Thunderstorm':
        return 'rgba(201, 204, 213, 0.2)';
      case 'Blizzard':
        return 'rgba(213, 214, 234, 0.2)';
      default:
        return 'rgba(233, 245, 219, 0.1)';
    }
  };
  
  // Get wind intensity icon
  const getWindIcon = (intensity) => {
    switch (intensity) {
      case 'Calm':
        return null; // No icon for calm winds
      case 'Breezy':
        return '🍃';
      case 'Windy':
        return '💨';
      case 'Strong Winds':
        return '🌪️';
      case 'Gale Force':
        return '🌀';
      case 'Storm Force':
        return '🌪️';
      default:
        return null;
    }
  };
  
  return (
    <div 
      className={`forecast-item flex-shrink-0 w-24 p-3 rounded-lg text-center ${isNow ? 'bg-surface-light' : ''}`}
      style={{ 
        position: 'relative', 
        backgroundColor: isNow ? '' : getWeatherBackground(hourData.condition),
        border: isNow ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'
      }}
    >
      {/* Time indicator */}
      <div className="time text-sm text-gray-400 mb-1">
        {isNow ? 'Now' : formatHour(hourData.date)}
      </div>
      
      {/* Weather icon */}
      <div className="icon-container mb-2" style={{ position: 'relative' }}>
        <WeatherIcon 
          condition={hourData.condition} 
          hour={hourData.hour} 
          size="medium" 
        />
        
        {/* Celestial event indicator if applicable */}
        {(hourData.hasShootingStar || hourData.hasMeteorImpact) && (
          <CelestialEventIndicator 
            hasShootingStar={hourData.hasShootingStar}
            hasMeteorImpact={hourData.hasMeteorImpact}
          />
        )}
      </div>
      
      {/* Condition name (shortened for space) */}
      <div className="condition text-xs font-semibold mb-1" title={hourData.condition}>
        {hourData.condition.length > 12 
          ? hourData.condition.substring(0, 12) + '...' 
          : hourData.condition}
      </div>
      
      {/* Temperature */}
      <div className="temperature font-bold mb-1">
        {hourData.temperature}°F
      </div>
      
      {/* Wind info */}
      <div className="wind-info text-xs text-gray-400 flex items-center justify-center">
        {getWindIcon(hourData.windIntensity) && (
          <span className="wind-icon mr-1" style={{ fontSize: '0.7rem' }}>
            {getWindIcon(hourData.windIntensity)}
          </span>
        )}
        <span>{hourData.windSpeed} mph</span>
      </div>
    </div>
  );
};

export default ForecastItem;