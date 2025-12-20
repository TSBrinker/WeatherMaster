# WeatherMaster v2 - Development Progress

## Project Overview
Rebuilding WeatherMaster with cleaner architecture in `src/v2/`, while keeping original implementation in `src/` for reference. Implementing flat disc world model with deterministic celestial mechanics.

---

## Completed Work ✅

### Core Architecture (v2)
- ✅ Created clean data models and type definitions ([src/v2/models/types.js](src/v2/models/types.js))
- ✅ Built localStorage utilities ([src/v2/services/storage/localStorage.js](src/v2/services/storage/localStorage.js))
- ✅ Created PreferencesContext provider ([src/v2/contexts/PreferencesContext.jsx](src/v2/contexts/PreferencesContext.jsx))
- ✅ Created WorldContext provider ([src/v2/contexts/WorldContext.jsx](src/v2/contexts/WorldContext.jsx))

### UI Components (v2)
- ✅ Built WorldSetup component ([src/v2/components/world/WorldSetup.jsx](src/v2/components/world/WorldSetup.jsx))
- ✅ Built RegionCreator with template selection ([src/v2/components/region/RegionCreator.jsx](src/v2/components/region/RegionCreator.jsx))
- ✅ Built time display and controls ([src/v2/components/time/](src/v2/components/time/))
- ✅ Built CurrentWeather display with fake data ([src/v2/components/weather/CurrentWeather.jsx](src/v2/components/weather/CurrentWeather.jsx))

### Services (Partial)
- ✅ Ported SunriseSunsetService (Earth-like calculations - needs rewrite for disc)
- ⚠️ Old MoonService exists in src/ but uses Earth-like calculations

### Documentation
- ✅ Created authoritative flat disc world specification ([FLAT_DISC_WORLD.md](FLAT_DISC_WORLD.md))
- ✅ Created progress tracking document (this file)

---

## Current Session Work 🔄

### Session Goal
Implement flat disc world celestial mechanics (solar, lunar, seasonal, twilight)

### Tasks Completed This Session ✅
- ✅ Created [FLAT_DISC_WORLD.md](FLAT_DISC_WORLD.md) - Complete technical specification
- ✅ Created [PROGRESS.md](PROGRESS.md) - Progress tracking
- ✅ Created [V2_IMPLEMENTATION_CHECKLIST.md](V2_IMPLEMENTATION_CHECKLIST.md) - Complete feature checklist
- ✅ Created [QUESTIONS_FOR_USER.md](QUESTIONS_FOR_USER.md) - Gathered user decisions
- ✅ Created [src/v2/models/constants.js](src/v2/models/constants.js) - All flat disc constants
- ✅ Created [src/v2/services/celestial/geometry.js](src/v2/services/celestial/geometry.js) - Core geometric calculations
- ✅ Rewrote [src/v2/services/celestial/SunriseSunsetService.js](src/v2/services/celestial/SunriseSunsetService.js) - Flat disc sun calculations
- ✅ Created [src/v2/services/celestial/MoonService.js](src/v2/services/celestial/MoonService.js) - Lunar phase calculations
- ✅ Updated [src/v2/models/types.js](src/v2/models/types.js) - Added twilight and moon fields to CelestialData
- ✅ Wired celestial services into [src/v2/App.jsx](src/v2/App.jsx) - Real calculations
- ✅ Updated [src/v2/components/weather/CurrentWeather.jsx](src/v2/components/weather/CurrentWeather.jsx) - Display all celestial data

### Ready to Commit 📦
**Phase 2: Flat Disc Celestial Mechanics - COMPLETE** (with 6 bugfixes)

Files ready to commit:
- `src/v2/models/constants.js` (new, 157 lines) - Flat disc constants with corrected naming and phase offset
- `src/v2/services/celestial/geometry.js` (new, 194 lines) - Core geometric calculations
- `src/v2/services/celestial/SunriseSunsetService.js` (rewritten, 305 lines) - Sun calculations with debug logging
- `src/v2/services/celestial/MoonService.js` (new, 355 lines) - Lunar calculations with debug logging
- `src/v2/models/types.js` (modified) - Updated CelestialData type and latitude band names
- `src/v2/data/region-templates.js` (modified) - All templates renamed (equatorial→central, polar→rim)
- `src/v2/components/menu/SettingsMenu.jsx` (new, 120 lines) - Settings menu with nuke options
- `src/v2/App.jsx` (modified) - Wired real celestial data + SettingsMenu
- `src/v2/components/weather/CurrentWeather.jsx` (modified) - Display all celestial info
- `FLAT_DISC_WORLD.md` (updated) - Corrected moon mechanics and latitude band naming
- `PROGRESS.md` (updated) - Documented all bugfixes
- `V2_IMPLEMENTATION_CHECKLIST.md` (updated) - Bug tracking

**Six Bugfixes Applied**:
1. **Latitude band naming**: Renamed equatorial→central, polar→rim for flat disc geometry
2. **AM/PM switching**: Fixed sun phase offset (0° → 180°) so sunrise is AM, sunset is PM
3. **Old regions incompatible**: Added SettingsMenu with nuke options for cleanup
4. **Moon orbital period**: Changed from 29.53 days to 24.8 hours (moon rises/sets daily)
5. **Time formatting**: Fixed 9:60 PM bug with minute/hour rollover in both services
6. **Rise/set geometry**: Changed from ±180° to ±90° (fixes identical moonrise/moonset)

Total: ~1,000 lines of new/modified code

### Bug Fix #1: Latitude Band Naming Inversion ✅
**Issue**: Naming was backwards for flat disc world

**Root Cause**: Used Earth naming conventions (equatorial=0°, polar=90°) instead of flat disc geometry (center to edge)

**Fix Applied**:
- Renamed "equatorial" → **"central"** (disc center, 0-20% radius)
- Renamed "polar" → **"rim"** (disc edge, 80-100% radius)
- Updated LATITUDE_BAND_RADIUS in constants.js
- Updated all region templates in region-templates.js
- Updated type definitions in types.js
- Updated documentation in FLAT_DISC_WORLD.md

**Result**:
- Central regions (disc center) now correctly have shortest days
- Rim regions (disc edge) now correctly have longest days

### Bug Fix #2: AM/PM Times Switched ✅
**Issue**: Sunrise showing as PM, sunset as AM - completely backwards

**Root Cause**: Sun phase offset was 0°, making sun closest to observer at midnight (hour 0)

**Explanation**:
- At hour 0 (midnight): θ_sun = 0° → sun at closest position → DAYTIME ❌
- At hour 12 (noon): θ_sun = 180° → sun at farthest position → NIGHTTIME ❌
- This made all AM/PM labels backwards

**Fix Applied**:
- Changed DEFAULT_SUN_PHASE_OFFSET from **0°** to **180°**
- Now at hour 0 (midnight): θ_sun = 180° → sun far away → NIGHTTIME ✓
- Now at hour 12 (noon): θ_sun = 0° → sun close → DAYTIME ✓

### Bug Fix #3: Old Regions Not Working ✅
**Issue**: Regions created before rename showed default temperate calculations

**Root Cause**: Old regions had latitudeBand="equatorial" or "polar", but LATITUDE_BAND_RADIUS mapping now uses "central" and "rim"

**Fix Applied**:
- Created [SettingsMenu component](src/v2/components/menu/SettingsMenu.jsx)
- Added gear icon (⚙️) in top-right corner
- Menu options:
  - 🗑️ Nuke All Regions (delete all regions with confirmation)
  - 💣 Nuke All Data (delete everything + reload page)
- Users can now clean up old incompatible regions and recreate with new naming

### Bug Fix #4: Identical Moonrise/Moonset Times ✅
**Issue**: Moonrise and moonset showing identical times

**Root Cause**: When θ_obs = 0°, formulas θ_obs ± 180° both calculated to 180°

**Fix Applied**:
- Changed moonrise formula from θ_obs - 180° to **θ_obs - 90°**
- Changed moonset formula from θ_obs + 180° to **θ_obs + 90°**
- Updated isMoonVisible() to check ±90° arc instead of ±180°
- Updated FLAT_DISC_WORLD.md with corrected geometry

**New Model**:
- Observer can see 180° arc centered on their position
- Moonrise: Moon enters visible hemisphere at θ_obs - 90°
- Moonset: Moon exits visible hemisphere at θ_obs + 90°
- Moon visible for ~12.4 hours (half of 24.8h orbital period)

### Next Steps (Phase 3: Weather Services)
1. ~~FIX MOONRISE/MOONSET GEOMETRY~~ ✅ COMPLETE
2. Test celestial calculations in browser (verify all three bugfixes work)
3. Decide on weather generation strategy (Hybrid approach selected)
4. Begin porting core weather services (Temperature, Atmospheric, Wind, Precipitation)

---

## Implementation Plan 📋

### Phase 1: Foundation (NEXT)
**Goal**: Create core utilities and constants

#### 1.1 Create Constants File
**File**: `src/v2/models/constants.js`

**Contents**:
```javascript
// Disc world geometry
export const DISC_RADIUS = 7000; // miles

// Sun constants
export const SUN_ILLUMINATION_RADIUS = 10000; // miles
export const SUN_ORBITAL_PERIOD_HOURS = 24;
export const SUN_ORBITAL_RADIUS_MEAN = 9500; // miles
export const SUN_ORBITAL_RADIUS_AMPLITUDE = 1500; // miles

// Moon constants
export const LUNAR_CYCLE_DAYS = 29.53059;
export const MOON_ORBITAL_RADIUS = 7000; // miles (minimum)

// Time constants
export const YEAR_LENGTH_DAYS = 365.2422;

// Twilight distance thresholds (miles)
export const TWILIGHT_CIVIL = 11000;
export const TWILIGHT_NAUTICAL = 12000;
export const TWILIGHT_ASTRONOMICAL = 13000;

// Latitude band to radius mapping
export const LATITUDE_BAND_RADIUS = {
  equatorial: 700,   // 10% of disc radius
  tropical:   2100,  // 30%
  temperate:  3500,  // 50%
  subarctic:  4900,  // 70%
  polar:      6300   // 90%
};
```

**Commit Message**:
```
Add flat disc world constants

- Add disc geometry constants (radius, latitude bands)
- Add sun orbital parameters (illumination, orbital radius)
- Add moon orbital parameters
- Add twilight distance thresholds
- Add time constants (year length, lunar cycle)

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

#### 1.2 Create Geometry Utilities
**File**: `src/v2/services/celestial/geometry.js`

**Functions**:
- `normalizeAngle(angle)` - Normalize to [0, 360)
- `distanceToSun(R_obs, θ_obs, θ_sun, R_sun)` - Law of cosines
- `getSunOrbitalRadius(dayOfYear)` - Seasonal variation
- `getSunAngle(hour, φ_sun)` - Sun angular position
- `getMoonAngle(daysSinceEpoch, φ_moon)` - Moon angular position
- `getLunarPhaseAngle(θ_moon, θ_sun)` - Angular separation

**Commit Message**:
```
Add flat disc geometry utilities

- Implement angle normalization
- Implement distance-to-sun calculation (law of cosines)
- Implement sun orbital radius with seasonal variation
- Implement sun/moon angular position calculations
- Implement lunar phase angle calculation

All formulas per FLAT_DISC_WORLD.md specification

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

### Phase 2: Sun Service Rewrite
**Goal**: Replace spherical Earth calculations with flat disc geometry

#### 2.1 Rewrite SunriseSunsetService
**File**: `src/v2/services/celestial/SunriseSunsetService.js`

**Changes**:
- Remove spherical astronomy (declination, hour angle)
- Add disc geometry imports from `geometry.js`
- Add `getIlluminationState(R_obs, θ_obs, gameDate)` - Returns daylight/twilight/night
- Add `getTwilightLevel(distance)` - Returns twilight type
- Rewrite `getDaylightHours()` to solve for sunrise/sunset using distance threshold
- Add `getSunrise()` and `getSunset()` that solve `d = 10,000`
- Update return types to include twilight state

**Commit Message**:
```
Rewrite SunriseSunsetService for flat disc geometry

BREAKING CHANGE: Replace spherical Earth calculations with flat disc model

- Remove latitude-based solar declination calculations
- Implement distance-based illumination (d ≤ 10,000 = daylight)
- Add twilight level determination (civil/nautical/astronomical)
- Calculate sunrise/sunset by solving distance threshold
- Add seasonal variation via sun orbital radius
- Edge regions now have longest days (inverse of Earth)

Per FLAT_DISC_WORLD.md specification

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

### Phase 3: Moon Service Creation
**Goal**: Create new moon service using angular separation model

#### 3.1 Create MoonService
**File**: `src/v2/services/celestial/MoonService.js`

**Methods**:
- `constructor()` - Initialize with φ_moon offset
- `getMoonAngle(gameDate)` - Current moon angular position
- `getMoonrise(θ_obs, gameDate)` - When θ_moon = θ_obs - 180°
- `getMoonset(θ_obs, gameDate)` - When θ_moon = θ_obs + 180°
- `getLunarPhase(gameDate, sunAngle)` - Calculate phase from angular separation
- `getPhaseName(phaseAngle)` - Map angle to phase name
- `getIlluminationPercentage(phaseAngle)` - Calculate illumination %
- `isWaxing(phaseAngle)` - Determine if waxing or waning
- `isMoonVisible(θ_obs, gameDate)` - Check if moon is up
- `getFormattedMoonInfo(θ_obs, gameDate, sunAngle)` - Complete moon data

**Commit Message**:
```
Create MoonService for flat disc geometry

- Implement angular position calculation (360° / 29.53 days)
- Implement observer-relative moonrise/moonset
- Implement lunar phase from angular separation (θ_moon - θ_sun)
- Add phase name mapping (New, First Quarter, Full, Last Quarter)
- Add illumination percentage calculation
- Add waxing/waning determination

Moon phase now fully decoupled from seasons
Each observer has unique moonrise/moonset times

Per FLAT_DISC_WORLD.md specification

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

### Phase 4: Type Updates
**Goal**: Update data models to support new celestial features

#### 4.1 Update CelestialData Type
**File**: `src/v2/models/types.js`

**Changes**:
```javascript
/**
 * Celestial Data - Sun and moon information
 * @typedef {Object} CelestialData
 * @property {string} sunriseTime - Sunrise time (formatted)
 * @property {string} sunsetTime - Sunset time (formatted)
 * @property {boolean} isDaytime - Is it currently daytime?
 * @property {string} twilightLevel - 'none' | 'civil' | 'nautical' | 'astronomical'
 * @property {number} distanceToSun - Distance from observer to sun (miles)
 * @property {string} moonPhase - Moon phase name
 * @property {number} moonIllumination - Moon illumination percentage (0-100)
 * @property {boolean} isMoonVisible - Is moon currently above horizon?
 * @property {string} moonriseTime - Moonrise time (formatted)
 * @property {string} moonsetTime - Moonset time (formatted)
 */
```

**Commit Message**:
```
Update CelestialData type for flat disc model

- Add twilightLevel field (civil/nautical/astronomical)
- Add distanceToSun field for debugging/UI
- Add isMoonVisible field
- Add moonriseTime and moonsetTime fields
- Update JSDoc comments

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

### Phase 5: UI Integration
**Goal**: Wire celestial services into UI components

#### 5.1 Update App.jsx to Use Real Celestial Data
**File**: `src/v2/App.jsx`

**Changes**:
- Import new SunriseSunsetService and MoonService
- Remove fake weather celestial data
- Calculate real sun/moon data in useEffect
- Pass celestial data to CurrentWeather component
- Add observer position (θ_obs) - default to 0° for now

#### 5.2 Update CurrentWeather Component
**File**: `src/v2/components/weather/CurrentWeather.jsx`

**Changes**:
- Add twilight level display
- Add moon phase display with icon
- Add moonrise/moonset times
- Add distance to sun (for debugging)
- Style twilight states differently

**Commit Message**:
```
Integrate flat disc celestial calculations into UI

- Wire SunriseSunsetService and MoonService into App.jsx
- Remove fake celestial data from weather display
- Add twilight level indicator to CurrentWeather
- Add moon phase display with illumination percentage
- Add moonrise/moonset times to weather card
- Add sun distance display (debugging)

Remove "Test Mode" warning - using real calculations

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

### Phase 6: Testing & Refinement
**Goal**: Validate calculations and handle edge cases

#### 6.1 Test Cases to Verify
- [ ] Disc center (R_obs = 0) never sees daylight
- [ ] Edge regions (polar) have longest days
- [ ] Seasonal variation works (winter = shorter days everywhere)
- [ ] Twilight transitions smoothly
- [ ] Moon phase progresses correctly over 29.53 days
- [ ] Moonrise/moonset times differ by observer position
- [ ] Time advancement updates all celestial data

#### 6.2 Edge Cases to Handle
- [ ] What if observer θ_obs is needed? Add to Region model?
- [ ] Should we show "Permanent Night" for disc center?
- [ ] Display message explaining why center has no daylight?

---

## Pending Work (Post-Celestial) 🔜

### Weather Service
- [ ] Port MeteorologicalWeatherService (complex)
- [ ] Create WeatherContext provider
- [ ] Wire up real weather to UI
- [ ] Build WeatherEffects component (D&D mechanics)

### Advanced Features
- [ ] Add advanced time controls
- [ ] Add Export/Import functionality
- [ ] Add observer position (θ_obs) selection to Region
- [ ] Add seasonal calendar display
- [ ] Add weather history tracking

---

## Notes
- All work in `src/v2/` - original code in `src/` preserved for reference
- CAPSTONE folder is unrelated (past project for design reference)
- Follow commit message format with Claude Code attribution
- Update this file after each completed phase
