import React, { useState, useEffect } from 'react';
import { Container, Button } from 'react-bootstrap';
import { BiError } from 'react-icons/bi';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { WorldProvider, useWorld } from './contexts/WorldContext';
import WorldSetup from './components/world/WorldSetup';
import RegionCreator from './components/region/RegionCreator';
import WeatherHeader from './components/header/WeatherHeader';
import FloatingMenuButton from './components/menu/FloatingMenuButton';
import HamburgerMenu from './components/menu/HamburgerMenu';
import PrimaryDisplay from './components/weather/PrimaryDisplay';
import ConditionsCard from './components/weather/ConditionsCard';
import CelestialCard from './components/weather/CelestialCard';
import DruidcraftForecast from './components/weather/DruidcraftForecast';
import DMForecastPanel from './components/weather/DMForecastPanel';
import WeatherDebug from './components/weather/WeatherDebug';
import WeatherTestHarness from './components/testing/WeatherTestHarness';
import weatherService from './services/weather/WeatherService';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';
import './styles/app.css';

// Check if test mode is enabled via URL parameter
const urlParams = new URLSearchParams(window.location.search);
const isTestMode = urlParams.get('test') === 'true';

/**
 * Main App Content (needs to be inside WorldProvider)
 */
const AppContent = () => {
  const { activeWorld, activeRegion, selectRegion, advanceTime, jumpToDate, deleteRegion } = useWorld();
  const [showWorldSetup, setShowWorldSetup] = useState(false);
  const [showRegionCreator, setShowRegionCreator] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // REAL weather and celestial data
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    if (activeWorld && activeRegion) {
      // Generate complete weather data using weather service
      const weather = weatherService.getCurrentWeather(activeRegion, activeWorld.currentDate);
      setWeatherData(weather);
    }
  }, [activeWorld?.currentDate, activeRegion]);

  // Show world setup if no world exists
  useEffect(() => {
    if (!activeWorld) {
      setShowWorldSetup(true);
    }
  }, [activeWorld]);

  const handleSetupComplete = () => {
    setShowWorldSetup(false);
  };

  if (!activeWorld) {
    return (
      <>
        <WorldSetup
          show={showWorldSetup}
          onHide={() => {}}
          onComplete={handleSetupComplete}
        />
        <Container className="mt-5 text-center">
          <h1>WeatherMaster 2.0</h1>
          <p>Create a world to get started</p>
        </Container>
      </>
    );
  }

  return (
    <>
      {/* iOS Lock Screen-style header with time controls */}
      <WeatherHeader
        currentDate={activeWorld.currentDate}
        onAdvanceTime={advanceTime}
        onJumpToDate={jumpToDate}
        celestialData={weatherData?.celestial}
      />

      {/* Main Content */}
      <Container className="mt-3" style={{ maxWidth: '900px' }}>
        {!activeRegion ? (
          <div className="text-center mt-5 py-5">
            <h4 className="text-muted mb-3">No region selected</h4>
            <Button variant="primary" onClick={() => setShowRegionCreator(true)}>
              Create Your First Region
            </Button>
          </div>
        ) : (
          <>
            {/* Weather data */}
            {weatherData && (
              <>
                {/* Primary Display - HUGE location and temp */}
                <PrimaryDisplay
                  region={activeRegion}
                  weather={weatherData}
                  world={activeWorld}
                  currentDate={activeWorld.currentDate}
                  weatherService={weatherService}
                />

                {/* Conditions Card - Wind, Humidity, Precip */}
                <ConditionsCard weather={weatherData} />

                {/* Celestial Card - Sun/Moon info */}
                <CelestialCard weather={weatherData} />

                {/* Active Weather Effects */}
                {weatherData.effects && weatherData.effects.length > 0 && (
                  <div className="alert alert-warning">
                    <strong><BiError /> Active Weather Effects:</strong>
                    <ul className="mb-0 mt-2">
                      {weatherData.effects.map((effect, idx) => (
                        <li key={idx}>{effect}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Druidcraft Forecast */}
                <DruidcraftForecast
                  region={activeRegion}
                  currentDate={activeWorld.currentDate}
                  currentWeather={weatherData}
                />

                {/* DM Forecast Panel */}
                <DMForecastPanel
                  region={activeRegion}
                  currentDate={activeWorld.currentDate}
                />

                {/* Debug panel */}
                <WeatherDebug weatherData={weatherData} />
              </>
            )}

            {!weatherData && (
              <div className="alert alert-info">
                Loading weather data...
              </div>
            )}
          </>
        )}
      </Container>

      {/* Floating menu button (bottom-right) - hidden when menu is open */}
      {!showMenu && <FloatingMenuButton onClick={() => setShowMenu(true)} />}

      {/* Locations menu */}
      <HamburgerMenu
        show={showMenu}
        onHide={() => setShowMenu(false)}
        regions={activeWorld.regions}
        activeRegion={activeRegion}
        onSelectRegion={selectRegion}
        onAddLocation={() => setShowRegionCreator(true)}
        onDeleteRegions={deleteRegion}
        worldName={activeWorld.name}
        currentDate={activeWorld.currentDate}
      />

      {/* Modals */}
      <RegionCreator
        show={showRegionCreator}
        onHide={() => setShowRegionCreator(false)}
      />
    </>
  );
};

/**
 * Root App Component
 */
const App = () => {
  // Test mode renders the weather test harness instead of the main app
  if (isTestMode) {
    return (
      <PreferencesProvider>
        <WeatherTestHarness />
      </PreferencesProvider>
    );
  }

  return (
    <PreferencesProvider>
      <WorldProvider>
        <AppContent />
      </WorldProvider>
    </PreferencesProvider>
  );
};

export default App;
