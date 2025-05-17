// src/services/WeatherFactory.js
// Factory for creating appropriate weather service instances

import DiceTableWeatherService from './DiceTableWeatherService';
import MeteorologicalWeatherService from './MeteorologicalWeatherService';

export default class WeatherFactory {
  static createWeatherService(type = 'diceTable') {
    // Now with both services implemented, return the appropriate one
    console.log(`WeatherFactory creating service of type: ${type}`);
    
    switch (type) {
      case 'meteorological':
        console.error('Creating new meteorological weather service - VERSION FIX 1.0');
        return new MeteorologicalWeatherService();
      case 'diceTable':
      default:
        console.log('Creating dice table weather service');
        return new DiceTableWeatherService();
    }
  }
}