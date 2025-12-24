# Sprint 28 - Basalt

**Date**: 2025-12-24
**Focus**: Storm Wind Boost Tuning & Test Harness Improvements

---

## Goals

1. Tune storm wind boost - Onyx's flat 10-20 mph was too aggressive (all storms strong/severe)
2. Fix test harness to provide statistically valid results

---

## Work Log

### Session Start
- Read START_HERE.md, HANDOFF.md, NOTES_FROM_USER.md
- Reviewed Sprint 27 (Onyx) - implemented thunderstorms, blizzards, and storm wind boost
- Tyler flagged test results: ALL thunderstorms now strong/severe, none normal

### Storm Wind Boost - 5d4 Implementation
**Problem:** Flat 10-20 mph boost meant base wind 5-15 + boost = 15-35 mph, almost always exceeding the 25 mph "Strong" threshold.

**Solution:** Changed to 5d4 (D&D style!) for a bell curve distribution:
- Range: 5-20 mph (same as before)
- Average: ~12.5 mph (vs 15 mph flat)
- Bell curve means most storms get moderate boost, extremes are rare

```javascript
// 5d4: sum of 5 rolls of 1-4
let windBoost = 0;
for (let i = 0; i < 5; i++) {
  windBoost += 1 + Math.floor(stormWindRng.next() * 4);
}
```

### Test Harness - Seed Analysis
**Discovery:** The seed generator only uses `regionId:year-month-day:context` - hour is NOT included. This meant:
1. All thunderstorms on the same day got identical wind boost
2. Test results were 100% deterministic/reproducible but potentially unrepresentative

### Test Harness Improvements
1. **Added hour to stormwind seed**: Each hourly thunderstorm now gets its own 5d4 roll
   ```javascript
   generateSeed(region.id, date, `stormwind-${date.hour}`)
   ```

2. **Multi-year testing**: Test now runs across 5 years (configurable) instead of 1
   - Provides 5× the data points for better statistical validity
   - Still fully reproducible (same years = same results)
   - Aggregates results to show "true" distribution

---

## Files Modified

| File | Changes |
|------|---------|
| `WeatherGenerator.js` | 5d4 wind boost, hour in seed |
| `testConfig.js` | `yearsToTest: 5`, split startDate into startMonth/startDay |
| `testRunner.js` | Multi-year loop in runThunderstormAnalysis() |

---

## Outstanding Notes from Tyler

- Polar twilight lands (first 500 miles as magical zone) - needs confirmation if implemented
- New biomes: Humid Subtropical, Steppe

---

## Handoff Notes

**For next agent:**
- Run thunderstorm test to verify 5d4 + multi-year gives good severity distribution
- If distribution still skews too strong, consider raising thresholds (30/45 instead of 25/40)
- Ice storm severity tiers are still pending (data exists in SnowAccumulationService)
- Tornado and Hurricane implementation remain on the extreme weather roadmap
