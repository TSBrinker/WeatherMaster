import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { savePreferences, loadPreferences } from '../services/storage/indexedDB';

const PreferencesContext = createContext();

const DEFAULT_PREFERENCES = {
  temperatureUnit: 'F',
  windSpeedUnit: 'mph',
  timeFormat: 12,
  showFeelsLike: true,
  debugMode: false,
  conditionPhrasing: 'standard',
  showSnowAccumulation: true,
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  // Load preferences from IndexedDB on mount
  useEffect(() => {
    const initializePreferences = async () => {
      try {
        const loaded = await loadPreferences();
        setPreferences({ ...DEFAULT_PREFERENCES, ...loaded });
        isInitialized.current = true;
      } catch (error) {
        console.error('Error loading preferences:', error);
        isInitialized.current = true;
      } finally {
        setIsLoading(false);
      }
    };

    initializePreferences();
  }, []);

  // Save to IndexedDB whenever preferences change (skip initial load)
  useEffect(() => {
    if (isInitialized.current) {
      savePreferences(preferences);
    }
  }, [preferences]);

  const updatePreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  const setConditionPhrasing = (phrasing) => {
    updatePreference('conditionPhrasing', phrasing);
  };

  const setShowSnowAccumulation = (show) => {
    updatePreference('showSnowAccumulation', show);
  };

  const contextValue = {
    // Preferences
    temperatureUnit: preferences.temperatureUnit,
    windSpeedUnit: preferences.windSpeedUnit,
    timeFormat: preferences.timeFormat,
    showFeelsLike: preferences.showFeelsLike,
    debugMode: preferences.debugMode,
    conditionPhrasing: preferences.conditionPhrasing || 'standard',
    showSnowAccumulation: preferences.showSnowAccumulation !== false, // Default true

    // Methods
    updatePreference,
    resetPreferences,
    setConditionPhrasing,
    setShowSnowAccumulation,
  };

  return (
    <PreferencesContext.Provider value={contextValue}>
      {children}
    </PreferencesContext.Provider>
  );
};
