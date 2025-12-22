# WeatherMaster v2 - Complete Implementation Checklist

## 🐛 BUG-CHECKING PROTOCOL

**CRITICAL**: After completing ANY implementation work, ALWAYS:

1. **Test in Browser** - Run the app and verify functionality works as expected
2. **Check Console** - Look for errors, warnings, or unexpected behavior
3. **Validate Calculations** - Verify mathematical outputs are correct (times, angles, distances)
4. **Check Edge Cases** - Test boundary conditions (θ_obs = 0°, disc center, disc edge, etc.)
5. **Update Bug Notes** - Document any new bugs discovered in this section
6. **Fix Before Moving On** - Do NOT proceed to next task while known bugs exist

**Active Bug List** (see bottom of file for details):
- (None - all known bugs fixed!)

**Recently Fixed**:
- ✅ AM/PM times switched (sun phase offset 0° → 180°)
- ✅ Old regions not working (added nuke menu)
- ✅ Equator/Polar naming inverted (equatorial→central, polar→rim)
- ✅ Moon orbital period (29.53 days → 24.8 hours)
- ✅ Time formatting bug (9:60 PM → 10:00 PM)
- ✅ Identical moonrise/moonset times (±180° → ±90°)

---

## Executive Summary

**Current Status**: ~25-30% complete
- ✅ Core architecture and state management complete
- ✅ Basic UI shell complete
- ⚠️ Weather generation NOT started (using fake data)
- ❌ Most weather services not ported
- ❌ Advanced UI components missing

**Total Estimated Work**: ~4,000 lines of code remaining

---

## Phase 1: Foundation ✅ COMPLETE

### 1.1 Core Data Models ✅
- [x] types.js - JSDoc type definitions
- [x] constants.js - **NEEDS UPDATE for flat disc model**

### 1.2 State Management ✅
- [x] WorldContext - World/Region/Location CRUD
- [x] PreferencesContext - User preferences
- [x] localStorage service - Persistence

### 1.3 Utilities ✅
- [x] dateUtils.js - Complete date/time handling
- [x] unitConversions.js - Temperature/wind conversions

### 1.4 Data Tables ✅
- [x] region-templates.js - 40+ region templates
- [x] templateHelpers.js - Template utilities

### 1.5 Basic Components ✅
- [x] WorldSetup.jsx - World creation modal
- [x] RegionCreator.jsx - Region creation modal
- [x] TimeDisplay.jsx - Date/time display
- [x] TimeControls.jsx - Time advancement
- [x] CurrentWeather.jsx - Weather display shell

---

## Phase 2: Flat Disc Celestial Mechanics 🔄 IN PROGRESS

### 2.1 Constants and Geometry ⏳ PENDING
- [ ] Update constants.js with flat disc parameters
  - [ ] Disc radius (7,000 miles)
  - [ ] Sun illumination radius (10,000 miles)
  - [ ] Sun orbital parameters
  - [ ] Moon orbital parameters
  - [ ] Twilight thresholds
  - [ ] Latitude band to radius mapping

- [ ] Create geometry.js utility
  - [ ] normalizeAngle(angle)
  - [ ] distanceToSun(R_obs, θ_obs, θ_sun, R_sun)
  - [ ] getSunOrbitalRadius(dayOfYear)
  - [ ] getSunAngle(hour, φ_sun)
  - [ ] getMoonAngle(daysSinceEpoch, φ_moon)
  - [ ] getLunarPhaseAngle(θ_moon, θ_sun)

### 2.2 Rewrite SunriseSunsetService ⏳ PENDING
- [ ] Replace spherical Earth calculations
- [ ] Implement distance-based illumination
- [ ] Add twilight level calculation (civil/nautical/astronomical)
- [ ] Calculate sunrise/sunset by solving d = 10,000
- [ ] Add seasonal variation (sun orbital radius changes)
- [ ] Test with all latitude bands

**Estimated**: ~200 lines, replaces existing 175 lines

### 2.3 Create MoonService ⏳ PENDING
- [ ] Implement angular position calculation
- [ ] Implement observer-relative moonrise/moonset
- [ ] Calculate lunar phase from angular separation
- [ ] Map phase angles to phase names
- [ ] Calculate illumination percentage
- [ ] Determine waxing/waning
- [ ] Format moon times and info

**Estimated**: ~250 lines (new file)

### 2.4 Update Types ⏳ PENDING
- [ ] Add twilightLevel to CelestialData
- [ ] Add distanceToSun to CelestialData
- [ ] Add moonrise/moonset times
- [ ] Add isMoonVisible flag

---

## Phase 3: Weather Generation Services ❌ NOT STARTED

**CRITICAL GAP**: Original app has ~4,300 lines of meteorological code

### Decision Point: Weather Generation Strategy

#### Option A: Port Original Meteorological System
**Pros**: Proven, realistic, feature-complete
**Cons**: 4,300+ lines of complex code to port

#### Option B: Simplified Weather System
**Pros**: Faster to implement, easier to maintain
**Cons**: Less realistic, fewer features

#### Option C: Hybrid Approach
**Pros**: Core realism with simplified extremes
**Cons**: Requires careful design

### 3.1 Core Weather Services (Option A - Full Port)

**AtmosphericService.js** - 710 lines
- [ ] Port pressure calculation
- [ ] Port humidity calculation
- [ ] Port cloud cover calculation
- [ ] Port atmospheric parameter generation

**TemperatureService.js** - 834 lines
- [ ] Port base temperature calculation
- [ ] Port seasonal variation
- [ ] Port day/night cycle
- [ ] Port temperature profiles by climate
- [ ] Port wind chill calculation
- [ ] Port heat index calculation

**WindService.js** - 288 lines
- [ ] Port wind speed generation
- [ ] Port wind direction calculation
- [ ] Port gust calculation
- [ ] Port wind systems

**PrecipitationService.js** - 176 lines
- [ ] Port precipitation type determination
- [ ] Port precipitation amount calculation
- [ ] Port rain/snow logic

**WeatherConditionService.js** - 384 lines
- [ ] Port condition determination logic
- [ ] Port condition transitions
- [ ] Port special conditions

**WeatherSystemService.js** - 523 lines
- [ ] Port high/low pressure systems
- [ ] Port weather fronts
- [ ] Port system movement
- [ ] Port system interactions

**ExtremeWeatherService.js** - 458 lines
- [ ] Port extreme event detection
- [ ] Port storm generation
- [ ] Port blizzard logic
- [ ] Port heat wave logic
- [ ] Port drought logic

**RegionProfileService.js** - 913 lines
- [ ] Port climate profile management
- [ ] Port seasonal adjustments
- [ ] Port maritime influence
- [ ] Port terrain effects
- [ ] Port special factors (monsoons, permafrost, etc.)

**MeteorologicalWeatherService.js** - Coordinator
- [ ] Port service coordination
- [ ] Port forecast generation
- [ ] Port weather history tracking
- [ ] Port system state management

**Estimated Total**: ~4,300 lines to port/adapt

### 3.2 Supporting Weather Services

**MoonService.js** (Original version - Earth model)
- [ ] Decision: Use flat disc MoonService (Phase 2.3) or port original?
- [ ] If porting: Moon phases, moon rise/set (Earth model)

**SkyColorService.js** - ~200 lines
- [ ] Port sky color calculations
- [ ] Port gradient generation
- [ ] Adapt for flat disc world (if needed)

**WeatherDescriptionService.js** - ~150 lines
- [ ] Port narrative description generation
- [ ] Port condition-to-text mapping

**weatherManager.js** - ~300 lines
- [ ] Port weather caching
- [ ] Port forecast extension
- [ ] Port time advancement logic
- [ ] Port region weather coordination

**Estimated Total**: ~650 lines

---

## Phase 4: Weather Data & Effects ❌ NOT STARTED

### 4.1 Weather Effects (D&D Mechanics)
- [ ] Create weather-effects.js data table
  - [ ] Visibility effects
  - [ ] Movement penalties
  - [ ] Combat effects
  - [ ] Skill check modifiers
  - [ ] Spell effects
  - [ ] Environmental hazards

**Estimated**: ~200 lines data + ~100 lines utility

### 4.2 Weather History & Caching
- [ ] Implement weather history storage
- [ ] Implement forecast caching
- [ ] Implement cache invalidation
- [ ] Implement history pruning

**Estimated**: ~150 lines

---

## Phase 5: Advanced UI Components ❌ NOT STARTED

### 5.1 Weather Display Components

**ForecastDisplay.jsx** - Hourly forecast
- [ ] 24-hour forecast grid
- [ ] Expandable/collapsible
- [ ] Sunrise/sunset indicators
- [ ] Hourly weather icons
- [ ] Temperature graph (optional)

**Estimated**: ~200 lines

**WeatherEffects.jsx** - D&D mechanics display
- [ ] Show gameplay impacts
- [ ] Show environmental effects
- [ ] Show visibility/movement penalties

**Estimated**: ~150 lines

**CelestialInfo.jsx** - Sun/moon display
- [ ] Sunrise/sunset times
- [ ] Moon phase display with icon
- [ ] Moonrise/moonset times
- [ ] Day/night indicator
- [ ] Twilight state display

**Estimated**: ~180 lines

**MeteorologicalParameters.jsx** - Detailed weather data
- [ ] Atmospheric pressure
- [ ] Humidity
- [ ] Cloud cover
- [ ] Precipitation details
- [ ] Wind details
- [ ] Weather systems display

**Estimated**: ~200 lines

### 5.2 Region Management UI

**RegionList.jsx** - List all regions
- [ ] Display all regions
- [ ] Select active region
- [ ] Delete region (with confirmation)
- [ ] Region status indicators

**Estimated**: ~150 lines

**RegionEditModal.jsx** - Edit region
- [ ] Edit region name
- [ ] Edit climate parameters
- [ ] Edit season overrides
- [ ] Validate inputs

**Estimated**: ~180 lines

**RegionDetails.jsx** - Region info display
- [ ] Show region parameters
- [ ] Show climate info
- [ ] Show template info
- [ ] Show current season

**Estimated**: ~120 lines

**RegionsDropdown.jsx** - Quick region selector
- [ ] Dropdown menu
- [ ] Region switching
- [ ] Create new region button

**Estimated**: ~100 lines

### 5.3 App Layout & Navigation

**AppHeader.jsx** - Top navigation
- [ ] World name display
- [ ] Regions menu
- [ ] Preferences button
- [ ] World settings button
- [ ] Export/import buttons

**Estimated**: ~150 lines

**PreferencesMenu.jsx** - Settings panel
- [ ] Temperature unit toggle
- [ ] Wind speed unit toggle
- [ ] Time format toggle
- [ ] Show feels-like toggle
- [ ] Debug mode toggle
- [ ] Theme selection (future)

**Estimated**: ~180 lines

### 5.4 Time Control Variants (Optional)

**CustomTimeControls.jsx** - Advanced time control
- [ ] Custom hour advance input
- [ ] Jump to specific date
- [ ] Jump to specific hour
- [ ] Date picker integration

**Estimated**: ~200 lines (optional enhancement)

### 5.5 Debug Components (If debugMode enabled)

**MeteorologicalDebugPanel.jsx**
- [ ] Show raw meteorological data
- [ ] Show weather systems
- [ ] Show calculation internals

**Estimated**: ~150 lines

**RegionDebug.jsx**
- [ ] Show region state
- [ ] Show climate parameters
- [ ] Show active modifiers

**Estimated**: ~100 lines

---

## Phase 6: Data Management & Export ❌ NOT STARTED

### 6.1 Export/Import Functionality
- [ ] Export all data to JSON
- [ ] Import from JSON with validation
- [ ] Backup/restore workflow
- [ ] Clear all data with confirmation

**Estimated**: ~150 lines UI + service updates

### 6.2 Weather History Management
- [ ] Display weather history
- [ ] History pruning controls
- [ ] History export

**Estimated**: ~100 lines

---

## Phase 7: Polish & Refinement ❌ NOT STARTED

### 7.1 Error Handling
- [ ] Add error boundaries
- [ ] Replace alert() with proper UI dialogs
- [ ] Add loading states to all async operations
- [ ] Add retry logic for failed operations

### 7.2 Performance
- [ ] Optimize weather calculations
- [ ] Implement weather cache
- [ ] Debounce time controls
- [ ] Lazy load forecast data

### 7.3 Accessibility
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast checks

### 7.4 Testing
- [ ] Unit tests for utilities
- [ ] Integration tests for services
- [ ] Component tests
- [ ] E2E tests for workflows

---

## Open Questions & Decisions Needed

### Critical Decisions

#### 1. Weather Generation Strategy
**Question**: Should we port the full meteorological system (4,300 lines) or create a simplified version?

**Options**:
- A) Full port - Maximum realism, proven system, most work
- B) Simplified - Faster implementation, less realistic
- C) Hybrid - Core realism with simplified extremes

**Impact**: Determines ~50% of remaining work

#### 2. Flat Disc vs Earth Model
**Question**: Do ALL regions use flat disc model, or is it optional/selectable?

**Options**:
- A) All regions use flat disc (what FLAT_DISC_WORLD.md assumes)
- B) Per-world setting (Earth-like vs Flat disc)
- C) Per-region setting

**Impact**: Service architecture and UI options

#### 3. Location Entity Purpose
**Question**: What are Locations for? Original app doesn't use them.

**Context**:
- WorldContext supports Location CRUD
- No UI exists for locations
- No clear use case defined

**Options**:
- A) Remove locations (simplify)
- B) Locations = sub-regions (cities within regions)
- C) Locations = weather observation points (different θ_obs on disc)
- D) Future feature, keep infrastructure

**Impact**: Data model and UI scope

### Secondary Questions

#### 4. Season Override
**Question**: Should v2 support season override like original app?

**Context**: Original RegionDetails.jsx has season override dropdown

**Options**:
- A) Port season override feature
- B) Remove (rely on date-based seasons)
- C) Add as advanced feature later

#### 5. Custom Time Controls
**Question**: Which time control UI should we keep?

**Context**: Original has 3 variants (TimeControls, CustomTimeControls, EnhancedTimeControls)

**Options**:
- A) Basic only (current v2)
- B) Basic + Custom (jump to date)
- C) All three variants

#### 6. Debug Mode Features
**Question**: How extensive should debug mode be?

**Context**: Original has 3 debug panels showing internal state

**Options**:
- A) No debug UI (rely on browser console)
- B) Basic debug (show calculation inputs/outputs)
- C) Full debug panels (port all 3)

#### 7. Weather History
**Question**: Should weather history be visible to users?

**Context**: Original tracks history but doesn't display it

**Options**:
- A) Hidden (cache only)
- B) Visible in debug mode
- C) Full history viewer component

#### 8. Observer Position (θ_obs)
**Question**: How do users set their observer position on the disc?

**Context**: Flat disc model requires θ_obs for moonrise calculations

**Options**:
- A) Default to 0° for all regions (simplest)
- B) Add θ_obs field to Region model
- C) Add θ_obs to Location model (each location = different position)
- D) Make it a world setting (all regions share same θ_obs)

**Impact**: Whether we need Location entity

#### 9. Moon Phase Display
**Question**: Should we show moon phase icon/emoji like original?

**Context**: Original shows 🌑🌒🌓🌔🌕🌖🌗🌘

**Options**:
- A) Yes, keep emoji icons
- B) Use SVG icons instead
- C) Text only

#### 10. Twilight Display
**Question**: How should we display twilight states?

**Context**: Flat disc model has civil/nautical/astronomical twilight

**Options**:
- A) Simple indicator (Day/Twilight/Night)
- B) Detailed (show which twilight level)
- C) Visual gradient showing transition

---

## Unclear/Ambiguous Functionality

### 1. Weather Persistence Strategy
**Issue**: Original app caches weather per region in localStorage. How does this work with flat disc model?

**Original Pattern**:
```javascript
localStorage.setItem(`weather_${regionId}`, JSON.stringify(forecast));
```

**Questions**:
- Do we persist calculated weather or recalculate each time?
- Does flat disc model change caching strategy?
- How large can weather history grow?

### 2. Temperature Model Duplication
**Issue**: Region templates have temperature profiles AND ClimateProfile has baseTemp/tempVariation

**Current v2 ClimateProfile**:
```javascript
{
  biome: "temperate-deciduous",
  baseTemp: 55,
  tempVariation: 15,
  // ...
}
```

**Template also has**:
```javascript
{
  parameters: {
    temperatureProfile: {
      annual: { min: 20, max: 85, mean: 52 },
      winter: { min: 15, max: 45, mean: 30 },
      // ...
    }
  }
}
```

**Questions**:
- Which one is source of truth?
- Are they combined somehow?
- Is baseTemp used for quick calculation and profile for detailed?

### 3. Fake Weather Structure
**Issue**: App.jsx creates fake weather but structure might not match what services will return

**Current Fake Weather**:
```javascript
{
  temperature: 72,
  feelsLike: 70,
  condition: 'Clear Skies',
  windSpeed: 5,
  windDirection: 'NW',
  sunriseTime: '6:00 AM',
  sunsetTime: '8:00 PM',
  moonPhase: 'Waxing Crescent'
}
```

**Original WeatherEntry** (from types.js):
```javascript
{
  timestamp: Date,
  temperature: number,
  feelsLike: number,
  condition: string,
  windSpeed: number,
  windDirection: string,
  humidity: number,
  pressure: number,
  effects: GameEffect[],
  celestial: CelestialData,
  _meteoData: { /* internal */ }
}
```

**Questions**:
- Should we update fake weather to match types.js?
- Will real weather service return this exact structure?
- How do we handle the mismatch during development?

### 4. First-Time Setup Flow
**Issue**: Original has FirstTimeSetup.jsx but it's never triggered

**Current v2 Flow**:
1. App.jsx checks if world exists
2. If no world, shows WorldSetup modal
3. After world created, user manually creates regions

**Questions**:
- Is this the intended flow?
- Should there be a guided multi-step setup?
- Should first region creation be mandatory?

### 5. Bootstrap Theme
**Issue**: Original uses Bootswatch themes, v2 just uses basic Bootstrap

**Questions**:
- Should v2 support theme selection?
- Which Bootswatch theme should be default?
- Is dark mode important?

---

## Estimated Work Remaining

| Phase | Lines of Code | Priority | Est. Time |
|-------|---------------|----------|-----------|
| Phase 2: Flat Disc Celestial | ~500 | HIGH | 1-2 days |
| Phase 3: Weather Services | ~4,950 | HIGH | 2-3 weeks |
| Phase 4: Weather Data/Effects | ~450 | MEDIUM | 2-3 days |
| Phase 5: Advanced UI | ~1,680 | MEDIUM | 1-2 weeks |
| Phase 6: Export/Import | ~250 | LOW | 1-2 days |
| Phase 7: Polish | Variable | LOW | 1 week |
| **TOTAL** | **~7,830** | | **4-6 weeks** |

**Note**: Estimates assume full port of meteorological system (Option A)

---

## Recommended Next Steps

### Immediate (This Session)
1. **Answer critical questions** about weather strategy and flat disc scope
2. **Implement Phase 2** (Flat Disc Celestial) if approved
3. **Create weather service architecture plan** based on answers

### Short Term (Next Session)
1. **Decide on weather generation strategy** (full port vs simplified)
2. **Begin porting core weather services**
3. **Wire real weather into CurrentWeather component**

### Medium Term
1. **Complete weather service porting**
2. **Add advanced UI components**
3. **Implement export/import**

### Long Term
1. **Polish and testing**
2. **Documentation**
3. **Migration from v1 to v2**

---

## Migration Strategy from src/ to src/v2/

**Current State**: index.jsx imports from `v2/App` while original src/ still exists

**Questions**:
- When is v2 considered "done enough" to replace v1?
- Should we support import from v1 data?
- Delete src/ when v2 is complete?

**Recommendation**: Once weather generation is working, consider v2 as primary and archive src/

User notes:
Want to add ideas for things that haven't made the checklists but should be included at some point:
- Declare a day of the week to go with the date. Keep track of it.
- Moonrise and set times can be in a collapsible menu. Will be less relevant than other info
- Want to try again at the visual display showing the position of the sun and the moon. 
- info displays, or a glossary somewhere, to define what the heck the different twilights mean

---

## 🐛 ACTIVE BUG TRACKING

### Bug #1: Equator/Polar Naming Inversion - ✅ FIXED
**Status**: 🟢 RESOLVED

**Symptom**: Naming was backwards - "equatorial" at center, "polar" at edge

**Root Cause**: Latitude band names used Earth conventions instead of flat disc geometry

**Fix Applied**:
- Renamed "equatorial" → **"central"** (disc center, shortest days)
- Renamed "polar" → **"rim"** (disc edge, longest days)
- Updated all references in:
  - [constants.js](src/v2/models/constants.js) - LATITUDE_BAND_RADIUS mapping
  - [region-templates.js](src/v2/data/region-templates.js) - All template keys and arrays
  - [types.js](src/v2/models/types.js) - Type definitions
  - [FLAT_DISC_WORLD.md](FLAT_DISC_WORLD.md) - Documentation

**New Naming**:
- **Central** (0-20% radius): Disc center, shortest days/permanent night
- **Subarctic** (20-40% radius)
- **Temperate** (40-60% radius)
- **Tropical** (60-80% radius)
- **Rim** (80-100% radius): Disc edge, longest days

**Date Fixed**: 2025-12-20

---

### Bug #2: AM/PM Switched on Sunrise/Sunset - ✅ FIXED
**Status**: 🟢 RESOLVED

**Symptom**: ALL AM/PM times switched - Daylight at 1 AM, setting at 5 AM, etc.

**Root Cause**: Sun phase offset was 0°, meaning at hour 0 (midnight), sun was at angle 0° (closest position). This made the sun closest at midnight and farthest at noon - completely backwards!

**Fix Applied**:
- Changed DEFAULT_SUN_PHASE_OFFSET from 0° to **180°**
- Now at hour 0 (midnight), sun is at angle 180° (opposite side, far away)
- At hour 12 (noon), sun is at angle 0° (closest position)
- This makes sunrise occur in morning (AM) and sunset in evening (PM)

**Date Fixed**: 2025-12-20

---

### Bug #3: Old Regions Not Working
**Status**: 🟢 RESOLVED

**Symptom**: Old regions with "equatorial" and "polar" keys stopped working after rename

**Root Cause**: Old regions had latitudeBand="equatorial" or "polar", but LATITUDE_BAND_RADIUS now uses "central" and "rim"

**Fix Applied**:
- Added SettingsMenu component with "Nuke All Regions" option
- Allows users to delete old incompatible regions
- Users can recreate regions with new naming

**Date Fixed**: 2025-12-20

---

### Recently Fixed Bugs ✅

**Bug #1: Equator/Polar Naming Inversion** - FIXED
- **Cause**: Latitude band names used Earth conventions (equatorial=center, polar=edge)
- **Fix**: Renamed to flat disc conventions (central=center, rim=edge)
- **Date**: 2025-12-20

**Bug #2: AM/PM Switched on Sunrise/Sunset** - FIXED
- **Cause**: Sun phase offset 0° made sun closest at midnight, farthest at noon
- **Fix**: Changed DEFAULT_SUN_PHASE_OFFSET from 0° to 180°
- **Date**: 2025-12-20

**Bug #3: Old Regions Not Working** - FIXED
- **Cause**: Old regions had incompatible latitudeBand keys after rename
- **Fix**: Added SettingsMenu with "Nuke All Regions" option
- **Date**: 2025-12-20

**Bug #4: Identical Moonrise/Moonset Times** - FIXED
- **Cause**: Formulas θ_obs ± 180° both calculated to 180° when θ_obs = 0°
- **Fix**: Changed to θ_obs ± 90° for proper 180° arc visibility
- **Date**: 2025-12-20

**Bug #5: Time Formatting (9:60 PM)** - FIXED
- **Cause**: Math.round() on minutes could produce 60 without rollover
- **Fix**: Added minute/hour rollover logic in formatMoonTime() and formatHour()
- **Date**: 2025-12-20

**Bug #6: Moon Orbital Period** - FIXED
- **Cause**: Moon orbiting over 29.53 days instead of 24.8 hours
- **Fix**: Changed LUNAR_CYCLE_DAYS to MOON_ORBITAL_PERIOD_HOURS = 24.8
- **Date**: 2025-12-20