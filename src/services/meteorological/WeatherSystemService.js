// src/services/meteorological/WeatherSystemService.js
// Service for managing weather systems - pressure systems and fronts

class WeatherSystemService {
    constructor() {
      // Track weather systems (like pressure systems and fronts)
      this.weatherSystems = []; // Active weather systems
    }
  
    /**
     * Get all active weather systems
     * @returns {Array} - List of active weather systems
     */
    getWeatherSystems() {
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
  
      // Random number of starting systems (0-2)
      const numSystems = Math.floor(Math.random() * 3);
  
      // Create initial systems
      for (let i = 0; i < numSystems; i++) {
        // Random high or low pressure system
        const isHighPressure = Math.random() > 0.5;
  
        // More intense systems in winter and fall, less in summer
        let intensityMod = 0;
        if (season === "winter") intensityMod = 0.2;
        else if (season === "summer") intensityMod = -0.1;
        else if (season === "fall") intensityMod = 0.1;
  
        // Intensity also affected by profile's pressure variability
        const pressureVariability = profile.specialFactors?.pressureVariability || 0.5;
        const baseIntensity = 0.4 + Math.random() * 0.4;
        const intensity = Math.min(
          1,
          Math.max(0.2, baseIntensity + intensityMod + (pressureVariability - 0.5) * 0.2)
        );
  
        // Create the system
        this.weatherSystems.push({
          type: isHighPressure ? "high-pressure" : "low-pressure",
          intensity,
          age: Math.floor(Math.random() * 48), // 0-48 hours old
          position: Math.random(), // 0-1 relative position across region
          movementSpeed: Math.random() * 0.1 + 0.05, // Movement per hour
          movementDirection: Math.random() > 0.5 ? 1 : -1, // Moving in or out
          maxAge: 72 + Math.floor(Math.random() * 48), // When system dissipates
        });
      }
  
      // Also check if any fronts should form from the initial systems
      this.checkForFrontGeneration();
  
      return this.weatherSystems;
    }
  
    /**
     * Update weather systems over time
     * @param {number} hours - Hours to advance
     * @returns {Array} - Updated weather systems
     */
    updateWeatherSystems(hours) {
      // Process each hour individually for more realistic evolution
      for (let hour = 0; hour < hours; hour++) {
        // Age existing systems
        this.weatherSystems = this.weatherSystems.filter((system) => {
          // Increment age
          system.age += 1;
  
          // Update position based on movement
          system.position += system.movementSpeed * system.movementDirection;
  
          // Systems weaken as they get older
          if (system.age > system.maxAge / 2) {
            const ageFactor =
              1 - (system.age - system.maxAge / 2) / (system.maxAge / 2);
            system.intensity = Math.max(0.1, system.intensity * ageFactor);
          }
  
          // Remove systems that are too old or moved out of the region
          return (
            system.age < system.maxAge &&
            system.position >= -0.2 &&
            system.position <= 1.2
          );
        });
  
        // Chance for new systems to form
        const newSystemChance = 0.05; // 5% chance per hour
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
  
      return this.weatherSystems;
    }
  
    /**
     * Check if weather fronts should be generated
     * Creates fronts between high and low pressure systems
     */
    checkForFrontGeneration() {
      // Fronts form between high and low pressure systems
      for (let i = 0; i < this.weatherSystems.length; i++) {
        for (let j = i + 1; j < this.weatherSystems.length; j++) {
          const system1 = this.weatherSystems[i];
          const system2 = this.weatherSystems[j];
  
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
                  sys.type.endsWith("-front") &&
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
  
                this.weatherSystems.push({
                  type: isColdFront ? "cold-front" : "warm-front",
                  intensity: (highPressure.intensity + lowPressure.intensity) / 2,
                  age: 0,
                  position: frontPosition,
                  movementSpeed: 0.08, // Fronts move faster
                  movementDirection: isColdFront ? -1 : 1, // Cold fronts move toward warm air
                  maxAge: 48 + Math.floor(Math.random() * 24),
                  parentSystems: [highPressureIndex, lowPressureIndex], // Reference to parent systems
                });
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
    }
  
    /**
     * Add a new weather system
     * @param {object} system - Weather system to add
     */
    addWeatherSystem(system) {
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
  }
  
  export default WeatherSystemService;