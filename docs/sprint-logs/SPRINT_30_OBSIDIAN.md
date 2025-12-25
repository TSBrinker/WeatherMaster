# Sprint 30 - Obsidian

**Date**: 2024-12-24
**Focus**: Bug fix - Heat wave/cold snap logic

---

## Tasks

### Bug Fix: Winter Heat Wave False Positive
**Issue**: Heat Advisory triggering in February at 44°F with snow on the ground
**Root Cause**: Heat wave logic only checked if temp was 10°F+ above seasonal mean, without requiring actually dangerous temperatures
**Solution**: Add absolute temperature thresholds:
- Heat wave requires temp ≥ 85°F (in addition to being above normal)
- Cold snap requires temp ≤ 25°F (in addition to being below normal)

**Files Modified**:
- `src/v2/services/weather/EnvironmentalConditionsService.js`

---

## Notes

- Flooding currently doesn't factor in rapid snow melt - identified as future enhancement
- The seasonal deviation check is still useful (prevents 85°F alerts in Arizona summer where that's normal), but the absolute threshold prevents absurd alerts like "heat wave" at 44°F

---

## Session Log

- Read START_HERE, HANDOFF, NOTES_FROM_USER
- Reviewed bug screenshot showing Heat Advisory on Feb 8 at 44°F
- Analyzed EnvironmentalConditionsService.js heat wave logic
- Identified fix: absolute temperature thresholds
