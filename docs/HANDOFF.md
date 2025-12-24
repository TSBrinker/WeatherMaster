# Handoff Document

**Last Updated**: 2025-12-23
**Previous Agent**: Flint (Sprint 23)
**Current Sprint Count**: 23 (next agent creates `SPRINT_24_*.md`)
**Status**: Latitude band restructuring IN PROGRESS - constants updated, templates need migration

---

## Where We Left Off

Sprint 23 restructured the latitude band system from arbitrary 20% slices to physics-based divisions derived from actual daylight hour calculations. This was prompted by the "Minnesota vs Kansas" snow persistence problem.

**What's done:**
- Analyzed daylight hours at various distances from disc center
- Defined 6 physics-based latitude bands with Tyler
- Updated `src/v2/models/constants.js` with new band definitions

**What's NOT done:**
- `src/v2/data/region-templates.js` still uses old band names (`central`, `rim`)
- New bands (`boreal`, `subtropical`) don't exist in templates yet
- Haven't searched for other code references to old band names

---

## Immediate Next Steps

### Step 1: Update region-templates.js

**1a. Replace `latitudeBands` object (lines 6-12):**
```javascript
export const latitudeBands = {
  "polar": { label: "Polar", range: "0-1,500 mi (disc center)" },
  "subarctic": { label: "Subarctic", range: "1,500-2,500 mi" },
  "boreal": { label: "Boreal", range: "2,500-3,500 mi" },
  "temperate": { label: "Temperate", range: "3,500-4,500 mi" },
  "subtropical": { label: "Subtropical", range: "4,500-5,500 mi" },
  "tropical": { label: "Tropical", range: "5,500-7,000 mi (near rim)" }
};
```

**1b. Rename band keys in `regionTemplates`:**
- Line ~29: `"central": {` → `"polar": {`
- Line ~924: `"rim": {` → `"tropical": {`

**1c. Add empty sections for new bands:**
```javascript
"boreal": {
  // Templates to be migrated here later
},
"subtropical": {
  // Templates to be migrated here later
},
```

**1d. Update `compatibleBands` arrays in special templates (~lines 1125-1260):**
- Replace `"central"` with `"polar"`
- Replace `"rim"` with `"tropical"`
- Consider adding `"boreal"` and `"subtropical"` where appropriate

### Step 2: Search for Other References

```bash
grep -r "central\|rim" src/v2/ --include="*.js"
```

Key files to check:
- `SunriseSunsetService.js` - uses `LATITUDE_BAND_RADIUS`
- Any UI components that display band names

### Step 3: Test the Application

```bash
npm start
```
Then visit `localhost:3000?test=true` and verify:
- Region dropdown shows correct band names
- Weather generation works for all bands
- No console errors about missing bands

---

## The New Latitude Bands

| # | Code Key | Distance from Center | Climate Character |
|---|----------|---------------------|-------------------|
| 1 | `polar` | 0-1,500 mi | Magical twilight in summer, polar night in winter |
| 2 | `subarctic` | 1,500-2,500 mi | Midnight sun, extreme seasonal swing |
| 3 | `boreal` | 2,500-3,500 mi | Northern forests, snow persists (Minnesota) |
| 4 | `temperate` | 3,500-4,500 mi | Classic four seasons, snow comes and goes (Kansas) |
| 5 | `subtropical` | 4,500-5,500 mi | Mild winters, warm summers |
| 6 | `tropical` | 5,500-7,000 mi | Warm, humid, fed by rim glacial melt |

These are derived from physics - see Sprint 23 log for daylight hour calculations.

---

## Future Work (After Migration Complete)

### Reassign Templates to New Bands
Once `boreal` and `subtropical` exist, consider moving templates:

**To `boreal`:**
- A "Cold Continental Prairie" variant (snow persists)
- Temperate Highland
- Possibly some subarctic templates

**To `subtropical`:**
- Mediterranean Coast
- Tropical Highland
- Tropical Deciduous Forest

### Wire Daylight to Temperature
The long-term goal: connect `SunriseSunsetService` to `TemperatureService` so temperature naturally responds to actual daylight hours. Currently `TemperatureService` uses hardcoded 5 AM min / 3 PM max regardless of latitude band.

---

## Outstanding Items from NOTES_FROM_USER.md

1. **Export button for precip test** - Add "Copy to Clipboard" for test harness
2. **Unused template factors** - What does `highBiodiversity` do?
3. **Diurnal variation** - Wire up flat-disc sun physics to temperature (discussed this sprint)
4. **Denver snow behavior** - Why does it disappear so quickly?

---

## Key Files

| File | Status |
|------|--------|
| `src/v2/models/constants.js` | UPDATED - has new 6-band system |
| `src/v2/data/region-templates.js` | NEEDS UPDATE - still uses old band names |
| `docs/sprint-logs/SPRINT_23_FLINT.md` | NEW - detailed notes on this work |
| `docs/imports/discVisualizationAndCalc.md` | NEW - Tyler's visualization app for reference |

---

## Cosmology Quick Reference

- **Disc radius**: 7,000 miles
- **Sun illumination radius**: 10,000 miles
- **Sun orbit (summer)**: 8,000 mi from center (1,000 mi from edge)
- **Sun orbit (winter)**: 11,000 mi from center (4,000 mi from edge)
- **Rim superheating**: Edge experiences extreme heat/cold cycles, shattering into void
- **Tropical paradise**: Fed by glacial melt from frozen rim edge
- **Polar twilight**: Center would have 24hr summer day, but magically moderated

---

*This document should be overwritten by each agent during handoff with current status.*
