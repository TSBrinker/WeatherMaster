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

// ===== WANDERER (FALLING STAR/METEORITE) CONSTANTS =====

/**
 * Wanderer event configuration.
 * Wanderers are rare falling stars made of magical material.
 * Events are deterministic based on region + date seed.
 */
export const WANDERER_CONFIG = {
  /** Daily probability of a streak event (visible falling star) */
  DAILY_STREAK_CHANCE: 0.04,  // ~14 per year

  /** Ratio of streaks that result in local falls (within region range) */
  LOCAL_FALL_RATIO: 0.14,  // ~14% of streaks = ~2 local falls per year

  /** Size distribution thresholds (cumulative probability) */
  SIZE_THRESHOLDS: {
    small: 0.70,    // 70% are small
    medium: 0.90,   // 20% are medium
    large: 0.98,    // 8% are large
    massive: 1.00   // 2% are massive
  },

  /** Distance range for local falls in miles */
  FALL_DISTANCE_MIN: 0.06,  // ~100 meters
  FALL_DISTANCE_MAX: 100,

  /** Cloud cover percentage that blocks visibility */
  CLOUD_COVER_VISIBILITY_THRESHOLD: 70,

  /** Days to scan ahead/behind for gate-based interruption */
  GATE_SCAN_DAYS: 60
};

/** Possible terrains where a Wanderer might land */
export const WANDERER_TERRAINS = [
  'Dense forest',
  'Open plains',
  'Rocky hills',
  'Marsh/wetlands',
  'River valley',
  'Farmland',
  'Mountain foothills',
  'Coastal area',
  'Desert scrubland',
  'Frozen tundra'
];

/** Size details for Wanderer crash sites */
export const WANDERER_SIZE_DETAILS = {
  small: {
    name: 'Small Fragment',
    valueDesc: 'A modest sum',
    typicalWeight: '1-10 lbs',
    interestLevel: 'Local curiosity'
  },
  medium: {
    name: 'Significant Deposit',
    valueDesc: 'A small fortune',
    typicalWeight: '10-100 lbs',
    interestLevel: 'Regional interest'
  },
  large: {
    name: 'Major Impact',
    valueDesc: 'Wealth enough to change lives',
    typicalWeight: '100-500 lbs',
    interestLevel: 'Multiple factions alerted'
  },
  massive: {
    name: 'Legendary Fall',
    valueDesc: 'Kingdom-altering wealth',
    typicalWeight: '500+ lbs',
    interestLevel: 'International dispute'
  }
};

/** Adventure hooks for Wanderer crash sites */
export const WANDERER_HOOKS = [
  'A rival party of adventurers is also searching',
  'Local lord claims all Wanderer falls as crown property',
  'The impact site is in dangerous monster territory',
  'A scholarly mage offers to buy the location information',
  'Rumors suggest the material is cursed',
  'A religious sect believes it to be a divine sign',
  'The fall created a small crater, now flooding',
  'Strange magical effects reported near the impact site',
  'A merchant caravan witnessed the fall and races to claim it',
  'Local druids consider the site sacred ground'
];

/** Cardinal and intercardinal directions */
export const COMPASS_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/**
 * Impact effects configuration for Wanderer events.
 * Uses compositional approach: sound + visual + physical components
 * combined based on size and distance.
 */
export const WANDERER_IMPACT_EFFECTS = {
  /** Distance thresholds in miles */
  DISTANCE_BANDS: {
    close: 1,      // < 1 mile
    near: 10,      // 1-10 miles
    far: Infinity  // 10+ miles
  },

  /** Sound descriptions by size and distance band */
  SOUND: {
    small: {
      close: 'A sharp crack splits the air, startlingly loud.',
      near: 'A distant boom echoes across the landscape.',
      far: 'A faint rumble, like distant thunder.'
    },
    medium: {
      close: 'A thunderous crack hammers your ears, the shockwave palpable.',
      near: 'A deep boom rolls across the land, rattling loose objects.',
      far: 'A low rumble reaches you, unmistakably not thunder.'
    },
    large: {
      close: 'A deafening BOOM slams into you like a physical wall. Your ears ring.',
      near: 'A massive thunderclap shakes the ground. Windows rattle for miles.',
      far: 'A powerful boom echoes from the horizon, audible for leagues.'
    },
    massive: {
      close: 'Reality splits with a sound beyond thunder. The pressure wave staggers you.',
      near: 'An apocalyptic boom shakes the earth. The sound alone is terrifying.',
      far: 'A tremendous roar rolls across the land, unmistakable and ominous.'
    }
  },

  /** Visual descriptions by size and distance band */
  VISUAL: {
    small: {
      close: 'A bright streak ends in a flash. A plume of dust rises.',
      near: 'A brief flash on the horizon, followed by a small dust cloud.',
      far: 'A faint flash in the distance, easily missed.'
    },
    medium: {
      close: 'A brilliant flash illuminates the area. Debris and dust billow upward.',
      near: 'A bright flash lights the sky, followed by a rising column of dust.',
      far: 'A flash on the horizon, followed by a visible dust plume.'
    },
    large: {
      close: 'Blinding light sears your vision. Earth and debris rain down around you.',
      near: 'The sky flashes white. A massive dust cloud mushrooms upward.',
      far: 'A brilliant flash on the horizon. A dark column rises against the sky.'
    },
    massive: {
      close: 'Impossible brightness—you look away too late. Debris rains for long seconds.',
      near: 'The flash turns night to day. A towering plume rises, visible for miles.',
      far: 'Even at this distance, the flash is stunning. The dust cloud dominates the horizon.'
    }
  },

  /** Physical effects by size and distance band */
  PHYSICAL: {
    small: {
      close: 'The ground trembles briefly. Nearby animals startle.',
      near: 'A faint vibration through the ground.',
      far: null  // No noticeable physical effect
    },
    medium: {
      close: 'The ground lurches. Loose items topple. Animals panic.',
      near: 'The ground shudders. Birds erupt from trees.',
      far: 'A slight vibration, barely perceptible.'
    },
    large: {
      close: 'The shockwave staggers you. The ground heaves. Structures creak.',
      near: 'A strong tremor shakes the area. Unsecured objects fall.',
      far: 'The ground trembles noticeably. Animals grow restless.'
    },
    massive: {
      close: 'You are thrown from your feet. The earth convulses. Destruction radiates outward.',
      near: 'A violent tremor. Structures groan. Cracks appear in stone.',
      far: 'A significant earthquake felt clearly. Animals flee in panic.'
    }
  },

  /** Suggested mechanical effects (optional DM guidance) */
  MECHANICS: {
    small: {
      close: null,
      near: null,
      far: null
    },
    medium: {
      close: 'Animals within earshot are spooked; mounts may require calming (DC 10 Animal Handling).',
      near: null,
      far: null
    },
    large: {
      close: 'DC 13 DEX save or knocked prone. DC 13 CON save or deafened for 1 minute. Mounts bolt unless controlled (DC 15).',
      near: 'Creatures may be startled. Mounts require calming (DC 12 Animal Handling).',
      far: null
    },
    massive: {
      close: 'DC 15 DEX save or knocked prone and take 2d6 bludgeoning from debris. Deafened 1d4 minutes (no save). Structures within 500ft take damage. Fires likely.',
      near: 'DC 12 DEX save or knocked prone from tremor. Mounts bolt (DC 15 to control). Loose structures may collapse.',
      far: 'Creatures feel the earthquake. Animals are unsettled for hours.'
    }
  }
};
