import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Button } from 'react-bootstrap';
import { BiError } from 'react-icons/bi';
import { PreferencesProvider, usePreferences } from './contexts/PreferencesContext';
import { WorldProvider, useWorld } from './contexts/WorldContext';
import WorldSetup from './components/world/WorldSetup';
import RegionCreator from './components/region/RegionCreator';
import WeatherHeader from './components/header/WeatherHeader';
import FloatingMenuButton from './components/menu/FloatingMenuButton';
import HamburgerMenu from './components/menu/HamburgerMenu';
import PrimaryDisplay from './components/weather/PrimaryDisplay';
import WeekForecastStrip from './components/weather/WeekForecastStrip';
import DruidcraftForecast from './components/weather/DruidcraftForecast';
import DetailsCard from './components/weather/DetailsCard';
import WeatherDebug from './components/weather/WeatherDebug';
import WeatherTestHarness from './components/testing/WeatherTestHarness';
import WandererModal from './components/weather/WandererModal';
import weatherService from './services/weather/WeatherService';
import { calculateSkyGradient, parseTimeToHour } from './utils/skyGradientUtils';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';
import './styles/app.css';

// Check if test mode is enabled via URL parameter
const urlParams = new URLSearchParams(window.location.search);
const isTestMode = urlParams.get('test') === 'true';

// Loading screen phrases - randomly selected each load
const LOADING_PHRASES = [
  "Conjuring the skies...",
  "Summoning the winds...",
  "Reading the clouds...",
  "Consulting the stars...",
  "Brewing a storm...",
  "Charting the heavens...",
  "Gathering the mists...",
  "Divining the forecast...",
  "Whispering to the winds...",
  "Stirring the atmosphere...",
];

/**
 * Main App Content (needs to be inside WorldProvider)
 */
const AppContent = () => {
  const { activeWorld, activeRegion, selectRegion, advanceTime, jumpToDate, deleteRegion, scanWandererGates, isLoading } = useWorld();
  const { debugMode } = usePreferences();
  const [showWorldSetup, setShowWorldSetup] = useState(false);
  const [showRegionCreator, setShowRegionCreator] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // REAL weather and celestial data
  const [weatherData, setWeatherData] = useState(null);

  // Wanderer event state (for dramatic modal)
  const [wandererEvent, setWandererEvent] = useState(null);

  // Loading screen state: show for minimum 1.5s OR until data loads, then fade out
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [loadingFadeOut, setLoadingFadeOut] = useState(false);
  const minLoadTimeElapsed = useRef(false);
  const dataLoaded = useRef(false);
  const loadingPhrase = useRef(LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)]);

  // Track minimum load time (1.5 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      minLoadTimeElapsed.current = true;
      // If data already loaded, trigger fade out
      if (dataLoaded.current) {
        setLoadingFadeOut(true);
        setTimeout(() => setShowLoadingScreen(false), 400); // match CSS transition
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Track when data finishes loading
  useEffect(() => {
    if (!isLoading) {
      dataLoaded.current = true;
      // If minimum time already elapsed, trigger fade out
      if (minLoadTimeElapsed.current) {
        setLoadingFadeOut(true);
        setTimeout(() => setShowLoadingScreen(false), 400); // match CSS transition
      }
    }
  }, [isLoading]);

  useEffect(() => {
    if (activeWorld && activeRegion) {
      // Generate complete weather data using weather service
      const weather = weatherService.getCurrentWeather(activeRegion, activeWorld.currentDate);
      setWeatherData(weather);
    }
  }, [activeWorld?.currentDate, activeRegion]);

  // Sky gradient state for cross-fade animation
  const [currentGradient, setCurrentGradient] = useState('linear-gradient(135deg, #1e293b 0%, #0f172a 100%)');
  const [previousGradient, setPreviousGradient] = useState('linear-gradient(135deg, #1e293b 0%, #0f172a 100%)');
  const [gradientOpacity, setGradientOpacity] = useState(1);

  // Update sky gradient with cross-fade animation
  useEffect(() => {
    if (activeWorld && weatherData) {
      const hour = activeWorld.currentDate?.hour ?? 12;
      const sunriseHour = parseTimeToHour(weatherData.celestial?.sunriseTime);
      const sunsetHour = parseTimeToHour(weatherData.celestial?.sunsetTime);
      const condition = weatherData.condition || '';

      const newGradient = calculateSkyGradient(hour, sunriseHour, sunsetHour, condition);

      // Only animate if gradient actually changed
      if (newGradient !== currentGradient) {
        // Store old gradient as previous, set new gradient, start at opacity 0
        setPreviousGradient(currentGradient);
        setCurrentGradient(newGradient);
        setGradientOpacity(0);

        // Trigger fade-in on next frame
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setGradientOpacity(1);
          });
        });
      }
    }
  }, [activeWorld?.currentDate?.hour, weatherData?.celestial, weatherData?.condition]);

  // Wrapper for advanceTime that handles wanderer interruptions
  const handleAdvanceTime = useCallback((hours) => {
    const result = advanceTime(hours);
    if (result?.interrupted && result?.wanderer) {
      setWandererEvent(result.wanderer);
    }
    return result;
  }, [advanceTime]);

  // Wrapper for jumpToDate that handles wanderer interruptions
  const handleJumpToDate = useCallback((year, month, day, hour) => {
    const result = jumpToDate(year, month, day, hour);
    if (result?.interrupted && result?.wanderer) {
      setWandererEvent(result.wanderer);
    }
    return result;
  }, [jumpToDate]);

  // Handler for dismissing the wanderer modal
  const handleWandererDismiss = useCallback(() => {
    setWandererEvent(null);
    // Re-scan for gates from the new position
    if (activeRegion && activeWorld?.currentDate) {
      scanWandererGates(activeRegion, activeWorld.currentDate);
    }
  }, [activeRegion, activeWorld?.currentDate, scanWandererGates]);

  // Show world setup if no world exists
  useEffect(() => {
    if (!activeWorld) {
      setShowWorldSetup(true);
    }
  }, [activeWorld]);

  const handleSetupComplete = () => {
    setShowWorldSetup(false);
  };

  // Loading screen - show while data loads (minimum 1.5s to prevent flicker)
  if (showLoadingScreen) {
    return (
      <div className={`loading-screen ${loadingFadeOut ? 'fade-out' : ''}`}>
        <div className="loading-content">
          <h1 className="loading-title">WeatherMaster</h1>
          <div className="loading-subtitle">{loadingPhrase.current}</div>
        </div>
      </div>
    );
  }

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
      {/* Sky gradient background with cross-fade */}
      <div
        className="sky-gradient-layer previous"
        style={{ background: previousGradient }}
      />
      <div
        className="sky-gradient-layer current"
        style={{ background: currentGradient, opacity: gradientOpacity }}
      />

      {/* iOS Lock Screen-style header with time controls */}
      <WeatherHeader
        currentDate={activeWorld.currentDate}
        onAdvanceTime={handleAdvanceTime}
        onJumpToDate={handleJumpToDate}
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
                {/* Primary Display - HUGE location and temp + wind */}
                <PrimaryDisplay
                  region={activeRegion}
                  weather={weatherData}
                  world={activeWorld}
                  currentDate={activeWorld.currentDate}
                  weatherService={weatherService}
                />

                {/* 7-Day Forecast Strip - Always visible */}
                <WeekForecastStrip
                  region={activeRegion}
                  currentDate={activeWorld.currentDate}
                />

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

                {/* Druidcraft Forecast - 24h outlook */}
                <DruidcraftForecast
                  region={activeRegion}
                  currentDate={activeWorld.currentDate}
                  currentWeather={weatherData}
                />

                {/* Details Card - Combined conditions + celestial (collapsed) */}
                <DetailsCard weather={weatherData} />

                {/* Debug panel - only shown when debugMode is enabled */}
                {debugMode && <WeatherDebug weatherData={weatherData} />}
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

      {/* Wanderer Event Modal (dramatic full-screen for local falls) */}
      <WandererModal
        wanderer={wandererEvent}
        onDismiss={handleWandererDismiss}
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
