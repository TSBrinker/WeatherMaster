# D&D Weather System

A comprehensive weather generation and tracking system for tabletop RPG games, based on the weather tables from GM Binder.

## Features

### Core Functionality
- **Dynamic Weather Generation**: Weather generates in 1d8 hour intervals based on seasonal tables
- **Progressive Weather System**: Weather changes follow the "Slowly Changing Weather" variant with progressive shifts
- **Special Events**: Handles special weather phenomena like Shooting Stars
- **Time Management**: Tracks game time with season changes affecting weather
- **World & Location Support**: Multiple campaign worlds with distinct locations and climate zones

### User Interface
- **Hourly Forecast Display**: Visual weather forecast for the next 24 hours with appropriate icons
- **Druidcraft Support**: Shows what a character would learn using the Druidcraft spell
- **Time Controls**: Easy-to-use interface for advancing time by various increments
- **Session Notes Export**: Generate formatted notes for game sessions

## Technical Implementation

### Components
- **WorldList & WorldCreationForm**: For managing campaign worlds
- **LocationList & LocationForm**: For managing locations within worlds
- **WeatherDisplay**: For viewing and interacting with weather
- **TimeControls**: For managing game time
- **SessionNotes**: For generating formatted notes for game sessions

### Services
- **storage-service.js**: Handles localStorage data persistence
- **weather-service.js**: Handles weather generation logic
- **useWeather hook**: Custom React hook for managing weather state

### Weather Tables
The system uses the following seasonal weather tables:

- **Winter**: Blizzard, Snow, Freezing Cold, Heavy Clouds, Light Clouds, Clear Skies
- **Spring**: Thunderstorm, Heavy Rain, Rain, Light Clouds, Clear Skies, High Winds, Scorching Heat
- **Summer**: Thunderstorm, Rain, Light Clouds, Clear Skies, High Winds, Scorching Heat
- **Fall**: Thunderstorm, Rain, Heavy Clouds, Light Clouds, Clear Skies, High Winds, Scorching Heat

Each weather condition has specific game effects that are displayed to help the DM implement them in the game.

## Planned Features

### Immediate Next Steps
- Implement custom climate modifiers
- Add moon phase tracking
- Add festival/holiday management

### Medium-term Goals
- Add custom calendar support (lunar, etc.)
- Improve time zone visualization
- Add weather history visualization

### Long-term Features
- Custom world types (disc-world support)
- Advanced climate modeling
- Weather event planning tools

## Getting Started

1. Create a new world from the Worlds tab
2. Create a location within that world
3. Select the location to view weather
4. Use the time controls to advance the game time
5. Export session notes