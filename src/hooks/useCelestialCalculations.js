// src/hooks/useCelestialCalculations.js
import { useState, useEffect } from "react";
import sunriseSunsetService from "../services/SunriseSunsetService";
import moonService from "../services/MoonService";
import { formatTimeWithMinutes } from "../utils/timeUtils";

export const useCelestialCalculations = (currentDate, latitudeBand) => {
  const [calculations, setCalculations] = useState({
    sunriseHour: null,
    sunsetHour: null,
    moonriseHour: null,
    moonsetHour: null,
    currentHour: 0,
    sunProgress: null,
    moonProgress: null,
    visualMoonPhase: null,
    isDaytime: false
  });

  useEffect(() => {
    if (!currentDate) return;

    try {
      // Get sun info
      const { sunrise, sunset, isDaytime } =
        sunriseSunsetService.getFormattedSunriseSunset(latitudeBand, currentDate);

      // Get moon info
      const { moonrise, moonset } = moonService.getMoonTimes(currentDate);

      // Convert a Date to decimal hours (0-24)
      const getDecimalHours = (date) => {
        if (!(date instanceof Date) || isNaN(date.getTime())) return null;
        return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
      };

      // Calculate hours
      const currentHour = getDecimalHours(currentDate);
      const sunriseHour = getDecimalHours(sunrise);
      const sunsetHour = getDecimalHours(sunset);
      const moonriseHour = getDecimalHours(moonrise);
      const moonsetHour = getDecimalHours(moonset);

      // Calculate sun position on arc (returns progress 0-1)
      const calculateSunProgress = () => {
        // If current time is before sunrise or after sunset, sun is below horizon
        if (currentHour < sunriseHour || currentHour > sunsetHour) {
          return null; // Below horizon
        }

        // Calculate progress (0-1) between sunrise and sunset
        const dayLength = sunsetHour - sunriseHour;
        // Guard against division by zero
        if (dayLength <= 0) return 0.5; // Default to midday if invalid
        
        const timeSinceSunrise = currentHour - sunriseHour;
        return timeSinceSunrise / dayLength;
      };

      // Calculate moon position on arc (returns progress 0-1)
      const calculateMoonProgress = () => {
        // Check if moonrise/moonset are valid
        if (moonriseHour === null || moonsetHour === null) {
          return null;
        }
        
        // Handle case where moonset is on the next day
        let visibleHours;
        let moonIsVisible;
        
        if (moonsetHour < moonriseHour) {
          // Moon crosses midnight
          visibleHours = 24 - moonriseHour + moonsetHour;
          moonIsVisible = currentHour >= moonriseHour || currentHour <= moonsetHour;
        } else {
          // Moon rises and sets on the same day
          visibleHours = moonsetHour - moonriseHour;
          moonIsVisible = currentHour >= moonriseHour && currentHour <= moonsetHour;
        }
        
        if (!moonIsVisible) {
          return null; // Moon is below horizon
        }
        
        // Calculate progress along the arc
        let progress;
        if (moonsetHour < moonriseHour) {
          // Handle day wraparound
          if (currentHour >= moonriseHour) {
            // After moonrise, before midnight
            progress = (currentHour - moonriseHour) / visibleHours;
          } else {
            // After midnight, before moonset
            progress = (24 - moonriseHour + currentHour) / visibleHours;
          }
        } else {
          // Same day
          progress = (currentHour - moonriseHour) / visibleHours;
        }
        
        return progress;
      };

      const sunProgress = calculateSunProgress();
      const moonProgress = calculateMoonProgress();

      // Get the visual moon phase
      const visualMoonPhase = moonService.getVisualMoonPhase(
        currentDate,
        sunProgress !== null, // isDaytime 
        moonProgress !== null // isMoonVisible
      );

      setCalculations({
        sunriseHour,
        sunsetHour,
        moonriseHour,
        moonsetHour,
        currentHour,
        sunProgress,
        moonProgress,
        visualMoonPhase,
        isDaytime
      });
    } catch (error) {
      console.error("Error in celestial calculations:", error);
    }
  }, [currentDate, latitudeBand]);

  return calculations;
};