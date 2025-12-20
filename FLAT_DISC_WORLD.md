# Flat Disc World Model - Technical Specification

## Overview
WeatherMaster v2 supports a flat disc world cosmology with deterministic celestial mechanics. This document defines the authoritative mathematical model for solar, lunar, seasonal, and twilight calculations.

---

## 1. Global Geometry

### The Disc
- **Radius**: `R_disc = 7,000 miles`
- **Diameter**: `14,000 miles`
- **Properties**: Flat, stationary (no rotation)

### Observers
Each observer is defined by polar coordinates:
```
R_obs ∈ [0, 7,000]     // distance from disc center (miles)
θ_obs ∈ [0°, 360°)    // fixed angular position on disc
```

**Important**: Observers are stationary unless explicitly modeled otherwise.

---

## 2. Coordinate System

- **System**: Polar coordinates (r, θ)
- **Angle Convention**: Angles increase counter-clockwise (standard mathematical convention)
- **Normalization**: All angles normalized to [0°, 360°)

---

## 3. Time Constants (Earth-Equivalent)

```
Solar day (T_sun)     = 24 hours
Lunar month (T_moon)  = 29.53059 days (synodic)
Year length (T_year)  = 365.2422 days
```

---

## 4. Sun Model

### Sun Properties
```
Illumination radius (E_sun) = 10,000 miles
Orbital period              = 24 hours
```

### Seasonal Orbital Distance (Center-to-Center)

The sun's distance from disc center varies seasonally:

```
Summer solstice: R_sun = 8,000 miles
Winter solstice: R_sun = 11,000 miles
```

**Seasonal Interpolation** (smooth cosine):
```javascript
R_mean = 9,500 miles
A      = 1,500 miles

R_sun(t) = R_mean + A * cos(2π * t / T_year)
```

Where `t` is time in days since reference epoch (e.g., year start).

### Angular Position
```javascript
θ_sun(t) = (360° / 24h) * t + φ_sun
```

Where:
- `t` = time in hours
- `φ_sun` = arbitrary reference offset (calendar zero)

---

## 5. Day / Night Determination

### Core Distance Calculation

The distance from observer to sun is calculated using the law of cosines:

```javascript
d² = R_obs² + R_sun(t)² - 2 * R_obs * R_sun(t) * cos(θ_sun(t) - θ_obs)
d = sqrt(d²)
```

### Illumination State
```javascript
if (d ≤ 10,000 miles) {
  // Daylight
} else {
  // Night (or twilight)
}
```

### Important Consequences

1. **Disc center (`R_obs = 0`) is NEVER illuminated**
2. **Inner regions experience harsher winters** (sun moves farther away)
3. **Seasons arise purely from solar distance**, not axial tilt
4. **Edge regions have longest days** (closer to sun's orbit)

---

## 6. Twilight Model (Distance-Based)

Twilight is modeled as concentric distance shells beyond full daylight:

```javascript
if (d ≤ 10,000)              // Daylight
else if (d ≤ 11,000)         // Civil Twilight
else if (d ≤ 12,000)         // Nautical Twilight
else if (d ≤ 13,000)         // Astronomical Twilight
else                         // Night
```

**Key Properties**:
- No horizon angles
- No atmospheric refraction
- Distance-only calculation

---

## 7. Moon Model

### Moon Properties
```
Orbital period (T_moon_orbit) = 24.8 hours (~1.033 days, slightly slower than sun)
Synodic period (phase cycle)  = 29.53059 days (time for phase to repeat)
Orbit radius (R_moon)         ≥ 7,000 miles (similar to sun's orbit)
```

**Key Insight**: The moon orbits the disc edge every ~24.8 hours (rises/sets daily), but because it moves slower than the sun (24h vs 24.8h), it "slips back" relative to the sun, causing the phase to change over 29.53 days.

### Angular Position
```javascript
θ_moon(t) = (360° / T_moon_orbit) * t + φ_moon
```

Where:
- `t` = time in hours
- `T_moon_orbit` = 24.8 hours (or can use 24.84 for Earth-accurate)
- `φ_moon` = phase offset (solved from initial moonrise event)

---

## 8. Moonrise and Moonset (Observer-Relative)

**Moonrise is NOT illumination-based.**

For an observer at angular position `θ_obs`, the moon is visible when within a ±90° arc:

```javascript
Visible hemisphere: [θ_obs - 90°, θ_obs + 90°]  (mod 360°)

Moonrise when: θ_moon = θ_obs - 90°  (moon enters visible hemisphere from "east")
Moonset  when: θ_moon = θ_obs + 90°  (moon exits visible hemisphere to "west")
```

**Geometric Reasoning**:
- Observer at θ_obs can see a 180° arc centered on their position
- Moon rises when it enters this arc: θ_obs - 90°
- Moon sets when it exits this arc: θ_obs + 90°
- Rise and set are separated by 180° of moon travel = ~12.4 hours

**Important Properties**:
1. Moon rises and sets approximately once per day (~24.8 hour period)
2. Moon is visible for ~12.4 hours (half the orbital period)
3. Each observer experiences different moonrise/moonset times (based on θ_obs)
4. Moon orbital period is slightly longer than sun (24.8h vs 24h)
5. This causes moon to "slip" ~50 minutes later each day
6. A single observed moonrise event can solve for `φ_moon`

---

## 9. Lunar Phase Calculation (Independent of Seasons)

Lunar phase depends **only** on angular separation between Sun and Moon:

```javascript
phase_angle = (θ_moon(t) - θ_sun(t)) mod 360°
phase_fraction = phase_angle / 360
```

### Phase Mapping
```
0° (0.00)    → New Moon
90° (0.25)   → First Quarter
180° (0.50)  → Full Moon
270° (0.75)  → Last Quarter
```

### Synodic Period Explanation
Because the moon orbits slower than the sun (24.8h vs 24h):
- Each day, the moon "falls behind" the sun by: 360° × (1/24 - 1/24.8) ≈ 12.2° per day
- After 29.53 days, the moon has fallen behind by 360°, completing a full phase cycle
- **Synodic period** = 1 / (1/T_sun - 1/T_moon_orbit) = 1 / (1/24 - 1/24.8) ≈ 29.53 days

### Waxing vs Waning
- **Waxing**: `phase_angle` is increasing (0° → 180°)
- **Waning**: `phase_angle` is decreasing (180° → 360°/0°)

---

## 10. Latitude Band Mapping

The five latitude bands map to concentric rings (INVERSE of Earth):

```
central:     R_obs ∈ [0,    1,400) miles  (0% - 20% of radius) - SHORTEST days
subarctic:   R_obs ∈ [1,400, 2,800) miles (20% - 40%)
temperate:   R_obs ∈ [2,800, 4,200) miles (40% - 60%)
tropical:    R_obs ∈ [4,200, 5,600) miles (60% - 80%)
rim:         R_obs ∈ [5,600, 7,000] miles (80% - 100%) - LONGEST days
```

**Key Difference from Earth**:
- **Central** (disc center) has shortest days / permanent night (far from sun's orbit)
- **Rim** (disc edge) has longest days (closest to sun's orbit)
- This is the INVERSE of Earth's polar/equatorial pattern

Representative `R_obs` for each band:
```javascript
const R_OBS_MAP = {
  central:    700,   // 10% of radius (center) - shortest days
  subarctic:  2100,  // 30%
  temperate:  3500,  // 50%
  tropical:   4900,  // 70%
  rim:        6300   // 90% (edge) - longest days
};
```

---

## 11. Key Design Properties

✅ **Deterministic**: No randomness in celestial mechanics
✅ **No spherical astronomy**: Pure 2D polar geometry
✅ **No axial tilt**: Flat disc has no axis
✅ **No latitude**: Distance from center replaces latitude
✅ **Seasons via solar distance only**
✅ **Moon phase fully decoupled from illumination**
✅ **Twilight handled cleanly with distance shells**

---

## 12. Implementation Checklist

### Phase 1: Core Utilities ✓
- [x] Create design document
- [ ] Create `src/v2/services/celestial/geometry.js` - Core geometric calculations
- [ ] Add constants to `src/v2/models/constants.js`

### Phase 2: Sun Service
- [ ] Rewrite `SunriseSunsetService` for disc geometry
  - [ ] Implement `R_sun(t)` seasonal variation
  - [ ] Implement distance calculation `d(R_obs, θ_obs, t)`
  - [ ] Implement illumination state determination
  - [ ] Implement twilight level calculation
  - [ ] Calculate sunrise/sunset times by solving `d = 10,000`
  - [ ] Test with all five latitude bands

### Phase 3: Moon Service
- [ ] Create new `src/v2/services/celestial/MoonService.js`
  - [ ] Implement `θ_moon(t)` calculation
  - [ ] Implement moonrise/moonset calculation
  - [ ] Implement lunar phase calculation
  - [ ] Implement phase name mapping
  - [ ] Implement illumination percentage
  - [ ] Test lunar cycle over 29.53 days

### Phase 4: Integration
- [ ] Update `CelestialData` type in `types.js` to include twilight
- [ ] Wire celestial data into `CurrentWeather` component
- [ ] Add moon phase display to UI
- [ ] Add twilight display to UI
- [ ] Test time advancement with sun, moon, and seasons

### Phase 5: Testing & Validation
- [ ] Test edge cases (disc center, disc edge)
- [ ] Verify seasonal variations
- [ ] Verify moon phase progression
- [ ] Test observer-relative moonrise

---

## 13. Reference Implementation Formulas

### Distance from Observer to Sun
```javascript
function distanceToSun(R_obs, θ_obs, θ_sun, R_sun) {
  const angle_diff = θ_sun - θ_obs;
  const d_squared = R_obs * R_obs
                  + R_sun * R_sun
                  - 2 * R_obs * R_sun * Math.cos(angle_diff * Math.PI / 180);
  return Math.sqrt(d_squared);
}
```

### Sun Orbital Radius (Seasonal)
```javascript
function getSunOrbitalRadius(dayOfYear) {
  const R_mean = 9500;
  const A = 1500;
  const T_year = 365.2422;
  return R_mean + A * Math.cos(2 * Math.PI * dayOfYear / T_year);
}
```

### Sun Angular Position
```javascript
function getSunAngle(hour, φ_sun = 0) {
  return ((360 / 24) * hour + φ_sun) % 360;
}
```

### Moon Angular Position
```javascript
function getMoonAngle(daysSinceEpoch, φ_moon = 0) {
  const T_moon = 29.53059;
  return ((360 / T_moon) * daysSinceEpoch + φ_moon) % 360;
}
```

### Lunar Phase
```javascript
function getLunarPhase(θ_moon, θ_sun) {
  let phase_angle = (θ_moon - θ_sun) % 360;
  if (phase_angle < 0) phase_angle += 360;
  return phase_angle;
}
```

---

## Notes
- This is the **authoritative specification** - all implementations must match this model
- When resuming work, read this file first to understand the complete system
- Update this document if any constants or formulas change
