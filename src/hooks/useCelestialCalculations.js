// src/hooks/useCelestialCalculations.js
import { useState, useEffect } from "react";
import sunriseSunsetService from "../services/SunriseSunsetService";
import moonService from "../services/MoonService";

export function useCelestialCalculations(currentDate, latitudeBand = "temperate") {
  const [calculations, setCalculations] = useState({
    sunriseHour: null,
    sunsetHour: null,
    moonriseHour: null,
    moonsetHour: null,
    currentHour: null,
    sunProgress: null,
    moonProgress: null,
    visualMoonPhase: null,
    isDaytime: false,
  });

  useEffect(() => {
    if (!currentDate || !(currentDate instanceof Date)) {
      console.error("Invalid date in useCelestialCalculations:", currentDate);
      return;
    }

    try {
      // Helper function to convert Date to decimal hours
      const dateToHour = (date) => date.getHours() + date.getMinutes() / 60;
      
      // Get current time as decimal hours
      const currentHour = dateToHour(currentDate);
      
      // Get sun data - FIXED: using getFormattedSunriseSunset to match original code
      const sunInfo = sunriseSunsetService.getFormattedSunriseSunset(
        latitudeBand, 
        currentDate
      );
      
      // Extract sunrise/sunset times and daytime status
      const sunriseHour = dateToHour(sunInfo.sunrise);
      const sunsetHour = dateToHour(sunInfo.sunset);
      const isDaytime = sunInfo.isDaytime;
      
      // Calculate sun progress - ONLY WHEN VISIBLE
      let sunProgress = null;
      if (isDaytime) {
        const dayLength = sunsetHour - sunriseHour;
        sunProgress = (currentHour - sunriseHour) / dayLength;
        sunProgress = Math.max(0, Math.min(1, sunProgress));
      }
      
      // Get moon data
      const { moonrise, moonset } = moonService.getMoonTimes(currentDate, latitudeBand);
      const moonriseHour = dateToHour(moonrise);
      const moonsetHour = dateToHour(moonset);
      
      // Get moon phase information
      const moonPhase = moonService.getMoonPhase(currentDate);
      
      // ULTRA SIMPLE: Calculate moon progress
      let moonProgress = null;
      
      // Check if moon is visible
      const isMoonUp = moonService.isMoonVisible(currentDate, latitudeBand);
      
      if (isMoonUp) {
        // Calculate a simple normalized position using the arc length
        let arcStart = moonriseHour;
        let arcEnd = moonsetHour;
        
        // Handle midnight crossing
        if (arcEnd < arcStart) {
          arcEnd += 24;
        }
        
        // Adjust current hour if needed
        let adjustedHour = currentHour;
        if (currentHour < arcStart && currentHour < arcEnd) {
          adjustedHour += 24;
        }
        
        // Calculate simple linear progress (0-1)
        const arcLength = arcEnd - arcStart;
        moonProgress = (adjustedHour - arcStart) / arcLength;
        moonProgress = Math.max(0, Math.min(1, moonProgress));
      }
      
      // Add visibility calculation based on illumination and daytime
      // Calculate a visibility factor between 0.3 and 1.0
      // Lower illumination = less visible, especially during day
      const illuminationFactor = moonPhase.exactPercentage / 100; // 0.0 to 1.0
      
      // During day: lower visibility (0.3-0.7 range)
      // At night: higher visibility (0.7-1.0 range)
      const visibilityFactor = isDaytime
        ? 0.3 + (illuminationFactor * 0.4) // Day: 0.3 to 0.7
        : 0.7 + (illuminationFactor * 0.3); // Night: 0.7 to 1.0
      
      // Create visual moon phase with adjusted visibility
      const visualMoonPhase = {
        ...moonPhase,
        visibilityFactor
      };
      
      // Update state
      setCalculations({
        sunriseHour,
        sunsetHour,
        moonriseHour,
        moonsetHour,
        currentHour,
        sunProgress,
        moonProgress,
        visualMoonPhase,
        isDaytime,
      });
      
      console.log("Celestial calculations:", {
        currentHour,
        sunriseHour,
        sunsetHour,
        moonriseHour,
        moonsetHour,
        sunProgress,
        moonProgress,
        isMoonUp,
        visibilityFactor,
        isDaytime
      });
    } catch (error) {
      console.error("Error in celestial calculations:", error);
    }
  }, [currentDate, latitudeBand]);

  return calculations;
}