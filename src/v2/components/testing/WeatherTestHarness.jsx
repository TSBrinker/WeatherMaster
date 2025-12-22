import React, { useState } from 'react';
import { Container, Button, Card, ProgressBar, Table, Alert } from 'react-bootstrap';
import { regionTemplates } from '../../data/region-templates';
import { WeatherGenerator } from '../../services/weather/WeatherGenerator';
import { extractClimateProfile } from '../../data/templateHelpers';

/**
 * WeatherTestHarness - Comprehensive weather generation testing
 *
 * Tests all biomes across a full year with validation
 */
const WeatherTestHarness = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  const TEST_CONFIG = {
    year: 1,
    daysToTest: 365,
    hoursToTest: [0, 6, 12, 18], // Midnight, dawn, noon, dusk
    latitudeBands: ['central', 'subtropical', 'temperate', 'subarctic', 'polar']
  };

  const THRESHOLDS = {
    temperature: { min: -100, max: 150 },
    humidity: { min: 0, max: 100 },
    pressure: { min: 28, max: 32 },
    cloudCover: { min: 0, max: 100 },
    maxTempChangePerHour: 15 // Maximum realistic temp change in 1 hour
  };

  const validateWeather = (weather, context) => {
    const issues = [];

    if (typeof weather.temperature !== 'number' || isNaN(weather.temperature)) {
      issues.push('Invalid temperature');
    }
    if (typeof weather.humidity !== 'number' || isNaN(weather.humidity)) {
      issues.push('Invalid humidity');
    }

    if (weather.temperature < THRESHOLDS.temperature.min || weather.temperature > THRESHOLDS.temperature.max) {
      issues.push(`Temp out of range: ${weather.temperature}°F`);
    }

    if (weather.humidity < THRESHOLDS.humidity.min || weather.humidity > THRESHOLDS.humidity.max) {
      issues.push(`Humidity out of range: ${weather.humidity}%`);
    }

    if (weather.pressure && (weather.pressure < THRESHOLDS.pressure.min || weather.pressure > THRESHOLDS.pressure.max)) {
      issues.push(`Pressure out of range: ${weather.pressure} inHg`);
    }

    if (weather.precipitation && weather.precipitationType) {
      const temp = weather.temperature;
      const precipType = weather.precipitationType.toLowerCase();

      // Snow shouldn't occur above 35°F
      if (precipType.includes('snow') && temp > 35) {
        issues.push(`Snow at ${temp}°F`);
      }

      // Regular rain shouldn't occur below 35°F (but freezing-rain and sleet are valid)
      if (precipType === 'rain' && temp < 35) {
        issues.push(`Rain at ${temp}°F`);
      }

      // Freezing rain requires near-freezing temps
      if (precipType === 'freezing-rain' && (temp < 28 || temp > 35)) {
        issues.push(`Freezing rain at ${temp}°F (should be 28-35°F)`);
      }

      // Sleet occurs in two zones: 29-32°F (mixed with freezing rain) and 32-38°F (rain/snow transition)
      if (precipType === 'sleet' && (temp < 29 || temp > 38)) {
        issues.push(`Sleet at ${temp}°F (should be 29-38°F)`);
      }
    }

    return { isValid: issues.length === 0, issues };
  };

  const runTests = async () => {
    setIsRunning(true);
    setProgress(0);

    const stats = {
      totalTests: 0,
      successfulTests: 0,
      anomalies: [],
      transitionAnomalies: [],
      biomeStats: {}
    };

    const weatherGen = new WeatherGenerator();
    let completedTests = 0;

    // Calculate total tests
    const totalBiomes = TEST_CONFIG.latitudeBands.reduce((sum, band) => {
      return sum + Object.keys(regionTemplates[band] || {}).length;
    }, 0);
    const totalTests = totalBiomes * TEST_CONFIG.daysToTest * TEST_CONFIG.hoursToTest.length;

    // Test each latitude band
    for (const latitudeBand of TEST_CONFIG.latitudeBands) {
      const templates = regionTemplates[latitudeBand];
      if (!templates) continue;

      // Test each biome
      for (const [templateId, template] of Object.entries(templates)) {
        const biomeName = template.name;

        if (!stats.biomeStats[biomeName]) {
          stats.biomeStats[biomeName] = {
            tempMin: Infinity,
            tempMax: -Infinity,
            tempSum: 0,
            count: 0,
            precipCount: 0
          };
        }

        const region = {
          id: `test-${latitudeBand}-${templateId}`,
          name: `Test ${biomeName}`,
          latitudeBand: latitudeBand,
          templateId: templateId,
          climate: extractClimateProfile(template)
        };

        // Test full year
        let previousWeather = null;
        let previousDate = null;

        for (let day = 1; day <= TEST_CONFIG.daysToTest; day++) {
          const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          let remainingDays = day;
          let month = 0;
          while (remainingDays > monthDays[month]) {
            remainingDays -= monthDays[month];
            month++;
          }
          month++;

          for (const hour of TEST_CONFIG.hoursToTest) {
            const date = {
              year: TEST_CONFIG.year,
              month: month,
              day: remainingDays,
              hour: hour
            };

            try {
              const weather = weatherGen.generateWeather(region, date);

              const context = {
                biome: biomeName,
                latitudeBand: latitudeBand,
                date: `${date.month}/${date.day} ${date.hour}:00`
              };

              const validation = validateWeather(weather, context);

              stats.totalTests++;
              completedTests++;

              if (validation.isValid) {
                stats.successfulTests++;
              } else {
                stats.anomalies.push({
                  ...context,
                  issues: validation.issues
                });
              }

              // Check temperature transition smoothness
              if (previousWeather && previousDate) {
                const tempChange = Math.abs(weather.temperature - previousWeather.temperature);
                const hoursDiff = (date.day - previousDate.day) * 24 + (date.hour - previousDate.hour);

                // Only check consecutive test hours (6-hour gaps in our test)
                if (hoursDiff === 6) {
                  const maxChangeAllowed = THRESHOLDS.maxTempChangePerHour * hoursDiff;

                  if (tempChange > maxChangeAllowed) {
                    stats.transitionAnomalies.push({
                      biome: biomeName,
                      latitudeBand: latitudeBand,
                      from: `${previousDate.month}/${previousDate.day} ${previousDate.hour}:00`,
                      to: `${date.month}/${date.day} ${date.hour}:00`,
                      tempChange: `${previousWeather.temperature}°F → ${weather.temperature}°F (Δ${tempChange}°F)`,
                      precipChange: `${previousWeather.condition} → ${weather.condition}`
                    });
                  }
                }
              }

              previousWeather = weather;
              previousDate = date;

              // Track biome stats
              const biomeStats = stats.biomeStats[biomeName];
              biomeStats.tempMin = Math.min(biomeStats.tempMin, weather.temperature);
              biomeStats.tempMax = Math.max(biomeStats.tempMax, weather.temperature);
              biomeStats.tempSum += weather.temperature;
              biomeStats.count++;
              if (weather.precipitation) {
                biomeStats.precipCount++;
              }

              // Update progress every 1000 tests
              if (completedTests % 1000 === 0) {
                setProgress((completedTests / totalTests) * 100);
                // Allow UI to update
                await new Promise(resolve => setTimeout(resolve, 0));
              }

            } catch (error) {
              stats.anomalies.push({
                biome: biomeName,
                latitudeBand: latitudeBand,
                date: `${date.month}/${date.day} ${date.hour}:00`,
                issues: [`Exception: ${error.message}`]
              });
            }
          }
        }
      }
    }

    setProgress(100);
    setResults(stats);
    setIsRunning(false);
  };

  const downloadResults = () => {
    if (!results) return;

    const data = JSON.stringify(results, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather-test-results-${Date.now()}.json`;
    a.click();
  };

  return (
    <Container className="mt-5">
      <h1>Weather Generation Test Harness</h1>
      <p className="text-muted">
        Comprehensive testing of weather generation across all biomes and seasons
      </p>

      <Card className="mb-4">
        <Card.Body>
          <h5>Test Configuration</h5>
          <ul>
            <li>Biomes: All {Object.values(regionTemplates).reduce((sum, band) => sum + Object.keys(band).length, 0)} templates</li>
            <li>Days: {TEST_CONFIG.daysToTest} (full year)</li>
            <li>Hours per day: {TEST_CONFIG.hoursToTest.length} (midnight, 6am, noon, 6pm)</li>
            <li>Total tests: ~{(Object.values(regionTemplates).reduce((sum, band) => sum + Object.keys(band).length, 0) * TEST_CONFIG.daysToTest * TEST_CONFIG.hoursToTest.length).toLocaleString()}</li>
          </ul>

          <Button
            variant="primary"
            onClick={runTests}
            disabled={isRunning}
            size="lg"
          >
            {isRunning ? 'Running Tests...' : 'Run Test Harness'}
          </Button>

          {isRunning && (
            <div className="mt-3">
              <ProgressBar now={progress} label={`${progress.toFixed(1)}%`} animated />
              <small className="text-muted mt-2">This may take 10-30 seconds...</small>
            </div>
          )}
        </Card.Body>
      </Card>

      {results && (
        <>
          <Alert variant={results.anomalies.length === 0 && results.transitionAnomalies.length === 0 ? 'success' : 'warning'}>
            <h5>Test Results</h5>
            <p><strong>Total Tests:</strong> {results.totalTests.toLocaleString()}</p>
            <p><strong>Passed:</strong> {results.successfulTests.toLocaleString()}</p>
            <p><strong>Failed:</strong> {(results.totalTests - results.successfulTests).toLocaleString()}</p>
            <p><strong>Success Rate:</strong> {((results.successfulTests / results.totalTests) * 100).toFixed(2)}%</p>
            <p><strong>Validation Anomalies:</strong> {results.anomalies.length.toLocaleString()}</p>
            <p><strong>Transition Anomalies:</strong> {results.transitionAnomalies.length.toLocaleString()}</p>

            <Button variant="secondary" size="sm" onClick={downloadResults} className="mt-2">
              Download Full Results (JSON)
            </Button>
          </Alert>

          <Card className="mb-4">
            <Card.Header>
              <h5>Biome Statistics</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Biome</th>
                    <th>Temp Range</th>
                    <th>Avg Temp</th>
                    <th>Precip %</th>
                    <th>Samples</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(results.biomeStats).map(([name, stats]) => {
                    const avg = (stats.tempSum / stats.count).toFixed(1);
                    const precipPercent = ((stats.precipCount / stats.count) * 100).toFixed(1);
                    return (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>{stats.tempMin.toFixed(1)}°F to {stats.tempMax.toFixed(1)}°F</td>
                        <td>{avg}°F</td>
                        <td>{precipPercent}%</td>
                        <td>{stats.count.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {results.transitionAnomalies.length > 0 && (
            <Card className="mb-4">
              <Card.Header>
                <h5>Temperature Transition Anomalies ({results.transitionAnomalies.length})</h5>
                <small className="text-muted">
                  Unrealistic temperature jumps (>{THRESHOLDS.maxTempChangePerHour}°F/hour)
                </small>
              </Card.Header>
              <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Biome</th>
                      <th>Latitude</th>
                      <th>Time Period</th>
                      <th>Temperature Change</th>
                      <th>Weather Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.transitionAnomalies.slice(0, 100).map((anomaly, idx) => (
                      <tr key={idx}>
                        <td>{anomaly.biome}</td>
                        <td>{anomaly.latitudeBand}</td>
                        <td>
                          <small>{anomaly.from}</small><br />
                          <small>→ {anomaly.to}</small>
                        </td>
                        <td>{anomaly.tempChange}</td>
                        <td><small>{anomaly.precipChange}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {results.transitionAnomalies.length > 100 && (
                  <p className="text-muted">
                    Showing first 100 of {results.transitionAnomalies.length} transition anomalies. Download full results for complete list.
                  </p>
                )}
              </Card.Body>
            </Card>
          )}

          {results.anomalies.length > 0 && (
            <Card>
              <Card.Header>
                <h5>Validation Anomalies ({results.anomalies.length})</h5>
              </Card.Header>
              <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Biome</th>
                      <th>Latitude</th>
                      <th>Date</th>
                      <th>Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.anomalies.slice(0, 100).map((anomaly, idx) => (
                      <tr key={idx}>
                        <td>{anomaly.biome}</td>
                        <td>{anomaly.latitudeBand}</td>
                        <td>{anomaly.date}</td>
                        <td>
                          {anomaly.issues.map((issue, i) => (
                            <div key={i}><small>{issue}</small></div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {results.anomalies.length > 100 && (
                  <p className="text-muted">
                    Showing first 100 of {results.anomalies.length} anomalies. Download full results for complete list.
                  </p>
                )}
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </Container>
  );
};

export default WeatherTestHarness;
