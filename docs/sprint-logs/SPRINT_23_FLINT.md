# Sprint 23 - Flint

**Date**: 2025-12-23
**Focus**: Physics-based latitude band restructuring

---

## Summary

This sprint focused on restructuring the latitude band system to be derived from actual physics (daylight hour calculations) rather than arbitrary 20% slices of the disc. This work was prompted by investigating biome granularity for snow behavior (the "Minnesota vs Kansas" problem).

---

## What Was Accomplished

### 1. Analyzed Disc Cosmology
- Compared the visualization app calculations (`docs/imports/discVisualizationAndCalc.md`) with our existing `SunriseSunsetService` and `geometry.js`
- Confirmed all core constants match perfectly (disc radius, sun illumination radius, seasonal orbital variation)
- Identified that `TemperatureService` does NOT use actual daylight calculations - it uses a hardcoded diurnal cycle

### 2. Calculated Physics-Based Daylight Hours
Ran calculations for daylight hours at various distances from disc center:

| Distance | Summer Daylight | Winter Daylight | Seasonal Swing |
|----------|-----------------|-----------------|----------------|
| 0-1000 mi | 24 hrs | 0 hrs | Extreme |
| 1500-2000 mi | 24 hrs | 6-7 hrs | Very extreme |
| 2500-3000 mi | 16-18 hrs | 8 hrs | Large |
| 3500-4500 mi | 13-15 hrs | 8-9 hrs | Moderate |
| 5000-6000 mi | 12-13 hrs | 8-9 hrs | Small |
| 6500-7000 mi | 11-12 hrs | 8-9 hrs | Minimal |

### 3. Defined New Latitude Bands with Tyler
Based on physics + Marai cosmology (including rim superheating/glacial melt), defined 6 bands:

| # | Code Key | Display Name | Distance | Climate Character |
|---|----------|--------------|----------|-------------------|
| 1 | `polar` | Polar | 0-1,500 mi | Magical twilight in summer, polar night in winter |
| 2 | `subarctic` | Subarctic | 1,500-2,500 mi | Midnight sun, extreme seasonal swing |
| 3 | `boreal` | Boreal | 2,500-3,500 mi | Northern forests, snow persists (Minnesota-like) |
| 4 | `temperate` | Temperate | 3,500-4,500 mi | Classic four seasons, snow comes and goes (Kansas-like) |
| 5 | `subtropical` | Subtropical | 4,500-5,500 mi | Mild winters, warm summers |
| 6 | `tropical` | Tropical | 5,500-7,000 mi | Warm, humid, fed by rim glacial melt |

### 4. Updated constants.js
- Changed `LATITUDE_BAND_RADIUS` and `LATITUDE_BAND_RANGES` to reflect the new 6-band system
- Renamed `central` → `polar`, `rim` → `tropical`
- Added `boreal` and `subtropical` as new bands
- Added comprehensive documentation comments

---

## What Remains (For Next Agent)

### Immediate: Complete the Band Migration

**Step 1: Update `latitudeBands` in region-templates.js (lines 6-12)**
```javascript
// OLD:
export const latitudeBands = {
  "central": { label: "Central", range: "0-20% radius (center)" },
  "subarctic": { label: "Subarctic", range: "20-40% radius" },
  "temperate": { label: "Temperate", range: "40-60% radius" },
  "tropical": { label: "Tropical", range: "60-80% radius" },
  "rim": { label: "Rim", range: "80-100% radius (edge)" }
};

// NEW:
export const latitudeBands = {
  "polar": { label: "Polar", range: "0-1,500 mi (disc center)" },
  "subarctic": { label: "Subarctic", range: "1,500-2,500 mi" },
  "boreal": { label: "Boreal", range: "2,500-3,500 mi" },
  "temperate": { label: "Temperate", range: "3,500-4,500 mi" },
  "subtropical": { label: "Subtropical", range: "4,500-5,500 mi" },
  "tropical": { label: "Tropical", range: "5,500-7,000 mi (near rim)" }
};
```

**Step 2: Rename the band keys in `regionTemplates` object**
- `"central": { ... }` → `"polar": { ... }` (around line 29)
- `"rim": { ... }` → `"tropical": { ... }` (around line 924)
- Keep `subarctic` and `temperate` as-is for now

**Step 3: Update `compatibleBands` arrays in special templates**
- Replace `"central"` with `"polar"`
- Replace `"rim"` with `"tropical"`
- Add `"boreal"` and `"subtropical"` where appropriate

**Step 4: Create empty `boreal` and `subtropical` band sections**
Initially these can be empty - templates will be migrated to them in a later step.

**Step 5: Search codebase for other references to old band names**
```bash
grep -r "central\|rim" src/v2/ --include="*.js"
```
Update any references in services that use latitude bands.

### Later: Reassign Biome Templates

Once the structure is in place, consider moving templates to more appropriate bands:

**Candidates for `boreal` (from current `temperate`):**
- Continental Prairie (the Minnesota variant we discussed)
- Temperate Highland (high elevation = colder)
- Possibly Continental Taiga (currently in subarctic)

**Candidates for `subtropical` (from current `tropical`):**
- Mediterranean Coast
- Tropical Highland ("eternal spring" climates)
- Tropical Deciduous Forest

This should be done thoughtfully, possibly with Tyler's input on each.

### Future: Wire Daylight to Temperature

The long-term goal discussed was to connect `SunriseSunsetService` to `TemperatureService` so temperature responds to actual daylight hours. This would make latitude bands affect temperature naturally through physics rather than requiring manual temperature modifiers.

Key insight: `TemperatureService.getDailyTemperatureVariation()` currently uses hardcoded 5 AM min / 3 PM max. It should instead use `SunriseSunsetService.getSunriseSunset()` to get actual sunrise/sunset times.

---

## Key Files Modified

| File | Changes |
|------|---------|
| `src/v2/models/constants.js` | Updated `LATITUDE_BAND_RADIUS` and `LATITUDE_BAND_RANGES` with 6 physics-based bands |

## Key Files To Modify

| File | Changes Needed |
|------|----------------|
| `src/v2/data/region-templates.js` | Rename band keys, update `latitudeBands`, add new empty band sections |
| `src/v2/services/celestial/SunriseSunsetService.js` | May need to handle new band names |
| Any file importing `LATITUDE_BAND_RADIUS` | Verify compatibility with new keys |

---

## Cosmology Notes (For Reference)

Tyler shared important worldbuilding details:

1. **Rim Superheating**: The disc edge experiences extreme superheating when the sun passes close (1,000 mi in summer), followed by supercooling when exposed to the void. This causes rock to melt, ice to vaporize, then shatter.

2. **Tropical Paradise**: The tropical zone (5,500-7,000 mi) is warm and humid because glacial melt from the frozen rim edge creates humidity. "Palm trees within view of permanent glacier."

3. **Polar Twilight**: The center (0-1,500 mi) would naturally have 24-hour daylight in summer, but Tyler mentioned this is "magically induced twilight" - a worldbuilding decision to handle the physics.

4. **Firmament**: A dome-shaped atmosphere protects the habitable regions from the extreme rim conditions.

---

## Discussion Points Noted

- **Humidity as a modifier**: Tyler asked if humidity could also have a latitude band modifier (like temperature). Not implemented yet, but worth considering.
- **Frost dates**: Tyler liked the idea of calculating last frost date from seed-based weather. Noted as stretch goal.
- **Denver snow behavior**: Still on the list from NOTES_FROM_USER.md - why does Denver snow disappear so quickly? (Sublimation, altitude, intense sunshine at elevation)

---

*Sprint 23 - Flint*
