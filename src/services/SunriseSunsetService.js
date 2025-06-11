// src/services/SunriseSunsetService.js
// Enhanced sunrise/sunset service with solar angle-based season support

class SunriseSunsetService {
    constructor() {
      console.log("SunriseSunsetService initialized with solar season support");
    }
    
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
    
    // Convert latitude band to actual latitude for calculations
    getLatitudeFromBand(latitudeBand) {
      const bandMap = {
        "tropical": 15,        // 0-30°
        "subtropical": 35,     // 30-40°
        "temperate": 45,       // 40-60°
        "subarctic": 65,       // 60-70°
        "polar": 75            // 70-90°
      };
      
      return bandMap[latitudeBand] || 45; // Default to temperate
    }
    
    // Get precise sunrise and sunset times
    getSunriseSunset(latitudeBand, date) {
      // Validate inputs
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
        console.error("Invalid date objects in getSolarPosition");
        return 0;
      }
      
      const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
      const sunriseHour = sunrise.getHours() + sunrise.getMinutes() / 60;
      const sunsetHour = sunset.getHours() + sunset.getMinutes() / 60;
      
      if (currentHour < sunriseHour || currentHour > sunsetHour) {
        // Nighttime
        if (currentHour <= 12) {
          // Early morning before sunrise
          return currentHour / 24;
        } else {
          // Evening after sunset
          return currentHour / 24;
        }
      } else {
        // Daytime - calculate position between sunrise and sunset
        const dayProgress = (currentHour - sunriseHour) / (sunsetHour - sunriseHour);
        // Map to 0.25 (sunrise) to 0.75 (sunset) range
        return 0.25 + (dayProgress * 0.5);
      }
    }
    
    // NEW: Get current season based on solar angle and latitude
    getSeasonFromSolarAngle(date, latitudeBand) {
      const latitude = this.getLatitudeFromBand(latitudeBand);
      const dayOfYear = this.getDayOfYear(date);
      const daylightHours = this.getDaylightHours(latitudeBand, dayOfYear);
      const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
      
      // Use solar-angle approach for season determination
      const adjustedDeclination = latitude < 0 ? -declination : declination;
      
      console.log(`[Season Solar] Lat: ${latitude}°, Daylight: ${daylightHours.toFixed(1)}h, Declination: ${adjustedDeclination.toFixed(1)}°`);
      
      // POLAR REGIONS - Season based on sun presence
      if (Math.abs(latitude) >= 66.5) {
        if (daylightHours >= 23) return "summer";   // Polar day
        if (daylightHours <= 1) return "winter";    // Polar night
        return declination > 0 ? "spring" : "fall"; // Transition periods
      }
      
      // SUBPOLAR REGIONS - Mixed approach
      if (Math.abs(latitude) >= 60) {
        if (daylightHours >= 18) return "summer";
        if (daylightHours <= 6) return "winter";
        return adjustedDeclination > 0 ? "spring" : "fall";
      }
      
      // TEMPERATE REGIONS - Solar angle approach
      if (Math.abs(latitude) >= 30) {
        if (adjustedDeclination >= 20) return "summer";
        if (adjustedDeclination <= -20) return "winter";
        return adjustedDeclination > 0 ? "spring" : "fall";
      }
      
      // TROPICAL REGIONS - Simplified wet/dry season
      return Math.abs(adjustedDeclination) < 10 ? "summer" : "winter";
    }
    
    // NEW: Get detailed season information for a region
    getSeasonInfo(date, latitudeBand) {
      const latitude = this.getLatitudeFromBand(latitudeBand);
      const season = this.getSeasonFromSolarAngle(date, latitudeBand);
      const dayOfYear = this.getDayOfYear(date);
      const daylightHours = this.getDaylightHours(latitudeBand, dayOfYear);
      const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
      
      return {
        season,
        latitude,
        latitudeBand,
        dayOfYear,
        daylightHours: Math.round(daylightHours * 10) / 10,
        solarDeclination: Math.round(declination * 10) / 10,
        seasonalMethod: this.getSeasonalMethod(latitude)
      };
    }
    
    // Get the method used for season determination at this latitude
    getSeasonalMethod(latitude) {
      if (Math.abs(latitude) >= 66.5) return "polar-daylight";
      if (Math.abs(latitude) >= 60) return "subpolar-mixed";
      if (Math.abs(latitude) >= 30) return "temperate-solar";
      return "tropical-minimal";
    }
    
    // Check if we're in polar day or polar night
    checkPolarConditions(latitudeBand, date) {
      const latitude = this.getLatitudeFromBand(latitudeBand);
      const dayOfYear = this.getDayOfYear(date);
      const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
      
      // Check for polar conditions (simplified)
      if (latitude > 66.5 && declination > 0 && latitude < (90 - declination)) {
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