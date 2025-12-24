# Sprint 25 - Cobalt

**Date**: 2025-12-23
**Focus**: Sunrise/sunset timing integration, vestigial factor cleanup, new boreal templates

---

## Summary

This sprint completed the sunrise/sunset timing fix in TemperatureService, cleaned up vestigial special factors, and created 3 new boreal templates to populate the previously sparse boreal band.

---

## What Was Accomplished

### 1. Sunrise/Sunset Timing Integration ✓

**File**: `src/v2/services/weather/TemperatureService.js`

Replaced hardcoded 5 AM / 3 PM temperature timing with actual sunrise/sunset values from SunriseSunsetService:

```javascript
// Before (hardcoded):
const minHour = 5;  // 5 AM
const maxHour = 15; // 3 PM

// After (dynamic):
const sunData = SunriseSunsetService.getSunriseSunset(latitudeBand, date);
if (sunData.sunriseHour !== null && sunData.sunsetHour !== null) {
  minHour = sunData.sunriseHour;
  const solarNoon = (sunData.sunriseHour + sunData.sunsetHour) / 2;
  maxHour = solarNoon + 3; // Thermal lag
}
```

Special handling for polar conditions:
- **Polar day (24hr daylight)**: Uses midnight/noon for min/max
- **Polar night**: Returns 20% of normal temperature variation

### 2. Performance Fix - SunriseSunsetService Caching ✓

**File**: `src/v2/services/celestial/SunriseSunsetService.js`

After integrating sunrise/sunset calls, the test harness became very slow. Added daily caching:

```javascript
getDailySunData(latitudeBand, gameDate, θ_obs) {
  const cacheKey = `${latitudeBand}:${gameDate.year}:${gameDate.month}:${gameDate.day}:${θ_obs}`;
  if (this.cache.has(cacheKey)) {
    return this.cache.get(cacheKey);
  }
  // ... expensive calculation ...
  this.cache.set(cacheKey, result);
  return result;
}
```

### 3. Vestigial Special Factors Cleanup ✓

**File**: `src/v2/data/region-templates.js`

Removed unused special factors from all templates per Tyler's direction. Factors removed:
- `highBiodiversity` - purely decorative
- `polarDay`, `polarNight` - handled by SunriseSunsetService
- `coldWinters`, `extremeCold` - redundant with temperature profiles
- `permafrost` (as factor, kept as groundType value)
- `snowpack`, `seaIce` - not implemented
- `coniferousForest` - decorative

Factors **preserved** for future ExtremeWeather implementation:
- `forestDensity`, `grasslandDensity` - could affect wind/humidity
- `thunderstorms`, `tornadoRisk`, `hurricaneRisk` - severe weather triggers
- `highWinds`, `coastalWinds` - wind generation
- `hasFog`, `wildfire` - condition triggers

### 4. New Boreal Templates ✓

**File**: `src/v2/data/region-templates.js`

Created 3 new templates to populate the boreal band (2,500-3,500 mi):

| Template | Real-World Analog | Winter Mean | Summer Mean |
|----------|-------------------|-------------|-------------|
| `boreal-forest` | Duluth MN, Thunder Bay | 10°F | 68°F |
| `cold-continental-prairie` | Fargo ND, Regina SK | 12°F | 72°F |
| `boreal-lake-district` | Boundary Waters MN | 10°F | 66°F |

Each template includes appropriate `specialFactors`:
- **Boreal Forest**: `forestDensity: 0.85`, `groundType: 'soil'`
- **Cold Continental Prairie**: `grasslandDensity: 0.9`, `highDiurnalVariation: true`, `thunderstorms: 0.6`, `tornadoRisk: 0.3`, `highWinds: 0.6`
- **Boreal Lake District**: `forestDensity: 0.7`, `hasFog: true`, `standingWater: 0.6`

### 5. isNew Tag and Test Filter ✓

**Files**: `region-templates.js`, `testRunner.js`, `WeatherTestHarness.jsx`

Added ability to test only new templates:
- Added `isNew: true` flag to new boreal templates
- Updated `runTests()` to accept `{ newOnly }` option
- Added checkbox in UI: "New templates only" with badge count

### 6. UI Fix - Table Text Visibility ✓

**File**: `src/v2/components/testing/results/BiomeStatsTable.jsx`

Fixed hard-to-read gray text in stats table by adding explicit dark color:
```javascript
<tbody style={{ color: '#212529' }}>
```

---

## Test Results

All 3 new boreal templates passed validation (weather-test-results-7.json):

| Template | Avg Temp | Expected | Deviation | Snow Days | Max Snow |
|----------|----------|----------|-----------|-----------|----------|
| Boreal Forest | 39°F | 38°F | +1.2°F | 124 | 96.3" |
| Cold Continental Prairie | 41°F | 40°F | +0.6°F | 118 | 65.7" |
| Boreal Lake District | 41°F | 40°F | +0.7°F | 122 | 75.1" |

- No anomalies detected
- No problem biomes flagged
- Temperature deviations all under 1.5°F (threshold is 15°F)

---

## Key Files Modified This Sprint

| File | Changes |
|------|---------|
| `src/v2/services/weather/TemperatureService.js` | Integrated SunriseSunsetService for dynamic timing |
| `src/v2/services/celestial/SunriseSunsetService.js` | Added daily caching for performance |
| `src/v2/data/region-templates.js` | Removed vestigial factors, added 3 boreal templates |
| `src/v2/components/testing/testRunner.js` | Added `newOnly` filter option |
| `src/v2/components/testing/WeatherTestHarness.jsx` | Added new templates checkbox filter |
| `src/v2/components/testing/results/BiomeStatsTable.jsx` | Fixed text color visibility |
| `src/v2/models/types.js` | Added `boreal-grassland` to biome names |

---

## What's Next

### Immediate:
1. **More templates** - Humid Subtropical and Steppe biomes (from Slate's suggestions)
2. **Polar twilight lands** - Tyler's idea: first 500mi from center as magical twilight zone

### Future (from NOTES_FROM_USER.md):
1. **Denver snow behavior** - Implement `groundType` affecting melt rates
2. **ExtremeWeather system** - Use preserved factors (thunderstorms, tornadoRisk, etc.)
3. **Export clipboard button** - Add "Copy to Clipboard" for test harness

---

*Sprint 25 - Cobalt*
