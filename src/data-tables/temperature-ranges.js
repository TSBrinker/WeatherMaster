// temperature-ranges.js
// Temperature ranges for each climate, season, and weather condition

export const temperatureRanges = {
    "tropical-rainforest": {
      winter: {
        "Thunderstorm": { min: 70, max: 85 },
        "Heavy Rain": { min: 72, max: 88 },
        "Rain": { min: 75, max: 90 },
        "Light Clouds": { min: 78, max: 92 },
        "Clear Skies": { min: 80, max: 95 },
        "High Humidity Haze": { min: 82, max: 98 }
      },
      spring: {
        "Thunderstorm": { min: 72, max: 88 },
        "Heavy Rain": { min: 75, max: 90 },
        "Rain": { min: 78, max: 92 },
        "Light Clouds": { min: 80, max: 95 },
        "Clear Skies": { min: 82, max: 98 }
      },
      summer: {
        "Thunderstorm": { min: 75, max: 90 },
        "Rain": { min: 78, max: 92 },
        "Light Clouds": { min: 80, max: 95 },
        "Clear Skies": { min: 82, max: 100 },
        "High Humidity Haze": { min: 85, max: 102 }
      },
      fall: {
        "Thunderstorm": { min: 72, max: 88 },
        "Heavy Rain": { min: 75, max: 90 },
        "Rain": { min: 77, max: 92 },
        "Light Clouds": { min: 78, max: 94 },
        "Clear Skies": { min: 80, max: 96 }
      }
    },
    "tropical-seasonal": {
      winter: {
        "Thunderstorm": { min: 65, max: 85 },
        "Rain": { min: 68, max: 88 },
        "Light Clouds": { min: 70, max: 90 },
        "Clear Skies": { min: 72, max: 95 },
        "Scorching Heat": { min: 85, max: 105 }
      },
      spring: {
        "Thunderstorm": { min: 70, max: 90 },
        "Rain": { min: 72, max: 92 },
        "Light Clouds": { min: 75, max: 95 },
        "Clear Skies": { min: 78, max: 98 },
        "High Winds": { min: 75, max: 100 }
      },
      summer: {
        "Thunderstorm": { min: 75, max: 95 },
        "Heavy Rain": { min: 78, max: 98 },
        "Rain": { min: 80, max: 100 },
        "Light Clouds": { min: 82, max: 102 },
        "Clear Skies": { min: 85, max: 105 }
      },
      fall: {
        "Thunderstorm": { min: 70, max: 90 },
        "Rain": { min: 72, max: 92 },
        "Light Clouds": { min: 75, max: 95 },
        "Clear Skies": { min: 78, max: 98 },
        "High Winds": { min: 75, max: 95 }
      }
    },
    "desert": {
      winter: {
        "Rain": { min: 40, max: 60 },
        "Light Clouds": { min: 45, max: 65 },
        "Clear Skies": { min: 50, max: 70 },
        "Cold Winds": { min: 35, max: 55 },
        "Freezing Cold": { min: 20, max: 45 }
      },
      spring: {
        "Rain": { min: 55, max: 75 },
        "Light Clouds": { min: 60, max: 80 },
        "Clear Skies": { min: 65, max: 90 },
        "High Winds": { min: 60, max: 85 },
        "Scorching Heat": { min: 85, max: 105 }
      },
      summer: {
        "Thunderstorm": { min: 75, max: 95 },
        "Rain": { min: 80, max: 100 },
        "Light Clouds": { min: 85, max: 105 },
        "Clear Skies": { min: 90, max: 115 },
        "Scorching Heat": { min: 100, max: 125 }
      },
      fall: {
        "Rain": { min: 60, max: 80 },
        "Light Clouds": { min: 65, max: 85 },
        "Clear Skies": { min: 70, max: 90 },
        "High Winds": { min: 65, max: 85 },
        "Scorching Heat": { min: 85, max: 105 }
      }
    },
    "temperate-grassland": {
      winter: {
        "Blizzard": { min: 5, max: 25 },
        "Snow": { min: 10, max: 30 },
        "Freezing Cold": { min: 15, max: 35 },
        "Heavy Clouds": { min: 25, max: 40 },
        "Light Clouds": { min: 30, max: 45 },
        "Clear Skies": { min: 25, max: 40 }
      },
      spring: {
        "Thunderstorm": { min: 45, max: 65 },
        "Rain": { min: 50, max: 70 },
        "Light Clouds": { min: 55, max: 75 },
        "Clear Skies": { min: 60, max: 80 },
        "High Winds": { min: 55, max: 75 },
        "Scorching Heat": { min: 75, max: 95 }
      },
      summer: {
        "Thunderstorm": { min: 65, max: 85 },
        "Rain": { min: 70, max: 90 },
        "Light Clouds": { min: 75, max: 95 },
        "Clear Skies": { min: 80, max: 100 },
        "High Winds": { min: 75, max: 95 },
        "Scorching Heat": { min: 90, max: 110 }
      },
      fall: {
        "Thunderstorm": { min: 50, max: 70 },
        "Rain": { min: 45, max: 65 },
        "Heavy Clouds": { min: 40, max: 60 },
        "Light Clouds": { min: 45, max: 65 },
        "Clear Skies": { min: 50, max: 70 },
        "High Winds": { min: 45, max: 65 }
      }
    },
    "temperate-deciduous": {
      winter: {
        "Blizzard": { min: 10, max: 25 },
        "Snow": { min: 15, max: 30 },
        "Freezing Cold": { min: 20, max: 35 },
        "Heavy Clouds": { min: 25, max: 40 },
        "Light Clouds": { min: 30, max: 45 },
        "Clear Skies": { min: 25, max: 40 }
      },
      spring: {
        "Thunderstorm": { min: 50, max: 70 },
        "Rain": { min: 55, max: 75 },
        "Light Clouds": { min: 60, max: 80 },
        "Clear Skies": { min: 65, max: 85 },
        "High Winds": { min: 60, max: 80 },
        "Scorching Heat": { min: 80, max: 100 }
      },
      summer: {
        "Thunderstorm": { min: 70, max: 90 },
        "Rain": { min: 75, max: 95 },
        "Light Clouds": { min: 80, max: 100 },
        "Clear Skies": { min: 85, max: 105 },
        "Scorching Heat": { min: 95, max: 115 }
      },
      fall: {
        "Thunderstorm": { min: 50, max: 70 },
        "Rain": { min: 45, max: 65 },
        "Heavy Clouds": { min: 40, max: 60 },
        "Light Clouds": { min: 45, max: 65 },
        "Clear Skies": { min: 50, max: 70 },
        "High Winds": { min: 45, max: 65 }
      }
    },
    "temperate-rainforest": {
      winter: {
        "Heavy Rain": { min: 35, max: 50 },
        "Rain": { min: 40, max: 55 },
        "Light Clouds": { min: 42, max: 58 },
        "Heavy Clouds": { min: 38, max: 52 },
        "Clear Skies": { min: 40, max: 55 }
      },
      spring: {
        "Thunderstorm": { min: 45, max: 65 },
        "Heavy Rain": { min: 48, max: 68 },
        "Rain": { min: 50, max: 70 },
        "Light Clouds": { min: 52, max: 72 },
        "Clear Skies": { min: 55, max: 75 },
        "High Winds": { min: 50, max: 70 }
      },
      summer: {
        "Thunderstorm": { min: 60, max: 80 },
        "Heavy Rain": { min: 62, max: 82 },
        "Rain": { min: 65, max: 85 },
        "Light Clouds": { min: 68, max: 88 },
        "Clear Skies": { min: 70, max: 90 },
        "Scorching Heat": { min: 80, max: 100 }
      },
      fall: {
        "Thunderstorm": { min: 45, max: 65 },
        "Heavy Rain": { min: 42, max: 62 },
        "Rain": { min: 40, max: 60 },
        "Light Clouds": { min: 45, max: 65 },
        "Heavy Clouds": { min: 40, max: 60 },
        "Clear Skies": { min: 50, max: 70 }
      }
    },
    "boreal-forest": {
      winter: {
        "Blizzard": { min: -15, max: 10 },
        "Snow": { min: -10, max: 15 },
        "Freezing Cold": { min: -5, max: 20 },
        "Heavy Clouds": { min: 0, max: 25 },
        "Light Clouds": { min: 5, max: 30 },
        "Clear Skies": { min: -5, max: 25 }
      },
      spring: {
        "Snow": { min: 20, max: 40 },
        "Freezing Cold": { min: 25, max: 45 },
        "Rain": { min: 35, max: 55 },
        "Heavy Clouds": { min: 30, max: 50 },
        "Light Clouds": { min: 35, max: 55 },
        "Clear Skies": { min: 40, max: 60 },
        "High Winds": { min: 35, max: 55 }
      },
      summer: {
        "Thunderstorm": { min: 55, max: 75 },
        "Rain": { min: 60, max: 80 },
        "Light Clouds": { min: 65, max: 85 },
        "Clear Skies": { min: 70, max: 90 },
        "High Winds": { min: 65, max: 85 },
        "Scorching Heat": { min: 80, max: 100 }
      },
      fall: {
        "Snow": { min: 25, max: 45 },
        "Rain": { min: 30, max: 50 },
        "Heavy Clouds": { min: 25, max: 45 },
        "Light Clouds": { min: 30, max: 50 },
        "Clear Skies": { min: 35, max: 55 },
        "High Winds": { min: 30, max: 50 }
      }
    },
    "tundra": {
      winter: {
        "Blizzard": { min: -30, max: 0 },
        "Snow": { min: -25, max: 5 },
        "Freezing Cold": { min: -20, max: 10 },
        "Heavy Clouds": { min: -15, max: 15 },
        "Light Clouds": { min: -10, max: 20 },
        "Clear Skies": { min: -20, max: 10 }
      },
      spring: {
        "Snow": { min: -5, max: 25 },
        "Freezing Cold": { min: 0, max: 30 },
        "Heavy Clouds": { min: 10, max: 35 },
        "Light Clouds": { min: 15, max: 40 },
        "Clear Skies": { min: 20, max: 45 },
        "High Winds": { min: 10, max: 35 }
      },
      summer: {
        "Rain": { min: 35, max: 60 },
        "Light Clouds": { min: 40, max: 65 },
        "Clear Skies": { min: 45, max: 70 },
        "High Winds": { min: 40, max: 65 },
        "Cold Snap": { min: 30, max: 50 }
      },
      fall: {
        "Snow": { min: 5, max: 30 },
        "Freezing Cold": { min: 0, max: 25 },
        "Heavy Clouds": { min: 10, max: 35 },
        "Light Clouds": { min: 15, max: 40 },
        "Clear Skies": { min: 20, max: 45 },
        "High Winds": { min: 10, max: 35 }
      }
    }
  };
  
  // Wind speed ranges (mph) for different conditions
  export const windSpeedRanges = {
    "Clear Skies": { min: 0, max: 5 },
    "Light Clouds": { min: 2, max: 8 },
    "Heavy Clouds": { min: 5, max: 12 },
    "Rain": { min: 5, max: 15 },
    "Heavy Rain": { min: 10, max: 20 },
    "Freezing Cold": { min: 0, max: 10 },
    "Snow": { min: 5, max: 15 },
    "Scorching Heat": { min: 0, max: 5 },
    "High Winds": { min: 20, max: 40 },
    "Cold Winds": { min: 15, max: 30 },
    "Thunderstorm": { min: 15, max: 30 },
    "Blizzard": { min: 25, max: 50 },
    "High Humidity Haze": { min: 0, max: 5 },
    "Cold Snap": { min: 5, max: 15 }
  };
  
  // Time of day temperature modifiers
  export const timeModifiers = {
    // Hour: modifier in °F
    0: -8,   // Midnight
    1: -9,
    2: -10,
    3: -11,
    4: -12,  // Coldest time (usually around 4-5 AM)
    5: -11,
    6: -9,
    7: -6,
    8: -3,
    9: 0,
    10: 3,
    11: 6,
    12: 8,   // Noon
    13: 9,
    14: 10,  // Warmest time (usually around 2-3 PM)
    15: 10,
    16: 8,
    17: 6,
    18: 3,   // Around sunset
    19: 0,
    20: -3,
    21: -5,
    22: -6,
    23: -7
  };
  
  // Maximum temperature change between consecutive hours
  export const maxTempChange = 5; // °F