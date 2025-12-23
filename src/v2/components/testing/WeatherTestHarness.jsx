import React, { useState } from 'react';
import { Container, Button, Card, ProgressBar, Table, Alert, Badge } from 'react-bootstrap';
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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const TEST_CONFIG = {
    year: 1,
    daysToTest: 365,
    hoursToTest: [0, 6, 12, 18], // Midnight, dawn, noon, dusk
    // Flat disc world latitude bands (center to edge)
    latitudeBands: ['central', 'subarctic', 'temperate', 'tropical', 'rim', 'special'],
    // Seasonal transition windows (±5 days around each boundary)
    seasonalTransitionDays: {
      springEquinox: { center: 80, start: 75, end: 85 },
      summerSolstice: { center: 172, start: 167, end: 177 },
      fallEquinox: { center: 266, start: 261, end: 271 },
      winterSolstice: { center: 356, start: 351, end: 361 }
    }
  };

  const THRESHOLDS = {
    temperature: { min: -100, max: 150 },
    humidity: { min: 0, max: 100 },
    pressure: { min: 28, max: 32 },
    cloudCover: { min: 0, max: 100 },
    maxTempChangePerHour: 15, // Maximum realistic temp change in 1 hour
    maxDailySeasonalJump: 8, // Max temp change between consecutive days during season transition
    expectedTempDeviation: 15, // Flag if annual avg deviates more than this from template
    biomeSimilarityThreshold: 3 // Flag biomes with avg temps within this range as similar
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
      seasonalTransitions: [], // Track behavior at season boundaries
      seasonalTransitionAnomalies: [], // Abrupt jumps during season changes
      biomeStats: {},
      precipitationStreaks: {}, // Track longest dry/wet spells per biome
      biomeSimilarities: [], // Pairs of biomes with similar weather
      problemBiomes: [] // Summary of biomes with issues
    };

    // Season boundary dates (approximate day of year)
    const SEASON_BOUNDARIES = [
      { name: 'Spring Equinox', dayOfYear: 80 },   // ~March 21
      { name: 'Summer Solstice', dayOfYear: 172 }, // ~June 21
      { name: 'Fall Equinox', dayOfYear: 266 },    // ~Sept 23
      { name: 'Winter Solstice', dayOfYear: 356 }  // ~Dec 22
    ];

    // Helper to check if a day is within a seasonal transition window
    const isInSeasonalTransition = (dayOfYear) => {
      const windows = TEST_CONFIG.seasonalTransitionDays;
      for (const [, window] of Object.entries(windows)) {
        if (dayOfYear >= window.start && dayOfYear <= window.end) {
          return true;
        }
        // Handle year wraparound for winter solstice
        if (window.start > 350 && (dayOfYear >= window.start || dayOfYear <= 5)) {
          return true;
        }
      }
      return false;
    };

    // Helper to get season from month
    const getSeason = (month) => {
      if (month >= 3 && month <= 5) return 'spring';
      if (month >= 6 && month <= 8) return 'summer';
      if (month >= 9 && month <= 11) return 'fall';
      return 'winter';
    };

    // Helper to calculate standard deviation
    const calcStdDev = (values) => {
      if (values.length === 0) return 0;
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
      return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
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
        const expectedAnnualTemp = template.parameters?.temperatureProfile?.annual?.mean;

        if (!stats.biomeStats[biomeName]) {
          stats.biomeStats[biomeName] = {
            tempMin: Infinity,
            tempMax: -Infinity,
            tempSum: 0,
            count: 0,
            precipCount: 0,
            latitudeBand: latitudeBand,
            // Expected vs Actual tracking
            expectedAnnualTemp: expectedAnnualTemp,
            // Temperature variance tracking
            dailyTemps: [], // Store noon temps for variance calculation
            seasonalTemps: { winter: [], spring: [], summer: [], fall: [] },
            // Precipitation streak tracking
            currentDryStreak: 0,
            currentWetStreak: 0,
            longestDryStreak: 0,
            longestWetStreak: 0,
            lastPrecipState: null,
            // Seasonal transition tracking
            seasonalTransitionTemps: {} // day -> temp at noon
          };
        }

        // Initialize precipitation streaks tracker
        if (!stats.precipitationStreaks[biomeName]) {
          stats.precipitationStreaks[biomeName] = {
            longestDry: 0,
            longestWet: 0,
            currentDry: 0,
            currentWet: 0
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

              // Track noon temperatures for variance calculation
              if (hour === 12) {
                biomeStats.dailyTemps.push(weather.temperature);

                // Categorize by season for seasonal variance
                const season = getSeason(date.month);
                biomeStats.seasonalTemps[season].push(weather.temperature);

                // Track temps during seasonal transition windows
                if (isInSeasonalTransition(day)) {
                  biomeStats.seasonalTransitionTemps[day] = weather.temperature;
                }
              }

              // Track precipitation streaks (using noon samples to avoid double-counting)
              if (hour === 12) {
                const streaks = stats.precipitationStreaks[biomeName];
                if (weather.precipitation) {
                  // Wet day
                  streaks.currentWet++;
                  streaks.longestWet = Math.max(streaks.longestWet, streaks.currentWet);
                  streaks.currentDry = 0;
                } else {
                  // Dry day
                  streaks.currentDry++;
                  streaks.longestDry = Math.max(streaks.longestDry, streaks.currentDry);
                  streaks.currentWet = 0;
                }
              }

              // Track seasonal boundary data (sample at noon on boundary days)
              if (hour === 12) {
                const seasonBoundary = SEASON_BOUNDARIES.find(s => s.dayOfYear === day);
                if (seasonBoundary) {
                  stats.seasonalTransitions.push({
                    biome: biomeName,
                    latitudeBand: latitudeBand,
                    season: seasonBoundary.name,
                    date: `${date.month}/${date.day}`,
                    temperature: weather.temperature,
                    condition: weather.condition,
                    humidity: weather.humidity
                  });
                }
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

    // ===== POST-PROCESSING: Analyze collected data =====

    // 1. Seasonal Transition Smoothness Analysis
    for (const [biomeName, biomeStats] of Object.entries(stats.biomeStats)) {
      const transitionTemps = biomeStats.seasonalTransitionTemps;
      const days = Object.keys(transitionTemps).map(Number).sort((a, b) => a - b);

      for (let i = 1; i < days.length; i++) {
        const prevDay = days[i - 1];
        const currDay = days[i];

        // Only check consecutive days
        if (currDay - prevDay === 1) {
          const tempChange = Math.abs(transitionTemps[currDay] - transitionTemps[prevDay]);

          if (tempChange > THRESHOLDS.maxDailySeasonalJump) {
            stats.seasonalTransitionAnomalies.push({
              biome: biomeName,
              latitudeBand: biomeStats.latitudeBand,
              fromDay: prevDay,
              toDay: currDay,
              tempChange: tempChange.toFixed(1),
              fromTemp: transitionTemps[prevDay].toFixed(1),
              toTemp: transitionTemps[currDay].toFixed(1)
            });
          }
        }
      }

      // 2. Calculate temperature variance stats
      biomeStats.dailyTempVariance = calcStdDev(biomeStats.dailyTemps);
      biomeStats.seasonalVariance = {};
      for (const [season, temps] of Object.entries(biomeStats.seasonalTemps)) {
        biomeStats.seasonalVariance[season] = calcStdDev(temps);
      }

      // 3. Calculate expected vs actual deviation
      const actualAvg = biomeStats.tempSum / biomeStats.count;
      biomeStats.actualAnnualTemp = actualAvg;
      if (biomeStats.expectedAnnualTemp !== undefined) {
        biomeStats.tempDeviation = actualAvg - biomeStats.expectedAnnualTemp;
      }
    }

    // 4. Biome Similarity Detection
    const biomeNames = Object.keys(stats.biomeStats);
    for (let i = 0; i < biomeNames.length; i++) {
      for (let j = i + 1; j < biomeNames.length; j++) {
        const biome1 = biomeNames[i];
        const biome2 = biomeNames[j];
        const avg1 = stats.biomeStats[biome1].tempSum / stats.biomeStats[biome1].count;
        const avg2 = stats.biomeStats[biome2].tempSum / stats.biomeStats[biome2].count;
        const precip1 = (stats.biomeStats[biome1].precipCount / stats.biomeStats[biome1].count) * 100;
        const precip2 = (stats.biomeStats[biome2].precipCount / stats.biomeStats[biome2].count) * 100;

        // Check if both temp AND precip are very similar
        const tempDiff = Math.abs(avg1 - avg2);
        const precipDiff = Math.abs(precip1 - precip2);

        if (tempDiff < THRESHOLDS.biomeSimilarityThreshold && precipDiff < 5) {
          stats.biomeSimilarities.push({
            biome1,
            biome2,
            avgTempDiff: tempDiff.toFixed(1),
            precipDiff: precipDiff.toFixed(1),
            band1: stats.biomeStats[biome1].latitudeBand,
            band2: stats.biomeStats[biome2].latitudeBand
          });
        }
      }
    }

    // 5. Problem Biomes Summary
    for (const [biomeName, biomeStats] of Object.entries(stats.biomeStats)) {
      const problems = [];

      // Check expected vs actual deviation
      if (biomeStats.tempDeviation !== undefined &&
          Math.abs(biomeStats.tempDeviation) > THRESHOLDS.expectedTempDeviation) {
        problems.push(`Temp deviation: ${biomeStats.tempDeviation > 0 ? '+' : ''}${biomeStats.tempDeviation.toFixed(1)}°F from expected`);
      }

      // Check for validation anomalies
      const biomeAnomalies = stats.anomalies.filter(a => a.biome === biomeName);
      if (biomeAnomalies.length > 10) {
        problems.push(`${biomeAnomalies.length} validation anomalies`);
      }

      // Check for transition anomalies
      const biomeTransitions = stats.transitionAnomalies.filter(a => a.biome === biomeName);
      if (biomeTransitions.length > 5) {
        problems.push(`${biomeTransitions.length} hourly transition anomalies`);
      }

      // Check for seasonal transition anomalies
      const seasonalAnomalies = stats.seasonalTransitionAnomalies.filter(a => a.biome === biomeName);
      if (seasonalAnomalies.length > 0) {
        problems.push(`${seasonalAnomalies.length} seasonal transition jumps`);
      }

      // Check for extreme precipitation streaks
      const streaks = stats.precipitationStreaks[biomeName];
      if (streaks && streaks.longestWet > 14) {
        problems.push(`Long wet streak: ${streaks.longestWet} days`);
      }
      if (streaks && streaks.longestDry > 60) {
        problems.push(`Long dry streak: ${streaks.longestDry} days`);
      }

      if (problems.length > 0) {
        stats.problemBiomes.push({
          biome: biomeName,
          latitudeBand: biomeStats.latitudeBand,
          problems
        });
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
          {/* Problem Biomes Summary - shown first if there are issues */}
          {results.problemBiomes && results.problemBiomes.length > 0 && (
            <Alert variant="danger" className="mb-4">
              <h5>⚠️ Problem Biomes ({results.problemBiomes.length})</h5>
              <p className="text-muted mb-2">These biomes have issues that may need attention:</p>
              {results.problemBiomes.map((pb, idx) => (
                <div key={idx} className="mb-2">
                  <strong>{pb.biome}</strong> <Badge bg="secondary">{pb.latitudeBand}</Badge>
                  <ul className="mb-0 mt-1">
                    {pb.problems.map((problem, pIdx) => (
                      <li key={pIdx}><small>{problem}</small></li>
                    ))}
                  </ul>
                </div>
              ))}
            </Alert>
          )}

          <Alert variant={results.anomalies.length === 0 && results.transitionAnomalies.length === 0 && results.seasonalTransitionAnomalies.length === 0 ? 'success' : 'warning'}>
            <h5>Test Results Summary</h5>
            <div className="d-flex flex-wrap gap-4">
              <div>
                <p className="mb-1"><strong>Total Tests:</strong> {results.totalTests.toLocaleString()}</p>
                <p className="mb-1"><strong>Passed:</strong> {results.successfulTests.toLocaleString()}</p>
                <p className="mb-1"><strong>Success Rate:</strong> {((results.successfulTests / results.totalTests) * 100).toFixed(2)}%</p>
              </div>
              <div>
                <p className="mb-1"><strong>Validation Anomalies:</strong> {results.anomalies.length}</p>
                <p className="mb-1"><strong>Hourly Transition Anomalies:</strong> {results.transitionAnomalies.length}</p>
                <p className="mb-1"><strong>Seasonal Transition Anomalies:</strong> {results.seasonalTransitionAnomalies.length}</p>
              </div>
              <div>
                <p className="mb-1"><strong>Similar Biome Pairs:</strong> {results.biomeSimilarities.length}</p>
                <p className="mb-1"><strong>Problem Biomes:</strong> {results.problemBiomes.length}</p>
              </div>
            </div>

            <Button variant="secondary" size="sm" onClick={downloadResults} className="mt-3">
              Download Full Results (JSON)
            </Button>
          </Alert>

          <Card className="mb-4">
            <Card.Header>
              <h5>Biome Statistics</h5>
              <small className="text-muted">Click column headers to sort. Includes expected vs actual temps, variance, and precipitation streaks.</small>
            </Card.Header>
            <Card.Body style={{ maxHeight: '500px', overflowY: 'auto', padding: 0 }}>
              <Table striped bordered hover size="sm" style={{ marginBottom: 0, fontSize: '0.85rem' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#212529', zIndex: 1 }}>
                  <tr>
                    <th style={{ cursor: 'default', width: '30px' }}>#</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => setSortConfig({ key: 'name', direction: sortConfig.key === 'name' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                      Biome {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => setSortConfig({ key: 'tempMin', direction: sortConfig.key === 'tempMin' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                      Min {sortConfig.key === 'tempMin' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => setSortConfig({ key: 'tempMax', direction: sortConfig.key === 'tempMax' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                      Max {sortConfig.key === 'tempMax' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => setSortConfig({ key: 'avgTemp', direction: sortConfig.key === 'avgTemp' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                      Avg {sortConfig.key === 'avgTemp' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => setSortConfig({ key: 'expectedTemp', direction: sortConfig.key === 'expectedTemp' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                      Expected {sortConfig.key === 'expectedTemp' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => setSortConfig({ key: 'deviation', direction: sortConfig.key === 'deviation' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                      Diff {sortConfig.key === 'deviation' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => setSortConfig({ key: 'variance', direction: sortConfig.key === 'variance' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                      StdDev {sortConfig.key === 'variance' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => setSortConfig({ key: 'precip', direction: sortConfig.key === 'precip' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                      Precip% {sortConfig.key === 'precip' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => setSortConfig({ key: 'dryStreak', direction: sortConfig.key === 'dryStreak' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                      Dry {sortConfig.key === 'dryStreak' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => setSortConfig({ key: 'wetStreak', direction: sortConfig.key === 'wetStreak' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                      Wet {sortConfig.key === 'wetStreak' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(results.biomeStats)
                    .map(([name, stats]) => ({
                      name,
                      tempMin: stats.tempMin,
                      tempMax: stats.tempMax,
                      avgTemp: stats.tempSum / stats.count,
                      expectedTemp: stats.expectedAnnualTemp,
                      deviation: stats.tempDeviation,
                      variance: stats.dailyTempVariance,
                      precip: (stats.precipCount / stats.count) * 100,
                      dryStreak: results.precipitationStreaks[name]?.longestDry || 0,
                      wetStreak: results.precipitationStreaks[name]?.longestWet || 0
                    }))
                    .sort((a, b) => {
                      if (!sortConfig.key) return 0;
                      const aVal = a[sortConfig.key];
                      const bVal = b[sortConfig.key];
                      if (aVal === undefined) return 1;
                      if (bVal === undefined) return -1;
                      if (typeof aVal === 'string') {
                        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                      }
                      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
                    })
                    .map((row, idx) => (
                      <tr key={row.name}>
                        <td style={{ color: '#6c757d' }}>{idx + 1}</td>
                        <td><small>{row.name}</small></td>
                        <td>{row.tempMin.toFixed(0)}°</td>
                        <td>{row.tempMax.toFixed(0)}°</td>
                        <td>{row.avgTemp.toFixed(0)}°</td>
                        <td>{row.expectedTemp !== undefined ? `${row.expectedTemp}°` : '-'}</td>
                        <td style={{ color: row.deviation !== undefined && Math.abs(row.deviation) > THRESHOLDS.expectedTempDeviation ? '#dc3545' : 'inherit' }}>
                          {row.deviation !== undefined ? `${row.deviation > 0 ? '+' : ''}${row.deviation.toFixed(1)}°` : '-'}
                        </td>
                        <td>{row.variance !== undefined ? row.variance.toFixed(1) : '-'}</td>
                        <td>{row.precip.toFixed(0)}%</td>
                        <td>{row.dryStreak}d</td>
                        <td style={{ color: row.wetStreak > 14 ? '#ffc107' : 'inherit' }}>{row.wetStreak}d</td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {results.seasonalTransitions && results.seasonalTransitions.length > 0 && (
            <Card className="mb-4">
              <Card.Header>
                <h5>Seasonal Boundary Snapshots</h5>
                <small className="text-muted">
                  Weather at equinoxes and solstices (noon samples)
                </small>
              </Card.Header>
              <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Biome</th>
                      <th>Band</th>
                      <th>Season</th>
                      <th>Date</th>
                      <th>Temp</th>
                      <th>Humidity</th>
                      <th>Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.seasonalTransitions.map((entry, idx) => (
                      <tr key={idx}>
                        <td><small>{entry.biome}</small></td>
                        <td><small>{entry.latitudeBand}</small></td>
                        <td><small>{entry.season}</small></td>
                        <td><small>{entry.date}</small></td>
                        <td>{entry.temperature}°F</td>
                        <td>{entry.humidity}%</td>
                        <td><small>{entry.condition}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

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

          {/* Seasonal Transition Anomalies */}
          {results.seasonalTransitionAnomalies && results.seasonalTransitionAnomalies.length > 0 && (
            <Card className="mb-4">
              <Card.Header>
                <h5>Seasonal Transition Anomalies ({results.seasonalTransitionAnomalies.length})</h5>
                <small className="text-muted">
                  Abrupt temperature jumps during season changes (>{THRESHOLDS.maxDailySeasonalJump}°F between consecutive days)
                </small>
              </Card.Header>
              <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Biome</th>
                      <th>Band</th>
                      <th>Days</th>
                      <th>Temperature Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.seasonalTransitionAnomalies.slice(0, 50).map((anomaly, idx) => (
                      <tr key={idx}>
                        <td><small>{anomaly.biome}</small></td>
                        <td><small>{anomaly.latitudeBand}</small></td>
                        <td>Day {anomaly.fromDay} → {anomaly.toDay}</td>
                        <td>{anomaly.fromTemp}°F → {anomaly.toTemp}°F (Δ{anomaly.tempChange}°F)</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {results.seasonalTransitionAnomalies.length > 50 && (
                  <p className="text-muted">
                    Showing first 50 of {results.seasonalTransitionAnomalies.length}. Download full results for complete list.
                  </p>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Biome Similarities */}
          {results.biomeSimilarities && results.biomeSimilarities.length > 0 && (
            <Card className="mb-4">
              <Card.Header>
                <h5>Similar Biome Pairs ({results.biomeSimilarities.length})</h5>
                <small className="text-muted">
                  Biomes with nearly identical weather patterns (temp diff &lt;{THRESHOLDS.biomeSimilarityThreshold}°F and precip diff &lt;5%)
                </small>
              </Card.Header>
              <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Biome 1</th>
                      <th>Band</th>
                      <th>Biome 2</th>
                      <th>Band</th>
                      <th>Temp Δ</th>
                      <th>Precip Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.biomeSimilarities.map((sim, idx) => (
                      <tr key={idx}>
                        <td><small>{sim.biome1}</small></td>
                        <td><small>{sim.band1}</small></td>
                        <td><small>{sim.biome2}</small></td>
                        <td><small>{sim.band2}</small></td>
                        <td>{sim.avgTempDiff}°F</td>
                        <td>{sim.precipDiff}%</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {results.anomalies.length > 0 && (
            <Card className="mb-4">
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
