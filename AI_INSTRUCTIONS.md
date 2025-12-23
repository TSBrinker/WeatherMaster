# AI Agent Instructions for WeatherMaster v2

**Last Updated**: 2025-12-21 (Sprint 5 - Sage)

---

## Instructions for Future AI Agents

### Getting Started

When you're asked to continue work on WeatherMaster v2, follow these steps:

1. **Read PROGRESS.md** - This is the master document tracking all completed work and architectural decisions
2. **Read QUESTIONS_FOR_USER.md** - Contains all architectural decisions and implementation strategy
3. **Read docs/NOTES_FROM_USER.md** - Tyler's running list of bugs, features, and thoughts (process these!)
4. **Review recent sprint logs** in `docs/sprint-logs/` - Understand what the previous agents accomplished
5. **Pick a sprint name** - Choose a name that represents your work. This was originally presented as "whatever name you choose, though a fantasy Lord of the Rings/D&D style name would be thematic." At the time of writing this, all agents have chosen the names of trees (Elderwood, Willow, Cedar, Sage). Feel free to break or continue tradition. Once you've read all of these instructions, feel free to introduce yourself with your chosen name!
6. **Create your own sprint log** - Name it `SPRINT_[NUMBER]_[NAME].md` where [NAME] is the name you gave yourself
7. **Document your work** as you go - Update your sprint log with files created, bugs fixed, features added
8. **Update PROGRESS.md** when you complete major milestones
9. **Commit regularly** with proper attribution (see commit message format below)
10. **Update this file** with anything you learned about Tyler or the project that future agents should know

### NOTES_FROM_USER.md Workflow

**IMPORTANT**: Tyler uses `docs/NOTES_FROM_USER.md` as a running scratchpad for thoughts while you're working.

When you start a session:
1. Read NOTES_FROM_USER.md first
2. Acknowledge each item with Tyler
3. Sort items into appropriate places:
   - **Bugs**: Add to roadmap or create bug tracking doc
   - **Features**: Add to roadmap under appropriate sprint
   - **Questions**: Ask Tyler for clarification
   - **Improvements**: Note in sprint log or roadmap
4. Once processed and acknowledged, items can be cleared from NOTES_FROM_USER.md
5. Never ignore or skip this file - it's Tyler's way of communicating without interrupting your workflow

### README.md Update Workflow

**IMPORTANT**: Keep README.md current as features are confirmed working.

When to update README.md:
1. **After completing a sprint** - Update "Completed Sprints" and "Current Status" sections
2. **When features are confirmed working** - Add to "Completed Features" checklist
3. **When roadmap changes** - Update "Upcoming Sprints" section
4. **When major architectural changes occur** - Update "How It Works" or "Technical Details"

What to update:
- **Version number** and **Last Updated** date at top
- **Completed Features** checklist - mark new features as ✅
- **Completed Sprints** list - add finished sprint with name
- **Upcoming Sprints** - adjust if priorities change
- **Credits** section - add your sprint agent name
- Keep it current, accurate, and reflective of actual working features

### Commit Message Format

```
Brief description of change

- Detailed point 1
- Detailed point 2

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Working with Tyler

**IMPORTANT PREFERENCES:**

1. **Only commit when prompted** - Tyler will explicitly ask you to commit. Don't auto-commit after every change.

2. **Explain your reasoning** - Tyler appreciates understanding the "why" behind technical decisions. If you're making meteorological calculations, explain the real-world basis.

3. **Keep it practical** - This is a D&D weather system, not a scientific weather station. Prioritize gameplay value over perfect simulation accuracy. Tyler has said: "I'm not a meteorologist, I just want to simulate realistic weather so my players can play in a living world."

4. **Use relative humidity** - We display relative humidity (RH%) which is what users understand, not absolute humidity (g/m³). RH is what matters for gameplay and weather effects.

5. **Avoid over-engineering** - Don't add features beyond what's requested. Tyler prefers focused, clean implementations.

6. **Document for handoff** - Tyler expects the project to be handed off between AI agents. Write clear documentation and sprint logs.

7. **Use the TodoWrite tool** - Track your tasks actively. Tyler appreciates visibility into progress.

8. **Ask questions** - If something is ambiguous, use AskUserQuestion. Tyler is collaborative and wants to be involved in decisions.

---

## Sprint Philosophy

Each sprint should be named after a tree or plant that represents its character:
- **Elderwood** (Sprint 2) - Ancient and wise, for the major UI redesign
- **Willow** (Sprint 3) - Clear and visible, for legibility improvements
- **Cedar** (Sprint 4) - Strong and resilient, for atmospheric depth foundations

Choose names that reflect the nature of your work!
(This was written by one of your predecessors- as previously mentioned, early iterations chose tree names. Stick to my previous guidelines on naming [I can't do a smiley emoji but insert smiley emoji here])
---

## Project Context

### What is WeatherMaster v2?

A D&D weather generation system featuring:
- **Deterministic weather** using seed-based randomness (same date = same weather)
- **Flat disc world model** with custom celestial mechanics
- **iOS Weather-inspired UI** with massive typography and dynamic gradients
- **Real-world climate accuracy** across 30+ biome templates
- **Temporal continuity** with 3-5 day weather patterns

### Key Design Principles

1. **Simplicity over complexity** - Only add features that enhance gameplay
2. **Realism with pragmatism** - Accurate weather without overwhelming simulation
3. **Deterministic behavior** - Same inputs = same outputs (no surprises)
4. **Performance first** - Cache aggressively, calculate efficiently
5. **Clear documentation** - Every decision explained, every formula sourced

### Current Architecture

```
src/v2/
├── services/
│   ├── celestial/          # Flat disc sun/moon calculations
│   └── weather/            # Temperature, patterns, precipitation, atmospheric
├── components/
│   ├── weather/            # PrimaryDisplay, ConditionsCard, CelestialCard, Forecasts
│   ├── header/             # WeatherHeader with time controls
│   └── menu/               # HamburgerMenu, SettingsMenu
├── contexts/               # WorldContext, PreferencesContext
└── data/                   # 30+ region templates
```

---

## Technical Notes for Future Agents

### Weather Generation Flow

1. **Pattern Service** determines current weather pattern (3-5 day cycles)
2. **Atmospheric Service** calculates pressure, cloud cover, enhanced humidity
3. **Temperature Service** generates base temperature with seasonal/daily variation
4. **Weather Generator** coordinates all services and determines final conditions
5. **Weather Service** exposes weather + celestial data to components

### Caching Strategy

- All services implement independent caching
- Cache keys include region ID, date, and hour
- Call `clearCache()` when switching regions
- Deterministic seed ensures reproducible results

### Important Files

- **PROGRESS.md** - Master progress tracker (update regularly!)
- **QUESTIONS_FOR_USER.md** - Architectural decisions
- **FLAT_DISC_WORLD.md** - Celestial mechanics specification
- **AI_INSTRUCTIONS.md** - This file (update with learnings!)

### Testing Approach

- Manual testing in browser (no automated tests yet)
- Focus on edge cases (disc center, rim, season transitions)
- Verify deterministic behavior (same date = same weather)
- Check performance (forecast generation should be <200ms)

---

## Notes About Tyler

*(This section should be updated by AI agents as they learn about Tyler's preferences, communication style, and project goals)*

### Session 1 - Sprint 4 (Cedar) - 2025-12-21

**Preferences Discovered:**
- Values understanding the "why" behind implementations (e.g., asked about 97% humidity during sleet)
- Appreciates when AI explains meteorological concepts in accessible terms
- Comfortable with technical depth but prioritizes gameplay value over scientific precision
- Likes to validate calculations against real-world examples
- Prefers to defer commits until asked explicitly

**Project Goals:**
- Building this primarily for his own flat disc D&D setting
- Wants future-proof architecture (considered round earth support for later)
- Plans to add educational modals to help users understand weather mechanics
- Wants to surface existing D&D gameplay mechanics from original implementation (in `src/` folder)

**Communication Style:**
- Direct and collaborative
- Asks clarifying questions when unsure
- Appreciates when AI doesn't just confirm his beliefs but provides objective analysis
- Values concise, focused responses
- Comfortable with technical jargon but appreciates explanations

**Feature Requests for Future Sprints:**
1. Weather Primer Modal - Explain atmospheric conditions (pressure, fronts, humidity, etc.)
   - What high/low/neutral values mean
   - Definitions of weather patterns
   - How conditions interact

2. Gameplay Mechanics Modal - D&D mechanical impacts
   - Reference existing weather effects from original implementation (src folder)
   - Show mechanical impacts (visibility, movement, combat)
   - Use existing definitions

3. Educational/tutorial system for first-time users

**Technical Preferences:**
- Prefers modular, well-documented code
- Values comprehensive sprint documentation
- Likes to see progress tracked with TodoWrite
- Appreciates build validation and testing
- Wants future agents to have full context

### Session 2 - Sprint 5 (Sage) - 2025-12-21

**Preferences Discovered:**
- Uses NOTES_FROM_USER.md as a scratchpad for thoughts during development
- Appreciates being told about dependencies needed for new workstations
- Wants repo up to date before workstation migration
- Values searchable/filterable interfaces for complex data
- Likes when cross-references are resolved inline (doesn't like "As per Heavy Rain" style references)

**Feature Requests:**
1. **Expand weather-effects.js** - Remove cross-references, make each condition self-contained
2. **Surface gameplay mechanics on main display** - Badge/indicator when conditions have mechanical impacts, with quick link to modal
3. **UI consistency fixes from NOTES_FROM_USER.md**:
   - Clear skies icon should show moon during nighttime hours
   - Standardize ConditionsCard box heights (precipitation box is shorter than others)
4. **Code cleanup sprint** - Review and archive old large files to help conversation memory last longer

**Project Status Understanding:**
- Tyler is migrating workstations - wants smooth pickup
- Project is becoming more specialized for his Marai setting (flat disc world)
- Wanderers (falling stars) are significant lore events in his world

**Communication Style:**
- Gives positive feedback when impressed ("Inspired. Well done!")
- Apologizes for data quality issues from past work
- Collaborative approach to planning future work
- Explicit about memory constraints and handoff needs

**Technical Notes:**
- Lucide-react icons work well alongside react-icons/wi
- React Bootstrap Modal is the pattern for overlays
- Accordion interfaces work well for organizing complex reference data
- Dark theme requires specific styling for modals (filter: invert(1) for close buttons)

### Session 3 - Sprint 7 (Ash) - 2025-12-22

**Preferences Discovered:**
- Values pressure testing and validation tools
- Appreciates comprehensive testing coverage (full year, all biomes)
- Likes browser-based tools over command-line scripts
- Wants to verify system is working correctly before continuing development

**Features Implemented:**
1. **Settings menu state persistence fix** - Settings collapse when menu closes
2. **Dynamic celestial-based day/night transitions** - Icons/gradients use in-game time
3. **Golden hour feature** - Warm gradients during sunrise/sunset hours
4. **ConditionsCard box height standardization** - All boxes same height
5. **Comprehensive weather test harness** - Browser-based, tests 43,800+ data points

**Technical Achievements:**
- Created `parseTimeToHour()` helper to extract hour from "5:42 AM" format
- Dynamic sunrise/sunset detection from celestial data
- Test harness accessible via `?test=true` URL parameter
- Real-time progress tracking in browser
- Export test results as JSON

**Communication Style:**
- Positive feedback on successful implementations ("Remarkably done")
- Direct requests for features ("Let's hit those other two Quick Wins")
- Trusts implementation details, verifies results
- Appreciates when things work correctly first time

**Project Insight:**
- Test harness was "HUGELY HELPFUL" for verification
- Tyler uses testing to validate system integrity before moving forward
- Values tools that provide confidence in the codebase

### Session 4 - Sprint 8 (Birch) Session 2 - 2025-12-22

**Issue Discovered:**
- Tyler found unrealistic temperature jump: 44°F → 25°F (19°F drop) in 1 hour at midnight
- Temperate Highland, Nov 1-2 transition
- Light Rain → Heavy Snow abruptly

**Preferences Discovered:**
- Reports specific anomalies with exact data (date, time, temp, conditions)
- Wants to understand root causes ("Unless that IS realistic and I'm mistaken. Your thoughts?")
- Appreciates when asked to provide diagnostic data (pattern names, debug values)
- Proactive about testing ("Any way to add a test for this issue to the test harness?")
- Values prevention of future regressions through automated testing

**Diagnostic Process:**
1. Tyler provided temperature sequence data when requested
2. Checked debug panel for pattern influence values
3. Confirmed pattern names (both "Low Pressure")
4. Identified jump in pattern influence: +9.3°F → -10.2°F

**Features Implemented:**
1. **6-hour block temperature smoothing** - Eliminated midnight discontinuities
2. **Pattern temperature modifier transitions** - 12-hour fade in/out at pattern boundaries
3. **Precipitation transition zone** - 32-38°F sleet zone for smooth rain↔snow transitions
4. **Clear Weather Cache button** - Developer tool in settings menu
5. **Temperature transition anomaly detection** - Test harness regression prevention

**Technical Achievements:**
- Root cause: Day-based smoothing changed both "today" and "yesterday" values at midnight
- Solution: 6-hour blocks with hourly interpolation between blocks
- No midnight discontinuity - always blending with adjacent block
- Realistic cold front passage: 5-6°F/hour gradual cooling
- Test harness now catches unrealistic transitions (15°F/hour threshold)

**Communication Style:**
- Clear bug reports with exact data
- Collaborative problem-solving ("Let's add a test for this")
- Appreciates thorough explanations of root causes
- Confirms fixes work before moving on ("Ah, a difference!")
- Requests comprehensive documentation for handoff

**Project Insight:**
- Tyler values regression testing and automated validation
- Prefers fixing root causes over band-aids
- Appreciates when AI explains meteorological realism
- Wants test harness to catch similar issues in future
- Plans for project handoff to future agents

### Session 5 - Sprint 9 (Maple) - 2025-12-22

**Preferences Discovered:**
- Has keen eye for visual details (noticed humidity box height difference, text contrast issues)
- Provides detailed UI/UX feedback lists organized by category
- Values immediate visual fixes ("Let's hit the quick wins")
- Trusts agent judgment ("I trust your judgment, please implement your prescribed fix")
- About to transfer workstations - values proper handoff documentation

**UI Issues Reported:**
1. Snow text turning black on dark backgrounds during night (contrast issue)
2. Hamburger menu button underlined instead of having circular background
3. Primary display container adaptive height causing layout shifts
4. Humidity and "No precipitation" boxes appearing shorter than other condition boxes
5. Primary display content getting cut off at top/bottom after height fix

**Communication Style:**
- Organized feedback into categorized lists (Quick Wins, Medium Effort, New Features)
- Direct confirmation when issues persist ("I assure you that the humidity box is smaller")
- Uses humor ("lol") when pointing out overlooked issues
- Plans ahead for workstation migration
- Explicitly requests proper handoff preparation

**Session Workflow:**
1. Reviewed AI_INSTRUCTIONS.md for context
2. Analyzed test results JSON files (test-results-4.json and test-results-5.json)
3. Fixed test harness sleet validation (28-35°F → 29-38°F)
4. Addressed UI quick wins in priority order
5. Build verification after each major change
6. Comprehensive sprint log documentation
7. Git commit with detailed message

**Features Implemented:**
1. **Test validation fixes** - Sleet range corrected to match dual-zone implementation
2. **analyze-test-results.js utility** - Reusable tool for analyzing test JSON output
3. **Snow text contrast** - Night snow now uses light text
4. **Circular hamburger button** - Frosted-glass background with hover states
5. **Fixed container heights** - Primary display and condition boxes no longer adaptive

**Technical Notes:**
- Created utility: `node analyze-test-results.js [filename]` for test analysis
- Fixed heights prevent layout shifts but use min-height to allow growth if needed
- Refactored PrimaryDisplay to avoid duplicate time-of-day calculations
- All condition boxes now use `height: 140px` instead of `min-height`

### Session 6 - Sprint 10 (Hawthorn) - 2025-12-22

**Preferences Discovered:**
- Uses NOTES_FROM_USER.md actively for async communication during sessions
- Appreciates being given options/toggles rather than forced changes
- Values the ability to easily switch back if a change doesn't feel right
- Comfortable stepping away while agent works autonomously

**Feature Requests:**
- Condition phrasing toggle ("Mist" vs "Misty" style) - IMPLEMENTED
- Druidcraft redundant descriptor fix - IMPLEMENTED
- Seasonal transition testing in test harness
- Ocean/sailing biomes
- Biome coverage audit

**Communication Style:**
- Efficiently delegates work and trusts agent judgment
- Provides clear guidance on scope ("implement those", "add a toggle")
- Gives heads-up when stepping away ("I'll be stepping away")
- Explicit about what requires approval vs. autonomous work

**Features Implemented:**
1. **Condition Phrasing Toggle** - New preference with Standard/Descriptive options
2. **Druidcraft Fix** - Removed redundant "(precipType)" suffixes
3. **Notes Processing** - All items migrated to roadmap and cleared

**Technical Notes:**
- New utility: `src/v2/utils/conditionPhrasing.js` for condition text transformation
- Phrasing preference stored in PreferencesContext and persisted to localStorage
- Twilight levels confirmed fully implemented (documented location for future reference)
- PROGRESS.md roadmap updated with all outstanding items

**Bug Fix - Dual PreferencesContext Pitfall:**
- Discovered runtime crash caused by importing wrong PreferencesContext
- Project has TWO contexts with different APIs - see warning below

---

## CRITICAL: Dual PreferencesContext Warning

**This project has TWO PreferencesContext implementations with different APIs!**

| File | Pattern | Used By |
|------|---------|---------|
| `src/contexts/PreferencesContext.js` | `{ state, setters... }` | Legacy/src components |
| `src/v2/contexts/PreferencesContext.jsx` | `{ prop1, prop2, setters... }` (flat) | V2 components |

**When adding preferences to V2 components:**
1. Import from `../../contexts/PreferencesContext` (the V2 one, relative to component location)
2. Destructure directly: `const { myPref, setMyPref } = usePreferences()`
3. Do NOT use `{ state: preferences }` pattern - that's the legacy context

**When adding preferences to legacy components:**
1. Import from the appropriate relative path to `src/contexts/PreferencesContext.js`
2. Use `{ state, setters... }` pattern

**Symptoms of using wrong context:**
- Build succeeds but app crashes at runtime
- Error may not be visible if it breaks rendering early

---

## Instructions for Updating This Document

**When to update**:
- When you discover new information about Tyler's preferences
- When Tyler explicitly requests a feature for the future
- When you encounter patterns in Tyler's communication style
- When architectural decisions are made that future agents should know

**What to include in "Notes About Tyler"**:
- Communication preferences (how Tyler likes to be informed, asked questions, etc.)
- Feature requests for future implementation
- Technical preferences (code style, documentation, etc.)
- Project vision and goals
- Things that work well vs. things to avoid

**Format for updates**:
```markdown
### Session [N] - Sprint [N] ([Name]) - [Date]

**Preferences Discovered:**
- [bullet points of what you learned]

**Feature Requests:**
- [future features Tyler mentioned]

**Communication Style:**
- [how Tyler communicates, what he values]
```

---

## Current Project Status

**As of Sprint 4 (Cedar) - 2025-12-21:**

### Completed Features
- ✅ Basic weather generation with temporal continuity
- ✅ Flat disc celestial mechanics
- ✅ iOS Weather-inspired UI
- ✅ 30+ climate templates with real-world accuracy
- ✅ Druidcraft (24-hour) and DM (7-day) forecasts
- ✅ Dark theme with comprehensive styling
- ✅ Atmospheric depth (pressure, cloud cover, enhanced humidity, visibility)

### Next Priorities (from roadmap)
1. **Sprint 5**: Enhanced wind patterns and frontal systems
2. **Sprint 6**: Extreme weather events and snow accumulation
3. **Sprint 7**: Educational modals and documentation (Tyler's request)
4. **Sprint 8**: UI polish and user experience

### Known Issues/Future Work
- No extreme weather events yet (hurricanes, blizzards)
- No snow accumulation tracking
- No educational modals for weather/gameplay mechanics
- No automated testing
- Performance could be optimized further

---

## Good Luck!

You're joining a well-architected, well-documented project with a clear vision. Tyler is collaborative and appreciative of quality work. Focus on:

1. **Understanding before implementing** - Read the docs, understand the architecture
2. **Documenting as you go** - Future agents (and Tyler) will thank you
3. **Communicating clearly** - Explain your reasoning, ask questions when needed
4. **Respecting the sprint philosophy** - Choose a meaningful name, work methodically
5. **Building on the foundation** - Don't reinvent what works, enhance it

**Most importantly**: This is a D&D tool to help create living, breathing worlds. Every feature should serve that goal.

---

*"Cedar represents strength and resilience - this sprint added atmospheric depth to strengthen weather realism"*
