// src/components/weather/WeatherIcon.jsx - complete updated component
import React from 'react';
import { 
  Sun, Moon, Cloud, CloudDrizzle, CloudRain, 
  CloudSnow, CloudLightning, Wind, Thermometer,
  CloudOff, Snowflake, CloudFog
} from 'lucide-react';

const WeatherIcon = ({ condition, isDaytime, size = 24, color = "currentColor" }) => {
  // Helper function to create composite icons
  const createCompositeIcon = (mainIcon, secondaryIcon, secondaryProps = {}) => {
    // Default secondary icon properties
    const defaultSecondaryProps = {
      size: size * 0.7,
      color: color,
      style: {
        position: 'absolute',
        bottom: -size * 0.2,
        right: -size * 0.2,
        opacity: 0.9
      }
    };
    
    // Merge default props with any custom props
    const mergedProps = {...defaultSecondaryProps, ...secondaryProps};
    
    return (
      <div className="weather-icon-composite" style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
        {/* Main icon centered */}
        <div style={{ position: 'absolute', top: 0, left: 0 }}>
          {mainIcon}
        </div>
        {/* Secondary icon positioned bottom-right with some overlap */}
        <div style={{ position: 'absolute', bottom: mergedProps.style.bottom, right: mergedProps.style.right }}>
          {React.cloneElement(secondaryIcon, { 
            size: mergedProps.size, 
            color: mergedProps.color,
            style: { opacity: mergedProps.style.opacity }
          })}
        </div>
      </div>
    );
  };

  const getIcon = () => {
    switch (condition) {
      case 'Clear Skies':
        return isDaytime ? 
          <Sun size={size} color={color} /> : 
          <Moon size={size} color={color} />;
          
      case 'Light Clouds':
        const primaryIcon = isDaytime ? 
          <Sun size={size} color={color} /> : 
          <Moon size={size} color={color} />;
          
        return createCompositeIcon(
          primaryIcon, 
          <Cloud />,
          { 
            size: size * 0.65, 
            style: { 
              opacity: 0.8,
              bottom: -size * 0.15,
              right: -size * 0.15
            } 
          }
        );
        
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
        return createCompositeIcon(
          <CloudSnow size={size} color={color} />,
          <Wind />,
          { size: size * 0.6 }
        );
        
      case 'High Humidity Haze':
        return <CloudFog size={size} color={color} />;
        
      case 'Cold Snap':
        return createCompositeIcon(
          <Snowflake size={size} color={color} />,
          <Thermometer />,
          { size: size * 0.6 }
        );
        
      default:
        return <CloudOff size={size} color={color} />;
    }
  };

  return (
    <div className="weather-icon-wrapper" style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
      {getIcon()}
    </div>
  );
};

export default WeatherIcon;