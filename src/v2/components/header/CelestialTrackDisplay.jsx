import React from 'react';
import { WiDaySunny } from 'react-icons/wi';
import { WiMoonNew, WiMoonWaxingCrescent3, WiMoonFirstQuarter, WiMoonWaxingGibbous3, WiMoonFull, WiMoonWaningGibbous3, WiMoonThirdQuarter, WiMoonWaningCrescent3 } from 'react-icons/wi';
import { useCelestialAnimation, ANIMATION_PHASE } from '../../hooks/useCelestialAnimation';
import { parseTimeToHour, isNightTime } from '../../utils/skyGradientUtils';
import './CelestialTrackDisplay.css';

/**
 * Calculate sun position as percentage across the track (0-100)
 * Returns null if sun is not visible (before sunrise or after sunset)
 */
function calculateSunPosition(currentHour, sunriseHour, sunsetHour) {
  // Handle special cases
  if (sunriseHour === null || sunsetHour === null) {
    return null; // Can't calculate without data
  }

  // Check if sun is above horizon
  if (currentHour < sunriseHour || currentHour >= sunsetHour) {
    return null; // Sun not visible
  }

  // Calculate position: 0% at sunrise, 100% at sunset
  const dayLength = sunsetHour - sunriseHour;
  if (dayLength <= 0) return null;

  const hoursSinceSunrise = currentHour - sunriseHour;
  return (hoursSinceSunrise / dayLength) * 100;
}

/**
 * Calculate moon position as percentage across the track (0-100)
 * Returns null if moon is not visible
 */
function calculateMoonPosition(currentHour, moonriseHour, moonsetHour) {
  // Handle special cases
  if (moonriseHour === null || moonsetHour === null) {
    return null;
  }

  // Check if moon is visible (handles overnight visibility)
  let isVisible = false;
  let visibleDuration = 0;
  let hoursSinceMoonrise = 0;

  if (moonriseHour < moonsetHour) {
    // Normal case: moonrise before moonset on same day
    isVisible = currentHour >= moonriseHour && currentHour < moonsetHour;
    visibleDuration = moonsetHour - moonriseHour;
    hoursSinceMoonrise = currentHour - moonriseHour;
  } else {
    // Overnight case: moonrise in evening, moonset next morning
    isVisible = currentHour >= moonriseHour || currentHour < moonsetHour;
    visibleDuration = (24 - moonriseHour) + moonsetHour;

    if (currentHour >= moonriseHour) {
      hoursSinceMoonrise = currentHour - moonriseHour;
    } else {
      hoursSinceMoonrise = (24 - moonriseHour) + currentHour;
    }
  }

  if (!isVisible || visibleDuration <= 0) {
    return null;
  }

  return (hoursSinceMoonrise / visibleDuration) * 100;
}

/**
 * Get moon icon based on phase name
 */
function getMoonIcon(phase) {
  if (!phase) return <WiMoonNew />;
  const phaseLower = phase.toLowerCase();
  if (phaseLower.includes('new')) return <WiMoonNew />;
  if (phaseLower.includes('waxing crescent')) return <WiMoonWaxingCrescent3 />;
  if (phaseLower.includes('first quarter')) return <WiMoonFirstQuarter />;
  if (phaseLower.includes('waxing gibbous')) return <WiMoonWaxingGibbous3 />;
  if (phaseLower.includes('full')) return <WiMoonFull />;
  if (phaseLower.includes('waning gibbous')) return <WiMoonWaningGibbous3 />;
  if (phaseLower.includes('last quarter') || phaseLower.includes('third quarter')) return <WiMoonThirdQuarter />;
  if (phaseLower.includes('waning crescent')) return <WiMoonWaningCrescent3 />;
  return <WiMoonNew />;
}

/**
 * CelestialTrackDisplay - Shows sun and moon positions in horizontal tracks
 *
 * Features:
 * - Sun track: shows sun position during daylight hours
 * - Moon track: shows moon position when above horizon
 * - Moon is dimmed when sun is up, opaque at night
 * - Circuit animation when crossing day boundaries
 */
const CelestialTrackDisplay = ({
  currentDate,
  previousDate,
  celestialData,
}) => {
  const { animationPhase, exitDirection, isAnimating } = useCelestialAnimation(currentDate, previousDate);

  if (!celestialData || !currentDate) {
    return null;
  }

  // Parse celestial times
  const sunriseHour = parseTimeToHour(celestialData.sunriseTime);
  const sunsetHour = parseTimeToHour(celestialData.sunsetTime);
  const moonriseHour = parseTimeToHour(celestialData.moonriseTime);
  const moonsetHour = parseTimeToHour(celestialData.moonsetTime);
  const currentHour = currentDate.hour;

  // Calculate positions
  const sunPosition = calculateSunPosition(currentHour, sunriseHour, sunsetHour);
  const moonPosition = calculateMoonPosition(currentHour, moonriseHour, moonsetHour);

  // Determine if it's night (for moon styling)
  const isNight = isNightTime(currentHour, sunriseHour, sunsetHour);

  // Get animation class based on phase and direction
  const getAnimationClass = (isExiting) => {
    if (!isAnimating) return '';

    if (animationPhase === ANIMATION_PHASE.CIRCUIT_EXIT && isExiting) {
      return exitDirection === 'right' ? 'circuit-exit-right' : 'circuit-exit-left';
    }
    if (animationPhase === ANIMATION_PHASE.CIRCUIT_ENTER && !isExiting) {
      return exitDirection === 'right' ? 'circuit-enter-left' : 'circuit-enter-right';
    }
    return '';
  };

  // During exit phase, show bodies exiting; during enter phase, show at new position
  const showSun = animationPhase === ANIMATION_PHASE.CIRCUIT_EXIT
    ? true // Always show during exit (animating out)
    : sunPosition !== null;

  const showMoon = animationPhase === ANIMATION_PHASE.CIRCUIT_EXIT
    ? true // Always show during exit
    : moonPosition !== null;

  return (
    <div className="celestial-track-display">
      <div className="celestial-divider" />

      {/* Sun Track */}
      <div className="celestial-track sun-track">
        <div className="track-line" />
        {showSun && (
          <div
            className={`celestial-body sun ${getAnimationClass(animationPhase === ANIMATION_PHASE.CIRCUIT_EXIT)}`}
            style={{
              left: `${sunPosition ?? 50}%`,
              opacity: animationPhase === ANIMATION_PHASE.CIRCUIT_ENTER ? 0 : 1,
            }}
          >
            <WiDaySunny />
          </div>
        )}
        {!showSun && animationPhase === ANIMATION_PHASE.IDLE && (
          <div className="track-empty-label">Below horizon</div>
        )}
      </div>

      {/* Moon Track */}
      <div className="celestial-track moon-track">
        <div className="track-line" />
        {showMoon && (
          <div
            className={`celestial-body moon ${isNight ? 'moon-night' : 'moon-day'} ${getAnimationClass(animationPhase === ANIMATION_PHASE.CIRCUIT_EXIT)}`}
            style={{
              left: `${moonPosition ?? 50}%`,
              opacity: animationPhase === ANIMATION_PHASE.CIRCUIT_ENTER ? 0 : 1,
            }}
          >
            {getMoonIcon(celestialData.moonPhase)}
          </div>
        )}
        {!showMoon && animationPhase === ANIMATION_PHASE.IDLE && (
          <div className="track-empty-label">Below horizon</div>
        )}
      </div>
    </div>
  );
};

export default CelestialTrackDisplay;
