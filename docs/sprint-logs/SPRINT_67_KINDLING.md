# Sprint 67 - KINDLING

**Date**: 2026-01-16
**Focus**: Map zoom UX improvements

---

## Session Log

### Onboarding
- Read START_HERE.md
- Chose name: KINDLING (fire-starting material - twigs, dry leaves)
- Created this sprint log
- Read HANDOFF.md - Sprint 66 (STRATUS) completed movable pins feature
- Read NOTES_FROM_USER.md - Tyler has a note about map zoom improvements

### Map Zoom Improvements (from Tyler's notes)
Implemented enhancements to the map zoom controls:

1. **Scroll-to-zoom**: Removed Ctrl/Cmd requirement - now just scroll anywhere on the map to zoom in/out
2. **Animated zoom on buttons**: +/- buttons and reset now have smooth 200ms ease-out transitions instead of instant jumps
3. **Zoom toward cursor**: Scroll wheel zooms toward the mouse position (point under cursor stays fixed)
4. **Zoom toward view center**: Button zooms keep your current view centered (pan scales proportionally)

Key implementation details:
- Animation only enabled for buttons (via `isAnimatingZoom` state flag) - scroll/pinch remain instant
- Zoom-toward-cursor math: adjust pan by `offset * (zoomChange - 1)` to keep cursor point fixed
- Required `{ passive: false }` on wheel listener to allow `preventDefault()`

### Latitude Band Overlay Fix
Fixed the "flat bottom" bug in curved latitude band rendering. When a band's outer or inner circle bottom was visible within the map, the path was drawing a straight line across instead of following the curve.

**Root cause**: `generateBandPath()` traced left side down, jumped straight to right side, then traced right side up - missing the curved bottom.

**Fix**: Added detection for when circle bottom is visible (`centerY + radius <= imageHeight`) and if so, generate additional points along the actual circle curve at the bottom before continuing to the right side.

---

## Changes Made

### `src/v2/components/map/WorldMapView.jsx`
- Added `isAnimatingZoom` state to track when button-triggered zoom is active
- Modified `handleZoomIn`, `handleZoomOut`, `handleResetZoom` to set animation flag with 200ms timeout
- Replaced `onWheel` React prop with `useEffect` that attaches wheel handler with `{ passive: false }` - this is required because modern browsers default wheel events to passive, which prevents `preventDefault()` from working
- Added `animating` class to map-image-wrapper when animation is active

### `src/v2/components/map/WorldMapView.css`
- Added `.map-image-wrapper.animating` rule with `transition: transform 0.2s ease-out`

### `src/v2/utils/mapUtils.js`
- Fixed `generateBandPath()` to draw curved bottom when circle's lowest point is within map bounds
- Added 20-step interpolation along circle curve for both outer and inner arcs
- Only falls back to straight line when bottom is clipped by map edge

---

## Technical Notes

### Zoom Animation Strategy
The challenge was enabling smooth animations for button clicks while keeping scroll/pinch instant:
- Instant response is critical for scroll wheel (continuous input would feel laggy with transitions)
- Buttons benefit from smooth transitions (discrete clicks, user expects visual feedback)
- Solution: Conditional CSS transition class, managed via React state with cleanup timeout

### Known Issue: Vertex Size at Zoom
Location pins and their labels scale inversely with zoom (they stay the same screen size regardless of zoom level), which works well. However, **political/weather region vertices do NOT scale** - they remain at fixed pixel size in image coordinates. This makes it difficult to work on small details when zoomed in, as the vertices become relatively tiny and hard to grab.

**Suggested fix for future sprint**: Apply similar inverse scaling to vertex markers (the draggable circles on political/weather regions) so they maintain a consistent screen size when zoomed.
