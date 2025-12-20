import React, { useState, useEffect } from 'react';
import { Container, Button, Row, Col } from 'react-bootstrap';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { WorldProvider, useWorld } from './contexts/WorldContext';
import WorldSetup from './components/world/WorldSetup';
import RegionCreator from './components/region/RegionCreator';
import TimeDisplay from './components/time/TimeDisplay';
import TimeControls from './components/time/TimeControls';
import CurrentWeather from './components/weather/CurrentWeather';
import SettingsMenu from './components/menu/SettingsMenu';
import SunriseSunsetService from './services/celestial/SunriseSunsetService';
import MoonService from './services/celestial/MoonService';
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * Main App Content (needs to be inside WorldProvider)
 */
const AppContent = () => {
  const { activeWorld, activeRegion, selectRegion, advanceTime } = useWorld();
  const [showWorldSetup, setShowWorldSetup] = useState(false);
  const [showRegionCreator, setShowRegionCreator] = useState(false);

  // TEMPORARY: Fake weather data for testing (real celestial data)
  const [fakeWeather, setFakeWeather] = useState({
    temperature: 72,
    feelsLike: 70,
    condition: 'Clear Skies',
    windSpeed: 5,
    windDirection: 'NW'
  });

  // Calculate REAL celestial data
  const [celestialData, setCelestialData] = useState(null);

  useEffect(() => {
    if (activeWorld && activeRegion) {
      const hour = activeWorld.currentDate.hour;
      // Simulate temperature changes through the day
      const baseTemp = 60;
      const tempVariation = 15 * Math.sin((hour - 6) * Math.PI / 12);

      // Get REAL sunrise/sunset data
      const sunData = SunriseSunsetService.getFormattedTimes(
        activeRegion.latitudeBand,
        activeWorld.currentDate,
        false // 12-hour format
      );

      // Get REAL moon data
      const moonData = MoonService.getFormattedMoonInfo(
        activeWorld.currentDate,
        0, // θ_obs = 0° (default observer position)
        false // 12-hour format
      );

      // Combine into complete celestial data
      const combined = {
        sunriseTime: sunData.sunriseTime,
        sunsetTime: sunData.sunsetTime,
        dayLength: sunData.dayLength,
        isDaytime: sunData.isDaytime,
        twilightLevel: sunData.twilightLevel,
        distanceToSun: sunData.distanceToSun,
        isPermanentNight: sunData.isPermanentNight,
        moonPhase: moonData.phaseName,
        moonIcon: moonData.phaseIcon,
        moonIllumination: moonData.illumination,
        isWaxing: moonData.isWaxing,
        isMoonVisible: moonData.isMoonVisible,
        moonriseTime: moonData.moonriseTime,
        moonsetTime: moonData.moonsetTime,
        phaseAngle: moonData.phaseAngle // For debug display
      };

      setCelestialData(combined);

      setFakeWeather(prev => ({
        ...prev,
        temperature: Math.round(baseTemp + tempVariation),
        feelsLike: Math.round(baseTemp + tempVariation - 2)
      }));
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
      <SettingsMenu />
      <Container className="mt-4" fluid>
        <Row>
        {/* Sidebar: World & Region Management */}
        <Col md={4} lg={3} className="border-end">
          <h3>WeatherMaster 2.0</h3>
          <h5>{activeWorld.name}</h5>

          <hr />

          <h6>Regions ({activeWorld.regions.length})</h6>

          {activeWorld.regions.length === 0 ? (
            <div className="alert alert-info">
              <p className="small">Create a region to start tracking weather.</p>
              <Button size="sm" variant="primary" onClick={() => setShowRegionCreator(true)}>
                Create Region
              </Button>
            </div>
          ) : (
            <>
              <Button size="sm" variant="primary" onClick={() => setShowRegionCreator(true)} className="mb-2 w-100">
                + New Region
              </Button>

              <div className="list-group">
                {activeWorld.regions.map(region => (
                  <div
                    key={region.id}
                    className={`list-group-item list-group-item-action ${activeRegion?.id === region.id ? 'active' : ''}`}
                    onClick={() => selectRegion(region.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <h6 className="mb-1">{region.name}</h6>
                    <p className="mb-0 small">
                      {region.latitudeBand}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Col>

        {/* Main Content: Weather Dashboard */}
        <Col md={8} lg={9}>
          {!activeRegion ? (
            <div className="text-center mt-5">
              <h4 className="text-muted">Select a region to view weather</h4>
            </div>
          ) : (
            <>
              <h2>{activeRegion.name}</h2>
              <p className="text-muted">{activeRegion.climate?.templateDescription}</p>

              <TimeDisplay currentDate={activeWorld.currentDate} />

              <TimeControls onAdvanceTime={(hours) => advanceTime(hours)} />

              <CurrentWeather weather={fakeWeather} celestial={celestialData} />

              <div className="alert alert-info">
                <strong>Real Celestial Data!</strong> Sun/moon calculations using flat disc geometry. Weather generation coming next!
              </div>
            </>
          )}
        </Col>
        </Row>

        {/* Modals */}
        <RegionCreator
          show={showRegionCreator}
          onHide={() => setShowRegionCreator(false)}
        />
      </Container>
    </>
  );
};

/**
 * Root App Component
 */
const App = () => {
  return (
    <PreferencesProvider>
      <WorldProvider>
        <AppContent />
      </WorldProvider>
    </PreferencesProvider>
  );
};

export default App;
