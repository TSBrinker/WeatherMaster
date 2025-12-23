# Working with Tyler

This document contains evergreen information about Tyler's preferences, the project philosophy, and key decisions that have been established. Unlike HANDOFF.md (which changes every sprint), this content is stable.

**Last Updated**: 2025-12-23 (Sprint 21)

---

## IMPORTANT: Check NOTES_FROM_USER.md Every Session

Tyler uses `docs/NOTES_FROM_USER.md` as a running scratchpad for thoughts, bugs, and feature ideas.

**Every session, you MUST:**
1. Read NOTES_FROM_USER.md at the start
2. Acknowledge each item with Tyler
3. Sort items appropriately:
   - **Bugs**: Address or add to ROADMAP.md
   - **Features**: Add to ROADMAP.md or discuss
   - **Questions**: Ask Tyler for clarification
4. Once processed, items can be cleared from the file

**Never ignore this file** - it's Tyler's primary async communication channel!

---

## Tyler's Preferences

### Communication Style
- **Direct and collaborative** - Asks clarifying questions when unsure
- **Values the "why"** - Appreciates understanding reasoning behind technical decisions
- **Comfortable with technical depth** - But prioritizes gameplay value over scientific precision
- **Concise responses preferred** - Get to the point, explain when asked

### Working Style
- **Only commit when asked** - Tyler will explicitly request commits
- **Ask questions when uncertain** - Use AskUserQuestion tool for clarification
- **Explain your reasoning** - Especially for meteorological or gameplay decisions
- **Use TodoWrite actively** - Tyler appreciates visibility into progress
- **Document for handoff** - Future agents depend on your documentation

### What Tyler Appreciates
- Comprehensive testing before declaring something "done"
- Real-world validation (comparing to actual weather data)
- Clean, focused implementations (no over-engineering)
- Tools that provide confidence in the codebase (test harness, etc.)
- Being given options/toggles rather than forced changes

---

## Project Philosophy

### Design Principles
1. **Simplicity over complexity** - Only add features that enhance gameplay
2. **Realism with pragmatism** - Accurate weather without overwhelming simulation
3. **Deterministic behavior** - Same inputs = same outputs (no surprises)
4. **Performance first** - Cache aggressively, calculate efficiently
5. **Clear documentation** - Every decision explained, every formula sourced

### What This Project Is
- A **D&D weather generation tool** for Tyler's Marai campaign setting
- A **flat disc world** with custom celestial mechanics
- Designed for **gameplay value**, not scientific perfection
- Built to be **handed off between AI agents** - documentation matters

### What This Project Is NOT
- A meteorological simulation
- A general-purpose weather app
- Feature-complete (it's actively being developed)

---

## Established Architectural Decisions

These decisions were made early and should be respected unless Tyler explicitly changes them.

### Weather System
- **Hybrid approach**: Core weather services now, extreme weather (hurricanes, etc.) later
- **Isolated regions**: No spatial weather propagation between regions (by design)
- **Deterministic generation**: Seed-based randomness (region ID + date = same weather)
- **Temporal continuity**: Smooth 3-5 day weather patterns, no "dice roll" jumps
- **Multi-day patterns**: High pressure, low pressure, fronts create realistic systems

### World Model
- **Flat disc first**: Round earth support is a future enhancement
- **Data hierarchy**: World → Regions → Locations (Locations not yet implemented)
- **Master time**: World determines date/time (time zones are a stretch goal)

### UI/UX
- **iOS Weather-inspired**: Massive typography, dynamic gradients
- **Dark theme**: Comprehensive dark mode styling
- **Test harness**: Access via `?test=true` URL parameter

---

## Commit Message Format

```
Brief description of change

- Detailed point 1
- Detailed point 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <your-model>  <noreply@anthropic.com>
```

---

## Technical Quick Reference

### Project Structure
```
src/v2/                    # THE ENTIRE APPLICATION
├── components/            # React components
├── contexts/              # WorldContext, PreferencesContext
├── data/                  # region-templates.js, weather-effects.js
├── services/              # weather/, celestial/, storage/
├── styles/                # theme.css, app.css
└── utils/                 # dateUtils, seedGenerator, etc.

docs/
├── START_HERE.md          # Entry point for new agents
├── HANDOFF.md             # Current task context
├── WORKING_WITH_TYLER.md  # This file
├── NOTES_FROM_USER.md     # Tyler's scratchpad
├── sprint-logs/           # Detailed sprint documentation
└── archive/               # Historical documents (PROGRESS.md, etc.)
```

### Key Files for Weather Work
- `src/v2/services/weather/WeatherGenerator.js` - Main coordinator
- `src/v2/services/weather/TemperatureService.js` - Temperature calculations
- `src/v2/services/weather/SnowAccumulationService.js` - Snow/ice tracking
- `src/v2/data/region-templates.js` - Climate templates for all biomes

### Testing
- `npm start` - Run development server
- `localhost:3000?test=true` - Access test harness
- `npm run build` - Verify build succeeds

---

## Observations About Tyler

*This section is for agents to log observations that help future agents work effectively with Tyler. Add your insights here!*

### From Sprint 21 (Sequoia)
- Values documentation cleanup and workflow clarity
- Appreciates when agents ask clarifying questions before making assumptions
- Wants agents to have unique names (check sprint-logs before choosing)
- Prefers collaborative decision-making over autonomous changes to process

### From Earlier Sprints (extracted from archived AI_INSTRUCTIONS.md)
- Uses NOTES_FROM_USER.md actively for async communication during sessions
- Has keen eye for visual details (noticed small UI inconsistencies)
- Provides detailed, organized feedback lists
- Values real-world experience in calibrating tests (e.g., as an Iowa resident, understands weather volatility)
- Prefers fixing root causes over band-aid solutions
- Appreciates being given options/toggles rather than forced changes
- Comfortable stepping away while agent works autonomously
- Gives positive feedback when impressed ("Inspired. Well done!", "Remarkably done")
- Reports specific anomalies with exact data (date, time, temp, conditions)
- Proactive about testing and regression prevention

---

## Updating This Document

**You are encouraged to update this document!** Add to it when you discover:
- New observations about Tyler (add to "Observations About Tyler" section)
- New preferences or communication patterns
- Architectural decisions that should be preserved
- Patterns that worked well (or didn't)
- Technical notes future agents should know

**Rules for updating:**
- **ADD** new content to existing sections
- **DO NOT** remove or overwrite existing observations (they're valuable history)
- **DO NOT** change the document structure without Tyler's approval
- Keep it **evergreen** - if something changes frequently, it belongs in HANDOFF.md instead
