// climate-tables.js
// Data tables for climate and weather conditions

// Climate-specific weather tables based on the uploaded data
export const climateTables = {
    "tropical-rainforest": {
      winter: [
        { min: 1, max: 20, condition: "Thunderstorm" },
        { min: 21, max: 50, condition: "Heavy Rain" },
        { min: 51, max: 75, condition: "Rain" },
        { min: 76, max: 90, condition: "Light Clouds" },
        { min: 91, max: 100, condition: "Clear Skies" }
      ],
      spring: [
        { min: 1, max: 15, condition: "Thunderstorm" },
        { min: 16, max: 35, condition: "Heavy Rain" },
        { min: 36, max: 65, condition: "Rain" },
        { min: 66, max: 85, condition: "Light Clouds" },
        { min: 86, max: 100, condition: "Clear Skies" }
      ],
      summer: [
        { min: 1, max: 10, condition: "Thunderstorm" },
        { min: 11, max: 25, condition: "Rain" },
        { min: 26, max: 60, condition: "Light Clouds" },
        { min: 61, max: 95, condition: "Clear Skies" },
        { min: 96, max: 100, condition: "High Humidity Haze" }
      ],
      fall: [
        { min: 1, max: 15, condition: "Thunderstorm" },
        { min: 16, max: 40, condition: "Heavy Rain" },
        { min: 41, max: 65, condition: "Rain" },
        { min: 66, max: 85, condition: "Light Clouds" },
        { min: 86, max: 100, condition: "Clear Skies" }
      ]
    },
    "tropical-seasonal": {
      winter: [
        { min: 1, max: 5, condition: "Thunderstorm" },
        { min: 6, max: 15, condition: "Rain" },
        { min: 16, max: 45, condition: "Light Clouds" },
        { min: 46, max: 90, condition: "Clear Skies" },
        { min: 91, max: 100, condition: "Scorching Heat" }
      ],
      spring: [
        { min: 1, max: 10, condition: "Thunderstorm" },
        { min: 11, max: 25, condition: "Rain" },
        { min: 26, max: 50, condition: "Light Clouds" },
        { min: 51, max: 80, condition: "Clear Skies" },
        { min: 81, max: 100, condition: "High Winds" }
      ],
      summer: [
        { min: 1, max: 20, condition: "Thunderstorm" },
        { min: 21, max: 40, condition: "Heavy Rain" },
        { min: 41, max: 65, condition: "Rain" },
        { min: 66, max: 85, condition: "Light Clouds" },
        { min: 86, max: 100, condition: "Clear Skies" }
      ],
      fall: [
        { min: 1, max: 10, condition: "Thunderstorm" },
        { min: 11, max: 25, condition: "Rain" },
        { min: 26, max: 55, condition: "Light Clouds" },
        { min: 56, max: 85, condition: "Clear Skies" },
        { min: 86, max: 100, condition: "High Winds" }
      ]
    },
    "desert": {
      winter: [
        { min: 1, max: 5, condition: "Rain" },
        { min: 6, max: 15, condition: "Light Clouds" },
        { min: 16, max: 70, condition: "Clear Skies" },
        { min: 71, max: 95, condition: "Cold Winds" },
        { min: 96, max: 100, condition: "Freezing Cold" }
      ],
      spring: [
        { min: 1, max: 10, condition: "Rain" },
        { min: 11, max: 25, condition: "Light Clouds" },
        { min: 26, max: 70, condition: "Clear Skies" },
        { min: 71, max: 90, condition: "High Winds" },
        { min: 91, max: 100, condition: "Scorching Heat" }
      ],
      summer: [
        { min: 1, max: 2, condition: "Thunderstorm" },
        { min: 3, max: 10, condition: "Rain" },
        { min: 11, max: 30, condition: "Light Clouds" },
        { min: 31, max: 80, condition: "Clear Skies" },
        { min: 81, max: 100, condition: "Scorching Heat" }
      ],
      fall: [
        { min: 1, max: 5, condition: "Rain" },
        { min: 6, max: 25, condition: "Light Clouds" },
        { min: 26, max: 75, condition: "Clear Skies" },
        { min: 76, max: 95, condition: "High Winds" },
        { min: 96, max: 100, condition: "Scorching Heat" }
      ]
    },
    "temperate-grassland": {
      winter: [
        { min: 1, max: 5, condition: "Blizzard" },
        { min: 6, max: 20, condition: "Snow" },
        { min: 21, max: 40, condition: "Freezing Cold" },
        { min: 41, max: 60, condition: "Heavy Clouds" },
        { min: 61, max: 85, condition: "Light Clouds" },
        { min: 86, max: 100, condition: "Clear Skies" }
      ],
      spring: [
        { min: 1, max: 10, condition: "Thunderstorm" },
        { min: 11, max: 30, condition: "Rain" },
        { min: 31, max: 50, condition: "Light Clouds" },
        { min: 51, max: 75, condition: "Clear Skies" },
        { min: 76, max: 95, condition: "High Winds" },
        { min: 96, max: 100, condition: "Scorching Heat" }
      ],
      summer: [
        { min: 1, max: 5, condition: "Thunderstorm" },
        { min: 6, max: 20, condition: "Rain" },
        { min: 21, max: 40, condition: "Light Clouds" },
        { min: 41, max: 80, condition: "Clear Skies" },
        { min: 81, max: 95, condition: "High Winds" },
        { min: 96, max: 100, condition: "Scorching Heat" }
      ],
      fall: [
        { min: 1, max: 5, condition: "Thunderstorm" },
        { min: 6, max: 15, condition: "Rain" },
        { min: 16, max: 30, condition: "Heavy Clouds" },
        { min: 31, max: 55, condition: "Light Clouds" },
        { min: 56, max: 80, condition: "Clear Skies" },
        { min: 81, max: 100, condition: "High Winds" }
      ]
    },
    "temperate-deciduous": {
      winter: [
        { min: 1, max: 5, condition: "Blizzard" },
        { min: 6, max: 15, condition: "Snow" },
        { min: 16, max: 35, condition: "Freezing Cold" },
        { min: 36, max: 55, condition: "Heavy Clouds" },
        { min: 56, max: 80, condition: "Light Clouds" },
        { min: 81, max: 100, condition: "Clear Skies" }
      ],
      spring: [
        { min: 1, max: 10, condition: "Thunderstorm" },
        { min: 11, max: 30, condition: "Rain" },
        { min: 31, max: 50, condition: "Light Clouds" },
        { min: 51, max: 80, condition: "Clear Skies" },
        { min: 81, max: 95, condition: "High Winds" },
        { min: 96, max: 100, condition: "Scorching Heat" }
      ],
      summer: [
        { min: 1, max: 5, condition: "Thunderstorm" },
        { min: 6, max: 20, condition: "Rain" },
        { min: 21, max: 45, condition: "Light Clouds" },
        { min: 46, max: 85, condition: "Clear Skies" },
        { min: 86, max: 100, condition: "Scorching Heat" }
      ],
      fall: [
        { min: 1, max: 5, condition: "Thunderstorm" },
        { min: 6, max: 20, condition: "Rain" },
        { min: 21, max: 35, condition: "Heavy Clouds" },
        { min: 36, max: 60, condition: "Light Clouds" },
        { min: 61, max: 85, condition: "Clear Skies" },
        { min: 86, max: 100, condition: "High Winds" }
      ]
    },
    "temperate-rainforest": {
      winter: [
        { min: 1, max: 10, condition: "Heavy Rain" },
        { min: 11, max: 30, condition: "Rain" },
        { min: 31, max: 50, condition: "Light Clouds" },
        { min: 51, max: 75, condition: "Heavy Clouds" },
        { min: 76, max: 100, condition: "Clear Skies" }
      ],
      spring: [
        { min: 1, max: 10, condition: "Thunderstorm" },
        { min: 11, max: 25, condition: "Heavy Rain" },
        { min: 26, max: 45, condition: "Rain" },
        { min: 46, max: 70, condition: "Light Clouds" },
        { min: 71, max: 90, condition: "Clear Skies" },
        { min: 91, max: 100, condition: "High Winds" }
      ],
      summer: [
        { min: 1, max: 5, condition: "Thunderstorm" },
        { min: 6, max: 15, condition: "Heavy Rain" },
        { min: 16, max: 35, condition: "Rain" },
        { min: 36, max: 60, condition: "Light Clouds" },
        { min: 61, max: 90, condition: "Clear Skies" },
        { min: 91, max: 100, condition: "Scorching Heat" }
      ],
      fall: [
        { min: 1, max: 10, condition: "Thunderstorm" },
        { min: 11, max: 25, condition: "Heavy Rain" },
        { min: 26, max: 40, condition: "Rain" },
        { min: 41, max: 65, condition: "Light Clouds" },
        { min: 66, max: 85, condition: "Heavy Clouds" },
        { min: 86, max: 100, condition: "Clear Skies" }
      ]
    },
    "boreal-forest": {
      winter: [
        { min: 1, max: 10, condition: "Blizzard" },
        { min: 11, max: 30, condition: "Snow" },
        { min: 31, max: 50, condition: "Freezing Cold" },
        { min: 51, max: 70, condition: "Heavy Clouds" },
        { min: 71, max: 85, condition: "Light Clouds" },
        { min: 86, max: 100, condition: "Clear Skies" }
      ],
      spring: [
        { min: 1, max: 10, condition: "Snow" },
        { min: 11, max: 20, condition: "Freezing Cold" },
        { min: 21, max: 35, condition: "Rain" },
        { min: 36, max: 50, condition: "Heavy Clouds" },
        { min: 51, max: 70, condition: "Light Clouds" },
        { min: 71, max: 90, condition: "Clear Skies" },
        { min: 91, max: 100, condition: "High Winds" }
      ],
      summer: [
        { min: 1, max: 5, condition: "Thunderstorm" },
        { min: 6, max: 15, condition: "Rain" },
        { min: 16, max: 35, condition: "Light Clouds" },
        { min: 36, max: 75, condition: "Clear Skies" },
        { min: 76, max: 95, condition: "High Winds" },
        { min: 96, max: 100, condition: "Scorching Heat" }
      ],
      fall: [
        { min: 1, max: 10, condition: "Snow" },
        { min: 11, max: 25, condition: "Rain" },
        { min: 26, max: 40, condition: "Heavy Clouds" },
        { min: 41, max: 65, condition: "Light Clouds" },
        { min: 66, max: 90, condition: "Clear Skies" },
        { min: 91, max: 100, condition: "High Winds" }
      ]
    },
    "tundra": {
      winter: [
        { min: 1, max: 15, condition: "Blizzard" },
        { min: 16, max: 35, condition: "Snow" },
        { min: 36, max: 60, condition: "Freezing Cold" },
        { min: 61, max: 80, condition: "Heavy Clouds" },
        { min: 81, max: 95, condition: "Light Clouds" },
        { min: 96, max: 100, condition: "Clear Skies" }
      ],
      spring: [
        { min: 1, max: 10, condition: "Snow" },
        { min: 11, max: 30, condition: "Freezing Cold" },
        { min: 31, max: 50, condition: "Heavy Clouds" },
        { min: 51, max: 70, condition: "Light Clouds" },
        { min: 71, max: 90, condition: "Clear Skies" },
        { min: 91, max: 100, condition: "High Winds" }
      ],
      summer: [
        { min: 1, max: 5, condition: "Rain" },
        { min: 6, max: 20, condition: "Light Clouds" },
        { min: 21, max: 60, condition: "Clear Skies" },
        { min: 61, max: 85, condition: "High Winds" },
        { min: 86, max: 100, condition: "Cold Snap" }
      ],
      fall: [
        { min: 1, max: 15, condition: "Snow" },
        { min: 16, max: 30, condition: "Freezing Cold" },
        { min: 31, max: 50, condition: "Heavy Clouds" },
        { min: 51, max: 70, condition: "Light Clouds" },
        { min: 71, max: 90, condition: "Clear Skies" },
        { min: 91, max: 100, condition: "High Winds" }
      ]
    }
  };
  
  // Mapping of biome names in the UI to the climate table keys
  export const biomeMap = {
    "temperate": "temperate-deciduous",
    "desert": "desert",
    "arctic": "tundra",
    "tropical": "tropical-rainforest",
    "coastal": "temperate-rainforest",
    "mountain": "boreal-forest", // Using boreal as an approximation
    "forest": "temperate-deciduous",
    "swamp": "tropical-seasonal" // Using tropical seasonal as an approximation
  };