// hooks/useLocalStorage.js
import { useState, useEffect } from 'react';

/**
 * Custom hook for managing state in localStorage
 * @param {string} key - The localStorage key
 * @param {any} initialValue - The initial value if no value exists in localStorage
 * @returns {[any, function]} - The stored value and a setter function
 */
const useLocalStorage = (key, initialValue) => {
  // State to store the value
  // Pass a function to useState so initialization logic only runs once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or return initialValue if null
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error, return initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Listen for changes to storedValue and update localStorage
  useEffect(() => {
    try {
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      // Log errors in storing data
      console.error(`Error storing localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};

export default useLocalStorage;