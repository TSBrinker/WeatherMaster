// src/utils/skyGradients.js
/**
 * Generates a CSS gradient based on the time of day and weather conditions
 * @param {Date} date - Current date/time
 * @param {string} weatherCondition - Current weather condition
 * @returns {string} - CSS gradient string
 */
export const getSkyGradient = (date, weatherCondition) => {
    const hour = date.getHours();
    const isOvercast = ['Heavy Clouds', 'Rain', 'Heavy Rain', 'Thunderstorm', 'Blizzard', 'Snow'].includes(weatherCondition);
    
    // Night (9 PM - 5 AM)
    if (hour >= 21 || hour < 5) {
      return isOvercast 
        ? 'linear-gradient(to bottom, #1e2130 0%, #11151c 100%)' // Overcast night
        : 'linear-gradient(to bottom, #0c1445 0%, #000033 100%)'; // Clear night
    }
    
    // Dawn (5 AM - 7 AM)
    if (hour >= 5 && hour < 7) {
      return isOvercast
        ? 'linear-gradient(to bottom, #5d5c73 0%, #43405d 100%)' // Overcast dawn
        : 'linear-gradient(to bottom, #ff7e45 0%, #ff4500 100%)'; // Clear dawn
    }
    
    // Morning (7 AM - 10 AM)
    if (hour >= 7 && hour < 10) {
      return isOvercast
        ? 'linear-gradient(to bottom, #7a7d89 0%, #5c6a7d 100%)' // Overcast morning
        : 'linear-gradient(to bottom, #87ceeb 0%, #5b6ee1 100%)'; // Clear morning
    }
    
    // Midday (10 AM - 3 PM)
    if (hour >= 10 && hour < 15) {
      return isOvercast
        ? 'linear-gradient(to bottom, #9aa0ab 0%, #78909c 100%)' // Overcast midday
        : 'linear-gradient(to bottom, #1e90ff 0%, #4682b4 100%)'; // Clear midday
    }
    
    // Afternoon (3 PM - 6 PM)
    if (hour >= 15 && hour < 18) {
      return isOvercast
        ? 'linear-gradient(to bottom, #7a8395 0%, #5c6777 100%)' // Overcast afternoon
        : 'linear-gradient(to bottom, #4682b4 0%, #87cefa 100%)'; // Clear afternoon
    }
    
    // Sunset (6 PM - 9 PM)
    if (hour >= 18 && hour < 21) {
      return isOvercast
        ? 'linear-gradient(to bottom, #515868 0%, #3c434e 100%)' // Overcast sunset
        : 'linear-gradient(to bottom, #ff4500 0%, #ff7e45 100%)'; // Clear sunset
    }
    
    // Default (should never reach here)
    return 'linear-gradient(to bottom, #87ceeb 0%, #1e90ff 100%)';
  };
  
  /**
   * More precise gradient generation based on actual sunrise/sunset times
   * @param {Date} date - Current date/time
   * @param {string} weatherCondition - Current weather condition
   * @param {Date} sunrise - Sunrise time
   * @param {Date} sunset - Sunset time
   * @returns {string} - CSS gradient string
   */
  export const getPreciseSkyGradient = (date, weatherCondition, sunrise, sunset) => {
    // Calculate times relative to sunrise/sunset
    const currentTime = date.getTime();
    const sunriseTime = sunrise.getTime();
    const sunsetTime = sunset.getTime();
    
    // Define dawn/dusk windows (1 hour before/after sunrise/sunset)
    const dawnStart = sunriseTime - (60 * 60 * 1000);
    const dawnEnd = sunriseTime + (60 * 60 * 1000);
    const duskStart = sunsetTime - (60 * 60 * 1000);
    const duskEnd = sunsetTime + (60 * 60 * 1000);
    
    const isOvercast = ['Heavy Clouds', 'Rain', 'Heavy Rain', 'Thunderstorm', 'Blizzard', 'Snow'].includes(weatherCondition);
    
    // Night (after dusk end to before dawn start)
    if (currentTime > duskEnd || currentTime < dawnStart) {
      return isOvercast 
        ? 'linear-gradient(to bottom, #1e2130 0%, #11151c 100%)' // Overcast night
        : 'linear-gradient(to bottom, #0c1445 0%, #000033 100%)'; // Clear night
    }
    
    // Dawn (dawn start to sunrise)
    if (currentTime >= dawnStart && currentTime <= sunriseTime) {
      return isOvercast
        ? 'linear-gradient(to bottom, #5d5c73 0%, #43405d 100%)' // Overcast dawn
        : 'linear-gradient(to bottom, #ff7e45 0%, #ff4500 100%)'; // Clear dawn
    }
    
    // Early Morning (sunrise to dawn end)
    if (currentTime > sunriseTime && currentTime <= dawnEnd) {
      return isOvercast
        ? 'linear-gradient(to bottom, #7a7d89 0%, #5c6a7d 100%)' // Overcast early morning
        : 'linear-gradient(to bottom, #ffb347 0%, #ffcc33 100%)'; // Clear early morning
    }
    
    // Day (dawn end to dusk start)
    if (currentTime > dawnEnd && currentTime < duskStart) {
      // Determine if it's morning, midday or afternoon
      const dayProgress = (currentTime - dawnEnd) / (duskStart - dawnEnd);
      
      if (dayProgress < 0.33) {
        // Morning
        return isOvercast
          ? 'linear-gradient(to bottom, #7a7d89 0%, #5c6a7d 100%)' // Overcast morning
          : 'linear-gradient(to bottom, #87ceeb 0%, #5b6ee1 100%)'; // Clear morning
      } else if (dayProgress < 0.66) {
        // Midday
        return isOvercast
          ? 'linear-gradient(to bottom, #9aa0ab 0%, #78909c 100%)' // Overcast midday
          : 'linear-gradient(to bottom, #1e90ff 0%, #4682b4 100%)'; // Clear midday
      } else {
        // Afternoon
        return isOvercast
          ? 'linear-gradient(to bottom, #7a8395 0%, #5c6777 100%)' // Overcast afternoon
          : 'linear-gradient(to bottom, #4682b4 0%, #87cefa 100%)'; // Clear afternoon
      }
    }
    
    // Dusk (dusk start to sunset)
    if (currentTime >= duskStart && currentTime <= sunsetTime) {
      return isOvercast
        ? 'linear-gradient(to bottom, #515868 0%, #3c434e 100%)' // Overcast dusk
        : 'linear-gradient(to bottom, #ff4500 0%, #ff7e45 100%)'; // Clear dusk
    }
    
    // Evening (sunset to dusk end)
    if (currentTime > sunsetTime && currentTime <= duskEnd) {
      return isOvercast
        ? 'linear-gradient(to bottom, #2f3542 0%, #232b38 100%)' // Overcast evening
        : 'linear-gradient(to bottom, #483d8b 0%, #2f2f4f 100%)'; // Clear evening
    }
    
    // Default (should never reach here)
    return 'linear-gradient(to bottom, #87ceeb 0%, #1e90ff 100%)';
  };