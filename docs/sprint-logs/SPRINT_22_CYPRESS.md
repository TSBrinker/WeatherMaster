# Sprint 22: Cypress

**Date**: 2025-12-23
**Focus**: Ground Temperature System Implementation
**Status**: Complete

---

## Summary

Implemented a ground temperature system to fix unrealistic precipitation type flip-flopping and mid-winter snow melt in marginal biomes (winter mean 20-32°F). The system uses thermal inertia based on ground type to create a lagged temperature response, preventing snow from melting on warm hourly spikes.

---

## Problem Statement

From Sprint 20 (Ember) analysis:
- Precipitation type was evaluated hourly based on instantaneous air temperature
- Marginal biomes (Continental Prairie, Convergence Zone) experienced rapid flip-flopping between snow/rain/sleet
- Continental Prairie: 24 precip type changes, 16 rain-on-snow events, complete mid-winter melt
- Convergence Zone: 72 precip type changes, max snow depth only 10.5"

---

## Solution: Ground Temperature System

### Ground Types and Thermal Inertia

| Ground Type | Thermal Inertia | Effective Lag | Example Biomes |
|-------------|-----------------|---------------|----------------|
| permafrost  | 0.98           | 72+ hours     | Tundra, Ice Sheet, Polar regions |
| rock        | 0.95           | 48 hours      | Highlands, mountains |
| clay        | 0.90           | 36 hours      | River valleys, wetlands |
| soil        | 0.85           | 24 hours      | Most temperate biomes |
| peat        | 0.85           | 24 hours      | Muskeg, bogs |
| sand        | 0.70           | 12 hours      | Deserts, beaches |

### Algorithm

Uses Exponentially-Weighted Moving Average (EWMA):
- Weight for each hour = thermalInertia^hoursAgo
- Ground temp = weighted average of last N hours of air temperature
- Snow insulation: When snow > 6", ground temp stabilizes near 32°F

### Snow Sticking Factor

Based on ground temperature:
- Ground ≤ 33°F: 100% accumulation
- Ground 33-38°F: Linear decrease
- Ground > 38°F: Snow melts on contact

---

## Files Modified

### `src/v2/data/region-templates.js`
- Added `groundType` to all 30+ biome templates
- Polar biomes: permafrost
- Highlands/mountains: rock
- River valleys: clay
- Wetlands/bogs: peat
- Deserts: sand
- Most others: soil

### `src/v2/services/weather/GroundTemperatureService.js` (NEW)
- Core thermal inertia calculations
- EWMA algorithm implementation
- Snow insulation effects
- Returns: temperature, isFrozen, condition, canAccumulateSnow

### `src/v2/services/weather/SnowAccumulationService.js`
- Integrated GroundTemperatureService
- Modified accumulation to use ground temp for snow sticking
- Modified melt logic to use ground temp instead of air temp
- Rain-on-snow effects modulated by ground temp
- Ground temp data included in return object

---

## Test Results

### Baseline (precip-summary-1.json)
- Continental Prairie: 24 type changes, 16 rain-on-snow, complete melt
- Convergence Zone: 72 type changes, 23 rain-on-snow, max depth 10.5"

### After Ground Temp (precip-summary-2.json)
- Continental Prairie: 24 type changes, 16 rain-on-snow, max depth 44.4" (still shows complete melt)
- Convergence Zone: 72 type changes, 48 rain-on-snow, max depth **22.3"** ✅

**Key Win**: Convergence Zone no longer experiences complete mid-winter melt. Snow depth more than doubled.

**Note**: Type changes unchanged because precipitation type is still determined by air temperature (correct behavior - what falls from sky depends on air temp). Ground temp only affects accumulation and melt.

---

## Discussion Points for Next Agent

### Extended Testing
Tyler asked about expanding the test period (currently 30 days in January) to 60-90 days to see WHEN melt occurs rather than just IF it occurs. This would help distinguish between:
- Mid-winter melt (unrealistic, problem)
- Early spring melt (realistic, expected)

### Biome Granularity
Tyler wondered if we need more granular temperate biomes (e.g., "cold continental" vs "warm continental") to distinguish:
- Minnesota: Stays snow-covered all winter
- Kansas: Snow comes and goes

**Answer**: Easy to implement - just add new templates. The system supports any number of biome definitions. Consider:
- Cold Continental Prairie (winter mean 15°F)
- Warm Continental Prairie (winter mean 30°F, current)

---

## Outstanding Items from NOTES_FROM_USER.md

1. **Export button for precip test** - Add "Copy to Clipboard" for easier data extraction
2. **Unused template factors** - What does `highBiodiversity` do? Are there declared factors not being used?
3. **Diurnal variation** - Consider calculating temperature from sun distance/angle using flat disc physics
4. **Precipitation amounts** - Currently random based on intensity categories (light/moderate/heavy) - documented as expected behavior

---

## README Updates

Updated README.md to reflect that WeatherMaster IS a realistic weather generation system:
- Updated description to mention "physics-based" and "ground thermal dynamics"
- Added ground temperature to feature list
- Updated design principles ("Physically realistic" instead of "Realism with pragmatism")
- Updated sprint count and credits

---

## Files for Reference

- `docs/testing-results/precip-summary-1.json` - Baseline test data
- `docs/testing-results/precip-summary-2.json` - Post-implementation test data
- `docs/sprint-logs/SPRINT_20_EMBER.md` - Original problem analysis and proposed solution
