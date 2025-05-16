// src/services/WeatherFactory.js
// Factory for creating appropriate weather service instances

import DiceTableWeatherService from './DiceTableWeatherService';
import MeteorologicalWeatherService from './MeteorologicalWeatherService';

export default class WeatherFactory {
  static createWeatherService(type = 'diceTable') {
    // Now with both services implemented, return the appropriate one
    switch (type) {
      case 'meteorological':
        console.log('Creating new meteorological weather service');
        return new MeteorologicalWeatherService();
      case 'diceTable':
      default:
        return new DiceTableWeatherService();
    }
  }
}