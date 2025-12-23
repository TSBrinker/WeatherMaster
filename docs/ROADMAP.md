# WeatherMaster Roadmap

**Last Updated**: 2025-12-23 (Sprint 21)

This is the single source of truth for feature planning and priorities.

---

## How to Use This Document

- **Check here** to understand what's been done and what's planned
- **Update task status** as you complete work (change `[ ]` to `[x]`)
- **Add new items** under the appropriate category
- **DO NOT** reorganize categories without Tyler's approval
- **Reference HANDOFF.md** for the current active task

---

## Current Priority: Ground Temperature System

See [HANDOFF.md](HANDOFF.md) for implementation details.

**Goal**: Add thermal inertia so ground temperature lags behind air temperature, preventing unrealistic snow flip-flopping in marginal biomes.

---

## Feature Categories

### 🌪️ Weather Sophistication

**Phase A: Environmental Conditions** - COMPLETE ✅
- [x] Drought Detection & Display *(Sprint 15)*
- [x] Flooding Conditions *(Sprint 15)*
- [x] Heat Waves / Cold Snaps *(Sprint 15)*
- [x] Wildfire Risk *(Sprint 15)*
- [x] UI Integration (badge + modal) *(Sprint 15)*

**Phase B: Snow & Ice Tracking** - COMPLETE ✅
- [x] Snow accumulation (inches on ground, melting rate) *(Sprint 16)*
- [x] Ice accumulation from freezing rain *(Sprint 16)*
- [x] Ground conditions (frozen, thawing, muddy, dry) *(Sprint 16)*
- [x] Visual snow fill effect on PrimaryDisplay *(Sprint 16)*
- [x] Snow toggle preference *(Sprint 16)*
- [x] Test harness integration *(Sprint 16)*

**Phase B.5: Ground Temperature** - IN PROGRESS
- [ ] Ground temperature service with thermal inertia
- [ ] Integration with snow accumulation
- [ ] Biome-specific ground types

**Phase C: Extreme Weather Events** - NOT STARTED
- [ ] Hurricanes/typhoons (tropical regions)
- [ ] Blizzards (heavy snow + high wind)
- [ ] Tornadoes (severe thunderstorm conditions)
- [ ] Ice storms (freezing rain accumulation)

**Phase D: Wind System Enhancements** - NOT STARTED
- [ ] More sophisticated wind patterns
- [ ] Prevailing winds by region/season
- [ ] Wind gusts during storms

---

### 🎮 Gameplay Integration

**D&D Mechanics Surface**
- [ ] Expand weather-effects.js to inline all cross-references
- [ ] Add gameplay impact indicators to main display
- [ ] Visibility/movement/combat modifiers prominently displayed

**Wanderers (Falling Stars)** - *Marai Setting Specific*
- [ ] WandererService for rare celestial events
- [ ] UI integration in CelestialCard
- [ ] DM Forecast shows upcoming Wanderer events
- [ ] Treasure/plot hook generation

---

### 🗺️ Biomes & Templates

**Ocean & Maritime**
- [ ] Open ocean climate templates
- [ ] Sea states (calm, moderate, rough, storm)
- [ ] Sailing-specific conditions

**Biome Coverage Audit**
- [ ] Review all major real-world biomes represented
- [ ] Add missing climate templates
- [ ] Climate terminology glossary

---

### 🎨 UI & User Experience

**Data Management**
- [ ] Export/Import Worlds as JSON
- [ ] Weather seed re-roll feature

**Visual Polish**
- [ ] Fix Feels Like section height shifts
- [ ] Background gradient fade transitions
- [ ] Loading states and transitions
- [ ] Mobile optimization

**Accessibility & Quality**
- [ ] Error handling improvements
- [ ] Accessibility enhancements
- [ ] Theme customization options

---

### 🧪 Test Harness Enhancements

- [ ] Precipitation test: copy-to-clipboard / easier export *(from NOTES_FROM_USER)*
- [ ] Pattern distribution breakdown
- [ ] Precipitation type distribution
- [ ] Filter by latitude band toggle
- [ ] CSV export option
- [ ] Per-table export option
- [ ] Modularize test harness into smaller files
- [ ] Multi-year testing option

---

### 🔮 Stretch Goals

**Interactive Map System**
- [ ] Upload continent map image
- [ ] Climate band visualization overlay
- [ ] Pin placement with auto-suggest biomes

**Spatial Weather System**
- [ ] Adjacent regions system
- [ ] Weather blend factor
- [ ] See [SPATIAL_WEATHER_DESIGN.md](SPATIAL_WEATHER_DESIGN.md)

**Game/World Manager Expansion**
- [ ] Evolve to full world management suite
- [ ] Desktop app (Electron?)
- [ ] Web app for mobile access
- [ ] Sync between platforms

---

## Completed Milestones

| Sprint | Agent | Major Accomplishment |
|--------|-------|---------------------|
| 1-4 | Cedar | Core weather generation, flat disc celestial |
| 5 | Sage | Educational modals |
| 7 | Ash | Test harness, dynamic celestial |
| 8 | Birch | Biome-accurate precipitation |
| 11 | Juniper | Legacy cleanup |
| 15 | Hemlock | Environmental conditions (Phase A) |
| 16 | Alder | Snow & ice accumulation (Phase B) |
| 17-18 | Oak, Pine | Snow visualization polish |
| 19-20 | Opus, Ember | Precipitation analysis, diagnostic work |
| 21 | Sequoia | Documentation cleanup |

See `sprint-logs/` for detailed sprint documentation.

---

*Update this document as you complete work. Keep the category structure intact.*
