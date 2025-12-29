# WeatherMaster Roadmap

**Last Updated**: 2025-12-27 (Sprint 38)

This is the single source of truth for feature planning and priorities.

---

## How to Use This Document

- **Check here** to understand what's been done and what's planned
- **Update task status** as you complete work (change `[ ]` to `[x]`)
- **Mark in-progress items** with `[~]` when you start working on something
- **Add new items** under the appropriate category
- **DO NOT** reorganize categories without Tyler's approval
- **Reference HANDOFF.md** for the current active task

---

## 🚀 MVP Sprint Plan (SINGLE SOURCE OF TRUTH)

**This is the execution order. Work items top-to-bottom. When Tyler greenlights an item as complete, move to the next. Other notes/bugs are lower priority unless Tyler explicitly elevates them.**

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | **Investigate cloud % midnight transitions** | `[x]` | FIXED: Added smooth hourly cloud transitions |
| 2 | **CRUD UI for editing** | `[ ]` | Edit locations, continents, worlds (rename, reassign, fix typos) |
| 3 | **Special biomes in location modal** | `[ ]` | 5 biomes defined but not appearing in UI |
| 4 | **Time control improvements** | `[ ]` | Day jump buttons (<<< / >>>), larger hitboxes |
| 5 | **Layout stability fixes** | `[ ]` | Time display width, Feels Like section shifts |
| 6 | **Hamburger menu centering** | `[ ]` | Icon slightly off-center vertically |

### Post-MVP / Future
- New biomes (Humid Subtropical, Steppe)
- Menu/preferences restructuring
- Multiple worlds per user
- Dedicated create location modal
- Polar twilight lands verification

---

## Previous Priority: Extreme Weather Events

**Goal**: Implement extreme weather events (hurricanes, blizzards, tornadoes, ice storms) using the preserved special factors in region templates.

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

**Phase B.5: Ground Temperature** - COMPLETE ✅
- [x] Ground temperature service with thermal inertia *(Sprint 22)*
- [x] Integration with snow accumulation *(Sprint 22)*
- [x] Biome-specific ground types *(Sprint 22)*
- [x] Ground type melt rate modifiers (Denver effect) *(Sprint 26)*

**Phase C: Extreme Weather Events** - NOT STARTED
- [ ] Hurricanes/typhoons (tropical regions)
- [x] Blizzards (heavy snow + high wind)
- [x] Tornadoes (severe thunderstorm conditions)
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

**Firebase Backend Integration**
- [ ] Cloud storage for worlds/regions (replaces localStorage)
- [ ] User authentication (Google sign-in)
- [ ] Multi-device sync (phone/tablet/laptop)
- [ ] *Why*: Enables future campaign features (calendar events, session notes, festival markers) that accumulate value over time and shouldn't live only in browser storage

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
