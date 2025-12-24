# Sprint 29 - Granite

**Date**: 2025-12-24
**Focus**: Thunderstorm severity scaling + Time display redesign

---

## Summary

### Part 1: Thunderstorm Severity by Biome

Analyzed thunderstorm test results from Sprint 28. The 5d4 wind boost produced good normal/strong variety (~50/50) but severe storms were nearly non-existent (0.5%).

Implemented biome-aware storm severity using the existing `tornadoRisk` specialFactor:
- **Base boost:** 3d6 (3-18 mph) for ALL thunderstorms
- **Tornado risk bonus:** tornadoRisk × 6d6 (scaled 0-36 mph for high-risk regions)

**Test Results:**
| Biome | tornadoRisk | Severe | Strong | Normal | Severe % |
|-------|-------------|--------|--------|--------|----------|
| Continental Prairie | 0.5 | 8 | 68 | 5 | 9.9% |
| Cold Continental Prairie | 0.3 | 3 | 50 | 21 | 4.1% |
| Boreal Highland | 0 | 0 | 12 | 12 | 0% |
| Convergence Zone | 0 | 0 | 7 | 11 | 0% |

Perfect - prairie biomes get severe storms, non-tornado-risk biomes don't.

### Part 2: Time Display Redesign (iOS Lock Screen Style)

Redesigned the WeatherHeader to match iOS lock screen aesthetics:
- **Large time display** (3.5rem) - prominent and clickable
- **Compact date line** with next sunrise/sunset info (e.g., "Mar 15 • Sunset 6:42 PM")
- **Click-to-open date picker** - full modal with Year/Month/Day/Hour selection
- **Arrow controls flanking the time** - `≪ ‹ [4:00 PM] › ≫` layout

---

## Changes Made

### WeatherGenerator.js (lines 101-131)
- Replaced flat 5d4 storm wind boost with scaled formula:
  - 3d6 base (all thunderstorms get some gustiness)
  - Plus tornadoRisk × 6d6 (prairie storms get much more)

### WeatherHeader.jsx
- Complete rewrite with new layout:
  - Date line at top with next celestial event
  - Time row with arrows flanking the large clickable time
- Added date picker modal with Year/Month/Day/Hour selection
- New props: `onJumpToDate`, `celestialData`

### WeatherHeader.css
- New `.time-row` layout with `.time-controls-left` and `.time-controls-right`
- Styled `.time-display-hero` (large time)
- Styled `.date-line`, `.compact-date`, `.next-event`
- Fixed button styling to override Bootstrap's blue link color
- Date picker modal theming to match dark UI

### WorldContext.jsx
- Updated `jumpToDate` to accept (year, month, day, hour) parameters

### App.jsx
- Pass `onJumpToDate` and `celestialData` to WeatherHeader

### ROADMAP.md
- Added instruction to mark in-progress items with `[~]`

---

## Notes

- `tornadoRisk` was already defined in region-templates.js but wasn't being used
- This sets up foundation for future tornado events (severe thunderstorms could spawn tornadoes)
- Time display uses same celestial data already being generated for weather
- The old TimeDisplay.jsx and TimeControls.jsx components are now unused (functionality moved to WeatherHeader)
