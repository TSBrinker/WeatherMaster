# Sprint 16: Snow & Ice Accumulation - "Alder"

**Date**: 2025-12-23
**Agent**: Alder (Claude Opus 4.5)
**Status**: COMPLETE (with known issues for Sprint 17)

---

## Sprint Goal

Implement Phase B of Weather Sophistication: Snow accumulation tracking, ice accumulation, and ground conditions. Includes a visual snow fill effect on the PrimaryDisplay.

---

## Phase B Scope

1. **Snow Accumulation Service**
   - Track snowfall accumulation (inches on ground)
   - Calculate melting rate based on temperature
   - Compaction over time (fresh snow vs packed snow)

2. **Ice Accumulation** (from freezing rain)
   - Track ice buildup during freezing rain events
   - Melting when temps rise above freezing

3. **Ground Conditions**
   - Frozen, thawing, muddy, dry states
   - Based on recent temps and precipitation

4. **Visual Snow Effect** (PrimaryDisplay)
   - White fill from bottom with noisy/organic top edge
   - Height proportional to snow depth
   - Toggle in preferences to enable/disable

---

## Snow Melt Physics Design

### Accumulation
- Fresh snow: ~10:1 ratio (10 inches snow = 1 inch water equivalent)
- Each hour of snowfall adds to accumulation based on intensity:
  - Light snow: ~0.5 in/hr
  - Moderate snow: ~1.0 in/hr
  - Heavy snow: ~2.0 in/hr

### Melting Model
Melting occurs when temperature > 32°F. Rate depends on:

1. **Temperature-driven melt** (degree-day method):
   - Base rate: ~0.05 in/°F/hr above freezing
   - Example: 42°F = 10°F above freezing → 0.5 in/hr melt rate

2. **Solar radiation factor** (daytime bonus):
   - Daylight hours: 1.5x melt rate
   - Night: 1.0x base rate

3. **Rain-on-snow events**:
   - Rain accelerates melting significantly (2x multiplier)
   - Each inch of rain melts ~2-3 inches of snow

4. **Humidity factor**:
   - High humidity slightly increases melt
   - Low humidity can cause sublimation (snow→vapor, slower loss)

### Compaction
- Fresh snow settles over time
- After 24 hours: ~20% compaction
- After 72 hours: ~40% compaction
- This affects visual height but not water equivalent

### Ground Temperature Memory
- Ground stays cold after prolonged snow cover
- Takes time to warm up even after snow melts
- Affects refreezing at night

---

## Implementation Log

### Session 1 - 2025-12-23

**Tasks:**
- [ ] Create SnowAccumulationService
- [ ] Create GroundConditionsService
- [ ] Add snow visual effect to PrimaryDisplay
- [ ] Add toggle preference for snow visual
- [ ] Integrate into WeatherService
- [ ] Add to test harness
- [ ] Test and validate

---

## Files to Create
- `src/v2/services/weather/SnowAccumulationService.js`
- `src/v2/services/weather/GroundConditionsService.js`

## Files to Modify
- `src/v2/services/weather/WeatherService.js` - integrate new services
- `src/v2/components/weather/PrimaryDisplay.jsx` - snow visual
- `src/v2/components/weather/PrimaryDisplay.css` - snow styling
- `src/v2/contexts/PreferencesContext.jsx` - snow visual toggle
- `src/v2/components/menu/SettingsMenu.jsx` - toggle UI
- `src/v2/components/testing/WeatherTestHarness.jsx` - tracking

---

## Questions for Tyler

*(Answered during session)*

---

## Implementation Complete

### SnowAccumulationService
Created `src/v2/services/weather/SnowAccumulationService.js`:
- **Accumulation**: Tracks snow depth based on snowfall intensity (light/moderate/heavy)
- **Melting**: Degree-day method (0.03"/°F·hr above 32°F), with daytime solar bonus (1.5x)
- **Rain-on-snow**: Accelerated melting (2.5x multiplier)
- **Sublimation**: Snow loss in very cold, dry conditions
- **Compaction**: Snow settles over time (20% after 24hr, 40% max)
- **Ground conditions**: Frozen, Thawing, Muddy, Dry states based on temperature history

### Visual Snow Effect
- White gradient fill from bottom of PrimaryDisplay
- Height scales with snow depth (24" = 100%, capped at 60%)
- SVG turbulence filter creates organic "noise" edge
- CSS clip-path fallback for browsers without filter support
- Clickable to show detailed Snow & Ground Conditions modal

### Features
- **Toggle in Settings**: "Show Snow Accumulation Visual" preference
- **Snow depth label**: Badge showing current depth in inches
- **Ice warning badge**: Shows when significant ice accumulation without snow cover
- **Modal details**: Shows snow depth, water equivalent, age, ice, ground condition, travel impacts, and D&D gameplay effects

### Test Harness Integration
- Tracks max snow depth and ice per biome
- Counts days with snow cover (≥0.5") and ice (≥0.1")
- Counts ground condition days (frozen, muddy, etc.)
- Includes in both "Problems Only" and full export

---

## Known Issues for Next Agent (Sprint 17)

**PRIORITY: These three issues should be addressed before moving on**

### Issue 1: Snow Accumulation Too High
- **Symptom**: Continental Prairie showing ~47" snow on Jan 27 - seems excessive
- **Real-world context**: Des Moines averages ~35" *total annual* snowfall, not 47" on ground at once
- **Possible causes**:
  - Snow accumulation rates may be too high (currently 0.4-2.0"/hr by intensity)
  - Melt rates may be too low (currently 0.03"/°F·hr above 32°F)
  - 14-day lookback accumulates without enough melting during warm spells
- **File**: `src/v2/services/weather/SnowAccumulationService.js`
- **Recommended fixes**:
  - Reduce `SNOW_RATES` values (try 0.2, 0.5, 1.0 for light/mod/heavy)
  - Increase `MELT_CONSTANTS.snowMeltPerDegreeHour` (try 0.05-0.08)
  - Consider temperature-based accumulation modifier (warmer snow = wetter = less depth per inch of precip)

### Issue 2: Text Legibility on Snow
- **Symptom**: White text on white snow background is unreadable
- **Location**: `PrimaryDisplay.jsx` and `PrimaryDisplay.css`
- **Recommended fixes** (pick one or combine):
  - Add text shadow to `.location-hero`, `.temperature-hero` when snow is present
  - Make snow overlay gradient more translucent at top (reduce opacity to 0.5-0.7)
  - Add a dark semi-transparent gradient behind text elements
  - In JSX: conditionally add a `snow-covered` class when `snowFillPercent > 20`

### Issue 3: Snow Edge Too Jagged
- **Symptom**: SVG turbulence creates pointed peaks, not soft snow drifts
- **Location**: `PrimaryDisplay.jsx` (SVG filter) and `PrimaryDisplay.css` (clip-path fallback)
- **Current settings**:
  ```jsx
  baseFrequency="0.04"  // noise scale
  numOctaves="3"        // detail levels
  scale="20"            // displacement intensity
  ```
- **Recommended fixes**:
  - Lower `baseFrequency` to 0.015-0.02 (larger, softer waves)
  - Lower `numOctaves` to 2 (less jagged detail)
  - Reduce `scale` to 10-15 (gentler displacement)
  - Consider adding `<feGaussianBlur stdDeviation="2"/>` after displacement
  - The CSS clip-path polygon also needs smoothing (more points, gentler curves)

---

## Notes

- Following deterministic seed architecture (calculate on-the-fly with lookback)
- Snow accumulation lookback: 14 days should capture most scenarios
- Visual effect uses SVG turbulence filter for organic edge

---
