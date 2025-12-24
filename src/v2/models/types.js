/**
 * WeatherMaster 2.0 - Data Models
 * Clean type definitions for core data structures
 */

/**
 * Game Date - Fictional earth calendar (no minutes, hour-only)
 * @typedef {Object} GameDate
 * @property {number} year - Any year (can be 4832, 256, etc.)
 * @property {number} month - Month 1-12 (earth calendar)
 * @property {number} day - Day 1-31 (validated per month)
 * @property {number} hour - Hour 0-23 (always on the hour, no minutes)
 */

/**
 * World - Top-level container for campaigns
 * @typedef {Object} World
 * @property {string} id - Unique identifier (uuid)
 * @property {string} name - World name
 * @property {string} [description] - Optional description
 * @property {GameDate} currentDate - Master time for all regions
 * @property {Region[]} regions - Regions within this world
 */

/**
 * Region - Geographic area with shared weather
 * @typedef {Object} Region
 * @property {string} id - Unique identifier (uuid)
 * @property {string} worldId - Parent world ID
 * @property {string} name - Region name
 * @property {string} latitudeBand - 'polar' | 'subarctic' | 'boreal' | 'temperate' | 'subtropical' | 'tropical'
 * @property {ClimateProfile} climate - Climate parameters
 * @property {string} [templateId] - Template used to create (if any)
 * @property {Location[]} locations - Locations within this region
 */

/**
 * Climate Profile - Weather generation parameters
 * @typedef {Object} ClimateProfile
 * @property {string} biome - Biome type (desert, rainforest, tundra, etc.)
 * @property {number} baseTemp - Base temperature for region
 * @property {number} tempVariation - Temperature variation range
 * @property {number} precipitation - Precipitation level (0-1)
 * @property {number} humidity - Base humidity (0-1)
 * @property {number} windiness - Wind intensity modifier
 */

/**
 * Location - Specific place within a region (inherits weather)
 * @typedef {Object} Location
 * @property {string} id - Unique identifier (uuid)
 * @property {string} regionId - Parent region ID
 * @property {string} name - Location name
 * @property {string} [description] - Optional description
 */

/**
 * Weather Entry - Calculated weather for a specific hour (not stored)
 * @typedef {Object} WeatherEntry
 * @property {Date} timestamp - When this weather occurs
 * @property {number} temperature - Temperature in Fahrenheit
 * @property {number} feelsLike - Perceived temperature (wind chill/heat index)
 * @property {string} condition - Weather condition ('Clear', 'Rain', etc.)
 * @property {number} windSpeed - Wind speed in MPH
 * @property {string} windDirection - Cardinal direction
 * @property {number} humidity - Humidity percentage (0-100)
 * @property {number} pressure - Atmospheric pressure
 * @property {GameEffect[]} effects - D&D mechanical effects
 * @property {string} [description] - Optional narrative description
 * @property {CelestialData} celestial - Sun/moon data
 */

/**
 * Celestial Data - Sun and moon information (Flat Disc Model)
 * @typedef {Object} CelestialData
 * @property {string} sunriseTime - Sunrise time (formatted)
 * @property {string} sunsetTime - Sunset time (formatted)
 * @property {string} dayLength - Day length (formatted, e.g., "12 hr 30 min")
 * @property {boolean} isDaytime - Is it currently daytime?
 * @property {string} twilightLevel - Twilight state ('daylight'|'civil'|'nautical'|'astronomical'|'night')
 * @property {number} distanceToSun - Distance from observer to sun in miles
 * @property {boolean} isPermanentNight - True if at disc center (never illuminated)
 * @property {string} moonPhase - Moon phase name
 * @property {string} moonIcon - Moon phase emoji icon
 * @property {number} moonIllumination - Moon illumination percentage (0-100)
 * @property {boolean} isWaxing - True if moon is waxing (growing)
 * @property {boolean} isMoonVisible - Is moon currently above horizon?
 * @property {string} moonriseTime - Moonrise time (formatted)
 * @property {string} moonsetTime - Moonset time (formatted)
 * @property {number} [phaseAngle] - Lunar phase angle in degrees (debug/optional)
 */

/**
 * Game Effect - D&D 5E mechanical weather effects
 * @typedef {Object} GameEffect
 * @property {string} category - Effect category ('visibility', 'movement', etc.)
 * @property {string} description - Effect description
 */

// Export as empty object (this file is for JSDoc types only)
export {};
