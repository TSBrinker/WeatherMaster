# Weather Generation Test Harness

## Overview

The Weather Test Harness is a comprehensive testing tool that validates weather generation across all biomes and seasons.

## Features

- **Comprehensive Coverage**: Tests all 30+ biome templates
- **Full Year Simulation**: Generates weather for all 365 days
- **Multiple Time Points**: Tests 4 times per day (midnight, 6am, noon, 6pm)
- **Real-time Progress**: Visual progress bar shows test execution
- **Validation Checks**: Detects anomalies and out-of-range values
- **Statistical Analysis**: Provides temperature ranges, precipitation frequency, and more
- **Export Results**: Download full test results as JSON

## How to Use

### 1. Start the Development Server

```bash
npm start
```

### 2. Access the Test Harness

Navigate to: **http://localhost:3000/?test=true**

### 3. Run Tests

1. Click the "Run Test Harness" button
2. Wait 10-30 seconds for tests to complete (runs ~43,800 tests)
3. Review results on-screen

### 4. Download Results

Click "Download Full Results (JSON)" to save the complete test data for further analysis.

## What It Tests

### Validation Checks

- **Temperature**: Must be between -100°F and 150°F
- **Humidity**: Must be between 0% and 100%
- **Pressure**: Must be between 28 and 32 inHg
- **Cloud Cover**: Must be between 0% and 100%
- **Precipitation Logic**: Snow should only occur ≤35°F, rain only >35°F
- **Data Types**: All values must be valid numbers (no NaN/undefined)

### Statistics Collected

For each biome:
- **Temperature Range**: Minimum, maximum, and average temperatures
- **Precipitation Frequency**: Percentage of time with active precipitation
- **Sample Count**: Total number of data points generated

## Test Configuration

```javascript
{
  year: 1,                    // Test year
  daysToTest: 365,           // Full year
  hoursToTest: [0, 6, 12, 18], // 4 times per day
  latitudeBands: [            // All 5 latitude bands
    'central',
    'subtropical',
    'temperate',
    'subarctic',
    'polar'
  ]
}
```

**Total Tests**: ~43,800 weather data points
- 30 biomes × 365 days × 4 hours = 43,800 tests

## Interpreting Results

### Success Metrics

- **100% Success Rate**: All tests passed validation ✅
- **95-99% Success Rate**: Minor anomalies detected, review recommended ⚠️
- **<95% Success Rate**: Significant issues, investigation required ❌

### Common Anomalies

1. **Temperature Out of Range**: Extremely hot or cold temperatures that may indicate calculation errors
2. **Invalid Precipitation Type**: Snow in warm weather or rain in freezing conditions
3. **NaN Values**: Indicates calculation errors in weather services
4. **Pressure Out of Range**: Unrealistic atmospheric pressure values

## Example Results

```
Test Results:
- Total Tests: 43,800
- Passed: 43,650
- Failed: 150
- Success Rate: 99.66%
- Anomalies: 150

Biome Statistics:
Tundra Plain
  Temperature: -12.0°F to 42.0°F (avg: 14.3°F)
  Precipitation: 23.5% of the time
  Samples: 1,460

Equatorial Rainforest
  Temperature: 76.2°F to 83.8°F (avg: 80.1°F)
  Precipitation: 68.2% of the time
  Samples: 1,460
```

## Troubleshooting

### Tests Run Too Slowly

The harness processes 43,800+ data points. This typically takes 10-30 seconds depending on your machine. If it takes significantly longer:
- Close other browser tabs
- Disable browser extensions
- Try a different browser

### Anomalies Detected

If anomalies are found:
1. Download the full JSON results
2. Review the `anomalies` array for patterns
3. Check if anomalies cluster in specific biomes or seasons
4. Report findings to developers

### Can't Access Test Page

Make sure you're using the exact URL: `http://localhost:3000/?test=true`

The `?test=true` parameter is required to load the test harness.

## Files

- **Test Component**: `src/v2/components/testing/WeatherTestHarness.jsx`
- **Test App Wrapper**: `src/TestApp.jsx`
- **Entry Point**: `src/index.jsx` (checks for `?test=true` parameter)

## Future Enhancements

- [ ] Benchmark performance (tests per second)
- [ ] Compare results across different runs (regression testing)
- [ ] Export results as CSV for Excel analysis
- [ ] Add visual charts/graphs
- [ ] Test extreme edge cases (polar regions, disc center)
- [ ] Validate celestial mechanics (sunrise/sunset times)

---

**Happy Testing!** 🧪

