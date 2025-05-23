// src/components/weather/CelestialInfo.jsx
import React from "react";
import { usePreferences } from "../../contexts/PreferencesContext";

const CelestialInfo = ({ celestialInfo }) => {
  const { state: preferences } = usePreferences();
  
  if (!celestialInfo) return null;

  // Format time based on preference
  const formatTime = (timeString) => {
    if (!timeString || timeString === "N/A") return timeString;
    
    if (preferences.timeFormat === '24hour') {
      // Parse the 12-hour format and convert to 24-hour
      const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let hour = parseInt(match[1]);
        const minute = match[2];
        const period = match[3].toUpperCase();
        
        if (period === 'PM' && hour !== 12) {
          hour += 12;
        } else if (period === 'AM' && hour === 12) {
          hour = 0;
        }
        
        return `${hour.toString().padStart(2, '0')}:${minute}`;
      }
    }
    
    // Return original format (12-hour) if not converting
    return timeString;
  };

  // Direct use of the values from celestialInfo
  const {
    sunriseTime = "N/A",
    sunsetTime = "N/A",
    moonriseTime = "N/A",
    moonsetTime = "N/A",
  } = celestialInfo;

  return (
    <div className="celestial-info">
      {/* Left column - Sun info */}
      <div className="celestial-info-left">
        <div className="celestial-time">
          <span className="label">Sunrise:</span> {formatTime(sunriseTime)}
        </div>
        <div className="celestial-time">
          <span className="label">Sunset:</span> {formatTime(sunsetTime)}
        </div>
      </div>

      {/* Right column - Moon info */}
      <div className="celestial-info-right">
        <div className="celestial-time">
          <span className="label">Moonrise:</span> {formatTime(moonriseTime)}
        </div>
        <div className="celestial-time">
          <span className="label">Moonset:</span> {formatTime(moonsetTime)}
        </div>
      </div>
    </div>
  );
};

export default CelestialInfo;