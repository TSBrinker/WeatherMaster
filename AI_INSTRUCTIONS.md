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
