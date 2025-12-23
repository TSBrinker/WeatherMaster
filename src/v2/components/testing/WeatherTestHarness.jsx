import React, { useState } from 'react';
import { Container, Button, Card, ProgressBar } from 'react-bootstrap';
import { BsArrowLeft } from 'react-icons/bs';
import { regionTemplates } from '../../data/region-templates';
import { TEST_CONFIG } from './testConfig';
import { runTests } from './testRunner';
import { downloadFullResults, downloadProblemsReport } from './resultExporters';
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
