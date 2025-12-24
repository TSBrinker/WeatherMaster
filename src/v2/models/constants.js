/**
 * WeatherMaster v2 - Constants
 * Flat disc world model parameters and global constants
 */

// ===== DISC WORLD GEOMETRY =====

/** Radius of the flat disc world in miles */
export const DISC_RADIUS = 7000;

/** Diameter of the flat disc world in miles */
export const DISC_DIAMETER = DISC_RADIUS * 2;

// ===== SUN CONSTANTS =====

/** Sun's illumination radius in miles (distance at which daylight ends) */
export const SUN_ILLUMINATION_RADIUS = 10000;

/** Sun's orbital period in hours */
export const SUN_ORBITAL_PERIOD_HOURS = 24;

/** Mean orbital radius of the sun from disc center in miles */
export const SUN_ORBITAL_RADIUS_MEAN = 9500;

/** Amplitude of seasonal variation in sun's orbital radius in miles */
export const SUN_ORBITAL_RADIUS_AMPLITUDE = 1500;

/** Sun's orbital radius at summer solstice in miles */
export const SUN_ORBITAL_RADIUS_SUMMER = 8000;

/** Sun's orbital radius at winter solstice in miles */
export const SUN_ORBITAL_RADIUS_WINTER = 11000;

// ===== MOON CONSTANTS =====

/** Moon's orbital period in hours (slightly slower than sun) */
export const MOON_ORBITAL_PERIOD_HOURS = 24.8;

/** Synodic period in days (time for phase cycle to repeat) */
export const LUNAR_CYCLE_DAYS = 29.53059;

/** Moon's orbital radius from disc center in miles (similar to sun's orbit) */
export const MOON_ORBITAL_RADIUS = 7000;

// ===== TIME CONSTANTS =====

/** Length of a year in days */
export const YEAR_LENGTH_DAYS = 365.2422;

/** Hours per day */
export const HOURS_PER_DAY = 24;

/** Days per lunar cycle */
export const DAYS_PER_LUNAR_CYCLE = LUNAR_CYCLE_DAYS;

// ===== TWILIGHT DISTANCE THRESHOLDS =====

/** Distance threshold for civil twilight in miles */
export const TWILIGHT_CIVIL = 11000;

/** Distance threshold for nautical twilight in miles */
export const TWILIGHT_NAUTICAL = 12000;

/** Distance threshold for astronomical twilight in miles */
export const TWILIGHT_ASTRONOMICAL = 13000;

// ===== LATITUDE BAND TO RADIUS MAPPING =====

/**
 * Maps latitude band names to representative observer distances from disc center.
 * These represent the midpoint of each band's range.
 *
 * FLAT DISC GEOMETRY (INVERSE of Earth):
 * - Polar (disc center, Amon Astra region) = magical twilight in summer, polar night in winter
 * - Tropical (near disc edge) = warm, humid, fed by glacial melt from superheated/frozen rim
 *
 * Bands are derived from physics-based daylight calculations:
 * - Polar: 24hr summer day / 0hr winter day (magically moderated)
 * - Subarctic: 24hr summer day / 6-7hr winter day (extreme swing)
 * - Boreal: 16-18hr summer day / 8hr winter day (big seasonal variation)
 * - Temperate: 13-15hr summer day / 8-9hr winter day (moderate seasons)
 * - Subtropical: 12-13hr summer day / 8-9hr winter day (mild variation)
 * - Tropical: 11-12hr summer day / 8-9hr winter day (consistent warmth)
 */
export const LATITUDE_BAND_RADIUS = {
  polar:      750,   // Midpoint of 0-1500 mi (disc center, Amon Astra)
  subarctic:  2000,  // Midpoint of 1500-2500 mi
  boreal:     3000,  // Midpoint of 2500-3500 mi (northern forests, snow persists)
  temperate:  4000,  // Midpoint of 3500-4500 mi (classic four seasons)
  subtropical: 5000, // Midpoint of 4500-5500 mi (mild winters)
  tropical:   6100   // Midpoint of 5500-6700 mi (warm, humid paradise)
};

/**
 * Maps latitude band names to their range boundaries [min, max] in miles from disc center.
 * Boundaries derived from physics-based daylight hour calculations.
 */
export const LATITUDE_BAND_RANGES = {
  polar:      [0,    1500],  // Extreme polar conditions, magical twilight intervention
  subarctic:  [1500, 2500],  // Midnight sun territory, extreme seasonal swing
  boreal:     [2500, 3500],  // Northern forests, snow persists through winter
  temperate:  [3500, 4500],  // Classic four seasons, snow comes and goes
  subtropical: [4500, 5500], // Mild winters, warm summers, rare snow
  tropical:   [5500, 6700]   // Warm and humid, fed by rim glacial melt (6700 = habitable edge)
};

// ===== OBSERVER POSITION DEFAULTS =====

/**
 * Default observer angular position (θ_obs) in degrees.
 * All regions default to 0° unless specified otherwise.
 */
export const DEFAULT_OBSERVER_ANGLE = 0;

// ===== ANGULAR CONSTANTS =====

/** Degrees per hour of sun movement (360° / 24 hours) */
export const DEGREES_PER_HOUR_SUN = 360 / 24;

/** Degrees per hour of moon movement (360° / 24.8 hours) */
export const DEGREES_PER_HOUR_MOON = 360 / MOON_ORBITAL_PERIOD_HOURS;

// ===== PHASE OFFSET DEFAULTS =====

/**
 * Default sun phase offset (φ_sun) in degrees.
 * Defines the sun's position at time t=0 (midnight).
 * 180° means sun is opposite observer at midnight (far away = nighttime)
 * This makes sunrise occur in morning hours and sunset in evening hours.
 */
export const DEFAULT_SUN_PHASE_OFFSET = 180;

/**
 * Default moon phase offset (φ_moon) in degrees.
 * Defines the moon's position at time t=0 (calendar reference epoch).
 * Can be calculated from first observed moonrise or set to align with desired initial phase.
 */
export const DEFAULT_MOON_PHASE_OFFSET = 0;

// ===== ILLUMINATION STATE LABELS =====

export const ILLUMINATION_STATE = {
  DAYLIGHT: 'daylight',
  CIVIL_TWILIGHT: 'civil',
  NAUTICAL_TWILIGHT: 'nautical',
  ASTRONOMICAL_TWILIGHT: 'astronomical',
  NIGHT: 'night'
};

// ===== MOON PHASE NAMES =====

export const MOON_PHASES = [
  { name: 'New Moon',         icon: '🌑', minAngle: 0,   maxAngle: 22.5,  illumination: 0 },
  { name: 'Waxing Crescent',  icon: '🌒', minAngle: 22.5, maxAngle: 67.5,  illumination: 25 },
  { name: 'First Quarter',    icon: '🌓', minAngle: 67.5, maxAngle: 112.5, illumination: 50 },
  { name: 'Waxing Gibbous',   icon: '🌔', minAngle: 112.5, maxAngle: 157.5, illumination: 75 },
  { name: 'Full Moon',        icon: '🌕', minAngle: 157.5, maxAngle: 202.5, illumination: 100 },
  { name: 'Waning Gibbous',   icon: '🌖', minAngle: 202.5, maxAngle: 247.5, illumination: 75 },
  { name: 'Last Quarter',     icon: '🌗', minAngle: 247.5, maxAngle: 292.5, illumination: 50 },
  { name: 'Waning Crescent',  icon: '🌘', minAngle: 292.5, maxAngle: 360,   illumination: 25 }
];

// ===== CONVERSION FACTORS =====

/** Mathematical constant Pi */
export const PI = Math.PI;

/** Degrees to radians conversion factor */
export const DEG_TO_RAD = PI / 180;

/** Radians to degrees conversion factor */
export const RAD_TO_DEG = 180 / PI;
