# Sprint 37 - Drift

**Date**: 2025-12-27
**Agent**: Drift (Claude Opus 4.5)
**Focus**: Dew Point Profiles for All Biomes

---

## Session Notes

Got up to speed on the project. Tyler pointed me to a branch with a heat index test that was created but not merged - cherry-picked it to main and used it to investigate humidity/heat index issues with the new dew-point-based humidity system.

---

## Tasks Completed

### Cherry-picked Heat Index Test (commit `ddb34d1`)
- Brought in the heat index test harness from `origin/claude/review-sprint-status-jjN2C`
- Test validates the dew point-based humidity system across hot-climate biomes

### Added Dew Point Profiles to All 42 Biomes

The previous implementation had dew point profiles for only 5 biomes (Continental Prairie, Monsoon Coast, Tropical Savanna, Tropical Desert, Temperate Desert). Biomes without profiles used a fallback that produced unrealistic humidity values.

**Problem identified**: Biomes WITH profiles had capped, realistic dew points. Biomes WITHOUT profiles were using `estimateDewPointFromHumidity()` which produced uncapped dew points that tracked with temperature - resulting in unrealistic heat indices.

**Solution**: Added explicit dew point profiles to all biomes with climate-appropriate values.

**Key considerations for each profile**:
- **Cold biomes** (Polar, Subarctic): Very low dew points due to cold air's limited moisture capacity
- **Desert biomes**: Low dew points despite any humidity percentage - dry air
- **Tropical wet biomes** (Equatorial Swamp, Mangrove Coast): High dew points (75-87°F) creating oppressive conditions
- **Maritime biomes**: Ocean-moderated, steady moisture year-round
- **Seasonal biomes**: Variable dew points matching wet/dry seasons
- **Highland biomes**: Elevation reduces dew points despite tropical latitude

**Test Results After Fix**:
| Biome | Feels Like Rate | Max Heat Idx | Notes |
|-------|-----------------|--------------|-------|
| Equatorial Swamp | 100% | 128°F | Correctly oppressive |
| Mangrove Coast | 100% | 128°F | Correctly oppressive |
| Tropical Desert | 0% | 113°F (below temp) | Correct dry heat behavior |
| Rain Shadow | 0% | 109°F (below temp) | Correct dry heat behavior |
| River Valley | 43% | 102°F | Moisture from water sources |
| Mediterranean | 0% | 87°F | Dry summers, comfortable |

### Noted Bugs for Future

1. **Special biomes not showing in location creation modal** - Mountain Microclimate, Geothermal Zone, Convergence Zone, Rain Shadow, Coastal Desert are defined but not appearing in the UI

2. **No CRUD UI for editing** - Can't edit existing locations, continents, or worlds (fix typos, rename, reassign to different continents)

3. **Continent hierarchy note** - Already implemented by Cinder, removed from NOTES_FROM_USER

---

## Files Modified

| File | Changes |
|------|---------|
| `src/v2/data/region-templates.js` | Added dewPointProfile to all 42 biomes |
| `src/v2/components/testing/WeatherTestHarness.jsx` | (cherry-picked) Heat index test |
| `src/v2/components/testing/testConfig.js` | (cherry-picked) Heat index test config |
| `src/v2/components/testing/testRunner.js` | (cherry-picked) Heat index test runner |
| `docs/START_HERE.md` | Added DRIFT to names list |
| `docs/NOTES_FROM_USER.md` | Added new bugs, removed completed continent item |

---

## Status

- **Build**: Passing (hot reload working)
- **Deployed**: No (local testing only)
- **Key Commits**:
  - `4af7038` - Cherry-picked heat index test
  - (pending) - Dew point profiles for all biomes

