/**
 * Moon Service - Flat Disc World Model
 * Calculates lunar phases, moonrise, and moonset based on angular separation
 *
 * Per FLAT_DISC_WORLD.md specification:
 * - Moon orbits disc edge every 24.8 hours (rises/sets daily like Earth's moon)
 * - Lunar phase depends on angular separation between Moon and Sun
 * - Synodic period (29.53 days) emerges from moon being slower than sun
 * - Each observer has unique moonrise/moonset times based on θ_obs
 */

import { getDayOfYear } from '../../utils/dateUtils.js';
import {
  MOON_PHASES,
  MOON_ORBITAL_PERIOD_HOURS,
  DEFAULT_OBSERVER_ANGLE,
  DEFAULT_MOON_PHASE_OFFSET,
  DEFAULT_SUN_PHASE_OFFSET,
  HOURS_PER_DAY
} from '../../models/constants.js';
import {
  getMoonAngle,
  getSunAngle,
  getLunarPhaseAngle,
  calculateIlluminationPercentage,
  isWaxing,
  normalizeAngle
} from './geometry.js';

class MoonService {
  /**
   * Calculate total hours since year start for moon position
   * @param {GameDate} gameDate - Date object {year, month, day, hour}
   * @returns {number} Hours since year start
   */
  getHoursSinceYearStart(gameDate) {
    const dayOfYear = getDayOfYear(gameDate.month, gameDate.day);
    const daysSinceYearStart = dayOfYear - 1; // Day 1 = 0 days elapsed
    return daysSinceYearStart * HOURS_PER_DAY + gameDate.hour;
  }

  /**
   * Get the moon's current angular position
   * Moon orbits every 24.8 hours
   * @param {GameDate} gameDate - Date object {year, month, day, hour}
   * @param {number} φ_moon - Moon phase offset in degrees (default 0)
   * @returns {number} Moon's angular position in degrees [0, 360)
   */
  getMoonPosition(gameDate, φ_moon = DEFAULT_MOON_PHASE_OFFSET) {
    const hoursSinceEpoch = this.getHoursSinceYearStart(gameDate);
    return getMoonAngle(hoursSinceEpoch, φ_moon);
  }

  /**
   * Get the sun's current angular position
   * @param {GameDate} gameDate - Date object {year, month, day, hour}
   * @param {number} φ_sun - Sun phase offset in degrees (default 0)
   * @returns {number} Sun's angular position in degrees [0, 360)
   */
  getSunPosition(gameDate, φ_sun = DEFAULT_SUN_PHASE_OFFSET) {
    return getSunAngle(gameDate.hour, φ_sun);
  }

  /**
   * Calculate current lunar phase
   * @param {GameDate} gameDate - Date object
   * @param {number} φ_moon - Moon phase offset
   * @param {number} φ_sun - Sun phase offset
   * @returns {Object} Lunar phase data
   */
  getLunarPhase(gameDate, φ_moon = DEFAULT_MOON_PHASE_OFFSET, φ_sun = DEFAULT_SUN_PHASE_OFFSET) {
    const θ_moon = this.getMoonPosition(gameDate, φ_moon);
    const θ_sun = this.getSunPosition(gameDate, φ_sun);
    const phaseAngle = getLunarPhaseAngle(θ_moon, θ_sun);

    // Find matching phase from MOON_PHASES
    const phaseData = this.getPhaseFromAngle(phaseAngle);
    const illumination = calculateIlluminationPercentage(phaseAngle);
    const waxing = isWaxing(phaseAngle);

    return {
      phaseName: phaseData.name,
      phaseIcon: phaseData.icon,
      phaseAngle: Math.round(phaseAngle * 10) / 10, // 1 decimal place
      illumination: Math.round(illumination),
      isWaxing: waxing,
      θ_moon: Math.round(θ_moon * 10) / 10,
      θ_sun: Math.round(θ_sun * 10) / 10
    };
  }

  /**
   * Get phase name and icon from phase angle
   * @param {number} phaseAngle - Phase angle in degrees [0, 360)
   * @returns {Object} Phase data {name, icon, illumination}
   */
  getPhaseFromAngle(phaseAngle) {
    const normalized = normalizeAngle(phaseAngle);

    for (const phase of MOON_PHASES) {
      if (phase.maxAngle === 360) {
        // Last phase wraps to 0
        if (normalized >= phase.minAngle || normalized < MOON_PHASES[0].maxAngle) {
          return phase;
        }
      } else if (normalized >= phase.minAngle && normalized < phase.maxAngle) {
        return phase;
      }
    }

    // Fallback (should never happen)
    return MOON_PHASES[0]; // New Moon
  }

  /**
   * Calculate moonrise time for an observer
   * Moonrise occurs when θ_moon = θ_obs - 90° (moon enters visible hemisphere from "east")
   * Moon rises approximately once per day (24.8 hour period)
   *
   * @param {GameDate} gameDate - Date object
   * @param {number} θ_obs - Observer angular position in degrees
   * @param {number} φ_moon - Moon phase offset
   * @returns {number|null} Hour of moonrise [0, 24), or null if doesn't rise during this day
   */
  getMoonriseHour(gameDate, θ_obs = DEFAULT_OBSERVER_ANGLE, φ_moon = DEFAULT_MOON_PHASE_OFFSET) {
    // Target angle for moonrise (moon enters visible hemisphere)
    const targetAngle = normalizeAngle(θ_obs - 90);

    // Search for crossing during the day
    const result = this.findAngleCrossing(gameDate, targetAngle, φ_moon, true);
    console.log(`[MOONRISE DEBUG] θ_obs=${θ_obs}, targetAngle=${targetAngle}, result=${result}`);
    return result;
  }

  /**
   * Calculate moonset time for an observer
   * Moonset occurs when θ_moon = θ_obs + 90° (moon exits visible hemisphere to "west")
   *
   * @param {GameDate} gameDate - Date object
   * @param {number} θ_obs - Observer angular position in degrees
   * @param {number} φ_moon - Moon phase offset
   * @returns {number|null} Hour of moonset [0, 24), or null if doesn't set during this day
   */
  getMoonsetHour(gameDate, θ_obs = DEFAULT_OBSERVER_ANGLE, φ_moon = DEFAULT_MOON_PHASE_OFFSET) {
    // Target angle for moonset (moon exits visible hemisphere)
    const targetAngle = normalizeAngle(θ_obs + 90);

    // Search for crossing during the day
    const result = this.findAngleCrossing(gameDate, targetAngle, φ_moon, false);
    console.log(`[MOONSET DEBUG] θ_obs=${θ_obs}, targetAngle=${targetAngle}, result=${result}`);
    return result;
  }

  /**
   * Find the hour when moon crosses a target angle during the current day
   * Uses sampling and binary search for precision
   *
   * @param {GameDate} gameDate - Date object
   * @param {number} targetAngle - Target angle to cross [0, 360)
   * @param {number} φ_moon - Moon phase offset
   * @param {boolean} findFirst - If true, find first crossing; if false, find last
   * @returns {number|null} Hour of crossing, or null if no crossing today
   * @private
   */
  findAngleCrossing(gameDate, targetAngle, φ_moon, findFirst = true) {
    // Sample moon positions throughout the day
    const samples = [];
    const sampleInterval = 0.5; // Sample every 30 minutes

    for (let hour = 0; hour < HOURS_PER_DAY; hour += sampleInterval) {
      const testDate = { ...gameDate, hour };
      const θ_moon = this.getMoonPosition(testDate, φ_moon);
      samples.push({ hour, angle: θ_moon });
    }

    console.log(`[CROSSING DEBUG] Finding ${findFirst ? 'FIRST' : 'LAST'} crossing for targetAngle=${targetAngle}`);
    console.log(`[CROSSING DEBUG] Moon angle at hour 0: ${samples[0].angle}`);
    console.log(`[CROSSING DEBUG] Moon angle at hour 12: ${samples[24].angle}`);
    console.log(`[CROSSING DEBUG] Moon angle at hour 23.5: ${samples[samples.length - 1].angle}`);

    // Find crossings (where angle passes through target)
    const crossings = [];

    for (let i = 0; i < samples.length - 1; i++) {
      const curr = samples[i];
      const next = samples[i + 1];

      // Check if we crossed the target angle
      if (this.didCrossAngle(curr.angle, next.angle, targetAngle)) {
        // Use binary search to find exact crossing hour
        const exactHour = this.binarySearchAngleCrossing(
          gameDate, targetAngle, curr.hour, next.hour, φ_moon
        );
        console.log(`[CROSSING DEBUG] Found crossing at hour ${exactHour} (between ${curr.hour} and ${next.hour})`);
        crossings.push(exactHour);
      }
    }

    console.log(`[CROSSING DEBUG] Total crossings found: ${crossings.length}`);

    if (crossings.length === 0) {
      return null; // No crossing today
    }

    // Return first or last crossing
    const result = findFirst ? crossings[0] : crossings[crossings.length - 1];
    console.log(`[CROSSING DEBUG] Returning ${findFirst ? 'FIRST' : 'LAST'} crossing: ${result}`);
    return result;
  }

  /**
   * Check if angle crossed target between two samples
   * Handles wraparound at 0°/360°
   * @private
   */
  didCrossAngle(angle1, angle2, target) {
    const norm1 = normalizeAngle(angle1);
    const norm2 = normalizeAngle(angle2);
    const normTarget = normalizeAngle(target);

    // Calculate angular distance traveled
    let travel = norm2 - norm1;
    if (travel < -180) travel += 360;
    if (travel > 180) travel -= 360;

    // Distance from start to target
    let toTarget = normTarget - norm1;
    if (toTarget < -180) toTarget += 360;
    if (toTarget > 180) toTarget -= 360;

    // Check if target is between start and end
    if (travel > 0) {
      // Moving forward
      return toTarget >= 0 && toTarget <= travel;
    } else {
      // Moving backward
      return toTarget <= 0 && toTarget >= travel;
    }
  }

  /**
   * Binary search to find exact hour when moon angle equals target
   * @private
   */
  binarySearchAngleCrossing(gameDate, targetAngle, hourStart, hourEnd, φ_moon) {
    let low = hourStart;
    let high = hourEnd;
    const tolerance = 0.001; // ~3.6 seconds

    while (high - low > tolerance) {
      const mid = (low + high) / 2;
      const testDate = { ...gameDate, hour: mid };
      const θ_moon = this.getMoonPosition(testDate, φ_moon);

      // Check if close enough
      const diff = Math.abs(normalizeAngle(θ_moon - targetAngle));
      const diff2 = Math.abs(360 - diff); // Handle wraparound

      if (Math.min(diff, diff2) < 0.1) {
        return mid; // Close enough
      }

      // Determine which half to search
      const θ_low = this.getMoonPosition({ ...gameDate, hour: low }, φ_moon);

      if (this.didCrossAngle(θ_low, θ_moon, targetAngle)) {
        // Target is between low and mid
        high = mid;
      } else {
        // Target is between mid and high
        low = mid;
      }
    }

    return (low + high) / 2;
  }

  /**
   * Check if moon is currently visible (above horizon)
   * Moon is visible when within ±90° of observer's position
   * @param {GameDate} gameDate - Date object
   * @param {number} θ_obs - Observer angular position
   * @param {number} φ_moon - Moon phase offset
   * @returns {boolean} True if moon is visible
   */
  isMoonVisible(gameDate, θ_obs = DEFAULT_OBSERVER_ANGLE, φ_moon = DEFAULT_MOON_PHASE_OFFSET) {
    const θ_moon = this.getMoonPosition(gameDate, φ_moon);

    // Moon is visible if it's within the observer's visible hemisphere
    // This means: θ_obs - 90° ≤ θ_moon ≤ θ_obs + 90°
    const relativeAngle = normalizeAngle(θ_moon - θ_obs);

    // Moon is visible if relative angle is between -90° and +90°
    // In normalized form [0, 360), this means: 0° ≤ angle ≤ 90° OR 270° ≤ angle < 360°
    return relativeAngle <= 90 || relativeAngle >= 270;
  }

  /**
   * Format moonrise/moonset hour as time string
   * @param {number} hour - Hour as decimal
   * @param {boolean} use24Hour - Use 24-hour format
   * @returns {string} Formatted time
   */
  formatMoonTime(hour, use24Hour = false) {
    if (hour === null || hour === undefined) return null;

    let wholeHour = Math.floor(hour);
    let minutes = Math.round((hour - wholeHour) * 60);

    // Handle minute rollover (e.g., 9:60 → 10:00)
    if (minutes >= 60) {
      wholeHour += 1;
      minutes = 0;
    }

    // Handle hour overflow
    if (wholeHour >= 24) {
      wholeHour = wholeHour % 24;
    }

    if (use24Hour) {
      return `${wholeHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // 12-hour format
    if (wholeHour === 0) return `12:${minutes.toString().padStart(2, '0')} AM`;
    if (wholeHour === 12) return `12:${minutes.toString().padStart(2, '0')} PM`;
    if (wholeHour < 12) return `${wholeHour}:${minutes.toString().padStart(2, '0')} AM`;
    return `${wholeHour - 12}:${minutes.toString().padStart(2, '0')} PM`;
  }

  /**
   * Get complete moon information for display
   * @param {GameDate} gameDate - Date object
   * @param {number} θ_obs - Observer angular position
   * @param {boolean} use24Hour - Time format
   * @param {number} φ_moon - Moon phase offset
   * @param {number} φ_sun - Sun phase offset
   * @returns {Object} Complete moon data
   */
  getFormattedMoonInfo(gameDate, θ_obs = DEFAULT_OBSERVER_ANGLE, use24Hour = false,
                       φ_moon = DEFAULT_MOON_PHASE_OFFSET, φ_sun = DEFAULT_SUN_PHASE_OFFSET) {
    const phase = this.getLunarPhase(gameDate, φ_moon, φ_sun);
    const moonriseHour = this.getMoonriseHour(gameDate, θ_obs, φ_moon);
    const moonsetHour = this.getMoonsetHour(gameDate, θ_obs, φ_moon);
    const isVisible = this.isMoonVisible(gameDate, θ_obs, φ_moon);

    return {
      ...phase,
      moonriseTime: moonriseHour !== null ? this.formatMoonTime(moonriseHour, use24Hour) : 'No rise today',
      moonsetTime: moonsetHour !== null ? this.formatMoonTime(moonsetHour, use24Hour) : 'No set today',
      isMoonVisible: isVisible
    };
  }
}

// Export singleton instance
export default new MoonService();
