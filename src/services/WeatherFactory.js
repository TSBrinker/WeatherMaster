// src/services/WeatherFactory.js
// Factory for creating appropriate weather service instances

import DiceTableWeatherService from './DiceTableWeatherService';
import MeteorologicalWeatherService from './MeteorologicalWeatherService';

export default class WeatherFactory {
  static createWeatherService(type = 'diceTable') {
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