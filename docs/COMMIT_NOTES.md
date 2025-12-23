# Commit Notes - Flat Disc Celestial Mechanics Implementation

## Summary
Implemented complete flat disc world celestial mechanics including sun/moon position calculations, sunrise/sunset times, lunar phases, moonrise/moonset, and twilight states.

## Files Created

### 1. src/v2/models/constants.js (196 lines)
**Purpose**: Central constants for flat disc world model

**Key Constants**:
- Disc geometry (radius: 7,000 miles)
- Sun parameters (illumination radius: 10,000 miles, orbital radii: 8,000-11,000 miles)
- Moon parameters (orbital period: 29.53059 days)
- Twilight thresholds (civil, nautical, astronomical)
- Latitude band to radius mappings
- Moon phase definitions with emoji icons
- Angular conversion factors

### 2. src/v2/services/celestial/geometry.js (206 lines)
**Purpose**: Core geometric calculations for flat disc model

**Functions**:
- `normalizeAngle(angle)` - Normalize angles to [0, 360)
- `getSunOrbitalRadius(dayOfYear)` - Seasonal sun distance variation
- `getSunAngle(hour, φ_sun)` - Sun's angular position
- `getMoonAngle(daysSinceEpoch, φ_moon)` - Moon's angular position
- `getLunarPhaseAngle(θ_moon, θ_sun)` - Angular separation for phases
- `distanceToSun(R_obs, θ_obs, θ_sun, R_sun)` - Law of cosines distance calculation
- `calculateIlluminationPercentage(phaseAngle)` - Moon illumination from phase angle
- `isWaxing(phaseAngle)` - Determine if moon is waxing or waning
- Helper functions for angular math

### 3. src/v2/services/celestial/SunriseSunsetService.js (295 lines)
**Purpose**: Calculate sunrise, sunset, day length, and twilight using flat disc geometry

**BREAKING CHANGE**: Complete rewrite from spherical Earth model to flat disc model

**Key Features**:
- Distance-based illumination (d ≤ 10,000 miles = daylight)
- Binary search for precise sunrise/sunset times
- Twilight level determination (civil/nautical/astronomical)
- Seasonal variation via sun orbital radius
- Special handling for disc center (permanent night)
- Edge regions have longest days (inverse of Earth)

**Methods**:
- `getObserverRadius(latitudeBand)` - Convert band to distance from center
- `getIlluminationState(distance)` - Determine twilight level
- `getDistanceToSun(latitudeBand, gameDate, θ_obs)` - Current sun distance
- `findDistanceCrossing(...)` - Find exact sunrise/sunset hour
- `getSunriseSunset(latitudeBand, gameDate, θ_obs)` - Complete sun data
- `getFormattedTimes(...)` - Human-readable times

### 4. src/v2/services/celestial/MoonService.js (267 lines)
**Purpose**: Calculate lunar phases, moonrise, and moonset using angular separation

**Model**: Lunar phase depends ONLY on angular separation between moon and sun (θ_moon - θ_sun)

**Key Features**:
- Phase calculation from angular separation (not synodic month approximation)
- Observer-relative moonrise/moonset (each observer sees different times)
- 8 phase names with emoji icons (🌑🌒🌓🌔🌕🌖🌗🌘)
- Illumination percentage calculation
- Waxing/waning determination
- Moon visibility check

**Methods**:
- `getMoonPosition(gameDate, φ_moon)` - Current moon angle
- `getLunarPhase(gameDate, φ_moon, φ_sun)` - Complete phase data
- `getPhaseFromAngle(phaseAngle)` - Map angle to phase name
- `getMoonriseHour(gameDate, θ_obs, φ_moon)` - When moon rises
- `getMoonsetHour(gameDate, θ_obs, φ_moon)` - When moon sets
- `isMoonVisible(gameDate, θ_obs, φ_moon)` - Is moon above horizon
- `getFormattedMoonInfo(...)` - Complete moon data for display

## Files Modified

### 5. src/v2/models/types.js
**Changes**: Expanded `CelestialData` typedef

**Added Fields**:
- `dayLength` - Formatted day length string
- `twilightLevel` - Current twilight state
- `distanceToSun` - Distance to sun in miles
- `isPermanentNight` - Flag for disc center
- `moonIcon` - Moon phase emoji
- `isWaxing` - Waxing/waning flag
- `isMoonVisible` - Moon visibility flag
- `moonriseTime` - Moonrise time string
- `moonsetTime` - Moonset time string
- `phaseAngle` - Debug field for phase angle

### 6. src/v2/App.jsx
**Changes**: Integrated real celestial calculations

**Modifications**:
- Import MoonService
- Remove fake celestial data from weather state
- Create separate `celestialData` state
- Calculate real sun data from SunriseSunsetService
- Calculate real moon data from MoonService
- Combine into complete CelestialData object
- Pass as separate prop to CurrentWeather
- Update info message to reflect real calculations

### 7. src/v2/components/weather/CurrentWeather.jsx
**Changes**: Display all celestial data with debug mode support

**New Features**:
- Accept `celestial` prop separately from `weather`
- Display twilight state badge with color coding
- Show sunrise/sunset/day length
- Show moon phase with icon and illumination percentage
- Show waxing/waning status
- Show moonrise/moonset times
- Show moon visibility
- Debug mode shows: distance to sun, phase angle
- Special handling for disc center (permanent night message)

**UI Elements**:
- Twilight badge (color-coded by level)
- Sun section (sunrise, sunset, day length)
- Moon section (phase icon, illumination, rise/set times)
- Debug information (conditional on debugMode preference)

## Technical Details

### Flat Disc Model Summary
- **Disc radius**: 7,000 miles
- **Sun orbit**: 8,000-11,000 miles (seasonal variation)
- **Sun illumination radius**: 10,000 miles
- **Moon orbit**: 29.53059 day period
- **Twilight zones**: 11k (civil), 12k (nautical), 13k (astronomical)

### Key Design Decisions
1. **Observer position (θ_obs)** defaults to 0° for all regions (simplifies initial implementation)
2. **Distance-based daylight** replaces altitude-based (sun gets farther, not lower)
3. **Angular separation for moon phase** replaces synodic month approximation
4. **Binary search for sunrise/sunset** provides precise times (±3.6 seconds accuracy)
5. **Debug mode** shows internal calculations (distance, phase angle)

### Important Consequences
1. **Disc center NEVER sees daylight** (R_obs = 0 means infinite distance to sun)
2. **Edge regions have longest days** (polar band closest to sun's orbit)
3. **Inner regions have harsher winters** (sun moves farther away in winter)
4. **Each observer has unique moonrise** (based on angular position θ_obs)
5. **Seasons from sun distance only** (no axial tilt)

## Testing Recommendations

### Test Cases to Verify
1. ✅ Disc center (equatorial band) shows "permanent night" or very short days
2. ✅ Polar band (edge) shows longer days than temperate
3. ✅ Sunrise/sunset times change with seasons
4. ✅ Moon phase progresses through full cycle over 29.53 days
5. ✅ Moonrise/moonset times change daily
6. ✅ Twilight levels transition smoothly
7. ✅ Debug mode shows distance calculations

### How to Test
1. Create a world and region (any latitude band)
2. Observe initial celestial data
3. Advance time by 1 hour repeatedly - watch values change
4. Advance time by 24 hours - watch sunrise/sunset shift
5. Advance time by several days - watch moon phase progress
6. Enable debug mode in preferences - verify distance shown
7. Create regions in different latitude bands - compare day lengths

## Commit Message Template

```
Implement flat disc world celestial mechanics

Add complete flat disc geometry for sun and moon calculations:

- Add constants.js with disc world parameters
- Add geometry.js with core geometric calculations
- Rewrite SunriseSunsetService for disc model
  * Distance-based illumination (d ≤ 10k = daylight)
  * Binary search for sunrise/sunset precision
  * Twilight level calculation
  * Seasonal sun orbital radius variation
  * Handle disc center permanent night
- Add MoonService for angular separation model
  * Lunar phase from θ_moon - θ_sun
  * Observer-relative moonrise/moonset
  * 8 phases with emoji icons
  * Waxing/waning determination
- Update CelestialData type with new fields
- Wire services into App.jsx with real calculations
- Update CurrentWeather to display all celestial data
  * Twilight state badge
  * Sun rise/set/length
  * Moon phase/rise/set/visibility
  * Debug mode shows distances

BREAKING CHANGE: SunriseSunsetService now uses flat disc
geometry instead of spherical Earth calculations

Edge regions now have longest days (inverse of Earth)
Disc center experiences permanent twilight/night

Per FLAT_DISC_WORLD.md specification

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## Performance Notes
- Binary search runs in O(log n) time, very fast
- Celestial calculations update on time change (via useEffect)
- No caching needed - calculations are instantaneous
- Distance calculation uses law of cosines (simple trigonometry)

## Future Enhancements
- [ ] Add observer position (θ_obs) selection per region
- [ ] Add visual sun/moon position diagram
- [ ] Add twilight gradient visualization
- [ ] Add custom sun/moon phase offsets (φ_sun, φ_moon)
- [ ] Add eclipse calculations
- [ ] Add seasonal calendar display
- [ ] SVG moon phase icons (replace emoji)

## Documentation References
- See [FLAT_DISC_WORLD.md](FLAT_DISC_WORLD.md) for complete technical specification
- See [PROGRESS.md](PROGRESS.md) for implementation roadmap
- See [V2_IMPLEMENTATION_CHECKLIST.md](V2_IMPLEMENTATION_CHECKLIST.md) for full feature status
