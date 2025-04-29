// WeatherTestUI.jsx
import React, { useState, useEffect } from 'react';
import WeatherService from '../services/weather-service';

const WeatherTestUI = () => {
  const [weatherService] = useState(() => new WeatherService());
  const [biome, setBiome] = useState('temperate');
  const [season, setSeason] = useState('auto');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [forecast, setForecast] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [currentSeason, setCurrentSeason] = useState('');
  const [previousWeather, setPreviousWeather] = useState(null);
  const [weatherTransitionLog, setWeatherTransitionLog] = useState([]);

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
        setWeatherTransitionLog(prevLog => [
          `${formatTime(previousWeather.date)} - ${previousWeather.condition} (${previousWeather.temperature}°F) → 
           ${formatTime(newForecast[0].date)} - ${newForecast[0].condition} (${newForecast[0].temperature}°F)`,
          ...prevLog.slice(0, 9) // Keep the last 10 entries
        ]);
      }
      setPreviousWeather(newForecast[0]);
    }
  };

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

  // Get weather icon based on condition
  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'Clear Skies':
        return '☀️';
      case 'Light Clouds':
        return '🌤️';
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
      case 'High Winds':
        return '💨';
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
  
  // Format time
  const formatTime = (date) => {
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>GM Weather Companion - Test UI</h1>
      
      {/* Controls */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
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
          style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Apply Settings
        </button>
        
        <div style={{ marginLeft: 'auto' }}>
          <strong>Current Date:</strong> {formatDate(currentDate)}
          {season === 'auto' && <div><strong>Season:</strong> {currentSeason}</div>}
        </div>
      </div>
      
      {/* Current Weather */}
      {forecast.length > 0 && (
        <div style={{ padding: '20px', backgroundColor: '#e9f5db', borderRadius: '8px', marginBottom: '20px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '15px' }}>Current Weather</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '4rem', marginRight: '20px' }}>
              {getWeatherIcon(forecast[0].condition)}
              {forecast[0].hasShootingStar && <span style={{ marginLeft: '10px', fontSize: '2rem' }}>☄️</span>}
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '5px' }}>
                {forecast[0].condition}
                {forecast[0].hasShootingStar && <span style={{ marginLeft: '10px', color: '#b5651d', fontSize: '1.2rem' }}>with Shooting Stars</span>}
              </div>
              <div style={{ fontSize: '2.2rem', marginBottom: '10px' }}>
                {forecast[0].temperature}°F
              </div>
              <div style={{ fontSize: '1.1rem' }}>
                Wind: {forecast[0].windSpeed} mph {forecast[0].windDirection}
              </div>
            </div>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <h3>Weather Effects:</h3>
            <p style={{ whiteSpace: 'pre-line' }}>{forecast[0].effects}</p>
          </div>
        </div>
      )}
      
      {/* Time Controls */}
      <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Time Controls</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button onClick={() => advanceTime(1)} style={{ flex: '1', padding: '10px', cursor: 'pointer' }}>
            +1 Hour
          </button>
          <button onClick={() => advanceTime(4)} style={{ flex: '1', padding: '10px', cursor: 'pointer' }}>
            +4 Hours
          </button>
          <button onClick={() => advanceTime(24)} style={{ flex: '1', padding: '10px', cursor: 'pointer' }}>
            +24 Hours
          </button>
        </div>
        
        <details>
          <summary style={{ cursor: 'pointer', padding: '10px', backgroundColor: '#eaeaea', borderRadius: '4px', marginBottom: '10px' }}>
            Custom Time Advance
          </summary>
          <div style={{ padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginTop: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input 
                type="number" 
                min="1"
                placeholder="Custom hours..."
                style={{ flex: '1', padding: '8px' }}
                id="custom-hours"
              />
              <button 
                onClick={() => {
                  const hours = parseInt(document.getElementById('custom-hours').value);
                  if (hours && hours > 0) advanceTime(hours);
                }}
                style={{ padding: '8px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Advance
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="date" 
                style={{ flex: '1', padding: '8px' }}
                id="target-date"
                defaultValue={currentDate.toISOString().split('T')[0]}
              />
              <button 
                onClick={() => {
                  const targetDate = new Date(document.getElementById('target-date').value);
                  const diffMs = targetDate - currentDate;
                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                  if (diffHours > 0) advanceTime(diffHours);
                }}
                style={{ padding: '8px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Jump to Date
              </button>
            </div>
          </div>
        </details>
      </div>
      
      {/* Weather Forecast */}
      <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>24-Hour Forecast</h2>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', padding: '10px 0' }}>
          {forecast.map((hour, index) => (
            <div key={index} style={{ 
              minWidth: '80px', 
              padding: '10px', 
              backgroundColor: hour.hasShootingStar ? '#fff3cd' : 'white', 
              borderRadius: '5px', 
              textAlign: 'center',
              position: 'relative',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '5px' }}>
                {formatHour(hour.date)}
              </div>
              <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>
                {getWeatherIcon(hour.condition)}
                {hour.hasShootingStar && <div style={{ fontSize: '0.8rem', display: 'inline-block', marginLeft: '2px' }}>☄️</div>}
              </div>
              <div style={{ fontWeight: 'bold' }}>{hour.condition}</div>
              <div>{hour.temperature}°F</div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                {hour.windSpeed} mph {hour.windDirection}
              </div>
              {hour.hasShootingStar && (
                <div style={{ 
                  position: 'absolute', 
                  top: '-5px', 
                  right: '-5px', 
                  backgroundColor: 'gold', 
                  color: 'black', 
                  borderRadius: '50%', 
                  width: '20px', 
                  height: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '0.7rem', 
                  fontWeight: 'bold'
                }}>
                  ★
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Weather Transition Log */}
      <details>
        <summary style={{ cursor: 'pointer', padding: '10px', backgroundColor: '#eaeaea', borderRadius: '4px', marginBottom: '10px' }}>
          Recent Weather Changes (Debug Info)
        </summary>
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '4px', 
          marginTop: '10px',
          fontSize: '0.9rem',
          fontFamily: 'monospace'
        }}>
          <h3>Weather Transitions</h3>
          <ul style={{ padding: '0 0 0 20px' }}>
            {weatherTransitionLog.map((log, index) => (
              <li key={index}>{log}</li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
};

export default WeatherTestUI;