// src/data-tables/region-templates.js
// Region templates organized by latitude band with parameters for weather generation

// Maps latitude bands to human-readable labels and latitude ranges
export const latitudeBands = {
  "equatorial": { label: "Equatorial", range: "0° - 10°" },
  "tropical": { label: "Tropical", range: "10° - 30°" },
  "temperate": { label: "Temperate", range: "30° - 60°" },
  "subarctic": { label: "Subarctic", range: "60° - 75°" },
  "polar": { label: "Polar", range: "75° - 90°" }
};

// Maps biome types to human-readable labels
export const biomeLabels = {
  "tropical-rainforest": "Tropical Rainforest",
  "tropical-seasonal": "Tropical Seasonal Forest",
  "desert": "Desert",
  "temperate-grassland": "Temperate Grassland",
  "temperate-deciduous": "Temperate Deciduous Forest",
  "temperate-rainforest": "Temperate Rainforest",
  "boreal-forest": "Boreal Forest",
  "tundra": "Tundra"
};

// Region templates organized by latitude band
export const regionTemplates = {
  // Equatorial regions (0-10°)
  "equatorial": {
    "rainforest-basin": {
      name: "Rainforest Basin",
      description: "Dense, humid rainforests with consistent temperatures and rainfall throughout the year. Daily afternoon thunderstorms are common.",
      gameplayImpact: "Dense foliage limits visibility. Heavy rainfall makes rivers swell and can flood low areas. High humidity can cause equipment to deteriorate. Heat exhaustion is a constant risk.",
      parameters: {
        latitude: 5,
        elevation: 500,
        maritimeInfluence: 0.7,
        terrainRoughness: 0.4,
        specialFactors: {
          hasMonsoonSeason: true,
          highRainfall: true,
          forestDensity: 0.9,
          highBiodiversity: true
        },
        temperatureProfile: {
          annual: { mean: 82, variance: 4 },
          winter: { mean: 81, variance: 4 },
          spring: { mean: 82, variance: 4 },
          summer: { mean: 83, variance: 4 },
          fall: { mean: 82, variance: 4 }
        },
        humidityProfile: {
          annual: { mean: 85, variance: 10 },
          winter: { mean: 85, variance: 10 },
          spring: { mean: 86, variance: 8 },
          summer: { mean: 84, variance: 10 },
          fall: { mean: 85, variance: 8 }
        }
      },
      defaultBiome: "tropical-rainforest"
    },
    "equatorial-highland": {
      name: "Equatorial Highland",
      description: "Cool mountain environments near the equator, often called \"eternal spring\" climates. Morning fog and afternoon rain are common, with pleasant temperatures year-round.",
      gameplayImpact: "Morning fog can limit visibility. Steep terrain slows travel. Afternoon storms develop quickly and can cause flash floods in ravines.",
      parameters: {
        latitude: 5,
        elevation: 5000,
        maritimeInfluence: 0.4,
        terrainRoughness: 0.7,
        specialFactors: {
          highBiodiversity: true,
          hasFog: true,
          volcanicActivity: 0.3
        },
        temperatureProfile: {
          annual: { mean: 70, variance: 5 },
          winter: { mean: 69, variance: 5 },
          spring: { mean: 70, variance: 5 },
          summer: { mean: 71, variance: 5 },
          fall: { mean: 70, variance: 5 }
        },
        humidityProfile: {
          annual: { mean: 75, variance: 15 },
          winter: { mean: 75, variance: 15 },
          spring: { mean: 78, variance: 15 },
          summer: { mean: 74, variance: 15 },
          fall: { mean: 73, variance: 15 }
        }
      },
      defaultBiome: "tropical-rainforest"
    },
    "island-archipelago": {
      name: "Island Archipelago",
      description: "Scattered islands with extremely stable temperatures and consistent trade winds. Afternoon showers are common but typically brief.",
      gameplayImpact: "Predictable weather patterns with reliable sea breezes. Ocean travel affected by afternoon squalls. Volcanic islands may have unique microclimates.",
      parameters: {
        latitude: 5,
        elevation: 200,
        maritimeInfluence: 0.95,
        terrainRoughness: 0.5,
        specialFactors: {
          highBiodiversity: true,
          highRainfall: true,
          coastalWinds: 0.7,
          volcanicActivity: 0.4
        },
        temperatureProfile: {
          annual: { mean: 80, variance: 3 },
          winter: { mean: 79, variance: 3 },
          spring: { mean: 80, variance: 3 },
          summer: { mean: 81, variance: 3 },
          fall: { mean: 80, variance: 3 }
        },
        humidityProfile: {
          annual: { mean: 80, variance: 8 },
          winter: { mean: 80, variance: 8 },
          spring: { mean: 80, variance: 8 },
          summer: { mean: 80, variance: 8 },
          fall: { mean: 80, variance: 8 }
        }
      },
      defaultBiome: "tropical-rainforest"
    },
    "volcanic-zone": {
      name: "Volcanic Zone",
      description: "Dramatic landscapes with active volcanoes and unpredictable local weather patterns. Fertile soil supports lush vegetation despite rugged terrain.",
      gameplayImpact: "Potentially hazardous volcanic events. Unpredictable local weather due to terrain complexity. Steep slopes and difficult terrain. Frequent earth tremors.",
      parameters: {
        latitude: 5,
        elevation: 3000,
        maritimeInfluence: 0.5,
        terrainRoughness: 0.9,
        specialFactors: {
          volcanicActivity: 0.8,
          tectonicActivity: 0.7,
          highBiodiversity: true,
          hasFog: true
        },
        temperatureProfile: {
          annual: { mean: 75, variance: 7 },
          winter: { mean: 74, variance: 7 },
          spring: { mean: 75, variance: 7 },
          summer: { mean: 76, variance: 7 },
          fall: { mean: 75, variance: 7 }
        },
        humidityProfile: {
          annual: { mean: 70, variance: 20 },
          winter: { mean: 70, variance: 20 },
          spring: { mean: 72, variance: 20 },
          summer: { mean: 68, variance: 20 },
          fall: { mean: 70, variance: 20 }
        }
      },
      defaultBiome: "tropical-rainforest"
    },
    "equatorial-swamp": {
      name: "Equatorial Swamp",
      description: "Low-lying, waterlogged areas with extremely high humidity and heat. Standing water is common year-round with minimal seasonal variation.",
      gameplayImpact: "Difficult terrain with standing water. Disease risk from insects. Limited visibility in tangled vegetation. Almost constant high humidity affects equipment and comfort.",
      parameters: {
        latitude: 5,
        elevation: 100,
        maritimeInfluence: 0.8,
        terrainRoughness: 0.3,
        specialFactors: {
          highRainfall: true,
          highBiodiversity: true,
          standingWater: 0.9,
          forestDensity: 0.7
        },
        temperatureProfile: {
          annual: { mean: 84, variance: 5 },
          winter: { mean: 83, variance: 5 },
          spring: { mean: 84, variance: 5 },
          summer: { mean: 85, variance: 5 },
          fall: { mean: 84, variance: 5 }
        },
        humidityProfile: {
          annual: { mean: 90, variance: 5 },
          winter: { mean: 90, variance: 5 },
          spring: { mean: 90, variance: 5 },
          summer: { mean: 90, variance: 5 },
          fall: { mean: 90, variance: 5 }
        }
      },
      defaultBiome: "tropical-seasonal"
    }
  },
  
  // Tropical regions (10-30°)
  "tropical": {
    "monsoon-coast": {
      name: "Monsoon Coast",
      description: "Coastal regions with dramatic seasonal rainfall patterns. A distinct wet season brings torrential rains, while the dry season can be quite pleasant.",
      gameplayImpact: "Seasonal flooding can make travel impossible during monsoon. Roads wash out. Rivers change course. Humidity causes equipment deterioration during wet season.",
      parameters: {
        latitude: 15,
        elevation: 300,
        maritimeInfluence: 0.8,
        terrainRoughness: 0.5,
        specialFactors: {
          hasMonsoonSeason: true,
          highRainfall: true,
          forestDensity: 0.7,
          seasonalFlooding: 0.9
        },
        temperatureProfile: {
          annual: { mean: 80, variance: 8 },
          winter: { mean: 75, variance: 7 },
          spring: { mean: 82, variance: 6 },
          summer: { mean: 85, variance: 6 },
          fall: { mean: 78, variance: 7 }
        },
        humidityProfile: {
          annual: { mean: 75, variance: 20 },
          winter: { mean: 65, variance: 15 }, // Dry season
          spring: { mean: 75, variance: 15 },
          summer: { mean: 85, variance: 10 }, // Wet season
          fall: { mean: 75, variance: 15 }
        }
      },
      defaultBiome: "tropical-seasonal"
    },
    "tropical-savanna": {
      name: "Tropical Savanna",
      description: "Open grasslands with scattered trees. Distinct wet and dry seasons, with most rainfall concentrated in 4-5 months of the year.",
      gameplayImpact: "Grass fires possible in dry season. Seasonal changes in water availability. Wildlife concentrates near water sources in dry season. Tall grass limits visibility.",
      parameters: {
        latitude: 18,
        elevation: 1200,
        maritimeInfluence: 0.3,
        terrainRoughness: 0.4,
        specialFactors: {
          hasDrySeason: true,
          hasMonsoonSeason: true,
          grasslandDensity: 0.8,
          forestDensity: 0.3
        },
        temperatureProfile: {
          annual: { mean: 78, variance: 12 },
          winter: { mean: 72, variance: 10 }, // Dry season
          spring: { mean: 80, variance: 8 },
          summer: { mean: 84, variance: 8 }, // Wet season
          fall: { mean: 76, variance: 10 }
        },
        humidityProfile: {
          annual: { mean: 60, variance: 25 },
          winter: { mean: 40, variance: 15 }, // Dry season
          spring: { mean: 60, variance: 20 },
          summer: { mean: 75, variance: 15 }, // Wet season
          fall: { mean: 65, variance: 20 }
        }
      },
      defaultBiome: "temperate-grassland"
    },
    "tropical-desert": {
      name: "Tropical Desert",
      description: "Hot, arid regions with extreme daily temperature variations. Can be scorching during the day but cool at night. Rainfall is rare and often occurs as brief, intense storms.",
      gameplayImpact: "Heat exhaustion risk during day. Hypothermia risk at night. Water scarcity. Flash floods in wadis. Dust storms reduce visibility. Sun exposure concerns.",
      parameters: {
        latitude: 23,
        elevation: 2000,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.7,
        specialFactors: {
          hasDrySeason: true,
          highDiurnalVariation: true,
          dustStorms: 0.7
        },
        temperatureProfile: {
          annual: { mean: 85, variance: 30 },
          winter: { mean: 70, variance: 20 },
          spring: { mean: 85, variance: 20 },
          summer: { mean: 100, variance: 15 },
          fall: { mean: 85, variance: 20 }
        },
        humidityProfile: {
          annual: { mean: 20, variance: 15 },
          winter: { mean: 25, variance: 15 },
          spring: { mean: 20, variance: 15 },
          summer: { mean: 15, variance: 10 },
          fall: { mean: 20, variance: 15 }
        }
      },
      defaultBiome: "desert"
    },
    "tropical-highland": {
      name: "Tropical Highland",
      description: "Mountain environments in tropical latitudes, often featuring cloud forests and pleasant temperatures year-round. Often called \"cities of eternal spring.\"",
      gameplayImpact: "Steep terrain affects travel. Morning fog affects visibility. Afternoon rain/thunderstorms predictable. UV intensity high despite comfortable temperatures.",
      parameters: {
        latitude: 20,
        elevation: 6000,
        maritimeInfluence: 0.3,
        terrainRoughness: 0.8,
        specialFactors: {
          hasFog: true,
          highBiodiversity: true,
          volcanicActivity: 0.2
        },
        temperatureProfile: {
          annual: { mean: 65, variance: 10 },
          winter: { mean: 62, variance: 10 },
          spring: { mean: 65, variance: 8 },
          summer: { mean: 68, variance: 8 },
          fall: { mean: 65, variance: 10 }
        },
        humidityProfile: {
          annual: { mean: 70, variance: 15 },
          winter: { mean: 65, variance: 15 },
          spring: { mean: 75, variance: 15 },
          summer: { mean: 75, variance: 15 },
          fall: { mean: 65, variance: 15 }
        }
      },
      defaultBiome: "temperate-rainforest"
    },
    "tropical-deciduous-forest": {
      name: "Tropical Deciduous Forest",
      description: "Forests that shed leaves during the dry season. Pronounced seasonality for a tropical climate, with comfortable winters and hot, humid summers.",
      gameplayImpact: "Seasonal variation in visibility through forest. Leaf litter in dry season can increase fire risk. Wet season brings lusher vegetation and more challenging travel.",
      parameters: {
        latitude: 25,
        elevation: 1000,
        maritimeInfluence: 0.4,
        terrainRoughness: 0.6,
        specialFactors: {
          hasDrySeason: true,
          deciduousForest: true,
          forestDensity: 0.8
        },
        temperatureProfile: {
          annual: { mean: 75, variance: 15 },
          winter: { mean: 65, variance: 10 }, // Dry season
          spring: { mean: 75, variance: 10 },
          summer: { mean: 85, variance: 10 }, // Wet season
          fall: { mean: 75, variance: 10 }
        },
        humidityProfile: {
          annual: { mean: 65, variance: 20 },
          winter: { mean: 50, variance: 15 }, // Dry season
          spring: { mean: 65, variance: 15 },
          summer: { mean: 80, variance: 15 }, // Wet season
          fall: { mean: 65, variance: 15 }
        }
      },
      defaultBiome: "temperate-deciduous"
    },
    "tropical-maritime": {
      name: "Tropical Maritime",
      description: "Coastal regions dominated by ocean influence, with steady trade winds and moderated temperatures. Seasonal hurricane risk during late summer and fall.",
      gameplayImpact: "Predictable daily sea breezes. Excellent sailing conditions most of the year. Storm surge risk during hurricane season. Afternoon thunderstorms common but brief.",
      parameters: {
        latitude: 22,
        elevation: 100,
        maritimeInfluence: 0.9,
        terrainRoughness: 0.4,
        specialFactors: {
          coastalWinds: 0.8,
          hurricaneRisk: 0.7,
          tradeWinds: true,
          highRainfall: true
        },
        temperatureProfile: {
          annual: { mean: 80, variance: 7 },
          winter: { mean: 76, variance: 6 },
          spring: { mean: 79, variance: 5 },
          summer: { mean: 84, variance: 5 },
          fall: { mean: 81, variance: 6 }
        },
        humidityProfile: {
          annual: { mean: 75, variance: 10 },
          winter: { mean: 70, variance: 10 },
          spring: { mean: 75, variance: 10 },
          summer: { mean: 80, variance: 10 },
          fall: { mean: 75, variance: 10 }
        }
      },
      defaultBiome: "tropical-seasonal"
    },
    "mangrove-coast": {
      name: "Mangrove Coast",
      description: "Low-lying coastal wetlands dominated by salt-tolerant trees. Tidal influences combine with high rainfall to create unique semi-aquatic environments.",
      gameplayImpact: "Challenging terrain requiring boats or specialized travel. Tidal fluctuations affect passability. Hurricane vulnerability with storm surge risks. Insect activity high.",
      parameters: {
        latitude: 15,
        elevation: 10,
        maritimeInfluence: 0.95,
        terrainRoughness: 0.3,
        specialFactors: {
          tidalInfluence: 0.9,
          standingWater: 0.8,
          hurricaneRisk: 0.7,
          highBiodiversity: true
        },
        temperatureProfile: {
          annual: { mean: 82, variance: 6 },
          winter: { mean: 79, variance: 6 },
          spring: { mean: 82, variance: 5 },
          summer: { mean: 85, variance: 5 },
          fall: { mean: 82, variance: 6 }
        },
        humidityProfile: {
          annual: { mean: 85, variance: 8 },
          winter: { mean: 80, variance: 8 },
          spring: { mean: 85, variance: 8 },
          summer: { mean: 88, variance: 8 },
          fall: { mean: 87, variance: 8 }
        }
      },
      defaultBiome: "tropical-seasonal"
    }
  },
  
  // Temperate regions (30-60°)
  "temperate": {
    "maritime-forest": {
      name: "Maritime Forest",
      description: "Coastal forest regions with moderated temperatures due to ocean influence. Rainfall is common year-round with foggy conditions, especially in mornings.",
      gameplayImpact: "Snow in winter is typically wet and heavy but melts quickly. Fog reduces visibility. Steady rainfall creates lush vegetation. Wind storms possible in fall/winter.",
      parameters: {
        latitude: 45,
        elevation: 500,
        maritimeInfluence: 0.8,
        terrainRoughness: 0.5,
        specialFactors: {
          forestDensity: 0.8,
          highRainfall: true,
          hasFog: true
        },
        temperatureProfile: {
          annual: { mean: 55, variance: 20 },
          winter: { mean: 40, variance: 10 },
          spring: { mean: 52, variance: 12 },
          summer: { mean: 70, variance: 10 },
          fall: { mean: 58, variance: 12 }
        },
        humidityProfile: {
          annual: { mean: 75, variance: 15 },
          winter: { mean: 80, variance: 10 },
          spring: { mean: 75, variance: 15 },
          summer: { mean: 70, variance: 15 },
          fall: { mean: 75, variance: 15 }
        }
      },
      defaultBiome: "temperate-deciduous"
    },
    "mediterranean-coast": {
      name: "Mediterranean Coast",
      description: "Distinctive climate with dry, warm summers and mild, rainy winters. Classic \"endless summer\" feeling with pleasant temperatures most of the year.",
      gameplayImpact: "Summer drought increases wildfire risk. Winter rainfall can cause flash floods. Grape/olive growing climate. Light winter freezes possible but rare.",
      parameters: {
        latitude: 35,
        elevation: 300,
        maritimeInfluence: 0.7,
        terrainRoughness: 0.6,
        specialFactors: {
          hasDrySeason: true,
          coastalWinds: 0.6,
          wildfire: 0.5
        },
        temperatureProfile: {
          annual: { mean: 65, variance: 15 },
          winter: { mean: 50, variance: 10 }, // Wet season
          spring: { mean: 60, variance: 10 },
          summer: { mean: 80, variance: 8 },  // Dry season
          fall: { mean: 70, variance: 10 }
        },
        humidityProfile: {
          annual: { mean: 60, variance: 20 },
          winter: { mean: 70, variance: 15 }, // Wet season
          spring: { mean: 65, variance: 15 },
          summer: { mean: 50, variance: 10 }, // Dry season
          fall: { mean: 55, variance: 15 }
        }
      },
      defaultBiome: "temperate-deciduous"
    },
    "continental-prairie": {
      name: "Continental Prairie",
      description: "Vast grasslands with extreme temperature variations between summer and winter, and between day and night. Prone to severe thunderstorms and tornadoes.",
      gameplayImpact: "Blizzards in winter with wind-driven snow. Severe thunderstorms with tornado risk in spring/summer. Limited shelter from elements. Grass fires in dry periods.",
      parameters: {
        latitude: 45,
        elevation: 1500,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.3,
        specialFactors: {
          grasslandDensity: 0.9,
          highDiurnalVariation: true,
          thunderstorms: 0.7,
          tornadoRisk: 0.5
        },
        temperatureProfile: {
          annual: { mean: 55, variance: 40 },
          winter: { mean: 25, variance: 20 },
          spring: { mean: 55, variance: 20 },
          summer: { mean: 85, variance: 15 },
          fall: { mean: 55, variance: 20 }
        },
        humidityProfile: {
          annual: { mean: 60, variance: 20 },
          winter: { mean: 65, variance: 15 },
          spring: { mean: 65, variance: 20 },
          summer: { mean: 55, variance: 25 },
          fall: { mean: 55, variance: 20 }
        }
      },
      defaultBiome: "temperate-grassland"
    },
    "temperate-highland": {
      name: "Temperate Highland",
      description: "Mountain environments with significant elevation. Large temperature variations between day and night. Summer thunderstorms are common, winter brings significant snowfall.",
      gameplayImpact: "Mountain passes closed by snow in winter. Lightning risk above treeline in summer. Avalanche risk in winter/spring. Higher UV exposure requiring protection.",
      parameters: {
        latitude: 42,
        elevation: 7000,
        maritimeInfluence: 0.2,
        terrainRoughness: 0.9,
        specialFactors: {
          snowpack: 0.8,
          highDiurnalVariation: true,
          thunderstorms: 0.6,
          forestDensity: 0.6
        },
        temperatureProfile: {
          annual: { mean: 45, variance: 30 },
          winter: { mean: 25, variance: 15 },
          spring: { mean: 42, variance: 20 },
          summer: { mean: 65, variance: 20 },
          fall: { mean: 48, variance: 20 }
        },
        humidityProfile: {
          annual: { mean: 50, variance: 25 },
          winter: { mean: 60, variance: 20 },
          spring: { mean: 55, variance: 25 },
          summer: { mean: 40, variance: 25 },
          fall: { mean: 45, variance: 25 }
        }
      },
      defaultBiome: "boreal-forest"
    },
    "temperate-desert": {
      name: "Temperate Desert",
      description: "Arid landscapes in mid-latitudes with large temperature swings between seasons and between day and night. Vegetation is sparse and adapted to drought.",
      gameplayImpact: "Extreme temperature shifts from day to night require adaptable clothing. Limited water sources. Flash flood risk in arroyos. Heat exhaustion risk in summer.",
      parameters: {
        latitude: 40,
        elevation: 3500,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.7,
        specialFactors: {
          hasDrySeason: true,
          highDiurnalVariation: true,
          dustStorms: 0.5
        },
        temperatureProfile: {
          annual: { mean: 55, variance: 35 },
          winter: { mean: 35, variance: 20 },
          spring: { mean: 55, variance: 25 },
          summer: { mean: 85, variance: 20 },
          fall: { mean: 60, variance: 25 }
        },
        humidityProfile: {
          annual: { mean: 30, variance: 15 },
          winter: { mean: 40, variance: 15 },
          spring: { mean: 30, variance: 15 },
          summer: { mean: 20, variance: 10 },
          fall: { mean: 30, variance: 15 }
        }
      },
      defaultBiome: "desert"
    },
    "temperate-rainforest": {
      name: "Temperate Rainforest",
      description: "Lush forests with extremely high rainfall, often along coastal mountain ranges. Mild temperature variations but near-constant precipitation and high humidity.",
      gameplayImpact: "Constant dampness affects equipment and comfort. Limited visibility in dense forest. Moss-covered surfaces are slippery. Rain gear essential year-round.",
      parameters: {
        latitude: 48,
        elevation: 500,
        maritimeInfluence: 0.9,
        terrainRoughness: 0.7,
        specialFactors: {
          highRainfall: true,
          hasFog: true,
          forestDensity: 0.9
        },
        temperatureProfile: {
          annual: { mean: 50, variance: 15 },
          winter: { mean: 40, variance: 10 },
          spring: { mean: 48, variance: 10 },
          summer: { mean: 65, variance: 10 },
          fall: { mean: 52, variance: 10 }
        },
        humidityProfile: {
          annual: { mean: 80, variance: 10 },
          winter: { mean: 85, variance: 8 },
          spring: { mean: 80, variance: 10 },
          summer: { mean: 75, variance: 12 },
          fall: { mean: 80, variance: 10 }
        }
      },
      defaultBiome: "temperate-rainforest"
    },
    "river-valley": {
      name: "River Valley",
      description: "Fertile valleys with significant river influence. Spring flooding fertilizes soil. Morning fog is common, especially in fall and spring.",
      gameplayImpact: "Spring floods may block travel routes. Morning fog impacts visibility. River systems provide transportation. Rich agricultural settlements.",
      parameters: {
        latitude: 45,
        elevation: 500,
        maritimeInfluence: 0.5,
        terrainRoughness: 0.4,
        specialFactors: {
          seasonalFlooding: 0.7,
          hasFog: true,
          forestDensity: 0.6,
          fertileFloodplain: true
        },
        temperatureProfile: {
          annual: { mean: 55, variance: 30 },
          winter: { mean: 30, variance: 15 },
          spring: { mean: 55, variance: 15 },
          summer: { mean: 80, variance: 15 },
          fall: { mean: 55, variance: 15 }
        },
        humidityProfile: {
          annual: { mean: 65, variance: 15 },
          winter: { mean: 70, variance: 10 },
          spring: { mean: 70, variance: 15 },
          summer: { mean: 60, variance: 20 },
          fall: { mean: 60, variance: 15 }
        }
      },
      defaultBiome: "temperate-deciduous"
    },
    "seasonal-wetland": {
      name: "Seasonal Wetland",
      description: "Low-lying areas that flood seasonally, creating temporary wetlands. Rich biodiversity with seasonal variations in water levels and accessibility.",
      gameplayImpact: "Seasonal changes in passability. Areas impassable in spring may be easily traversed by late summer. Mosquitoes and disease risk during wet periods.",
      parameters: {
        latitude: 40,
        elevation: 100,
        maritimeInfluence: 0.6,
        terrainRoughness: 0.2,
        specialFactors: {
          seasonalFlooding: 0.9,
          standingWater: 0.7,
          highBiodiversity: true
        },
        temperatureProfile: {
          annual: { mean: 60, variance: 25 },
          winter: { mean: 40, variance: 15 },
          spring: { mean: 60, variance: 15 },
          summer: { mean: 80, variance: 15 },
          fall: { mean: 60, variance: 15 }
        },
        humidityProfile: {
          annual: { mean: 75, variance: 15 },
          winter: { mean: 75, variance: 15 },
          spring: { mean: 80, variance: 10 }, // Flooding season
          summer: { mean: 70, variance: 15 },
          fall: { mean: 75, variance: 15 }
        }
      },
      defaultBiome: "temperate-grassland"
    },
    "maritime-islands": {
      name: "Maritime Islands",
      description: "Island environments with heavily moderated temperatures due to ocean influence. Typically windier than mainland areas with unpredictable coastal storms.",
      gameplayImpact: "Sailing conditions can change rapidly. Fog can develop suddenly. Minimal temperature variation but wind is a constant factor. Coastal erosion concerns.",
      parameters: {
        latitude: 45,
        elevation: 300,
        maritimeInfluence: 0.95,
        terrainRoughness: 0.6,
        specialFactors: {
          coastalWinds: 0.8,
          islandEffect: true,
          stormSurge: 0.6
        },
        temperatureProfile: {
          annual: { mean: 55, variance: 15 },
          winter: { mean: 45, variance: 8 },
          spring: { mean: 52, variance: 10 },
          summer: { mean: 65, variance: 8 },
          fall: { mean: 58, variance: 10 }
        },
        humidityProfile: {
          annual: { mean: 70, variance: 15 },
          winter: { mean: 75, variance: 15 },
          spring: { mean: 70, variance: 15 },
          summer: { mean: 65, variance: 15 },
          fall: { mean: 70, variance: 15 }
        }
      },
      defaultBiome: "temperate-rainforest"
    }
  },
  
  // Subarctic regions (60-75°)
  "subarctic": {
    "coastal-taiga": {
      name: "Coastal Taiga",
      description: "Northern forests with maritime influence moderating the extreme continental cold. Winter storms bring heavy snow, but temperatures are less severe than inland areas.",
      gameplayImpact: "Deep winter snow. Coastal storms can create blizzard conditions. Muddy conditions during spring thaw. Short but intense growing season in summer.",
      parameters: {
        latitude: 62,
        elevation: 500,
        maritimeInfluence: 0.7,
        terrainRoughness: 0.6,
        specialFactors: {
          forestDensity: 0.8,
          coniferousForest: true,
          coldWinters: true,
          coastalStorms: 0.7
        },
        temperatureProfile: {
          annual: { mean: 35, variance: 30 },
          winter: { mean: 20, variance: 15 },
          spring: { mean: 35, variance: 15 },
          summer: { mean: 60, variance: 10 },
          fall: { mean: 40, variance: 15 }
        },
        humidityProfile: {
          annual: { mean: 75, variance: 15 },
          winter: { mean: 80, variance: 10 },
          spring: { mean: 75, variance: 15 },
          summer: { mean: 70, variance: 15 },
          fall: { mean: 75, variance: 15 }
        }
      },
      defaultBiome: "boreal-forest"
    },
    "continental-taiga": {
      name: "Continental Taiga",
      description: "Vast inland northern forests with extreme seasonal temperature variations. Brutally cold winters and surprisingly warm summers with long daylight hours.",
      gameplayImpact: "Extreme winter cold requires specialized gear. Short days in winter, long days in summer. Mosquito swarms in summer. Forest fires risk in dry summers.",
      parameters: {
        latitude: 65,
        elevation: 1000,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.5,
        specialFactors: {
          forestDensity: 0.8,
          coniferousForest: true,
          coldWinters: true,
          permafrost: 0.3
        },
        temperatureProfile: {
          annual: { mean: 25, variance: 60 },
          winter: { mean: -20, variance: 25 },
          spring: { mean: 30, variance: 20 },
          summer: { mean: 65, variance: 15 },
          fall: { mean: 25, variance: 25 }
        },
        humidityProfile: {
          annual: { mean: 70, variance: 15 },
          winter: { mean: 75, variance: 10 },
          spring: { mean: 70, variance: 15 },
          summer: { mean: 65, variance: 20 },
          fall: { mean: 70, variance: 15 }
        }
      },
      defaultBiome: "boreal-forest"
    },
    "subarctic-highland": {
      name: "Subarctic Highland",
      description: "Rugged mountain terrain at high latitudes, with significant winter precipitation falling as snow. Very short growing season limited to a few summer months.",
      gameplayImpact: "Passes closed most of the year. Avalanche risk. Periods of 24-hour daylight in summer, near-continuous darkness in winter. Dangerous winter conditions.",
      parameters: {
        latitude: 65,
        elevation: 4000,
        maritimeInfluence: 0.3,
        terrainRoughness: 0.9,
        specialFactors: {
          snowpack: 0.9,
          coldWinters: true,
          forestDensity: 0.4,
          permafrost: 0.5
        },
        temperatureProfile: {
          annual: { mean: 20, variance: 45 },
          winter: { mean: -15, variance: 20 },
          spring: { mean: 20, variance: 20 },
          summer: { mean: 55, variance: 15 },
          fall: { mean: 20, variance: 20 }
        },
        humidityProfile: {
          annual: { mean: 60, variance: 20 },
          winter: { mean: 70, variance: 15 },
          spring: { mean: 65, variance: 20 },
          summer: { mean: 55, variance: 20 },
          fall: { mean: 60, variance: 20 }
        }
      },
      defaultBiome: "tundra"
    },
    "northern-grassland": {
      name: "Northern Grassland",
      description: "Cold steppe environments with extreme temperature shifts between seasons. Winter brings harsh conditions with wind-driven snow, while summers are surprisingly warm.",
      gameplayImpact: "Winter travel is dangerous but easier on frozen ground. Spring mud season makes travel difficult. Little shelter from elements. Dust storms in dry periods.",
      parameters: {
        latitude: 60,
        elevation: 800,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.3,
        specialFactors: {
          grasslandDensity: 0.9,
          highDiurnalVariation: true,
          coldWinters: true
        },
        temperatureProfile: {
          annual: { mean: 30, variance: 50 },
          winter: { mean: -10, variance: 25 },
          spring: { mean: 30, variance: 20 },
          summer: { mean: 70, variance: 15 },
          fall: { mean: 30, variance: 25 }
        },
        humidityProfile: {
          annual: { mean: 55, variance: 20 },
          winter: { mean: 65, variance: 15 },
          spring: { mean: 60, variance: 20 },
          summer: { mean: 50, variance: 20 },
          fall: { mean: 55, variance: 20 }
        }
      },
      defaultBiome: "temperate-grassland"
    },
    "subarctic-maritime": {
      name: "Subarctic Maritime",
      description: "Coastal regions with significant ocean influence. Moderated temperatures compared to continental areas at the same latitude, but prone to powerful coastal storms.",
      gameplayImpact: "Challenging sailing conditions with frequent storms. Snow mixed with rain in winter creates hazardous conditions. Coastal infrastructure vulnerable to storm damage.",
      parameters: {
        latitude: 62,
        elevation: 100,
        maritimeInfluence: 0.9,
        terrainRoughness: 0.6,
        specialFactors: {
          coastalStorms: 0.9,
          highWinds: 0.8,
          coldWinters: true
        },
        temperatureProfile: {
          annual: { mean: 40, variance: 25 },
          winter: { mean: 25, variance: 15 },
          spring: { mean: 38, variance: 15 },
          summer: { mean: 55, variance: 10 },
          fall: { mean: 42, variance: 15 }
        },
        humidityProfile: {
          annual: { mean: 80, variance: 15 },
          winter: { mean: 85, variance: 10 },
          spring: { mean: 80, variance: 15 },
          summer: { mean: 75, variance: 15 },
          fall: { mean: 80, variance: 15 }
        }
      },
      defaultBiome: "boreal-forest"
    },
    "peatland-muskeg": {
      name: "Peatland/Muskeg",
      description: "Waterlogged terrain with sphagnum moss and stunted trees growing on partially frozen soil. Frozen in winter, but thaws into challenging terrain in summer.",
      gameplayImpact: "Extremely difficult terrain for travel when thawed. Firm travel surface in winter when frozen. Insect swarms in summer. Fire risk in dry periods despite wet appearance.",
      parameters: {
        latitude: 65,
        elevation: 300,
        maritimeInfluence: 0.4,
        terrainRoughness: 0.3,
        specialFactors: {
          standingWater: 0.7,
          permafrost: 0.7,
          forestDensity: 0.4
        },
        temperatureProfile: {
          annual: { mean: 30, variance: 45 },
          winter: { mean: -10, variance: 20 },
          spring: { mean: 30, variance: 20 },
          summer: { mean: 65, variance: 15 },
          fall: { mean: 35, variance: 20 }
        },
        humidityProfile: {
          annual: { mean: 75, variance: 15 },
          winter: { mean: 80, variance: 10 },
          spring: { mean: 80, variance: 15 },
          summer: { mean: 70, variance: 20 },
          fall: { mean: 70, variance: 15 }
        }
      },
      defaultBiome: "tundra"
    }
  },
  
  // Polar regions (75-90°)
  "polar": {
    "tundra-plain": {
      name: "Tundra Plain",
      description: "Treeless plains with permanently frozen subsoil. Brief summer growing season with 24-hour daylight, followed by a long winter with extended darkness.",
      gameplayImpact: "24-hour daylight disrupts sleep in summer. Extended darkness in winter affects psychology. Challenging winter survival. Spring/fall bring rapidly changing daylight hours.",
      parameters: {
        latitude: 78,
        elevation: 1000,
        maritimeInfluence: 0.3,
        terrainRoughness: 0.4,
        specialFactors: {
          permafrost: 0.9,
          polarDay: true,
          polarNight: true,
          coldWinters: true
        },
        temperatureProfile: {
          annual: { mean: 15, variance: 40 },
          winter: { mean: -20, variance: 20 },
          spring: { mean: 15, variance: 15 },
          summer: { mean: 45, variance: 10 },
          fall: { mean: 20, variance: 15 }
        },
        humidityProfile: {
          annual: { mean: 70, variance: 15 },
          winter: { mean: 75, variance: 10 },
          spring: { mean: 70, variance: 15 },
          summer: { mean: 65, variance: 15 },
          fall: { mean: 70, variance: 15 }
        }
      },
      defaultBiome: "tundra"
    },
    "polar-coast": {
      name: "Polar Coast",
      description: "Coastal areas in polar regions where ocean influence moderates the extreme cold. Sea ice forms seasonally, extending the coastline in winter and retreating in summer.",
      gameplayImpact: "Sea ice allows winter travel but presents dangers. Coastal storms with wind-driven snow. Marine mammal hunting opportunities. Physical and psychological challenges of polar night.",
      parameters: {
        latitude: 75,
        elevation: 100,
        maritimeInfluence: 0.7,
        terrainRoughness: 0.5,
        specialFactors: {
          seaIce: 0.8,
          polarDay: true,
          polarNight: true,
          highWinds: 0.7
        },
        temperatureProfile: {
          annual: { mean: 20, variance: 35 },
          winter: { mean: -5, variance: 20 },
          spring: { mean: 15, variance: 15 },
          summer: { mean: 45, variance: 10 },
          fall: { mean: 25, variance: 15 }
        },
        humidityProfile: {
          annual: { mean: 75, variance: 15 },
          winter: { mean: 80, variance: 10 },
          spring: { mean: 75, variance: 15 },
          summer: { mean: 70, variance: 15 },
          fall: { mean: 75, variance: 15 }
        }
      },
      defaultBiome: "tundra"
    },
    "ice-sheet": {
      name: "Ice Sheet",
      description: "Permanent ice fields with extreme cold and minimal precipitation. Weather is dominated by katabatic winds flowing off the ice sheet. Essentially a cold desert.",
      gameplayImpact: "Extreme survival challenges. Specialized equipment essential. Disorientating white-out conditions. UV reflection causes snow blindness. Requires expert navigation.",
      parameters: {
        latitude: 85,
        elevation: 8000,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.4,
        specialFactors: {
          permanentIce: 0.9,
          polarDay: true,
          polarNight: true,
          extremeCold: 0.9
        },
        temperatureProfile: {
          annual: { mean: -15, variance: 30 },
          winter: { mean: -40, variance: 15 },
          spring: { mean: -20, variance: 15 },
          summer: { mean: 10, variance: 10 },
          fall: { mean: -10, variance: 15 }
        },
        humidityProfile: {
          annual: { mean: 60, variance: 10 },
          winter: { mean: 65, variance: 10 },
          spring: { mean: 60, variance: 10 },
          summer: { mean: 55, variance: 10 },
          fall: { mean: 60, variance: 10 }
        }
      },
      defaultBiome: "tundra"
    },
    "polar-desert": {
      name: "Polar Desert",
      description: "High latitude regions with extremely low precipitation, despite cold temperatures. Bare rock and gravel dominate the landscape, with minimal vegetation.",
      gameplayImpact: "Extremely limited resources. Water availability issues despite cold environment. Wind-driven snow creates drifts and bare areas. Survival challenges from aridity and cold.",
      parameters: {
        latitude: 80,
        elevation: 3000,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.6,
        specialFactors: {
          extremeCold: 0.8,
          polarDay: true,
          polarNight: true,
          dryAir: 0.8
        },
        temperatureProfile: {
          annual: { mean: -5, variance: 35 },
          winter: { mean: -30, variance: 20 },
          spring: { mean: -5, variance: 15 },
          summer: { mean: 35, variance: 15 },
          fall: { mean: -5, variance: 15 }
        },
        humidityProfile: {
          annual: { mean: 40, variance: 15 },
          winter: { mean: 45, variance: 15 },
          spring: { mean: 40, variance: 15 },
          summer: { mean: 35, variance: 15 },
          fall: { mean: 40, variance: 15 }
        }
      },
      defaultBiome: "tundra"
    },
    "polar-highland": {
      name: "Polar Highland",
      description: "Mountainous terrain at high latitudes, combining the challenges of high elevation with polar conditions. Extreme wind and temperature conditions dominate.",
      gameplayImpact: "Some of the most challenging terrain and conditions on the planet. Severe windchill factor. Rapid weather changes. Avalanche risk. Specialized mountaineering skills required.",
      parameters: {
        latitude: 78,
        elevation: 5000,
        maritimeInfluence: 0.2,
        terrainRoughness: 0.9,
        specialFactors: {
          extremeCold: 0.8,
          highWinds: 0.9,
          polarDay: true,
          polarNight: true
        },
        temperatureProfile: {
          annual: { mean: -10, variance: 35 },
          winter: { mean: -35, variance: 20 },
          spring: { mean: -10, variance: 15 },
          summer: { mean: 25, variance: 15 },
          fall: { mean: -5, variance: 15 }
        },
        humidityProfile: {
          annual: { mean: 50, variance: 20 },
          winter: { mean: 55, variance: 15 },
          spring: { mean: 50, variance: 20 },
          summer: { mean: 45, variance: 20 },
          fall: { mean: 50, variance: 20 }
        }
      },
      defaultBiome: "tundra"
    }
  },
  
  // Special/Unusual templates (available in multiple latitude bands)
  "special": {
    "mountain-microclimate": {
      name: "Mountain Microclimate",
      description: "Protected valleys, sunny slopes, or wind-sheltered areas that create distinct local climates that differ significantly from the surrounding region.",
      gameplayImpact: "May support agriculture or habitation in otherwise inhospitable areas. Distinct flora and fauna. Rapid weather changes when leaving the protected zone.",
      parameters: {
        latitude: 40, // Can be adjusted based on location
        elevation: 4000,
        maritimeInfluence: 0.4,
        terrainRoughness: 0.9,
        specialFactors: {
          microclimateFactor: 0.9,
          hasFog: true,
          lowAtmosphericPressure: 0.7
        },
        temperatureProfile: {
          annual: { mean: 50, variance: 15 }, // Values depend on base climate
          winter: { mean: 35, variance: 10 },
          spring: { mean: 48, variance: 12 },
          summer: { mean: 65, variance: 12 },
          fall: { mean: 52, variance: 10 }
        },
        humidityProfile: {
          annual: { mean: 65, variance: 25 },
          winter: { mean: 65, variance: 20 },
          spring: { mean: 70, variance: 25 },
          summer: { mean: 60, variance: 30 },
          fall: { mean: 65, variance: 25 }
        }
      },
      defaultBiome: "temperate-deciduous",
      compatibleBands: ["temperate", "tropical", "subarctic"]
    },
    "geothermal-zone": {
      name: "Geothermal Zone",
      description: "Areas with active volcanic or geothermal features creating localized heating and unique environmental conditions. Hot springs, geysers, and steam vents are common.",
      gameplayImpact: "Local micro-habitats in otherwise harsh environments. Potential health benefits/hazards from mineral waters. Unpredictable geologic activity. Unique resources.",
      parameters: {
        latitude: 55, // Can be adjusted based on location
        elevation: 2000,
        maritimeInfluence: 0.5,
        terrainRoughness: 0.8,
        specialFactors: {
          volcanicActivity: 0.8,
          geothermalFeatures: 0.9,
          tectonicActivity: 0.7,
          sulphurVents: 0.6
        },
        temperatureProfile: {
          annual: { mean: 55, variance: 15 }, // Local heating effects
          winter: { mean: 45, variance: 10 },
          spring: { mean: 52, variance: 12 },
          summer: { mean: 65, variance: 12 },
          fall: { mean: 57, variance: 10 }
        },
        humidityProfile: {
          annual: { mean: 70, variance: 20 },
          winter: { mean: 75, variance: 15 },
          spring: { mean: 70, variance: 20 },
          summer: { mean: 65, variance: 20 },
          fall: { mean: 70, variance: 20 }
        }
      },
      defaultBiome: "temperate-rainforest",
      compatibleBands: ["equatorial", "tropical", "temperate", "subarctic", "polar"]
    },
    "convergence-zone": {
      name: "Convergence Zone",
      description: "Areas where different climate systems regularly collide, creating highly variable and often dramatic weather patterns. Rapid changes are the norm rather than the exception.",
      gameplayImpact: "Unpredictable weather requires flexible planning. Storms develop rapidly. Temperature swings require adaptable clothing. Weather forecasting particularly challenging.",
      parameters: {
        latitude: 45, // Can be adjusted based on location
        elevation: 1000,
        maritimeInfluence: 0.6,
        terrainRoughness: 0.5,
        specialFactors: {
          weatherConvergence: 0.9,
          highWeatherVariability: 0.8,
          thunderstorms: 0.7,
          strongSeasonalShifts: 0.7
        },
        temperatureProfile: {
          annual: { mean: 55, variance: 40 }, // High variance
          winter: { mean: 30, variance: 25 },
          spring: { mean: 50, variance: 30 },
          summer: { mean: 75, variance: 25 },
          fall: { mean: 55, variance: 30 }
        },
        humidityProfile: {
          annual: { mean: 65, variance: 35 }, // Highly variable
          winter: { mean: 70, variance: 30 },
          spring: { mean: 70, variance: 35 },
          summer: { mean: 60, variance: 40 },
          fall: { mean: 65, variance: 35 }
        }
      },
      defaultBiome: "temperate-deciduous",
      compatibleBands: ["tropical", "temperate", "subarctic"]
    },
    "rain-shadow": {
      name: "Rain Shadow",
      description: "Dry regions on the leeward side of mountain ranges where most moisture is blocked by the mountains. Stark contrast often exists between opposite sides of the same mountain range.",
      gameplayImpact: "Water scarcity is a primary concern. Large temperature variations between day and night. Vegetation and resources differ dramatically across short distances.",
      parameters: {
        latitude: 40, // Can be adjusted based on location
        elevation: 2500,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.7,
        specialFactors: {
          rainShadowEffect: 0.9,
          hasDrySeason: true,
          highDiurnalVariation: true
        },
        temperatureProfile: {
          annual: { mean: 60, variance: 35 },
          winter: { mean: 35, variance: 20 },
          spring: { mean: 55, variance: 25 },
          summer: { mean: 85, variance: 20 },
          fall: { mean: 60, variance: 25 }
        },
        humidityProfile: {
          annual: { mean: 30, variance: 15 }, // Very dry
          winter: { mean: 35, variance: 15 },
          spring: { mean: 30, variance: 15 },
          summer: { mean: 20, variance: 10 },
          fall: { mean: 30, variance: 15 }
        }
      },
      defaultBiome: "desert",
      compatibleBands: ["tropical", "temperate", "subarctic"]
    },
    "coastal-desert": {
      name: "Coastal Desert",
      description: "Unusual arid regions adjacent to oceans, created by cold offshore currents. Often characterized by morning fog but minimal precipitation, creating unique ecosystems.",
      gameplayImpact: "Morning fog provides water for unique desert-adapted plants. Fishing opportunities despite desert conditions. Cooler temperatures than inland deserts at the same latitude.",
      parameters: {
        latitude: 25, // Can be adjusted based on location
        elevation: 500,
        maritimeInfluence: 0.7,
        terrainRoughness: 0.6,
        specialFactors: {
          coldOceanCurrent: 0.9,
          coastalFog: 0.8,
          hasDrySeason: true
        },
        temperatureProfile: {
          annual: { mean: 65, variance: 15 }, // Moderated by ocean
          winter: { mean: 60, variance: 10 },
          spring: { mean: 63, variance: 10 },
          summer: { mean: 70, variance: 10 },
          fall: { mean: 67, variance: 10 }
        },
        humidityProfile: {
          annual: { mean: 60, variance: 25 }, // High but doesn't rain
          winter: { mean: 65, variance: 20 },
          spring: { mean: 60, variance: 25 },
          summer: { mean: 55, variance: 25 },
          fall: { mean: 60, variance: 25 }
        }
      },
      defaultBiome: "desert",
      compatibleBands: ["tropical", "temperate"]
    }
  }
};

// Helper function to get templates appropriate for a latitude band
export function getTemplatesForLatitudeBand(latitudeBand) {
  const templates = regionTemplates[latitudeBand] || {};
  
  // Also include special templates appropriate for this latitude band
  const specialTemplates = Object.entries(regionTemplates.special || {})
    .filter(([id, template]) => {
      return template.compatibleBands && template.compatibleBands.includes(latitudeBand);
    })
    .reduce((acc, [id, template]) => {
      acc[id] = template;
      return acc;
    }, {});
  
  return { ...templates, ...specialTemplates };
}

// Helper function to get parameters for a template
export function getTemplateParameters(latitudeBand, templateId) {
  if (latitudeBand === "special") {
    return regionTemplates.special[templateId]?.parameters;
  }
  
  return regionTemplates[latitudeBand]?.[templateId]?.parameters;
}

// Helper function to get a complete list of all templates
export function getAllTemplates() {
  const allTemplates = {};
  
  // Process regular latitude band templates
  Object.entries(regionTemplates).forEach(([band, templates]) => {
    if (band !== "special") {
      Object.entries(templates).forEach(([id, template]) => {
        allTemplates[`${band}:${id}`] = {
          ...template,
          latitudeBand: band
        };
      });
    }
  });
  
  // Process special templates
  Object.entries(regionTemplates.special).forEach(([id, template]) => {
    allTemplates[`special:${id}`] = {
      ...template,
      latitudeBand: "special"
    };
  });
  
  return allTemplates;
}

// Helper function to create a region profile from a template
export function createProfileFromTemplate(latitudeBand, templateId, regionName) {
  // Get parameters from template
  const template = latitudeBand === "special" 
    ? regionTemplates.special[templateId]
    : regionTemplates[latitudeBand]?.[templateId];
  
  if (!template || !template.parameters) {
    console.error(`Template not found: ${latitudeBand}/${templateId}`);
    return null;
  }
  
  const templateParams = template.parameters;
  
  // Create region profile
  return {
    name: regionName || template.name,
    biome: template.defaultBiome,
    latitude: templateParams.latitude,
    elevation: templateParams.elevation,
    maritimeInfluence: templateParams.maritimeInfluence,
    terrainRoughness: templateParams.terrainRoughness,
    specialFactors: templateParams.specialFactors,
    temperatureProfile: templateParams.temperatureProfile,
    humidityProfile: templateParams.humidityProfile,
    latitudeBand: latitudeBand
  };
}