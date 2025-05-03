import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Thermometer } from 'lucide-react';

// Weather conditions based on the provided rules
export const weatherConditions = {
  clear: { name: "Clear Skies", icon: Sun, color: 'text-yellow-400' },
  lightClouds: { name: "Light Clouds", icon: Cloud, color: 'text-slate-300' },
  heavyClouds: { name: "Heavy Clouds", icon: Cloud, color: 'text-slate-400' },
  fog: { name: "Fog", icon: Cloud, color: 'text-slate-300' },
  rain: { name: "Rain", icon: CloudRain, color: 'text-blue-400' },
  heavyRain: { name: "Heavy Rain", icon: CloudRain, color: 'text-blue-500' },
  thunderstorm: { name: "Thunderstorm", icon: CloudLightning, color: 'text-yellow-300' },
  snow: { name: "Snow", icon: CloudSnow, color: 'text-blue-100' },
  blizzard: { name: "Blizzard", icon: CloudSnow, color: 'text-blue-200' },
  hail: { name: "Hail", icon: CloudSnow, color: 'text-blue-300' },
  extremeHeat: { name: "Extreme Heat", icon: Thermometer, color: 'text-red-500' },
  extremeCold: { name: "Extreme Cold", icon: Thermometer, color: 'text-blue-600' },
  highWinds: { name: "High Winds", icon: Wind, color: 'text-emerald-300' },
};

// Wind speed descriptions
export const windSpeeds = [
  "Calm", "Light Breeze", "Gentle Breeze", "Moderate Breeze", 
  "Fresh Breeze", "Strong Winds", "Near Gale", "Gale Force"
];

// Weather effects descriptions
export const getWeatherEffects = (weatherType) => {
  switch(weatherType) {
    case 'clear':
    case 'lightClouds':
      return "No special effects. Clear visibility.";
    
    case 'heavyClouds':
    case 'fog':
      return "Flying creatures have total cover. Outdoor light does not count as sunlight. Navigation by stars is difficult.";
    
    case 'rain':
      return "Travel pace slowed by half with wagons. Fire damage rolls have -2. Long rest without shelter requires DC 12 CON save.";
    
    case 'heavyRain':
      return "Travel significantly impaired. Fire damage -4, Lightning/Cold +2. Long rest without shelter requires DC 16 CON save.";
    
    case 'snow':
      return "All travel speed halved. After two days, terrain becomes difficult. Freezing cold effects apply.";
    
    case 'blizzard':
      return "Hourly DC 12 CON save or take 3d4 cold damage and gain exhaustion. Heavy obscurement beyond 20 feet.";
    
    case 'thunderstorm':
      return "Lightning and Thunder damage +2. Partial obscurement beyond 20 feet. Risk of lightning strikes.";
    
    case 'extremeHeat':
      return "Double water consumption. DC 10 CON save after 4+ hours travel or gain exhaustion. Fire +2, Cold -2.";
    
    case 'extremeCold':
      return "Long rest without heat requires DC 15 CON save. Failure by 5+ gains exhaustion. Cold damage +2.";
    
    case 'highWinds':
      return "Flying creatures gain/lose 10ft movement with/against wind. Ranged attacks -2, range halved against wind.";
    
    default:
      return "Standard weather conditions.";
  }
};
