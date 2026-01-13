import React, { useState, useMemo } from 'react';
import { Container, Button, Card, ProgressBar, Alert, Table, Badge, Form, Row, Col, Collapse } from 'react-bootstrap';
import { BsArrowLeft, BsSnow, BsThermometerSnow, BsLightningCharge, BsWater, BsThermometerHigh, BsStar, BsExclamationTriangle, BsArrowRepeat, BsChevronDown, BsChevronRight } from 'react-icons/bs';
import { regionTemplates } from '../../data/region-templates';
import { TEST_CONFIG, PRECIP_ANALYSIS_CONFIG, THUNDERSTORM_CONFIG, FLOOD_ANALYSIS_CONFIG, HEAT_INDEX_CONFIG, PRECIP_STREAK_CONFIG, PRECIP_TYPE_CONFIG } from './testConfig';
import { runTests, runPrecipitationAnalysis, runThunderstormAnalysis, runFloodAnalysis, runHeatIndexAnalysis, runPrecipStreakAnalysis, runPrecipTypeAnalysis } from './testRunner';
import WandererService from '../../services/celestial/WandererService';
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
 * Format streak results as markdown for easy sharing
 */
const formatStreakResultsAsMarkdown = (results) => {
  if (!results) return '';

  let md = '';

  // Summary stats
  md += `Average Precipitation Frequency\t${results.summary.avgPrecipFrequency}% of hours\n`;
  md += `Longest Precipitation Streak\t${Math.floor(results.summary.longestPrecipStreak.hours / 24)} days in ${results.summary.longestPrecipStreak.biome}`;
  if (results.summary.longestPrecipStreak.dates) {
    md += ` (${results.summary.longestPrecipStreak.dates.startDate} - ${results.summary.longestPrecipStreak.dates.endDate})`;
  }
  md += '\n';
  md += `Longest Dry Streak\t${Math.floor(results.summary.longestDryStreak.hours / 24)} days in ${results.summary.longestDryStreak.biome}\n`;
  md += `Biomes with Long Streaks (>7 days)\t${results.summary.biomesWithLongStreaks.length}\n`;
  md += `Biomes with Extreme Streaks (>14 days)\t${results.summary.biomesWithExtremeStreaks.length}\n`;

  // Extreme streaks table
  if (results.issues.length > 0) {
    md += `Extreme Precipitation Streaks (>14 days)\n`;
    md += `Biome\tDays\tDates\tPrecip Types\n`;
    results.issues.forEach(issue => {
      const days = issue.details?.days || Math.floor(issue.details?.hours / 24);
      const dates = `${issue.details?.startDate} - ${issue.details?.endDate}`;
      const types = issue.details?.types?.join(', ') || '-';
      md += `${issue.biome}\t${days}\t${dates}\t${types}\n`;
    });
  }

  // Long streaks table
  if (results.summary.biomesWithLongStreaks.length > 0) {
    md += `Long Precipitation Streaks (7-14 days)\n`;
    md += `Biome\tDays\tDates\n`;
    results.summary.biomesWithLongStreaks.forEach(item => {
      md += `${item.biome}\t${item.days}\t${item.details?.startDate} - ${item.details?.endDate}\n`;
    });
  }

  // All biomes table
  md += `All Biomes - Precipitation Stats\n`;
  md += `Biome\tPrecip Freq\tLongest Precip\tLongest Dry\tTotal Precip Hours\n`;
  Object.values(results.biomes)
    .sort((a, b) => b.stats.longestPrecipStreak - a.stats.longestPrecipStreak)
    .forEach(b => {
      const precipDays = Math.floor(b.stats.longestPrecipStreak / 24);
      const precipHours = b.stats.longestPrecipStreak % 24;
      const dryDays = Math.floor(b.stats.longestDryStreak / 24);
      const startDate = b.longestPrecipDetails?.startDate || '';
      md += `${b.biomeName}\t${b.stats.precipFrequency}%\t${precipDays}d ${precipHours}h(${startDate})\t${dryDays}d\t${b.stats.totalPrecipHours.toLocaleString()}\n`;
    });

  return md;
};

/**
 * Format precipitation type results as markdown for easy sharing
 */
const formatTypeResultsAsMarkdown = (results) => {
  if (!results) return '';

  let md = '## Precipitation Type Analysis Results\n\n';

  // Summary stats
  md += '### Summary\n';
  md += `Total Precipitation Events\t${results.summary.totalPrecipEvents}\n`;
  md += `Total Type Changes\t${results.summary.totalTypeChanges}\n`;
  md += `Avg Type Changes per Event\t${results.summary.avgTypeChangesPerEvent}\n`;
  md += `Avg Type Persistence\t${results.summary.avgTypePersistence} hours\n`;
  md += `Biomes with Cycling Issues\t${results.summary.biomesWithCycling.length}\n\n`;

  // Transition counts
  md += '### Type Transitions\n';
  md += `Transition\tCount\n`;
  md += `Snow → Sleet\t${results.summary.transitionCounts.snowToSleet}\n`;
  md += `Sleet → Snow\t${results.summary.transitionCounts.sleetToSnow}\n`;
  md += `Sleet → Rain\t${results.summary.transitionCounts.sleetToRain}\n`;
  md += `Rain → Sleet\t${results.summary.transitionCounts.rainToSleet}\n`;
  md += `Snow → Rain (Direct!)\t${results.summary.transitionCounts.snowToRain}\n`;
  md += `Rain → Snow (Direct!)\t${results.summary.transitionCounts.rainToSnow}\n`;
  md += `Other\t${results.summary.transitionCounts.other}\n\n`;

  // Biomes with cycling issues
  if (results.summary.biomesWithCycling.length > 0) {
    md += '### Biomes with Cycling Issues\n';
    md += 'Biome\tAvg Changes/Event\tCycling Events\tWorst Event\n';
    results.summary.biomesWithCycling.forEach(item => {
      const worst = item.worstEvent
        ? `${item.worstEvent.typeChanges} changes in ${item.worstEvent.duration}h: ${item.worstEvent.typeSequence}`
        : '-';
      md += `${item.biome}\t${item.avgChangesPerEvent}\t${item.cyclingEvents}\t${worst}\n`;
    });
    md += '\n';
  }

  // All biomes table
  md += '### All Biomes\n';
  md += 'Biome\tWinter Mean\tEvents\tChanges/Event\tPersistence\tSnow\tSleet\tRain\n';
  Object.values(results.biomes)
    .sort((a, b) => parseFloat(b.stats.avgChangesPerEvent) - parseFloat(a.stats.avgChangesPerEvent))
    .forEach(b => {
      md += `${b.biomeName}\t${b.winterMean}°F\t${b.stats.precipEvents}\t${b.stats.avgChangesPerEvent}\t${b.stats.avgTypePersistence || '-'}h\t`;
      md += `${b.stats.typeDistribution.snow}\t${b.stats.typeDistribution.sleet}\t${b.stats.typeDistribution.rain}\n`;
    });

  return md;
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

  // Heat index analysis state
  const [isHeatIndexRunning, setIsHeatIndexRunning] = useState(false);
  const [heatIndexProgress, setHeatIndexProgress] = useState(0);
  const [heatIndexResults, setHeatIndexResults] = useState(null);

  // Wanderer analysis state
  const [isWandererRunning, setIsWandererRunning] = useState(false);
  const [wandererProgress, setWandererProgress] = useState(0);
  const [wandererResults, setWandererResults] = useState(null);

  // Precipitation streak analysis state
  const [isStreakRunning, setIsStreakRunning] = useState(false);
  const [streakProgress, setStreakProgress] = useState(0);
  const [streakResults, setStreakResults] = useState(null);
  const [streakCopied, setStreakCopied] = useState(false);

  // Precipitation type analysis state
  const [isTypeRunning, setIsTypeRunning] = useState(false);
  const [typeProgress, setTypeProgress] = useState(0);
  const [typeResults, setTypeResults] = useState(null);
  const [typeCopied, setTypeCopied] = useState(false);

  // Impact preview state
  const [previewSize, setPreviewSize] = useState('medium');
  const [previewDistance, setPreviewDistance] = useState(5);

  // Section collapse state (all collapsed by default)
  const [sectionsOpen, setSectionsOpen] = useState({
    fullYear: false,
    precip: false,
    thunderstorm: false,
    flood: false,
    heatIndex: false,
    streak: false,
    precipType: false,
    wanderer: false,
    impact: false
  });

  const toggleSection = (section) => {
    setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Compute impact effects for preview
  const impactPreview = useMemo(() => {
    return WandererService.generateImpactEffects(previewSize, previewDistance, 'Open plains');
  }, [previewSize, previewDistance]);

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

  const handleRunHeatIndexAnalysis = async () => {
    setIsHeatIndexRunning(true);
    setHeatIndexProgress(0);

    const analysisResults = await runHeatIndexAnalysis((progressPercent) => {
      setHeatIndexProgress(progressPercent);
    });

    setHeatIndexResults(analysisResults);
    setIsHeatIndexRunning(false);
  };

  const handleRunStreakAnalysis = async () => {
    setIsStreakRunning(true);
    setStreakProgress(0);

    const analysisResults = await runPrecipStreakAnalysis((progressPercent) => {
      setStreakProgress(progressPercent);
    });

    setStreakResults(analysisResults);
    setIsStreakRunning(false);
  };

  const handleRunTypeAnalysis = async () => {
    setIsTypeRunning(true);
    setTypeProgress(0);

    const analysisResults = await runPrecipTypeAnalysis((progressPercent) => {
      setTypeProgress(progressPercent);
    });

    setTypeResults(analysisResults);
    setIsTypeRunning(false);
  };

  const handleRunWandererAnalysis = async () => {
    setIsWandererRunning(true);
    setWandererProgress(0);

    // Create a mock region for testing
    const mockRegion = { id: 'wanderer-test-region' };
    const yearsToTest = 10;
    const totalYears = yearsToTest;

    const stats = {
      totalStreaks: 0,
      totalLocalFalls: 0,
      observableStreaks: 0,
      sizeDistribution: { small: 0, medium: 0, large: 0, massive: 0 },
      yearlyBreakdown: [],
      events: []
    };

    // Test multiple years
    for (let yearOffset = 0; yearOffset < totalYears; yearOffset++) {
      const year = 1000 + yearOffset; // Arbitrary starting year
      const yearStats = WandererService.getYearlyStats(mockRegion, year);

      stats.totalStreaks += yearStats.totalStreaks;
      stats.totalLocalFalls += yearStats.totalLocalFalls;
      stats.observableStreaks += yearStats.observableStreaks;
      stats.sizeDistribution.small += yearStats.sizeDistribution.small;
      stats.sizeDistribution.medium += yearStats.sizeDistribution.medium;
      stats.sizeDistribution.large += yearStats.sizeDistribution.large;
      stats.sizeDistribution.massive += yearStats.sizeDistribution.massive;
      stats.yearlyBreakdown.push({
        year,
        streaks: yearStats.totalStreaks,
        localFalls: yearStats.totalLocalFalls,
        events: yearStats.events
      });
      stats.events.push(...yearStats.events.map(e => ({ ...e, year })));

      setWandererProgress(((yearOffset + 1) / totalYears) * 100);
      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const results = {
      config: {
        yearsAnalyzed: totalYears,
        regionId: mockRegion.id
      },
      summary: {
        avgStreaksPerYear: (stats.totalStreaks / totalYears).toFixed(1),
        avgLocalFallsPerYear: (stats.totalLocalFalls / totalYears).toFixed(2),
        totalStreaks: stats.totalStreaks,
        totalLocalFalls: stats.totalLocalFalls,
        observableRate: ((stats.observableStreaks / stats.totalStreaks) * 100).toFixed(1),
        sizeDistribution: stats.sizeDistribution
      },
      yearlyBreakdown: stats.yearlyBreakdown,
      events: stats.events
    };

    setWandererResults(results);
    setIsWandererRunning(false);
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
        <Card.Header
          style={{ cursor: 'pointer' }}
          onClick={() => toggleSection('fullYear')}
        >
          <h5 className="mb-0 d-flex align-items-center">
            {sectionsOpen.fullYear ? <BsChevronDown className="me-2" /> : <BsChevronRight className="me-2" />}
            Full Year Weather Validation
          </h5>
        </Card.Header>
        <Collapse in={sectionsOpen.fullYear}>
          <Card.Body>
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
        </Collapse>
      </Card>

      {/* Precipitation Analysis Card */}
      <Card className="mb-4" style={{ borderColor: '#6ea8fe' }}>
        <Card.Header
          style={{ cursor: 'pointer', borderColor: '#6ea8fe' }}
          onClick={() => toggleSection('precip')}
        >
          <h5 className="mb-0 d-flex align-items-center">
            {sectionsOpen.precip ? <BsChevronDown className="me-2" /> : <BsChevronRight className="me-2" />}
            <BsThermometerSnow className="me-2" />Precipitation & Snow Accumulation Analysis
          </h5>
        </Card.Header>
        <Collapse in={sectionsOpen.precip}>
          <Card.Body>
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
        </Collapse>
      </Card>

      {/* Thunderstorm Analysis Card */}
      <Card className="mb-4" style={{ borderColor: '#ffc107' }}>
        <Card.Header
          style={{ cursor: 'pointer', borderColor: '#ffc107' }}
          onClick={() => toggleSection('thunderstorm')}
        >
          <h5 className="mb-0 d-flex align-items-center">
            {sectionsOpen.thunderstorm ? <BsChevronDown className="me-2" /> : <BsChevronRight className="me-2" />}
            <BsLightningCharge className="me-2" />Thunderstorm Analysis
          </h5>
        </Card.Header>
        <Collapse in={sectionsOpen.thunderstorm}>
          <Card.Body>
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
        </Collapse>
      </Card>

      {/* Flood Analysis Card */}
      <Card className="mb-4" style={{ borderColor: '#0dcaf0' }}>
        <Card.Header
          style={{ cursor: 'pointer', borderColor: '#0dcaf0' }}
          onClick={() => toggleSection('flood')}
        >
          <h5 className="mb-0 d-flex align-items-center">
            {sectionsOpen.flood ? <BsChevronDown className="me-2" /> : <BsChevronRight className="me-2" />}
            <BsWater className="me-2" />Flood Risk Analysis
          </h5>
        </Card.Header>
        <Collapse in={sectionsOpen.flood}>
          <Card.Body>
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
        </Collapse>
      </Card>

      {/* Heat Index Analysis Card */}
      <Card className="mb-4" style={{ borderColor: '#dc3545' }}>
        <Card.Header
          style={{ cursor: 'pointer', borderColor: '#dc3545' }}
          onClick={() => toggleSection('heatIndex')}
        >
          <h5 className="mb-0 d-flex align-items-center">
            {sectionsOpen.heatIndex ? <BsChevronDown className="me-2" /> : <BsChevronRight className="me-2" />}
            <BsThermometerHigh className="me-2" />Heat Index / Dew Point Analysis
          </h5>
        </Card.Header>
        <Collapse in={sectionsOpen.heatIndex}>
          <Card.Body>
            <p className="text-muted">
              Validates the dew point-based humidity system by checking heat index calculations across hot climates.
              Ensures "Feels Like" appears when it should and uses realistic dew point values.
            </p>
            <ul>
              <li>Duration: {HEAT_INDEX_CONFIG.daysToAnalyze} days x {HEAT_INDEX_CONFIG.yearsToTest} years (summer months)</li>
              <li>Tracks: Temperature, dew point, humidity, heat index, "Feels Like" display threshold</li>
              <li>Flags: Biomes that never show "Feels Like" despite hot temperatures</li>
            </ul>

            <Button
              variant="danger"
              onClick={handleRunHeatIndexAnalysis}
              disabled={isHeatIndexRunning || isRunning || isPrecipRunning || isThunderstormRunning || isFloodRunning}
              size="lg"
            >
              <BsThermometerHigh className="me-2" />
              {isHeatIndexRunning ? 'Analyzing...' : 'Run Heat Index Analysis'}
            </Button>

            {isHeatIndexRunning && (
              <div className="mt-3">
                <ProgressBar variant="danger" now={heatIndexProgress} label={`${heatIndexProgress.toFixed(1)}%`} animated />
                <small className="text-muted mt-2">Analyzing heat index and dew point values...</small>
              </div>
            )}
          </Card.Body>
        </Collapse>
      </Card>

      {/* Precipitation Streak Analysis Card */}
      <Card className="mb-4" style={{ borderColor: '#17a2b8' }}>
        <Card.Header
          style={{ cursor: 'pointer', borderColor: '#17a2b8' }}
          onClick={() => toggleSection('streak')}
        >
          <h5 className="mb-0 d-flex align-items-center">
            {sectionsOpen.streak ? <BsChevronDown className="me-2" /> : <BsChevronRight className="me-2" />}
            <BsWater className="me-2" />Precipitation Streak Analysis
          </h5>
        </Card.Header>
        <Collapse in={sectionsOpen.streak}>
          <Card.Body>
            <p className="text-muted">
              Identifies unrealistic precipitation patterns like consecutive weeks of rain or unusually long dry spells.
              Helps diagnose biomes with broken precipitation generation.
            </p>
            <ul>
              <li>Duration: Full year ({PRECIP_STREAK_CONFIG.hoursToAnalyze / 24} days) across all biomes</li>
              <li>Tracks: Longest rain/snow streak, longest dry spell, monthly precipitation frequency</li>
              <li>Flags: Streaks &gt;7 days (warning), &gt;14 days (extreme)</li>
            </ul>

            <Button
              variant="info"
              onClick={handleRunStreakAnalysis}
              disabled={isStreakRunning || isRunning || isPrecipRunning || isThunderstormRunning || isFloodRunning || isHeatIndexRunning}
              size="lg"
            >
              <BsWater className="me-2" />
            {isStreakRunning ? 'Analyzing...' : 'Run Precipitation Streak Analysis'}
          </Button>

          {isStreakRunning && (
            <div className="mt-3">
              <ProgressBar variant="info" now={streakProgress} label={`${streakProgress.toFixed(1)}%`} animated />
              <small className="text-muted mt-2">Analyzing precipitation patterns across all biomes...</small>
            </div>
          )}
          </Card.Body>
        </Collapse>
      </Card>

      {/* Precipitation Type Analysis Card */}
      <Card className="mb-4" style={{ borderColor: '#20c997' }}>
        <Card.Header
          style={{ cursor: 'pointer', borderColor: '#20c997' }}
          onClick={() => toggleSection('precipType')}
        >
          <h5 className="mb-0 d-flex align-items-center">
            {sectionsOpen.precipType ? <BsChevronDown className="me-2" /> : <BsChevronRight className="me-2" />}
            <BsArrowRepeat className="me-2" />Precipitation Type Analysis
          </h5>
        </Card.Header>
        <Collapse in={sectionsOpen.precipType}>
          <Card.Body>
            <p className="text-muted">
              Analyzes precipitation TYPE transitions (snow/sleet/rain) to identify unrealistic rapid cycling.
              Focuses on biomes with winter temps in the transition zone (15-50°F).
            </p>
            <ul>
              <li>Duration: {PRECIP_TYPE_CONFIG.hoursToAnalyze / 24} days (Nov-Feb winter period)</li>
              <li>Tracks: Type changes per event, persistence duration, transition patterns</li>
              <li>Flags: Excessive cycling (&gt;4 changes/event), low persistence (&lt;3 hours)</li>
            </ul>

            <Button
              variant="success"
              onClick={handleRunTypeAnalysis}
              disabled={isTypeRunning || isRunning || isPrecipRunning || isThunderstormRunning || isFloodRunning || isHeatIndexRunning || isStreakRunning}
              size="lg"
              style={{ backgroundColor: '#20c997', borderColor: '#20c997' }}
            >
              <BsArrowRepeat className="me-2" />
              {isTypeRunning ? 'Analyzing...' : 'Run Precipitation Type Analysis'}
            </Button>

            {isTypeRunning && (
              <div className="mt-3">
                <ProgressBar now={typeProgress} label={`${typeProgress.toFixed(1)}%`} animated style={{ backgroundColor: '#20c997' }} />
                <small className="text-muted mt-2">Analyzing type transitions across winter biomes...</small>
              </div>
            )}
          </Card.Body>
        </Collapse>
      </Card>

      {/* Wanderer Analysis Card */}
      <Card className="mb-4" style={{ borderColor: '#9966ff' }}>
        <Card.Header
          style={{ cursor: 'pointer', borderColor: '#9966ff' }}
          onClick={() => toggleSection('wanderer')}
        >
          <h5 className="mb-0 d-flex align-items-center">
            {sectionsOpen.wanderer ? <BsChevronDown className="me-2" /> : <BsChevronRight className="me-2" />}
            <BsStar className="me-2" />Wanderer (Falling Star) Analysis
          </h5>
        </Card.Header>
        <Collapse in={sectionsOpen.wanderer}>
          <Card.Body>
            <p className="text-muted">
              Tests the frequency and distribution of Wanderer events over multiple years.
              Verifies that streak and local fall rates match expected probabilities.
            </p>
            <ul>
              <li>Duration: 10 years of simulation</li>
              <li>Expected: ~14 streaks/year, ~2 local falls/year</li>
              <li>Tracks: Streak frequency, local fall frequency, size distribution, visibility</li>
            </ul>

            <Button
              variant="secondary"
              onClick={handleRunWandererAnalysis}
              disabled={isWandererRunning || isRunning}
              size="lg"
              style={{ backgroundColor: '#9966ff', borderColor: '#9966ff' }}
            >
              <BsStar className="me-2" />
              {isWandererRunning ? 'Analyzing...' : 'Run Wanderer Analysis'}
            </Button>

            {isWandererRunning && (
              <div className="mt-3">
                <ProgressBar now={wandererProgress} label={`${wandererProgress.toFixed(1)}%`} animated style={{ backgroundColor: '#ddd' }} />
                <small className="text-muted mt-2">Simulating 10 years of Wanderer events...</small>
              </div>
            )}
          </Card.Body>
        </Collapse>
      </Card>

      {/* Wanderer Impact Preview Card */}
      <Card className="mb-4" style={{ borderColor: '#ff6b6b' }}>
        <Card.Header
          style={{ cursor: 'pointer', borderColor: '#ff6b6b' }}
          onClick={() => toggleSection('impact')}
        >
          <h5 className="mb-0 d-flex align-items-center">
            {sectionsOpen.impact ? <BsChevronDown className="me-2" /> : <BsChevronRight className="me-2" />}
            <BsExclamationTriangle className="me-2" />Impact Effects Preview
          </h5>
        </Card.Header>
        <Collapse in={sectionsOpen.impact}>
          <Card.Body>
            <p className="text-muted">
              Preview the compositional narrative and mechanical effects for different size/distance combinations.
            </p>

            <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label><strong>Size</strong></Form.Label>
                <div>
                  {['small', 'medium', 'large', 'massive'].map((size) => (
                    <Form.Check
                      key={size}
                      inline
                      type="radio"
                      id={`size-${size}`}
                      label={size.charAt(0).toUpperCase() + size.slice(1)}
                      name="previewSize"
                      checked={previewSize === size}
                      onChange={() => setPreviewSize(size)}
                    />
                  ))}
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  <strong>Distance:</strong> {previewDistance < 1 ? `${Math.round(previewDistance * 5280)} feet` : `${previewDistance} miles`}
                  {' '}
                  <Badge bg={
                    impactPreview.band === 'close' ? 'danger' :
                    impactPreview.band === 'near' ? 'warning' : 'secondary'
                  }>
                    {impactPreview.band}
                  </Badge>
                </Form.Label>
                <Form.Range
                  min={0.1}
                  max={100}
                  step={0.1}
                  value={previewDistance}
                  onChange={(e) => setPreviewDistance(parseFloat(e.target.value))}
                />
                <div className="d-flex justify-content-between" style={{ fontSize: '0.75em' }}>
                  <span>500ft</span>
                  <span>1mi</span>
                  <span>10mi</span>
                  <span>50mi</span>
                  <span>100mi</span>
                </div>
              </Form.Group>
            </Col>
          </Row>

          {/* Quick presets */}
          <div className="mb-3">
            <strong>Quick Presets:</strong>{' '}
            <Button size="sm" variant="outline-danger" className="me-1" onClick={() => { setPreviewSize('massive'); setPreviewDistance(0.15); }}>
              Massive @ 800ft
            </Button>
            <Button size="sm" variant="outline-warning" className="me-1" onClick={() => { setPreviewSize('large'); setPreviewDistance(3); }}>
              Large @ 3mi
            </Button>
            <Button size="sm" variant="outline-info" className="me-1" onClick={() => { setPreviewSize('medium'); setPreviewDistance(15); }}>
              Medium @ 15mi
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={() => { setPreviewSize('small'); setPreviewDistance(50); }}>
              Small @ 50mi
            </Button>
          </div>

          {/* Results display */}
          <Card
            className="mt-3"
            style={{
              borderColor: impactPreview.severity === 'catastrophic' ? '#dc3545' :
                          impactPreview.severity === 'major' ? '#fd7e14' :
                          impactPreview.severity === 'notable' ? '#ffc107' : '#6c757d',
              borderWidth: impactPreview.severity === 'catastrophic' ? '3px' : '1px'
            }}
          >
            <Card.Header style={{
              backgroundColor: impactPreview.severity === 'catastrophic' ? '#dc3545' :
                              impactPreview.severity === 'major' ? '#fd7e14' :
                              impactPreview.severity === 'notable' ? '#ffc107' : '#6c757d',
              color: impactPreview.severity === 'notable' ? '#000' : '#fff'
            }}>
              <strong>{impactPreview.summary}</strong>
              <Badge className="ms-2" bg="dark">{impactPreview.severity}</Badge>
            </Card.Header>
            <Card.Body>
              <h6>Narrative Description</h6>
              <p style={{ fontStyle: 'italic', fontSize: '1.1em', lineHeight: '1.6' }}>
                {impactPreview.narrative}
              </p>

              <Row>
                <Col md={4}>
                  <h6>Visual</h6>
                  <p className="text-muted" style={{ fontSize: '0.9em' }}>{impactPreview.visual || '—'}</p>
                </Col>
                <Col md={4}>
                  <h6>Sound</h6>
                  <p className="text-muted" style={{ fontSize: '0.9em' }}>{impactPreview.sound || '—'}</p>
                </Col>
                <Col md={4}>
                  <h6>Physical</h6>
                  <p className="text-muted" style={{ fontSize: '0.9em' }}>{impactPreview.physical || '—'}</p>
                </Col>
              </Row>

              {impactPreview.mechanics && (
                <Alert variant="warning" className="mt-3 mb-0">
                  <strong>Suggested Mechanics:</strong> {impactPreview.mechanics}
                </Alert>
              )}
            </Card.Body>
          </Card>
          </Card.Body>
        </Collapse>
      </Card>

      {/* Wanderer Analysis Results */}
      {wandererResults && (
        <>
          <Alert variant="info">
            <Alert.Heading><BsStar className="me-2" />Wanderer Analysis Complete</Alert.Heading>
            <p className="mb-0">
              Simulated {wandererResults.config.yearsAnalyzed} years.
              Average: <strong>{wandererResults.summary.avgStreaksPerYear} streaks/year</strong>,
              <strong> {wandererResults.summary.avgLocalFallsPerYear} local falls/year</strong>.
              Observable rate: <strong>{wandererResults.summary.observableRate}%</strong>.
            </p>
          </Alert>

          <Card className="mb-4">
            <Card.Body>
              <h5>Wanderer Statistics</h5>
              <Table striped bordered size="sm">
                <tbody>
                  <tr>
                    <td>Total Streaks ({wandererResults.config.yearsAnalyzed} years)</td>
                    <td><Badge bg="info">{wandererResults.summary.totalStreaks}</Badge></td>
                  </tr>
                  <tr>
                    <td>Total Local Falls</td>
                    <td><Badge bg="warning" text="dark">{wandererResults.summary.totalLocalFalls}</Badge></td>
                  </tr>
                  <tr>
                    <td>Average Streaks/Year</td>
                    <td>{wandererResults.summary.avgStreaksPerYear}</td>
                  </tr>
                  <tr>
                    <td>Average Local Falls/Year</td>
                    <td>{wandererResults.summary.avgLocalFallsPerYear}</td>
                  </tr>
                  <tr>
                    <td>Observable Rate</td>
                    <td>{wandererResults.summary.observableRate}%</td>
                  </tr>
                </tbody>
              </Table>

              <h6 className="mt-4">Size Distribution (Local Falls)</h6>
              <Table striped bordered size="sm">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(wandererResults.summary.sizeDistribution).map(([size, count]) => (
                    <tr key={size}>
                      <td style={{ textTransform: 'capitalize' }}>{size}</td>
                      <td>{count}</td>
                      <td>
                        {wandererResults.summary.totalLocalFalls > 0
                          ? ((count / wandererResults.summary.totalLocalFalls) * 100).toFixed(1) + '%'
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <h6 className="mt-4">Year-by-Year Breakdown</h6>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <Table striped bordered size="sm">
                  <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                    <tr>
                      <th>Year</th>
                      <th>Streaks</th>
                      <th>Local Falls</th>
                      <th>Events</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wandererResults.yearlyBreakdown.map((year) => (
                      <tr key={year.year}>
                        <td>{year.year}</td>
                        <td>{year.streaks}</td>
                        <td>
                          <Badge bg={year.localFalls > 0 ? 'warning' : 'secondary'} text="dark">
                            {year.localFalls}
                          </Badge>
                        </td>
                        <td style={{ fontSize: '0.8em' }}>
                          {year.events.map((e, i) => (
                            <span key={i} className="me-2">
                              {e.date} ({e.size}, {e.distance}mi {e.direction})
                            </span>
                          ))}
                          {year.events.length === 0 && <span className="text-muted">-</span>}
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

      {/* Heat Index Analysis Results */}
      {heatIndexResults && (
        <>
          <Alert variant={heatIndexResults.summary.biomesWithNoFeelsLike.length > 0 ? 'warning' : 'success'}>
            <Alert.Heading><BsThermometerHigh className="me-2" />Heat Index Analysis Complete</Alert.Heading>
            <p className="mb-0">
              Analyzed {heatIndexResults.config.biomesAnalyzed} hot-climate biomes over {heatIndexResults.config.daysAnalyzed} summer days x {heatIndexResults.config.yearsAnalyzed} years.
              "Feels Like" shown: <strong>{heatIndexResults.summary.feelsLikeShowRate}</strong> of hours above 80°F.
              Max heat index: <strong>{heatIndexResults.summary.maxHeatIndex}°F</strong> ({heatIndexResults.summary.maxHeatIndexBiome}).
            </p>
          </Alert>

          <Card className="mb-4">
            <Card.Body>
              <h5>Heat Index Summary</h5>
              <Table striped bordered size="sm">
                <tbody>
                  <tr>
                    <td>Total Test Hours</td>
                    <td>{heatIndexResults.summary.totalTestHours.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Hours Above 80°F</td>
                    <td><Badge bg="warning" text="dark">{heatIndexResults.summary.hoursAbove80F.toLocaleString()}</Badge></td>
                  </tr>
                  <tr>
                    <td>Hours "Feels Like" Displayed</td>
                    <td>
                      <Badge bg={heatIndexResults.summary.hoursShowingFeelsLike > 0 ? 'success' : 'danger'}>
                        {heatIndexResults.summary.hoursShowingFeelsLike.toLocaleString()}
                      </Badge>
                      {' '}({heatIndexResults.summary.feelsLikeShowRate})
                    </td>
                  </tr>
                  <tr>
                    <td>Average Humidity When Hot</td>
                    <td>{heatIndexResults.summary.avgHumidityWhenHot}%</td>
                  </tr>
                  <tr>
                    <td>Average Dew Point When Hot</td>
                    <td>{heatIndexResults.summary.avgDewPointWhenHot}°F</td>
                  </tr>
                  <tr>
                    <td>Max Heat Index</td>
                    <td><Badge bg="danger">{heatIndexResults.summary.maxHeatIndex}°F</Badge> ({heatIndexResults.summary.maxHeatIndexBiome})</td>
                  </tr>
                </tbody>
              </Table>

              {/* Biomes that never showed Feels Like */}
              {heatIndexResults.summary.biomesWithNoFeelsLike.length > 0 && (
                <>
                  <h6 className="mt-4 text-warning">Biomes That Never Showed "Feels Like"</h6>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <Table striped bordered size="sm">
                      <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                        <tr>
                          <th>Biome</th>
                          <th>Hours &gt;80°F</th>
                          <th>Max Temp</th>
                          <th>Max Heat Index</th>
                          <th>Avg Humidity</th>
                          <th>Avg Dew Point</th>
                        </tr>
                      </thead>
                      <tbody>
                        {heatIndexResults.summary.biomesWithNoFeelsLike.map((b, i) => (
                          <tr key={i}>
                            <td>{b.biomeName}</td>
                            <td>{b.hoursAbove80F}</td>
                            <td>{b.maxTemp}°F</td>
                            <td>{b.maxHeatIndex}°F</td>
                            <td>{b.avgHumidity}%</td>
                            <td>{b.avgDewPoint}°F</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}

              {/* Per-biome details */}
              <h6 className="mt-4">Per-Biome Results</h6>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered size="sm">
                  <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                    <tr>
                      <th>Biome</th>
                      <th>Has Dew Pt Profile</th>
                      <th>&gt;80°F</th>
                      <th>&gt;90°F</th>
                      <th>Feels Like Shown</th>
                      <th>Max Temp</th>
                      <th>Max Heat Idx</th>
                      <th>Humidity Range</th>
                      <th>Dew Pt Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(heatIndexResults.biomes).map((b, i) => (
                      <tr key={i}>
                        <td>{b.biomeName}</td>
                        <td>{b.hasDewPointProfile ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>}</td>
                        <td>{b.stats.hoursAbove80F}</td>
                        <td>{b.stats.hoursAbove90F}</td>
                        <td>
                          <Badge bg={b.stats.hoursWithFeelsLikeShowing > 0 ? 'success' : 'warning'}>
                            {b.stats.hoursWithFeelsLikeShowing}
                          </Badge>
                        </td>
                        <td>{b.stats.maxTemp}°F</td>
                        <td>{b.stats.maxHeatIndex}°F</td>
                        <td>{b.stats.humidityRange.min}-{b.stats.humidityRange.max}%</td>
                        <td>{b.stats.dewPointRange.min}-{b.stats.dewPointRange.max}°F</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </>
      )}

      {/* Precipitation Streak Analysis Results */}
      {streakResults && (
        <>
          <Alert variant={streakResults.issues.length > 0 ? 'danger' : streakResults.summary.biomesWithLongStreaks.length > 0 ? 'warning' : 'success'}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <Alert.Heading><BsWater className="me-2" />Precipitation Streak Analysis Complete</Alert.Heading>
                <p className="mb-0">
                  Analyzed {streakResults.config.biomesAnalyzed} biomes over {streakResults.config.daysAnalyzed} days.
                  Longest precip streak: <strong>{Math.floor(streakResults.summary.longestPrecipStreak.hours / 24)} days</strong> ({streakResults.summary.longestPrecipStreak.biome}).
                  {streakResults.issues.length > 0 && <strong className="text-danger"> {streakResults.issues.length} biome(s) with extreme streaks!</strong>}
                </p>
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(formatStreakResultsAsMarkdown(streakResults));
                  setStreakCopied(true);
                  setTimeout(() => setStreakCopied(false), 2000);
                }}
              >
                {streakCopied ? 'Copied!' : 'Copy Results'}
              </Button>
            </div>
          </Alert>

          <Card className="mb-4">
            <Card.Body>
              <h5>Summary</h5>
              <Table striped bordered size="sm">
                <tbody>
                  <tr>
                    <td>Average Precipitation Frequency</td>
                    <td>{streakResults.summary.avgPrecipFrequency}% of hours</td>
                  </tr>
                  <tr>
                    <td>Longest Precipitation Streak</td>
                    <td>
                      <Badge bg="info">{Math.floor(streakResults.summary.longestPrecipStreak.hours / 24)} days</Badge>
                      {' '}in {streakResults.summary.longestPrecipStreak.biome}
                      {streakResults.summary.longestPrecipStreak.dates && (
                        <span className="text-muted"> ({streakResults.summary.longestPrecipStreak.dates.startDate} - {streakResults.summary.longestPrecipStreak.dates.endDate})</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Longest Dry Streak</td>
                    <td>
                      <Badge bg="secondary">{Math.floor(streakResults.summary.longestDryStreak.hours / 24)} days</Badge>
                      {' '}in {streakResults.summary.longestDryStreak.biome}
                    </td>
                  </tr>
                  <tr>
                    <td>Biomes with Long Streaks (&gt;7 days)</td>
                    <td>
                      <Badge bg={streakResults.summary.biomesWithLongStreaks.length > 0 ? 'warning' : 'success'}>
                        {streakResults.summary.biomesWithLongStreaks.length}
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td>Biomes with Extreme Streaks (&gt;14 days)</td>
                    <td>
                      <Badge bg={streakResults.summary.biomesWithExtremeStreaks.length > 0 ? 'danger' : 'success'}>
                        {streakResults.summary.biomesWithExtremeStreaks.length}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </Table>

              {/* Issues list */}
              {streakResults.issues.length > 0 && (
                <>
                  <h6 className="mt-3 text-danger">Extreme Precipitation Streaks (&gt;14 days)</h6>
                  <Table striped bordered size="sm">
                    <thead>
                      <tr>
                        <th>Biome</th>
                        <th>Days</th>
                        <th>Dates</th>
                        <th>Precip Types</th>
                      </tr>
                    </thead>
                    <tbody>
                      {streakResults.issues.map((issue, i) => (
                        <tr key={i}>
                          <td><strong>{issue.biome}</strong></td>
                          <td><Badge bg="danger">{issue.details?.days || Math.floor(issue.details?.hours / 24)}</Badge></td>
                          <td>{issue.details?.startDate} - {issue.details?.endDate}</td>
                          <td>{issue.details?.types?.join(', ') || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}

              {/* Long streaks (warning level) */}
              {streakResults.summary.biomesWithLongStreaks.length > 0 && (
                <>
                  <h6 className="mt-3 text-warning">Long Precipitation Streaks (7-14 days)</h6>
                  <Table striped bordered size="sm">
                    <thead>
                      <tr>
                        <th>Biome</th>
                        <th>Days</th>
                        <th>Dates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {streakResults.summary.biomesWithLongStreaks.map((item, i) => (
                        <tr key={i}>
                          <td>{item.biome}</td>
                          <td><Badge bg="warning" text="dark">{item.days}</Badge></td>
                          <td>{item.details?.startDate} - {item.details?.endDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}

              {/* All biomes breakdown */}
              <h6 className="mt-3">All Biomes - Precipitation Stats</h6>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered size="sm">
                  <thead style={{ position: 'sticky', top: 0, background: '#fff' }}>
                    <tr>
                      <th>Biome</th>
                      <th>Precip Freq</th>
                      <th>Longest Precip</th>
                      <th>Longest Dry</th>
                      <th>Total Precip Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(streakResults.biomes)
                      .sort((a, b) => b.stats.longestPrecipStreak - a.stats.longestPrecipStreak)
                      .map((b, i) => (
                        <tr key={i} className={b.stats.longestPrecipStreak >= 14 * 24 ? 'table-danger' : b.stats.longestPrecipStreak >= 7 * 24 ? 'table-warning' : ''}>
                          <td>{b.biomeName}</td>
                          <td>{b.stats.precipFrequency}%</td>
                          <td>
                            <Badge bg={b.stats.longestPrecipStreak >= 14 * 24 ? 'danger' : b.stats.longestPrecipStreak >= 7 * 24 ? 'warning' : 'secondary'}>
                              {Math.floor(b.stats.longestPrecipStreak / 24)}d {b.stats.longestPrecipStreak % 24}h
                            </Badge>
                            {b.longestPrecipDetails && <small className="text-muted ms-1">({b.longestPrecipDetails.startDate})</small>}
                          </td>
                          <td>{Math.floor(b.stats.longestDryStreak / 24)}d</td>
                          <td>{b.stats.totalPrecipHours.toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </>
      )}

      {/* Precipitation Type Analysis Results */}
      {typeResults && (
        <>
          <Alert variant={typeResults.issues.length > 0 ? 'warning' : 'success'}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <Alert.Heading><BsArrowRepeat className="me-2" />Precipitation Type Analysis Complete</Alert.Heading>
                <p className="mb-0">
                  Analyzed {typeResults.config.biomesAnalyzed} biomes ({typeResults.config.biomesSkipped} skipped - outside temp range).
                  Avg type persistence: <strong>{typeResults.summary.avgTypePersistence} hours</strong>.
                  {typeResults.summary.biomesWithCycling.length > 0 && <strong className="text-warning"> {typeResults.summary.biomesWithCycling.length} biome(s) with cycling issues!</strong>}
                </p>
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(formatTypeResultsAsMarkdown(typeResults));
                  setTypeCopied(true);
                  setTimeout(() => setTypeCopied(false), 2000);
                }}
              >
                {typeCopied ? 'Copied!' : 'Copy Results'}
              </Button>
            </div>
          </Alert>

          <Card className="mb-4">
            <Card.Body>
              <h5>Summary</h5>
              <Table striped bordered size="sm">
                <tbody>
                  <tr>
                    <td>Total Precipitation Events</td>
                    <td>{typeResults.summary.totalPrecipEvents}</td>
                  </tr>
                  <tr>
                    <td>Total Type Changes</td>
                    <td>{typeResults.summary.totalTypeChanges}</td>
                  </tr>
                  <tr>
                    <td>Avg Type Changes per Event</td>
                    <td>
                      <Badge bg={parseFloat(typeResults.summary.avgTypeChangesPerEvent) > 2 ? 'warning' : 'success'}>
                        {typeResults.summary.avgTypeChangesPerEvent}
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td>Avg Type Persistence</td>
                    <td>
                      <Badge bg={parseFloat(typeResults.summary.avgTypePersistence) < 3 ? 'warning' : 'success'}>
                        {typeResults.summary.avgTypePersistence} hours
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td>Biomes with Cycling Issues</td>
                    <td>
                      <Badge bg={typeResults.summary.biomesWithCycling.length > 0 ? 'warning' : 'success'}>
                        {typeResults.summary.biomesWithCycling.length}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </Table>

              {/* Transition Counts */}
              <h6 className="mt-3">Type Transitions (All Biomes)</h6>
              <Table striped bordered size="sm">
                <thead>
                  <tr>
                    <th>Transition</th>
                    <th>Count</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Snow → Sleet</td>
                    <td>{typeResults.summary.transitionCounts.snowToSleet}</td>
                    <td className="text-muted">Normal warming transition</td>
                  </tr>
                  <tr>
                    <td>Sleet → Snow</td>
                    <td>{typeResults.summary.transitionCounts.sleetToSnow}</td>
                    <td className="text-muted">Normal cooling transition</td>
                  </tr>
                  <tr>
                    <td>Sleet → Rain</td>
                    <td>{typeResults.summary.transitionCounts.sleetToRain}</td>
                    <td className="text-muted">Normal warming transition</td>
                  </tr>
                  <tr>
                    <td>Rain → Sleet</td>
                    <td>{typeResults.summary.transitionCounts.rainToSleet}</td>
                    <td className="text-muted">Normal cooling transition</td>
                  </tr>
                  <tr className={typeResults.summary.transitionCounts.snowToRain > 10 ? 'table-danger' : ''}>
                    <td>Snow → Rain <strong>(Direct)</strong></td>
                    <td>
                      <Badge bg={typeResults.summary.transitionCounts.snowToRain > 10 ? 'danger' : 'secondary'}>
                        {typeResults.summary.transitionCounts.snowToRain}
                      </Badge>
                    </td>
                    <td className="text-danger">Should go through sleet</td>
                  </tr>
                  <tr className={typeResults.summary.transitionCounts.rainToSnow > 10 ? 'table-danger' : ''}>
                    <td>Rain → Snow <strong>(Direct)</strong></td>
                    <td>
                      <Badge bg={typeResults.summary.transitionCounts.rainToSnow > 10 ? 'danger' : 'secondary'}>
                        {typeResults.summary.transitionCounts.rainToSnow}
                      </Badge>
                    </td>
                    <td className="text-danger">Should go through sleet</td>
                  </tr>
                  <tr>
                    <td>Other Transitions</td>
                    <td>{typeResults.summary.transitionCounts.other}</td>
                    <td className="text-muted">Freezing rain, etc.</td>
                  </tr>
                </tbody>
              </Table>

              {/* Biomes with cycling issues */}
              {typeResults.summary.biomesWithCycling.length > 0 && (
                <>
                  <h6 className="mt-3 text-warning">Biomes with Cycling Issues</h6>
                  <Table striped bordered size="sm">
                    <thead>
                      <tr>
                        <th>Biome</th>
                        <th>Avg Changes/Event</th>
                        <th>Cycling Events</th>
                        <th>Worst Event</th>
                      </tr>
                    </thead>
                    <tbody>
                      {typeResults.summary.biomesWithCycling.map((item, i) => (
                        <tr key={i}>
                          <td><strong>{item.biome}</strong></td>
                          <td><Badge bg="warning" text="dark">{item.avgChangesPerEvent}</Badge></td>
                          <td>{item.cyclingEvents}</td>
                          <td style={{ fontSize: '0.85em' }}>
                            {item.worstEvent ? (
                              <>
                                {item.worstEvent.typeChanges} changes in {item.worstEvent.duration}h
                                <br />
                                <span className="text-muted">{item.worstEvent.typeSequence}</span>
                              </>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}

              {/* All biomes breakdown */}
              <h6 className="mt-3">All Biomes - Type Stats</h6>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered size="sm">
                  <thead style={{ position: 'sticky', top: 0, background: '#fff' }}>
                    <tr>
                      <th>Biome</th>
                      <th>Winter Mean</th>
                      <th>Events</th>
                      <th>Changes/Event</th>
                      <th>Persistence</th>
                      <th>Type Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(typeResults.biomes)
                      .sort((a, b) => parseFloat(b.stats.avgChangesPerEvent) - parseFloat(a.stats.avgChangesPerEvent))
                      .map((b, i) => (
                        <tr key={i} className={parseFloat(b.stats.avgChangesPerEvent) > 2 ? 'table-warning' : ''}>
                          <td>{b.biomeName}</td>
                          <td>{b.winterMean}°F</td>
                          <td>{b.stats.precipEvents}</td>
                          <td>
                            <Badge bg={parseFloat(b.stats.avgChangesPerEvent) > 2 ? 'warning' : 'secondary'} text={parseFloat(b.stats.avgChangesPerEvent) > 2 ? 'dark' : 'light'}>
                              {b.stats.avgChangesPerEvent}
                            </Badge>
                          </td>
                          <td>{b.stats.avgTypePersistence || '-'}h</td>
                          <td style={{ fontSize: '0.8em' }}>
                            {b.stats.typeDistribution.snow > 0 && <Badge bg="info" className="me-1">Snow: {b.stats.typeDistribution.snow}</Badge>}
                            {b.stats.typeDistribution.sleet > 0 && <Badge bg="secondary" className="me-1">Sleet: {b.stats.typeDistribution.sleet}</Badge>}
                            {b.stats.typeDistribution.rain > 0 && <Badge bg="primary" className="me-1">Rain: {b.stats.typeDistribution.rain}</Badge>}
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
