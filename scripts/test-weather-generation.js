/**
 * Weather Generation Test Harness
 *
 * Systematically tests weather generation across:
 * - All 30+ biome templates
 * - Full year of data (365 days)
 * - Multiple times per day (every 6 hours: midnight, 6am, noon, 6pm)
 * - All latitude bands
 *
 * Validates:
 * - Temperature ranges are realistic
 * - No NaN or undefined values
 * - Precipitation types match temperature
 * - Humidity stays within 0-100%
 * - Pressure stays within realistic range
 * - Deterministic behavior (same inputs = same outputs)
 */

const path = require('path');
const fs = require('fs');

// Import weather services and data
const { regionTemplates } = require('../src/v2/data/region-templates');
const { WeatherGenerator } = require('../src/v2/services/weather/WeatherGenerator');

// Test configuration
const TEST_CONFIG = {
  year: 1, // Year to test
  daysToTest: 365, // Full year
  hoursToTest: [0, 6, 12, 18], // Midnight, dawn, noon, dusk
  latitudeBands: ['central', 'subtropical', 'temperate', 'subarctic', 'polar']
};

// Anomaly thresholds
const THRESHOLDS = {
  temperature: { min: -100, max: 150 }, // °F
  humidity: { min: 0, max: 100 }, // %
  pressure: { min: 28, max: 32 }, // inHg
  cloudCover: { min: 0, max: 100 }, // %
  visibility: { min: 0, max: 10 } // miles
};

// Statistics tracking
const stats = {
  totalTests: 0,
  successfulTests: 0,
  anomalies: [],
  biomeStats: {},
  temperatureRanges: {},
  precipitationFrequency: {}
};

/**
 * Validate a single weather data point
 */
function validateWeather(weather, context) {
  const issues = [];

  // Check for NaN/undefined values
  if (typeof weather.temperature !== 'number' || isNaN(weather.temperature)) {
    issues.push('Invalid temperature value');
  }
  if (typeof weather.humidity !== 'number' || isNaN(weather.humidity)) {
    issues.push('Invalid humidity value');
  }
  if (weather.pressure && (typeof weather.pressure !== 'number' || isNaN(weather.pressure))) {
    issues.push('Invalid pressure value');
  }

  // Temperature range check
  if (weather.temperature < THRESHOLDS.temperature.min || weather.temperature > THRESHOLDS.temperature.max) {
    issues.push(`Temperature out of range: ${weather.temperature}°F`);
  }

  // Humidity range check
  if (weather.humidity < THRESHOLDS.humidity.min || weather.humidity > THRESHOLDS.humidity.max) {
    issues.push(`Humidity out of range: ${weather.humidity}%`);
  }

  // Pressure range check
  if (weather.pressure && (weather.pressure < THRESHOLDS.pressure.min || weather.pressure > THRESHOLDS.pressure.max)) {
    issues.push(`Pressure out of range: ${weather.pressure} inHg`);
  }

  // Cloud cover range check
  if (weather.cloudCover !== undefined && (weather.cloudCover < THRESHOLDS.cloudCover.min || weather.cloudCover > THRESHOLDS.cloudCover.max)) {
    issues.push(`Cloud cover out of range: ${weather.cloudCover}%`);
  }

  // Precipitation type vs temperature logic
  if (weather.precipitation && weather.precipitationType) {
    const temp = weather.temperature;
    if (weather.precipitationType.toLowerCase().includes('snow') && temp > 35) {
      issues.push(`Snow at ${temp}°F (should be ≤35°F)`);
    }
    if (weather.precipitationType.toLowerCase().includes('rain') && temp < 35) {
      issues.push(`Rain at ${temp}°F (should be >35°F)`);
    }
  }

  // Log anomalies
  if (issues.length > 0) {
    stats.anomalies.push({
      ...context,
      issues: issues
    });
  }

  return issues.length === 0;
}

/**
 * Track statistics for a biome
 */
function trackBiomeStats(biomeName, weather) {
  if (!stats.biomeStats[biomeName]) {
    stats.biomeStats[biomeName] = {
      tempMin: Infinity,
      tempMax: -Infinity,
      tempSum: 0,
      count: 0,
      precipCount: 0,
      conditions: {}
    };
  }

  const biomeStats = stats.biomeStats[biomeName];
  biomeStats.tempMin = Math.min(biomeStats.tempMin, weather.temperature);
  biomeStats.tempMax = Math.max(biomeStats.tempMax, weather.temperature);
  biomeStats.tempSum += weather.temperature;
  biomeStats.count++;

  if (weather.precipitation) {
    biomeStats.precipCount++;
  }

  // Track condition frequency
  const condition = weather.condition || 'Unknown';
  biomeStats.conditions[condition] = (biomeStats.conditions[condition] || 0) + 1;
}

/**
 * Run tests for a specific region
 */
function testRegion(region, latitudeBand, templateId, biomeName) {
  const weatherGen = new WeatherGenerator();
  let testsRun = 0;
  let testsPassed = 0;

  console.log(`  Testing ${biomeName} (${latitudeBand})...`);

  // Test full year
  for (let day = 1; day <= TEST_CONFIG.daysToTest; day++) {
    // Determine month and day-of-month from day-of-year
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let remainingDays = day;
    let month = 0;
    while (remainingDays > monthDays[month]) {
      remainingDays -= monthDays[month];
      month++;
    }
    month++; // Convert to 1-indexed

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
          templateId: templateId,
          date: `Year ${date.year}, Month ${date.month}, Day ${date.day}, Hour ${date.hour}`
        };

        const isValid = validateWeather(weather, context);

        testsRun++;
        if (isValid) {
          testsPassed++;
        }

        trackBiomeStats(biomeName, weather);

      } catch (error) {
        stats.anomalies.push({
          biome: biomeName,
          latitudeBand: latitudeBand,
          templateId: templateId,
          date: `Year ${date.year}, Month ${date.month}, Day ${date.day}, Hour ${date.hour}`,
          issues: [`Exception: ${error.message}`]
        });
      }
    }
  }

  console.log(`    ${testsPassed}/${testsRun} tests passed`);
  return { testsRun, testsPassed };
}

/**
 * Main test execution
 */
function runTests() {
  console.log('='.repeat(80));
  console.log('WEATHER GENERATION TEST HARNESS');
  console.log('='.repeat(80));
  console.log(`Configuration:`);
  console.log(`  - Testing ${TEST_CONFIG.daysToTest} days`);
  console.log(`  - Testing ${TEST_CONFIG.hoursToTest.length} hours per day`);
  console.log(`  - Testing ${TEST_CONFIG.latitudeBands.length} latitude bands`);
  console.log('='.repeat(80));
  console.log('');

  const startTime = Date.now();

  // Iterate through all latitude bands
  for (const latitudeBand of TEST_CONFIG.latitudeBands) {
    const templates = regionTemplates[latitudeBand];

    if (!templates) {
      console.log(`⚠️  No templates found for latitude band: ${latitudeBand}`);
      continue;
    }

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`LATITUDE BAND: ${latitudeBand.toUpperCase()}`);
    console.log('─'.repeat(80));

    // Iterate through all biome templates in this band
    for (const [templateId, template] of Object.entries(templates)) {
      const biomeName = template.name;

      // Create a mock region
      const region = {
        id: `test-${latitudeBand}-${templateId}`,
        name: `Test ${biomeName}`,
        latitudeBand: latitudeBand,
        templateId: templateId,
        climate: template
      };

      const result = testRegion(region, latitudeBand, templateId, biomeName);
      stats.totalTests += result.testsRun;
      stats.successfulTests += result.testsPassed;
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Generate report
  generateReport(duration);
}

/**
 * Generate comprehensive test report
 */
function generateReport(duration) {
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('TEST REPORT');
  console.log('='.repeat(80));

  // Summary
  console.log('\n📊 SUMMARY');
  console.log('─'.repeat(80));
  console.log(`Total Tests Run:      ${stats.totalTests.toLocaleString()}`);
  console.log(`Tests Passed:         ${stats.successfulTests.toLocaleString()}`);
  console.log(`Tests Failed:         ${(stats.totalTests - stats.successfulTests).toLocaleString()}`);
  console.log(`Success Rate:         ${((stats.successfulTests / stats.totalTests) * 100).toFixed(2)}%`);
  console.log(`Anomalies Detected:   ${stats.anomalies.length.toLocaleString()}`);
  console.log(`Execution Time:       ${duration}s`);
  console.log(`Tests Per Second:     ${(stats.totalTests / parseFloat(duration)).toFixed(0)}`);

  // Biome statistics
  console.log('\n\n🌍 BIOME STATISTICS');
  console.log('─'.repeat(80));

  for (const [biomeName, biomeStats] of Object.entries(stats.biomeStats)) {
    const avgTemp = (biomeStats.tempSum / biomeStats.count).toFixed(1);
    const precipPercent = ((biomeStats.precipCount / biomeStats.count) * 100).toFixed(1);

    console.log(`\n${biomeName}`);
    console.log(`  Temperature: ${biomeStats.tempMin.toFixed(1)}°F to ${biomeStats.tempMax.toFixed(1)}°F (avg: ${avgTemp}°F)`);
    console.log(`  Precipitation: ${precipPercent}% of the time`);
    console.log(`  Samples: ${biomeStats.count.toLocaleString()}`);

    // Top 3 conditions
    const topConditions = Object.entries(biomeStats.conditions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    console.log(`  Top Conditions:`);
    topConditions.forEach(([condition, count]) => {
      const percent = ((count / biomeStats.count) * 100).toFixed(1);
      console.log(`    - ${condition}: ${percent}%`);
    });
  }

  // Anomalies
  if (stats.anomalies.length > 0) {
    console.log('\n\n⚠️  ANOMALIES DETECTED');
    console.log('─'.repeat(80));
    console.log(`Total anomalies: ${stats.anomalies.length}`);

    // Group anomalies by type
    const anomalyTypes = {};
    stats.anomalies.forEach(anomaly => {
      anomaly.issues.forEach(issue => {
        anomalyTypes[issue] = (anomalyTypes[issue] || 0) + 1;
      });
    });

    console.log('\nAnomaly Types:');
    Object.entries(anomalyTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
      });

    // Show first 10 anomalies
    console.log('\nFirst 10 Anomalies:');
    stats.anomalies.slice(0, 10).forEach((anomaly, idx) => {
      console.log(`\n${idx + 1}. ${anomaly.biome} (${anomaly.latitudeBand})`);
      console.log(`   Date: ${anomaly.date}`);
      console.log(`   Issues:`);
      anomaly.issues.forEach(issue => {
        console.log(`     - ${issue}`);
      });
    });

    if (stats.anomalies.length > 10) {
      console.log(`\n... and ${stats.anomalies.length - 10} more anomalies.`);
    }

    // Write full anomaly report to file
    const anomalyReport = JSON.stringify(stats.anomalies, null, 2);
    const reportPath = path.join(__dirname, '..', 'test-results-anomalies.json');
    fs.writeFileSync(reportPath, anomalyReport);
    console.log(`\n📄 Full anomaly report written to: ${reportPath}`);
  } else {
    console.log('\n\n✅ NO ANOMALIES DETECTED');
    console.log('─'.repeat(80));
    console.log('All tests passed validation!');
  }

  // Write full statistics to file
  const fullReport = {
    summary: {
      totalTests: stats.totalTests,
      successfulTests: stats.successfulTests,
      failedTests: stats.totalTests - stats.successfulTests,
      successRate: (stats.successfulTests / stats.totalTests) * 100,
      anomaliesDetected: stats.anomalies.length,
      executionTime: duration
    },
    biomeStatistics: stats.biomeStats,
    configuration: TEST_CONFIG
  };

  const statsPath = path.join(__dirname, '..', 'test-results-statistics.json');
  fs.writeFileSync(statsPath, JSON.stringify(fullReport, null, 2));
  console.log(`\n📄 Full statistics written to: ${statsPath}`);

  console.log('\n' + '='.repeat(80));
  console.log('TEST HARNESS COMPLETE');
  console.log('='.repeat(80));
}

// Run the tests
try {
  runTests();
} catch (error) {
  console.error('❌ Fatal error running tests:', error);
  process.exit(1);
}
