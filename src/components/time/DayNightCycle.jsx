// components/time/DayNightCycle.jsx
import React from 'react';

const DayNightCycle = ({ currentDate }) => {
  // Constants for sunrise/sunset times (simplified for now)
  // In a real implementation, these would be calculated based on date and location
  const SUNRISE_HOUR = 6;
  const NOON_HOUR = 12;
  const SUNSET_HOUR = 18;
  const MIDNIGHT_HOUR = 0;
  
  // Current hour (0-23)
  const currentHour = currentDate.getHours();
  
  // Calculate the percentage through the day (0-100%)
  const calculateDayPercentage = () => {
    return (currentHour * 100) / 24;
  };
  
  // Determine if it's currently day or night
  const isDaytime = currentHour >= SUNRISE_HOUR && currentHour < SUNSET_HOUR;
  
  // Format hour for display
  const formatHour = (hour) => {
    const hourFormat = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${hourFormat} ${ampm}`;
  };
  
  return (
    <div className="day-night-cycle mb-6">
      <div className="cycle-visualization relative h-8 rounded-full overflow-hidden mb-1">
        {/* Gradient background to represent day/night */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-blue-500 to-indigo-900" 
             style={{ 
               backgroundImage: 'linear-gradient(to right, #0c1445 0%, #0c1445 20%, #5b6ee1 30%, #f9d71c 50%, #e86f2d 70%, #0c1445 80%, #0c1445 100%)'
             }}>
        </div>
        
        {/* Time markers */}
        <div className="marker sunrise absolute h-full" style={{ left: `${(SUNRISE_HOUR / 24) * 100}%`, width: '2px', backgroundColor: 'rgba(255, 255, 255, 0.5)' }}></div>
        <div className="marker noon absolute h-full" style={{ left: `${(NOON_HOUR / 24) * 100}%`, width: '2px', backgroundColor: 'rgba(255, 255, 255, 0.5)' }}></div>
        <div className="marker sunset absolute h-full" style={{ left: `${(SUNSET_HOUR / 24) * 100}%`, width: '2px', backgroundColor: 'rgba(255, 255, 255, 0.5)' }}></div>
        <div className="marker midnight absolute h-full" style={{ left: `${(MIDNIGHT_HOUR / 24) * 100}%`, width: '2px', backgroundColor: 'rgba(255, 255, 255, 0.5)' }}></div>
        
        {/* Current time indicator */}
        <div className="current-time-marker absolute h-full" 
             style={{ 
               left: `${calculateDayPercentage()}%`, 
               width: '3px', 
               backgroundColor: 'white',
               boxShadow: '0 0 10px white'
             }}>
        </div>
      </div>
      
      <div className="time-labels flex justify-between text-xs text-gray-400">
        <div>{formatHour(MIDNIGHT_HOUR)}</div>
        <div>{formatHour(SUNRISE_HOUR)}</div>
        <div>{formatHour(NOON_HOUR)}</div>
        <div>{formatHour(SUNSET_HOUR)}</div>
        <div>{formatHour(MIDNIGHT_HOUR)}</div>
      </div>
      
      <div className="current-time-info text-center mt-2">
        <span className="text-sm font-semibold">
          {formatHour(currentHour)}
          <span className="ml-2 text-xs">
            {isDaytime ? '☀️ Daytime' : '🌙 Nighttime'}
          </span>
        </span>
      </div>
    </div>
  );
};

export default DayNightCycle;