// src/data-tables/region-templates.js
// Region templates organized by latitude band with parameters for weather generation

// Maps latitude bands to human-readable labels and disc positions
// NOTE: Flat disc world - Polar = disc center, Tropical = near rim (but not the uninhabitable edge)
// Bands derived from physics-based daylight calculations (see Sprint 23)
export const latitudeBands = {
  "polar": { label: "Polar", range: "0-1,500 mi (disc center)" },
  "subarctic": { label: "Subarctic", range: "1,500-2,500 mi" },
  "boreal": { label: "Boreal", range: "2,500-3,500 mi" },
  "temperate": { label: "Temperate", range: "3,500-4,500 mi" },
  "subtropical": { label: "Subtropical", range: "4,500-5,500 mi" },
  "tropical": { label: "Tropical", range: "5,500-6,700 mi (near rim)" }
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
  "boreal-grassland": "Boreal Grassland",
  "tundra": "Tundra",
  "ocean": "Ocean"
};

// Region templates organized by latitude band
export const regionTemplates = {
  // FLAT DISC: Polar (disc center, 0-1,500 mi) = magical twilight in summer, polar night in winter
  "polar": {
    "tundra-plain": {
      name: "Tundra Plain",
      description: "Treeless plains with permanently frozen subsoil. Brief summer growing season with 24-hour daylight, followed by a long winter with extended darkness. Real-world examples: Utqiaġvik (Barrow) Alaska, Resolute Canada, Tiksi Russia.",
      searchTerms: ["plains", "flatland", "steppe", "frozen", "permafrost", "arctic", "treeless", "barren"],
      gameplayImpact: "24-hour daylight disrupts sleep in summer. Extended darkness in winter affects psychology. Challenging winter survival. Spring/fall bring rapidly changing daylight hours.",
      parameters: {
        latitude: 78,
        elevation: 1000,
        maritimeInfluence: 0.3,
        terrainRoughness: 0.4,
        specialFactors: {
          permanentIce: 0.3,
          groundType: 'permafrost',
        },
        temperatureProfile: {
          annual: { mean: 14, variance: 40 },
          winter: { mean: -12, variance: 20 },
          spring: { mean: 15, variance: 15 },
          summer: { mean: 42, variance: 10 },
          fall: { mean: 10, variance: 15 }
        },
        humidityProfile: {
          annual: { mean: 60, variance: 15 },
          winter: { mean: 75, variance: 10 },
          spring: { mean: 70, variance: 15 },
          summer: { mean: 65, variance: 15 },
          fall: { mean: 70, variance: 15 }
        },
        // Tundra: Very low dew points due to cold air holding little moisture
        dewPointProfile: {
          annual: { mean: 5, variance: 15, max: 45 },
          winter: { mean: -20, variance: 10, max: 10 },
          spring: { mean: 5, variance: 12, max: 35 },
          summer: { mean: 35, variance: 8, max: 50 },
          fall: { mean: 5, variance: 10, max: 35 }
        }
      },
      defaultBiome: "tundra"
    },
    "polar-coast": {
      name: "Polar Coast",
      description: "Coastal areas in polar regions where ocean influence moderates the extreme cold. Sea ice forms seasonally, extending the coastline in winter and retreating in summer. Real-world examples: Prudhoe Bay Alaska, Svalbard Norway, northern Greenland coast.",
      searchTerms: ["shore", "beach", "shoreline", "arctic", "sea ice", "seaside", "littoral", "frozen coast"],
      gameplayImpact: "Sea ice allows winter travel but presents dangers. Coastal storms with wind-driven snow. Marine mammal hunting opportunities. Physical and psychological challenges of polar night.",
      parameters: {
        latitude: 75,
        elevation: 100,
        maritimeInfluence: 0.7,
        terrainRoughness: 0.5,
        specialFactors: {
          highWinds: 0.7,
          groundType: 'permafrost',
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
        },
        // Polar coast: Maritime influence adds some moisture, but still very cold
        dewPointProfile: {
          annual: { mean: 10, variance: 15, max: 48 },
          winter: { mean: -15, variance: 10, max: 15 },
          spring: { mean: 8, variance: 12, max: 38 },
          summer: { mean: 38, variance: 8, max: 52 },
          fall: { mean: 15, variance: 10, max: 40 }
        }
      },
      defaultBiome: "tundra"
    },
    "ice-sheet": {
      name: "Ice Sheet",
      description: "Permanent ice fields with extreme cold and minimal precipitation. Weather is dominated by katabatic winds flowing off the ice sheet. Essentially a cold desert. Real-world examples: interior Greenland, central Antarctica, Vatnajökull Iceland.",
      searchTerms: ["glacier", "ice cap", "frozen", "snow field", "ice field", "arctic", "antarctic", "white waste"],
      gameplayImpact: "Extreme survival challenges. Specialized equipment essential. Disorientating white-out conditions. UV reflection causes snow blindness. Requires expert navigation.",
      parameters: {
        latitude: 85,
        elevation: 8000,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.4,
        specialFactors: {
          permanentIce: 0.9,
          groundType: 'permafrost',
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
        },
        // Ice sheet: Extremely dry, coldest temps mean very low dew points
        dewPointProfile: {
          annual: { mean: -25, variance: 15, max: 20 },
          winter: { mean: -45, variance: 10, max: -10 },
          spring: { mean: -30, variance: 12, max: 10 },
          summer: { mean: 0, variance: 8, max: 25 },
          fall: { mean: -20, variance: 10, max: 15 }
        }
      },
      defaultBiome: "tundra"
    },
    "polar-desert": {
      name: "Polar Desert",
      description: "High latitude regions with extremely low precipitation, despite cold temperatures. Bare rock and gravel dominate the landscape, with minimal vegetation. Real-world examples: McMurdo Dry Valleys Antarctica, Peary Land Greenland, Arctic islands of Nunavut.",
      searchTerms: ["arid", "dry", "wasteland", "barren", "desolate", "cold desert", "rocky", "gravel"],
      gameplayImpact: "Extremely limited resources. Water availability issues despite cold environment. Wind-driven snow creates drifts and bare areas. Survival challenges from aridity and cold.",
      parameters: {
        latitude: 80,
        elevation: 3000,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.6,
        specialFactors: {
          dryAir: 0.8,
          groundType: 'permafrost',
        },
        temperatureProfile: {
          annual: { mean: -5, variance: 35 },
          winter: { mean: -30, variance: 20 },
          spring: { mean: -5, variance: 15 },
          summer: { mean: 30, variance: 10 },
          fall: { mean: -5, variance: 15 }
        },
        humidityProfile: {
          annual: { mean: 30, variance: 10 },
          winter: { mean: 45, variance: 15 },
          spring: { mean: 40, variance: 15 },
          summer: { mean: 35, variance: 15 },
          fall: { mean: 40, variance: 15 }
        },
        // Polar desert: Very arid, minimal moisture available
        dewPointProfile: {
          annual: { mean: -10, variance: 15, max: 30 },
          winter: { mean: -35, variance: 10, max: 0 },
          spring: { mean: -15, variance: 12, max: 20 },
          summer: { mean: 15, variance: 8, max: 35 },
          fall: { mean: -10, variance: 10, max: 25 }
        }
      },
      defaultBiome: "tundra"
    },
    "polar-highland": {
      name: "Polar Highland",
      description: "Mountainous terrain at high latitudes, combining the challenges of high elevation with polar conditions. Extreme wind and temperature conditions dominate. Real-world examples: Ellesmere Island mountains, Transantarctic Mountains, Svalbard peaks.",
      searchTerms: ["mountain", "peak", "summit", "alpine", "elevation", "high altitude", "ridge", "cliff"],
      gameplayImpact: "Some of the most challenging terrain and conditions on the planet. Severe windchill factor. Rapid weather changes. Avalanche risk. Specialized mountaineering skills required.",
      parameters: {
        latitude: 78,
        elevation: 5000,
        maritimeInfluence: 0.2,
        terrainRoughness: 0.9,
        specialFactors: {
          highWinds: 0.9,
          groundType: 'rock',
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
        },
        // Polar highland: Cold and dry, elevation reduces moisture
        dewPointProfile: {
          annual: { mean: -5, variance: 15, max: 35 },
          winter: { mean: -35, variance: 10, max: 5 },
          spring: { mean: -10, variance: 12, max: 25 },
          summer: { mean: 18, variance: 10, max: 40 },
          fall: { mean: -5, variance: 10, max: 30 }
        }
      },
      defaultBiome: "tundra"
    },
    // === POLAR OCEAN TEMPLATES ===
    "polar-seas": {
      name: "Polar Seas",
      description: "Frigid waters near the disc center where pack ice dominates for much of the year. Brief summer thaw allows limited navigation, but ice can reform rapidly. Icebergs and growlers pose constant hazards. Real-world examples: Beaufort Sea, Weddell Sea Antarctica, Arctic Ocean basin.",
      searchTerms: ["arctic ocean", "frozen sea", "ice waters", "frigid", "icy", "north sea", "glacial waters"],
      gameplayImpact: "Ice navigation requires specialized vessels. Icebergs can appear suddenly in fog. Summer provides brief window for travel. Hypothermia risk if crew goes overboard is near-instant.",
      parameters: {
        latitude: 80,
        elevation: 0,
        maritimeInfluence: 1.0,
        terrainRoughness: 0.3,
        specialFactors: {
          isOcean: true,
          seaType: 'open',
          currentStrength: 0.3,
          swellSource: 'polar',
          baseSwellHeight: 4,
          baseSwellPeriod: 8,
          icebergs: 0.9,
          packIce: 0.8,
          groundType: 'water',
        },
        temperatureProfile: {
          annual: { mean: 28, variance: 15 },
          winter: { mean: 15, variance: 10 },
          spring: { mean: 28, variance: 12 },
          summer: { mean: 38, variance: 8 },
          fall: { mean: 30, variance: 12 }
        },
        humidityProfile: {
          annual: { mean: 85, variance: 10 },
          winter: { mean: 80, variance: 10 },
          spring: { mean: 85, variance: 10 },
          summer: { mean: 90, variance: 8 },
          fall: { mean: 85, variance: 10 }
        },
        dewPointProfile: {
          annual: { mean: 22, variance: 12, max: 38 },
          winter: { mean: 10, variance: 8, max: 22 },
          spring: { mean: 22, variance: 10, max: 35 },
          summer: { mean: 35, variance: 6, max: 42 },
          fall: { mean: 25, variance: 10, max: 38 }
        }
      },
      defaultBiome: "ocean"
    },
    "pack-ice-waters": {
      name: "Pack Ice Waters",
      description: "Transitional zone where seasonal pack ice forms and breaks up. In summer, channels open through the ice allowing passage. Winter locks the sea in continuous ice sheet. Real-world examples: Northwest Passage, Northern Sea Route, Baffin Bay.",
      searchTerms: ["ice floe", "frozen channel", "arctic passage", "seasonal ice", "ice field", "icebreaker route"],
      gameplayImpact: "Navigable only in summer months. Ice pressure can crush vessels caught in freeze-up. Leads and polynyas provide unpredictable routes. Rich hunting grounds for marine mammals.",
      parameters: {
        latitude: 75,
        elevation: 0,
        maritimeInfluence: 1.0,
        terrainRoughness: 0.4,
        specialFactors: {
          isOcean: true,
          seaType: 'coastal',
          currentStrength: 0.4,
          swellSource: 'polar',
          baseSwellHeight: 3,
          baseSwellPeriod: 7,
          packIce: 0.7,
          seasonalIce: true,
          groundType: 'water',
        },
        temperatureProfile: {
          annual: { mean: 32, variance: 18 },
          winter: { mean: 18, variance: 12 },
          spring: { mean: 30, variance: 14 },
          summer: { mean: 42, variance: 8 },
          fall: { mean: 34, variance: 14 }
        },
        humidityProfile: {
          annual: { mean: 82, variance: 12 },
          winter: { mean: 78, variance: 10 },
          spring: { mean: 82, variance: 12 },
          summer: { mean: 88, variance: 8 },
          fall: { mean: 82, variance: 12 }
        },
        dewPointProfile: {
          annual: { mean: 26, variance: 14, max: 42 },
          winter: { mean: 12, variance: 10, max: 25 },
          spring: { mean: 25, variance: 12, max: 38 },
          summer: { mean: 38, variance: 6, max: 45 },
          fall: { mean: 28, variance: 12, max: 40 }
        }
      },
      defaultBiome: "ocean"
    }
  },
  // FLAT DISC: Subtropical (4,500-5,500 mi) = mild winters, warm summers
  "subtropical": {
    "monsoon-coast": {
      name: "Monsoon Coast",
      description: "Coastal regions with dramatic seasonal rainfall patterns. A distinct wet season brings torrential rains, while the dry season can be quite pleasant. Real-world examples: Mumbai India, Bangkok Thailand, Darwin Australia.",
      searchTerms: ["rainy season", "wet season", "tropical coast", "seasonal rain", "flooding", "humid coast", "southeast asia"],
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
          seasonalFlooding: 0.9,
          groundType: 'clay',
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
        },
        // Tropical monsoon: very high dew points, especially during wet season
        dewPointProfile: {
          annual: { mean: 72, variance: 6, max: 82 },
          winter: { mean: 65, variance: 8, max: 75 },
          spring: { mean: 72, variance: 6, max: 80 },
          summer: { mean: 76, variance: 4, max: 82 },
          fall: { mean: 72, variance: 6, max: 78 }
        }
      },
      defaultBiome: "tropical-seasonal"
    },
    "tropical-savanna": {
      name: "Tropical Savanna",
      description: "Open grasslands with scattered trees. Distinct wet and dry seasons, with most rainfall concentrated in 4-5 months of the year. Real-world examples: Serengeti Tanzania, Cerrado Brazil, Northern Territory Australia.",
      searchTerms: ["grassland", "plains", "safari", "veldt", "prairie", "open land", "africa", "wildlife"],
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
          forestDensity: 0.3,
          groundType: 'soil',
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
        },
        // Tropical savanna: moderate dew points, very seasonal
        dewPointProfile: {
          annual: { mean: 58, variance: 10, max: 75 },
          winter: { mean: 45, variance: 10, max: 58 },
          spring: { mean: 58, variance: 10, max: 72 },
          summer: { mean: 68, variance: 6, max: 78 },
          fall: { mean: 60, variance: 8, max: 72 }
        }
      },
      defaultBiome: "temperate-grassland"
    },
    "tropical-desert": {
      name: "Tropical Desert",
      description: "Hot, arid regions with extreme daily temperature variations. Can be scorching during the day but cool at night. Rainfall is rare and often occurs as brief, intense storms. Real-world examples: Phoenix Arizona, Riyadh Saudi Arabia, Alice Springs Australia.",
      searchTerms: ["hot desert", "sandy", "dunes", "arid", "scorching", "wasteland", "sahara", "outback", "badlands"],
      gameplayImpact: "Heat exhaustion risk during day. Hypothermia risk at night. Water scarcity. Flash floods in wadis. Dust storms reduce visibility. Sun exposure concerns.",
      parameters: {
        latitude: 23,
        elevation: 2000,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.7,
        specialFactors: {
          hasDrySeason: true,
          highDiurnalVariation: true,
          dustStorms: 0.7,
          groundType: 'sand',
        },
        temperatureProfile: {
          annual: { mean: 74, variance: 35 },
          winter: { mean: 56, variance: 12 },
          spring: { mean: 75, variance: 20 },
          summer: { mean: 95, variance: 18 },
          fall: { mean: 78, variance: 20 }
        },
        humidityProfile: {
          annual: { mean: 20, variance: 15 },
          winter: { mean: 25, variance: 15 },
          spring: { mean: 20, variance: 15 },
          summer: { mean: 15, variance: 10 },
          fall: { mean: 20, variance: 15 }
        },
        // Tropical desert: extremely low dew points due to lack of moisture sources
        dewPointProfile: {
          annual: { mean: 32, variance: 12, max: 55 },
          winter: { mean: 30, variance: 10, max: 48 },
          spring: { mean: 28, variance: 12, max: 52 },
          summer: { mean: 35, variance: 12, max: 58 },
          fall: { mean: 32, variance: 10, max: 52 }
        }
      },
      defaultBiome: "desert"
    },
    "tropical-highland": {
      name: "Tropical Highland",
      description: "Mountain environments in tropical latitudes, often featuring cloud forests and pleasant temperatures year-round. Often called \"cities of eternal spring.\" Real-world examples: Quito Ecuador, Addis Ababa Ethiopia, Bogotá Colombia.",
      searchTerms: ["mountain", "cloud forest", "altitude", "eternal spring", "cool tropics", "highland", "andes", "plateau"],
      gameplayImpact: "Steep terrain affects travel. Morning fog affects visibility. Afternoon rain/thunderstorms predictable. UV intensity high despite comfortable temperatures.",
      parameters: {
        latitude: 20,
        elevation: 6000,
        maritimeInfluence: 0.3,
        terrainRoughness: 0.8,
        specialFactors: {
          hasFog: true,
          volcanicActivity: 0.2,
          groundType: 'rock',
        },
        temperatureProfile: {
          annual: { mean: 58, variance: 10 },
          winter: { mean: 58, variance: 8 },
          spring: { mean: 58, variance: 8 },
          summer: { mean: 59, variance: 8 },
          fall: { mean: 58, variance: 8 }
        },
        humidityProfile: {
          annual: { mean: 70, variance: 15 },
          winter: { mean: 65, variance: 15 },
          spring: { mean: 75, variance: 15 },
          summer: { mean: 75, variance: 15 },
          fall: { mean: 65, variance: 15 }
        },
        // Tropical highland: Elevation keeps temps and dew points moderate year-round
        dewPointProfile: {
          annual: { mean: 48, variance: 8, max: 62 },
          winter: { mean: 45, variance: 8, max: 58 },
          spring: { mean: 50, variance: 8, max: 62 },
          summer: { mean: 50, variance: 8, max: 62 },
          fall: { mean: 46, variance: 8, max: 58 }
        }
      },
      defaultBiome: "temperate-rainforest"
    },
    "tropical-deciduous-forest": {
      name: "Tropical Deciduous Forest",
      description: "Forests that shed leaves during the dry season. Pronounced seasonality for a tropical climate, with comfortable winters and hot, humid summers. Real-world examples: central India, western Mexico, northeastern Brazil caatinga.",
      searchTerms: ["dry forest", "seasonal forest", "monsoon forest", "jungle", "woodland", "leaf fall", "caatinga"],
      gameplayImpact: "Seasonal variation in visibility through forest. Leaf litter in dry season can increase fire risk. Wet season brings lusher vegetation and more challenging travel.",
      parameters: {
        latitude: 25,
        elevation: 1000,
        maritimeInfluence: 0.4,
        terrainRoughness: 0.6,
        specialFactors: {
          hasDrySeason: true,
          deciduousForest: true,
          forestDensity: 0.8,
          groundType: 'soil',
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
        },
        // Tropical deciduous: Hot and humid in wet season, moderate in dry
        dewPointProfile: {
          annual: { mean: 62, variance: 10, max: 78 },
          winter: { mean: 50, variance: 10, max: 62 },
          spring: { mean: 62, variance: 10, max: 75 },
          summer: { mean: 72, variance: 6, max: 80 },
          fall: { mean: 62, variance: 8, max: 75 }
        }
      },
      defaultBiome: "temperate-deciduous"
    },
    "tropical-maritime": {
      name: "Tropical Maritime",
      description: "Coastal regions dominated by ocean influence, with steady trade winds and moderated temperatures. Seasonal hurricane risk during late summer and fall. Real-world examples: Caribbean islands, Hawaii, Bermuda.",
      searchTerms: ["island", "beach", "tropical island", "trade winds", "hurricane", "caribbean", "pacific island", "paradise"],
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
          highRainfall: true,
          groundType: 'sand',
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
        },
        // Tropical maritime: Ocean provides steady moisture, high dew points year-round
        dewPointProfile: {
          annual: { mean: 70, variance: 6, max: 80 },
          winter: { mean: 66, variance: 6, max: 75 },
          spring: { mean: 70, variance: 5, max: 78 },
          summer: { mean: 74, variance: 4, max: 82 },
          fall: { mean: 72, variance: 5, max: 80 }
        }
      },
      defaultBiome: "tropical-seasonal"
    },
    "mangrove-coast": {
      name: "Mangrove Coast",
      description: "Low-lying coastal wetlands dominated by salt-tolerant trees. Tidal influences combine with high rainfall to create unique semi-aquatic environments. Real-world examples: Florida Everglades, Sundarbans Bangladesh, Queensland Australia coast.",
      searchTerms: ["swamp", "marsh", "wetland", "bayou", "estuary", "tidal", "everglades", "mudflat", "saltwater swamp"],
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
          groundType: 'clay',
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
        },
        // Mangrove coast: Very high moisture, tidal wetlands, oppressive humidity
        dewPointProfile: {
          annual: { mean: 74, variance: 5, max: 84 },
          winter: { mean: 70, variance: 5, max: 78 },
          spring: { mean: 74, variance: 5, max: 82 },
          summer: { mean: 78, variance: 4, max: 85 },
          fall: { mean: 76, variance: 5, max: 84 }
        }
      },
      defaultBiome: "tropical-seasonal"
    },
    "mediterranean-coast": {
      name: "Mediterranean Coast",
      description: "Distinctive climate with dry, warm summers and mild, rainy winters. Classic \"endless summer\" feeling with pleasant temperatures most of the year. Real-world examples: Los Angeles, Barcelona, Athens, Perth Australia.",
      searchTerms: ["california", "greece", "italy", "wine country", "dry summer", "sunny", "riviera", "mild", "coastal"],
      gameplayImpact: "Summer drought increases wildfire risk. Winter rainfall can cause flash floods. Grape/olive growing climate. Light winter freezes possible but rare.",
      parameters: {
        latitude: 35,
        elevation: 300,
        maritimeInfluence: 0.7,
        terrainRoughness: 0.6,
        specialFactors: {
          hasDrySeason: true,
          coastalWinds: 0.6,
          wildfire: 0.5,
          groundType: 'soil',
        },
        temperatureProfile: {
          annual: { mean: 65, variance: 15 },
          winter: { mean: 58, variance: 10 }, // Wet season
          spring: { mean: 62, variance: 10 },
          summer: { mean: 75, variance: 10 },  // Dry season
          fall: { mean: 70, variance: 10 }
        },
        humidityProfile: {
          annual: { mean: 60, variance: 20 },
          winter: { mean: 70, variance: 15 }, // Wet season
          spring: { mean: 65, variance: 15 },
          summer: { mean: 50, variance: 10 }, // Dry season
          fall: { mean: 55, variance: 15 }
        },
        // Mediterranean: Dry summers limit dew points despite coastal location
        dewPointProfile: {
          annual: { mean: 48, variance: 10, max: 65 },
          winter: { mean: 48, variance: 8, max: 58 },
          spring: { mean: 50, variance: 8, max: 62 },
          summer: { mean: 52, variance: 8, max: 68 },
          fall: { mean: 48, variance: 8, max: 62 }
        }
      },
      defaultBiome: "temperate-deciduous"
    },
    // === SUBTROPICAL OCEAN TEMPLATES ===
    "trade-wind-belt": {
      name: "Trade Wind Belt",
      description: "Warm waters dominated by steady northeast or southeast trade winds. Reliable sailing conditions most of the year, though hurricane season brings serious risks in late summer and fall. Real-world examples: Caribbean Sea, Atlantic trade routes, South Pacific islands.",
      searchTerms: ["sailing", "tropical ocean", "warm waters", "caribbean", "atlantic", "steady winds", "blue water"],
      gameplayImpact: "Trade winds provide consistent sailing. Hurricane season (summer/fall) requires careful planning. Squalls can develop quickly in afternoon. Generally excellent visibility.",
      parameters: {
        latitude: 25,
        elevation: 0,
        maritimeInfluence: 1.0,
        terrainRoughness: 0.2,
        specialFactors: {
          isOcean: true,
          seaType: 'open',
          currentStrength: 0.4,
          swellSource: 'trade',
          baseSwellHeight: 4,
          baseSwellPeriod: 10,
          tradeWinds: true,
          hurricaneRisk: 0.6,
          groundType: 'water',
        },
        temperatureProfile: {
          annual: { mean: 76, variance: 8 },
          winter: { mean: 72, variance: 6 },
          spring: { mean: 76, variance: 6 },
          summer: { mean: 82, variance: 5 },
          fall: { mean: 78, variance: 6 }
        },
        humidityProfile: {
          annual: { mean: 75, variance: 10 },
          winter: { mean: 72, variance: 10 },
          spring: { mean: 74, variance: 10 },
          summer: { mean: 78, variance: 8 },
          fall: { mean: 76, variance: 10 }
        },
        dewPointProfile: {
          annual: { mean: 68, variance: 6, max: 78 },
          winter: { mean: 64, variance: 6, max: 74 },
          spring: { mean: 68, variance: 6, max: 76 },
          summer: { mean: 72, variance: 4, max: 80 },
          fall: { mean: 70, variance: 6, max: 78 }
        }
      },
      defaultBiome: "ocean"
    },
    "gulf-waters": {
      name: "Gulf Waters",
      description: "Semi-enclosed warm waters with limited fetch reducing wave heights. Strong tidal currents near entrances. Water temperatures can become very warm in summer, fueling storm development. Real-world examples: Gulf of Mexico, Persian Gulf, Gulf of Thailand.",
      searchTerms: ["bay", "enclosed sea", "sheltered water", "warm sea", "calm waters", "coastal sea", "inlet"],
      gameplayImpact: "Calmer than open ocean but currents can be treacherous. Summer heat can be oppressive at sea. Storm surge extremely dangerous in enclosed waters. Good for coastal trading.",
      parameters: {
        latitude: 28,
        elevation: 0,
        maritimeInfluence: 0.95,
        terrainRoughness: 0.3,
        specialFactors: {
          isOcean: true,
          seaType: 'gulf',
          currentStrength: 0.5,
          swellSource: 'local',
          baseSwellHeight: 2,
          baseSwellPeriod: 6,
          hurricaneRisk: 0.7,
          stormSurge: 0.8,
          groundType: 'water',
        },
        temperatureProfile: {
          annual: { mean: 78, variance: 10 },
          winter: { mean: 70, variance: 8 },
          spring: { mean: 78, variance: 8 },
          summer: { mean: 86, variance: 5 },
          fall: { mean: 80, variance: 8 }
        },
        humidityProfile: {
          annual: { mean: 78, variance: 10 },
          winter: { mean: 74, variance: 10 },
          spring: { mean: 76, variance: 10 },
          summer: { mean: 82, variance: 8 },
          fall: { mean: 78, variance: 10 }
        },
        dewPointProfile: {
          annual: { mean: 70, variance: 6, max: 80 },
          winter: { mean: 64, variance: 6, max: 74 },
          spring: { mean: 70, variance: 6, max: 78 },
          summer: { mean: 76, variance: 4, max: 82 },
          fall: { mean: 72, variance: 6, max: 80 }
        }
      },
      defaultBiome: "ocean"
    }
  },

  // FLAT DISC: Boreal (2,500-3,500 mi) = northern forests, snow persists through winter
  "boreal": {
    "boreal-forest": {
      name: "Boreal Forest",
      description: "Dense coniferous forests (taiga) with long, cold winters and short, mild summers. Snow persists from November through March. Real-world examples: Duluth Minnesota, Thunder Bay Ontario, southern Manitoba.",
      searchTerms: ["taiga", "conifer", "evergreen", "pine forest", "spruce", "fir", "northern woods", "canada", "siberia"],
      gameplayImpact: "Deep snow accumulation in winter requires snowshoes or skis. Short growing season limits agriculture. Dense forest provides shelter but limits visibility. Mosquitoes and blackflies in summer.",
      isNew: true,
      parameters: {
        latitude: 48,
        elevation: 1200,
        maritimeInfluence: 0.2,
        terrainRoughness: 0.4,
        specialFactors: {
          forestDensity: 0.85,
          groundType: 'soil',
        },
        temperatureProfile: {
          annual: { mean: 38, variance: 40 },
          winter: { mean: 10, variance: 15 },
          spring: { mean: 38, variance: 18 },
          summer: { mean: 68, variance: 12 },
          fall: { mean: 40, variance: 18 }
        },
        humidityProfile: {
          annual: { mean: 70, variance: 15 },
          winter: { mean: 75, variance: 10 },
          spring: { mean: 65, variance: 15 },
          summer: { mean: 65, variance: 20 },
          fall: { mean: 75, variance: 15 }
        },
        // Boreal forest: Cold limits moisture capacity, humid but low dew points
        dewPointProfile: {
          annual: { mean: 28, variance: 15, max: 62 },
          winter: { mean: 0, variance: 10, max: 20 },
          spring: { mean: 28, variance: 12, max: 50 },
          summer: { mean: 55, variance: 8, max: 68 },
          fall: { mean: 30, variance: 12, max: 52 }
        }
      },
      defaultBiome: "boreal-forest"
    },

    "cold-continental-prairie": {
      name: "Cold Continental Prairie",
      description: "Open grasslands with extreme seasonal temperature swings. Bitter winters with persistent snow cover and wind-driven drifting. Hot summers with thunderstorm risk. Real-world examples: Fargo North Dakota, Regina Saskatchewan, Bismarck North Dakota.",
      searchTerms: ["plains", "grassland", "steppe", "midwest", "great plains", "wheat field", "tornado alley", "flatland", "dakotas"],
      gameplayImpact: "Blizzards with whiteout conditions in winter. No shelter from wind on open prairie. Severe thunderstorms and tornado risk in spring/summer. Grass fires in dry autumn.",
      isNew: true,
      parameters: {
        latitude: 47,
        elevation: 1400,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.2,
        specialFactors: {
          grasslandDensity: 0.9,
          highDiurnalVariation: true,
          thunderstorms: 0.6,
          tornadoRisk: 0.3,
          highWinds: 0.6,
          groundType: 'soil',
        },
        temperatureProfile: {
          annual: { mean: 40, variance: 50 },
          winter: { mean: 8, variance: 18 },
          spring: { mean: 42, variance: 20 },
          summer: { mean: 72, variance: 15 },
          fall: { mean: 42, variance: 20 }
        },
        humidityProfile: {
          annual: { mean: 60, variance: 20 },
          winter: { mean: 70, variance: 15 },
          spring: { mean: 55, variance: 20 },
          summer: { mean: 55, variance: 25 },
          fall: { mean: 60, variance: 20 }
        },
        // Cold continental prairie: Dry continental air, Gulf moisture in summer storms
        dewPointProfile: {
          annual: { mean: 25, variance: 15, max: 68 },
          winter: { mean: -5, variance: 10, max: 18 },
          spring: { mean: 30, variance: 12, max: 58 },
          summer: { mean: 55, variance: 10, max: 72 },
          fall: { mean: 28, variance: 12, max: 55 }
        }
      },
      defaultBiome: "boreal-grassland"
    },

    "boreal-lake-district": {
      name: "Boreal Lake District",
      description: "Landscape dotted with thousands of glacial lakes surrounded by mixed forest. Lakes moderate temperatures slightly and generate fog. Excellent fishing but challenging overland travel. Real-world examples: Boundary Waters Minnesota, northern Wisconsin, Muskoka Ontario.",
      searchTerms: ["lakes", "fishing", "lakeland", "glacial", "canoe country", "boundary waters", "cabin country", "northwoods"],
      gameplayImpact: "Lake-effect snow in early winter. Ice fishing and frozen lake travel in deep winter. Fog common in spring and fall mornings. Mosquitoes intense near water in summer. Canoe/portage travel preferred.",
      isNew: true,
      parameters: {
        latitude: 47,
        elevation: 1300,
        maritimeInfluence: 0.4,
        terrainRoughness: 0.5,
        specialFactors: {
          forestDensity: 0.7,
          hasFog: true,
          standingWater: 0.6,
          groundType: 'soil',
        },
        temperatureProfile: {
          annual: { mean: 40, variance: 38 },
          winter: { mean: 12, variance: 14 },
          spring: { mean: 40, variance: 16 },
          summer: { mean: 68, variance: 12 },
          fall: { mean: 42, variance: 16 }
        },
        humidityProfile: {
          annual: { mean: 75, variance: 15 },
          winter: { mean: 78, variance: 10 },
          spring: { mean: 72, variance: 15 },
          summer: { mean: 70, variance: 18 },
          fall: { mean: 78, variance: 12 }
        },
        // Boreal lake district: Lakes add moisture, higher dew points than dry boreal
        dewPointProfile: {
          annual: { mean: 32, variance: 15, max: 65 },
          winter: { mean: 2, variance: 10, max: 22 },
          spring: { mean: 32, variance: 12, max: 52 },
          summer: { mean: 58, variance: 8, max: 70 },
          fall: { mean: 35, variance: 10, max: 55 }
        }
      },
      defaultBiome: "boreal-forest"
    },

    "boreal-highland": {
      name: "Boreal Highland",
      description: "Mountain environments with significant elevation. Large temperature variations between day and night. Summer thunderstorms are common, winter brings significant snowfall that persists through the season. Real-world examples: Canadian Rockies, Scottish Highlands, Scandinavian mountains.",
      searchTerms: ["mountain", "rockies", "highland", "peak", "alpine", "ski country", "snow capped", "high country"],
      gameplayImpact: "Mountain passes closed by snow in winter. Lightning risk above treeline in summer. Avalanche risk in winter/spring. Higher UV exposure requiring protection.",
      parameters: {
        latitude: 42,
        elevation: 7000,
        maritimeInfluence: 0.2,
        terrainRoughness: 0.9,
        specialFactors: {
          highDiurnalVariation: true,
          thunderstorms: 0.6,
          forestDensity: 0.6,
          groundType: 'rock',
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
        },
        // Boreal highland: Elevation and cold limit moisture
        dewPointProfile: {
          annual: { mean: 22, variance: 15, max: 55 },
          winter: { mean: -5, variance: 10, max: 20 },
          spring: { mean: 22, variance: 12, max: 45 },
          summer: { mean: 48, variance: 10, max: 62 },
          fall: { mean: 25, variance: 12, max: 48 }
        }
      },
      defaultBiome: "boreal-forest"
    },
    // === BOREAL OCEAN TEMPLATES ===
    "northern-seas": {
      name: "Northern Seas",
      description: "Cold but navigable waters with strong seasonal variation. Powerful storms sweep through regularly, especially in autumn and winter. Long summer days provide extended sailing windows. Real-world examples: North Sea, Baltic Sea, Gulf of Alaska.",
      searchTerms: ["cold ocean", "stormy seas", "fishing grounds", "north atlantic", "baltic", "rough water", "gale"],
      gameplayImpact: "Autumn gales are particularly dangerous. Summer sailing relatively safe but still unpredictable. Winter storms can last for days. Strong tidal currents near coasts.",
      parameters: {
        latitude: 50,
        elevation: 0,
        maritimeInfluence: 1.0,
        terrainRoughness: 0.4,
        specialFactors: {
          isOcean: true,
          seaType: 'open',
          currentStrength: 0.5,
          swellSource: 'westerlies',
          baseSwellHeight: 6,
          baseSwellPeriod: 9,
          stormFrequency: 0.5,
          groundType: 'water',
        },
        temperatureProfile: {
          annual: { mean: 48, variance: 22 },
          winter: { mean: 36, variance: 12 },
          spring: { mean: 46, variance: 14 },
          summer: { mean: 58, variance: 10 },
          fall: { mean: 50, variance: 14 }
        },
        humidityProfile: {
          annual: { mean: 82, variance: 12 },
          winter: { mean: 80, variance: 10 },
          spring: { mean: 82, variance: 12 },
          summer: { mean: 85, variance: 10 },
          fall: { mean: 82, variance: 12 }
        },
        dewPointProfile: {
          annual: { mean: 40, variance: 14, max: 58 },
          winter: { mean: 30, variance: 10, max: 42 },
          spring: { mean: 38, variance: 12, max: 52 },
          summer: { mean: 52, variance: 8, max: 62 },
          fall: { mean: 42, variance: 12, max: 56 }
        }
      },
      defaultBiome: "ocean"
    }
  },

  // FLAT DISC: Temperate (3,500-4,500 mi) = classic four seasons, snow comes and goes
  "temperate": {
    "maritime-forest": {
      name: "Maritime Forest",
      description: "Coastal forest regions with moderated temperatures due to ocean influence. Rainfall is common year-round with foggy conditions, especially in mornings. Real-world examples: Seattle, Portland Oregon, Vancouver BC.",
      searchTerms: ["pacific northwest", "rainy", "foggy", "coastal forest", "mild", "evergreen", "misty", "damp"],
      gameplayImpact: "Snow in winter is typically wet and heavy but melts quickly. Fog reduces visibility. Steady rainfall creates lush vegetation. Wind storms possible in fall/winter.",
      parameters: {
        latitude: 45,
        elevation: 500,
        maritimeInfluence: 0.8,
        terrainRoughness: 0.5,
        specialFactors: {
          forestDensity: 0.8,
          highRainfall: true,
          hasFog: true,
          groundType: 'soil',
        },
        temperatureProfile: {
          annual: { mean: 52, variance: 20 },
          winter: { mean: 41, variance: 10 },
          spring: { mean: 50, variance: 12 },
          summer: { mean: 66, variance: 10 },
          fall: { mean: 55, variance: 12 }
        },
        humidityProfile: {
          annual: { mean: 75, variance: 15 },
          winter: { mean: 80, variance: 10 },
          spring: { mean: 75, variance: 15 },
          summer: { mean: 70, variance: 15 },
          fall: { mean: 75, variance: 15 }
        },
        // Maritime forest: Ocean moderates everything, steady moisture year-round
        dewPointProfile: {
          annual: { mean: 42, variance: 10, max: 62 },
          winter: { mean: 35, variance: 8, max: 48 },
          spring: { mean: 42, variance: 8, max: 55 },
          summer: { mean: 52, variance: 8, max: 65 },
          fall: { mean: 45, variance: 8, max: 58 }
        }
      },
      defaultBiome: "temperate-deciduous"
    },
    "continental-prairie": {
      name: "Continental Prairie",
      description: "Vast grasslands with extreme temperature variations between summer and winter, and between day and night. Prone to severe thunderstorms and tornadoes. Real-world examples: Des Moines Iowa, Winnipeg Manitoba, Kansas City Missouri, Omaha Nebraska.",
      searchTerms: ["plains", "grassland", "midwest", "farming", "tornado", "heartland", "prairie", "flatland", "iowa", "kansas", "nebraska"],
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
          tornadoRisk: 0.5,
          groundType: 'soil',
        },
        temperatureProfile: {
          annual: { mean: 51, variance: 40 },
          winter: { mean: 20, variance: 20 },
          spring: { mean: 52, variance: 20 },
          summer: { mean: 77, variance: 18 },
          fall: { mean: 52, variance: 20 }
        },
        humidityProfile: {
          annual: { mean: 60, variance: 20 },
          winter: { mean: 65, variance: 15 },
          spring: { mean: 65, variance: 20 },
          summer: { mean: 55, variance: 25 },
          fall: { mean: 55, variance: 20 }
        },
        // Dew point profiles based on Great Plains meteorological data
        // Summer: Gulf moisture can push dew points to 70s, max 75 in severe storms
        // Winter: Very dry continental air, dew points often below freezing
        dewPointProfile: {
          annual: { mean: 42, variance: 12, max: 70 },
          winter: { mean: 18, variance: 10, max: 35 },
          spring: { mean: 45, variance: 12, max: 68 },
          summer: { mean: 62, variance: 8, max: 75 },
          fall: { mean: 45, variance: 10, max: 65 }
        }
      },
      defaultBiome: "temperate-grassland"
    },
    "temperate-desert": {
      name: "Temperate Desert",
      description: "Arid landscapes in mid-latitudes with large temperature swings between seasons and between day and night. Vegetation is sparse and adapted to drought. Real-world examples: Great Basin Nevada, Gobi Desert Mongolia, Patagonian steppe Argentina.",
      searchTerms: ["cold desert", "high desert", "arid", "scrubland", "sagebrush", "badlands", "dry", "nevada", "mongolia"],
      gameplayImpact: "Extreme temperature shifts from day to night require adaptable clothing. Limited water sources. Flash flood risk in arroyos. Heat exhaustion risk in summer.",
      parameters: {
        latitude: 40,
        elevation: 3500,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.7,
        specialFactors: {
          hasDrySeason: true,
          highDiurnalVariation: true,
          dustStorms: 0.5,
          groundType: 'sand',
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
        },
        // Temperate desert: low dew points, continental aridity
        dewPointProfile: {
          annual: { mean: 28, variance: 10, max: 50 },
          winter: { mean: 22, variance: 8, max: 38 },
          spring: { mean: 28, variance: 10, max: 48 },
          summer: { mean: 38, variance: 10, max: 55 },
          fall: { mean: 28, variance: 10, max: 48 }
        }
      },
      defaultBiome: "desert"
    },
    "temperate-rainforest": {
      name: "Temperate Rainforest",
      description: "Lush forests with extremely high rainfall, often along coastal mountain ranges. Mild temperature variations but near-constant precipitation and high humidity. Real-world examples: Olympic Peninsula Washington, Fiordland New Zealand, Chilean coast.",
      searchTerms: ["lush", "mossy", "old growth", "ancient forest", "wet forest", "fern", "olympic", "primeval"],
      gameplayImpact: "Constant dampness affects equipment and comfort. Limited visibility in dense forest. Moss-covered surfaces are slippery. Rain gear essential year-round.",
      parameters: {
        latitude: 48,
        elevation: 500,
        maritimeInfluence: 0.9,
        terrainRoughness: 0.7,
        specialFactors: {
          highRainfall: true,
          hasFog: true,
          forestDensity: 0.9,
          groundType: 'soil',
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
        },
        // Temperate rainforest: Constant rainfall keeps dew points high
        dewPointProfile: {
          annual: { mean: 45, variance: 8, max: 62 },
          winter: { mean: 38, variance: 6, max: 48 },
          spring: { mean: 44, variance: 6, max: 55 },
          summer: { mean: 54, variance: 6, max: 65 },
          fall: { mean: 48, variance: 6, max: 58 }
        }
      },
      defaultBiome: "temperate-rainforest"
    },
    "river-valley": {
      name: "River Valley",
      description: "Fertile valleys with significant river influence. Spring flooding fertilizes soil. Morning fog is common, especially in fall and spring. Real-world examples: Loire Valley France, Rhine Valley Germany, Willamette Valley Oregon.",
      searchTerms: ["valley", "river", "flood plain", "fertile", "farmland", "vineyard", "wine country", "lowland", "floodplain"],
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
          fertileFloodplain: true,
          groundType: 'clay',
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
        },
        // River valley: River moisture adds to summer humidity, fog-prone
        dewPointProfile: {
          annual: { mean: 45, variance: 12, max: 72 },
          winter: { mean: 25, variance: 10, max: 40 },
          spring: { mean: 45, variance: 10, max: 62 },
          summer: { mean: 62, variance: 8, max: 75 },
          fall: { mean: 45, variance: 10, max: 62 }
        }
      },
      defaultBiome: "temperate-deciduous"
    },
    "seasonal-wetland": {
      name: "Seasonal Wetland",
      description: "Low-lying areas that flood seasonally, creating temporary wetlands. Rich biodiversity with seasonal variations in water levels and accessibility. Real-world examples: Okavango Delta Botswana, Pantanal Brazil, Camargue France.",
      searchTerms: ["marsh", "swamp", "wetland", "bog", "delta", "flood", "fen", "mire", "marshland"],
      gameplayImpact: "Seasonal changes in passability. Areas impassable in spring may be easily traversed by late summer. Mosquitoes and disease risk during wet periods.",
      parameters: {
        latitude: 40,
        elevation: 100,
        maritimeInfluence: 0.6,
        terrainRoughness: 0.2,
        specialFactors: {
          seasonalFlooding: 0.9,
          standingWater: 0.7,
          groundType: 'clay',
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
        },
        // Seasonal wetland: Standing water increases evaporation, high summer dew points
        dewPointProfile: {
          annual: { mean: 52, variance: 12, max: 75 },
          winter: { mean: 35, variance: 10, max: 48 },
          spring: { mean: 55, variance: 8, max: 68 },
          summer: { mean: 65, variance: 8, max: 78 },
          fall: { mean: 50, variance: 10, max: 65 }
        }
      },
      defaultBiome: "temperate-grassland"
    },
    "maritime-islands": {
      name: "Maritime Islands",
      description: "Island environments with heavily moderated temperatures due to ocean influence. Typically windier than mainland areas with unpredictable coastal storms. Real-world examples: British Isles, Faroe Islands, Aleutian Islands Alaska.",
      searchTerms: ["island", "isle", "british isles", "england", "ireland", "scotland", "windy", "oceanic", "green hills"],
      gameplayImpact: "Sailing conditions can change rapidly. Fog can develop suddenly. Minimal temperature variation but wind is a constant factor. Coastal erosion concerns.",
      parameters: {
        latitude: 45,
        elevation: 300,
        maritimeInfluence: 0.95,
        terrainRoughness: 0.6,
        specialFactors: {
          coastalWinds: 0.8,
          islandEffect: true,
          stormSurge: 0.6,
          groundType: 'rock',
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
        },
        // Maritime islands: Ocean-moderated, steady moderate dew points
        dewPointProfile: {
          annual: { mean: 45, variance: 8, max: 60 },
          winter: { mean: 40, variance: 6, max: 50 },
          spring: { mean: 44, variance: 6, max: 55 },
          summer: { mean: 52, variance: 6, max: 62 },
          fall: { mean: 48, variance: 6, max: 58 }
        }
      },
      defaultBiome: "temperate-rainforest"
    },
    // === TEMPERATE OCEAN TEMPLATES ===
    "temperate-ocean": {
      name: "Temperate Ocean",
      description: "Open ocean waters with classic four-season variation. Westerly winds dominate, bringing regular weather systems. Good sailing conditions in summer, challenging in winter. Real-world examples: North Atlantic shipping lanes, North Pacific, Southern Ocean.",
      searchTerms: ["open ocean", "atlantic", "pacific", "shipping lanes", "deep water", "blue ocean", "high seas"],
      gameplayImpact: "Seasonal weather patterns are somewhat predictable. Summer provides reliable sailing windows. Autumn storms require caution. Winter crossings are risky but possible.",
      parameters: {
        latitude: 42,
        elevation: 0,
        maritimeInfluence: 1.0,
        terrainRoughness: 0.3,
        specialFactors: {
          isOcean: true,
          seaType: 'open',
          currentStrength: 0.5,
          swellSource: 'westerlies',
          baseSwellHeight: 5,
          baseSwellPeriod: 9,
          stormFrequency: 0.4,
          groundType: 'water',
        },
        temperatureProfile: {
          annual: { mean: 56, variance: 18 },
          winter: { mean: 46, variance: 10 },
          spring: { mean: 54, variance: 12 },
          summer: { mean: 66, variance: 8 },
          fall: { mean: 58, variance: 12 }
        },
        humidityProfile: {
          annual: { mean: 78, variance: 12 },
          winter: { mean: 76, variance: 10 },
          spring: { mean: 78, variance: 12 },
          summer: { mean: 80, variance: 10 },
          fall: { mean: 78, variance: 12 }
        },
        dewPointProfile: {
          annual: { mean: 48, variance: 12, max: 65 },
          winter: { mean: 40, variance: 8, max: 52 },
          spring: { mean: 46, variance: 10, max: 60 },
          summer: { mean: 58, variance: 6, max: 68 },
          fall: { mean: 50, variance: 10, max: 62 }
        }
      },
      defaultBiome: "ocean"
    },
    "coastal-waters": {
      name: "Coastal Waters",
      description: "Nearshore waters where land effects modify ocean conditions. Tidal influences are strong, and local winds create variable conditions. Sheltered harbors provide refuge. Real-world examples: English Channel, Puget Sound, Bay of Fundy.",
      searchTerms: ["near shore", "harbor", "bay", "channel", "sound", "tidal", "coastal sailing", "inshore"],
      gameplayImpact: "Land-sea breezes create predictable daily patterns. Tidal currents can be hazardous near headlands. Fog common in certain seasons. Generally safer than open ocean.",
      parameters: {
        latitude: 44,
        elevation: 0,
        maritimeInfluence: 0.9,
        terrainRoughness: 0.5,
        specialFactors: {
          isOcean: true,
          seaType: 'coastal',
          currentStrength: 0.6,
          swellSource: 'westerlies',
          baseSwellHeight: 3,
          baseSwellPeriod: 7,
          tidalRange: 'moderate',
          fog: 0.5,
          groundType: 'water',
        },
        temperatureProfile: {
          annual: { mean: 54, variance: 16 },
          winter: { mean: 44, variance: 10 },
          spring: { mean: 52, variance: 12 },
          summer: { mean: 64, variance: 8 },
          fall: { mean: 56, variance: 12 }
        },
        humidityProfile: {
          annual: { mean: 76, variance: 14 },
          winter: { mean: 78, variance: 12 },
          spring: { mean: 76, variance: 14 },
          summer: { mean: 74, variance: 12 },
          fall: { mean: 76, variance: 14 }
        },
        dewPointProfile: {
          annual: { mean: 46, variance: 12, max: 62 },
          winter: { mean: 38, variance: 8, max: 50 },
          spring: { mean: 44, variance: 10, max: 58 },
          summer: { mean: 56, variance: 6, max: 66 },
          fall: { mean: 48, variance: 10, max: 60 }
        }
      },
      defaultBiome: "ocean"
    }
  },

  // FLAT DISC: Subarctic (20-40% radius)
  "subarctic": {
    "coastal-taiga": {
      name: "Coastal Taiga",
      description: "Northern forests with maritime influence moderating the extreme continental cold. Winter storms bring heavy snow, but temperatures are less severe than inland areas. Real-world examples: Anchorage Alaska, coastal Norway, Kamchatka Russia.",
      searchTerms: ["alaska", "norway", "coastal forest", "snow forest", "fjord", "north coast", "nordic"],
      gameplayImpact: "Deep winter snow. Coastal storms can create blizzard conditions. Muddy conditions during spring thaw. Short but intense growing season in summer.",
      parameters: {
        latitude: 62,
        elevation: 500,
        maritimeInfluence: 0.7,
        terrainRoughness: 0.6,
        specialFactors: {
          forestDensity: 0.8,
          coastalStorms: 0.7,
          groundType: 'soil',
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
        },
        // Coastal taiga: Maritime influence adds moisture, but cold limits dew points
        dewPointProfile: {
          annual: { mean: 25, variance: 15, max: 58 },
          winter: { mean: 8, variance: 10, max: 25 },
          spring: { mean: 25, variance: 12, max: 45 },
          summer: { mean: 50, variance: 8, max: 62 },
          fall: { mean: 30, variance: 10, max: 50 }
        }
      },
      defaultBiome: "boreal-forest"
    },
    "continental-taiga": {
      name: "Continental Taiga",
      description: "Vast inland northern forests with extreme seasonal temperature variations. Brutally cold winters and surprisingly warm summers with long daylight hours. Real-world examples: Fairbanks Alaska, Yellowknife Canada, Yakutsk Russia.",
      searchTerms: ["siberia", "interior alaska", "deep cold", "extreme winter", "midnight sun", "northern forest", "wilderness"],
      gameplayImpact: "Extreme winter cold requires specialized gear. Short days in winter, long days in summer. Mosquito swarms in summer. Forest fires risk in dry summers.",
      parameters: {
        latitude: 65,
        elevation: 1000,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.5,
        specialFactors: {
          forestDensity: 0.8,
          groundType: 'soil',
        },
        temperatureProfile: {
          annual: { mean: 28, variance: 60 },
          winter: { mean: -15, variance: 25 },
          spring: { mean: 30, variance: 20 },
          summer: { mean: 63, variance: 15 },
          fall: { mean: 25, variance: 25 }
        },
        humidityProfile: {
          annual: { mean: 70, variance: 15 },
          winter: { mean: 75, variance: 10 },
          spring: { mean: 70, variance: 15 },
          summer: { mean: 65, variance: 20 },
          fall: { mean: 70, variance: 15 }
        },
        // Continental taiga: Extreme cold = very low winter dew points, warm summers
        dewPointProfile: {
          annual: { mean: 15, variance: 20, max: 58 },
          winter: { mean: -25, variance: 12, max: 5 },
          spring: { mean: 15, variance: 15, max: 40 },
          summer: { mean: 52, variance: 10, max: 65 },
          fall: { mean: 18, variance: 15, max: 42 }
        }
      },
      defaultBiome: "boreal-forest"
    },
    "subarctic-highland": {
      name: "Subarctic Highland",
      description: "Rugged mountain terrain at high latitudes, with significant winter precipitation falling as snow. Very short growing season limited to a few summer months. Real-world examples: Brooks Range Alaska, Ural Mountains Russia, northern Rockies Canada.",
      searchTerms: ["mountain", "peak", "snow peak", "remote mountain", "wilderness range", "arctic mountain", "high altitude"],
      gameplayImpact: "Passes closed most of the year. Avalanche risk. Periods of 24-hour daylight in summer, near-continuous darkness in winter. Dangerous winter conditions.",
      parameters: {
        latitude: 65,
        elevation: 4000,
        maritimeInfluence: 0.3,
        terrainRoughness: 0.9,
        specialFactors: {
          forestDensity: 0.4,
          groundType: 'rock',
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
        },
        // Subarctic highland: Cold and elevated, very low moisture capacity
        dewPointProfile: {
          annual: { mean: 8, variance: 18, max: 48 },
          winter: { mean: -25, variance: 12, max: 0 },
          spring: { mean: 8, variance: 15, max: 35 },
          summer: { mean: 42, variance: 10, max: 55 },
          fall: { mean: 10, variance: 12, max: 38 }
        }
      },
      defaultBiome: "tundra"
    },
    "northern-grassland": {
      name: "Northern Grassland",
      description: "Cold steppe environments with extreme temperature shifts between seasons. Winter brings harsh conditions with wind-driven snow, while summers are surprisingly warm. Real-world examples: Mongolian steppe, Kazakhstan plains, central Siberian grasslands.",
      searchTerms: ["steppe", "cold prairie", "mongolia", "central asia", "horse country", "nomad land", "windswept"],
      gameplayImpact: "Winter travel is dangerous but easier on frozen ground. Spring mud season makes travel difficult. Little shelter from elements. Dust storms in dry periods.",
      parameters: {
        latitude: 60,
        elevation: 800,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.3,
        specialFactors: {
          grasslandDensity: 0.9,
          highDiurnalVariation: true,
          groundType: 'soil',
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
        },
        // Northern grassland: Dry continental air, some Gulf moisture in summer
        dewPointProfile: {
          annual: { mean: 18, variance: 18, max: 62 },
          winter: { mean: -18, variance: 12, max: 8 },
          spring: { mean: 20, variance: 15, max: 48 },
          summer: { mean: 52, variance: 10, max: 68 },
          fall: { mean: 22, variance: 12, max: 48 }
        }
      },
      defaultBiome: "temperate-grassland"
    },
    "subarctic-maritime": {
      name: "Subarctic Maritime",
      description: "Coastal regions with significant ocean influence. Moderated temperatures compared to continental areas at the same latitude, but prone to powerful coastal storms. Real-world examples: Iceland, coastal Greenland, Faroe Islands.",
      searchTerms: ["iceland", "nordic coast", "stormy shore", "north atlantic", "viking coast", "volcanic island", "windswept coast"],
      gameplayImpact: "Challenging sailing conditions with frequent storms. Snow mixed with rain in winter creates hazardous conditions. Coastal infrastructure vulnerable to storm damage.",
      parameters: {
        latitude: 62,
        elevation: 100,
        maritimeInfluence: 0.9,
        terrainRoughness: 0.6,
        specialFactors: {
          coastalStorms: 0.9,
          highWinds: 0.8,
          groundType: 'rock',
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
        },
        // Subarctic maritime: Ocean adds moisture but cold limits dew points
        dewPointProfile: {
          annual: { mean: 32, variance: 12, max: 55 },
          winter: { mean: 18, variance: 8, max: 32 },
          spring: { mean: 30, variance: 10, max: 45 },
          summer: { mean: 48, variance: 8, max: 58 },
          fall: { mean: 35, variance: 10, max: 50 }
        }
      },
      defaultBiome: "boreal-forest"
    },
    "peatland-muskeg": {
      name: "Peatland/Muskeg",
      description: "Waterlogged terrain with sphagnum moss and stunted trees growing on partially frozen soil. Frozen in winter, but thaws into challenging terrain in summer. Real-world examples: Hudson Bay lowlands Canada, western Siberian bogs, Finnish Lapland.",
      searchTerms: ["bog", "swamp", "marsh", "wetland", "peat bog", "spongy ground", "mire", "fen", "muskeg"],
      gameplayImpact: "Extremely difficult terrain for travel when thawed. Firm travel surface in winter when frozen. Insect swarms in summer. Fire risk in dry periods despite wet appearance.",
      parameters: {
        latitude: 65,
        elevation: 300,
        maritimeInfluence: 0.4,
        terrainRoughness: 0.3,
        specialFactors: {
          standingWater: 0.7,
          forestDensity: 0.4,
          groundType: 'peat',
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
        },
        // Peatland muskeg: Wet but cold, summer evaporation adds moisture
        dewPointProfile: {
          annual: { mean: 22, variance: 18, max: 60 },
          winter: { mean: -15, variance: 10, max: 10 },
          spring: { mean: 22, variance: 12, max: 45 },
          summer: { mean: 55, variance: 10, max: 68 },
          fall: { mean: 28, variance: 12, max: 50 }
        }
      },
      defaultBiome: "tundra"
    },
    // === SUBARCTIC OCEAN TEMPLATES ===
    "subarctic-waters": {
      name: "Subarctic Waters",
      description: "Cold, stormy seas with frequent fog and unpredictable weather. Rich fishing grounds but treacherous conditions. Seasonal ice possible in winter months. Real-world examples: Bering Sea, Norwegian Sea, Labrador Sea.",
      searchTerms: ["bering sea", "deadliest catch", "fishing waters", "cold sea", "stormy ocean", "foggy waters", "crab fishing"],
      gameplayImpact: "Dangerous sailing conditions year-round. Fog banks appear suddenly. Strong currents near coastlines. Winter storms can be devastating. Excellent fishing when conditions allow.",
      parameters: {
        latitude: 62,
        elevation: 0,
        maritimeInfluence: 1.0,
        terrainRoughness: 0.4,
        specialFactors: {
          isOcean: true,
          seaType: 'open',
          currentStrength: 0.6,
          swellSource: 'westerlies',
          baseSwellHeight: 8,
          baseSwellPeriod: 10,
          fog: 0.7,
          stormFrequency: 0.6,
          groundType: 'water',
        },
        temperatureProfile: {
          annual: { mean: 42, variance: 20 },
          winter: { mean: 32, variance: 12 },
          spring: { mean: 40, variance: 14 },
          summer: { mean: 52, variance: 10 },
          fall: { mean: 44, variance: 14 }
        },
        humidityProfile: {
          annual: { mean: 85, variance: 10 },
          winter: { mean: 82, variance: 10 },
          spring: { mean: 85, variance: 10 },
          summer: { mean: 88, variance: 8 },
          fall: { mean: 85, variance: 10 }
        },
        dewPointProfile: {
          annual: { mean: 36, variance: 14, max: 52 },
          winter: { mean: 26, variance: 10, max: 38 },
          spring: { mean: 34, variance: 12, max: 48 },
          summer: { mean: 48, variance: 8, max: 58 },
          fall: { mean: 38, variance: 12, max: 52 }
        }
      },
      defaultBiome: "ocean"
    }
  },

  // FLAT DISC: Tropical (5,500-6,700 mi) = warm, humid, fed by rim glacial melt
  "tropical": {
    "rainforest-basin": {
      name: "Rainforest Basin",
      description: "Dense, humid rainforests with consistent temperatures and rainfall throughout the year. Daily afternoon thunderstorms are common. Real-world examples: Singapore, Manaus Brazil, Iquitos Peru.",
      searchTerms: ["jungle", "amazon", "congo", "dense forest", "tropical forest", "humid forest", "rainforest", "primeval"],
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
          groundType: 'soil',
        },
        temperatureProfile: {
          annual: { mean: 80, variance: 4 },
          winter: { mean: 80, variance: 4 },
          spring: { mean: 80, variance: 4 },
          summer: { mean: 81, variance: 4 },
          fall: { mean: 80, variance: 4 }
        },
        humidityProfile: {
          annual: { mean: 85, variance: 10 },
          winter: { mean: 85, variance: 10 },
          spring: { mean: 86, variance: 8 },
          summer: { mean: 84, variance: 10 },
          fall: { mean: 85, variance: 8 }
        },
        // Rainforest basin: Constant high moisture, oppressively humid year-round
        dewPointProfile: {
          annual: { mean: 74, variance: 4, max: 82 },
          winter: { mean: 74, variance: 4, max: 82 },
          spring: { mean: 75, variance: 4, max: 83 },
          summer: { mean: 74, variance: 4, max: 82 },
          fall: { mean: 74, variance: 4, max: 82 }
        }
      },
      defaultBiome: "tropical-rainforest"
    },
    "equatorial-highland": {
      name: "Equatorial Highland",
      description: "Cool mountain environments near the equator, often called \"eternal spring\" climates. Morning fog and afternoon rain are common, with pleasant temperatures year-round. Real-world examples: Nairobi Kenya, Quito Ecuador, Medellín Colombia.",
      searchTerms: ["cool tropics", "eternal spring", "highland", "mountain tropics", "coffee country", "cloud forest", "kenya", "colombia"],
      gameplayImpact: "Morning fog can limit visibility. Steep terrain slows travel. Afternoon storms develop quickly and can cause flash floods in ravines.",
      parameters: {
        latitude: 5,
        elevation: 5000,
        maritimeInfluence: 0.4,
        terrainRoughness: 0.7,
        specialFactors: {
          hasFog: true,
          volcanicActivity: 0.3,
          groundType: 'rock',
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
        },
        // Equatorial highland: Elevation keeps dew points moderate despite tropics
        dewPointProfile: {
          annual: { mean: 55, variance: 6, max: 68 },
          winter: { mean: 54, variance: 6, max: 66 },
          spring: { mean: 56, variance: 6, max: 68 },
          summer: { mean: 55, variance: 6, max: 68 },
          fall: { mean: 54, variance: 6, max: 66 }
        }
      },
      defaultBiome: "tropical-rainforest"
    },
    "island-archipelago": {
      name: "Island Archipelago",
      description: "Scattered islands with extremely stable temperatures and consistent trade winds. Afternoon showers are common but typically brief. Real-world examples: Indonesia, Philippines, Maldives.",
      searchTerms: ["island chain", "tropical islands", "pacific islands", "indonesia", "philippines", "atoll", "paradise", "palm beach"],
      gameplayImpact: "Predictable weather patterns with reliable sea breezes. Ocean travel affected by afternoon squalls. Volcanic islands may have unique microclimates.",
      parameters: {
        latitude: 5,
        elevation: 200,
        maritimeInfluence: 0.95,
        terrainRoughness: 0.5,
        specialFactors: {
          highRainfall: true,
          coastalWinds: 0.7,
          volcanicActivity: 0.4,
          groundType: 'sand',
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
        },
        // Island archipelago: Warm ocean provides high but steady dew points
        dewPointProfile: {
          annual: { mean: 72, variance: 4, max: 80 },
          winter: { mean: 71, variance: 4, max: 78 },
          spring: { mean: 72, variance: 4, max: 80 },
          summer: { mean: 73, variance: 4, max: 81 },
          fall: { mean: 72, variance: 4, max: 80 }
        }
      },
      defaultBiome: "tropical-rainforest"
    },
    "volcanic-zone": {
      name: "Volcanic Zone",
      description: "Dramatic landscapes with active volcanoes and unpredictable local weather patterns. Fertile soil supports lush vegetation despite rugged terrain. Real-world examples: Hawaii Big Island, Java Indonesia, Réunion Island.",
      searchTerms: ["volcano", "lava", "crater", "volcanic", "hawaii", "active volcano", "magma", "eruption zone"],
      gameplayImpact: "Potentially hazardous volcanic events. Unpredictable local weather due to terrain complexity. Steep slopes and difficult terrain. Frequent earth tremors.",
      parameters: {
        latitude: 5,
        elevation: 3000,
        maritimeInfluence: 0.5,
        terrainRoughness: 0.9,
        specialFactors: {
          volcanicActivity: 0.8,
          tectonicActivity: 0.7,
          hasFog: true,
          groundType: 'rock',
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
        },
        // Volcanic zone: Elevation moderates tropical moisture
        dewPointProfile: {
          annual: { mean: 62, variance: 8, max: 75 },
          winter: { mean: 61, variance: 8, max: 74 },
          spring: { mean: 63, variance: 8, max: 76 },
          summer: { mean: 62, variance: 8, max: 75 },
          fall: { mean: 62, variance: 8, max: 75 }
        }
      },
      defaultBiome: "tropical-rainforest"
    },
    "equatorial-swamp": {
      name: "Equatorial Swamp",
      description: "Low-lying, waterlogged areas with extremely high humidity and heat. Standing water is common year-round with minimal seasonal variation. Real-world examples: Congo Basin swamps, Borneo peat swamps, Papua New Guinea lowlands.",
      searchTerms: ["tropical swamp", "jungle swamp", "steamy marsh", "humid wetland", "crocodile swamp", "muddy jungle", "feverlands"],
      gameplayImpact: "Difficult terrain with standing water. Disease risk from insects. Limited visibility in tangled vegetation. Almost constant high humidity affects equipment and comfort.",
      parameters: {
        latitude: 5,
        elevation: 100,
        maritimeInfluence: 0.8,
        terrainRoughness: 0.3,
        specialFactors: {
          highRainfall: true,
          standingWater: 0.9,
          forestDensity: 0.7,
          groundType: 'clay',
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
        },
        // Equatorial swamp: Extreme moisture, near-saturation year-round
        dewPointProfile: {
          annual: { mean: 78, variance: 3, max: 86 },
          winter: { mean: 77, variance: 3, max: 85 },
          spring: { mean: 78, variance: 3, max: 86 },
          summer: { mean: 79, variance: 3, max: 87 },
          fall: { mean: 78, variance: 3, max: 86 }
        }
      },
      defaultBiome: "tropical-seasonal"
    },
    // === TROPICAL OCEAN TEMPLATES ===
    "tropical-seas": {
      name: "Tropical Seas",
      description: "Warm, calm waters with gentle trade wind swells. Generally excellent sailing conditions with predictable weather patterns. Occasional afternoon squalls, especially near islands. Real-world examples: Coral Sea, South China Sea, Bay of Bengal.",
      searchTerms: ["warm ocean", "tropical water", "calm seas", "sailing paradise", "blue water", "equatorial ocean", "easy sailing"],
      gameplayImpact: "Easy sailing most of the time. Afternoon squalls may require shelter. Heat affects crew stamina. Doldrums possible near equator with becalmed conditions.",
      parameters: {
        latitude: 10,
        elevation: 0,
        maritimeInfluence: 1.0,
        terrainRoughness: 0.2,
        specialFactors: {
          isOcean: true,
          seaType: 'open',
          currentStrength: 0.4,
          swellSource: 'trade',
          baseSwellHeight: 3,
          baseSwellPeriod: 10,
          doldrums: 0.3,
          squalls: 0.4,
          groundType: 'water',
        },
        temperatureProfile: {
          annual: { mean: 82, variance: 4 },
          winter: { mean: 80, variance: 4 },
          spring: { mean: 82, variance: 4 },
          summer: { mean: 84, variance: 3 },
          fall: { mean: 82, variance: 4 }
        },
        humidityProfile: {
          annual: { mean: 80, variance: 8 },
          winter: { mean: 78, variance: 8 },
          spring: { mean: 80, variance: 8 },
          summer: { mean: 82, variance: 6 },
          fall: { mean: 80, variance: 8 }
        },
        dewPointProfile: {
          annual: { mean: 74, variance: 4, max: 82 },
          winter: { mean: 72, variance: 4, max: 80 },
          spring: { mean: 74, variance: 4, max: 82 },
          summer: { mean: 76, variance: 3, max: 84 },
          fall: { mean: 74, variance: 4, max: 82 }
        }
      },
      defaultBiome: "ocean"
    },
    "coral-reef-waters": {
      name: "Coral Reef Waters",
      description: "Shallow, crystal-clear tropical waters over reef systems. Beautiful but hazardous for navigation - coral heads and sudden shallows demand careful piloting. Real-world examples: Great Barrier Reef, Red Sea reefs, Belize Barrier Reef.",
      searchTerms: ["reef", "coral", "lagoon", "shallow sea", "barrier reef", "diving", "snorkeling", "crystal water"],
      gameplayImpact: "Stunning underwater visibility but extreme navigation hazards. Grounding on reef can be catastrophic. Rich marine life for fishing and diving. Calm conditions inside reef barriers.",
      parameters: {
        latitude: 15,
        elevation: 0,
        maritimeInfluence: 1.0,
        terrainRoughness: 0.6,
        specialFactors: {
          isOcean: true,
          seaType: 'coastal',
          currentStrength: 0.3,
          swellSource: 'trade',
          baseSwellHeight: 2,
          baseSwellPeriod: 8,
          reefs: 0.9,
          shallows: 0.8,
          groundType: 'water',
        },
        temperatureProfile: {
          annual: { mean: 82, variance: 4 },
          winter: { mean: 80, variance: 4 },
          spring: { mean: 82, variance: 4 },
          summer: { mean: 84, variance: 3 },
          fall: { mean: 82, variance: 4 }
        },
        humidityProfile: {
          annual: { mean: 78, variance: 10 },
          winter: { mean: 76, variance: 10 },
          spring: { mean: 78, variance: 10 },
          summer: { mean: 80, variance: 8 },
          fall: { mean: 78, variance: 10 }
        },
        dewPointProfile: {
          annual: { mean: 72, variance: 4, max: 80 },
          winter: { mean: 70, variance: 4, max: 78 },
          spring: { mean: 72, variance: 4, max: 80 },
          summer: { mean: 74, variance: 3, max: 82 },
          fall: { mean: 72, variance: 4, max: 80 }
        }
      },
      defaultBiome: "ocean"
    }
  },


  // Special/Unusual templates (available in multiple latitude bands)
  "special": {
    "mountain-microclimate": {
      name: "Mountain Microclimate",
      description: "Protected valleys, sunny slopes, or wind-sheltered areas that create distinct local climates that differ significantly from the surrounding region. Real-world examples: Okanagan Valley Canada, Valais Switzerland, Hunza Valley Pakistan.",
      searchTerms: ["sheltered valley", "protected zone", "oasis", "mountain valley", "hidden valley", "warm pocket", "microclimate"],
      gameplayImpact: "May support agriculture or habitation in otherwise inhospitable areas. Distinct flora and fauna. Rapid weather changes when leaving the protected zone.",
      parameters: {
        latitude: 40, // Can be adjusted based on location
        elevation: 4000,
        maritimeInfluence: 0.4,
        terrainRoughness: 0.9,
        specialFactors: {
          microclimateFactor: 0.9,
          hasFog: true,
          lowAtmosphericPressure: 0.7,
          groundType: 'rock',
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
        },
        // Mountain microclimate: Varies by location, moderate dew points
        dewPointProfile: {
          annual: { mean: 38, variance: 12, max: 60 },
          winter: { mean: 25, variance: 10, max: 42 },
          spring: { mean: 38, variance: 12, max: 55 },
          summer: { mean: 52, variance: 10, max: 65 },
          fall: { mean: 40, variance: 10, max: 55 }
        }
      },
      defaultBiome: "temperate-deciduous",
      compatibleBands: ["temperate", "subtropical", "subarctic", "boreal"]
    },
    "geothermal-zone": {
      name: "Geothermal Zone",
      description: "Areas with active volcanic or geothermal features creating localized heating and unique environmental conditions. Hot springs, geysers, and steam vents are common. Real-world examples: Yellowstone Wyoming, Rotorua New Zealand, Iceland geothermal areas.",
      searchTerms: ["hot springs", "geyser", "thermal", "yellowstone", "steam vent", "hot pool", "sulfur", "volcanic springs"],
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
          sulphurVents: 0.6,
          groundType: 'rock',
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
        },
        // Geothermal zone: Local steam adds moisture, higher dew points than surroundings
        dewPointProfile: {
          annual: { mean: 45, variance: 12, max: 62 },
          winter: { mean: 38, variance: 10, max: 52 },
          spring: { mean: 44, variance: 12, max: 58 },
          summer: { mean: 52, variance: 10, max: 65 },
          fall: { mean: 46, variance: 10, max: 58 }
        }
      },
      defaultBiome: "temperate-rainforest",
      compatibleBands: ["polar", "tropical", "subtropical", "temperate", "subarctic", "boreal"]
    },
    "convergence-zone": {
      name: "Convergence Zone",
      description: "Areas where different climate systems regularly collide, creating highly variable and often dramatic weather patterns. Rapid changes are the norm rather than the exception. Real-world examples: Tornado Alley USA, Puget Sound convergence zone, South Africa's Cape.",
      searchTerms: ["storm prone", "unpredictable weather", "tornado alley", "weather clash", "volatile", "changeable", "fronts"],
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
          strongSeasonalShifts: 0.7,
          groundType: 'soil',
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
        },
        // Convergence zone: Highly variable, can swing from dry to humid
        dewPointProfile: {
          annual: { mean: 42, variance: 18, max: 72 },
          winter: { mean: 25, variance: 15, max: 48 },
          spring: { mean: 42, variance: 18, max: 68 },
          summer: { mean: 58, variance: 15, max: 75 },
          fall: { mean: 42, variance: 15, max: 65 }
        }
      },
      defaultBiome: "temperate-deciduous",
      compatibleBands: ["subtropical", "temperate", "subarctic", "boreal"]
    },
    "rain-shadow": {
      name: "Rain Shadow",
      description: "Dry regions on the leeward side of mountain ranges where most moisture is blocked by the mountains. Stark contrast often exists between opposite sides of the same mountain range. Real-world examples: eastern Washington state, Tibetan Plateau, Patagonian Desert.",
      searchTerms: ["leeward", "dry valley", "mountain shadow", "arid", "rain blocked", "semi-arid", "high desert"],
      gameplayImpact: "Water scarcity is a primary concern. Large temperature variations between day and night. Vegetation and resources differ dramatically across short distances.",
      parameters: {
        latitude: 40, // Can be adjusted based on location
        elevation: 2500,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.7,
        specialFactors: {
          rainShadowEffect: 0.9,
          hasDrySeason: true,
          highDiurnalVariation: true,
          groundType: 'sand',
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
        },
        // Rain shadow: Very dry, mountains block moisture
        dewPointProfile: {
          annual: { mean: 28, variance: 12, max: 52 },
          winter: { mean: 18, variance: 10, max: 35 },
          spring: { mean: 28, variance: 12, max: 48 },
          summer: { mean: 40, variance: 10, max: 58 },
          fall: { mean: 28, variance: 10, max: 48 }
        }
      },
      defaultBiome: "desert",
      compatibleBands: ["subtropical", "temperate", "subarctic", "boreal"]
    },
    "coastal-desert": {
      name: "Coastal Desert",
      description: "Unusual arid regions adjacent to oceans, created by cold offshore currents. Often characterized by morning fog but minimal precipitation, creating unique ecosystems. Real-world examples: Atacama Desert Chile, Namib Desert Namibia, Baja California coast.",
      searchTerms: ["atacama", "namib", "fog desert", "coastal arid", "cold current", "driest", "desert coast", "fog harvest"],
      gameplayImpact: "Morning fog provides water for unique desert-adapted plants. Fishing opportunities despite desert conditions. Cooler temperatures than inland deserts at the same latitude.",
      parameters: {
        latitude: 25, // Can be adjusted based on location
        elevation: 500,
        maritimeInfluence: 0.7,
        terrainRoughness: 0.6,
        specialFactors: {
          coldOceanCurrent: 0.9,
          coastalFog: 0.8,
          hasDrySeason: true,
          groundType: 'sand',
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
        },
        // Coastal desert: Cold current keeps dew points moderate despite humidity
        dewPointProfile: {
          annual: { mean: 50, variance: 8, max: 62 },
          winter: { mean: 48, variance: 6, max: 58 },
          spring: { mean: 50, variance: 6, max: 60 },
          summer: { mean: 54, variance: 6, max: 65 },
          fall: { mean: 52, variance: 6, max: 62 }
        }
      },
      defaultBiome: "desert",
      compatibleBands: ["subtropical", "temperate"]
    },
    // === SPECIAL OCEAN TEMPLATES ===
    "strait-passage": {
      name: "Strait Passage",
      description: "Narrow waterway connecting larger bodies of water. Strong tidal currents accelerate through the constriction, creating challenging but predictable sailing conditions. Real-world examples: Strait of Gibraltar, Strait of Magellan, Bosphorus.",
      searchTerms: ["strait", "channel", "narrows", "chokepoint", "passage", "gibraltar", "bosphorus", "waterway"],
      gameplayImpact: "Timing is everything - slack tide required for safe passage. Strong currents can exceed vessel speed. Excellent defensive chokepoint. Weather funnels through strait.",
      parameters: {
        latitude: 45,
        elevation: 0,
        maritimeInfluence: 1.0,
        terrainRoughness: 0.7,
        specialFactors: {
          isOcean: true,
          seaType: 'strait',
          currentStrength: 0.9,
          swellSource: 'local',
          baseSwellHeight: 2,
          baseSwellPeriod: 5,
          tidalRange: 'macro',
          tidalCurrents: 0.9,
          groundType: 'water',
        },
        temperatureProfile: {
          annual: { mean: 54, variance: 18 },
          winter: { mean: 44, variance: 12 },
          spring: { mean: 52, variance: 14 },
          summer: { mean: 64, variance: 10 },
          fall: { mean: 56, variance: 14 }
        },
        humidityProfile: {
          annual: { mean: 75, variance: 15 },
          winter: { mean: 78, variance: 12 },
          spring: { mean: 75, variance: 15 },
          summer: { mean: 72, variance: 12 },
          fall: { mean: 75, variance: 15 }
        },
        dewPointProfile: {
          annual: { mean: 44, variance: 12, max: 60 },
          winter: { mean: 36, variance: 10, max: 48 },
          spring: { mean: 42, variance: 12, max: 56 },
          summer: { mean: 54, variance: 8, max: 64 },
          fall: { mean: 46, variance: 10, max: 58 }
        }
      },
      defaultBiome: "ocean",
      compatibleBands: ["polar", "subarctic", "boreal", "temperate", "subtropical", "tropical"]
    },
    "archipelago-waters": {
      name: "Archipelago Waters",
      description: "Complex waters threading between numerous islands. Sheltered passages alternate with exposed crossings. Local knowledge is essential for safe navigation. Real-world examples: Greek Islands, Stockholm archipelago Sweden, Thousand Islands St. Lawrence.",
      searchTerms: ["island waters", "greek islands", "between islands", "complex navigation", "sheltered waters", "island hopping"],
      gameplayImpact: "Many route options but navigation is complex. Shelter always nearby. Currents unpredictable between islands. Excellent for ambushes and evasion. Rich fishing.",
      parameters: {
        latitude: 40,
        elevation: 0,
        maritimeInfluence: 0.95,
        terrainRoughness: 0.7,
        specialFactors: {
          isOcean: true,
          seaType: 'coastal',
          currentStrength: 0.5,
          swellSource: 'local',
          baseSwellHeight: 2,
          baseSwellPeriod: 6,
          islandEffect: true,
          sheltered: 0.6,
          groundType: 'water',
        },
        temperatureProfile: {
          annual: { mean: 58, variance: 16 },
          winter: { mean: 48, variance: 10 },
          spring: { mean: 56, variance: 12 },
          summer: { mean: 68, variance: 8 },
          fall: { mean: 60, variance: 12 }
        },
        humidityProfile: {
          annual: { mean: 76, variance: 14 },
          winter: { mean: 78, variance: 12 },
          spring: { mean: 76, variance: 14 },
          summer: { mean: 74, variance: 12 },
          fall: { mean: 76, variance: 14 }
        },
        dewPointProfile: {
          annual: { mean: 48, variance: 12, max: 64 },
          winter: { mean: 40, variance: 10, max: 52 },
          spring: { mean: 46, variance: 10, max: 58 },
          summer: { mean: 58, variance: 8, max: 68 },
          fall: { mean: 50, variance: 10, max: 62 }
        }
      },
      defaultBiome: "ocean",
      compatibleBands: ["subarctic", "boreal", "temperate", "subtropical", "tropical"]
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