// utils/storageUtils.js

/**
 * Save data to localStorage with error handling
 * @param {string} key - localStorage key
 * @param {any} data - Data to store
 * @returns {boolean} - Success status
 */
export const saveToLocalStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  };
  
  /**
   * Load data from localStorage with error handling
   * @param {string} key - localStorage key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} - Retrieved data or default value
   */
  export const loadFromLocalStorage = (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return defaultValue;
    }
  };
  
  /**
   * Remove a key from localStorage
   * @param {string} key - localStorage key to remove
   * @returns {boolean} - Success status
   */
  export const removeFromLocalStorage = (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  };
  
  /**
   * Clear all application data from localStorage
   * @param {string} prefix - Prefix for keys to clear (optional)
   * @returns {boolean} - Success status
   */
  export const clearLocalStorage = (prefix = '') => {
    try {
      if (prefix) {
        // Clear only keys that start with the prefix
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
          }
        });
      } else {
        // Clear all localStorage
        localStorage.clear();
      }
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  };
  
  /**
   * Export all app data as a JSON string for backup
   * @param {string} prefix - Prefix for keys to export (optional)
   * @returns {string} - JSON string of exported data
   */
  export const exportData = (prefix = '') => {
    try {
      const exportObj = {};
      
      Object.keys(localStorage).forEach(key => {
        if (!prefix || key.startsWith(prefix)) {
          exportObj[key] = JSON.parse(localStorage.getItem(key));
        }
      });
      
      return JSON.stringify(exportObj);
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  };
  
  /**
   * Import data from a JSON string backup
   * @param {string} jsonString - JSON string to import
   * @param {boolean} clearExisting - Whether to clear existing data first
   * @returns {boolean} - Success status
   */
  export const importData = (jsonString, clearExisting = false) => {
    try {
      const importObj = JSON.parse(jsonString);
      
      if (clearExisting) {
        localStorage.clear();
      }
      
      Object.keys(importObj).forEach(key => {
        localStorage.setItem(key, JSON.stringify(importObj[key]));
      });
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  };
  
  /**
   * Get estimated size of localStorage usage
   * @returns {object} - Size information in bytes and human-readable format
   */
  export const getStorageSize = () => {
    try {
      let totalSize = 0;
      let itemCount = 0;
      
      Object.keys(localStorage).forEach(key => {
        const item = localStorage.getItem(key);
        totalSize += (key.length + item.length) * 2; // UTF-16 encoding
        itemCount++;
      });
      
      // Format in human-readable form
      let readableSize = '';
      if (totalSize < 1024) {
        readableSize = `${totalSize} bytes`;
      } else if (totalSize < 1024 * 1024) {
        readableSize = `${(totalSize / 1024).toFixed(2)} KB`;
      } else {
        readableSize = `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
      }
      
      return {
        bytes: totalSize,
        readable: readableSize,
        itemCount
      };
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return {
        bytes: 0, 
        readable: '0 bytes',
        itemCount: 0
      };
    }
  };