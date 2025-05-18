// src/services/WeatherFactory.js - Updated
import DiceTableWeatherService from './DiceTableWeatherService';
import MeteorologicalWeatherService from './MeteorologicalWeatherService';

export default class WeatherFactory {
  static createWeatherService(type = null) {
    // If no type is specified, we'll use the storageUtils directly
    // (can't use React hooks in a static class method)
    if (!type) {
      try {
        const savedPrefs = localStorage.getItem('gm-weather-companion-preferences');
        if (savedPrefs) {
          const prefs = JSON.parse(savedPrefs);
          type = prefs.weatherSystem || 'diceTable';
        } else {
          type = 'diceTable'; // Default if no preferences found
        }
      } catch (e) {
        type = 'diceTable'; // Fallback on error
      }
    }
    
    // Force to lowercase and trim for consistency
    const normalizedType = (typeof type === 'string') ? type.toLowerCase().trim() : 'diceTable';
    
    console.log(`WeatherFactory creating service of type: "${normalizedType}" (original: "${type}")`);
    
    switch (normalizedType) {
      case 'meteorological':
        console.error('Creating new meteorological weather service - VERSION FIX 1.0');
        return new MeteorologicalWeatherService();
      case 'dicetable':
      case 'dice-table':
      case 'dice_table':
      case 'diceTable':
      default:
        console.log('Creating dice table weather service');
        return new DiceTableWeatherService();
    }
  }
}