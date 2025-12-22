# Spatial Weather System Design

**Status**: Stretch Goal (Future Enhancement)
**Created**: 2025-12-22
**Discussion**: Tyler requested spatial relationships between regions

---

## Overview

Add optional spatial relationships between regions to create more realistic weather propagation. Regions can declare adjacent neighbors, and weather will blend between them for more cohesive world-building.

## Design Goals

1. **Optional**: Regions work independently by default (backward compatible)
2. **Simple**: Easy to declare neighbors without complex coordinate systems
3. **Deterministic**: Weather remains reproducible (same inputs = same outputs)
4. **Visual**: Intuitive UI for declaring spatial relationships

---

## UI Design

### Region Creator: Neighbor Declaration UI

```
┌─────────────────────────────────────────┐
│  Adjacent Regions (Optional)            │
│                                         │
│  ┌───────┬───────┬───────┐             │
│  │  NW   │   N   │  NE   │             │
│  │ [Add] │ [Add] │ [Add] │             │
│  ├───────┼───────┼───────┤             │
│  │   W   │ THIS  │   E   │             │
│  │ [Add] │REGION │ [Add] │             │
│  ├───────┼───────┼───────┤             │
│  │  SW   │   S   │  SE   │             │
│  │ [Add] │ [Add] │ [Add] │             │
│  └───────┴───────┴───────┘             │
│                                         │
│  Weather Blend Factor: [█████─────] 50% │
│  (How much neighbors influence weather) │
└─────────────────────────────────────────┘
```

**Interaction**:
- Click [Add] button to open dropdown of existing regions
- Selected region appears as badge/chip with X to remove
- 3x3 grid with current region in center
- 8 directional slots (N, NE, E, SE, S, SW, W, NW)
- Slider for blend factor (0% = independent, 100% = fully blended)

---

## Technical Implementation

### Data Model Changes

**Region Object** (add optional fields):
```javascript
{
  id: "region-123",
  name: "Elderwood Forest",
  // ... existing fields ...

  // NEW: Spatial relationship fields
  adjacentRegions: {
    north: "region-456",      // Optional region IDs
    northeast: "region-789",
    east: null,               // null = no neighbor
    southeast: null,
    south: "region-012",
    southwest: null,
    west: null,
    northwest: null
  },
  weatherBlendFactor: 0.3     // 0-1, how much neighbors influence (default 0.3)
}
```

### Weather Generation Algorithm

**Current** (independent):
```javascript
function generateWeather(region, date, hour) {
  const seed = hash(region.id + date + hour);
  return calculateWeather(seed, region.climate);
}
```

**New** (with spatial blending):
```javascript
function generateWeather(region, date, hour, allRegions) {
  // Step 1: Generate base weather for this region
  const baseWeather = this.generateBaseWeather(region, date, hour);

  // Step 2: If no neighbors, return base weather
  if (!hasAdjacentRegions(region) || region.weatherBlendFactor === 0) {
    return baseWeather;
  }

  // Step 3: Generate weather for all neighbors
  const neighborWeather = Object.values(region.adjacentRegions)
    .filter(id => id !== null)
    .map(id => {
      const neighbor = allRegions.find(r => r.id === id);
      return this.generateBaseWeather(neighbor, date, hour);
    });

  // Step 4: Blend base weather with neighbor average
  return this.blendWeather(baseWeather, neighborWeather, region.weatherBlendFactor);
}

function blendWeather(base, neighbors, factor) {
  if (!neighbors.length) return base;

  // Calculate neighbor averages
  const avgTemp = neighbors.reduce((sum, w) => sum + w.temperature, 0) / neighbors.length;
  const avgPressure = neighbors.reduce((sum, w) => sum + w.pressure, 0) / neighbors.length;
  const avgHumidity = neighbors.reduce((sum, w) => sum + w.humidity, 0) / neighbors.length;
  const avgCloudCover = neighbors.reduce((sum, w) => sum + w.cloudCover, 0) / neighbors.length;

  // Blend base with neighbor average (weighted by factor)
  return {
    ...base,
    temperature: base.temperature * (1 - factor) + avgTemp * factor,
    pressure: base.pressure * (1 - factor) + avgPressure * factor,
    humidity: base.humidity * (1 - factor) + avgHumidity * factor,
    cloudCover: base.cloudCover * (1 - factor) + avgCloudCover * factor,

    // Don't blend pattern or precipitation directly
    // (let weather generator determine based on blended conditions)
  };
}
```

---

## Implementation Plan

### Phase 1: Data Model & Storage
- [ ] Add `adjacentRegions` and `weatherBlendFactor` to region type definition
- [ ] Update localStorage schema (maintain backward compatibility)
- [ ] Add migration for existing regions (set adjacentRegions to empty)

### Phase 2: UI Components
- [ ] Create `AdjacentRegionsSelector` component
  - 3x3 grid layout
  - Dropdown selector for each direction
  - Badge/chip display for selected regions
  - Remove button for clearing selections
- [ ] Create `BlendFactorSlider` component
  - 0-100% slider
  - Visual preview of blend strength
  - Description text explaining effect
- [ ] Integrate into `RegionCreator` component
- [ ] Add to region edit modal

### Phase 3: Weather Generation
- [ ] Update `WeatherGenerator.js` to accept `allRegions` parameter
- [ ] Implement `blendWeather()` function
- [ ] Modify `WeatherService.js` to pass all regions when generating weather
- [ ] Add debug output showing neighbor influence

### Phase 4: Testing & Polish
- [ ] Test with 2 adjacent regions
- [ ] Test with 8 adjacent regions (surrounded)
- [ ] Test blend factor extremes (0% and 100%)
- [ ] Verify determinism (same date = same weather)
- [ ] Performance testing (ensure no significant slowdown)

---

## Example Use Cases

### Coastal → Inland Transition
```
Ocean Region (Maritime)  →  Coastal Forest  →  Mountain Range
- High humidity              - Medium humidity  - Low humidity
- Moderate temps             - Moderate temps   - Cold temps
- Frequent fog               - Occasional fog   - Clear/snow
```

With 30% blend factor:
- Coastal Forest gets some ocean humidity/fog
- Mountain Range gets slight moderation from coastal weather

### Mountain Rain Shadow
```
Windward Side (wet)  →  Mountain Peak  →  Leeward Side (dry)
- Heavy precipitation    - Snow/ice        - Desert conditions
- High humidity          - Cold            - Low humidity
```

With spatial relationships, the leeward desert naturally stays dry while the windward side gets consistent rain.

### Continental Weather Patterns
```
       Northern Tundra
              ↓
    Temperate Grassland  →  Coastal Port
              ↓
       Southern Desert
```

Weather fronts naturally propagate through connected regions, creating realistic continental climate zones.

---

## Benefits

1. **Realistic Transitions**: Coastal regions affect inland weather
2. **Weather Fronts**: Cold air from mountains flows to valleys
3. **Maritime Influence**: Oceans moderate nearby land temperatures
4. **Storm Tracking**: Rain in one region can influence neighbors
5. **World Coherence**: Connected regions feel like a cohesive world

---

## Technical Considerations

### Performance
- **Before**: O(1) - Each region generates independently
- **After**: O(n) where n = number of neighbors (max 8)
- Impact: Minimal (8 extra weather calculations worst case)

### Determinism
- Weather remains deterministic
- Same region + neighbors + date = same weather
- Adding/removing neighbors changes weather (expected behavior)

### Circular Dependencies
- Region A references B, B references A = OK
- Blend happens in one pass (uses base weather, not already-blended)
- No infinite loops possible

### Backward Compatibility
- Existing regions with no neighbors: unchanged behavior
- `adjacentRegions` defaults to empty object
- `weatherBlendFactor` defaults to 0 (no blending)

---

## Future Enhancements (Beyond Stretch Goal)

### Phase 2: Directional Influence
- Weight neighbors by direction of prevailing winds
- Eastern neighbors have more influence (westerly winds)
- Seasonal wind direction changes

### Phase 3: Coordinate System
- Upgrade from adjacency to actual X/Y coordinates
- Calculate influence based on distance
- Enable map visualization

### Phase 4: Weather Front Propagation
- Time-based weather movement across regions
- Cold fronts, warm fronts travel naturally
- Storm systems track across world

---

## Estimated Effort

**Stretch Goal (Basic Implementation)**: 4-6 hours
- Data model: 30 minutes
- UI component: 2 hours
- Weather blending: 1.5 hours
- Testing & polish: 1 hour

**Full Feature (with polish)**: 1-2 days
- Above + comprehensive testing
- Documentation
- Example regions
- Tutorial/help system

---

## Acceptance Criteria

- [ ] UI allows selecting up to 8 adjacent regions (3x3 grid)
- [ ] Blend factor slider (0-100%) controls neighbor influence
- [ ] Weather blends smoothly between adjacent regions
- [ ] Performance impact < 50ms for max neighbors
- [ ] Deterministic behavior verified
- [ ] Backward compatible (existing regions unaffected)
- [ ] Export/import preserves spatial relationships
- [ ] Debug panel shows neighbor influence calculations

---

## Notes

- This is a **stretch goal** - nice to have, not critical path
- Implement **after** core features (Export/Import, precipitation tuning, etc.)
- Can be added to Sprint 11 or later
- Fits well with Sprint 6 (Enhanced Wind & Weather Systems)
- Tyler's vision: "3x3 grid with new region in center, 8 surrounding buttons"
