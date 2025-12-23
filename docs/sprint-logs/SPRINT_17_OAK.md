# Sprint 17: Snow Visualization Fixes - "Oak"

**Date**: 2025-12-23
**Agent**: Oak (Claude Opus 4.5)
**Status**: COMPLETE

---

## Sprint Goal

Fix snow visualization issues identified in Sprint 16, plus address environmental condition logic conflicts.

---

## Issues Fixed

### Issue 1: Snow Accumulation Too High

**Problem**: Continental Prairie showing ~47" snow - unrealistic accumulation.

**Solution**: Tuned constants in `SnowAccumulationService.js`:

| Constant | Before | After | Rationale |
|----------|--------|-------|-----------|
| SNOW_RATES.light | 0.4 | 0.2 | Fluffy flurries accumulate slowly |
| SNOW_RATES.moderate | 1.0 | 0.5 | Steady snowfall |
| SNOW_RATES.heavy | 2.0 | 1.0 | Even heavy snow rarely exceeds 1"/hr |
| snowMeltPerDegreeHour | 0.03 | 0.06 | Faster melt during warm spells |
| iceMeltPerDegreeHour | 0.015 | 0.02 | Ice melts faster too |
| COMPACTION.hourlyRate | 0.02 | 0.03 | Faster settling |
| COMPACTION.maxCompaction | 0.4 | 0.65 | Old snow compacts to ~35% of fresh depth |

---

### Issue 2: Text Legibility on Snow Background

**Problem**: White text unreadable on white snow overlay.

**Solution**:
1. Added `z-index: 10` to all text elements (location, temp, condition, etc.)
2. Added `.snow-covered` class with enhanced multi-layer text shadows
3. Environmental alerts badge now has `z-index: 10`
4. Snow depth label has `z-index: 15` with darker background and stronger shadow

---

### Issue 3: Snow Edge Too Jagged

**Problem**: SVG turbulence filter created pointed peaks instead of soft drifts.

**Solution**: Replaced SVG filter with pure CSS approach using radial gradients:
- Removed SVG `<filter>` element entirely (browser caching issues)
- Added `::before` pseudo-element with overlapping elliptical radial gradients
- Creates soft, rolling drifts appearance
- More reliable across browsers

---

### Issue 4: Snow Height Not Scaling with Depth

**Problem**: 47" and 24" snow showed same visual height (both hit 60% cap).

**Solution**: Changed height calculation from `snowFillPercent` (capped at 100%) to `snowFillPercent * 0.6` (scales proportionally):
- 6" snow = ~15% height
- 12" snow = ~30% height
- 24"+ snow = 60% height (capped)

---

### Issue 5: Drought/Wildfire Alerts with Snow on Ground

**Problem**: System showed "Extreme Drought" and "High Wildfire Risk" with 47" of snow - nonsensical.

**Solution**: Added suppression logic in `EnvironmentalConditionsService.js`:

1. **Snow suppression** (≥2" snow on ground):
   - Drought alerts suppressed → set to "Normal"
   - Wildfire risk suppressed → set to "Low" with score 0
   - Adds `suppressedBySnow: true` flag for debugging

2. **Freezing suppression** (temp ≤32°F for 2+ consecutive days):
   - Wildfire risk suppressed → capped at "Low"
   - Adds `suppressedByFreezing: true` flag

---

### Issue 6: Snow Overlay Transparency

**Problem**: Snow was semi-transparent until hovered, causing visual confusion.

**Solution**: Changed snow gradient from `rgba()` with alpha to solid `rgb()` colors.

---

## Files Modified

### Services
- `src/v2/services/weather/SnowAccumulationService.js`
  - Reduced SNOW_RATES
  - Increased MELT_CONSTANTS
  - Increased COMPACTION.maxCompaction

- `src/v2/services/weather/EnvironmentalConditionsService.js`
  - Added SnowAccumulationService import
  - Added snow/freezing suppression logic for drought and wildfire

### Components
- `src/v2/components/weather/PrimaryDisplay.jsx`
  - Added `hasSnowOverlay` check for `.snow-covered` class
  - Removed SVG filter (replaced with CSS)
  - Fixed height scaling: `snowFillPercent * 0.6`

- `src/v2/components/weather/PrimaryDisplay.css`
  - Added z-index to all text elements
  - Added `.snow-covered` enhanced text shadow rules
  - Replaced SVG filter with `::before` pseudo-element radial gradients
  - Made snow overlay fully opaque
  - Enhanced snow depth label styling (darker, stronger shadow)
  - Added z-index to environmental alerts badge

---

## Testing Notes

After these changes:
- Snow depths should be more realistic (8-15" typical max vs 47")
- Snow height visually scales with depth
- Text remains readable over snow
- Snow edge appears as soft rolling drifts
- Drought/wildfire alerts suppressed when snow present or freezing
- Snow overlay is fully opaque

---

## Session Summary

Comprehensive fix sprint addressing all snow visualization issues plus the logical conflict with environmental conditions. The CSS-only approach for the wavy edge is more reliable than SVG filters. The environmental suppression logic makes the alerts more realistic - no more wildfire warnings in a blizzard!

---
