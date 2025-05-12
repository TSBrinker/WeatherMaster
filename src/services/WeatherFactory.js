// src/services/WeatherFactory.js
// Factory for creating appropriate weather service instances

import DiceTableWeatherService from './DiceTableWeatherService';
import MeteorologicalWeatherService from './MeteorologicalWeatherService';

/**
 * Factory class to create the appropriate weather service based on selected type.
 * This pattern allows us to easily switch between different weather generation
 * approaches while maintaining the same interface.
 */
class WeatherFactory {
  /**
   * Create a weather service of the specified type
   * @param {string} type - The type of weather service to create
   * @returns {object} - The weather service instance
   */
  static createWeatherService(type = 'diceTable') {
    console.log(`Creating weather service of type: ${type}`);
    
    switch (type) {
      case 'meteorological':
        console.log('Using advanced meteorological weather system');
        return new MeteorologicalWeatherService();
        
      case 'diceTable':
      default:
        console.log('Using basic dice table weather system');
        return new DiceTableWeatherService();
    }
  }
}

// Create and export a singleton instance of the factory
const weatherFactoryInstance = new WeatherFactory();
export default weatherFactoryInstance;

// Also export the class itself for direct static method access
export { WeatherFactory };