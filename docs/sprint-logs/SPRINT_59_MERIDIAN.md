# Sprint 59 - MERIDIAN

**Date**: 2026-01-12
**Focus**: Precipitation type momentum/hysteresis system

---

## Session Log

### Onboarding
- Read START_HERE.md, HANDOFF.md, NOTES_FROM_USER.md
- Selected name: MERIDIAN
- Created sprint log
- Reviewed WeatherGenerator.js type persistence implementation from Sprint 58

### Task: Analyze Precipitation Type Data

Tyler provided precipitation type analysis results to validate Sprint 58's type persistence implementation.

**Key Findings:**
- Direct snow↔rain transitions nearly eliminated (only 2 out of 1,625 total) ✓
- Type persistence averaging 14.1 hours ✓
- BUT: 12 biomes showed excessive cycling (3-6+ changes per event)
- Worst offenders: Convergence Zone (6.35 changes/event), Subarctic Waters (5.93)

**Root Cause:**
The previous ±3°F stability buffer and 6-hour lookback weren't enough for biomes where winter temps oscillate around 28-38°F. Temperature naturally fluctuates 12-15°F between night and day, repeatedly crossing the transition thresholds during multi-day precipitation events.

### Implementation: Type Momentum/Hysteresis System

Tyler requested the most realistic approach (Option C). Implemented a momentum-based system where established precipitation types have "inertia" and require sustained temperature trends to change.

**New/Modified Methods in WeatherGenerator.js:**

1. **`getPreviousHourDate(date)`** - Helper to navigate dates backwards

2. **`getRecentPrecipitationTrend(region, date)`** - Extended from 6 to 12 hour lookback
   - Now returns: `{ dominantType, streakLength, avgTemp, tempTrend, trendStrength, consecutiveTrendHours }`
   - `tempTrend`: 'warming', 'cooling', or 'stable'
   - `consecutiveTrendHours`: how many hours temp has moved consistently in one direction

3. **`calculateTemperatureTrend(temps)`** - New method to analyze temperature direction
   - Compares recent 3-hour avg vs older 3-hour avg for overall trend
   - Counts consecutive hours of consistent movement (>1°F change)
   - Requires 3°F overall change to call it a trend

4. **`determineTypeWithMomentum(temperature, trend, seed)`** - New core logic
   - Hard boundaries: ≤22°F always snow, ≥45°F always rain
   - **Snow momentum**: Persists until sustained warming (3+ hours) AND temp ≥34°F
   - **Rain momentum**: Persists until sustained cooling (3+ hours) AND temp ≤32°F
   - **Sleet buffer**: Requires sustained trend AND clear temperature threshold to exit
   - Fresh precipitation uses temperature zones with slight overlap

**Key Design Decisions:**
- Widened hard freeze boundary from 25°F to 22°F
- Widened rain boundary from 42°F to 45°F
- Sleet exit thresholds: ≤28°F for snow, ≥38°F for rain
- 3+ consecutive hours required for "sustained trend"
- Snow momentum allows temps up to 36°F without transitioning
- Rain momentum allows temps down to 30°F without transitioning

---

## Changes Made

| File | Changes |
|------|---------|
| `src/v2/services/weather/WeatherGenerator.js` | Added `getPreviousHourDate()`, `calculateTemperatureTrend()`, `determineTypeWithMomentum()`. Refactored `getRecentPrecipitationTrend()` for 12-hour lookback with trend detection. Refactored `generatePrecipitation()` to use momentum system. |

---

## Testing

- Build passes successfully
- Implementation complete, ready for validation with Type Analysis test

---

## Expected Impact

The momentum system should:
1. Significantly reduce changes/event in transition zone biomes
2. Increase average type persistence beyond 14.1 hours
3. Maintain sleet as transition state (no direct snow↔rain)
4. Still allow legitimate type changes when there's a real temperature trend

**Biomes most likely to improve:**
- Convergence Zone (30°F mean) - temperature oscillates in heart of transition zone
- Subarctic Waters (32°F mean) - right at freezing point
- Northern Seas (36°F mean) - slightly above, but fluctuates below

---

## Notes for Next Agent

1. **Run the Precipitation Type Analysis test** to validate the momentum system
2. Compare new results against Tyler's baseline data from this sprint
3. If cycling is still high in specific biomes, the thresholds can be tuned:
   - `consecutiveTrendHours >= 3` could be increased to 4-5
   - Momentum temperature bounds (36°F for snow, 30°F for rain) could be widened
4. The sleet exit thresholds (28°F/38°F) may need adjustment based on results
