// // services/enhanced-weather-service.js
// // This is an enhanced version of the weather service that exposes dice roll information

// import { climateTables, biomeMap } from '../data-tables/climate-tables';
// import { 
//   temperatureRanges, 
//   timeModifiers, 
//   maxTempChange, 
//   baseWindSpeedRanges,
//   windParameters
// } from '../data-tables/temperature-ranges';
// import { 
//   weatherEffects, 
//   windIntensityEffects,
//   shootingStarEffects
// } from '../data-tables/weather-effects';

// class EnhancedWeatherService {
//   constructor() {
//     // The forecast list - each element represents one hour of weather
//     this.forecast = [];
    
//     // Wind directions
//     this.windDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
//     this.currentWindDirection = this.windDirections[Math.floor(Math.random() * this.windDirections.length)];
//     this.currentWindSpeed = 5; // Default starting wind speed (mph)
    
//     // Weather condition persistence tracking
//     this.currentCondition = null;
//     this.currentConditionEnergy = 0;
    
//     // Roll tracking for visualization
//     this.lastConditionRoll = null;
//     this.lastRollSuccess = null;
    
//     // Energy requirements for different weather conditions
//     this.conditionEnergyDC = {
//       // Default is 0 (always stable)
//       "Clear Skies": 0,
//       "Light Clouds": 0,
      
//       // Moderate energy conditions
//       "Heavy Clouds": 10,
//       "Rain": 10,
//       "Cold Winds": 10,
      
//       // High energy conditions
//       "Thunderstorm": 12,
//       "Heavy Rain": 12,
//       "Blizzard": 12,
      
//       // Extreme conditions
//       "Scorching Heat": 15,
//       "Freezing Cold": 15,
//       "Snow": 15,
//       "High Humidity Haze": 10,
//       "Cold Snap": 15
//     };

//     // Energy increases per persistence block
//     this.energyIncrease = {
//       // Default is 0 (always stable)
//       "Clear Skies": 0,
//       "Light Clouds": 0,
      
//       // Moderate energy conditions
//       "Heavy Clouds": 3,
//       "Rain": 3,
//       "Cold Winds": 3,
      
//       // High energy conditions
//       "Thunderstorm": 4,
//       "Heavy Rain": 4,
//       "Blizzard": 4,
      
//       // Extreme conditions
//       "Scorching Heat": 5,
//       "Freezing Cold": 5,
//       "Snow": 5,
//       "High Humidity Haze": 3,
//       "Cold Snap": 5
//     };

//     // Regression paths - where conditions go when they "burn out"
//     this.regressionPath = {
//       "Thunderstorm": "Heavy Rain",
//       "Heavy Rain": "Rain",
//       "Rain": "Heavy Clouds",
//       "Heavy Clouds": "Light Clouds",
//       "Light Clouds": "Clear Skies",
//       "Blizzard": "Snow",
//       "Snow": "Freezing Cold",
//       "Freezing Cold": "Heavy Clouds",
//       "Scorching Heat": "Clear Skies",
//       "Cold Winds": "Light Clouds",
//       "High Humidity Haze": "Clear Skies",
//       "Cold Snap": "Freezing Cold"
//     };
    
//     // Use bell curve for weather generation
//     this.useWeightedDistribution = true;
//   }

//   // Initialize the weather generator for a location
//   initializeWeather(biome, season, currentDate = new Date()) {
//     // Clear any existing forecast
//     this.forecast = [];
    
//     // Reset weather condition tracking
//     this.currentCondition = null;
//     this.currentConditionEnergy = 0;
//     this.lastConditionRoll = null;
//     this.lastRollSuccess = null;
    
//     // If season is 'auto', determine from the date
//     if (season === 'auto') {
//       season = this.getSeasonFromDate(currentDate);
//     }
    
//     // Reset wind
//     this.currentWindDirection = this.windDirections[Math.floor(Math.random() * this.windDirections.length)];
//     this.currentWindSpeed = this.getRandomWindSpeed("Clear Skies");
    
//     // Generate first batch of weather conditions
//     this.generateWeatherForecast(biome, season, currentDate);
    
//     return this.getCurrentWeather();
//   }

//   // Get the season based on the date
//   getSeasonFromDate(date) {
//     // Default solstice and equinox dates (month is 0-based in JS Date)
//     const springEquinox = new Date(date.getFullYear(), 2, 20); // March 20
//     const summerSolstice = new Date(date.getFullYear(), 5, 21); // June 21
//     const fallEquinox = new Date(date.getFullYear(), 8, 22); // September 22
//     const winterSolstice = new Date(date.getFullYear(), 11, 21); // December 21
    
//     // Set time to noon to avoid day boundary issues
//     const noon = new Date(date);
//     noon.setHours(12, 0, 0, 0);
//     springEquinox.setHours(12, 0, 0, 0);
//     summerSolstice.setHours(12, 0, 0, 0);
//     fallEquinox.setHours(12, 0, 0, 0);
//     winterSolstice.setHours(12, 0, 0, 0);
    
//     // Determine season based on date
//     if (noon >= winterSolstice || noon < springEquinox) {
//       return "winter";
//     } else if (noon >= springEquinox && noon < summerSolstice) {
//       return "spring";
//     } else if (noon >= summerSolstice && noon < fallEquinox) {
//       return "summer";
//     } else {
//       return "fall";
//     }
//   }

//   // Calculate seasonal blend factor (0.0 to 1.0) for smooth transitions
//   getSeasonalBlendFactor(date) {
//     const currentSeason = this.getSeasonFromDate(date);
//     let nextSeason;
//     let transitionDate;
//     let nextTransitionDate;
    
//     const year = date.getFullYear();
//     const springEquinox = new Date(year, 2, 20);
//     const summerSolstice = new Date(year, 5, 21);
//     const fallEquinox = new Date(year, 8, 22);
//     const winterSolstice = new Date(year, 11, 21);
    
//     // Set time to noon to avoid day boundary issues
//     const noon = new Date(date);
//     noon.setHours(12, 0, 0, 0);
//     springEquinox.setHours(12, 0, 0, 0);
//     summerSolstice.setHours(12, 0, 0, 0);
//     fallEquinox.setHours(12, 0, 0, 0);
//     winterSolstice.setHours(12, 0, 0, 0);
    
//     // Determine current transition boundaries
//     if (currentSeason === "winter") {
//       if (noon < springEquinox) {
//         transitionDate = new Date(year, 0, 1); // Jan 1
//         nextTransitionDate = springEquinox;
//         nextSeason = "spring";
//       } else {
//         // This is for dates after Dec 21 (winter solstice)
//         transitionDate = winterSolstice;
//         nextTransitionDate = new Date(year + 1, 2, 20); // Next year's spring equinox
//         nextSeason = "spring";
//       }
//     } else if (currentSeason === "spring") {
//       transitionDate = springEquinox;
//       nextTransitionDate = summerSolstice;
//       nextSeason = "summer";
//     } else if (currentSeason === "summer") {
//       transitionDate = summerSolstice;
//       nextTransitionDate = fallEquinox;
//       nextSeason = "fall";
//     } else { // fall
//       transitionDate = fallEquinox;
//       nextTransitionDate = winterSolstice;
//       nextSeason = "winter";
//     }
    
//     // Calculate blend factor (0 = fully current season, 1 = fully next season)
//     const totalDays = (nextTransitionDate - transitionDate) / (1000 * 60 * 60 * 24);
//     const daysPassed = (noon - transitionDate) / (1000 * 60 * 60 * 24);
    
//     // Only blend within 14 days of a transition
//     const blendPeriod = Math.min(14, totalDays / 2);
//     if (daysPassed >= totalDays - blendPeriod) {
//       // Last 14 days of the season, blend toward next season
//       return (daysPassed - (totalDays - blendPeriod)) / blendPeriod;
//     }
    
//     return 0; // Middle of season, no blending
//   }
  
//   // Helper to get previous season
//   getPreviousSeason(season) {
//     const seasons = ["winter", "spring", "summer", "fall"];
//     const index = seasons.indexOf(season);
//     return seasons[(index + 3) % 4]; // +3 instead of -1 to handle the modulo correctly
//   }

//   // Get the next season
//   getNextSeason(season) {
//     const seasons = ["winter", "spring", "summer", "fall"];
//     const index = seasons.indexOf(season);
//     return seasons[(index + 1) % 4];
//   }

//   // Roll dice helper methods (with exposed results for UI)
//   rollD4() {
//     return Math.floor(Math.random() * 4) + 1;
//   }

//   rollD6() {
//     return Math.floor(Math.random() * 6) + 1;
//   }

//   rollD8() {
//     return Math.floor(Math.random() * 8) + 1;
//   }

//   rollD20() {
//     return Math.floor(Math.random() * 20) + 1;
//   }

//   rollD100() {
//     return Math.floor(Math.random() * 100) + 1;
//   }

//   // Roll 3d6 to get a bell curve (3-18) then normalize to 1-100
//   weightedD100() {
//     const roll = this.rollD6() + this.rollD6() + this.rollD6();
//     const normalized = Math.floor(((roll - 3) / 15) * 100) + 1;
//     return Math.min(Math.max(normalized, 1), 100);
//   }

//   // Get the current weather (first item in the forecast)
//   getCurrentWeather() {
//     if (this.forecast.length === 0) {
//       return null;
//     }
//     return this.forecast[0];
//   }

//   // Get the 24-hour forecast
//   get24HourForecast() {
//     return this.forecast.slice(0, 24);
//   }

//   // Get proper climate table based on biome and season
//   getClimateTable(biome, season) {
//     // Map UI biome name to climate table key
//     const climateKey = biomeMap[biome] || "temperate-deciduous";
//     return climateTables[climateKey][season];
//   }

//   // Get a random weather condition using either normal or weighted distribution
//   getRandomWeatherCondition(biome, season) {
//     const roll = this.useWeightedDistribution ? this.weightedD100() : this.rollD100();
//     const table = this.getClimateTable(biome, season);
    
//     for (const entry of table) {
//       if (roll >= entry.min && roll <= entry.max) {
//         return entry.condition;
//       }
//     }
    
//     // Default fallback
//     return "Clear Skies";
//   }

//   // Find index of condition in the climate table
//   findConditionIndex(condition, biome, season) {
//     const table = this.getClimateTable(biome, season);
//     for (let i = 0; i < table.length; i++) {
//       if (table[i].condition === condition) {
//         return i;
//       }
//     }
//     return -1; // Not found
//   }
  
//   // Get condition based on index in the climate table
//   getConditionByIndex(index, biome, season) {
//     const table = this.getClimateTable(biome, season);
//     if (index < 0) index = 0;
//     if (index >= table.length) index = table.length - 1;
//     return table[index].condition;
//   }

//   // Apply slowly changing weather rules to determine next condition
//   getNextWeatherCondition(currentCondition, biome, season) {
//     // Reset last roll data
//     this.lastConditionRoll = null;
//     this.lastRollSuccess = null;
    
//     // First, check if the current condition needs to burn out due to energy loss
//     if (this.currentCondition === currentCondition) {
//       // Get the current condition's energy requirements
//       const baseDC = this.conditionEnergyDC[currentCondition] || 0;
//       const increaseFactor = this.energyIncrease[currentCondition] || 0;
      
//       // Only do energy check for non-default conditions
//       if (baseDC > 0) {
//         // Calculate current DC based on how long it's persisted
//         const persistenceDC = baseDC + (this.currentConditionEnergy * increaseFactor);
        
//         // Roll to maintain the condition (d20)
//         const energyRoll = this.rollD20();
//         this.lastConditionRoll = energyRoll; // Track roll for UI visualization
        
//         // If the condition fails its "save", regress toward default
//         if (energyRoll < persistenceDC) {
//           // Save roll success state
//           this.lastRollSuccess = false;
          
//           // Get the regression path
//           if (this.regressionPath[currentCondition]) {
//             // Condition burns out - return the regression path
//             const newCondition = this.regressionPath[currentCondition];
            
//             // Reset energy counter since condition changed
//             this.currentConditionEnergy = 0;
//             this.currentCondition = newCondition;
            
//             return newCondition;
//           }
//         } else {
//           // Save roll success state
//           this.lastRollSuccess = true;
          
//           // Passed the check, increase the counter
//           this.currentConditionEnergy++;
//         }
//       }
//     } else {
//       // Condition changed, reset the energy counter
//       this.currentConditionEnergy = 0;
//       this.currentCondition = currentCondition;
//     }
    
//     // If we get here, the condition didn't burn out
//     // Now apply the normal slowly changing weather rule
//     const currentIndex = this.findConditionIndex(currentCondition, biome, season);
//     if (currentIndex === -1) {
//       // Condition not found in current climate table, generate new random condition
//       return this.getRandomWeatherCondition(biome, season);
//     }
    
//     // Roll d20 to determine shift
//     const roll = this.rollD20();
//     let newIndex = currentIndex;
    
//     if (roll === 1) {
//       // Shift down two steps (worse weather)
//       newIndex = currentIndex - 2;
//     } else if (roll >= 2 && roll <= 5) {
//       // Shift down one step (worse weather)
//       newIndex = currentIndex - 1;
//     } else if (roll >= 16 && roll <= 19) {
//       // Shift up one step (better weather)
//       newIndex = currentIndex + 1;
//     } else if (roll === 20) {
//       // Shift up two steps (better weather)
//       newIndex = currentIndex + 2;
//     }
    
//     const newCondition = this.getConditionByIndex(newIndex, biome, season);
//     this.currentCondition = newCondition;
//     this.currentConditionEnergy = 0;
    
//     return newCondition;
//   }

//   // Generate a random temperature for a given condition, season, climate, and hour
//   generateTemperature(condition, biome, season, hour) {
//     // Map UI biome name to climate table key
//     const climateKey = biomeMap[biome] || "temperate-deciduous";
    
//     // Get temperature range for this condition in this climate and season
//     const rangesByClimate = temperatureRanges[climateKey];
//     if (!rangesByClimate) return 70; // Default if climate not found
    
//     const rangesBySeason = rangesByClimate[season];
//     if (!rangesBySeason) return 70; // Default if season not found
    
//     const range = rangesBySeason[condition];
//     if (!range) return 70; // Default if condition not found
    
//     // Base temperature from the range
//     const baseTemp = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    
//     // Apply time of day modifier
//     const timeModifier = timeModifiers[hour] || 0;
    
//     return Math.round(baseTemp + timeModifier);
//   }

//   // Get next temperature that smoothly transitions from current temperature
//   getNextTemperature(currentTemp, targetTemp) {
//     // Determine how much the temperature should change
//     let tempDifference = targetTemp - currentTemp;
    
//     // Limit the change to the max allowed per hour
//     if (Math.abs(tempDifference) > maxTempChange) {
//       tempDifference = Math.sign(tempDifference) * maxTempChange;
//     }
    
//     return currentTemp + tempDifference;
//   }

//   // Get wind intensity level based on wind speed
//   getWindIntensity(windSpeed) {
//     for (const [level, data] of Object.entries(windIntensityEffects)) {
//       if (windSpeed >= data.min && windSpeed <= data.max) {
//         return { level, effect: data.effect };
//       }
//     }
//     return { level: "Calm", effect: windIntensityEffects["Calm"].effect };
//   }

//   // Generate a random wind speed for a condition
//   getRandomWindSpeed(condition) {
//     const range = baseWindSpeedRanges[condition] || { min: 0, max: 10 };
//     return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
//   }

//   // Get next wind direction (allowing only gradual changes)
//   getNextWindDirection(currentDirection) {
//     const currentIndex = this.windDirections.indexOf(currentDirection);
//     if (currentIndex === -1) {
//       // Invalid direction, just pick a random one
//       return this.windDirections[Math.floor(Math.random() * this.windDirections.length)];
//     }
    
//     // Only change direction sometimes
//     if (Math.random() > windParameters.changeFrequency) {
//       return currentDirection;
//     }
    
//     // Roll to determine direction change
//     const directionChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
//     const variability = windParameters.directionVariability;
//     const shift = directionChange * variability;
    
//     // Calculate new index with wrap-around
//     const newIndex = (currentIndex + shift + this.windDirections.length) % this.windDirections.length;
    
//     return this.windDirections[newIndex];
//   }

//   // Get next wind speed (allowing for more significant changes)
//   getNextWindSpeed(currentSpeed, targetSpeed) {
//     // Determine how much the wind speed should change
//     let speedDifference = targetSpeed - currentSpeed;
    
//     // Add some randomness to the speed change
//     const randomFactor = (Math.random() * 2 - 1) * 5; // -5 to +5
//     speedDifference += randomFactor;
    
//     // Limit the change to the max allowed per hour
//     if (Math.abs(speedDifference) > windParameters.maxSpeedChange) {
//       speedDifference = Math.sign(speedDifference) * windParameters.maxSpeedChange;
//     }
    
//     // Ensure wind speed doesn't go negative
//     return Math.max(0, Math.round(currentSpeed + speedDifference));
//   }

//   // Check for shooting star and meteor impact events
//   generateCelestialEvents() {
//     const events = {
//       shootingStar: false,
//       meteorImpact: false
//     };
    
//     // 1% chance of shooting star
//     if (this.rollD100() === 100) {
//       events.shootingStar = true;
      
//       // If shooting star occurs, 5% chance (1 in 20) of meteor impact
//       if (this.rollD20() === 20) {
//         events.meteorImpact = true;
//       }
//     }
    
//     return events;
//   }

//   // Get celestial event effects based on event type
//   getCelestialEventEffects(events) {
//     if (events.meteorImpact) {
//       return shootingStarEffects["Meteor Impact"];
//     } else if (events.shootingStar) {
//       return shootingStarEffects["Shooting Star"];
//     }
//     return "";
//   }

//   // Generate a chunk of weather forecast
//   generateWeatherChunk(hours, biome, season, currentDate) {
//     const chunk = [];
//     const chunkDate = new Date(currentDate);
//     let previousTemperature = null;
    
//     // Determine starting condition based on previous forecast
//     let currentCondition;
//     if (this.forecast.length > 0) {
//       // Get the last condition from the forecast
//       const lastWeather = this.forecast[this.forecast.length - 1];
//       currentCondition = lastWeather.condition;
//       previousTemperature = lastWeather.temperature;
//     } else {
//       // No previous forecast, generate initial condition
//       currentCondition = this.getRandomWeatherCondition(biome, season);
//       this.currentCondition = currentCondition;
//       this.currentConditionEnergy = 0;
//     }
    
//     // Apply weather condition persistence checks and transitions
//     currentCondition = this.getNextWeatherCondition(currentCondition, biome, season);
    
//     // Target wind speed based on new condition
//     const targetWindSpeed = this.getRandomWindSpeed(currentCondition);
    
//     // Generate conditions for each hour
//     for (let i = 0; i < hours; i++) {
//       // Calculate the exact date and hour for this forecast entry
//       const forecastDate = new Date(chunkDate);
//       forecastDate.setHours(forecastDate.getHours() + i, 0, 0, 0); // Zero out minutes, seconds, milliseconds
      
//       // Update wind (gradually)
//       this.currentWindDirection = this.getNextWindDirection(this.currentWindDirection);
//       this.currentWindSpeed = this.getNextWindSpeed(this.currentWindSpeed, targetWindSpeed);
      
//       // Get wind intensity level
//       const windIntensity = this.getWindIntensity(this.currentWindSpeed);
      
//       // Generate temperature based on condition, time, etc.
//       let temperature;
//       if (previousTemperature === null) {
//         // First hour, generate a base temperature
//         temperature = this.generateTemperature(currentCondition, biome, season, forecastDate.getHours());
//       } else {
//         // Calculate target temperature
//         const targetTemp = this.generateTemperature(currentCondition, biome, season, forecastDate.getHours());
//         // Ensure smooth transition from previous temperature
//         temperature = this.getNextTemperature(previousTemperature, targetTemp);
//       }
//       previousTemperature = temperature;
      
//       // Check for celestial events
//       const celestialEvents = this.generateCelestialEvents();
      
//       // Get the base weather effects
//       let effects = weatherEffects[currentCondition] || "";
      
//       // Add wind effects if significant
//       if (this.currentWindSpeed >= 15) {
//         effects += "\n\n" + windIntensity.effect;
//       }
      
//       // Add celestial event effects if applicable
//       const celestialEffects = this.getCelestialEventEffects(celestialEvents);
//       if (celestialEffects) {
//         effects += "\n\n" + celestialEffects;
//       }
      
//       chunk.push({
//         condition: currentCondition,
//         temperature: temperature,
//         hour: forecastDate.getHours(),
//         date: forecastDate,
//         windDirection: this.currentWindDirection,
//         windSpeed: this.currentWindSpeed,
//         windIntensity: windIntensity.level,
//         effects: effects,
//         hasShootingStar: celestialEvents.shootingStar,
//         hasMeteorImpact: celestialEvents.meteorImpact
//       });
//     }
    
//     return chunk;
//   }

//   // Ensure we always have at least 24 hours of forecast
//   generateWeatherForecast(biome, season, currentDate = new Date()) {
//     // Keep generating until we have at least 24 hours
//     while (this.forecast.length < 24) {
//       const hours = this.rollD8();
      
//       // Calculate the date for this chunk of forecast
//       const chunkDate = new Date(currentDate);
//       if (this.forecast.length > 0) {
//         // Set date to continue from the last forecast entry
//         const lastEntry = this.forecast[this.forecast.length - 1];
//         chunkDate.setTime(lastEntry.date.getTime() + 3600000); // Add 1 hour
//       }
      
//       const newChunk = this.generateWeatherChunk(hours, biome, season, chunkDate);
//       this.forecast = [...this.forecast, ...newChunk];
//     }
    
//     return this.get24HourForecast();
//   }

//   // Progress time and update the forecast
//   advanceTime(hours, biome, season, currentDate = new Date()) {
//     // If season is 'auto', determine from the date
//     if (season === 'auto') {
//       const newDate = new Date(currentDate.getTime() + hours * 3600000);
//       season = this.getSeasonFromDate(newDate);
//     }
    
//     // Remove the hours we're advancing
//     this.forecast = this.forecast.slice(hours);
    
//     // Ensure we still have 24 hours of forecast
//     this.generateWeatherForecast(biome, season, new Date(currentDate.getTime() + hours * 3600000));
    
//     return this.getCurrentWeather();
//   }
  
//   // Manual roll for testing
//   performManualWeatherRoll() {
//     if (!this.currentCondition) return null;
    
//     // Get the current condition's energy requirements
//     const baseDC = this.conditionEnergyDC[this.currentCondition] || 0;
//     const increaseFactor = this.energyIncrease[this.currentCondition] || 0;
    
//     // Calculate current DC based on how long it's persisted
//     const persistenceDC = baseDC + (this.currentConditionEnergy * increaseFactor);
    
//     // Roll to maintain the condition (d20)
//     const energyRoll = this.rollD20();
//     this.lastConditionRoll = energyRoll;
    
//     // If the condition fails its "save", regress toward default
//     if (energyRoll < persistenceDC) {
//       // Save roll success state
//       this.lastRollSuccess = false;
//     } else {
//       // Save roll success state
//       this.lastRollSuccess = true;
//     }
    
//     return {
//       condition: this.currentCondition,
//       roll: energyRoll,
//       dc: persistenceDC,
//       success: this.lastRollSuccess
//     };
//   }
// }

// export default EnhancedWeatherService;