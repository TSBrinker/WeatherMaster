// src/v2/utils/narrativeWeather.js
// Generates evocative, DM-friendly weather descriptions using templated composition

import { getSeason } from './dateUtils';

/**
 * Temperature bands with narrative phrasings
 * Each band has multiple phrasings for variety, plus season-aware variants
 */
const TEMPERATURE_BANDS = {
  deadly: {
    range: [-Infinity, -20],
    label: 'Deadly Cold',
    character: 'Frostbite in minutes',
    phrasings: [
      'a killing cold grips the land',
      'the air itself seems to freeze',
      'deadly cold seeps into everything',
      'the cold is lethal, biting to the bone'
    ],
    seasonVariants: {
      winter: ['the depths of winter bring murderous cold'],
      spring: ['an unseasonable deadly cold lingers'],
      summer: null, // Unlikely, use default
      fall: ['an early killing frost descends']
    }
  },
  dangerous: {
    range: [-20, 0],
    label: 'Dangerous Cold',
    character: 'Frostbite risk',
    phrasings: [
      'dangerous cold blankets the area',
      'the bitter cold threatens exposed flesh',
      'a harsh, biting cold fills the air',
      'the frigid air burns the lungs'
    ],
    seasonVariants: {
      winter: ['winter shows its cruel face'],
      spring: ['winter refuses to release its grip'],
      summer: null,
      fall: ['an early and dangerous cold arrives']
    }
  },
  bitter: {
    range: [0, 20],
    label: 'Bitter Cold',
    character: 'Gear required',
    phrasings: [
      'bitter cold hangs in the air',
      'the chill cuts through clothing',
      'frost clings to every surface',
      'breath hangs visible in the frigid air'
    ],
    seasonVariants: {
      winter: ['typical winter cold settles in'],
      spring: ["winter's chill hasn't fully lifted"],
      summer: null,
      fall: ['autumn gives way to bitter cold']
    }
  },
  cold: {
    range: [20, 40],
    label: 'Cold',
    character: 'Cloak weather',
    phrasings: [
      'a persistent chill fills the air',
      'the cold demands warm clothing',
      'a brisk chill hangs over the land',
      'the air carries winter in its breath'
    ],
    seasonVariants: {
      winter: ['the cold is typical for the season'],
      spring: ['a cool spring day with lingering chill'],
      summer: ['an unusually cold spell brings relief'],
      fall: ['autumn brings its familiar chill']
    }
  },
  cool: {
    range: [40, 55],
    label: 'Cool',
    character: 'Light layers',
    phrasings: [
      'a cool breeze stirs the air',
      'the weather is crisp and invigorating',
      'a pleasant coolness settles over the land',
      'the air is fresh and bracing'
    ],
    seasonVariants: {
      winter: ['a mild winter day offers respite'],
      spring: ['typical spring weather, cool but pleasant'],
      summer: ['a cool break from summer heat'],
      fall: ['crisp autumn air fills the lungs']
    }
  },
  mild: {
    range: [55, 70],
    label: 'Mild',
    character: 'Comfortable',
    phrasings: [
      'the weather is mild and pleasant',
      'comfortable temperatures prevail',
      'the air is neither hot nor cold',
      'agreeable weather graces the day'
    ],
    seasonVariants: {
      winter: ['an unusually mild winter day'],
      spring: ['perfect spring weather'],
      summer: ['pleasantly mild for summer'],
      fall: ['mild autumn weather lingers']
    }
  },
  warm: {
    range: [70, 85],
    label: 'Warm',
    character: 'Pleasant',
    phrasings: [
      'warmth fills the air',
      'the day is pleasantly warm',
      'a comfortable warmth settles in',
      'warm weather invites outdoor activity'
    ],
    seasonVariants: {
      winter: ['unseasonable warmth breaks the winter chill'],
      spring: ['warm spring weather arrives'],
      summer: ['typical summer warmth'],
      fall: ['lingering summer warmth persists']
    }
  },
  hot: {
    range: [85, 100],
    label: 'Hot',
    character: 'Shade precious',
    phrasings: [
      'heat shimmers in the air',
      'the day is sweltering',
      'oppressive heat bears down',
      'the heat is inescapable'
    ],
    seasonVariants: {
      winter: null, // Unlikely
      spring: ['unseasonable heat arrives early'],
      summer: ['summer heat is in full force'],
      fall: ['a late heat wave lingers']
    }
  },
  scorching: {
    range: [100, Infinity],
    label: 'Scorching',
    character: 'Dangerous heat',
    phrasings: [
      'scorching heat dominates the day',
      'the heat is nearly unbearable',
      'punishing heat radiates from every surface',
      'the air itself feels like fire'
    ],
    seasonVariants: {
      winter: null,
      spring: null,
      summer: ['the summer sun is merciless'],
      fall: null
    }
  }
};

/**
 * Time-of-day phrases for different periods
 */
const TIME_PHRASES = {
  // 0-4: Deep night
  deepNight: {
    hours: [0, 1, 2, 3, 4],
    phrasings: [
      'In the deep of night,',
      'During the dark hours,',
      'In the quiet of night,',
      'While darkness holds sway,'
    ]
  },
  // 5-6: Dawn
  dawn: {
    hours: [5, 6],
    phrasings: [
      'As dawn breaks,',
      'With the first light,',
      'As the sun crests the horizon,',
      'In the pale morning light,'
    ]
  },
  // 7-11: Morning
  morning: {
    hours: [7, 8, 9, 10, 11],
    phrasings: [
      'This morning,',
      'As the morning progresses,',
      'In the morning hours,',
      'Through the morning,'
    ]
  },
  // 12-13: Midday
  midday: {
    hours: [12, 13],
    phrasings: [
      'At midday,',
      'Under the noon sun,',
      'As the sun reaches its peak,',
      'At the height of day,'
    ]
  },
  // 14-17: Afternoon
  afternoon: {
    hours: [14, 15, 16, 17],
    phrasings: [
      'This afternoon,',
      'As the afternoon wears on,',
      'In the afternoon hours,',
      'Through the afternoon,'
    ]
  },
  // 18-20: Evening/Dusk
  evening: {
    hours: [18, 19, 20],
    phrasings: [
      'As evening falls,',
      'With the setting sun,',
      'As dusk approaches,',
      'In the fading light,'
    ]
  },
  // 21-23: Night
  night: {
    hours: [21, 22, 23],
    phrasings: [
      'As night settles in,',
      'Under the evening sky,',
      'With nightfall,',
      'As darkness gathers,'
    ]
  }
};

/**
 * Condition phrases for weather types
 */
const CONDITION_PHRASES = {
  'Clear': [
    'clear skies stretch overhead',
    'not a cloud mars the sky',
    'the sky is perfectly clear',
    'brilliant blue dominates above'
  ],
  'Partly Cloudy': [
    'scattered clouds drift across the sky',
    'clouds occasionally shade the sun',
    'a partly cloudy sky prevails',
    'patches of cloud dot the blue'
  ],
  'Cloudy': [
    'clouds blanket the sky',
    'grey clouds hang overhead',
    'an overcast sky looms',
    'clouds obscure the heavens'
  ],
  'Overcast': [
    'thick clouds blot out the sky',
    'a heavy grey ceiling hangs low',
    'the sky is a solid sheet of grey',
    'oppressive clouds press down'
  ],
  'Light Rain': [
    'a gentle rain falls',
    'light rain patters softly',
    'a drizzle mists the air',
    'soft rain dampens everything'
  ],
  'Rain': [
    'rain falls steadily',
    'a steady rain drums down',
    'rain washes over the land',
    'persistent rain soaks through'
  ],
  'Heavy Rain': [
    'heavy rain pounds down',
    'rain lashes the landscape',
    'torrential rain obscures vision',
    'sheets of rain sweep across'
  ],
  'Light Snow': [
    'light snow drifts down',
    'gentle flurries dance in the air',
    'a dusting of snow falls',
    'soft snow floats lazily down'
  ],
  'Snow': [
    'snow falls steadily',
    'snowflakes blanket the ground',
    'snow accumulates quietly',
    'a steady snowfall continues'
  ],
  'Heavy Snow': [
    'heavy snow reduces visibility',
    'thick snow falls relentlessly',
    'a heavy snowfall buries everything',
    'snow piles up rapidly'
  ],
  'Blizzard': [
    'a howling blizzard rages',
    'blinding snow and wind assault all',
    'the blizzard makes travel deadly',
    'whiteout conditions prevail'
  ],
  'Thunderstorm': [
    'thunder rolls across the sky',
    'lightning splits the darkness',
    'a thunderstorm unleashes its fury',
    'the storm rages overhead'
  ],
  'Fog': [
    'thick fog shrouds everything',
    'visibility drops to mere feet',
    'an impenetrable fog settles in',
    'fog swallows the landscape'
  ],
  'Mist': [
    'a light mist hangs in the air',
    'mist softens distant shapes',
    'gentle mist drifts through',
    'a hazy mist obscures the view'
  ],
  'Sleet': [
    'sleet rattles against surfaces',
    'icy pellets sting exposed skin',
    'a miserable sleet falls',
    'sleet makes footing treacherous'
  ],
  'Freezing Rain': [
    'freezing rain coats everything in ice',
    'ice accumulates on every surface',
    'treacherous freezing rain falls',
    'a glaze of ice forms everywhere'
  ]
};

/**
 * Precipitation progression phases
 * These override the default condition phrases when progression is detected
 */
const PRECIPITATION_PROGRESSION = {
  // Precipitation just started this hour
  onset: {
    'Light Rain': ['rain begins to fall', 'the first drops of rain appear', 'a light rain starts'],
    'Rain': ['rain begins in earnest', 'the rain starts to fall', 'rain moves in'],
    'Heavy Rain': ['heavy rain sweeps in', 'a downpour begins', 'the heavens open up'],
    'Light Snow': ['snow begins to fall', 'the first flakes drift down', 'snow starts to dust the ground'],
    'Snow': ['snow begins falling steadily', 'the snowfall begins', 'snow starts to accumulate'],
    'Heavy Snow': ['heavy snow sweeps in', 'a major snowfall begins', 'thick snow starts falling'],
    'Sleet': ['sleet begins rattling down', 'icy pellets start falling', 'sleet moves in'],
    'Freezing Rain': ['freezing rain begins coating surfaces', 'ice starts forming', 'freezing rain moves in'],
    'Thunderstorm': ['thunder rumbles as a storm moves in', 'a thunderstorm rolls in', 'lightning flashes as the storm arrives'],
    'Blizzard': ['a blizzard descends', 'blizzard conditions set in', 'the blizzard arrives with fury'],
    'Fog': ['fog rolls in', 'mist begins to gather', 'visibility starts dropping as fog forms'],
    'Mist': ['a mist begins forming', 'haze starts to gather', 'mist drifts in']
  },
  // Precipitation stopping this hour
  clearing: {
    'Clear': ['the skies clear', 'clouds part to reveal blue sky', 'the weather clears'],
    'Partly Cloudy': ['the precipitation tapers off', 'the rain eases to nothing', 'conditions improve'],
    'Cloudy': ['the precipitation ends, though clouds remain', 'the rain stops but grey skies linger']
  },
  // Precipitation intensifying (light→moderate or moderate→heavy)
  intensifying: {
    'Rain': ['the rain picks up', 'rain intensifies', 'the rainfall grows heavier'],
    'Heavy Rain': ['the rain intensifies to a downpour', 'the storm strengthens', 'rain hammers down harder'],
    'Snow': ['the snow picks up', 'snowfall intensifies', 'snow falls more heavily now'],
    'Heavy Snow': ['the snowfall intensifies dramatically', 'snow comes down harder', 'visibility drops as snow thickens'],
    'Thunderstorm': ['the storm intensifies', 'thunder grows closer', 'the tempest strengthens'],
    'Blizzard': ['the blizzard worsens', 'conditions deteriorate further', 'the storm reaches its peak']
  },
  // Precipitation easing (heavy→moderate or moderate→light)
  easing: {
    'Light Rain': ['the rain eases to a drizzle', 'rain lightens', 'the downpour subsides to a gentle rain'],
    'Rain': ['the heavy rain eases', 'the storm weakens', 'rain slackens'],
    'Light Snow': ['the snow lightens to flurries', 'snowfall eases', 'the heavy snow tapers off'],
    'Snow': ['the heavy snow eases', 'snowfall lightens', 'the blizzard weakens to steady snow']
  }
};

/**
 * Precipitation type transitions
 * When precipitation changes from one type to another
 */
const TYPE_TRANSITIONS = {
  // Rain turning to frozen precipitation (temperature dropping)
  'rain-to-sleet': [
    'the rain turns to sleet as temperatures drop',
    'rain gives way to stinging sleet',
    'ice pellets begin mixing with the rain'
  ],
  'rain-to-snow': [
    'the rain turns to snow',
    'raindrops give way to snowflakes',
    'as temperatures fall, rain becomes snow'
  ],
  'rain-to-freezing-rain': [
    'the rain begins freezing on contact',
    'ice starts glazing every surface as freezing rain sets in',
    'dangerous freezing rain replaces the rain'
  ],
  // Snow changing to other types (temperature rising)
  'snow-to-sleet': [
    'snow mixes with sleet',
    'the snow turns to icy pellets',
    'sleet replaces the falling snow'
  ],
  'snow-to-rain': [
    'the snow turns to rain as temperatures rise',
    'snowflakes give way to raindrops',
    'warming air changes snow to rain'
  ],
  'snow-to-freezing-rain': [
    'snow gives way to freezing rain',
    'the snow changes to ice-coating rain',
    'dangerous freezing rain replaces the snow'
  ],
  // Sleet transitions
  'sleet-to-snow': [
    'the sleet turns to snow',
    'ice pellets give way to snowflakes',
    'snow replaces the sleet'
  ],
  'sleet-to-rain': [
    'the sleet turns to rain',
    'ice pellets become raindrops',
    'sleet gives way to rain as temperatures rise'
  ],
  // Freezing rain transitions
  'freezing-rain-to-rain': [
    'the freezing rain becomes regular rain',
    'temperatures rise enough to end the ice accumulation',
    'rain replaces the dangerous freezing rain'
  ],
  'freezing-rain-to-sleet': [
    'freezing rain changes to sleet',
    'the ice storm transitions to sleet',
    'sleet replaces the freezing rain'
  ]
};

/**
 * Biome-aware flavor phrases (optional additions)
 * Each biome should have 3+ variants per category to avoid repetition
 */
const BIOME_FLAVORS = {
  'tundra': {
    cold: [
      'even for these frozen wastes',
      'typical for the tundra',
      'as expected in this barren land',
      'the permafrost lies silent beneath'
    ],
    warm: [
      'unusual warmth for the tundra',
      'a rare respite from the eternal cold',
      'the brief thaw softens the frozen earth',
      'hardy flowers dare to bloom'
    ],
    default: [
      'across the treeless expanse',
      'the wind sweeps unbroken across the tundra',
      'lichen and moss cling to the stones'
    ]
  },
  'desert': {
    hot: [
      'as expected in these arid lands',
      'the desert shows no mercy',
      'typical for the wastes',
      'heat rises in shimmering waves'
    ],
    cold: [
      'the desert night reveals its other face',
      'surprising cold for the desert',
      'the sands hold no warmth',
      'starlight illuminates the cooling dunes'
    ],
    default: [
      'sand stretches to every horizon',
      'the dry wind carries fine grit',
      'nothing stirs in the barren expanse'
    ]
  },
  'boreal-forest': {
    cold: [
      'the northern forest offers little shelter',
      'cold seeps through the pines',
      'frost rimes the needles of countless evergreens',
      'the taiga lies frozen and still'
    ],
    mild: [
      'a pleasant day among the evergreens',
      'sunlight filters through the pine canopy',
      'the boreal woods feel almost welcoming'
    ],
    default: [
      'the scent of pine fills the air',
      'endless conifers march toward the horizon',
      'the forest floor lies thick with needles'
    ]
  },
  'temperate-deciduous': {
    spring: ['new growth stirs in the forest', 'buds swell on the branches', 'the forest awakens'],
    summer: ['the canopy forms a verdant ceiling', 'dappled sunlight plays on the forest floor', 'leaves rustle in the warm breeze'],
    fall: ['leaves turn and fall around you', 'autumn colors paint the canopy', 'fallen leaves carpet the ground'],
    winter: ['bare branches scratch the grey sky', 'the skeletal trees stand silent', 'frost clings to dormant boughs']
  },
  'tropical-rainforest': {
    default: [
      'humidity clings to everything',
      'the jungle air is thick and heavy',
      'the canopy teems with hidden life',
      'vines drape from every branch'
    ],
    hot: [
      'the jungle swelters under tropical heat',
      'steam rises from the verdant undergrowth',
      'the rainforest bakes beneath the sun'
    ],
    rain: [
      'water drips from every leaf',
      'the jungle drinks deeply',
      'rain patters on the broad leaves above'
    ]
  },
  'tropical-seasonal': {
    dry: [
      'the dry season has parched the land',
      'dust coats the broad leaves',
      'the forest waits for the rains'
    ],
    wet: [
      'the monsoon brings life-giving water',
      'the wet season is in full force',
      'rain feeds the hungry jungle'
    ],
    default: [
      'the tropical forest buzzes with life',
      'exotic birds call from the canopy',
      'warm air carries the scent of blossoms'
    ]
  },
  'temperate-grassland': {
    spring: [
      'wildflowers dot the awakening prairie',
      'new grass shoots push through the soil',
      'the plains come alive with color'
    ],
    summer: [
      'tall grasses ripple like waves',
      'the prairie stretches endlessly',
      'grasshoppers leap through the golden stems'
    ],
    fall: [
      'the grasses turn amber and gold',
      'seed heads bow in the autumn wind',
      'the prairie prepares for winter'
    ],
    winter: [
      'brown grass pokes through the snow',
      'the wind races unimpeded across the plains',
      'the frozen grassland lies dormant'
    ],
    default: [
      'the open grassland rolls to the horizon',
      'wind whispers through the tall grass',
      'no trees break the endless vista'
    ]
  },
  'temperate-rainforest': {
    default: [
      'moss drapes every surface in green',
      'ancient trees tower overhead',
      'ferns carpet the forest floor',
      'mist drifts between the giant trunks'
    ],
    rain: [
      'rain is a constant companion here',
      'water trickles down moss-covered bark',
      'the forest drinks the ever-present moisture'
    ],
    mild: [
      'the temperate forest feels serene',
      'cool, damp air fills the lungs',
      'the old-growth forest stands timeless'
    ]
  },
  'boreal-grassland': {
    cold: [
      'the northern meadow lies frozen',
      'frost sparkles on the hardy grasses',
      'the subarctic steppe endures the cold'
    ],
    summer: [
      'the brief summer brings a flush of green',
      'wildflowers bloom in the northern meadow',
      'the grassland makes the most of the warm days'
    ],
    default: [
      'the boreal meadow stretches beneath vast skies',
      'grasses and sedges dominate the landscape',
      'the northern plains feel exposed and wild'
    ]
  },
  'ocean': {
    default: [
      'salt spray carries on the wind',
      'the sea stretches to the horizon',
      'waves roll endlessly beneath the sky',
      'the briny air fills every breath'
    ],
    calm: [
      'the sea lies glassy and calm',
      'gentle swells rock the water',
      'the ocean breathes slowly today'
    ],
    stormy: [
      'whitecaps churn across the water',
      'the sea grows restless',
      'waves crash with building fury'
    ]
  },
  'savanna': {
    dry: [
      'the golden grasses rustle in the heat',
      'scattered trees offer precious shade',
      'dust devils dance across the plain'
    ],
    wet: [
      'the rains have transformed the savanna',
      'green grass spreads between the acacias',
      'watering holes overflow with life'
    ],
    hot: [
      'heat shimmers above the dry grass',
      'animals seek shade beneath scattered trees',
      'the African sun beats down relentlessly'
    ],
    default: [
      'the savanna stretches vast and open',
      'acacia trees dot the grassland',
      'the wide plain feels ancient and wild'
    ]
  }
};

/**
 * Precipitation types for comparison
 */
const PRECIP_TYPES = ['Light Rain', 'Rain', 'Heavy Rain', 'Light Snow', 'Snow', 'Heavy Snow', 'Sleet', 'Freezing Rain', 'Thunderstorm', 'Blizzard'];
const RAIN_TYPES = ['Light Rain', 'Rain', 'Heavy Rain'];
const SNOW_TYPES = ['Light Snow', 'Snow', 'Heavy Snow', 'Blizzard'];

/**
 * Detect precipitation progression by comparing current and previous weather
 * @param {Object} current - Current weather state
 * @param {Object} previous - Previous hour's weather state
 * @returns {Object} Progression info: { phase, transition, phrases }
 */
export function detectProgression(current, previous) {
  if (!current || !previous) {
    return { phase: 'steady', transition: null };
  }

  const currCondition = current.condition;
  const prevCondition = previous.condition;
  const currIsPrecip = PRECIP_TYPES.includes(currCondition);
  const prevIsPrecip = PRECIP_TYPES.includes(prevCondition);

  // Check for type transition (rain→snow, etc.)
  const transition = detectTypeTransition(prevCondition, currCondition);
  if (transition) {
    return { phase: 'transition', transition };
  }

  // Precipitation just started
  if (currIsPrecip && !prevIsPrecip) {
    return { phase: 'onset', transition: null };
  }

  // Precipitation just ended
  if (!currIsPrecip && prevIsPrecip) {
    return { phase: 'clearing', transition: null };
  }

  // Check intensity changes within same precipitation family
  const intensityChange = detectIntensityChange(prevCondition, currCondition);
  if (intensityChange) {
    return { phase: intensityChange, transition: null };
  }

  // No significant change
  return { phase: 'steady', transition: null };
}

/**
 * Detect type transitions between precipitation types
 */
function detectTypeTransition(prevCondition, currCondition) {
  // Normalize to base type for comparison
  const prevBase = getBaseType(prevCondition);
  const currBase = getBaseType(currCondition);

  if (!prevBase || !currBase || prevBase === currBase) {
    return null;
  }

  const transitionKey = `${prevBase}-to-${currBase}`;
  if (TYPE_TRANSITIONS[transitionKey]) {
    return transitionKey;
  }

  return null;
}

/**
 * Get base precipitation type for transition detection
 */
function getBaseType(condition) {
  if (RAIN_TYPES.includes(condition)) return 'rain';
  if (SNOW_TYPES.includes(condition)) return 'snow';
  if (condition === 'Sleet') return 'sleet';
  if (condition === 'Freezing Rain') return 'freezing-rain';
  return null;
}

/**
 * Detect intensity changes (light→moderate→heavy or reverse)
 */
function detectIntensityChange(prevCondition, currCondition) {
  const intensityLevels = {
    'Light Rain': 1, 'Rain': 2, 'Heavy Rain': 3,
    'Light Snow': 1, 'Snow': 2, 'Heavy Snow': 3, 'Blizzard': 4
  };

  const prevLevel = intensityLevels[prevCondition];
  const currLevel = intensityLevels[currCondition];

  if (prevLevel === undefined || currLevel === undefined) {
    return null;
  }

  // Must be same family (rain or snow)
  const prevIsRain = RAIN_TYPES.includes(prevCondition);
  const currIsRain = RAIN_TYPES.includes(currCondition);
  const prevIsSnow = SNOW_TYPES.includes(prevCondition);
  const currIsSnow = SNOW_TYPES.includes(currCondition);

  if ((prevIsRain && currIsRain) || (prevIsSnow && currIsSnow)) {
    if (currLevel > prevLevel) return 'intensifying';
    if (currLevel < prevLevel) return 'easing';
  }

  return null;
}

/**
 * Get the temperature band for a given temperature
 */
function getTemperatureBand(temp) {
  for (const [key, band] of Object.entries(TEMPERATURE_BANDS)) {
    if (temp >= band.range[0] && temp < band.range[1]) {
      return { key, ...band };
    }
  }
  return TEMPERATURE_BANDS.mild; // Fallback
}

/**
 * Get time period from hour, optionally using actual sunrise/sunset times
 * @param {number} hour - Current hour (0-23)
 * @param {number} [sunriseHour] - Hour of sunrise (decimal, e.g., 6.5 = 6:30 AM)
 * @param {number} [sunsetHour] - Hour of sunset (decimal, e.g., 18.75 = 6:45 PM)
 * @returns {Object} Time period data with phrasings
 */
function getTimePeriod(hour, sunriseHour, sunsetHour) {
  // If we have actual sunrise/sunset times, use dynamic periods
  if (sunriseHour != null && sunsetHour != null) {
    return getDynamicTimePeriod(hour, sunriseHour, sunsetHour);
  }

  // Fallback to static hour-based periods
  for (const [period, data] of Object.entries(TIME_PHRASES)) {
    if (data.hours.includes(hour)) {
      return { period, ...data };
    }
  }
  return TIME_PHRASES.morning; // Fallback
}

/**
 * Calculate time period dynamically based on actual sunrise/sunset
 * Divides the day into meaningful segments relative to sun position
 *
 * Time periods:
 * - deepNight: midnight to 1 hour before sunrise
 * - dawn: 1 hour before sunrise to sunrise
 * - morning: sunrise to midday
 * - midday: 2 hours centered on solar noon
 * - afternoon: midday to 1 hour before sunset
 * - evening: 1 hour before sunset to 1 hour after sunset
 * - night: 1 hour after sunset to midnight
 *
 * @param {number} hour - Current hour (0-23)
 * @param {number} sunriseHour - Hour of sunrise (decimal)
 * @param {number} sunsetHour - Hour of sunset (decimal)
 * @returns {Object} Time period data with phrasings
 */
function getDynamicTimePeriod(hour, sunriseHour, sunsetHour) {
  // Calculate solar noon (midpoint between sunrise and sunset)
  const solarNoon = (sunriseHour + sunsetHour) / 2;

  // Define period boundaries
  const dawnStart = sunriseHour - 1;        // 1 hour before sunrise
  const morningStart = sunriseHour;          // sunrise
  const middayStart = solarNoon - 1;         // 1 hour before solar noon
  const middayEnd = solarNoon + 1;           // 1 hour after solar noon
  const eveningStart = sunsetHour - 1;       // 1 hour before sunset
  const nightStart = sunsetHour + 1;         // 1 hour after sunset

  // Determine which period we're in
  if (hour >= nightStart || hour < dawnStart) {
    // Deep night: from 1hr after sunset to 1hr before sunrise
    // Handle wraparound: if nightStart is 20 and dawnStart is 5,
    // then hours 20-23 and 0-4 are deep night
    if (hour >= nightStart || hour < dawnStart - 1) {
      return { period: 'deepNight', ...TIME_PHRASES.deepNight };
    }
  }

  if (hour >= dawnStart && hour < morningStart) {
    return { period: 'dawn', ...TIME_PHRASES.dawn };
  }

  if (hour >= morningStart && hour < middayStart) {
    return { period: 'morning', ...TIME_PHRASES.morning };
  }

  if (hour >= middayStart && hour < middayEnd) {
    return { period: 'midday', ...TIME_PHRASES.midday };
  }

  if (hour >= middayEnd && hour < eveningStart) {
    return { period: 'afternoon', ...TIME_PHRASES.afternoon };
  }

  if (hour >= eveningStart && hour < nightStart) {
    return { period: 'evening', ...TIME_PHRASES.evening };
  }

  // After sunset but before deep night (first hour after sunset)
  if (hour >= nightStart) {
    return { period: 'night', ...TIME_PHRASES.night };
  }

  // Fallback for edge cases
  return { period: 'night', ...TIME_PHRASES.night };
}

/**
 * Seeded random selection from array
 * Uses simple hash for deterministic but varied selection
 */
function seededSelect(array, seed) {
  if (!array || array.length === 0) return null;
  const hash = Math.abs(seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
  return array[hash % array.length];
}

/**
 * Generate a narrative weather description
 *
 * @param {Object} options
 * @param {number} options.temperature - Temperature in Fahrenheit
 * @param {string} options.condition - Weather condition string
 * @param {number} options.hour - Hour of day (0-23)
 * @param {number} options.month - Month (1-12)
 * @param {string} [options.biome] - Biome type for flavor text
 * @param {string} [options.seed] - Seed for consistent random selection
 * @param {number} [options.variant] - Force specific variant (0-based index)
 * @param {Object} [options.progression] - Progression info from detectProgression()
 * @param {number} [options.sunriseHour] - Hour of sunrise (decimal) for dynamic time periods
 * @param {number} [options.sunsetHour] - Hour of sunset (decimal) for dynamic time periods
 * @returns {Object} Narrative result with parts labeled
 */
export function generateNarrative(options) {
  const { temperature, condition, hour, month, biome, seed = '', variant, progression, sunriseHour, sunsetHour } = options;

  const season = getSeason(month);
  const tempBand = getTemperatureBand(temperature);
  const timePeriod = getTimePeriod(hour, sunriseHour, sunsetHour);

  // Select phrasings (use variant if provided, otherwise seed-based selection)
  const selectFrom = (array, category) => {
    if (!array || array.length === 0) return null;
    if (variant !== undefined) {
      return array[variant % array.length];
    }
    return seededSelect(array, `${seed}-${category}`);
  };

  // Time phrase
  const timePhrase = selectFrom(timePeriod.phrasings, 'time');

  // Temperature phrase - prefer season variant if available
  const seasonVariants = tempBand.seasonVariants?.[season];
  let tempPhrase;
  if (seasonVariants && seasonVariants.length > 0) {
    tempPhrase = selectFrom(seasonVariants, 'temp-season');
  } else {
    tempPhrase = selectFrom(tempBand.phrasings, 'temp');
  }

  // Condition phrase - check for progression-aware alternatives
  let conditionPhrase;
  let progressionUsed = null;

  if (progression && progression.phase !== 'steady') {
    // Type transition takes priority (rain→snow, etc.)
    if (progression.phase === 'transition' && progression.transition) {
      const transitionPhrases = TYPE_TRANSITIONS[progression.transition];
      if (transitionPhrases) {
        conditionPhrase = selectFrom(transitionPhrases, 'transition');
        progressionUsed = `transition: ${progression.transition}`;
      }
    }
    // Then check onset/clearing/intensifying/easing
    if (!conditionPhrase && PRECIPITATION_PROGRESSION[progression.phase]) {
      const phasePhrases = PRECIPITATION_PROGRESSION[progression.phase][condition];
      if (phasePhrases) {
        conditionPhrase = selectFrom(phasePhrases, 'progression');
        progressionUsed = progression.phase;
      }
    }
  }

  // Fall back to default condition phrase
  if (!conditionPhrase) {
    const conditionPhrases = CONDITION_PHRASES[condition] || CONDITION_PHRASES['Cloudy'];
    conditionPhrase = selectFrom(conditionPhrases, 'condition');
  }

  // Optional biome flavor - only appears ~25% of the time to avoid repetition
  let biomePhrase = null;
  if (biome && BIOME_FLAVORS[biome]) {
    // Use seed to deterministically decide if biome flavor appears
    const biomeChance = seededSelect(['show', 'skip', 'skip', 'skip'], `${seed}-biome-chance`);
    if (biomeChance === 'show' || variant !== undefined) { // Always show in test harness when cycling variants
      const biomeFlavors = BIOME_FLAVORS[biome];
      // Check for context-appropriate flavor in priority order:
      // 1. Temperature extremes (cold/hot)
      // 2. Weather condition (rain/stormy/calm/dry/wet)
      // 3. Season
      // 4. Mild temperature
      // 5. Default fallback
      const isRaining = PRECIP_TYPES.includes(condition) && !SNOW_TYPES.includes(condition);
      const isStormy = ['Thunderstorm', 'Heavy Rain', 'Blizzard'].includes(condition);
      const isCalm = ['Clear', 'Partly Cloudy'].includes(condition);
      const isDry = ['Clear', 'Partly Cloudy', 'Cloudy'].includes(condition) && temperature > 70;
      const isWet = PRECIP_TYPES.includes(condition);

      if (temperature < 32 && biomeFlavors.cold) {
        biomePhrase = selectFrom(biomeFlavors.cold, 'biome');
      } else if (temperature > 85 && biomeFlavors.hot) {
        biomePhrase = selectFrom(biomeFlavors.hot, 'biome');
      } else if (isRaining && biomeFlavors.rain) {
        biomePhrase = selectFrom(biomeFlavors.rain, 'biome');
      } else if (isStormy && biomeFlavors.stormy) {
        biomePhrase = selectFrom(biomeFlavors.stormy, 'biome');
      } else if (isCalm && biomeFlavors.calm) {
        biomePhrase = selectFrom(biomeFlavors.calm, 'biome');
      } else if (isDry && biomeFlavors.dry) {
        biomePhrase = selectFrom(biomeFlavors.dry, 'biome');
      } else if (isWet && biomeFlavors.wet) {
        biomePhrase = selectFrom(biomeFlavors.wet, 'biome');
      } else if (biomeFlavors[season]) {
        biomePhrase = selectFrom(biomeFlavors[season], 'biome');
      } else if (temperature >= 55 && temperature <= 75 && biomeFlavors.mild) {
        biomePhrase = selectFrom(biomeFlavors.mild, 'biome');
      } else if (biomeFlavors.default) {
        biomePhrase = selectFrom(biomeFlavors.default, 'biome');
      }
    }
  }

  // Compose the full narrative
  // Pattern: "[Time phrase] [temp phrase], [condition phrase]."
  // Or with biome: "[Time phrase] [temp phrase], [condition phrase] — [biome flavor]."
  let narrative = `${timePhrase} ${tempPhrase}, ${conditionPhrase}.`;
  if (biomePhrase) {
    // Replace the period with the biome addition
    narrative = `${timePhrase} ${tempPhrase}, ${conditionPhrase} — ${biomePhrase}.`;
  }

  // Capitalize first letter after the time phrase's comma if needed
  narrative = narrative.charAt(0).toUpperCase() + narrative.slice(1);

  return {
    narrative,
    parts: {
      time: timePhrase,
      temperature: tempPhrase,
      condition: conditionPhrase,
      biome: biomePhrase,
      progression: progressionUsed
    },
    metadata: {
      temperatureBand: tempBand.label,
      temperatureCharacter: tempBand.character,
      timePeriod: timePeriod.period,
      season,
      actualTemp: temperature,
      progressionPhase: progression?.phase || 'steady'
    }
  };
}

/**
 * Get all available temperature bands for reference
 */
export function getTemperatureBands() {
  return Object.entries(TEMPERATURE_BANDS).map(([key, band]) => ({
    key,
    label: band.label,
    range: band.range,
    character: band.character,
    examplePhrase: band.phrasings[0]
  }));
}

/**
 * Get all available conditions
 */
export function getConditions() {
  return Object.keys(CONDITION_PHRASES);
}

/**
 * Get all time periods
 */
export function getTimePeriods() {
  return Object.entries(TIME_PHRASES).map(([key, data]) => ({
    key,
    hours: data.hours,
    examplePhrase: data.phrasings[0]
  }));
}

/**
 * Get count of variations available for current settings
 * (for the "cycle variations" feature in test harness)
 */
export function getVariationCount(options) {
  const { temperature, condition, month } = options;
  const tempBand = getTemperatureBand(temperature);
  const season = getSeason(month);

  // Count available phrasings for each component
  const timePhraseCount = 4; // All time periods have 4 options
  const seasonVariants = tempBand.seasonVariants?.[season];
  const tempPhraseCount = (seasonVariants?.length || 0) || tempBand.phrasings.length;
  const conditionPhraseCount = (CONDITION_PHRASES[condition] || CONDITION_PHRASES['Cloudy']).length;

  // LCM would give true cycle length, but max is good enough for UI
  return Math.max(timePhraseCount, tempPhraseCount, conditionPhraseCount);
}
