// src/v2/data/weather-effects.js
// Structured game effects for each weather condition
// Migrated from legacy src/data-tables/weather-effects.js

// Define standardized weather effect categories
export const weatherEffects = {
  "Clear Skies": {
    summary: "Standard conditions with no special effects.",
    visibility: "Normal",
    movement: "Normal",
    rest: "Normal",
    damage: [],
    checks: [],
    other: []
  },

  "Light Clouds": {
    summary: "Partially cloudy sky providing occasional shade.",
    visibility: "Normal",
    movement: "Normal",
    rest: "Normal",
    damage: [],
    checks: [],
    other: ["High flying aerial creatures have partial cover."]
  },

  "Heavy Clouds": {
    summary: "Thick cloud cover blocks the sky completely.",
    visibility: "Normal at ground level",
    movement: "Normal",
    rest: "Normal",
    damage: [],
    checks: ["Disadvantage on checks using Navigation Tools to determine location based on celestial observation."],
    other: [
      "High flying aerial creatures have total cover.",
      "Outdoor light does not count as sunlight (affects sunlight sensitivity and similar traits)."
    ]
  },

  "Fog": {
    summary: "Thick mist severely reduces visibility.",
    visibility: "Limited to 60 feet. Objects beyond 60 feet are heavily obscured.",
    movement: "Navigation is difficult. Risk of becoming lost increases.",
    rest: "Normal",
    damage: [],
    checks: [
      "Disadvantage on Perception checks based on sight.",
      "Disadvantage on ranged attack rolls beyond 30 feet."
    ],
    other: [
      "Creatures more than 60 feet away have total cover.",
      "Navigating by landmarks becomes challenging."
    ]
  },

  "Rain": {
    summary: "Steady rainfall affects travel and comfort.",
    visibility: "Normal, but slightly reduced in heavy downpours.",
    movement: "Wagon travel at half speed. Areas may become muddy.",
    rest: "DC 12 Constitution saving throw to benefit from a long rest without shelter.",
    damage: ["-2 to all fire damage rolls."],
    checks: ["Disadvantage on Perception checks that rely on hearing due to the noise of rainfall."],
    other: [
      "Open flames may be extinguished.",
      "Tracks are easier to follow (advantage on Survival checks for tracking).",
      "After prolonged rain, low-lying areas may flood."
    ]
  },

  "Heavy Rain": {
    summary: "Torrential downpour creates challenging conditions.",
    visibility: "Reduced to 120 feet. Objects beyond that are lightly obscured.",
    movement: "Wagon travel at half speed. Multiple consecutive days make wagon travel impossible until one dry day.",
    rest: "DC 16 Constitution saving throw to benefit from a long rest without shelter.",
    damage: [
      "-4 to all fire damage rolls.",
      "+2 to lightning and cold damage rolls."
    ],
    checks: [
      "Disadvantage on Perception checks.",
      "Disadvantage on ranged weapon attacks beyond 60 feet."
    ],
    other: [
      "Open flames are automatically extinguished.",
      "Flooding likely in low-lying areas.",
      "Verbal communication beyond 30 feet requires shouting."
    ]
  },

  "Freezing Cold": {
    summary: "Dangerously cold temperatures affect survival.",
    visibility: "Normal",
    movement: "Normal",
    rest: "DC 15 Constitution saving throw to benefit from a long rest without heat and shelter.",
    damage: ["+2 to all cold damage rolls."],
    checks: [
      "Disadvantage on Dexterity checks for characters without cold protection.",
      "Failed rest save by 5 or more results in one level of exhaustion."
    ],
    other: [
      "Unprotected water sources freeze over.",
      "Characters without adequate cold weather gear must make a DC 10 Constitution saving throw every 2 hours or gain a level of exhaustion."
    ]
  },

  "Snow": {
    summary: "Falling snow reduces visibility and hampers movement.",
    visibility: "Limited to 100 feet. Objects beyond that are lightly obscured.",
    movement: "All travel speed halved. Two consecutive days makes all terrain difficult and wagon travel impossible until a day without snow.",
    rest: "DC 15 Constitution saving throw to benefit from a long rest without heat and shelter. Failed save by 5 or more results in one level of exhaustion.",
    damage: ["+1 to all cold damage rolls."],
    checks: [
      "Tracking is easier in fresh snow (advantage on Survival checks for tracking).",
      "Disadvantage on checks using Navigation Tools to determine location based on celestial observation.",
      "Disadvantage on Dexterity checks for characters without cold protection."
    ],
    other: [
      "High flying creatures have total cover.",
      "Terrain gradually becomes difficult terrain as snow accumulates.",
      "Outdoor light does not count as sunlight (affects sunlight sensitivity and similar traits).",
      "Unprotected water sources freeze over.",
      "Characters without adequate cold weather gear must make a DC 10 Constitution saving throw every 2 hours or gain a level of exhaustion."
    ]
  },

  "Scorching Heat": {
    summary: "Extreme heat creates dangerous conditions for travel and exertion.",
    visibility: "Normal, with possible heat shimmer at a distance.",
    movement: "Normal speed, but travel during day requires twice the water rations.",
    rest: "Creatures traveling 4+ hours or engaging in heavy activity for 1+ hour during daylight must make a DC 10 Constitution save or gain one level of exhaustion.",
    damage: [
      "+2 to all fire damage rolls.",
      "-2 to all cold damage rolls."
    ],
    checks: ["Disadvantage on Constitution checks related to endurance."],
    other: [
      "Double water consumption required.",
      "Risk of heat exhaustion and dehydration.",
      "Metal equipment becomes hot to the touch."
    ]
  },

  "Cold Winds": {
    summary: "Frigid gusts of air across the landscape.",
    visibility: "Normal",
    movement: "Difficult to travel against the wind direction.",
    rest: "DC 10 Constitution saving throw each hour of travel or gain a level of exhaustion unless properly dressed for cold weather.",
    damage: [],
    checks: ["Disadvantage on ranged attacks due to the wind."],
    other: [
      "Flying creatures move at half speed against the wind.",
      "Small flying creatures cannot fly against the wind.",
      "Exposed flames may be extinguished."
    ]
  },

  "Thunderstorm": {
    summary: "Violent storm with lightning, thunder, and heavy rain.",
    visibility: "All creatures partially obscured beyond 20 feet.",
    movement: "Wagon travel at half speed. Multiple consecutive days make wagon travel impossible until one dry day.",
    rest: "DC 16 Constitution saving throw to benefit from a long rest without shelter.",
    damage: [
      "+2 to all lightning and thunder damage rolls.",
      "-4 to all fire damage rolls."
    ],
    checks: [
      "Disadvantage on Perception checks that rely on hearing due to thunder.",
      "Disadvantage on ranged attacks beyond 30 feet.",
      "Disadvantage on ranged weapon attacks beyond 60 feet."
    ],
    other: [
      "Roll a d20 after 4+ hours of travel; on a 1, struck by a lightning bolt dealing 3d12 lightning damage.",
      "Open flames automatically extinguished.",
      "Flooding likely in low-lying areas.",
      "Verbal communication beyond 30 feet requires shouting.",
      "High flying aerial creatures have total cover.",
      "Outdoor light does not count as sunlight (affects sunlight sensitivity and similar traits)."
    ]
  },

  "Blizzard": {
    summary: "Severe winter storm combining heavy snow, freezing temperatures, and strong winds.",
    visibility: "All creatures heavily obscured beyond 20 feet.",
    movement: "All terrain is difficult terrain. Navigation extremely challenging. Difficult to travel against the wind direction.",
    rest: "DC 12 Constitution saving throw each hour in a blizzard or take 3d4 cold damage and gain one level of exhaustion.",
    damage: ["+3 to all cold damage rolls."],
    checks: [
      "Disadvantage on all Perception checks.",
      "Disadvantage on all ranged attacks.",
      "Disadvantage on Dexterity checks for characters without cold protection.",
      "Disadvantage on checks using Navigation Tools to determine location based on celestial observation."
    ],
    other: [
      "Creatures have advantage on Constitution saves if they have proper winter gear.",
      "Risk of becoming lost increases significantly.",
      "Tracking is easier in fresh snow (advantage on Survival checks for tracking).",
      "Terrain gradually becomes difficult terrain as snow accumulates.",
      "Outdoor light does not count as sunlight (affects sunlight sensitivity and similar traits).",
      "Unprotected water sources freeze over.",
      "Characters without adequate cold weather gear must make a DC 10 Constitution saving throw every 2 hours or gain a level of exhaustion.",
      "Flying creatures move at half speed against the wind.",
      "Small flying creatures cannot fly against the wind.",
      "Exposed flames are automatically extinguished."
    ]
  },

  "High Humidity Haze": {
    summary: "Oppressively humid air creating a visible haze.",
    visibility: "Objects beyond 300 feet are lightly obscured.",
    movement: "Normal",
    rest: "Normal, but uncomfortable.",
    damage: [],
    checks: ["Disadvantage on Constitution checks related to endurance or physical exertion."],
    other: [
      "Water consumption is doubled for all creatures.",
      "Risk of heat-related illness increases.",
      "Metal equipment may corrode faster."
    ]
  },

  "Cold Snap": {
    summary: "Unseasonable and sudden cold spell.",
    visibility: "Normal",
    movement: "Normal",
    rest: "DC 10 Constitution saving throw every 4 hours or gain a level of exhaustion for creatures not accustomed to cold weather.",
    damage: [],
    checks: [],
    other: [
      "Plants may be damaged, affecting foraging attempts.",
      "Water sources may freeze over unexpectedly.",
      "Creatures without cold adaptation are caught unprepared."
    ]
  },

  "Hail": {
    summary: "Ice pellets falling from the sky, ranging from pea-sized to golf ball-sized.",
    visibility: "Normal, but reduced during intense hailstorms.",
    movement: "Creatures without cover move at 3/4 speed while actively hailing.",
    rest: "DC 12 Constitution saving throw to benefit from a long rest without shelter.",
    damage: ["Roll d6 each hour of travel: on a 1, take 1d4 bludgeoning damage from large hailstones."],
    checks: ["Disadvantage on Concentration checks for spellcasting while in the open during hail."],
    other: [
      "Unprotected creatures may take damage from large hailstones.",
      "Flying creatures tend to seek shelter.",
      "Exposed food or supplies may be damaged."
    ]
  }
};

// Wind intensity effects based on wind speed (mph)
export const windIntensityEffects = {
  "Calm": { // 0-5 mph
    min: 0,
    max: 5,
    effect: "Air is still or has very light breezes. No effect on gameplay."
  },
  "Breezy": { // 6-14 mph
    min: 6,
    max: 14,
    effect: "Light wind that rustles leaves and can be felt on the face. No mechanical effects."
  },
  "Windy": { // 15-25 mph
    min: 15,
    max: 25,
    effect: "Moderate wind that raises dust and loose paper. Small branches move. Flying creatures can still maneuver normally."
  },
  "Strong Winds": { // 26-39 mph
    min: 26,
    max: 39,
    effect: "Strong wind creates whistling sounds. Small trees sway. Flying creatures gain +10 movement speed when moving with the wind, and –10 movement speed when moving against it. All ranged weapon attacks have a –2 to attack rolls."
  },
  "Gale Force": { // 40-54 mph
    min: 40,
    max: 54,
    effect: "Large branches move, whistling is heard. Umbrellas are difficult to use. Flying creatures have disadvantage on Dexterity checks. Range for thrown weapons and projectiles is halved when shooting into the wind. Small flying creatures must make a DC 15 Strength check to fly against the wind."
  },
  "Storm Force": { // 55+ mph
    min: 55,
    max: 100,
    effect: "Whole trees move, walking is difficult. Range for thrown weapons and projectiles is halved. All creatures have disadvantage on Perception checks that rely on hearing. Flying creatures must succeed on a DC 20 Strength check to fly against the wind or be pushed back 10 feet at the end of their turn. Small flying creatures cannot fly against the wind."
  }
};

// Shooting Star and Meteor Impact Effects (for Wanderers in Marai)
export const shootingStarEffects = {
  // Regular shooting star effect
  "Shooting Star":
    "A shooting star streaks across the night sky. All creatures who witness it gain 1 luck point as per the Lucky feat.",

  // Meteor impact effect (rare event with significant consequences)
  "Meteor Impact":
    "A blazing meteor crashes to earth somewhere within 1d100 miles! The ground trembles from the impact, and a bright flash illuminates the horizon. Rumors will soon spread of strange materials, valuable metals, or even magical properties at the impact site. Those who investigate may find rare resources worth 2d6 × 100 gp, but beware of others seeking the same prize or strange effects near the impact zone."
};
