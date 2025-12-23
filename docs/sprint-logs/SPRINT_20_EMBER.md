# Sprint 20: Precipitation Analysis & Ground Temperature Design - "Ember"

**Date**: 2025-12-23
**Agent**: Ember (Claude Opus 4.5)
**Status**: COMPLETE (Diagnostics) / READY FOR IMPLEMENTATION (Ground Temp)

---

## Sprint Goals

1. Build precipitation analysis test to diagnose snow accumulation issues
2. Analyze test results to identify root cause
3. Design systemic fix (not biome-specific patches)

---

## Completed Work

### 1. Precipitation Analysis Test

Built a new test module for the test harness that captures hourly time-series data for cold-climate biomes.

**Features**:
- Filters to biomes with winter mean ≤ 32°F (15 biomes)
- Runs 720 hours (30 days) starting January 15
- Captures per-hour: temperature, precip type, intensity, snow depth, melt rate, ground condition
- Tracks key metrics: precip type changes, rain-on-snow events, max snow depth
- Identifies biomes with complete snow melt

**Files Added/Modified**:
- `src/v2/components/testing/testConfig.js` - Added `PRECIP_ANALYSIS_CONFIG`
- `src/v2/components/testing/testRunner.js` - Added `runPrecipitationAnalysis()`
- `src/v2/components/testing/resultExporters.js` - Added `downloadPrecipAnalysis()`, `downloadPrecipSummary()`
- `src/v2/components/testing/WeatherTestHarness.jsx` - Added UI section for precip analysis

### 2. Diagnostic Analysis

Ran the test and analyzed `docs/testing-results/precip-summary-1.json`.

**Key Findings**:

| Biome Type | Precip Type Changes | Rain-on-Snow | Behavior |
|------------|---------------------|--------------|----------|
| Cold (winter mean < 0°F) | 0 | 0 | Always snow, stable |
| Marginal (winter mean 20-32°F) | 18-74 | 0-23 | Volatile, problematic |

**Root Cause Identified**:
Precipitation type is evaluated **hourly** based on instantaneous air temperature with no temporal coherence. When biomes oscillate through the 28-38°F transition zone, precip type flip-flops every few hours.

**Problem Biomes**:
- Continental Prairie: 24 type changes, 16 rain-on-snow events, **complete melt**
- Convergence Zone: 72 type changes, 23 rain-on-snow events, **complete melt**
- River Valley: 74 type changes, 20 rain-on-snow events (but retained snow due to higher precip volume)

### 3. Solution Design: Ground Temperature System

Tyler's insight: Ground temperature lags behind air temperature. This naturally prevents rapid flip-flopping because:
- Snow won't stick on warm ground even if air is cold
- Snow won't melt instantly when air warms if ground is frozen

**Proposed Implementation** (Option 1 - Simple Rolling Average):

1. Add `groundType` to biome templates with thermal inertia values:
   - `rock`: 0.95 (48-72 hour lag) - Mountains
   - `soil`: 0.85 (24-36 hour lag) - Most temperate
   - `sand`: 0.70 (12-18 hour lag) - Deserts
   - `clay`: 0.90 (36-48 hour lag) - River valleys
   - `peat`: 0.85 (24-36 hour lag) - Bogs
   - `permafrost`: 0.98 (72+ hour lag) - Polar

2. Create `GroundTemperatureService.js`:
   - Look back N hours based on thermal inertia
   - Calculate weighted average of air temperatures
   - Return ground temperature

3. Modify `SnowAccumulationService.js`:
   - Use ground temp for snow accumulation (ground must be ≤ 33°F for snow to stick)
   - Use ground temp for melt rate calculation

---

## Files Modified

### Test Harness
- `src/v2/components/testing/testConfig.js` - Added PRECIP_ANALYSIS_CONFIG
- `src/v2/components/testing/testRunner.js` - Added runPrecipitationAnalysis(), getColdClimateBiomes()
- `src/v2/components/testing/resultExporters.js` - Added export functions for precip analysis
- `src/v2/components/testing/WeatherTestHarness.jsx` - Added precip analysis UI section

### Documentation
- `docs/testing-results/precip-summary-1.json` - Baseline test results
- `docs/HANDOFF.md` - Updated with ground temp implementation plan

---

## Test Results Reference

Baseline metrics (before any changes):
- Total precip type changes: 233 across 15 biomes
- Total rain-on-snow events: 69
- Max snow depth observed: 75.1"
- Biomes with complete melt: Continental Prairie, Convergence Zone

**Target metrics** (after ground temp implementation):
- Continental Prairie: < 10 type changes, < 5 rain-on-snow
- Convergence Zone: < 20 type changes, < 10 rain-on-snow
- Biomes with complete melt in mid-winter: 0

---

## Technical Notes

### Why Ground Temperature Fixes This

The current flow:
```
Air temp 31°F → snow
Air temp 33°F → sleet (1 hour later)
Air temp 39°F → rain (2 hours later) → rain-on-snow melt!
Air temp 35°F → sleet (3 hours later)
```

With ground temperature:
```
Air temp drops to 31°F, but ground is still 40°F → snow melts on contact
Air temp stays cold for 24 hours → ground cools to 32°F → now snow sticks
Air temp spikes to 39°F briefly → ground still 32°F → snow protected
Air temp returns to cold → system stabilizes
```

Ground temperature acts as a **low-pass filter** on temperature, damping rapid oscillations.

---

## Git State

- **Branch**: main
- **New files ready for commit**

---

## Next Steps for Following Agent

1. **Implement GroundTemperatureService.js** using the rolling average approach
2. **Add groundType to region-templates.js** for each biome
3. **Integrate ground temp into SnowAccumulationService.js**
4. **Run precipitation analysis** to validate improvement
5. **Compare metrics** against baseline in precip-summary-1.json

---

## Session Summary

Excellent diagnostic session. Started with "Continental Prairie has weird snow behavior" and systematically identified the root cause: no temporal coherence in precipitation type selection. Designed a physics-based solution (ground temperature via thermal inertia) that will improve all biomes naturally rather than requiring biome-specific patches. The test infrastructure built this sprint will allow the next agent to validate their changes quantitatively.

---
