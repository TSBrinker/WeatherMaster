// components/WeatherDashboard.jsx
import React, { useEffect } from 'react';
import useWeather from '../hooks/useWeather';
import useWorld from '../hooks/useWorld';

// Weather components
import CurrentWeatherDisplay from './weather/CurrentWeatherDisplay';
import WeatherEffectsPanel from './weather/WeatherEffectsPanel';
import ForecastDisplay from './weather/ForecastDisplay';
import WeatherControlPanel from './weather/WeatherControlPanel';

// Time components
import TimeControlPanel from './time/TimeControlPanel';
import TimeInfoDisplay from './time/TimeInfoDisplay';

const WeatherDashboard = () => {
  const { 
    currentDate, 
    isLoading, 
    error, 
    initialized,
    initializeWeather
  } = useWeather();
  
  const {
    getActiveWorld,
    getActiveRegion,
    getActiveLocation,
    loadWorlds
  } = useWorld();
  
  // Get active entities
  const activeWorld = getActiveWorld();
  const activeRegion = getActiveRegion();
  const activeLocation = getActiveLocation();
  
  // Load worlds on component mount
  useEffect(() => {
    loadWorlds();
  }, [loadWorlds]);
  
  // Initialize weather when location changes
  useEffect(() => {
    if (activeLocation && !initialized) {
      initializeWeather();
    }
  }, [activeLocation, initialized, initializeWeather]);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="weather-dashboard p-4">
        <div className="loading-state text-center py-10">
          <div className="text-xl mb-2">Loading weather data...</div>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="weather-dashboard p-4">
        <div className="error-state text-center py-10 text-danger">
          <div className="text-xl mb-2">Error loading weather data</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }
  
  // Render when no world/region/location is selected
  if (!activeWorld || !activeRegion || !activeLocation) {
    return (
      <div className="weather-dashboard p-4">
        <div className="empty-state text-center py-10">
          <div className="empty-state-icon">🌍</div>
          <div className="empty-state-title">No Location Selected</div>
          <div className="empty-state-desc">
            {!activeWorld 
              ? 'Please create or select a world to get started.' 
              : !activeRegion 
                ? 'Please create or select a region in this world.' 
                : 'Please create or select a location in this region.'}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="weather-dashboard p-4">
      <div className="location-header mb-6 text-center">
        <h1 className="text-2xl font-bold mb-1">
          {activeLocation.name}
        </h1>
        <div className="text-gray-400">
          {activeRegion.name}, {activeWorld.name}
        </div>
      </div>
      
      <div className="dashboard-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="main-column lg:col-span-2">
          <CurrentWeatherDisplay />
          <WeatherEffectsPanel />
          <ForecastDisplay />
        </div>
        
        <div className="sidebar-column">
          <WeatherControlPanel />
          <TimeControlPanel />
          <TimeInfoDisplay currentDate={currentDate} />
        </div>
      </div>
    </div>
  );
};

export default WeatherDashboard;