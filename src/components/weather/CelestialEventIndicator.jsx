// components/weather/CelestialEventIndicator.jsx
import React from 'react';

const CelestialEventIndicator = ({ hasShootingStar, hasMeteorImpact }) => {
  // Determine the appropriate icon and style based on the event type
  if (hasMeteorImpact) {
    return (
      <div 
        className="celestial-event-indicator"
        style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          backgroundColor: 'red',
          color: 'white',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          boxShadow: '0 0 8px rgba(255, 0, 0, 0.7)'
        }}
        role="img"
        aria-label="Meteor Impact"
      >
        💥
      </div>
    );
  }
  
  if (hasShootingStar) {
    return (
      <div 
        className="celestial-event-indicator"
        style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          backgroundColor: 'gold',
          color: 'black',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          boxShadow: '0 0 5px rgba(255, 215, 0, 0.7)'
        }}
        role="img"
        aria-label="Shooting Star"
      >
        ☄️
      </div>
    );
  }
  
  return null;
};

export default CelestialEventIndicator;