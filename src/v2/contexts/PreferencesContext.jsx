import React, { createContext, useContext, useState, useEffect } from 'react';
import { savePreferences, loadPreferences } from '../services/storage/localStorage';

const PreferencesContext = createContext();

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(() => loadPreferences());

  // Save to localStorage whenever preferences change
  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  const updatePreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetPreferences = () => {
    const defaults = {
      temperatureUnit: 'F',
      windSpeedUnit: 'mph',
      timeFormat: 12,
      showFeelsLike: true,
      debugMode: false,
      conditionPhrasing: 'standard',
      showSnowAccumulation: true,
    };
    setPreferences(defaults);
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
