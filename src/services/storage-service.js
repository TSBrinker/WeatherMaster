// storage-service.js
// Handles localStorage data persistence for the application

class StorageService {
    constructor() {
      this.storageKey = 'gm-weather-companion';
      this.defaultData = {
        version: '1.0.0',
        lastOpened: new Date().toISOString(),
        worlds: [],
        activeWorldId: null,
        activeRegionId: null,
        activeLocationId: null
      };
    }
  
    // Initialize storage with default data if not exists
    initialize() {
      if (!localStorage.getItem(this.storageKey)) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.defaultData));
      }
      return this.getData();
    }
  
    // Get all data from storage
    getData() {
      try {
        const data = JSON.parse(localStorage.getItem(this.storageKey));
        // Update last opened timestamp
        data.lastOpened = new Date().toISOString();
        this.saveData(data);
        return data;
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
        return this.defaultData;
      }
    }
  
    // Save all data to storage
    saveData(data) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Error saving data to localStorage:', error);
        return false;
      }
    }
  
    // Clear all data and reset to defaults
    clearData() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.defaultData));
        return true;
      } catch (error) {
        console.error('Error clearing data from localStorage:', error);
        return false;
      }
    }
  
    // World management
    getWorlds() {
      const data = this.getData();
      return data.worlds || [];
    }
  
    getWorld(worldId) {
      const worlds = this.getWorlds();
      return worlds.find(world => world.id === worldId);
    }
  
    saveWorld(world) {
      const data = this.getData();
      const existingIndex = data.worlds.findIndex(w => w.id === world.id);
      
      if (existingIndex >= 0) {
        // Update existing world
        data.worlds[existingIndex] = world;
      } else {
        // Add new world
        data.worlds.push(world);
      }
      
      return this.saveData(data);
    }
  
    deleteWorld(worldId) {
      const data = this.getData();
      data.worlds = data.worlds.filter(world => world.id !== worldId);
      
      // Reset active IDs if deleting the active world
      if (data.activeWorldId === worldId) {
        data.activeWorldId = null;
        data.activeRegionId = null;
        data.activeLocationId = null;
      }
      
      return this.saveData(data);
    }
  
    setActiveWorld(worldId) {
      const data = this.getData();
      data.activeWorldId = worldId;
      data.activeRegionId = null;
      data.activeLocationId = null;
      return this.saveData(data);
    }
  
    // Region management
    getRegions(worldId) {
      const world = this.getWorld(worldId);
      return world ? world.regions || [] : [];
    }
  
    getRegion(worldId, regionId) {
      const regions = this.getRegions(worldId);
      return regions.find(region => region.id === regionId);
    }
  
    saveRegion(worldId, region) {
      const data = this.getData();
      const worldIndex = data.worlds.findIndex(w => w.id === worldId);
      
      if (worldIndex >= 0) {
        if (!data.worlds[worldIndex].regions) {
          data.worlds[worldIndex].regions = [];
        }
        
        const existingIndex = data.worlds[worldIndex].regions.findIndex(r => r.id === region.id);
        
        if (existingIndex >= 0) {
          // Update existing region
          data.worlds[worldIndex].regions[existingIndex] = region;
        } else {
          // Add new region
          data.worlds[worldIndex].regions.push(region);
        }
        
        return this.saveData(data);
      }
      
      return false;
    }
  
    deleteRegion(worldId, regionId) {
      const data = this.getData();
      const worldIndex = data.worlds.findIndex(w => w.id === worldId);
      
      if (worldIndex >= 0 && data.worlds[worldIndex].regions) {
        data.worlds[worldIndex].regions = data.worlds[worldIndex].regions.filter(region => region.id !== regionId);
        
        // Reset active IDs if deleting the active region
        if (data.activeWorldId === worldId && data.activeRegionId === regionId) {
          data.activeRegionId = null;
          data.activeLocationId = null;
        }
        
        return this.saveData(data);
      }
      
      return false;
    }
  
    setActiveRegion(worldId, regionId) {
      const data = this.getData();
      data.activeWorldId = worldId;
      data.activeRegionId = regionId;
      data.activeLocationId = null;
      return this.saveData(data);
    }
  
    // Location management
    getLocations(worldId, regionId) {
      const region = this.getRegion(worldId, regionId);
      return region ? region.locations || [] : [];
    }
  
    getLocation(worldId, regionId, locationId) {
      const locations = this.getLocations(worldId, regionId);
      return locations.find(location => location.id === locationId);
    }
  
    saveLocation(worldId, regionId, location) {
      const data = this.getData();
      const worldIndex = data.worlds.findIndex(w => w.id === worldId);
      
      if (worldIndex >= 0) {
        if (!data.worlds[worldIndex].regions) {
          data.worlds[worldIndex].regions = [];
        }
        
        const regionIndex = data.worlds[worldIndex].regions.findIndex(r => r.id === regionId);
        
        if (regionIndex >= 0) {
          if (!data.worlds[worldIndex].regions[regionIndex].locations) {
            data.worlds[worldIndex].regions[regionIndex].locations = [];
          }
          
          const existingIndex = data.worlds[worldIndex].regions[regionIndex].locations.findIndex(l => l.id === location.id);
          
          if (existingIndex >= 0) {
            // Update existing location
            data.worlds[worldIndex].regions[regionIndex].locations[existingIndex] = location;
          } else {
            // Add new location
            data.worlds[worldIndex].regions[regionIndex].locations.push(location);
          }
          
          return this.saveData(data);
        }
      }
      
      return false;
    }
  
    deleteLocation(worldId, regionId, locationId) {
      const data = this.getData();
      const worldIndex = data.worlds.findIndex(w => w.id === worldId);
      
      if (worldIndex >= 0 && data.worlds[worldIndex].regions) {
        const regionIndex = data.worlds[worldIndex].regions.findIndex(r => r.id === regionId);
        
        if (regionIndex >= 0 && data.worlds[worldIndex].regions[regionIndex].locations) {
          data.worlds[worldIndex].regions[regionIndex].locations = 
            data.worlds[worldIndex].regions[regionIndex].locations.filter(location => location.id !== locationId);
          
          // Reset active location ID if deleting the active location
          if (data.activeWorldId === worldId && data.activeRegionId === regionId && data.activeLocationId === locationId) {
            data.activeLocationId = null;
          }
          
          return this.saveData(data);
        }
      }
      
      return false;
    }
  
    setActiveLocation(worldId, regionId, locationId) {
      const data = this.getData();
      data.activeWorldId = worldId;
      data.activeRegionId = regionId;
      data.activeLocationId = locationId;
      return this.saveData(data);
    }
  
    // Weather data management
    getWeatherData(worldId, regionId, locationId) {
      const location = this.getLocation(worldId, regionId, locationId);
      return location ? location.weatherData || null : null;
    }
  
    saveWeatherData(worldId, regionId, locationId, weatherData) {
      const data = this.getData();
      const worldIndex = data.worlds.findIndex(w => w.id === worldId);
      
      if (worldIndex >= 0 && data.worlds[worldIndex].regions) {
        const regionIndex = data.worlds[worldIndex].regions.findIndex(r => r.id === regionId);
        
        if (regionIndex >= 0 && data.worlds[worldIndex].regions[regionIndex].locations) {
          const locationIndex = data.worlds[worldIndex].regions[regionIndex].locations.findIndex(l => l.id === locationId);
          
          if (locationIndex >= 0) {
            data.worlds[worldIndex].regions[regionIndex].locations[locationIndex].weatherData = weatherData;
            return this.saveData(data);
          }
        }
      }
      
      return false;
    }
  }
  
  export default StorageService;