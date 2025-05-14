// src/hooks/useCelestialCalculations.js - Simplified for debugging
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
      
      // Current time as decimal
      const currentHour = dateToHour(currentDate);
      
      // Get sun information
      const sunInfo = sunriseSunsetService.getFormattedSunriseSunset(
        latitudeBand,
        currentDate
      );
      
      const sunriseHour = dateToHour(sunInfo.sunrise);
      const sunsetHour = dateToHour(sunInfo.sunset);
      const isDaytime = sunInfo.isDaytime;
      
      // Calculate sun progress - WHEN VISIBLE
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
      
      // Get moon phase
      const moonPhase = moonService.getMoonPhase(currentDate);
      
      // EXTREME SIMPLIFICATION OF MOON PROGRESS
      // Treat the moon exactly like the sun for debugging
      let moonProgress = null;
      const isMoonVisible = moonService.isMoonVisible(currentDate, latitudeBand);
      
      if (isMoonVisible) {
        // Handle case where moon crosses midnight
        if (moonsetHour < moonriseHour) {
          // Need to adjust calculations for midnight crossing
          if (currentHour >= moonriseHour) {
            // After moonrise, before midnight
            const arcLength = (24 - moonriseHour) + moonsetHour;
            moonProgress = (currentHour - moonriseHour) / arcLength;
          } else {
            // After midnight, before moonset
            const arcLength = (24 - moonriseHour) + moonsetHour;
            moonProgress = ((currentHour + 24) - moonriseHour) / arcLength;
          }
        } else {
          // Simple case - same as sun calculation
          const arcLength = moonsetHour - moonriseHour;
          moonProgress = (currentHour - moonriseHour) / arcLength;
        }
        
        // Ensure progress is between 0-1
        moonProgress = Math.max(0, Math.min(1, moonProgress));
      }
      
      // Basic visibility adjustment
      const baseVisibility = isDaytime ? 0.6 : 1.0;
      
      // Create simplified moon phase info
      const visualMoonPhase = {
        icon: moonPhase.icon,
        name: moonPhase.name,
        visibilityFactor: baseVisibility
      };
      
      // Log the key values
      console.log("Celestial debug:", {
        currentHour,
        sunriseHour,
        sunsetHour,
        moonriseHour,
        moonsetHour,
        isMoonVisible,
        moonProgress
      });
      
      // Update the calculations state
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
    } catch (error) {
      console.error("Error in celestial calculations:", error);
    }
  }, [currentDate, latitudeBand]);

  return calculations;
}