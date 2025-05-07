// src/components/weather/WeatherIcon.jsx
import React from 'react';
import { 
  Sun, Moon, Cloud, CloudDrizzle, CloudRain, 
  CloudSnow, CloudLightning, Wind, Thermometer,
  CloudOff, Snowflake, CloudFog
} from 'lucide-react';

const WeatherIcon = ({ condition, isDaytime, size = 24, color = "currentColor" }) => {
  const getIcon = () => {
    switch (condition) {
      case 'Clear Skies':
        return isDaytime ? <Sun size={size} color={color} /> : <Moon size={size} color={color} />;
      case 'Light Clouds':
        return isDaytime ? 
          <div className="icon-container">
            <Sun size={size} color={color} style={{opacity: 0.8, position: 'relative', zIndex: 1}} />
            <Cloud size={size*0.8} color={color} style={{opacity: 0.7, position: 'absolute', right: -5, bottom: -5}} />
          </div> :
          <div className="icon-container">
            <Moon size={size} color={color} style={{opacity: 0.8, position: 'relative', zIndex: 1}} />
            <Cloud size={size*0.8} color={color} style={{opacity: 0.7, position: 'absolute', right: -5, bottom: -5}} />
          </div>;
      case 'Heavy Clouds':
        return <Cloud size={size} color={color} />;
      case 'Rain':
        return <CloudRain size={size} color={color} />;
      case 'Heavy Rain':
        return <CloudDrizzle size={size} color={color} />;
      case 'Snow':
        return <CloudSnow size={size} color={color} />;
      case 'Freezing Cold':
        return <Snowflake size={size} color={color} />;
      case 'Cold Winds':
        return <Wind size={size} color={color} />;
      case 'Scorching Heat':
        return <Thermometer size={size} color={color} />;
      case 'Thunderstorm':
        return <CloudLightning size={size} color={color} />;
      case 'Blizzard':
        return (
          <div className="icon-container">
            <CloudSnow size={size} color={color} />
            <Wind size={size*0.6} color={color} style={{position: 'absolute', right: -5, bottom: -5}} />
          </div>
        );
      case 'High Humidity Haze':
        return <CloudFog size={size} color={color} />;
      case 'Cold Snap':
        return (
          <div className="icon-container">
            <Snowflake size={size} color={color} />
            <Thermometer size={size*0.6} color={color} style={{position: 'absolute', right: -5, bottom: -5}} />
          </div>
        );
      default:
        return <CloudOff size={size} color={color} />;
    }
  };

  return (
    <div className="weather-icon-line" style={{ position: 'relative', display: 'inline-block' }}>
      {getIcon()}
    </div>
  );
};

export default WeatherIcon;