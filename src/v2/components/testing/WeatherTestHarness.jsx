import React, { useState } from 'react';
import { Container, Button, Card, ProgressBar, Alert, Table, Badge, Form } from 'react-bootstrap';
import { BsArrowLeft, BsSnow, BsThermometerSnow, BsLightningCharge, BsWater } from 'react-icons/bs';
import { regionTemplates } from '../../data/region-templates';
import { TEST_CONFIG, PRECIP_ANALYSIS_CONFIG, THUNDERSTORM_CONFIG, FLOOD_ANALYSIS_CONFIG } from './testConfig';
import { runTests, runPrecipitationAnalysis, runThunderstormAnalysis, runFloodAnalysis } from './testRunner';
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
 * Count templates marked as new
 */
const getNewBiomeCount = () => {
  return Object.values(regionTemplates).reduce(
    (sum, band) => sum + Object.values(band).filter(t => t.isNew).length,
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
  const [newOnly, setNewOnly] = useState(false);

  // Precipitation analysis state
  const [isPrecipRunning, setIsPrecipRunning] = useState(false);
  const [precipProgress, setPrecipProgress] = useState(0);
  const [precipResults, setPrecipResults] = useState(null);

  // Thunderstorm analysis state
  const [isThunderstormRunning, setIsThunderstormRunning] = useState(false);
  const [thunderstormProgress, setThunderstormProgress] = useState(0);
  const [thunderstormResults, setThunderstormResults] = useState(null);

  // Flood analysis state
  const [isFloodRunning, setIsFloodRunning] = useState(false);
  const [floodProgress, setFloodProgress] = useState(0);
  const [floodResults, setFloodResults] = useState(null);

  const totalBiomes = getTotalBiomeCount();
  const newBiomes = getNewBiomeCount();
  const activeBiomes = newOnly ? newBiomes : totalBiomes;
  const totalTests = activeBiomes * TEST_CONFIG.daysToTest * TEST_CONFIG.hoursToTest.length;

  const handleRunTests = async () => {
    setIsRunning(true);
    setProgress(0);

    const testResults = await runTests((progressPercent) => {
      setProgress(progressPercent);
    }, { newOnly });

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

  const handleRunThunderstormAnalysis = async () => {
    setIsThunderstormRunning(true);
    setThunderstormProgress(0);

    const analysisResults = await runThunderstormAnalysis((progressPercent) => {
      setThunderstormProgress(progressPercent);
    });

    setThunderstormResults(analysisResults);
    setIsThunderstormRunning(false);
  };

  const handleRunFloodAnalysis = async () => {
    setIsFloodRunning(true);
    setFloodProgress(0);

    const analysisResults = await runFloodAnalysis((progressPercent) => {
      setFloodProgress(progressPercent);
    });

    setFloodResults(analysisResults);
    setIsFloodRunning(false);
  };

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
            <li>Biomes: {newOnly ? `${newBiomes} new templates` : `All ${totalBiomes} templates`}</li>
            <li>Days: {TEST_CONFIG.daysToTest} (full year)</li>
            <li>Hours per day: {TEST_CONFIG.hoursToTest.length} (midnight, 6am, noon, 6pm)</li>
            <li>Total tests: ~{totalTests.toLocaleString()}</li>
          </ul>

          {newBiomes > 0 && (
            <Form.Check
              type="checkbox"
              id="new-only-filter"
              label={<span>New templates only <Badge bg="info">{newBiomes}</Badge></span>}
              checked={newOnly}
              onChange={(e) => setNewOnly(e.target.checked)}
              className="mb-3"
              disabled={isRunning}
            />
          )}

          <Button
            variant="primary"
            onClick={handleRunTests}
            disabled={isRunning || (newOnly && newBiomes === 0)}
            size="lg"
          >
            {isRunning ? 'Running Tests...' : 'Run Test Harness'}
          </Button>

          {isRunning && (
            <div className="mt-3">
              <ProgressBar now={progress} label={`${progress.toFixed(1)}%`} animated />
              <small className="text-muted mt-2">{newOnly ? 'Testing new templates...' : 'This may take 10-30 seconds...'}</small>
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

      {/* Thunderstorm Analysis Card */}
      <Card className="mb-4" style={{ borderColor: '#ffc107' }}>
        <Card.Body>
          <h5><BsLightningCharge className="me-2" />Thunderstorm Analysis</h5>
          <p className="text-muted">
            Tests thunderstorm generation in biomes with thunderstorm potential during summer afternoons.
          </p>
          <ul>
            <li>Duration: {THUNDERSTORM_CONFIG.daysToAnalyze} days (June-July)</li>
            <li>Hours: Afternoon peak ({THUNDERSTORM_CONFIG.hoursToTest.join(', ')}:00)</li>
            <li>Tracks: Thunderstorm rate, severity, conversion from heavy rain</li>
          </ul>

          <Button
            variant="warning"
            onClick={handleRunThunderstormAnalysis}
            disabled={isThunderstormRunning || isRunning || isPrecipRunning}
            size="lg"
          >
            <BsLightningCharge className="me-2" />
            {isThunderstormRunning ? 'Analyzing...' : 'Run Thunderstorm Analysis'}
          </Button>

          {isThunderstormRunning && (
            <div className="mt-3">
              <ProgressBar variant="warning" now={thunderstormProgress} label={`${thunderstormProgress.toFixed(1)}%`} animated />
              <small className="text-muted mt-2">Analyzing thunderstorm-prone biomes...</small>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Flood Analysis Card */}
      <Card className="mb-4" style={{ borderColor: '#0dcaf0' }}>
        <Card.Body>
          <h5><BsWater className="me-2" />Flood Risk Analysis</h5>
          <p className="text-muted">
            Validates flood alert accuracy by checking if alerts correlate with actual flood-causing conditions.
            Flags false positives (alerts during frozen conditions) and missed alerts (rapid melt without warning).
          </p>
          <ul>
            <li>Duration: {FLOOD_ANALYSIS_CONFIG.daysToAnalyze} days (Jan 15 - Apr 15, winter through spring thaw)</li>
            <li>Tracks: Snow depth, melt rate, precipitation type, flood alerts</li>
            <li>Validates: Alert appropriateness based on physical conditions</li>
          </ul>

          <Button
            variant="info"
            onClick={handleRunFloodAnalysis}
            disabled={isFloodRunning || isRunning || isPrecipRunning || isThunderstormRunning}
            size="lg"
          >
            <BsWater className="me-2" />
            {isFloodRunning ? 'Analyzing...' : 'Run Flood Analysis'}
          </Button>

          {isFloodRunning && (
            <div className="mt-3">
              <ProgressBar variant="info" now={floodProgress} label={`${floodProgress.toFixed(1)}%`} animated />
              <small className="text-muted mt-2">Analyzing flood alert accuracy...</small>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Flood Analysis Results */}
      {floodResults && (
        <>
          <Alert variant={floodResults.summary.falsePositiveRate > 20 ? 'danger' : floodResults.summary.falsePositiveRate > 10 ? 'warning' : 'success'}>
            <Alert.Heading><BsWater className="me-2" />Flood Analysis Complete</Alert.Heading>
            <p className="mb-0">
              Analyzed {floodResults.config.biomesAnalyzed} biomes over {floodResults.config.daysAnalyzed} days.
              False positive rate: <strong>{floodResults.summary.falsePositiveRate.toFixed(1)}%</strong>
              {floodResults.summary.falsePositiveRate > 20 && ' - Needs attention!'}
            </p>
          </Alert>

          <Card className="mb-4">
            <Card.Body>
              <h5>Summary</h5>
              <Table striped bordered size="sm">
                <tbody>
                  <tr>
                    <td>Total Flood Alerts</td>
                    <td>{floodResults.summary.totalFloodAlerts}</td>
                  </tr>
                  <tr>
                    <td>Suspicious Alerts (false positives)</td>
                    <td>
                      <Badge bg={floodResults.summary.suspiciousAlerts > 10 ? 'danger' : 'secondary'}>
                        {floodResults.summary.suspiciousAlerts}
                      </Badge>
                      {' '}({floodResults.summary.falsePositiveRate.toFixed(1)}%)
                    </td>
                  </tr>
                  <tr>
                    <td>Missed Alerts</td>
                    <td>
                      <Badge bg={floodResults.summary.missedAlerts > 5 ? 'warning' : 'secondary'}>
                        {floodResults.summary.missedAlerts}
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td>Correct Alerts</td>
                    <td><Badge bg="success">{floodResults.summary.correctAlerts}</Badge></td>
                  </tr>
                  <tr>
                    <td>Correct No-Alerts</td>
                    <td>{floodResults.summary.correctNoAlerts}</td>
                  </tr>
                </tbody>
              </Table>

              {/* Problem Biomes */}
              {floodResults.issues.length > 0 && (
                <>
                  <h6 className="mt-4 text-danger">Biomes with Issues</h6>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <Table striped bordered size="sm">
                      <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                        <tr>
                          <th>Biome</th>
                          <th>Suspicious</th>
                          <th>Missed</th>
                          <th>Sample Issues</th>
                        </tr>
                      </thead>
                      <tbody>
                        {floodResults.issues.map((issue) => (
                          <tr key={issue.biomeName}>
                            <td>{issue.biomeName}</td>
                            <td><Badge bg="danger">{issue.suspiciousAlerts}</Badge></td>
                            <td><Badge bg="warning" text="dark">{issue.missedAlerts}</Badge></td>
                            <td style={{ fontSize: '0.8em' }}>
                              {issue.sampleSuspicious.slice(0, 1).map((s, i) => (
                                <div key={i}>{s.date}: {s.reason}</div>
                              ))}
                              {issue.sampleMissed.slice(0, 1).map((m, i) => (
                                <div key={i}>{m.date}: {m.reason}</div>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}

              {floodResults.issues.length === 0 && (
                <Alert variant="success" className="mt-3 mb-0">
                  No significant flood alert issues detected across any biomes.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {/* Thunderstorm Analysis Results */}
      {thunderstormResults && (
        <>
          <Alert variant="warning">
            <Alert.Heading><BsLightningCharge className="me-2" />Thunderstorm Analysis Complete</Alert.Heading>
            <p className="mb-0">
              Analyzed {thunderstormResults.config.biomesAnalyzed} thunderstorm-prone biomes over {thunderstormResults.config.daysAnalyzed} days.
              Overall thunderstorm rate: <strong>{thunderstormResults.summary.overallThunderstormRate.toFixed(1)}%</strong> of test hours.
            </p>
          </Alert>

          <Card className="mb-4">
            <Card.Body>
              <h5>Thunderstorm Summary</h5>
              <Table striped bordered size="sm">
                <tbody>
                  <tr>
                    <td>Total Thunderstorm Hours</td>
                    <td><Badge bg="warning" text="dark">{thunderstormResults.summary.totalThunderstorms}</Badge></td>
                  </tr>
                  <tr>
                    <td>Total Heavy Rain Hours (non-thunderstorm)</td>
                    <td>{thunderstormResults.summary.totalHeavyRain}</td>
                  </tr>
                  <tr>
                    <td>Overall Thunderstorm Rate</td>
                    <td>{thunderstormResults.summary.overallThunderstormRate.toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td>Most Active Biome</td>
                    <td>
                      {thunderstormResults.summary.biomeWithMostThunderstorms}
                      {' '}({thunderstormResults.summary.maxThunderstormsInBiome} hours)
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
                      <th>Factor</th>
                      <th>T-Storms</th>
                      <th>Rate</th>
                      <th>Conversion</th>
                      <th>Avg Temp</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(thunderstormResults.biomes).map(([name, data]) => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>{data.thunderstormFactor}</td>
                        <td>
                          <Badge bg={data.stats.thunderstormHours > 0 ? 'warning' : 'secondary'} text="dark">
                            {data.stats.thunderstormHours}
                          </Badge>
                        </td>
                        <td>{data.stats.thunderstormRate.toFixed(1)}%</td>
                        <td>{data.stats.conversionRate.toFixed(0)}%</td>
                        <td>{data.stats.avgTempDuringThunderstorms || '-'}°F</td>
                        <td>
                          {data.stats.severityBreakdown.severe > 0 && (
                            <Badge bg="danger" className="me-1">{data.stats.severityBreakdown.severe} severe</Badge>
                          )}
                          {data.stats.severityBreakdown.strong > 0 && (
                            <Badge bg="warning" text="dark" className="me-1">{data.stats.severityBreakdown.strong} strong</Badge>
                          )}
                          {data.stats.severityBreakdown.normal > 0 && (
                            <Badge bg="secondary">{data.stats.severityBreakdown.normal} normal</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </>
      )}

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
