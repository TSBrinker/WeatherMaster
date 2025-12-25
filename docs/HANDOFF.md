# Handoff Document

**Last Updated**: 2025-12-25
**Previous Agent**: Marble II (Sprint 33)
**Current Sprint Count**: 33 (next agent creates `SPRINT_34_*.md`)
**Status**: Full-page locations menu + mobile fixes

---

## Where We Left Off

Sprint 33 converted the locations menu from a slide-out panel to a full-page overlay:

### 1. Full-Page Locations Menu (DONE)
**Goal**: Fix scrollability bug + improve UX for region deletion scenarios
**Implementation**:
- Replaced Bootstrap Offcanvas with fixed full-screen overlay
- Back button (chevron) - disabled when no active region
- Dedicated scroll area fixes list scrollability
- FloatingMenuButton hidden when menu is open
- Improved empty state messaging

### 2. Mobile Styling Fixes (DONE)
- Settings trigger (⋯) no longer shows as blue hyperlink
- Temperature display stays on same row as location name (was wrapping)

---

## Suggested Next Tasks

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
- [ ] Preferences menu restructure:
  - Edit Locations
  - Preferences (units, phrasing, snow accumulation, theme)
  - Help & Resources
  - Manage Data (clear cache, nuke, export/import)
- [ ] Edit world name functionality

### Stretch Goals
- [ ] Multiple worlds per user
- [ ] Continent hierarchy for location grouping
- [ ] New biomes: Humid Subtropical, Steppe

---

## Key Files Modified This Sprint

| File | Changes |
|------|---------|
| `src/v2/components/menu/HamburgerMenu.jsx` | Full-page overlay, back button, IoChevronBack |
| `src/v2/components/menu/HamburgerMenu.css` | Complete restyle for full-page layout |
| `src/v2/App.jsx` | Hide FloatingMenuButton when menu open |

---

## Notes Files

- `docs/NOTES_FROM_USER.md` - Tyler's main scratchpad (items still need addressing)
- `docs/USER_NOTES_MOBILE.md` - Mobile testing observations

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
