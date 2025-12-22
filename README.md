# WeatherMaster v2

A deterministic weather generation system for D&D campaigns, featuring realistic atmospheric modeling and flat disc world celestial mechanics.

**Live Demo**: [https://tsbrinker.github.io/WeatherMaster](https://tsbrinker.github.io/WeatherMaster)

---

## Features

### Core Weather System
- **Deterministic Generation** - Same region + same date = same weather (enables instant time travel to any date)
- **Temporal Continuity** - Multi-day weather patterns (3-5 days) create realistic weather systems
- **30+ Climate Templates** - Real-world accuracy based on actual meteorological data (±3°F)
- **Atmospheric Depth** - Pressure systems, cloud cover percentage, humidity, and visibility modeling
- **Smart Temperature** - Seasonal variation, daily cycles, pattern influences, heat index, and wind chill

### Flat Disc World Celestial Mechanics
- **Distance-Based Sun** - Illumination based on observer distance (≤10,000 miles = daylight)
- **Seasonal Sun Movement** - Orbital radius varies (8,000 mi winter → 11,000 mi summer)
- **Angular Moon Phases** - Based on angular separation from sun, not Earth shadow
- **Observer-Relative Sky** - Sunrise/sunset/moonrise/moonset calculated for observer position
- **Twilight Levels** - Civil, nautical, and astronomical twilight zones

### Weather Forecasting
- **Druidcraft Forecast** - 24-hour weather prediction (D&D Druidcraft cantrip simulation)
- **DM Forecast** - 7-day outlook with daily summaries for narrative planning
- **Auto-Refresh** - Forecasts update automatically when advancing time

### Educational Modals
- **Weather Primer** - Comprehensive guide to atmospheric conditions, weather patterns, and how systems interact
- **Gameplay Mechanics** - D&D 5e mechanical impacts for all weather conditions (searchable reference)
- **DM Tips** - Guidance for implementing weather effects in gameplay

### iOS Weather-Inspired UI
- **Massive Typography** - Ultra-thin fonts (200-300 weight) with enormous location/temperature display
- **Dynamic Gradients** - Weather-based backgrounds that change with conditions and time of day
- **Component Cards** - Separated displays for conditions (wind, humidity, pressure, clouds, visibility, precipitation) and celestial info (sun/moon)
- **Professional Icons** - Line-art weather icons throughout
- **Fully Responsive** - Optimized for desktop, tablet, and mobile

---

## Current Status

**Version**: v2.0.0-alpha
**Last Updated**: 2025-12-21
**Completed Sprints**: 5 (Basic Generation, iOS UI, Modal Polish, Atmospheric Depth, Educational Modals)

### Completed Features ✅
- ✅ Deterministic weather generation with seed-based randomness
- ✅ Flat disc celestial mechanics (sun distance, moon angular phases)
- ✅ 30+ climate templates with real-world accuracy
- ✅ Multi-day weather patterns with smooth transitions
- ✅ Atmospheric modeling (pressure, clouds, humidity, visibility)
- ✅ Temperature calculations (seasonal, daily, pattern influences)
- ✅ Precipitation types (rain, snow, sleet, freezing rain) and intensities
- ✅ Wind generation based on terrain and weather patterns
- ✅ Heat index and wind chill calculations
- ✅ Weather warnings (extreme temp, high winds, low visibility)
- ✅ 24-hour Druidcraft forecast with period grouping
- ✅ 7-day DM forecast with daily summaries
- ✅ iOS Weather-inspired UI with massive typography
- ✅ Dynamic weather gradients (changes with condition + time of day)
- ✅ Educational modals for weather mechanics and D&D gameplay impacts
- ✅ Dark theme with comprehensive styling
- ✅ Proper Gregorian calendar (real month lengths, no leap years)

### Next Features 🔜
- **Sprint 6**: Enhanced wind patterns and frontal systems
- **Sprint 7**: Extreme weather events (hurricanes, blizzards) and snow accumulation
- **Sprint 8**: Wanderers (falling star events for Marai setting)
- **Sprint 9**: Gameplay mechanics integration (badges on main display, inline cross-references)
- **Sprint 10**: UI polish and code cleanup

---

## How It Works

### Deterministic Weather
WeatherMaster v2 uses **seed-based randomness** to generate consistent weather:

```javascript
Seed = hash(regionID + year + month + day + hour + context)
```

This means:
- Same inputs **always** produce the same outputs
- You can instantly jump to Year 1000 (no sequential generation needed)
- Weather is reproducible and predictable for planning campaigns
- Multi-session consistency guaranteed

### Weather Pattern Cycles
- Weather patterns last **3-5 days** each
- Pattern types: High Pressure, Low Pressure, Warm Front, Cold Front, Stable
- Patterns influence temperature, precipitation probability, and atmospheric conditions
- Smooth transitions prevent random "dice roll" weather jumps

### Climate Templates
30+ biome templates with real-world temperature data:
- **Tundra Plain** (Barrow, Alaska) - Annual 14°F
- **Continental Prairie** (Des Moines, Iowa) - Annual 51°F
- **Tropical Desert** (Phoenix, Arizona) - Annual 74°F
- **Mediterranean Coast** (Los Angeles) - Annual 65°F
- **Maritime Forest** (Seattle) - Annual 52°F
- **Equatorial Rainforest** (Singapore) - Annual 80°F
- And 24 more...

Each template includes:
- 4 seasonal temperature keypoints
- Daily temperature variance
- Maritime/continental influence
- Seasonal precipitation profiles
- Humidity characteristics
- Real-world example cities

### Flat Disc World Model
WeatherMaster v2 supports flat disc cosmology:

**Sun Mechanics**:
- Sun orbits above the disc at varying radius (8,000-11,000 miles)
- Daylight determined by distance from observer
- Winter = closer orbit = shorter days at disc center
- Summer = farther orbit = longer days at disc center

**Moon Mechanics**:
- Moon phases based on angular separation from sun
- New Moon: θ_moon = θ_sun (0° separation)
- Full Moon: 180° separation
- Lunar cycle: 29.53 days
- Moonrise/moonset based on observer's visible arc

**Geography**:
- Disc center (central latitude) = shortest days in winter
- Disc edge (rim latitude) = longest days in winter
- No Earth-based assumptions

See [FLAT_DISC_WORLD.md](FLAT_DISC_WORLD.md) for complete celestial mechanics specification.

---

## Getting Started

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/TSBrinker/WeatherMaster.git
   cd WeatherMaster
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### First-Time Setup
1. **Create a World** - Click "Create World" and name your campaign setting
2. **Add a Region** - Click "+ Add Location" in the hamburger menu
3. **Choose Climate** - Select from 30+ biome templates (or customize)
4. **Configure Geography** - Set latitude band (central/mid/rim) and terrain
5. **Generate Weather** - Watch realistic weather appear instantly

### Using the App
- **Time Controls** - Use `<<` and `<` (4hr/1hr back) or `>` and `>>` (1hr/4hr forward) to advance time
- **Jump to Date** - Click the calendar icon to instantly travel to any date
- **Cast Druidcraft** - View 24-hour forecast (as per D&D Druidcraft cantrip)
- **DM Forecast** - Toggle 7-day outlook for campaign planning
- **Hamburger Menu** - Access all regions, settings, and help resources
- **Help & Resources** - Open Weather Primer or Gameplay Mechanics modals from menu

---

## Project Structure

```
src/v2/                          # v2 codebase (current)
├── models/
│   ├── types.js                 # Type definitions
│   └── constants.js             # Flat disc world parameters
├── utils/
│   ├── dateUtils.js             # Gregorian calendar utilities
│   ├── seedGenerator.js         # Deterministic randomness
│   └── weatherTheme.js          # Dynamic gradient utilities
├── contexts/
│   ├── PreferencesContext.jsx   # User preferences (temp units, etc.)
│   └── WorldContext.jsx         # World and region management
├── services/
│   ├── celestial/
│   │   ├── geometry.js          # Flat disc geometry calculations
│   │   ├── SunriseSunsetService.js
│   │   └── MoonService.js
│   └── weather/
│       ├── TemperatureService.js
│       ├── WeatherPatternService.js
│       ├── AtmosphericService.js
│       ├── WeatherGenerator.js  # Main weather coordinator
│       └── WeatherService.js    # Public API
├── components/
│   ├── header/
│   │   └── WeatherHeader.jsx    # Time display + controls + menu
│   ├── weather/
│   │   ├── PrimaryDisplay.jsx   # Hero component (location + temp)
│   │   ├── ConditionsCard.jsx   # Wind, humidity, pressure, clouds, etc.
│   │   ├── CelestialCard.jsx    # Sun/moon info
│   │   ├── DruidcraftForecast.jsx
│   │   └── DMForecastPanel.jsx
│   ├── modals/
│   │   ├── WeatherPrimerModal.jsx
│   │   └── GameplayMechanicsModal.jsx
│   └── menu/
│       ├── HamburgerMenu.jsx    # Location list + settings
│       └── SettingsMenu.jsx     # Data management
├── data/
│   └── region-templates.js      # 30+ climate templates
└── styles/
    ├── theme.css                # Weather gradients
    └── app.css                  # Global styles

src/                             # v1 codebase (legacy, preserved for reference)
data-tables/
└── weather-effects.js           # D&D 5e game mechanics reference

docs/
├── sprint-logs/                 # Individual agent sprint documentation
├── climate-research/            # Real-world climate data sources
├── FLAT_DISC_WORLD.md          # Celestial mechanics specification
└── NOTES_FROM_USER.md          # Tyler's scratchpad (check regularly!)

PROGRESS.md                      # Master progress tracker
QUESTIONS_FOR_USER.md            # Architectural decisions
AI_INSTRUCTIONS.md               # Instructions for AI agents
```

---

## Technical Details

### Weather Generation Flow
1. **Pattern Service** determines current weather pattern (3-5 day cycles)
2. **Atmospheric Service** calculates pressure, cloud cover, enhanced humidity
3. **Temperature Service** generates base temperature with seasonal/daily variation
4. **Weather Generator** coordinates all services and determines final conditions
5. **Weather Service** exposes weather + celestial data to components

### Caching Strategy
- All services implement independent caching
- Cache keys include region ID, date, and hour
- Deterministic seed ensures reproducible results
- Call `clearCache()` when switching regions

### Performance
- Forecast generation: <200ms for 7-day outlook
- Instant time travel to any date (no sequential calculation)
- Efficient caching minimizes redundant calculations
- Bundle size: ~128 KB JS, ~37 KB CSS

---

## Documentation

### For Users
- **Weather Primer Modal** - In-app guide to atmospheric conditions and weather patterns
- **Gameplay Mechanics Modal** - D&D 5e mechanical impacts of weather (searchable)
- **FLAT_DISC_WORLD.md** - Complete flat disc celestial mechanics specification

### For Developers
- **PROGRESS.md** - Master progress tracker with all completed work
- **QUESTIONS_FOR_USER.md** - Architectural decisions and implementation strategy
- **AI_INSTRUCTIONS.md** - Instructions for AI agents continuing development
- **Sprint Logs** - Detailed documentation of each sprint's work (in `docs/sprint-logs/`)
- **Climate Research** - Real-world data sources and temperature validation (in `docs/climate-research/`)

---

## Contributing

This project is primarily developed for Tyler's personal Marai campaign setting, but contributions are welcome! When contributing:

1. **Read AI_INSTRUCTIONS.md** - Understand project philosophy and Tyler's preferences
2. **Read PROGRESS.md** - See what's been completed and what's planned
3. **Create a sprint log** - Document your work in `docs/sprint-logs/SPRINT_[NUMBER]_[NAME].md`
4. **Update documentation** - Keep PROGRESS.md and AI_INSTRUCTIONS.md current
5. **Follow commit format** - Use proper attribution (see AI_INSTRUCTIONS.md)

### Design Principles
- **Simplicity over complexity** - Only add features that enhance gameplay
- **Realism with pragmatism** - Accurate weather without overwhelming simulation
- **Deterministic behavior** - Same inputs = same outputs (no surprises)
- **Performance first** - Cache aggressively, calculate efficiently
- **Clear documentation** - Every decision explained, every formula sourced

---

## Dependencies

### Core
- React 18.2.0
- React Bootstrap 2.10.0
- Bootstrap 5.3.0

### Icons
- react-icons 5.5.0 (Weather Icons, Font Awesome, Game Icons, etc.)
- lucide-react 0.508.0

### Utilities
- uuid 9.0.0
- react-spring 9.7.5

### Build Tools
- react-scripts 5.0.1
- gh-pages 6.3.0 (deployment)

See [DEPENDENCIES.md](DEPENDENCIES.md) for complete workstation setup instructions.

---

## Roadmap

### Completed Sprints ✅
- **Sprint 1**: Basic Weather Generation
- **Sprint 2**: iOS Weather UI Redesign "Elderwood"
- **Sprint 3**: Modal Legibility & UI Polish "Willow"
- **Sprint 4**: Atmospheric Depth "Cedar"
- **Sprint 5**: Educational Modals & Documentation "Sage"

### Upcoming Sprints 🔜
- **Sprint 6**: Enhanced Wind & Weather Systems
- **Sprint 7**: Extreme Weather & Snow Accumulation
- **Sprint 8**: Wanderers (Falling Stars for Marai)
- **Sprint 9**: Gameplay Integration & UI Refinements
- **Sprint 10**: UI Polish & User Experience

See [PROGRESS.md](PROGRESS.md) for detailed roadmap and sprint planning.

---

## License

This project is built for personal use in Tyler's D&D campaigns. Feel free to use it for your own campaigns!

---

## Credits

**Original Development**: Tyler Brinker (TSBrinker)
**AI Development Team**:
- Sprint 1: Cedar (Basic Weather Generation)
- Sprint 2: Elderwood (iOS UI Redesign)
- Sprint 3: Willow (Modal Legibility)
- Sprint 4: Cedar (Atmospheric Depth)
- Sprint 5: Sage (Educational Modals)
- Sprint 6: Rowan (README Update & Deployment Fix)

**Climate Data Sources**:
- Weather Spark (weatherspark.com)
- Climates to Travel (climatestotravel.com)
- National Weather Service
- NOAA Climate Data

**Inspiration**:
- iOS Weather app design
- D&D 5e Druidcraft cantrip
- Flat disc world cosmology

---

**"Building living, breathing worlds for D&D campaigns"**

For questions or feedback, open an issue on [GitHub](https://github.com/TSBrinker/WeatherMaster/issues).
