// src/services/WeatherDescriptionService.js - Enhanced version
class WeatherDescriptionService {
    constructor() {
      // Sky descriptions with time-of-day awareness
      this.skyDescriptions = {
        "Clear Skies": {
          dawn: ["The sky is brightening with dawn's first light", "The eastern horizon glows with the first rays of sunrise", "A clear dawn sky promises a beautiful day"],
          morning: ["The morning sky is a perfect expanse of blue", "The early day sky is pristine and cloudless", "A flawless blue morning sky stretches overhead"],
          midday: ["The midday sky is a brilliant, unbroken blue", "The sun shines from a perfectly clear sky", "The noon sky is devoid of clouds"],
          afternoon: ["The afternoon sky remains clear and bright", "The cloudless afternoon sky allows the sun to shine freely", "The clear afternoon sky bathes everything in warm light"],
          dusk: ["The evening sky is clear as daylight begins to fade", "As the sun descends, the sky remains free of clouds", "A crisp, clear dusk sky shows the first few stars"],
          night: ["Stars speckle the crystal-clear night sky", "The cloudless night reveals a tapestry of stars", "The unobstructed night sky showcases a stellar display"]
        },
        "Light Clouds": {
          dawn: ["Dawn breaks through scattered clouds on the horizon", "Wispy clouds catch the first colors of sunrise", "The breaking dawn illuminates scattered clouds"],
          morning: ["A few wispy clouds float across the morning sky", "The morning sky hosts scattered white clouds", "Thin cloud patches dot the morning blue"],
          midday: ["Scattered clouds drift in the midday sky", "The midday sun occasionally ducks behind passing clouds", "Light clouds offer momentary respite from the direct sun"],
          afternoon: ["Scattered clouds drift through the afternoon sky", "The afternoon sun plays hide-and-seek with passing clouds", "White clouds leisurely cross the afternoon sky"],
          dusk: ["Evening clouds catch the sunset's colors", "Scattered clouds are painted with sunset hues", "The fading light turns passing clouds into works of art"],
          night: ["Wisps of cloud occasionally pass over the stars", "The moon peeks through scattered night clouds", "Thin clouds drift across the starry night sky"]
        },
        "Heavy Clouds": {
          dawn: ["A heavily overcast sky mutes the dawn light", "Dawn struggles to penetrate the thick cloud cover", "The sunrise is barely visible through the dense clouds"],
          morning: ["Thick gray clouds blanket the morning sky", "A heavy overcast dims the morning light", "Dense cloud cover hangs over the morning landscape"],
          midday: ["The midday sun is completely obscured by thick clouds", "Heavy clouds cast the land in midday shadow", "The overhead cloud layer steals the day's brightness"],
          afternoon: ["The afternoon light is subdued by a heavy cloud layer", "Thick clouds block the afternoon sun", "The overcast afternoon sky suggests impending weather"],
          dusk: ["The clouded sky hastens the approach of darkness", "Dusk arrives early under the heavy cloud cover", "Evening gloom is deepened by the thick overhead clouds"],
          night: ["Clouds block out the stars and moonlight", "The night is especially dark under the cloud-sealed sky", "Not a single star penetrates the nocturnal cloud cover"]
        },
        "Rain": {
          dawn: ["Rain falls steadily as the hidden sun begins to rise", "The dawn is gray and wet with continuous rainfall", "Morning breaks with the sound of rain on rooftops"],
          morning: ["Rain falls steadily through the morning hours", "A persistent morning rainfall soaks the ground", "Raindrops patter continuously through the morning"],
          midday: ["Rain continues to fall from the midday sky", "The midday downpour shows no sign of letting up", "Rain streams down as the day reaches its middle hours"],
          afternoon: ["The afternoon is washed with steady rainfall", "Rain continues to fall as the day progresses", "The afternoon sky releases a constant shower"],
          dusk: ["Rain continues as daylight fades", "The setting sun is completely hidden by rain clouds", "Evening rain blurs the transition to night"],
          night: ["Rain falls relentlessly through the darkness", "The night echoes with the sound of falling rain", "Rainfall continues unabated through the night hours"]
        },
        "Heavy Rain": {
          dawn: ["Heavy rain drowns out the dawn", "The day begins with a torrential downpour", "Dawn breaks amidst a deluge of rain"],
          morning: ["Heavy rain pounds down through the morning", "The morning is drenched in torrential rainfall", "A morning deluge reduces visibility significantly"],
          midday: ["The midday sky unleashes sheets of heavy rain", "Torrential rain hammers down at midday", "The heavy midday rainfall creates impromptu streams"],
          afternoon: ["The afternoon is dominated by heavy rainfall", "Thick curtains of rain drench the afternoon landscape", "The heavy rainfall shows no sign of letting up this afternoon"],
          dusk: ["Heavy rain continues as day surrenders to night", "Dusk is barely noticeable through the heavy downpour", "The transition to night is marked only by increasing darkness under the deluge"],
          night: ["The night reverberates with heavy rainfall", "Torrential rain hammers through the darkness", "The heavy nighttime downpour drowns out all other sounds"]
        },
        "Snow": {
          dawn: ["Snow falls gently as dawn lightens the sky", "The first light reveals a world being covered in fresh snow", "Dawn breaks over a landscape being blanketed in white"],
          morning: ["Snowflakes drift down through the morning light", "The morning continues with a steady snowfall", "Snow accumulates gradually as the morning progresses"],
          midday: ["Snow continues to fall at midday", "Midday brings no pause to the gentle snowfall", "The midday landscape is transformed by continuing snow"],
          afternoon: ["The afternoon snow creates a peaceful atmosphere", "Snowflakes continue their descent through the afternoon hours", "The afternoon landscape is progressively whitened by falling snow"],
          dusk: ["Snow falls through the dimming light of dusk", "Evening approaches with no cessation of snowfall", "The last light of day sparkles on fresh-fallen snow"],
          night: ["Snowflakes are visible as they pass through pools of light", "The night snow accumulates silently in the darkness", "Snow continues its quiet descent through the night"]
        }
      };
      
      // Default descriptions for any missing conditions
      for (const condition in this.skyDescriptions) {
        for (const timeOfDay of ['dawn', 'morning', 'midday', 'afternoon', 'dusk', 'night']) {
          if (!this.skyDescriptions[condition][timeOfDay]) {
            this.skyDescriptions[condition][timeOfDay] = [`The ${condition.toLowerCase()} continues as ${timeOfDay} arrives`];
          }
        }
      }
      
      // Default for any condition not explicitly handled
      this.skyDescriptions.default = {
        dawn: ["The dawn reveals changing weather conditions", "First light shows an unsettled sky", "As day breaks, the weather appears to be in transition"],
        morning: ["The morning sky shows signs of changing weather", "The morning atmosphere feels unsettled", "Weather conditions are in flux this morning"],
        midday: ["Midday brings shifting weather patterns", "The weather at midday seems to be in transition", "The sky at noon suggests changing conditions"],
        afternoon: ["The afternoon weather is in a state of change", "Atmospheric conditions shift as the afternoon continues", "The afternoon sky is difficult to predict"],
        dusk: ["As night approaches, the weather remains changeable", "Dusk brings uncertain weather conditions", "The transition to night occurs under changing skies"],
        night: ["The night sky is in a state of meteorological flux", "Weather conditions continue to change through the darkness", "Nightfall brings unsettled weather"]
      };
      
      this.windDescriptions = {
        "Calm": [
          "The air is completely still",
          "There's barely a whisper of wind",
          "No breeze stirs the air",
          "Not even a leaf moves in the still air"
        ],
        "Breezy": [
          "A gentle breeze rustles the vegetation",
          "A light wind carries scents from afar",
          "A mild breeze occasionally stirs the surroundings",
          "The pleasant breeze provides a slight cooling effect"
        ],
        "Windy": [
          "The wind blows steadily, swaying branches",
          "A persistent wind tugs at clothing and hair",
          "Strong gusts occasionally punctuate the steady wind",
          "The wind makes flags and banners snap and flutter"
        ],
        "Strong Winds": [
          "Powerful winds bend tree tops and make walking difficult",
          "The strong wind forces people to lean into it when facing it directly",
          "Forceful gusts threaten to tear away loose objects",
          "The wind howls around buildings and natural formations"
        ],
        "Gale Force": [
          "The gale-force winds make travel treacherous",
          "Violent gusts threaten to knock people off their feet",
          "The howling gale tears at everything not firmly secured",
          "Walking against the powerful gale is nearly impossible"
        ],
        "Storm Force": [
          "Devastating winds tear at the landscape",
          "The storm-force winds pose a serious danger to anyone caught outside",
          "Destructive gusts uproot small trees and damage structures",
          "The roaring winds drown out almost all other sounds"
        ]
      };
      
      // Default wind description
      this.windDescriptions.default = [
        "The wind conditions are changing",
        "Air currents shift unpredictably"
      ];
      
      this.temperatureDescriptions = {
        freezing: [
          "The air is bitterly cold, instantly numbing exposed skin",
          "A bone-chilling cold permeates everything",
          "The harsh, frigid air makes breathing painful",
          "The extreme cold creates a painful burning sensation on exposed skin"
        ],
        veryCold: [
          "The intense cold seeps through layers of clothing",
          "Breath forms thick clouds of vapor in the frigid air",
          "The severe cold makes fingers and toes ache painfully",
          "The biting cold makes metal surfaces dangerous to touch with bare skin"
        ],
        cold: [
          "The cold air stings exposed cheeks and noses",
          "A definite chill requires warm clothing for comfort",
          "Cold air makes breath visible with each exhalation",
          "The chill in the air encourages brisk movement"
        ],
        cool: [
          "The cool temperature feels refreshing",
          "A pleasant coolness invigorates the senses",
          "The cool air feels crisp and clean",
          "A jacket provides comfort in the cool conditions"
        ],
        mild: [
          "The temperature is perfectly mild and comfortable",
          "The pleasant air temperature requires no adjustment of clothing",
          "A mild warmth makes for ideal conditions",
          "The temperature sits in a perfect balance - neither warm nor cool"
        ],
        warm: [
          "A gentle warmth creates comfortable conditions",
          "The warmth makes the air feel welcoming",
          "The warm temperature encourages outdoor activity",
          "Comfortable warmth bathes the surroundings"
        ],
        hot: [
          "The heat has people seeking shade",
          "The hot air creates a noticeable sheen of sweat on exposed skin",
          "Heat radiates from sun-exposed surfaces",
          "The hot conditions make water a precious commodity"
        ],
        scorching: [
          "The scorching heat is almost unbearable",
          "Waves of intense heat distort distant views",
          "The extreme heat forces most creatures to seek shelter",
          "The blistering temperature makes every movement exhausting"
        ]
      };
      
      this.senseDetails = {
        "tropical-rainforest": {
          sights: ["colorful birds flit between branches", "sunlight filters through the dense canopy", "vibrant orchids bloom on tree trunks", "a waterfall cascades down moss-covered rocks", "a rainbow of butterflies hovers near flowering plants"],
          sounds: ["exotic birds call melodiously to one another", "a distant monkey troop howls in the canopy", "water trickles down through multiple layers of leaves", "unseen creatures rustle in the underbrush", "insects buzz in complex harmonies"],
          smells: ["the rich aroma of damp earth fills the air", "tropical flowers release their sweet perfume", "decaying vegetation adds earthy undertones", "wild fruits add a hint of sweetness to the air", "mushrooms contribute their fungal scent to the mix"]
        },
        "tropical-seasonal": {
          sights: ["herds of animals dot the distant grassland", "acacia trees create distinctive silhouettes", "tall grasses wave in unison", "a dust devil spins across the plain", "colorful birds perch on thorny branches"],
          sounds: ["tall grass rustles with each breeze", "distant herds create a low rumble", "insects chirp rhythmically among the vegetation", "territorial birds announce their presence", "wind whispers through the scattered trees"],
          smells: ["sun-baked earth releases its mineral scent", "flowering grasses fill the air with pollen", "wild herbs add aromatic notes", "the musk of grazing animals lingers faintly", "rain-moistened soil releases its distinctive petrichor"]
        },
        "desert": {
          sights: ["sand ripples stretch to the horizon", "a mirage shimmers in the distance", "cacti stand like sentinels across the landscape", "rocks form weathered sculptures", "a hawk circles high overhead"],
          sounds: ["the wind creates a soft whistling", "sand shifts with a gentle hiss", "a distant predator calls once and falls silent", "small creatures scurry among rocks", "the profound silence feels almost tangible"],
          smells: ["the air carries the mineral scent of hot sand", "rare desert blooms offer momentary sweetness", "dry air holds little scent but feels clean", "the faint aroma of sage punctuates the emptiness", "rocks release their stored heat with a subtle scent"]
        },
        "temperate-grassland": {
          sights: ["wildflowers create patches of color among the grasses", "rolling hills extend to the horizon", "hawks hover on thermal currents above", "small mammals dart between protective covers", "butterflies and bees work among the flowering plants"],
          sounds: ["grasses produce a continuous gentle rustle", "countless insects buzz and chirp in symphony", "meadowlarks and other birds call from perches", "small animals create occasional movement sounds", "distant thunder rolls across the open space"],
          smells: ["fresh grass dominates the clean air", "wildflowers add their varied perfumes", "fertile soil contributes an earthy foundation", "rain-moistened earth releases petrichor", "wild mint and other herbs add complexity"]
        },
        "temperate-deciduous": {
          sights: ["sunlight creates shifting patterns through the leaves", "moss covers fallen logs and stone outcroppings", "mushrooms of various colors sprout from the forest floor", "squirrels leap from branch to branch", "a deer briefly appears between the trees"],
          sounds: ["leaves rustle with each passing breeze", "a woodpecker drums rhythmically on a dead tree", "squirrels chatter alarm calls to one another", "the wind creates a gentle symphony in the canopy", "songbirds call from hidden perches"],
          smells: ["rich humus forms the base note of the forest air", "decaying leaves add their sweet-sour scent", "tree sap contributes hints of resin", "mushrooms release their earthy spores", "a complex mixture of growth and decay permeates everything"]
        },
        "temperate-rainforest": {
          sights: ["towering evergreens disappear into the mist above", "every surface is covered with a layer of moss", "ferns create a lush understory throughout", "nurse logs host new generations of trees", "hanging lichens drape from branches like curtains"],
          sounds: ["water drips constantly from saturated surfaces", "a stream murmurs somewhere nearby", "the dense vegetation muffles distant sounds", "woodpeckers drum occasionally on resonant trunks", "understory birds call softly to one another"],
          smells: ["damp earth dominates the senses", "conifer resin adds a sharp, clean note", "moss contributes its ancient green scent", "wet bark releases its woody aroma", "fungal growth adds complex earthy undertones"]
        },
        "boreal-forest": {
          sights: ["evergreen trees form a dark, dense canopy", "snow blankets the ground between straight trunks", "animal tracks tell stories of recent passages", "lichens and mosses add splashes of color", "occasional clearings reveal the vast forest extent"],
          sounds: ["wind whistles through the pine needles", "trees creak and groan in the cold", "an owl hoots from a hidden perch", "branches snap occasionally under snow weight", "perfect silence falls between sound moments"],
          smells: ["pine resin dominates the cold air", "cold sap adds sweetness to the scent profile", "fresh snow contributes its mineral clarity", "mushrooms lend occasional earthy notes", "the needles covering the forest floor give off a subtle spice"]
        },
        "tundra": {
          sights: ["the vast open landscape stretches to the horizon", "low shrubs and plants hug the ground", "rocks covered with colorful lichens dot the terrain", "distant mountains frame the enormous sky", "migratory birds fly in formation overhead"],
          sounds: ["the wind creates a constant presence", "small animals call occasionally to mark territory", "meltwater gurgles through rocky channels", "ice and frozen ground crack with temperature changes", "silence dominates between these sparse sounds"],
          smells: ["the air is remarkably clean and crisp", "subtle scents from low vegetation occasionally rise", "the mineral smell of soil and rock predominates", "lichen contributes its faint ancient aroma", "smoke from distant human activity sometimes drifts through"]
        }
      };
      
      // Default biome details with full sentences
      this.senseDetails.default = {
        sights: ["the surrounding landscape draws the eye with its beauty", "nearby landmarks stand out prominently", "local vegetation creates a tapestry of textures and colors", "the terrain shapes how everything relates", "natural features command attention"],
        sounds: ["ambient noises create a natural symphony", "the soundscape tells the story of this place", "background noises remind you of the living world around", "environmental sounds weave together harmoniously", "the acoustic environment is rich with information"],
        smells: ["the local air carries distinctive scents", "natural aromas tell of the surrounding ecosystem", "environmental odors speak of recent conditions", "atmospheric smells connect you to this place", "ambient fragrances reveal the season and setting"]
      };
  
      // Cache for weather descriptions to maintain consistency
      this.descriptionCache = new Map();
    }
  
    /**
     * Generate a weather description based on conditions
     * @param {object} weatherData - Current weather data
     * @param {string} biome - Region biome
     * @param {Date} date - Current date/time
     * @param {string} regionId - Region identifier for caching
     * @returns {string} - Formatted weather description
     */
    generateDescription(weatherData, biome, date, regionId = null) {
      // If we have a regionId and cached description, use it
      const cacheKey = regionId ? `${regionId}-${date.toISOString()}` : null;
      if (cacheKey && this.descriptionCache.has(cacheKey)) {
        return this.descriptionCache.get(cacheKey);
      }
  
      if (!weatherData) {
        const defaultDesc = "The weather is currently in flux, changing with the natural cycles of this world.";
        if (cacheKey) this.descriptionCache.set(cacheKey, defaultDesc);
        return defaultDesc;
      }
      
      // Determine time of day
      const hour = date.getHours();
      let timeOfDay = "day";
      if (hour < 6) timeOfDay = "night";
      else if (hour < 9) timeOfDay = "dawn";
      else if (hour < 12) timeOfDay = "morning";
      else if (hour < 15) timeOfDay = "midday";
      else if (hour < 18) timeOfDay = "afternoon";
      else if (hour < 21) timeOfDay = "dusk";
      else timeOfDay = "night";
      
      // Determine if we should use time-appropriate descriptions
      // This prevents inconsistencies like "rain" and "afternoon light"
      let skyDesc;
      if (weatherData.condition.includes("Rain") || 
          weatherData.condition.includes("Snow") || 
          weatherData.condition.includes("Thunderstorm") || 
          weatherData.condition === "Heavy Clouds") {
        
        // For weather that affects light, use time-specific descriptions
        const conditionKey = Object.keys(this.skyDescriptions).find(key => 
          weatherData.condition.includes(key)) || "default";
        
        const timeDescriptions = this.skyDescriptions[conditionKey][timeOfDay] || 
                               this.skyDescriptions.default[timeOfDay];
        
        skyDesc = this.getRandomItem(timeDescriptions);
      } else {
        // For clear weather, we can be more generic
        const descriptionSet = this.skyDescriptions[weatherData.condition] || this.skyDescriptions.default;
        const timeDescriptions = descriptionSet[timeOfDay] || descriptionSet.morning;
        skyDesc = this.getRandomItem(timeDescriptions);
      }
      
      // Get other description components
      const windDesc = this.getRandomItem(this.windDescriptions[weatherData.windIntensity] || this.windDescriptions.default);
      const tempDesc = this.getRandomItem(this.temperatureDescriptions[this.getTemperatureCategory(weatherData.temperature)]);
      
      // Get biome-specific sensory details as full sentences
      const biomeDetails = this.senseDetails[biome] || this.senseDetails.default;
      const sensoryDetail = this.getSensoryDetailAsSentence(biomeDetails, weatherData);
      
      // Combine components into a cohesive description, avoiding contradictions
      let description = `${skyDesc}. `;
      
      // Add wind description if not calm and not mentioned in sky
      if (weatherData.windIntensity !== "Calm" && !skyDesc.toLowerCase().includes("wind")) {
        description += `${windDesc}. `;
      }
      
      // Add temperature feel if not implied in sky
      if (!skyDesc.toLowerCase().includes("cold") && !skyDesc.toLowerCase().includes("hot") && 
          !skyDesc.toLowerCase().includes("warm") && !skyDesc.toLowerCase().includes("cool")) {
        description += `${tempDesc}. `;
      }
      
      // Add sensory detail as complete sentence
      if (sensoryDetail) {
        description += `${sensoryDetail}`;
      }
      
      // Cache the description if we have a region ID
      if (cacheKey) {
        this.descriptionCache.set(cacheKey, description.trim());
      }
      
      return description.trim();
    }
    
    /**
     * Get a random item from an array
     */
    getRandomItem(array) {
      if (!array || array.length === 0) return "";
      return array[Math.floor(Math.random() * array.length)];
    }
    
    /**
     * Map temperature to category
     */
    getTemperatureCategory(temperature) {
      if (temperature < 0) return "freezing";
      if (temperature < 32) return "veryCold";
      if (temperature < 45) return "cold";
      if (temperature < 60) return "cool";
      if (temperature < 75) return "mild";
      if (temperature < 85) return "warm";
      if (temperature < 95) return "hot";
      return "scorching";
    }
    
    /**
     * Get a relevant sensory detail as a complete sentence
     */
    getSensoryDetailAsSentence(biomeDetails, weatherData) {
      // Select appropriate sensory category based on conditions
      let category = "sights";
      
      // Wind-based sounds take precedence in windy conditions
      if (weatherData.windIntensity !== "Calm" && weatherData.windSpeed > 10) {
        category = "sounds";
      }
      
      // Rain brings out smells
      if (weatherData.condition.includes("Rain") || Math.random() < 0.3) {
        category = "smells";
      }
      
      const options = biomeDetails[category] || [];
      if (options.length === 0) return "";
      
      const detail = this.getRandomItem(options);
      
      // Format as a complete sentence
      const sentenceStarters = [
        `Nearby, ${detail}.`,
        `In the vicinity, ${detail}.`,
        `All around, ${detail}.`,
        `The surroundings feature ${detail}.`,
        `You notice that ${detail}.`
      ];
      
      return this.getRandomItem(sentenceStarters);
    }
    
    /**
     * Generate a game effects description for the current weather
     * @param {string} effectsText - Raw weather effects text
     * @returns {string} - Formatted game effects description
     */
    formatGameEffects(effectsText) {
      if (!effectsText) return "";
      
      // Split the effects into bullet points
      const effects = effectsText.split(/\.\s+/).filter(effect => effect.trim().length > 0);
      
      if (effects.length === 0) return "";
      
      // Format as markdown bullet points
      return effects.map(effect => `• ${effect.trim()}.`).join('\n');
    }
    
    /**
     * Clear cache for a specific region or all regions
     * @param {string} regionId - Optional region ID to clear
     */
    clearCache(regionId = null) {
      if (regionId) {
        // Clear cache for specific region
        for (const key of this.descriptionCache.keys()) {
          if (key.startsWith(`${regionId}-`)) {
            this.descriptionCache.delete(key);
          }
        }
      } else {
        // Clear all cache
        this.descriptionCache.clear();
      }
    }
  }
  
  // Export a singleton instance
  const weatherDescriptionService = new WeatherDescriptionService();
  export default weatherDescriptionService;