// src/data/regionTemplates.js
// Detailed region templates for meteorological system

/**
 * Region templates provide pre-configured parameter sets for different region types.
 * Each template includes parameters that affect weather generation when using the
 * meteorological weather system.
 */
export const regionTemplates = [
    {
      id: 'tropical-rainforest',
      name: 'Tropical Rainforest',
      description: 'Hot, humid jungle regions near the equator with year-round rainfall and minimal seasonal variation',
      biomeMapping: 'tropical-rainforest',
      parameters: {
        latitude: 5,
        elevation: 500,
        maritimeInfluence: 0.8,
        terrainRoughness: 0.6,
        specialFactors: {
          hasMonsoonSeason: true,
          highRainfall: true
        }
      },
      gameDescription: 'Dense jungle canopies provide shade from the constant heat and humidity. Expect rain nearly every day, often in the form of afternoon thunderstorms. Temperature varies little throughout the year, with daily highs of 85-95°F and nightly lows rarely below 70°F. Fog is common in the mornings.'
    },
    {
      id: 'tropical-seasonal',
      name: 'Tropical Monsoon',
      description: 'Tropical region with distinct wet and dry seasons, characterized by seasonal wind shifts',
      biomeMapping: 'tropical-seasonal',
      parameters: {
        latitude: 15,
        elevation: 800,
        maritimeInfluence: 0.4,
        terrainRoughness: 0.4,
        specialFactors: {
          hasMonsoonSeason: true,
          hasDrySeason: true
        }
      },
      gameDescription: 'A land of stark contrast between seasons. During the wet season, torrential downpours occur almost daily, with intense thunderstorms and potential flooding. The dry season brings clear skies and hot temperatures, with little to no rainfall for months. Vegetation cycles between lush growth and brown dormancy.'
    },
    {
      id: 'desert-hot',
      name: 'Hot Desert',
      description: 'Extremely hot, arid region with minimal precipitation and dramatic temperature swings',
      biomeMapping: 'desert',
      parameters: {
        latitude: 25,
        elevation: 2000,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.7,
        specialFactors: {
          hasDrySeason: true,
          highDiurnalVariation: true
        }
      },
      gameDescription: 'Scorching days and cold nights define this harsh landscape. Daytime temperatures regularly exceed 100°F, while nighttime can drop below 50°F due to rapid heat loss. Rain is extremely rare, often coming in brief but violent thunderstorms. Dust storms may occur when winds pick up. Water is precious and difficult to find.'
    },
    {
      id: 'desert-cold',
      name: 'Cold Desert',
      description: 'High-elevation desert with cold winters, hot summers, and very little precipitation',
      biomeMapping: 'desert',
      parameters: {
        latitude: 40,
        elevation: 4000,
        maritimeInfluence: 0.1,
        terrainRoughness: 0.8,
        specialFactors: {
          highDiurnalVariation: true,
          coldWinters: true
        }
      },
      gameDescription: 'Unlike hot deserts, cold deserts experience freezing winters with occasional snow. Summer days remain hot but rarely extreme. The air is thin at high elevation, making temperature swings between day and night even more pronounced. Vegetation is sparse and adapted to both drought and cold.'
    },
    {
      id: 'grassland-temperate',
      name: 'Temperate Grassland',
      description: 'Wide open plains with seasonal temperature variations and moderate rainfall',
      biomeMapping: 'temperate-grassland',
      parameters: {
        latitude: 40,
        elevation: 1500,
        maritimeInfluence: 0.2,
        terrainRoughness: 0.3,
        specialFactors: {
          highWinds: true,
          seasonalPrecipitation: true
        }
      },
      gameDescription: 'Vast open plains where the horizon stretches unbroken for miles. With few trees to block the wind, strong gusts are common. Summers are warm to hot, winters cold to freezing. Spring brings thunderstorms and potential tornadoes in some regions. Grasses may grow tall in summer but turn golden brown in the dry season or winter.'
    },
    {
      id: 'forest-deciduous',
      name: 'Temperate Deciduous Forest',
      description: 'Forest region with distinct four seasons and moderate precipitation year-round',
      biomeMapping: 'temperate-deciduous',
      parameters: {
        latitude: 45,
        elevation: 800,
        maritimeInfluence: 0.5,
        terrainRoughness: 0.5,
        specialFactors: {
          seasonalFoliage: true
        }
      },
      gameDescription: 'The classic four-season forest. Spring brings rain and new growth, summer is warm and green, autumn features spectacular foliage colors, and winter brings snow and bare trees. Precipitation is distributed throughout the year with no pronounced dry season. Comfortable summer days can turn hot, while winter brings freezing temperatures and snow cover.'
    },
    {
      id: 'forest-rainforest-temperate',
      name: 'Temperate Rainforest',
      description: 'Lush coastal forest with cool temperatures and very high rainfall',
      biomeMapping: 'temperate-rainforest',
      parameters: {
        latitude: 45,
        elevation: 500,
        maritimeInfluence: 0.9,
        terrainRoughness: 0.7,
        specialFactors: {
          hasFog: true,
          highRainfall: true
        }
      },
      gameDescription: 'Perpetually damp forests draped in moss and ferns. Fog is common, especially in morning hours. Rain falls year-round, though winter may bring the heaviest precipitation. Temperatures remain relatively mild due to maritime influence, with cool summers and mild winters for the latitude. These forests feel ancient and mysterious, with limited visibility through the mist.'
    },
    {
      id: 'forest-boreal',
      name: 'Boreal Forest',
      description: 'Northern coniferous forest with long, harsh winters and short, mild summers',
      biomeMapping: 'boreal-forest',
      parameters: {
        latitude: 55,
        elevation: 1200,
        maritimeInfluence: 0.3,
        terrainRoughness: 0.6,
        specialFactors: {
          longWinters: true,
          shortSummers: true
        }
      },
      gameDescription: 'The great northern forests of towering evergreens. Winters are long, dark, and bitterly cold with deep snow cover. Spring and fall are brief transitions, while the short summer brings a burst of plant growth and insect activity. The seasonal light cycle is pronounced, with very long summer days and very short winter days. Large temperature swings can occur throughout the year.'
    },
    {
      id: 'tundra',
      name: 'Arctic Tundra',
      description: 'Cold arctic region with permafrost, minimal precipitation, and extreme seasonal daylight variations',
      biomeMapping: 'tundra',
      parameters: {
        latitude: 70,
        elevation: 1500,
        maritimeInfluence: 0.5,
        terrainRoughness: 0.4,
        specialFactors: {
          hasPermafrost: true,
          polarDay: true,
          polarNight: true
        }
      },
      gameDescription: 'A harsh landscape beyond the tree line where permafrost prevents large plants from growing. Winter brings extreme cold, darkness, and howling winds. Summer offers a brief respite with temperatures sometimes reaching 50°F and 24-hour daylight. Despite the cold environment, precipitation is actually quite low, with most moisture locked in ice and snow. The stark beauty of this region belies its challenges.'
    },
    {
      id: 'coastal-warm',
      name: 'Warm Maritime',
      description: 'Coastal region with warm temperatures and high maritime influence',
      biomeMapping: 'temperate-deciduous',
      parameters: {
        latitude: 30,
        elevation: 100,
        maritimeInfluence: 0.9,
        terrainRoughness: 0.4,
        specialFactors: {
          hasFog: true,
          coastalBreezes: true
        }
      },
      gameDescription: 'Pleasant coastal areas with moderated temperatures year-round. The ocean keeps winters mild and summers cooler than inland areas at the same latitude. Sea breezes provide regular relief from heat, while morning fog is common. Tropical storms or hurricanes may threaten during certain seasons. The air always carries a hint of salt, and weather changes can blow in quickly from the sea.'
    },
    {
      id: 'coastal-cool',
      name: 'Cool Maritime',
      description: 'Cool coastal region with strong maritime influence and consistent weather patterns',
      biomeMapping: 'temperate-rainforest',
      parameters: {
        latitude: 50,
        elevation: 300,
        maritimeInfluence: 0.9,
        terrainRoughness: 0.5,
        specialFactors: {
          hasFog: true,
          coastalBreezes: true
        }
      },
      gameDescription: 'Cool, breezy coastlines where the ocean dominates the weather. Temperatures remain cool but rarely freezing even in winter. Mist and fog are common, especially in mornings. Strong storms may roll in from the sea in fall and winter. The climate feels consistent and predictable compared to inland areas, with smaller swings between seasons.'
    },
    {
      id: 'mountain-highland',
      name: 'Mountain Highland',
      description: 'High elevation mountain region with cool temperatures and variable conditions',
      biomeMapping: 'temperate-deciduous',
      parameters: {
        latitude: 40,
        elevation: 6000,
        maritimeInfluence: 0.2,
        terrainRoughness: 0.9,
        specialFactors: {
          hasOrographicEffect: true,
          highUVIndex: true
        }
      },
      gameDescription: 'The rarefied air of the high country, where weather can change rapidly. Temperatures are cool even in summer, and cold in winter with significant snowfall. Storms brew quickly and move fast. The thin air means intense sunshine and high UV exposure during clear days, despite the cool temperatures. When clouds roll in, they often cling to mountainsides, creating dramatic scenes of peaks rising above the clouds.'
    },
    {
      id: 'mountain-valley',
      name: 'Mountain Valley',
      description: 'Protected valley between mountains with microclimate distinct from surroundings',
      biomeMapping: 'temperate-grassland',
      parameters: {
        latitude: 40,
        elevation: 3000,
        maritimeInfluence: 0.2,
        terrainRoughness: 0.7,
        specialFactors: {
          isValley: true,
          hasMicroclimate: true
        }
      },
      gameDescription: 'Sheltered valleys between mountain ranges often develop their own microclimates. Protected from strong winds by surrounding peaks, these valleys can be surprisingly warm and lush. Temperature inversions may trap cold air in winter or early spring. Weather tends to be more stable than on the exposed mountainsides, though heavy precipitation on the mountains can lead to flash flooding in the valley below.'
    }
  ];
  
  /**
   * Maps the basic biome types to the most appropriate region template.
   * This allows backward compatibility with existing regions.
   */
  export const biomeToTemplateMap = {
    'tropical-rainforest': 'tropical-rainforest',
    'tropical-seasonal': 'tropical-seasonal',
    'desert': 'desert-hot',
    'temperate-grassland': 'grassland-temperate',
    'temperate-deciduous': 'forest-deciduous',
    'temperate-rainforest': 'forest-rainforest-temperate',
    'boreal-forest': 'forest-boreal',
    'tundra': 'tundra'
  };
  
  /**
   * Get a region template by ID
   * @param {string} id - Template ID
   * @returns {object|null} - Region template or null if not found
   */
  export const getTemplateById = (id) => {
    return regionTemplates.find(template => template.id === id) || null;
  };
  
  /**
   * Get the most appropriate template for a biome
   * @param {string} biome - Biome type
   * @returns {object} - Region template
   */
  export const getTemplateForBiome = (biome) => {
    const templateId = biomeToTemplateMap[biome] || 'forest-deciduous';
    return getTemplateById(templateId);
  };
  
  /**
   * Get parameter presets for a template
   * @param {string} templateId - Template ID 
   * @returns {object} - Parameter presets
   */
  export const getParametersForTemplate = (templateId) => {
    const template = getTemplateById(templateId);
    if (!template) return null;
    
    return template.parameters;
  };