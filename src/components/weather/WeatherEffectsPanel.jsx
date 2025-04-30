// components/weather/WeatherEffectsPanel.jsx
import React, { useState } from 'react';
import useWeather from '../../hooks/useWeather';

const WeatherEffectsPanel = () => {
  const { currentWeather } = useWeather();
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (!currentWeather || !currentWeather.effects) {
    return null;
  }
  
  // Toggle panel expansion
  const togglePanel = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="weather-effects-panel card">
      <div 
        className="panel-header flex items-center justify-between p-4 cursor-pointer"
        onClick={togglePanel}
      >
        <h3 className="text-lg font-semibold">Game Effects</h3>
        <span className="toggle-icon">
          {isExpanded ? '▼' : '►'}
        </span>
      </div>
      
      {isExpanded && (
        <div className="panel-content p-4 bg-surface-light rounded-lg" style={{ minHeight: '100px' }}>
          <p style={{ whiteSpace: 'pre-line' }}>{currentWeather.effects}</p>
          
          {/* Special event effects */}
          {currentWeather.hasShootingStar && !currentWeather.hasMeteorImpact && (
            <div className="special-effect mt-4 p-3 bg-surface rounded-lg">
              <h4 className="font-semibold mb-2">
                <span role="img" aria-label="Shooting Star">☄️</span> Shooting Star Effect
              </h4>
              <p>Shooting stars streak across the night sky. All creatures gain 1 luck point as per the Lucky feat, which lasts until used or the weather changes.</p>
            </div>
          )}
          
          {currentWeather.hasMeteorImpact && (
            <div className="special-effect mt-4 p-3 bg-surface rounded-lg border-l-4 border-warning">
              <h4 className="font-semibold mb-2">
                <span role="img" aria-label="Meteor Impact">💥</span> Meteor Impact Effect
              </h4>
              <p>A blazing meteor crashes to earth somewhere within 1d100 miles! The ground trembles from the impact, and a bright flash illuminates the horizon. Rumors will soon spread of strange materials, valuable metals, or even magical properties at the impact site.</p>
            </div>
          )}
          
          {/* Wind effects based on intensity */}
          {currentWeather.windIntensity !== 'Calm' && currentWeather.windIntensity !== 'Breezy' && (
            <div className="wind-effect mt-4 p-3 bg-surface rounded-lg">
              <h4 className="font-semibold mb-2">
                <span role="img" aria-label="Wind">🌬️</span> {currentWeather.windIntensity} Wind Effects
              </h4>
              <p>
                {currentWeather.windIntensity === 'Windy' && 
                  'Moderate wind that raises dust and loose paper. Small branches move. Flying creatures can still maneuver normally.'}
                
                {currentWeather.windIntensity === 'Strong Winds' && 
                  'Strong wind creates whistling sounds. Small trees sway. Flying creatures gain +10 movement speed when moving with the wind, and –10 movement speed when moving against it. All ranged weapon attacks have a –2 to attack rolls.'}
                
                {currentWeather.windIntensity === 'Gale Force' && 
                  'Large branches move, whistling is heard. Flying creatures have disadvantage on Dexterity checks. Range for thrown weapons and projectiles is halved when shooting into the wind. Small flying creatures must make a DC 15 Strength check to fly against the wind.'}
                
                {currentWeather.windIntensity === 'Storm Force' && 
                  'Whole trees move, walking is difficult. Range for thrown weapons and projectiles is halved. All creatures have disadvantage on Perception checks that rely on hearing. Flying creatures must succeed on a DC 20 Strength check to fly against the wind or be pushed back 10 feet at the end of their turn. Small flying creatures cannot fly against the wind.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherEffectsPanel;