# Sprint 64 - NIMBUS

**Date**: 2026-01-16
**Agent**: NIMBUS
**Status**: COMPLETE

---

## Objectives

1. Implement precise sunrise/sunset times based on map pin Y position
2. Simplify Region Creator modal when placing via map pin
3. Update Region Editor modal to match new simplified flow

---

## Work Log

### Session Start
- Read START_HERE.md, HANDOFF.md, NOTES_FROM_USER.md
- Noted that HORIZON's Sprint 63 completed the searchable climate templates feature that was in Tyler's notes
- Created sprint log
- Added name to START_HERE.md

### Precise Sunrise/Sunset from Map Position

**Problem**: Previously, sunrise/sunset times used the midpoint of each latitude band (e.g., temperate = 4000 miles from disc center). This meant two locations in different parts of the temperate band would have identical sunrise/sunset times.

**Solution**: When a region is placed on a map, we now store the exact observer radius (distance from disc center in miles) calculated from the Y pixel position. This allows sunrise/sunset calculations to use the precise location rather than the band midpoint.

**Implementation**:

1. **WorldMapView.jsx**: When placing a location, calculate and include `observerRadius` from the Y position:
   ```javascript
   const observerRadius = pixelToMiles(pos.y, mapScale);
   onPlaceLocation({ x, y, latitudeBand, observerRadius });
   ```

2. **SunriseSunsetService.js**: Added optional `observerRadius` parameter to all calculation methods:
   - `getObserverRadius()` - now accepts optional override
   - `getDistanceToSun()` - passes through observerRadius
   - `findDistanceCrossing()` - passes through observerRadius
   - `getDailySunData()` - uses observerRadius for cache key and calculation
   - `getSunriseSunset()` - passes through observerRadius
   - `getFormattedTimes()` - passes through observerRadius

3. **WeatherService.js**: `getCelestialData()` now reads `region.mapPosition?.observerRadius` and passes it to the sun service.

4. **TemperatureService.js**: Temperature daily variation calculations now also use the precise observer radius for sunrise/sunset timing.

5. **RegionCreator.jsx**: Fixed bug where `observerRadius` was not being included in `mapPosition` when creating the region.

**Behavior**:
- Regions with map positions get precise sunrise/sunset based on exact Y location
- Regions without map positions (or legacy regions) fall back to latitude band midpoint
- Cache keys use rounded observer radius (to nearest mile) for efficiency when precise values are available

### Simplified Region Creator for Map-Placed Pins

**Problem**: When placing a pin on the map, the latitude band is already determined by the Y position. The Region Creator modal was showing all the latitude selection UI unnecessarily, and search was searching across ALL bands instead of just the relevant one.

**Solution**: When a region is created via map pin placement (`mapPosition` is provided), the UI now:

1. **Locks the latitude band** - shows it as read-only info at the top of the climate page
2. **Hides latitude selection** - removes "or browse by latitude" divider and latitude dropdown
3. **Filters search to locked band** - search only searches within templates for that latitude band
4. **Updates placeholder text** - search box says "Search temperate climates..." instead of generic text
5. **Shows template count** - displays "X land climates available" when not searching

The non-map workflow (creating regions via menu) remains unchanged with full latitude selection.

### Updated Region Editor Modal

**Problem**: The Region Editor modal had an old, simpler UI that didn't match the improvements made to the Region Creator.

**Solution**: Rewrote RegionEditor.jsx to match the new flow:

1. **Latitude band locking** - If region has `mapPosition`, latitude is shown as read-only with explanation "Latitude is determined by map position"
2. **Search functionality** - Added climate search with autocomplete dropdown (matching Creator)
3. **State A/B pattern** - When no template selected, shows search + dropdown. When template selected, shows template details with "Change" button
4. **Consistent styling** - Uses same CSS classes as RegionCreator for consistent appearance
5. **Ocean region support** - Detects ocean regions and shows appropriate templates

**For non-map regions**: Latitude band dropdown remains editable, allowing full control.

### Acknowledged Tyler's Notes

Migrated Tyler's new feature requests to ROADMAP.md under Interactive Map System:
- Assign existing regions to map pins (place unpinned locations)
- Movable pins (drag to reposition, right-click for edit menu)

---

## Files Modified

| File | Changes |
|------|---------|
| `docs/sprint-logs/SPRINT_64_NIMBUS.md` | Created sprint log |
| `docs/START_HERE.md` | Added NIMBUS to taken names |
| `docs/ROADMAP.md` | Marked sunrise/sunset complete, added pin features |
| `docs/NOTES_FROM_USER.md` | Cleared acknowledged notes |
| `src/v2/components/map/WorldMapView.jsx` | Store observerRadius when placing location |
| `src/v2/services/celestial/SunriseSunsetService.js` | Accept optional observerRadius in all methods |
| `src/v2/services/weather/WeatherService.js` | Pass observerRadius to sun service |
| `src/v2/services/weather/TemperatureService.js` | Pass observerRadius for temperature timing |
| `src/v2/components/region/RegionCreator.jsx` | Lock latitude band for map pins, filter search, simplify UI |
| `src/v2/components/region/RegionEditor.jsx` | Rewrite to match Creator: locked latitude, search, State A/B |

---

## Notes for Handoff

### What's Working
- Precise sunrise/sunset times based on exact Y position when regions are placed on maps
- Simplified region creation flow when placing pins on map
- Consistent UI between RegionCreator and RegionEditor
- Backward compatibility: regions without mapPosition fall back to latitude band midpoints

### Known Issues / Future Work
Tyler requested two new map pin features (added to ROADMAP.md):
1. **Assign existing regions to pins** - ability to place a pin and link it to an already-created region
2. **Movable pins** - drag pins to reposition, right-click for edit menu, confirm to save new position

Tyler also noted a bug: **Blurry pins on zoom** - pins get blurry when map is zoomed, and hover text momentarily clears then blurs again. Likely a CSS transform/scaling issue.

### Technical Notes
- `observerRadius` is stored in `region.mapPosition.observerRadius` (in miles from disc center)
- Cache keys use `r{miles}` format when observerRadius is provided, otherwise use latitude band name
- The `isLatitudeLocked` flag in both Creator and Editor determines if latitude UI is editable
