// src/services/WeatherFactory.js - Updated
import DiceTableWeatherService from './DiceTableWeatherService';
import MeteorologicalWeatherService from './MeteorologicalWeatherService';

export default class WeatherFactory {
static createWeatherService(type = null) {

  // DIRECT ACCESS to global preference
  let globalWeatherSystem = null;
  try {
    const savedPrefs = localStorage.getItem('gm-weather-companion-preferences');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      globalWeatherSystem = prefs.weatherSystem;
      console.log(`WeatherFactory found global preference: ${globalWeatherSystem}`);
    }
  } catch (e) {
    console.error("Error reading preferences:", e);
  }
  
  // Use global preference FIRST, then passed type
  const typeToUse = globalWeatherSystem || type || 'diceTable';
  
  // Force to lowercase and trim for consistency
  const normalizedType = (typeof typeToUse === 'string') ? typeToUse.toLowerCase().trim() : 'diceTable';
  
  console.log(`WeatherFactory creating service of type: "${normalizedType}" (original: "${type}")`);
  
  // SIMPLIFIED logic - just check for 'meteorological'
  if (normalizedType === 'meteorological') {
    console.error('Creating NEW METEOROLOGICAL weather service - FORCED BY GLOBAL SETTINGS');
    return new MeteorologicalWeatherService();
  } else {
    console.log('Creating dice table weather service');
    return new DiceTableWeatherService();
  }
}
}