// src/services/SunriseSunsetService.js - Fixed
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
      // Convert latitude band to numerical latitude for calculations
      const latitude = this.getLatitudeFromBand(latitudeBand);
      
      console.log(`[SunriseSunset] Calculating daylight for latitude: ${latitude}° (${latitudeBand || "unknown"}), day: ${dayOfYear}`);
      
      // Calculate the solar declination angle for the given day of year
      // This is the angle between the rays of the sun and the equatorial plane
      // Formula from: https://en.wikipedia.org/wiki/Position_of_the_Sun
      const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
      
      console.log(`[SunriseSunset] Solar declination: ${declination.toFixed(2)}°`);
      
      // Convert latitude to radians
      const latRad = latitude * (Math.PI / 180);
      const decRad = declination * (Math.PI / 180);
      
      // Calculate the hour angle (in degrees)
      // This formula gives the angular distance from the meridian of a point on 
      // the celestial sphere measured westward along the celestial equator
      let cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);
      
      console.log(`[SunriseSunset] cosHourAngle: ${cosHourAngle.toFixed(4)}`);
      
      // Handle edge cases for polar day/night
      if (cosHourAngle < -1) {
        // Polar day (sun never sets)
        console.log(`[SunriseSunset] POLAR DAY detected - 24 hours of daylight`);
        return 24;
      } else if (cosHourAngle > 1) {
        // Polar night (sun never rises)
        console.log(`[SunriseSunset] POLAR NIGHT detected - 0 hours of daylight`);
        return 0;
      }
      
      // Calculate the hour angle (in degrees)
      const hourAngle = Math.acos(cosHourAngle) * (180 / Math.PI);
      
      // Calculate day length from hour angle (1 hour = 15 degrees of hour angle)
      const dayLength = (2 * hourAngle) / 15;
      
      console.log(`[SunriseSunset] Day length calculated: ${dayLength.toFixed(2)} hours`);
      
      return dayLength;
    }
    
    // Convert latitude band to actual latitude value for calculations
    getLatitudeFromBand(latitudeBand) {
      // Handle null or undefined input
      if (!latitudeBand) {
        console.warn('[SunriseSunset] No latitude band provided, defaulting to temperate (45°)');
        return 45; // Default to temperate
      }
      
      console.log(`[SunriseSunset] Converting latitude band: "${latitudeBand}"`);
      
      // Center point of each latitude band
      const latitudeMap = {
        "equatorial": 5,   // 0° - 10°
        "tropical": 20,    // 10° - 30°
        "temperate": 45,   // 30° - 60°
        "subarctic": 65,   // 60° - 75°
        "polar": 80        // 75° - 90°
      };
      
      // Check if the latitude band is valid
      if (!latitudeMap[latitudeBand]) {
        console.warn(`[SunriseSunset] Unknown latitude band: "${latitudeBand}", defaulting to temperate (45°)`);
        return 45; // Default to temperate
      }
      
      console.log(`[SunriseSunset] Resolved latitude: ${latitudeMap[latitudeBand]}° for band: ${latitudeBand}`);
      return latitudeMap[latitudeBand];
    }
    
    // Get sunrise and sunset times
    getSunriseSunset(latitudeBand, date) {
      // Handle invalid date
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.error("Invalid date in getSunriseSunset:", date);
        return {
          sunrise: null,
          sunset: null,
          isDaytime: false,
          dayLengthHours: 12
        };
      }
      
      // Calculate day length
      const dayLengthHours = this.getDaylightHours(latitudeBand, this.getDayOfYear(date));
      
      // Handle polar day and night
      if (dayLengthHours >= 23.9) {
        // Polar day - sun never sets
        console.log(`[SunriseSunset] Polar day detected - setting always daytime`);
        const allDayTime = new Date(date);
        return {
          sunrise: new Date(allDayTime.setHours(0, 0, 0, 0)),
          sunset: new Date(allDayTime.setHours(23, 59, 59, 999)),
          dayLengthHours: 24,
          isDaytime: true
        };
      } else if (dayLengthHours <= 0.1) {
        // Polar night - sun never rises
        console.log(`[SunriseSunset] Polar night detected - setting always nighttime`);
        const allNightTime = new Date(date);
        return {
          sunrise: null,
          sunset: null,
          dayLengthHours: 0,
          isDaytime: false
        };
      }
      
      // Create base date at noon to avoid DST issues
      const noonDate = new Date(date);
      noonDate.setHours(12, 0, 0, 0);
      
      // Calculate half of daylight hours
      const halfDayHours = dayLengthHours / 2;
      
      // Calculate sunrise and sunset times
      const sunriseDate = new Date(noonDate);
      sunriseDate.setHours(12 - halfDayHours);
      sunriseDate.setMinutes(((12 - halfDayHours) % 1) * 60);
      
      const sunsetDate = new Date(noonDate);
      sunsetDate.setHours(12 + halfDayHours);
      sunsetDate.setMinutes(((12 + halfDayHours) % 1) * 60);
      
      // Determine if current time is daytime
      const isDaytime = date >= sunriseDate && date <= sunsetDate;
      
      return {
        sunrise: sunriseDate,
        sunset: sunsetDate,
        dayLengthHours,
        isDaytime
      };
    }
    
    // Format sunrise and sunset times
    getFormattedSunriseSunset(latitudeBand, date) {
      // Handle invalid input
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.error("Invalid date in getFormattedSunriseSunset:", date);
        return {
          sunriseTime: "Unknown",
          sunsetTime: "Unknown",
          dayLengthFormatted: "Unknown",
          isDaytime: false
        };
      }
      
      // Get base sunrise/sunset data
      const { sunrise, sunset, dayLengthHours, isDaytime } = this.getSunriseSunset(latitudeBand, date);
      
      // Handle polar day and night specifically
      if (dayLengthHours >= 23.9) {
        return {
          sunrise,
          sunset,
          sunriseTime: "Midnight",
          sunsetTime: "Midnight",
          dayLengthHours,
          dayLengthFormatted: "24 hours (Polar Day)",
          isDaytime: true
        };
      } else if (dayLengthHours <= 0.1) {
        return {
          sunrise: null,
          sunset: null,
          sunriseTime: "N/A",
          sunsetTime: "N/A",
          dayLengthHours: 0,
          dayLengthFormatted: "0 hours (Polar Night)",
          isDaytime: false
        };
      }
      
      // Format times
      const formatTime = (date) => {
        if (!date) return "N/A";
        
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
        const minutes = Math.round((dayLengthHours - hours) * 60);
        return `${hours} hr ${minutes} min`;
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
        
        // Ensure we don't divide by zero
        if (nightLength <= 0) return 0.1;
        
        return (timeFromPrevSunset / nightLength) * 0.25; // 0-0.25 range for night before sunrise
      }
      // Daytime
      else if (current >= riseTime && current <= setTime) {
        const dayLength = setTime - riseTime;
        const timeFromSunrise = current - riseTime;
        
        // Ensure we don't divide by zero
        if (dayLength <= 0) return 0.5;
        
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
        
        // Ensure we don't divide by zero
        if (nightLength <= 0) return 0.8;
        
        return 0.75 + (timeFromSunset / nightLength) * 0.25; // 0.75-1 range for night after sunset
      }
    }
    
    // Special case handling for extreme latitudes and dates
    handleExtremeLatitudes(latitudeBand, dayOfYear) {
      // Get numerical latitude
      const latitude = this.getLatitudeFromBand(latitudeBand);
      
      // Calculate declination for this day
      const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
      
      console.log(`[SunriseSunset] Extreme latitude check: ${latitude}°, declination: ${declination.toFixed(2)}°`);
      
      // Check for polar day/night
      if (latitude > 66.5 && declination > 0 && latitude > (90 - declination)) {
        // Polar day in northern summer
        console.log(`[SunriseSunset] Detected Northern Polar Day`);
        return { isPolarDay: true, isPolarNight: false };
      }
      else if (latitude > 66.5 && declination < 0 && latitude > (90 + declination)) {
        // Polar night in northern winter
        console.log(`[SunriseSunset] Detected Northern Polar Night`);
        return { isPolarDay: false, isPolarNight: true };
      }
      else if (latitude < -66.5 && declination < 0 && Math.abs(latitude) > (90 + declination)) {
        // Polar day in southern summer
        console.log(`[SunriseSunset] Detected Southern Polar Day`);
        return { isPolarDay: true, isPolarNight: false };
      }
      else if (latitude < -66.5 && declination > 0 && Math.abs(latitude) > (90 - declination)) {
        // Polar night in southern winter
        console.log(`[SunriseSunset] Detected Southern Polar Night`);
        return { isPolarDay: false, isPolarNight: true };
      }
      
      // Normal day/night cycle
      return { isPolarDay: false, isPolarNight: false };
    }
  }
  
  const sunriseSunsetService = new SunriseSunsetService();
  export default sunriseSunsetService;