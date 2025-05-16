// src/components/weather/EnhancedTimeControls.jsx
import React from "react";
import sunriseSunsetService from "../../services/SunriseSunsetService";

const EnhancedTimeControls = ({
  onAdvanceTime,
  currentDate,
  latitudeBand = "temperate",
}) => {
  // Get sunrise/sunset times
  const celestialInfo = sunriseSunsetService.getFormattedSunriseSunset(
    latitudeBand,
    currentDate
  );
  const isDaytime = celestialInfo.isDaytime;

  // Calculate hours until next sunrise or sunset
  const calculateHoursToNextEvent = () => {
    const currentTime = currentDate.getTime();
    const sunriseTime = celestialInfo.sunrise.getTime();
    const sunsetTime = celestialInfo.sunset.getTime();

    let hoursToEvent = 0;
    let eventName = "";

    if (isDaytime) {
      // Calculate hours to sunset
      if (currentTime < sunsetTime) {
        hoursToEvent = Math.ceil((sunsetTime - currentTime) / (1000 * 60 * 60));
        eventName = "Sunset";
      } else {
        // Next day's sunrise
        const nextSunrise = new Date(celestialInfo.sunrise);
        nextSunrise.setDate(nextSunrise.getDate() + 1);
        hoursToEvent = Math.ceil(
          (nextSunrise.getTime() - currentTime) / (1000 * 60 * 60)
        );
        eventName = "Sunrise";
      }
    } else {
      // Calculate hours to sunrise
      if (currentTime < sunriseTime) {
        hoursToEvent = Math.ceil(
          (sunriseTime - currentTime) / (1000 * 60 * 60)
        );
        eventName = "Sunrise";
      } else {
        // Next day's sunrise
        const nextSunrise = new Date(celestialInfo.sunrise);
        nextSunrise.setDate(nextSunrise.getDate() + 1);
        hoursToEvent = Math.ceil(
          (nextSunrise.getTime() - currentTime) / (1000 * 60 * 60)
        );
        eventName = "Sunrise";
      }
    }

    return { hours: hoursToEvent, event: eventName };
  };

  const nextEvent = calculateHoursToNextEvent();

  return (
    <div className="flex flex-col">
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => onAdvanceTime(1)}
          className="btn btn-primary px-3 py-1"
        >
          +1h
        </button>
        <button
          onClick={() => onAdvanceTime(4)}
          className="btn btn-primary px-3 py-1"
        >
          +4h
        </button>
        <button
          onClick={() => onAdvanceTime(24)}
          className="btn btn-primary px-3 py-1"
        >
          +24h
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAdvanceTime(nextEvent.hours)}
          className="btn btn-secondary flex-1 px-3 py-1"
          title={`Skip ${nextEvent.hours} hours to next ${nextEvent.event}`}
        >
          Next {nextEvent.event} ({nextEvent.hours}h)
        </button>

        <button
          onClick={() => onAdvanceTime(isDaytime ? 12 : 12)}
          className="btn btn-secondary flex-1 px-3 py-1"
        >
          {isDaytime ? "Tonight" : "Tomorrow"}
        </button>
      </div>
    </div>
  );
};

export default EnhancedTimeControls;
