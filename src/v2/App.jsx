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
import weatherService from './services/weather/WeatherService';
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * Main App Content (needs to be inside WorldProvider)
 */
const AppContent = () => {
  const { activeWorld, activeRegion, selectRegion, advanceTime } = useWorld();
  const [showWorldSetup, setShowWorldSetup] = useState(false);
  const [showRegionCreator, setShowRegionCreator] = useState(false);

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

              {weatherData && (
                <>
                  <CurrentWeather weather={weatherData} celestial={weatherData.celestial} />

                  {weatherData.effects && weatherData.effects.length > 0 && (
                    <div className="alert alert-warning">
                      <strong>Active Weather Effects:</strong>
                      <ul className="mb-0 mt-2">
                        {weatherData.effects.map((effect, idx) => (
                          <li key={idx}>{effect}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="alert alert-success">
                    <strong>Real Weather Generation Active!</strong> Weather pattern: {weatherData.pattern} (Day {weatherData._debug?.dayOfPattern})
                  </div>
                </>
              )}

              {!weatherData && (
                <div className="alert alert-info">
                  Loading weather data...
                </div>
              )}
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
