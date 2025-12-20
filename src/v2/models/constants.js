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
 * - Central (disc center) = shortest days / permanent night
 * - Rim (disc edge) = longest days
 */
export const LATITUDE_BAND_RADIUS = {
  central:    700,   // 10% of disc radius (center region) - shortest days
  subarctic:  2100,  // 30% of disc radius
  temperate:  3500,  // 50% of disc radius
  tropical:   4900,  // 70% of disc radius
  rim:        6300   // 90% of disc radius (edge region) - longest days
};

/**
 * Maps latitude band names to their range boundaries [min, max] in miles from disc center.
 */
export const LATITUDE_BAND_RANGES = {
  central:    [0,    1400],  // 0% - 20% of radius
  subarctic:  [1400, 2800],  // 20% - 40%
  temperate:  [2800, 4200],  // 40% - 60%
  tropical:   [4200, 5600],  // 60% - 80%
  rim:        [5600, 7000]   // 80% - 100%
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
