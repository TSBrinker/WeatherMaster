import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { WiDaySunny } from 'react-icons/wi';
import { WiMoonNew, WiMoonWaxingCrescent3, WiMoonFirstQuarter, WiMoonWaxingGibbous3, WiMoonFull, WiMoonWaningGibbous3, WiMoonThirdQuarter, WiMoonWaningCrescent3 } from 'react-icons/wi';
import { parseTimeToHour, isNightTime } from '../../utils/skyGradientUtils';
import './CelestialTrackDisplay.css';

// Track bounds: bodies travel from 10% to 90%, leaving room to animate off edges
const TRACK_START = 10;
const TRACK_END = 90;

/**
 * Map a 0-100 progress value to the track's visual bounds (5% to 95%)
 */
function mapToTrackBounds(progress) {
  return TRACK_START + (progress / 100) * (TRACK_END - TRACK_START);
}

/**
 * Calculate sun position as percentage across the track
 * Returns null if sun is not visible (before sunrise or after sunset)
 */
function calculateSunPosition(currentHour, sunriseHour, sunsetHour) {
  if (sunriseHour === null || sunsetHour === null) {
    return null;
  }

  // Sun visible from sunrise hour through sunset hour (inclusive)
  if (currentHour < sunriseHour || currentHour > sunsetHour) {
    return null;
  }

  const dayLength = sunsetHour - sunriseHour;
  if (dayLength <= 0) return null;

  const hoursSinceSunrise = currentHour - sunriseHour;
  const progress = (hoursSinceSunrise / dayLength) * 100;

  return mapToTrackBounds(progress);
}

/**
 * Calculate moon position as percentage across the track
 * Returns null if moon is not visible
 */
function calculateMoonPosition(currentHour, moonriseHour, moonsetHour) {
  if (moonriseHour === null || moonsetHour === null) {
    return null;
  }

  let isVisible = false;
  let visibleDuration = 0;
  let hoursSinceMoonrise = 0;

  if (moonriseHour < moonsetHour) {
    // Normal case: moonrise before moonset on same day (inclusive of moonset hour)
    isVisible = currentHour >= moonriseHour && currentHour <= moonsetHour;
    visibleDuration = moonsetHour - moonriseHour;
    hoursSinceMoonrise = currentHour - moonriseHour;
  } else {
    // Overnight case: moonrise in evening, moonset next morning (inclusive)
    isVisible = currentHour >= moonriseHour || currentHour <= moonsetHour;
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

  const progress = (hoursSinceMoonrise / visibleDuration) * 100;
  return mapToTrackBounds(progress);
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
 * - Hover tooltips show rise/set times and moon phase
 */
const CelestialTrackDisplay = ({
  currentDate,
  celestialData,
}) => {
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

  const showSun = sunPosition !== null;
  const showMoon = moonPosition !== null;

  // Build tooltip content
  const sunTooltip = `Sunrise: ${celestialData.sunriseTime}\nSunset: ${celestialData.sunsetTime}`;
  const moonTooltip = `${celestialData.moonPhase}${showMoon ? '' : ' (below horizon)'}\nMoonrise: ${celestialData.moonriseTime}\nMoonset: ${celestialData.moonsetTime}`;

  return (
    <div className="celestial-track-display">
      <div className="celestial-divider" />

      {/* Sun Track */}
      <div className="celestial-track sun-track">
        {showSun && (
          <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip id="sun-tooltip" style={{ whiteSpace: 'pre-line' }}>{sunTooltip}</Tooltip>}
          >
            <div
              className="celestial-body sun"
              style={{ left: `${sunPosition}%` }}
            >
              <WiDaySunny />
            </div>
          </OverlayTrigger>
        )}
      </div>

      {/* Moon Track */}
      <div className="celestial-track moon-track">
        {showMoon && (
          <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip id="moon-tooltip" style={{ whiteSpace: 'pre-line' }}>{moonTooltip}</Tooltip>}
          >
            <div
              className={`celestial-body moon ${isNight ? 'moon-night' : 'moon-day'}`}
              style={{ left: `${moonPosition}%` }}
            >
              {getMoonIcon(celestialData.moonPhase)}
            </div>
          </OverlayTrigger>
        )}
      </div>
    </div>
  );
};

export default CelestialTrackDisplay;
