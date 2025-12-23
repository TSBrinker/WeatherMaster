# Handoff Document

**Last Updated**: 2025-12-23
**Previous Agent**: Sequoia (Sprint 21)
**Current Sprint Count**: 21 (next agent creates `SPRINT_22_*.md`)
**Status**: Documentation cleanup complete; Ground Temperature implementation ready

---

## Where We Left Off

Sprint 21 focused on **documentation cleanup and workflow streamlining**:

1. **Created new documentation structure**:
   - `START_HERE.md` - Single entry point for new agents
   - `WORKING_WITH_TYLER.md` - Evergreen preferences and decisions
   - `archive/` folder for historical docs

2. **Archived bloated/stale documents**:
   - `PROGRESS.md` → `archive/` (1000+ lines, duplicated sprint logs)
   - `AI_INSTRUCTIONS.md` → `archive/` (658 lines, half was session logs)
   - `QUESTIONS_FOR_USER.md` → `archive/` (historical decisions)

3. **Did NOT implement ground temperature** - that's ready for you!

---

## Ready Task: Ground Temperature System

### The Problem

Precipitation type is evaluated hourly based on **instantaneous air temperature**. In marginal biomes (winter mean 20-32°F), this causes rapid flip-flopping between snow and rain, leading to unrealistic mid-winter snow melt.

### The Solution

Add ground temperature as a rolling average of air temperature, weighted by ground type (thermal inertia).

**Ground Types:**

| Ground Type | Thermal Inertia | Lag Hours | Use Case |
|-------------|-----------------|-----------|----------|
| rock | 0.95 | ~48-72 | Mountains, highlands |
| soil | 0.85 | ~24-36 | Most temperate biomes |
| sand | 0.70 | ~12-18 | Deserts |
| clay | 0.90 | ~36-48 | River valleys, wetlands |
| peat | 0.85 | ~24-36 | Muskeg, bogs |
| permafrost | 0.98 | ~72+ | Polar regions |

**Implementation Steps:**

1. Add `groundType` to biome templates in `src/v2/data/region-templates.js`
2. Create `src/v2/services/weather/GroundTemperatureService.js`:
   - Look back N hours based on thermal inertia
   - Calculate weighted average of air temperatures
   - Return ground temperature
3. Modify `src/v2/services/weather/SnowAccumulationService.js`:
   - Use ground temp for snow accumulation (ground must be ≤ 33°F)
   - Use ground temp for melt rate calculation

### Test Data

Baseline in `docs/testing-results/precip-summary-1.json`

**Targets:**
- Continental Prairie: < 10 precip type changes (was 24), < 5 rain-on-snow (was 16)
- Convergence Zone: < 20 type changes (was 72), < 10 rain-on-snow (was 23)
- Biomes with complete mid-winter melt: 0 (was 2)

---

## Current System State

| Component | Status |
|-----------|--------|
| Primary Display | STABLE |
| Test Harness | ENHANCED (precipitation analysis added) |
| Phase A (Environmental Conditions) | COMPLETE |
| Phase B (Snow & Ice Accumulation) | NEEDS GROUND TEMP |

---

## Git State

- **Branch**: main (all work committed and pushed)
- **Latest commit**: Sprint 21 documentation cleanup

---

## NOTES_FROM_USER.md Item

There's one pending item from Tyler:
> "this new test should also have a button to export the data from that test specifically. maybe even a 'copy to clipboard' so I can get it into a doc here more easily"

This refers to the precipitation analysis test - adding easier export options.

---

*This document should be overwritten by each agent during handoff with current status.*
