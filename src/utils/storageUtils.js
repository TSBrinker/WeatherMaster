// Create a utility file: src/utils/storageUtils.js

/**
 * Simple utility to wrap localStorage with error handling
 */
export const storageUtils = {
    /**
     * Save data to localStorage
     * @param {string} key - The storage key
     * @param {any} data - The data to save (will be JSON stringified)
     * @returns {boolean} Success or failure
     */
    saveData: (key, data) => {
      try {
        const serialized = JSON.stringify(data);
        localStorage.setItem(key, serialized);
        console.log(`Saved data to ${key} (${serialized.length} bytes)`);
        return true;
      } catch (error) {
        console.error(`Error saving to localStorage (${key}):`, error);
        return false;
      }
    },
  
    /**
     * Load data from localStorage
     * @param {string} key - The storage key
     * @param {any} defaultValue - Default value if not found
     * @returns {any} The parsed data or defaultValue
     */
    loadData: (key, defaultValue = null) => {
      try {
        const serialized = localStorage.getItem(key);
        if (serialized === null) {
          console.log(`No data found in localStorage for key: ${key}`);
          return defaultValue;
        }
        
        const data = JSON.parse(serialized);
        console.log(`Loaded data from ${key} (${serialized.length} bytes)`);
        return data;
      } catch (error) {
        console.error(`Error loading from localStorage (${key}):`, error);
        return defaultValue;
      }
    },
  
    /**
     * Remove data from localStorage
     * @param {string} key - The storage key
     * @returns {boolean} Success or failure
     */
    removeData: (key) => {
      try {
        localStorage.removeItem(key);
        console.log(`Removed data for key: ${key}`);
        return true;
      } catch (error) {
        console.error(`Error removing data from localStorage (${key}):`, error);
        return false;
      }
    },
    
    /**
     * Clear all localStorage data
     * @returns {boolean} Success or failure
     */
    clearAll: () => {
      try {
        localStorage.clear();
        console.log("Cleared all localStorage data");
        return true;
      } catch (error) {
        console.error("Error clearing localStorage:", error);
        return false;
      }
    },
    
    /**
     * List all keys in localStorage
     * @returns {string[]} Array of keys or empty array on error
     */
    listKeys: () => {
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          keys.push(localStorage.key(i));
        }
        console.log("localStorage keys:", keys);
        return keys;
      } catch (error) {
        console.error("Error listing localStorage keys:", error);
        return [];
      }
    }
  };