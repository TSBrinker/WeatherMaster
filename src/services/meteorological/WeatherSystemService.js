// src/services/meteorological/WeatherSystemService.js
// Service for managing weather systems - pressure systems and fronts

class WeatherSystemService {
  constructor() {
    // Track weather systems (like pressure systems and fronts)
    this.weatherSystems = []; // Active weather systems
    this.lastCondition = null; // Track last weather condition
    this.thunderstormActive = false; // Flag for tracking active thunderstorms
    this.thunderstormIntensity = 0; // Track thunderstorm intensity
    this.lastSystemCheckTime = Date.now(); // Track when we last checked systems
  }

  /**
   * Get all active weather systems
   * @returns {Array} - List of active weather systems
   */
  getWeatherSystems() {
    // Add safety in case weatherSystems got corrupted
    if (!Array.isArray(this.weatherSystems)) {
      console.error("WeatherSystems is not an array, resetting");
      this.weatherSystems = [];
      this.addDefaultSystems();
    }
    
    // If weather systems array is empty, add defaults
    if (this.weatherSystems.length === 0) {
      console.log("Weather systems array is empty, adding default systems");
      this.addDefaultSystems();
    }
    
    return this.weatherSystems;
  }

  /**
   * Initialize weather systems based on region and date
   * @param {object} profile - Region profile
   * @param {string} season - Current season
   * @param {Date} date - Current date
   * @returns {Array} - Initialized weather systems
   */
  initializeWeatherSystems(profile, season, date) {
    // Clear existing systems
    this.weatherSystems = [];
    this.thunderstormActive = false;
    this.thunderstormIntensity = 0;
    this.lastSystemCheckTime = Date.now();

    // Safety check for profile
    if (!profile) {
      console.error("Missing profile in initializeWeatherSystems");
      // Create default systems
      this.addDefaultSystems();
      return this.weatherSystems;
    }

    console.log("Initializing weather systems for", profile.name || "unknown region");

    // ALWAYS create at least two pressure systems for proper weather patterns
    
    // Create low pressure system
    this.weatherSystems.push({
      type: "low-pressure",
      intensity: 0.4 + Math.random() * 0.3, // 0.4-0.7 intensity
      age: Math.floor(Math.random() * 12), // 0-12 hours old
      position: 0.5, // Center of region
      movementSpeed: 0.05 + (Math.random() * 0.03), // 0.05-0.08 speed
      movementDirection: Math.random() > 0.5 ? 1 : -1, // Random direction
      maxAge: 72 + Math.floor(Math.random() * 24), // 72-96 hour lifespan
    });
    
    // Create high pressure system
    this.weatherSystems.push({
      type: "high-pressure",
      intensity: 0.4 + Math.random() * 0.3, // 0.4-0.7 intensity
      age: Math.floor(Math.random() * 24), // 0-24 hours old
      position: Math.random() > 0.5 ? 0.2 : 0.8, // Either left or right side
      movementSpeed: 0.04 + (Math.random() * 0.03), // 0.04-0.07 speed
      movementDirection: Math.random() > 0.5 ? 1 : -1, // Random direction
      maxAge: 72 + Math.floor(Math.random() * 36), // 72-108 hour lifespan
    });

    // Random additional systems based on season
    let additionalSystemChance = 0.4; // Base 40% chance
    
    // Adjust for season - more systems in winter and fall
    if (season === "winter") additionalSystemChance += 0.2;
    else if (season === "summer") additionalSystemChance -= 0.1;
    else if (season === "fall") additionalSystemChance += 0.1;
    
    // Try to create additional system
    if (Math.random() < additionalSystemChance) {
      const isHighPressure = Math.random() > 0.5;
      
      // Create the system
      this.weatherSystems.push({
        type: isHighPressure ? "high-pressure" : "low-pressure",
        intensity: 0.3 + Math.random() * 0.4, // 0.3-0.7 intensity
        age: Math.floor(Math.random() * 24), // 0-24 hours old
        position: Math.random(), // 0-1 relative position across region
        movementSpeed: Math.random() * 0.08 + 0.04, // 0.04-0.12 Movement per hour
        movementDirection: Math.random() > 0.5 ? 1 : -1, // Moving in or out
        maxAge: 60 + Math.floor(Math.random() * 48), // 60-108 hour lifespan
      });
    }

    // Check if any fronts should form from the initial systems
    this.checkForFrontGeneration();

    console.log(`Initialized ${this.weatherSystems.length} weather systems`);
    return this.weatherSystems;
  }
  
  /**
   * Add default weather systems when none are present
   * This prevents empty weather system states
   */
  addDefaultSystems() {
    console.log("Adding default weather systems");
    
    // Create one high and one low pressure system as defaults
    this.weatherSystems.push({
      type: "high-pressure",
      intensity: 0.6,
      age: 24,
      position: 0.2,
      movementSpeed: 0.06,
      movementDirection: 1,
      maxAge: 96
    });
    
    this.weatherSystems.push({
      type: "low-pressure",
      intensity: 0.5,
      age: 12,
      position: 0.8,
      movementSpeed: 0.07,
      movementDirection: -1,
      maxAge: 72
    });
  }

  /**
   * Update weather systems over time
   * @param {number} hours - Hours to advance
   * @param {string} currentCondition - Current weather condition
   * @returns {Array} - Updated weather systems
   */
  updateWeatherSystems(hours, currentCondition = null) {
    // Safety check for hours argument
    hours = Number(hours) || 1;
    
    // Safety check - throttle updates to prevent duplicate processing
    // Don't update more than once per second
    const now = Date.now();
    if (now - this.lastSystemCheckTime < 1000) {
      return this.weatherSystems;
    }
    this.lastSystemCheckTime = now;
    
    // Track if thunderstorm is active
    if (currentCondition) {
      const wasThunderstorm = this.thunderstormActive;
      this.thunderstormActive = currentCondition === "Thunderstorm";
      
      // Track thunderstorm lifecycle
      if (this.thunderstormActive) {
        if (!wasThunderstorm) {
          // Thunderstorm just started
          this.thunderstormIntensity = 1.0;
        } else {
          // Thunderstorm continuing - gradually reduce intensity
          this.thunderstormIntensity = Math.max(0.4, this.thunderstormIntensity - 0.2);
        }
      } else {
        this.thunderstormIntensity = 0;
      }
      
      this.lastCondition = currentCondition;
    }
    
    // Safety check for weather systems
    if (!Array.isArray(this.weatherSystems)) {
      console.error("WeatherSystems is not an array in updateWeatherSystems, resetting");
      this.weatherSystems = [];
      this.addDefaultSystems();
      return this.weatherSystems;
    }
    
    console.log(`Updating ${this.weatherSystems.length} weather systems for ${hours} hours`);
    
    // Process each hour individually for more realistic evolution
    for (let hour = 0; hour < hours; hour++) {
      // Age existing systems
      this.weatherSystems = this.weatherSystems.filter((system) => {
        if (!system) return false; // Filter out invalid systems
        
        // Increment age
        system.age += 1;

        // Update position based on movement
        system.position += system.movementSpeed * system.movementDirection;
        
        // If we have an active thunderstorm, accelerate front movement
        if (this.thunderstormActive && (system.type === "cold-front" || system.type === "warm-front")) {
          system.position += 0.05 * system.movementDirection; // Extra movement
          
          // Thunderstorms can break down fronts more quickly
          if (system.age > system.maxAge * 0.6) {
            system.intensity *= 0.95; // More rapid intensity reduction
          }
        }

        // Systems weaken as they get older
        if (system.age > system.maxAge / 2) {
          const ageFactor =
            1 - (system.age - system.maxAge / 2) / (system.maxAge / 2);
          system.intensity = Math.max(0.1, system.intensity * ageFactor);
        }
        
        // Thunderstorms accelerate the aging of weather systems
        if (this.thunderstormActive && system.type === "low-pressure") {
          // Low pressure systems dissipate faster during thunderstorms
          if (Math.random() < 0.2) {
            system.age += 1; // Age twice as fast sometimes
          }
        }

        // Remove systems that are too old or moved out of the region
        return (
          system.age < system.maxAge &&
          system.position >= -0.2 &&
          system.position <= 1.2
        );
      });

      // Chance for new systems to form - reduced after thunderstorms
      let newSystemChance = 0.05; // 5% base chance per hour
      
      // Reduce chance for new systems right after thunderstorms
      if (this.lastCondition === "Thunderstorm" && !this.thunderstormActive) {
        newSystemChance *= 0.5; // 50% reduction
      }
      
      if (Math.random() < newSystemChance) {
        // Determine type of system
        const isHighPressure = Math.random() > 0.5;

        // Add new pressure system
        this.weatherSystems.push({
          type: isHighPressure ? "high-pressure" : "low-pressure",
          intensity: Math.random() * 0.6 + 0.3, // 0.3-0.9 intensity
          age: 0,
          position: Math.random() > 0.5 ? -0.1 : 1.1, // Enter from either side
          movementSpeed: Math.random() * 0.1 + 0.05, // Movement per hour
          movementDirection: Math.random() > 0.5 ? 1 : -1, // Moving in or out
          maxAge: 72 + Math.floor(Math.random() * 48), // When system dissipates
        });
      }

      // Check for front generation
      this.checkForFrontGeneration();
    }
    
    // If we lost all systems, add back some defaults
    if (this.weatherSystems.length === 0) {
      console.log("Lost all weather systems, adding defaults");
      this.addDefaultSystems();
    }
    
    // Always ensure we have at least one system
    if (this.weatherSystems.length < 1) {
      console.log("Only one weather system remains, adding another");
      // Add opposite type from the existing system
      const existingType = this.weatherSystems[0]?.type;
      const newType = (existingType === "high-pressure") ? "low-pressure" : "high-pressure";
      
      this.weatherSystems.push({
        type: newType,
        intensity: 0.4 + Math.random() * 0.3,
        age: Math.floor(Math.random() * 12),
        position: (existingType === "high-pressure") ? 0.8 : 0.2, // Opposite side
        movementSpeed: 0.05 + (Math.random() * 0.03),
        movementDirection: Math.random() > 0.5 ? 1 : -1,
        maxAge: 72 + Math.floor(Math.random() * 24)
      });
    }

    console.log(`After update: ${this.weatherSystems.length} weather systems`);
    return this.weatherSystems;
  }

  /**
   * Check if weather fronts should be generated
   * Creates fronts between high and low pressure systems
   */
  checkForFrontGeneration() {
    // Safety check for weather systems
    if (!Array.isArray(this.weatherSystems)) {
      console.error("WeatherSystems is not an array in checkForFrontGeneration");
      return;
    }
    
    // Fronts form between high and low pressure systems
    for (let i = 0; i < this.weatherSystems.length; i++) {
      for (let j = i + 1; j < this.weatherSystems.length; j++) {
        const system1 = this.weatherSystems[i];
        const system2 = this.weatherSystems[j];
        
        // Skip if either system is undefined
        if (!system1 || !system2) continue;

        // Check if one is high and one is low pressure
        if (
          (system1.type === "high-pressure" &&
            system2.type === "low-pressure") ||
          (system1.type === "low-pressure" &&
            system2.type === "high-pressure")
        ) {
          // Check if they're close enough
          const distance = Math.abs(system1.position - system2.position);
          if (distance < 0.3) {
            // Don't create front if one already exists between these systems
            const frontExists = this.weatherSystems.some(
              (sys) =>
                sys && sys.type && sys.type.endsWith("-front") &&
                sys.parentSystems &&
                ((sys.parentSystems[0] === i && sys.parentSystems[1] === j) ||
                  (sys.parentSystems[0] === j && sys.parentSystems[1] === i))
            );

            if (!frontExists) {
              // Create a front
              const frontPosition = (system1.position + system2.position) / 2;
              const highPressure =
                system1.type === "high-pressure" ? system1 : system2;
              const lowPressure =
                system1.type === "low-pressure" ? system1 : system2;
              const highPressureIndex =
                system1.type === "high-pressure" ? i : j;
              const lowPressureIndex = system1.type === "low-pressure" ? i : j;

              // Determine if it's a cold or warm front
              const isColdFront = highPressure.position > lowPressure.position;
              
              // If a thunderstorm is active, make the front less likely to form
              if (this.thunderstormActive && Math.random() < 0.5) {
                // Skip front formation during thunderstorms 50% of the time
                continue;
              }
              
              // Create front with modified lifespans based on weather conditions
              let maxAge = 48 + Math.floor(Math.random() * 24); // Base max age
              
              // Shorter lifespan for fronts if thunderstorms are happening
              if (this.thunderstormActive) {
                maxAge = Math.max(12, maxAge * 0.7); // Reduce lifespan by 30%
              }

              this.weatherSystems.push({
                type: isColdFront ? "cold-front" : "warm-front",
                intensity: (highPressure.intensity + lowPressure.intensity) / 2,
                age: 0,
                position: frontPosition,
                movementSpeed: 0.08, // Fronts move faster
                movementDirection: isColdFront ? -1 : 1, // Cold fronts move toward warm air
                maxAge: maxAge,
                parentSystems: [highPressureIndex, lowPressureIndex], // Reference to parent systems
              });
              
              console.log(`Created new ${isColdFront ? "cold" : "warm"} front`);
            }
          }
        }
      }
    }
  }

  /**
   * Clear all weather systems
   */
  clearWeatherSystems() {
    this.weatherSystems = [];
    this.lastCondition = null;
    this.thunderstormActive = false;
    this.thunderstormIntensity = 0;
  }

  /**
   * Add a new weather system
   * @param {object} system - Weather system to add
   */
  addWeatherSystem(system) {
    if (!system) {
      console.error("Attempted to add invalid weather system");
      return;
    }
    this.weatherSystems.push(system);
  }

  /**
   * Remove a weather system by index
   * @param {number} index - Index of system to remove
   */
  removeWeatherSystem(index) {
    if (index >= 0 && index < this.weatherSystems.length) {
      this.weatherSystems.splice(index, 1);
    }
  }

  /**
   * Create a cold front system
   * @param {number} position - Position in region (0-1)
   * @param {number} intensity - Intensity (0-1)
   * @returns {object} - Cold front system
   */
  createColdFront(position, intensity = 0.7) {
    position = Number(position) || 0.5;
    intensity = Number(intensity) || 0.7;
    
    return {
      type: "cold-front",
      intensity,
      age: 0,
      position,
      movementSpeed: 0.08 + Math.random() * 0.02,
      movementDirection: -1, // Cold fronts typically move southeast/east
      maxAge: 48 + Math.floor(Math.random() * 24)
    };
  }

  /**
   * Create a warm front system
   * @param {number} position - Position in region (0-1)
   * @param {number} intensity - Intensity (0-1)
   * @returns {object} - Warm front system
   */
  createWarmFront(position, intensity = 0.6) {
    position = Number(position) || 0.5;
    intensity = Number(intensity) || 0.6;
    
    return {
      type: "warm-front",
      intensity,
      age: 0,
      position,
      movementSpeed: 0.06 + Math.random() * 0.02,
      movementDirection: 1, // Warm fronts typically move northeast/north
      maxAge: 60 + Math.floor(Math.random() * 24)
    };
  }

  /**
   * Create a high pressure system
   * @param {number} position - Position in region (0-1)
   * @param {number} intensity - Intensity (0-1)
   * @returns {object} - High pressure system
   */
  createHighPressure(position, intensity = 0.7) {
    position = Number(position) || 0.5;
    intensity = Number(intensity) || 0.7;
    
    return {
      type: "high-pressure",
      intensity,
      age: 0,
      position,
      movementSpeed: 0.05 + Math.random() * 0.03,
      movementDirection: Math.random() > 0.5 ? 1 : -1,
      maxAge: 72 + Math.floor(Math.random() * 48)
    };
  }

  /**
   * Create a low pressure system
   * @param {number} position - Position in region (0-1)
   * @param {number} intensity - Intensity (0-1)
   * @returns {object} - Low pressure system
   */
  createLowPressure(position, intensity = 0.7) {
    position = Number(position) || 0.5;
    intensity = Number(intensity) || 0.7;
    
    return {
      type: "low-pressure",
      intensity,
      age: 0,
      position,
      movementSpeed: 0.06 + Math.random() * 0.04,
      movementDirection: Math.random() > 0.5 ? 1 : -1,
      maxAge: 60 + Math.floor(Math.random() * 36)
    };
  }
  
  /**
   * Get the count of weather systems
   * @returns {number} - The number of active weather systems
   */
  getWeatherSystemsCount() {
    return this.weatherSystems ? this.weatherSystems.length : 0;
  }

  /**
   * Get system types for debugging
   * @returns {string} - Description of current systems
   */
  getSystemTypesDescription() {
    if (!this.weatherSystems || this.weatherSystems.length === 0) {
      return "No active weather systems";
    }
    
    const counts = {};
    this.weatherSystems.forEach(system => {
      if (!system || !system.type) return;
      counts[system.type] = (counts[system.type] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
      .join(', ');
  }
}

export default WeatherSystemService;