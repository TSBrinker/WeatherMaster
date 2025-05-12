// src/services/WeatherFactory.js
// Factory for creating appropriate weather service instances

import DiceTableWeatherService from './DiceTableWeatherService';

// In the future, this will also import and handle the MeteorologicalWeatherService

export default class WeatherFactory {
  static createWeatherService(type = 'diceTable') {
    // For now, we only have the dice table service
    // Later we'll add the meteorological service option
    switch (type) {
      case 'meteorological':
        // TODO: Return new MeteorologicalWeatherService() when implemented
        console.log('Meteorological service not yet implemented, using dice table service');
        return new DiceTableWeatherService();
      case 'diceTable':
      default:
        return new DiceTableWeatherService();
    }
  }
}