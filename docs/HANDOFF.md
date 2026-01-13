# Handoff Document

**Last Updated**: 2026-01-12
**Previous Agent**: Frost (Sprint 54)
**Current Sprint Count**: 54 (next agent creates `SPRINT_55_*.md`)
**Status**: Sprint 54 COMPLETE. Both high priority items done.

---

## What Was Done This Sprint (Sprint 54)

### 1. Non-Overlapping Political Region Enforcement (COMPLETE)
Full tessellation system for political territories that share borders.

**Key Features:**
- **Snap-to-vertex**: When drawing, nearby existing vertices glow green. Clicking shares that corner.
- **Snap-to-edge**: When drawing, hovering near existing edges highlights them green. Clicking subdivides the edge and shares that point.
- **Linked vertices via `sharedId`**: Vertices shared between kingdoms are linked. Dragging one moves ALL connected kingdoms.
- **Visual feedback**: Green rings on snappable vertices, green edge highlights, red warning when inside existing region.

**Data Model Change:**
```javascript
// Vertices now have optional sharedId
{ id: "uuid", x: 100, y: 200, sharedId: "shared-uuid" | null }
```

### 2. Mobile Touch Gestures (COMPLETE)
- **Pinch-to-zoom**: Uses `@use-gesture/react` with normalized scale offset
- **Two-finger pan**: Pan during pinch gesture via origin tracking
- **Touch vertex dragging**: Direct `onTouchMove`/`onTouchEnd` handlers on vertex elements
- **CSS**: `touch-action: none` on map container, removed transition for smooth gestures

**Key technical fixes:**
- Added `draggingPoliticalVertexRef` to mirror state (avoids stale closure in gesture callbacks)
- Touch handlers defined AFTER `screenToImageCoords` and `updateVertexPosition` (function ordering matters)
- Larger invisible touch targets (r="20") behind visible vertex markers (r="6")

### 3. Edge Subdivision for Saved Regions
- Click on any edge of a SELECTED political region to insert a new vertex
- Blue highlight with "+" indicator shows insertion point
- Works independently from drawing mode

### 4. Vertex Context Menu (Right-Click)
Right-click on any vertex of a selected political region:
- **Delete Vertex**: Remove vertex (disabled if polygon has only 3 vertices)
- **Link to Nearby Vertex**: Shows nearby vertices from other regions within 30px

### 5. Developer Experience
- Added build version display in Settings menu (hamburger > Settings section)
- Shows git commit hash + build date
- Injected via Vite's `define` config at build time

---

## Key Files Reference

| Feature | Key File |
|---------|----------|
| Region utilities | `src/v2/utils/regionUtils.js` |
| Path utilities | `src/v2/utils/pathUtils.js` |
| Unified tools panel | `src/v2/components/map/MapToolsPanel.jsx` |
| Map view | `src/v2/components/map/WorldMapView.jsx` |
| World data | `src/v2/contexts/WorldContext.jsx` |
| Vite config (version inject) | `vite.config.js` |

---

## Architecture Notes

### Region Data Structure
```javascript
{
  id: string,
  name: string,
  vertices: [{ id, x, y, sharedId }],  // sharedId links vertices across regions
  color: string (hex),
  isVisible: boolean,
  perimeterMiles: number,
  areaSquareMiles: number
}
```
Stored in `continent.weatherRegions[]` and `continent.politicalRegions[]`

### WorldContext Region Methods
Weather: `createWeatherRegion`, `updateWeatherRegion`, `deleteWeatherRegion`, `addWeatherRegionVertex`, `updateWeatherRegionVertex`, `deleteWeatherRegionVertex`

Political: Same pattern with `Political` prefix, PLUS:
- `insertPoliticalRegionVertex(continentId, regionId, vertex, insertAfterIndex)` - for edge subdivision
- `updateLinkedPoliticalVertices(continentId, sharedId, { x, y })` - moves all linked vertices
- `setPoliticalVertexSharedId(continentId, regionId, vertexId, sharedId)` - link vertices after creation

### Linked Vertex System
- Vertices with same `sharedId` are linked across all political regions
- When dragging a linked vertex, `updateLinkedPoliticalVertices` updates all matching vertices
- Use `findLinkedVertices(sharedId, politicalRegions)` to find all vertices with a given sharedId

### Mobile Touch Gesture Pattern
```javascript
// State + ref mirror for gesture callbacks
const [draggingPoliticalVertex, setDraggingPoliticalVertex] = useState(null);
const draggingPoliticalVertexRef = useRef(null);

// On touch start, set both
const dragInfo = { regionId, vertexId: vertex.id, vertex };
setDraggingPoliticalVertex(dragInfo);
draggingPoliticalVertexRef.current = dragInfo;

// In gesture/touch handlers, read from ref (not state)
if (draggingPoliticalVertexRef.current) { ... }
```

### Drawing Mode State
```javascript
drawingMode: 'none' | 'path' | 'weatherRegion' | 'politicalRegion'
```

---

## Future Ideas

- **Coastline snapping**: Upload a PNG with transparent oceans, use alpha channel to detect and snap to coastlines

---

## Remaining Items

1. Exact sunrise/sunset from pin Y position
2. Coastline snapping (future enhancement)

---

*This document should be overwritten by each agent during handoff with current status.*
