// components/weather/WeatherIcon.jsx
import React from 'react';

const WeatherIcon = ({ condition, hour = 12, size = 'medium' }) => {
  // Determine if it's day or night (simplified)
  const isNight = hour < 6 || hour >= 18;
  
  // Get the appropriate icon based on condition and time of day
  const getWeatherIcon = () => {
    switch (condition) {
      case 'Clear Skies':
        return isNight ? '🌙' : '☀️';
      case 'Light Clouds':
        return isNight ? '☁️🌙' : '🌤️';
      case 'Heavy Clouds':
        return '☁️';
      case 'Rain':
        return '🌧️';
      case 'Heavy Rain':
        return '⛈️';
      case 'Snow':
        return '❄️';
      case 'Freezing Cold':
        return '🥶';
      case 'Cold Winds':
        return '🌬️';
      case 'Scorching Heat':
        return '🔥';
      case 'Thunderstorm':
        return '⚡';
      case 'Blizzard':
        return '🌨️';
      case 'High Humidity Haze':
        return '🌫️';
      case 'Cold Snap':
        return '❄️';
      default:
        return '❓';
    }
  };
  
  // Determine size class
  const sizeClass = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl',
    xlarge: 'text-6xl'
  }[size] || 'text-2xl';
  
  return (
    <span className={`weather-icon ${sizeClass}`} role="img" aria-label={condition}>
      {getWeatherIcon()}
    </span>
  );
};

export default WeatherIcon;