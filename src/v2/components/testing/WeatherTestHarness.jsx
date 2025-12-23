import React, { useState } from 'react';
import { Container, Button, Card, ProgressBar, Alert, Table, Badge } from 'react-bootstrap';
import { BsArrowLeft, BsSnow, BsThermometerSnow } from 'react-icons/bs';
import { regionTemplates } from '../../data/region-templates';
import { TEST_CONFIG, PRECIP_ANALYSIS_CONFIG } from './testConfig';
import { runTests, runPrecipitationAnalysis } from './testRunner';
import { downloadFullResults, downloadProblemsReport, downloadPrecipAnalysis, downloadPrecipSummary } from './resultExporters';
import {
  BiomeStatsTable,
  EnvironmentalStatsTable,
  SnowStatsTable,
  TransitionAnomaliesTable,
  SeasonalAnomaliesTable,
  ValidationAnomaliesTable,
  BiomeSimilaritiesTable,
  ProblemBiomesAlert,
  TestResultsSummary
} from './results';

/**
 * Navigate back to main app (remove test parameter)
 */
const goToMainApp = () => {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete('test');
  window.location.href = currentUrl.toString();
};

/**
 * Calculate total biome count across all latitude bands
 */
const getTotalBiomeCount = () => {
  return Object.values(regionTemplates).reduce(
    (sum, band) => sum + Object.keys(band).length,
    0
  );
};

/**
 * WeatherTestHarness - Comprehensive weather generation testing
 *
 * Tests all biomes across a full year with validation
 */
const WeatherTestHarness = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  // Precipitation analysis state
  const [isPrecipRunning, setIsPrecipRunning] = useState(false);
  const [precipProgress, setPrecipProgress] = useState(0);
  const [precipResults, setPrecipResults] = useState(null);

  const totalBiomes = getTotalBiomeCount();
  const totalTests = totalBiomes * TEST_CONFIG.daysToTest * TEST_CONFIG.hoursToTest.length;

  const handleRunTests = async () => {
    setIsRunning(true);
    setProgress(0);

    const testResults = await runTests((progressPercent) => {
      setProgress(progressPercent);
    });

    setResults(testResults);
    setIsRunning(false);
  };

  const handleExportProblems = () => downloadProblemsReport(results);
  const handleExportFull = () => downloadFullResults(results);

  const handleRunPrecipAnalysis = async () => {
    setIsPrecipRunning(true);
    setPrecipProgress(0);

    const analysisResults = await runPrecipitationAnalysis((progressPercent) => {
      setPrecipProgress(progressPercent);
    });

    setPrecipResults(analysisResults);
    setIsPrecipRunning(false);
  };

  const handleExportPrecipFull = () => downloadPrecipAnalysis(precipResults);
  const handleExportPrecipSummary = () => downloadPrecipSummary(precipResults);

  return (
    <Container className="mt-5">
      {/* Back to App button */}
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={goToMainApp}
        className="mb-3"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <BsArrowLeft /> Back to App
      </Button>

      <h1>Weather Generation Test Harness</h1>
      <p className="text-muted">
        Comprehensive testing of weather generation across all biomes and seasons
      </p>

      <Card className="mb-4">
        <Card.Body>
          <h5>Test Configuration</h5>
          <ul>
            <li>Biomes: All {totalBiomes} templates</li>
            <li>Days: {TEST_CONFIG.daysToTest} (full year)</li>
            <li>Hours per day: {TEST_CONFIG.hoursToTest.length} (midnight, 6am, noon, 6pm)</li>
            <li>Total tests: ~{totalTests.toLocaleString()}</li>
          </ul>

          <Button
            variant="primary"
            onClick={handleRunTests}
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

      {/* Precipitation Analysis Card */}
      <Card className="mb-4" style={{ borderColor: '#6ea8fe' }}>
        <Card.Body>
          <h5><BsThermometerSnow className="me-2" />Precipitation & Snow Accumulation Analysis</h5>
          <p className="text-muted">
            Hourly time-series analysis of precipitation type changes and snow accumulation/melt patterns.
            Tests only cold-climate biomes (winter mean ≤ 32°F).
          </p>
          <ul>
            <li>Duration: {PRECIP_ANALYSIS_CONFIG.hoursToAnalyze} hours ({PRECIP_ANALYSIS_CONFIG.hoursToAnalyze / 24} days)</li>
            <li>Start Date: January 15 (mid-winter)</li>
            <li>Captures: Temperature, Precip Type, Snow Depth, Melt Rate (hourly)</li>
          </ul>

          <Button
            variant="info"
            onClick={handleRunPrecipAnalysis}
            disabled={isPrecipRunning || isRunning}
            size="lg"
          >
            <BsSnow className="me-2" />
            {isPrecipRunning ? 'Analyzing...' : 'Run Precipitation Analysis'}
          </Button>

          {isPrecipRunning && (
            <div className="mt-3">
              <ProgressBar variant="info" now={precipProgress} label={`${precipProgress.toFixed(1)}%`} animated />
              <small className="text-muted mt-2">Analyzing cold-climate biomes...</small>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Precipitation Analysis Results */}
      {precipResults && (
        <>
          <Alert variant={precipResults.summary.rainOnSnowEvents > 10 ? 'warning' : 'info'}>
            <Alert.Heading><BsSnow className="me-2" />Precipitation Analysis Complete</Alert.Heading>
            <p className="mb-0">
              Analyzed {precipResults.config.biomesAnalyzed} cold-climate biomes over {precipResults.config.hoursAnalyzed} hours.
            </p>
          </Alert>

          <Card className="mb-4">
            <Card.Body>
              <h5>Analysis Summary</h5>
              <Table striped bordered size="sm">
                <tbody>
                  <tr>
                    <td>Biomes Analyzed</td>
                    <td>{precipResults.config.biomesAnalyzed}</td>
                  </tr>
                  <tr>
                    <td>Total Precip Type Changes (during active precip)</td>
                    <td>
                      <Badge bg={precipResults.summary.totalPrecipTypeChanges > 50 ? 'warning' : 'secondary'}>
                        {precipResults.summary.totalPrecipTypeChanges}
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td>Rain-on-Snow Events</td>
                    <td>
                      <Badge bg={precipResults.summary.totalRainOnSnowEvents > 20 ? 'danger' : 'secondary'}>
                        {precipResults.summary.totalRainOnSnowEvents}
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td>Max Snow Depth Observed</td>
                    <td>{precipResults.summary.maxSnowDepthObserved.toFixed(1)}"</td>
                  </tr>
                  <tr>
                    <td>Biomes with Complete Melt</td>
                    <td>
                      {precipResults.summary.biomesWithFullMelt.length > 0 ? (
                        <Badge bg="warning">{precipResults.summary.biomesWithFullMelt.join(', ')}</Badge>
                      ) : (
                        <Badge bg="success">None</Badge>
                      )}
                    </td>
                  </tr>
                </tbody>
              </Table>

              <h6 className="mt-4">Per-Biome Statistics</h6>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered size="sm">
                  <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                    <tr>
                      <th>Biome</th>
                      <th>Winter Mean</th>
                      <th>Temp Range</th>
                      <th>Max Snow</th>
                      <th>Precip Hours</th>
                      <th>Type Changes</th>
                      <th>Rain-on-Snow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(precipResults.biomes).map(([name, data]) => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>{data.winterMean}°F</td>
                        <td>{data.stats.tempRange.min}° - {data.stats.tempRange.max}°</td>
                        <td>{data.stats.maxSnowDepth.toFixed(1)}"</td>
                        <td>{data.stats.hoursWithPrecip}</td>
                        <td>
                          <Badge bg={data.stats.precipTypeChanges > 5 ? 'warning' : 'secondary'}>
                            {data.stats.precipTypeChanges}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={data.stats.rainOnSnowEvents > 3 ? 'danger' : 'secondary'}>
                            {data.stats.rainOnSnowEvents}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="mt-3">
                <Button variant="outline-primary" size="sm" onClick={handleExportPrecipSummary} className="me-2">
                  Download Summary JSON
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={handleExportPrecipFull}>
                  Download Full Time-Series JSON
                </Button>
              </div>
            </Card.Body>
          </Card>
        </>
      )}

      {results && (
        <>
          <ProblemBiomesAlert results={results} />

          <TestResultsSummary
            results={results}
            onExportProblems={handleExportProblems}
            onExportFull={handleExportFull}
          />

          <BiomeStatsTable results={results} />
          <EnvironmentalStatsTable results={results} />
          <SnowStatsTable results={results} />
          <TransitionAnomaliesTable results={results} />
          <SeasonalAnomaliesTable results={results} />
          <BiomeSimilaritiesTable results={results} />
          <ValidationAnomaliesTable results={results} />
        </>
      )}
    </Container>
  );
};

export default WeatherTestHarness;
