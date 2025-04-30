// components/weather/WindDisplay.jsx
import React from 'react';

const WindDisplay = ({ direction, speed, intensity }) => {
  // Get wind intensity icon based on intensity level
  const getWindIcon = () => {
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
  
  // Style classes based on wind intensity
  const getIntensityClass = () => {
    switch (intensity) {
      case 'Calm':
        return 'text-gray-400';
      case 'Breezy':
        return 'text-gray-100';
      case 'Windy':
        return 'text-warning font-semibold';
      case 'Strong Winds':
        return 'text-warning font-bold';
      case 'Gale Force':
        return 'text-danger font-bold';
      case 'Storm Force':
        return 'text-danger font-bold';
      default:
        return '';
    }
  };
  
  const windIcon = getWindIcon();
  const intensityClass = getIntensityClass();
  
  return (
    <div className="wind-display flex items-center">
      {windIcon && (
        <span className="wind-icon mr-2" role="img" aria-label={intensity}>
          {windIcon}
        </span>
      )}
      <span className={`wind-info ${intensityClass}`}>
        {intensity !== 'Calm' ? intensity : 'Calm'} - {speed} mph {direction}
      </span>
    </div>
  );
};

export default WindDisplay;