# Handoff Document

**Last Updated**: 2025-12-27
**Previous Agent**: Sprint 34 (unnamed - short session)
**Current Sprint Count**: 34 (next agent creates `SPRINT_35_*.md`)
**Status**: Map persistence bug identified, solution designed but not implemented

---

## CRITICAL: Map Persistence Bug

### The Problem
Maps uploaded via the World Map feature **do not persist** after page reload. The map image and any regions created from the map screen disappear.

### Root Cause
**localStorage quota exceeded**. The map image is stored as a base64 data URL directly in the world object. A typical map image is 2-5MB, and base64 encoding adds ~33% overhead. localStorage has a ~5MB limit per domain.

When `saveWorlds()` tries to save the world with the large map image, it **silently fails** (the error is caught and logged to console in `localStorage.js:24-27`, but nothing notifies the user). On reload, `loadWorlds()` returns the old data without the map.

### The Solution (NOT YET IMPLEMENTED)

**Two-part fix:**

#### Part 1: Switch to IndexedDB
- IndexedDB is a browser-native database (free, local, offline-capable - just like localStorage)
- Has 50MB+ storage limit (vs localStorage's 5MB)
- Replace `src/v2/services/storage/localStorage.js` with IndexedDB implementation
- Can use `idb` or `Dexie.js` library to simplify the async API
- Data structure stays the same, just the storage mechanism changes

#### Part 2: Auto-compress images with scale adjustment
When user uploads a large image:
1. Detect if image exceeds threshold (e.g., 2000px on longest edge)
2. Compress to target size, calculate scale factor
3. **Automatically adjust `milesPerPixel`** to maintain accurate distances:
   ```
   newMilesPerPixel = originalMilesPerPixel × (originalWidth / newWidth)
   ```
4. Adjust any existing pin positions:
   ```
   newX = originalX × (newWidth / originalWidth)
   newY = originalY × (newHeight / originalHeight)
   ```
5. Show user a notice: "Image compressed from 4000×3000 to 2000×1500. Scale adjusted automatically."

**Why auto-adjust matters**: Tyler calculates scale at full resolution (e.g., 4K map at 1px = 1 mile). If we compress without adjusting, his calculations break. The math preserves real-world distances.

### Files to Modify
| File | Changes Needed |
|------|----------------|
| `src/v2/services/storage/localStorage.js` | Replace with IndexedDB implementation (or create new `indexedDB.js`) |
| `src/v2/contexts/WorldContext.jsx` | Update imports if storage file changes |
| `src/v2/components/map/MapConfigModal.jsx` | Add image compression on upload, scale adjustment logic, user notice |
| `src/v2/utils/imageUtils.js` | NEW FILE - image compression utility functions |

---

## What Was Done This Sprint

### 1. Committed Previous Agent's Work
The previous agent (Sprint 33 - Marble II) had uncommitted changes implementing the **World Map System**:
- `WorldMapView.jsx/css` - Interactive map display with curved latitude band overlays
- `MapConfigModal.jsx/css` - Upload and configure map with scale settings
- `mapUtils.js` - Band calculation and coordinate conversion utilities
- Integration with HamburgerMenu, RegionCreator, WorldContext

### 2. Fixed Overlay Positioning Bug
The latitude band overlays and pins were visually bunched at the top of the map instead of spreading across it.

**Cause**: SVG overlay was positioned relative to the scroll container, not the actual image dimensions.

**Fix**:
- Added `.map-image-wrapper` div around image and overlays
- Changed `preserveAspectRatio` from `"none"` to `"xMidYMid meet"`
- Wrapper uses `position: relative; display: inline-block; width: 100%` to match image size exactly

**Commit**: `e2b9926` - "Add world map system with latitude band overlays"

---

## Suggested Next Tasks

### HIGH PRIORITY: Fix Map Persistence
See detailed solution above. This blocks the map feature from being usable.

### Quick Fixes (from Tyler's mobile notes)
- [ ] Time arrow position shifts with digit width - give time fixed width
- [ ] Hamburger menu icon slightly off-center vertically in its circle
- [ ] Feels Like section causes layout shifts when data appears/disappears
- [ ] Time control improvements: day jump buttons (<<< / >>>), larger hitboxes

### Investigation Needed
- [ ] Cloud % changes mostly at midnight - need to check cloud transition logic
- [ ] Verify polar twilight lands implementation (first 500 miles as separate zone)

### Features/UX Ideas
- [ ] "X condition in Y hours" forecast teaser on main display
- [ ] Preferences menu restructure (Edit Locations, Preferences, Help, Manage Data)
- [ ] Edit world name functionality

### Stretch Goals
- [ ] Multiple worlds per user
- [ ] Continent hierarchy for location grouping
- [ ] New biomes: Humid Subtropical, Steppe

---

## Key Files Reference

### Map System (new this sprint)
| File | Purpose |
|------|---------|
| `src/v2/components/map/WorldMapView.jsx` | Interactive map display, band overlays, pins |
| `src/v2/components/map/WorldMapView.css` | Map styling |
| `src/v2/components/map/MapConfigModal.jsx` | Upload/configure map |
| `src/v2/components/map/MapConfigModal.css` | Config modal styling |
| `src/v2/utils/mapUtils.js` | Band calculations, coordinate conversions |

### Storage (needs updating for persistence fix)
| File | Purpose |
|------|---------|
| `src/v2/services/storage/localStorage.js` | Current storage - has 5MB limit issue |
| `src/v2/contexts/WorldContext.jsx` | Uses storage, has `updateWorldMap()` method |

---

## Test Harness Info

There are FOUR separate tests at `localhost:3000?test=true`:

1. **Main Test Harness** - Full year, all biomes (~30 sec)
2. **Precipitation Analysis** - Cold biomes, 30 days hourly
3. **Thunderstorm Analysis** - Thunder-prone biomes, 60 summer days × 5 years
4. **Flood Analysis** - Snow-capable biomes, 90 days (Jan 15 - Apr 15)

---

## Special Factors Reference

### NOW USED:
| Factor | Effect |
|--------|--------|
| `thunderstorms` | Converts heavy rain to thunderstorm (0.6-0.7 in templates) |
| `tornadoRisk` | Scales thunderstorm wind boost (0.3-0.5 in prairie templates) |
| `highDiurnalVariation` | 15° vs 5° day-to-day temp swing |
| `dryAir` | Precip reduction + enhanced snow melt/sublimation |
| `permanentIce` | Precip reduction when > 0.7 |
| `coldOceanCurrent` | Up to 85% precip reduction |
| `rainShadowEffect` | Up to 70% precip reduction |
| `groundType` | Melt rate modifier - permafrost=0.5×, sand=1.5× |

### READY FOR EXTREME WEATHER:
| Factor | Intended Use | Templates Using It |
|--------|--------------|-------------------|
| `hurricaneRisk` | Hurricane events | Subtropical Coast, Mediterranean Coast (0.7) |
| `highWinds`, `coastalWinds` | Could boost base wind | Various coastal/prairie |

---

*This document should be overwritten by each agent during handoff with current status.*
