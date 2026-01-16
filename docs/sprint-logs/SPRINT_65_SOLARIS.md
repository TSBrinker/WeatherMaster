# Sprint 65 - SOLARIS

**Date**: 2026-01-16
**Focus**: Map pin improvements - blurry fix and assign existing regions

---

## Work Completed

### 1. Fixed Blurry Pins on Map Zoom
CSS fix for pins getting blurry when zooming the map. The parent `.map-image-wrapper` uses `transform: scale()` which caused sub-pixel rendering issues on child elements.

**Fix**: Added GPU layer isolation to `.location-pin` and `.pin-label`:
```css
will-change: transform;
backface-visibility: hidden;
-webkit-backface-visibility: hidden;
```

**Files modified**: `src/v2/components/map/WorldMapView.css`

### 2. Assign Existing Regions to Map Pins
New feature allowing users to link an existing region (one without a map position) to a clicked location on the map.

**New component**: `src/v2/components/region/RegionAssigner.jsx`
- Modal showing all regions without `mapPosition`
- Search/filter functionality
- Shows latitude band and climate info for each region
- Updates region with `mapPosition` and `continentId` on assignment

**UI Changes**:
- New Link icon button in map header (next to MapPin button)
- Green "assigning mode" with hint text: "Click to link an existing location here"
- Modes are mutually exclusive (clicking one disables the other)

**Files modified**:
- `src/v2/components/map/WorldMapView.jsx` - Added `onAssignLocation` prop, `assigningLocation` state, Link button
- `src/v2/components/map/WorldMapView.css` - Added `.assigning-mode` and `.click-hint.assigning` styles
- `src/v2/components/menu/HamburgerMenu.jsx` - Wired up RegionAssigner modal
- `src/v2/components/region/RegionCreator.css` - Added RegionAssigner styles

---

## Technical Notes

### Assignment Flow
```
User clicks Link button → assigningLocation = true
User clicks map → onAssignLocation({ x, y, latitudeBand, observerRadius })
HamburgerMenu → setShowRegionAssigner(true), setMapClickData(...)
RegionAssigner modal opens → user selects region → updateRegion(id, { mapPosition, continentId })
```

---

## Not Started This Sprint
- Movable pins (drag to reposition) - next priority per HANDOFF
