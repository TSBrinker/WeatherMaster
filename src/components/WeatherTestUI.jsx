// components/WeatherTestUI.jsx
import React, { useState, useEffect } from 'react';
import WeatherService from '../services/weather-service';

const WeatherTestUI = ({region}) => {
  const [weatherService] = useState(() => new WeatherService());
  const [biome, setBiome] = useState('temperate');
  const [season, setSeason] = useState('auto');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [forecast, setForecast] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [currentSeason, setCurrentSeason] = useState('');
  const [previousWeather, setPreviousWeather] = useState(null);
  
  // State for collapsible weather effects
  const [effectsCollapsed, setEffectsCollapsed] = useState(false);
  
  // State for custom time input
  const [customHours, setCustomHours] = useState(1);

  // Initialize weather on first load
  useEffect(() => {
    if (!initialized) {
      const actualSeason = season === 'auto' ? weatherService.getSeasonFromDate(currentDate) : season;
      setCurrentSeason(actualSeason);
      
      const currentWeather = weatherService.initializeWeather(biome, season, currentDate);
      setPreviousWeather(currentWeather);
      
      updateForecastDisplay();
      setInitialized(true);
    }
  }, [initialized, biome, season, weatherService, currentDate]);

  // Update the forecast display
  const updateForecastDisplay = () => {
    const newForecast = weatherService.get24HourForecast();
    setForecast(newForecast);
    
    // Track weather changes for debugging
    if (previousWeather && newForecast.length > 0) {
      if (previousWeather.condition !== newForecast[0].condition) {
        // Weather changed - could log this if needed
      }
      setPreviousWeather(newForecast[0]);
    }
  };

  useEffect(() => {
    if (region) {
      setBiome(region.climate);
      // Re-initialize weather with new climate
      weatherService.initializeWeather(region.climate, season, currentDate);
      updateForecastDisplay();
    }
  }, [region]);

  // Progress time by specified hours
  const advanceTime = (hours) => {
    const newDate = new Date(currentDate);
    newDate.setHours(newDate.getHours() + hours);
    
    // Determine season from the new date if set to auto
    const actualSeason = season === 'auto' ? weatherService.getSeasonFromDate(newDate) : season;
    setCurrentSeason(actualSeason);
    
    weatherService.advanceTime(hours, biome, season, currentDate);
    setCurrentDate(newDate);
    updateForecastDisplay();
  };

  // Apply weather settings
  const applySettings = () => {
    const actualSeason = season === 'auto' ? weatherService.getSeasonFromDate(currentDate) : season;
    setCurrentSeason(actualSeason);
    
    weatherService.initializeWeather(biome, season, currentDate);
    updateForecastDisplay();
  };

  // Check if it's day or night
  const isDaytime = (date) => {
    const hour = date.getHours();
    // Simple approximation: daytime is 6 AM to 6 PM
    return hour >= 6 && hour < 18;
  };

  // Get weather icon based on condition and time of day
  const getWeatherIcon = (condition, date) => {
    const daytime = isDaytime(date);
    
    switch (condition) {
      case 'Clear Skies':
        return daytime ? '☀️' : '🌙';
      case 'Light Clouds':
        return daytime ? '🌤️' : '☁️';
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

  // Get celestial event icon
  const getCelestialIcon = (hour) => {
    if (hour.hasMeteorImpact) {
      return '💥';
    } else if (hour.hasShootingStar) {
      return '☄️';
    }
    return null;
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

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format hour for display in forecast (just hour, no minutes)
  const formatHour = (date) => {
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      hour12: true
    });
  };
  
  // Get background color based on weather condition
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>GM Weather Companion - Test UI</h1>
        <button style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>⚙️</button>
      </div>
      
      {/* Navigation / Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        alignItems: 'center'
      }}>
        <div>
          <label htmlFor="biome-select">Biome: </label>
          <select
            id="biome-select"
            value={biome}
            onChange={(e) => setBiome(e.target.value)}
            style={{ padding: '5px' }}
          >
            <option value="temperate">Temperate</option>
            <option value="desert">Desert</option>
            <option value="arctic">Arctic</option>
            <option value="tropical">Tropical</option>
            <option value="coastal">Coastal</option>
            <option value="mountain">Mountain</option>
            <option value="forest">Forest</option>
            <option value="swamp">Swamp</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="season-select">Season: </label>
          <select
            id="season-select"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            style={{ padding: '5px' }}
          >
            <option value="auto">Auto (from date)</option>
            <option value="winter">Winter</option>
            <option value="spring">Spring</option>
            <option value="summer">Summer</option>
            <option value="fall">Fall</option>
          </select>
        </div>
        
        <button 
          onClick={applySettings}
          style={{ 
            padding: '5px 10px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Apply Settings
        </button>
        
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold' }}>{formatDate(currentDate)}</div>
          {season === 'auto' && <div>Season: {currentSeason}</div>}
        </div>
      </div>
      
      {/* Main Content - 2 Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Left Column */}
        <div>
          {/* Current Weather */}
          {forecast.length > 0 && (
            <div style={{ 
              padding: '20px', 
              backgroundColor: getWeatherBackground(forecast[0].condition), 
              borderRadius: '8px', 
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ textAlign: 'center', marginBottom: '15px' }}>Current Weather</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '4rem', marginRight: '20px', position: 'relative' }}>
                  {getWeatherIcon(forecast[0].condition, forecast[0].date)}
                  
                  {/* Celestial event icon */}
                  {getCelestialIcon(forecast[0]) && (
                    <span style={{ 
                      position: 'absolute', 
                      top: '-10px', 
                      right: '-15px', 
                      fontSize: '1.5rem'
                    }}>
                      {getCelestialIcon(forecast[0])}
                    </span>
                  )}
                  
                  {/* Wind icon */}
                  {getWindIcon(forecast[0].windIntensity) && (
                    <span style={{ 
                      position: 'absolute', 
                      bottom: '-10px', 
                      right: '-15px', 
                      fontSize: '1.5rem'
                    }}>
                      {getWindIcon(forecast[0].windIntensity)}
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '5px' }}>
                    {forecast[0].condition}
                    {forecast[0].hasShootingStar && (
                      <span style={{ marginLeft: '10px', color: '#b5651d', fontSize: '1.2rem' }}>
                        A shooting star!
                      </span>
                    )}
                    {forecast[0].hasMeteorImpact && (
                      <span style={{ marginLeft: '10px', color: '#b5651d', fontSize: '1.2rem' }}>
                        with Meteor Impact!!!
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '2.2rem', marginBottom: '10px' }}>
                    {forecast[0].temperature}°F
                  </div>
                  <div style={{ 
                    fontSize: '1.1rem', 
                    display: 'flex', 
                    alignItems: 'center',
                    padding: '5px 10px',
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    borderRadius: '5px',
                    width: 'fit-content'
                  }}>
                    {getWindIcon(forecast[0].windIntensity) && (
                      <span style={{ marginRight: '5px' }}>
                        {getWindIcon(forecast[0].windIntensity)}
                      </span>
                    )}
                    <span>
                      {forecast[0].windIntensity} - {forecast[0].windSpeed} mph {forecast[0].windDirection}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Collapsible Weather Effects */}
              <div 
                style={{ 
                  cursor: 'pointer', 
                  padding: '10px', 
                  backgroundColor: 'rgba(255,255,255,0.5)', 
                  borderRadius: '5px',
                  marginBottom: effectsCollapsed ? '0' : '10px'
                }}
                onClick={() => setEffectsCollapsed(!effectsCollapsed)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>Weather Effects</h3>
                  <span>{effectsCollapsed ? '▼' : '▲'}</span>
                </div>
              </div>
              
              {!effectsCollapsed && (
                <div style={{ 
                  padding: '15px', 
                  backgroundColor: 'rgba(255,255,255,0.7)', 
                  borderRadius: '0 0 5px 5px',
                  height: '150px',
                  overflowY: 'auto'
                }}>
                  <p style={{ whiteSpace: 'pre-line' }}>{forecast[0].effects}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Time Controls */}
          <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '20px' }}>
            <h2>Time Controls</h2>
            
            {/* Day/Night Cycle */}
            <div style={{ 
              position: 'relative',
              height: '40px',
              borderRadius: '15px',
              marginTop: '35px',
              marginBottom: '35px',
              overflow: 'hidden',
              background: 'linear-gradient(to right, #0c1445 0%, #0c1445 20%, #5b6ee1 30%, #f9d71c 50%, #e86f2d 70%, #0c1445 80%, #0c1445 100%)'
            }}>
              {/* Time markers */}
              <div style={{ position: 'absolute', left: '6.25%', top: 0, height: '100%', width: '2px', backgroundColor: 'rgba(255,255,255,0.5)' }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-35px', 
                  left: '-12px', 
                  fontSize: '1.2rem',
                  color: '#333' 
                }}>
                  🌙
                </div>
                <span style={{ 
                  position: 'absolute', 
                  top: '-14px', 
                  left: '-20px', 
                  fontSize: '0.7rem', 
                  color: '#333',
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  padding: '1px 4px',
                  borderRadius: '2px'
                }}>
                  3 AM
                </span>
              </div>

              <div style={{ position: 'absolute', left: '25%', top: 0, height: '100%', width: '2px', backgroundColor: 'rgba(255,255,255,0.5)' }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-35px', 
                  left: '-12px', 
                  fontSize: '1.2rem',
                  color: '#333' 
                }}>
                  🌅
                </div>
                <span style={{ 
                  position: 'absolute', 
                  top: '-14px', 
                  left: '-20px', 
                  fontSize: '0.7rem', 
                  color: '#333',
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  padding: '1px 4px',
                  borderRadius: '2px'
                }}>
                  6 AM
                </span>
              </div>

              <div style={{ position: 'absolute', left: '50%', top: 0, height: '100%', width: '2px', backgroundColor: 'rgba(255,255,255,0.5)' }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-35px', 
                  left: '-12px', 
                  fontSize: '1.2rem',
                  color: '#333' 
                }}>
                  ☀️
                </div>
                <span style={{ 
                  position: 'absolute', 
                  top: '-14px', 
                  left: '-20px', 
                  fontSize: '0.7rem', 
                  color: '#333',
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  padding: '1px 4px',
                  borderRadius: '2px'
                }}>
                  12 PM
                </span>
              </div>

              <div style={{ position: 'absolute', left: '75%', top: 0, height: '100%', width: '2px', backgroundColor: 'rgba(255,255,255,0.5)' }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-35px', 
                  left: '-12px', 
                  fontSize: '1.2rem',
                  color: '#333' 
                }}>
                  🌇
                </div>
                <span style={{ 
                  position: 'absolute', 
                  top: '-14px', 
                  left: '-20px', 
                  fontSize: '0.7rem', 
                  color: '#333',
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  padding: '1px 4px',
                  borderRadius: '2px'
                }}>
                  6 PM
                </span>
              </div>

              {/* Current time marker */}
              {forecast.length > 0 && (
                <div style={{ 
                  position: 'absolute', 
                  left: `${(forecast[0].date.getHours() / 24) * 100}%`, 
                  top: 0, 
                  height: '100%', 
                  width: '3px', 
                  backgroundColor: 'white',
                  boxShadow: '0 0 5px rgba(255,255,255,0.8)',
                  zIndex: 10
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '-8px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    boxShadow: '0 0 5px rgba(255,255,255,0.8)'
                  }}></div>
                  <span style={{ 
                    position: 'absolute', 
                    top: '45px', 
                    left: '-25px', 
                    fontSize: '0.9rem', 
                    color: '#333',
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    padding: '2px 8px',
                    borderRadius: '3px',
                    fontWeight: 'bold'
                  }}>
                    {formatHour(forecast[0].date)}
                  </span>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button 
                onClick={() => advanceTime(1)} 
                style={{ 
                  flex: '1', 
                  padding: '10px', 
                  cursor: 'pointer',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                +1 Hour
              </button>
              <button 
                onClick={() => advanceTime(4)} 
                style={{ 
                  flex: '1', 
                  padding: '10px', 
                  cursor: 'pointer',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                +4 Hours
              </button>
              <button 
                onClick={() => advanceTime(24)} 
                style={{ 
                  flex: '1', 
                  padding: '10px', 
                  cursor: 'pointer',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                +24 Hours
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="number" 
                min="1"
                value={customHours}
                onChange={(e) => setCustomHours(parseInt(e.target.value) || 1)}
                style={{ 
                  flex: '1', 
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                placeholder="Custom hours..."
              />
              <button 
                onClick={() => advanceTime(customHours)}
                style={{ 
                  padding: '8px 15px', 
                  backgroundColor: '#10b981',  
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer' 
                }}
              >
                Advance
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div>
          {/* Celestial Info */}
          <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '20px' }}>
            <h2>Celestial Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '15px 0' }}>
              <div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>Sunrise</div>
                <div>6:15 AM</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>Sunset</div>
                <div>6:45 PM</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>Moonrise</div>
                <div>8:30 PM</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>Moonset</div>
                <div>7:10 AM</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>Moon Phase</div>
                <div>Waxing Gibbous 🌔</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>Daylight</div>
                <div>12 hours</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 24-Hour Forecast */}
      <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>24-Hour Forecast</h2>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', padding: '10px 0' }}>
          {forecast.map((hour, index) => (
            <div key={index} style={{ 
              minWidth: '80px', 
              padding: '10px', 
              backgroundColor: (hour.hasShootingStar || hour.hasMeteorImpact) 
                ? (hour.hasMeteorImpact ? '#ffe0a3' : '#fff8e6') 
                : 'white', 
              borderRadius: '5px', 
              textAlign: 'center',
              position: 'relative',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '5px' }}>
                {formatHour(hour.date)}
              </div>
              <div style={{ fontSize: '1.5rem', marginBottom: '5px', position: 'relative' }}>
                {getWeatherIcon(hour.condition, hour.date)}
                
                {/* Celestial event indicator */}
                {getCelestialIcon(hour) && (
                  <div style={{ 
                    position: 'absolute',
                    top: '-5px',
                    right: '-10px',
                    fontSize: '0.8rem'
                  }}>
                    {getCelestialIcon(hour)}
                  </div>
                )}
              </div>
              <div style={{ fontWeight: 'bold' }}>{hour.condition}</div>
              <div>{hour.temperature}°F</div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#666', 
                marginTop: '5px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {getWindIcon(hour.windIntensity) && (
                  <span style={{ marginRight: '3px', fontSize: '0.9rem' }}>
                    {getWindIcon(hour.windIntensity)}
                  </span>
                )}
                <span>{hour.windSpeed} mph {hour.windDirection}</span>
              </div>
              
              {/* Meteor impact indicator */}
              {hour.hasMeteorImpact && (
                <div style={{ 
                  position: 'absolute', 
                  top: '-8px', 
                  right: '-8px', 
                  backgroundColor: 'red', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: '22px', 
                  height: '22px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '0.7rem', 
                  fontWeight: 'bold' 
                }}>
                  💥
                </div>
              )}
              
              {/* Shooting star indicator */}
              {hour.hasShootingStar && !hour.hasMeteorImpact && (
                <div style={{ 
                  position: 'absolute', 
                  top: '-8px', 
                  right: '-8px', 
                  backgroundColor: '#ffd700', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: '22px', 
                  height: '22px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '0.7rem', 
                  fontWeight: 'bold' 
                }}>
                  ☄️
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherTestUI;