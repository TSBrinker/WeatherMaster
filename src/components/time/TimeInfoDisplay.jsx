// components/time/TimeInfoDisplay.jsx
import React from 'react';

const TimeInfoDisplay = ({ currentDate }) => {
  // These would normally be calculated based on date, location, and other factors
  // For now, we're using simplified calculations
  
  // Calculate sunrise and sunset times (simplified)
  const calculateSunriseSunset = (date) => {
    // Base sunrise and sunset hours
    let sunriseHour = 6;
    let sunsetHour = 18;
    
    // Adjust based on month (very simplified seasonal changes)
    const month = date.getMonth(); // 0-11
    
    // Summer months have earlier sunrise and later sunset
    if (month >= 4 && month <= 8) { // May through September
      sunriseHour = 5;
      sunsetHour = 20;
    } 
    // Winter months have later sunrise and earlier sunset
    else if (month === 11 || month <= 1) { // December through February
      sunriseHour = 7;
      sunsetHour = 17;
    }
    
    // Create Date objects for sunrise and sunset
    const sunrise = new Date(date);
    sunrise.setHours(sunriseHour, 0, 0, 0);
    
    const sunset = new Date(date);
    sunset.setHours(sunsetHour, 0, 0, 0);
    
    return { sunrise, sunset };
  };
  
  // Calculate moonrise and moonset times (simplified)
  const calculateMoonriseMoonset = (date) => {
    // This is a very simplified calculation
    // Real calculations would be based on lunar phase and location
    
    // Base moonrise and moonset with a 12-hour offset from sun
    let moonriseHour = 18;
    let moonsetHour = 6;
    
    // Slight variation based on day of month to simulate lunar cycle
    const dayOfMonth = date.getDate();
    const offset = Math.floor(dayOfMonth / 3) % 4; // 0-3 hour offset
    
    moonriseHour = (moonriseHour + offset) % 24;
    moonsetHour = (moonsetHour + offset) % 24;
    
    // Create Date objects for moonrise and moonset
    const moonrise = new Date(date);
    moonrise.setHours(moonriseHour, 0, 0, 0);
    
    const moonset = new Date(date);
    moonset.setHours(moonsetHour, 0, 0, 0);
    
    return { moonrise, moonset };
  };
  
  // Calculate moon phase (simplified)
  const calculateMoonPhase = (date) => {
    // Very simplified calculation
    // Real calculations would be much more complex
    
    // Approximate lunar cycle (29.5 days)
    const lunarCycleLength = 29.5;
    
    // Days since January 1, 2000 (a known new moon)
    const startDate = new Date(2000, 0, 1);
    const daysSinceStart = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
    
    // Position in lunar cycle (0 to 1)
    const cyclePosition = (daysSinceStart % lunarCycleLength) / lunarCycleLength;
    
    // Determine phase
    if (cyclePosition < 0.025) return { name: 'New Moon', icon: '🌑' };
    if (cyclePosition < 0.125) return { name: 'Waxing Crescent', icon: '🌒' };
    if (cyclePosition < 0.25) return { name: 'First Quarter', icon: '🌓' };
    if (cyclePosition < 0.375) return { name: 'Waxing Gibbous', icon: '🌔' };
    if (cyclePosition < 0.475) return { name: 'Full Moon', icon: '🌕' };
    if (cyclePosition < 0.625) return { name: 'Waning Gibbous', icon: '🌖' };
    if (cyclePosition < 0.75) return { name: 'Last Quarter', icon: '🌗' };
    if (cyclePosition < 0.875) return { name: 'Waning Crescent', icon: '🌘' };
    return { name: 'New Moon', icon: '🌑' };
  };
  
  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };
  
  // Calculate daylight duration
  const calculateDaylightDuration = (sunrise, sunset) => {
    const durationMs = sunset - sunrise;
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${durationHours}h ${durationMinutes}m`;
  };
  
  // Calculate all the celestial information
  const { sunrise, sunset } = calculateSunriseSunset(currentDate);
  const { moonrise, moonset } = calculateMoonriseMoonset(currentDate);
  const moonPhase = calculateMoonPhase(currentDate);
  const daylightDuration = calculateDaylightDuration(sunrise, sunset);
  
  return (
    <div className="time-info-display card">
      <h3 className="card-title">Celestial Information</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="sun-info">
          <h4 className="text-lg font-semibold mb-2">
            <span role="img" aria-label="Sun">☀️</span> Sun
          </h4>
          
          <div className="info-list">
            <div className="info-item flex justify-between mb-1">
              <span className="label">Sunrise:</span>
              <span className="value">{formatTime(sunrise)}</span>
            </div>
            <div className="info-item flex justify-between mb-1">
              <span className="label">Sunset:</span>
              <span className="value">{formatTime(sunset)}</span>
            </div>
            <div className="info-item flex justify-between">
              <span className="label">Daylight:</span>
              <span className="value">{daylightDuration}</span>
            </div>
          </div>
        </div>
        
        <div className="moon-info">
          <h4 className="text-lg font-semibold mb-2">
            <span role="img" aria-label="Moon">{moonPhase.icon}</span> Moon
          </h4>
          
          <div className="info-list">
            <div className="info-item flex justify-between mb-1">
              <span className="label">Moonrise:</span>
              <span className="value">{formatTime(moonrise)}</span>
            </div>
            <div className="info-item flex justify-between mb-1">
              <span className="label">Moonset:</span>
              <span className="value">{formatTime(moonset)}</span>
            </div>
            <div className="info-item flex justify-between">
              <span className="label">Phase:</span>
              <span className="value">{moonPhase.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeInfoDisplay;