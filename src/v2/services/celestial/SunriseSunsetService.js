/**
 * Sunrise/Sunset Service - Flat Disc World Model
 * Calculates sunrise, sunset, day length, and twilight based on flat disc geometry
 *
 * BREAKING CHANGE from v1: Uses distance-based illumination instead of spherical astronomy
 * Per FLAT_DISC_WORLD.md specification
 */

import { getDayOfYear } from '../../utils/dateUtils.js';
import {
  LATITUDE_BAND_RADIUS,
  SUN_ILLUMINATION_RADIUS,
  TWILIGHT_CIVIL,
  TWILIGHT_NAUTICAL,
  TWILIGHT_ASTRONOMICAL,
  ILLUMINATION_STATE,
  DEFAULT_OBSERVER_ANGLE,
  DEFAULT_SUN_PHASE_OFFSET,
  HOURS_PER_DAY
} from '../../models/constants.js';
import {
  getSunOrbitalRadius,
  getSunAngle,
  distanceToSun,
  normalizeAngle
} from './geometry.js';

class SunriseSunsetService {
  constructor() {
    // Cache for sunrise/sunset calculations - keyed by "latitudeBand:month:day:θ_obs"
    // Sunrise/sunset only depends on date (not hour), so we can cache per-day
    this.cache = new Map();
  }

  /**
   * Convert latitude band to observer distance from disc center
   * @param {string} latitudeBand - Latitude band key
   * @returns {number} Distance from disc center in miles
   */
  getObserverRadius(latitudeBand) {
    return LATITUDE_BAND_RADIUS[latitudeBand] || LATITUDE_BAND_RADIUS.temperate;
  }

  /**
   * Get illumination state based on distance to sun
   * @param {number} distance - Distance to sun in miles
   * @returns {string} Illumination state (daylight, civil, nautical, astronomical, night)
   */
  getIlluminationState(distance) {
    if (distance <= SUN_ILLUMINATION_RADIUS) {
      return ILLUMINATION_STATE.DAYLIGHT;
    } else if (distance <= TWILIGHT_CIVIL) {
      return ILLUMINATION_STATE.CIVIL_TWILIGHT;
    } else if (distance <= TWILIGHT_NAUTICAL) {
      return ILLUMINATION_STATE.NAUTICAL_TWILIGHT;
    } else if (distance <= TWILIGHT_ASTRONOMICAL) {
      return ILLUMINATION_STATE.ASTRONOMICAL_TWILIGHT;
    } else {
      return ILLUMINATION_STATE.NIGHT;
    }
  }

  /**
   * Calculate distance to sun at a specific time
   * @param {string} latitudeBand - Latitude band
   * @param {GameDate} gameDate - Date object {year, month, day, hour}
   * @param {number} θ_obs - Observer angular position (default 0°)
   * @returns {number} Distance to sun in miles
   */
  getDistanceToSun(latitudeBand, gameDate, θ_obs = DEFAULT_OBSERVER_ANGLE) {
    const R_obs = this.getObserverRadius(latitudeBand);
    const dayOfYear = getDayOfYear(gameDate.month, gameDate.day);
    const R_sun = getSunOrbitalRadius(dayOfYear);
    const θ_sun = getSunAngle(gameDate.hour, DEFAULT_SUN_PHASE_OFFSET);

    return distanceToSun(R_obs, θ_obs, θ_sun, R_sun);
  }

  /**
   * Find the hour when sun crosses a specific distance threshold
   * Uses binary search to solve for the crossing point
   *
   * @param {string} latitudeBand - Latitude band
   * @param {GameDate} gameDate - Date object
   * @param {number} targetDistance - Distance threshold to find
   * @param {boolean} findRising - True for sunrise, false for sunset
   * @param {number} θ_obs - Observer angular position
   * @returns {number|null} Hour of crossing, or null if never crosses
   */
  findDistanceCrossing(latitudeBand, gameDate, targetDistance, findRising = true, θ_obs = DEFAULT_OBSERVER_ANGLE) {
    const R_obs = this.getObserverRadius(latitudeBand);
    const dayOfYear = getDayOfYear(gameDate.month, gameDate.day);
    const R_sun = getSunOrbitalRadius(dayOfYear);

    // Sample distances throughout the day to find crossings
    const samples = [];
    for (let hour = 0; hour < HOURS_PER_DAY; hour += 0.25) {
      const θ_sun = getSunAngle(hour, DEFAULT_SUN_PHASE_OFFSET);
      const distance = distanceToSun(R_obs, θ_obs, θ_sun, R_sun);
      samples.push({ hour, distance });
    }

    // Find where distance crosses the threshold
    let crossings = [];
    for (let i = 0; i < samples.length - 1; i++) {
      const curr = samples[i];
      const next = samples[i + 1];

      // Check for crossing (distance transitions through target)
      if ((curr.distance > targetDistance && next.distance <= targetDistance) ||
          (curr.distance < targetDistance && next.distance >= targetDistance)) {
        // Binary search for exact crossing point
        const exactHour = this.binarySearchCrossing(
          R_obs, θ_obs, R_sun, targetDistance, curr.hour, next.hour
        );
        crossings.push({
          hour: exactHour,
          entering: curr.distance > targetDistance // true if entering daylight
        });
      }
    }

    if (crossings.length === 0) {
      // Sun never crosses this threshold (always above or always below)
      return null;
    }

    // For sunrise: find first crossing entering daylight
    // For sunset: find last crossing leaving daylight
    if (findRising) {
      const sunrise = crossings.find(c => c.entering);
      return sunrise ? sunrise.hour : null;
    } else {
      const sunset = crossings.reverse().find(c => !c.entering);
      return sunset ? sunset.hour : null;
    }
  }

  /**
   * Binary search to find exact hour when distance equals target
   * @private
   */
  binarySearchCrossing(R_obs, θ_obs, R_sun, targetDistance, hourStart, hourEnd) {
    let low = hourStart;
    let high = hourEnd;
    const tolerance = 0.001; // ~3.6 seconds

    while (high - low > tolerance) {
      const mid = (low + high) / 2;
      const θ_sun = getSunAngle(mid, DEFAULT_SUN_PHASE_OFFSET);
      const distance = distanceToSun(R_obs, θ_obs, θ_sun, R_sun);

      if (Math.abs(distance - targetDistance) < 1) { // Within 1 mile
        return mid;
      }

      // Determine which half contains the crossing
      const θ_low = getSunAngle(low, DEFAULT_SUN_PHASE_OFFSET);
      const d_low = distanceToSun(R_obs, θ_obs, θ_low, R_sun);

      if ((d_low < targetDistance) === (distance < targetDistance)) {
        low = mid;
      } else {
        high = mid;
      }
    }

    return (low + high) / 2;
  }

  /**
   * Get cached daily sun data (sunrise/sunset hours, day length)
   * This is the expensive calculation that only needs to run once per day per location
   * @private
   */
  getDailySunData(latitudeBand, gameDate, θ_obs) {
    // Cache key doesn't include hour - sunrise/sunset is the same all day
    const cacheKey = `${latitudeBand}:${gameDate.year}:${gameDate.month}:${gameDate.day}:${θ_obs}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const R_obs = this.getObserverRadius(latitudeBand);

    // Special case: Disc center (R_obs = 0) is NEVER illuminated
    if (R_obs < 100) {
      const result = {
        sunriseHour: null,
        sunsetHour: null,
        dayLengthHours: 0,
        isPermanentNight: true
      };
      this.cache.set(cacheKey, result);
      return result;
    }

    // Find sunrise and sunset times (when sun crosses illumination radius)
    const sunriseHour = this.findDistanceCrossing(
      latitudeBand, gameDate, SUN_ILLUMINATION_RADIUS, true, θ_obs
    );
    const sunsetHour = this.findDistanceCrossing(
      latitudeBand, gameDate, SUN_ILLUMINATION_RADIUS, false, θ_obs
    );

    // Calculate day length
    let dayLengthHours = 0;
    if (sunriseHour !== null && sunsetHour !== null) {
      if (sunsetHour > sunriseHour) {
        dayLengthHours = sunsetHour - sunriseHour;
      } else {
        // Wraps around midnight
        dayLengthHours = (HOURS_PER_DAY - sunriseHour) + sunsetHour;
      }
    } else if (sunriseHour === null && sunsetHour === null) {
      // Check if always day or always night
      const midnightDistance = this.getDistanceToSun(latitudeBand, { ...gameDate, hour: 0 }, θ_obs);
      dayLengthHours = midnightDistance <= SUN_ILLUMINATION_RADIUS ? 24 : 0;
    }

    const result = {
      sunriseHour,
      sunsetHour,
      dayLengthHours,
      isPermanentNight: false
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Calculate sunrise and sunset hours for a given date
   * @param {string} latitudeBand - Latitude band key
   * @param {GameDate} gameDate - Date object {year, month, day, hour}
   * @param {number} θ_obs - Observer angular position (default 0°)
   * @returns {Object} Sunrise/sunset data
   */
  getSunriseSunset(latitudeBand, gameDate, θ_obs = DEFAULT_OBSERVER_ANGLE) {
    // Get cached daily data (the expensive part)
    const dailyData = this.getDailySunData(latitudeBand, gameDate, θ_obs);

    // Get current state (cheap - just one distance calculation)
    const currentDistance = this.getDistanceToSun(latitudeBand, gameDate, θ_obs);
    const twilightLevel = this.getIlluminationState(currentDistance);
    const isDaytime = twilightLevel === ILLUMINATION_STATE.DAYLIGHT;

    return {
      sunriseHour: dailyData.sunriseHour,
      sunsetHour: dailyData.sunsetHour,
      dayLengthHours: dailyData.dayLengthHours,
      isDaytime,
      twilightLevel,
      isPermanentNight: dailyData.isPermanentNight,
      distanceToSun: currentDistance
    };
  }

  /**
   * Format sunrise/sunset hours as time strings
   * @param {number} hour - Hour as decimal (e.g., 6.5 = 6:30 AM)
   * @param {boolean} use24Hour - Use 24-hour format
   * @returns {string} Formatted time
   */
  formatHour(hour, use24Hour = false) {
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
   * Format day length as "X hr Y min"
   */
  formatDayLength(hours) {
    if (hours === 0) return 'No daylight';
    if (hours >= 24) return '24 hours (Always day)';

    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    return `${wholeHours} hr ${minutes} min`;
  }

  /**
   * Get formatted sunrise/sunset times
   * @param {string} latitudeBand
   * @param {GameDate} gameDate
   * @param {boolean} use24Hour
   * @param {number} θ_obs - Observer angular position
   * @returns {Object} Formatted times
   */
  getFormattedTimes(latitudeBand, gameDate, use24Hour = false, θ_obs = DEFAULT_OBSERVER_ANGLE) {
    const data = this.getSunriseSunset(latitudeBand, gameDate, θ_obs);

    return {
      sunriseTime: data.isPermanentNight ? 'Never' :
                   data.sunriseHour === null ? 'Always' :
                   this.formatHour(data.sunriseHour, use24Hour),
      sunsetTime: data.isPermanentNight ? 'Never' :
                  data.sunsetHour === null ? 'Always' :
                  this.formatHour(data.sunsetHour, use24Hour),
      dayLength: this.formatDayLength(data.dayLengthHours),
      isDaytime: data.isDaytime,
      twilightLevel: data.twilightLevel,
      isPermanentNight: data.isPermanentNight,
      distanceToSun: Math.round(data.distanceToSun)
    };
  }
}

// Export singleton instance
export default new SunriseSunsetService();
