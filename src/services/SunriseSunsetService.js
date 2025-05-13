// src/services/SunriseSunsetService.js
class SunriseSunsetService {
    // Calculate day length based on latitude and day of year
    calculateDayLength(latitudeBand, date) {
      // Get day of year (0-365)
      const dayOfYear = this.getDayOfYear(date);
      
      // Get base daylight hours for this latitude band
      return this.getDaylightHours(latitudeBand, dayOfYear);
    }
    
    // Get day of year (0-365)
    getDayOfYear(date) {
      const start = new Date(date.getFullYear(), 0, 0);
      const diff = date - start;
      const oneDay = 1000 * 60 * 60 * 24;
      return Math.floor(diff / oneDay);
    }
    
    // Get daylight hours based on latitude and day of year
    getDaylightHours(latitudeBand, dayOfYear) {
      // Default values for temperate latitude
      let baseHours = 12; // Base hours at equinox
      let annualVariation = 4; // Hours variation from solstice to solstice
      
      // Adjust based on latitude band
      switch (latitudeBand) {
        case "arctic":
          baseHours = 12;
          annualVariation = 12; // Extreme variation including midnight sun/polar night
          break;
        case "subarctic":
          baseHours = 12;
          annualVariation = 8; // Very large variation
          break;
        case "temperate":
          baseHours = 12;
          annualVariation = 4; // Moderate variation
          break;
        case "subtropical":
          baseHours = 12;
          annualVariation = 2.5; // Small variation
          break;
        case "tropical":
          baseHours = 12;
          annualVariation = 1; // Minimal variation
          break;
        default:
          baseHours = 12;
          annualVariation = 4;
      }
      
      // Calculate seasonal adjustment
      // Day 0 = January 1 (winter in Northern Hemisphere)
      // Day 182 = July 1 (summer in Northern Hemisphere)
      const seasonalOffset = Math.sin(((dayOfYear - 80) / 365) * 2 * Math.PI);
      
      // Return adjusted daylight hours
      return baseHours + (seasonalOffset * annualVariation);
    }
    
    // Get sunrise and sunset times
    getSunriseSunset(latitudeBand, date) {
      // Calculate day length
      const dayLengthHours = this.calculateDayLength(latitudeBand, date);
      
      // Create base date at noon
      const noonDate = new Date(date);
      noonDate.setHours(12, 0, 0, 0);
      
      // Calculate half of daylight hours
      const halfDayHours = dayLengthHours / 2;
      
      // Calculate sunrise and sunset times
      const sunriseDate = new Date(noonDate);
      sunriseDate.setHours(12 - halfDayHours, 
                          Math.floor((12 - halfDayHours) % 1 * 60), 0, 0);
      
      const sunsetDate = new Date(noonDate);
      sunsetDate.setHours(12 + halfDayHours, 
                         Math.floor((12 + halfDayHours) % 1 * 60), 0, 0);
      
      return {
        sunrise: sunriseDate,
        sunset: sunsetDate,
        dayLengthHours
      };
    }
    
    // Format sunrise and sunset times
    getFormattedSunriseSunset(latitudeBand, date) {
      // Handle invalid input
      if (!date || !(date instanceof Date)) {
        console.error("Invalid date in getFormattedSunriseSunset:", date);
        return {
          sunriseTime: "Unknown",
          sunsetTime: "Unknown",
          dayLengthFormatted: "Unknown",
          isDaytime: false
        };
      }
      
      // Get base sunrise/sunset data
      const { sunrise, sunset, dayLengthHours } = this.getSunriseSunset(latitudeBand, date);
      
      // Format times
      const formatTime = (date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
      };
      
      // Format day length
      const dayLengthFormatted = (() => {
        const hours = Math.floor(dayLengthHours);
        const minutes = Math.floor((dayLengthHours - hours) * 60);
        return `${hours} hr ${minutes} min`;
      })();
      
      // Determine if it's currently daytime
      const isDaytime = (() => {
        const currentTime = date.getTime();
        return currentTime >= sunrise.getTime() && currentTime <= sunset.getTime();
      })();
      
      return {
        sunrise,
        sunset,
        sunriseTime: formatTime(sunrise),
        sunsetTime: formatTime(sunset),
        dayLengthHours,
        dayLengthFormatted,
        isDaytime
      };
    }
    
    // Calculate the sun's position in the sky (0-1, where 0.5 is noon)
    getSolarPosition(currentTime, sunrise, sunset) {
      if (!(currentTime instanceof Date) || 
          !(sunrise instanceof Date) || 
          !(sunset instanceof Date)) {
        return 0.5; // Default to noon if invalid inputs
      }
      
      const current = currentTime.getTime();
      const riseTime = sunrise.getTime();
      const setTime = sunset.getTime();
      
      // Night before sunrise
      if (current < riseTime) {
        // Calculate position between previous sunset and sunrise
        // Assuming previous sunset was ~12 hours before
        const prevSunset = new Date(riseTime);
        prevSunset.setHours(prevSunset.getHours() - 12);
        
        const nightLength = riseTime - prevSunset.getTime();
        const timeFromPrevSunset = current - prevSunset.getTime();
        
        return (timeFromPrevSunset / nightLength) * 0.25; // 0-0.25 range for night before sunrise
      }
      // Daytime
      else if (current >= riseTime && current <= setTime) {
        const dayLength = setTime - riseTime;
        const timeFromSunrise = current - riseTime;
        
        return 0.25 + (timeFromSunrise / dayLength) * 0.5; // 0.25-0.75 range for daytime
      }
      // Night after sunset
      else {
        // Calculate position between sunset and next sunrise
        // Assuming next sunrise is ~12 hours after
        const nextSunrise = new Date(setTime);
        nextSunrise.setHours(nextSunrise.getHours() + 12);
        
        const nightLength = nextSunrise.getTime() - setTime;
        const timeFromSunset = current - setTime;
        
        return 0.75 + (timeFromSunset / nightLength) * 0.25; // 0.75-1 range for night after sunset
      }
    }
  }
  
  const sunriseSunsetService = new SunriseSunsetService();
  export default sunriseSunsetService;