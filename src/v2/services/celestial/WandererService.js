/**
 * WandererService
 * Handles rare falling star/meteorite events ("Wanderers")
 *
 * Wanderers are made of valuable magical material and are significant campaign events.
 * Events are deterministic based on region + date seed.
 */

import { generateSeed, SeededRandom } from '../../utils/seedGenerator';
import { advanceDate, compareDates } from '../../utils/dateUtils';
import {
  WANDERER_CONFIG,
  WANDERER_TERRAINS,
  WANDERER_SIZE_DETAILS,
  WANDERER_HOOKS,
  COMPASS_DIRECTIONS,
  WANDERER_IMPACT_EFFECTS
} from '../../models/constants';

class WandererService {
  constructor() {
    this.eventCache = new Map();
  }

  /**
   * Get wanderer event for a specific region and date
   * @param {Object} region - Region with id
   * @param {Object} date - Game date {year, month, day, hour}
   * @param {Object} weather - Optional weather data for visibility check
   * @returns {Object} Wanderer event object
   */
  getWandererEvent(region, date, weather = null) {
    const cacheKey = `${region.id}:${date.year}:${date.month}:${date.day}`;

    if (this.eventCache.has(cacheKey)) {
      return this.eventCache.get(cacheKey);
    }

    const event = this.calculateWandererEvent(region, date, weather);
    this.eventCache.set(cacheKey, event);
    return event;
  }

  /**
   * Find the next local fall event scanning forward from a date
   * @param {Object} region - Region with id
   * @param {Object} fromDate - Starting date
   * @param {number} daysToScan - How many days to scan ahead
   * @returns {Object|null} Date of next local fall, or null if none found
   */
  findNextLocalFall(region, fromDate, daysToScan = WANDERER_CONFIG.GATE_SCAN_DAYS) {
    let currentDate = { ...fromDate, hour: 0 };

    for (let i = 0; i < daysToScan; i++) {
      // Advance to next day (skip current day on first iteration)
      if (i > 0) {
        currentDate = advanceDate(currentDate, 24);
      }

      const event = this.getWandererEvent(region, currentDate);
      if (event.eventType === 'local_fall') {
        return {
          year: currentDate.year,
          month: currentDate.month,
          day: currentDate.day,
          hour: event.hourOfEvent
        };
      }
    }

    return null;
  }

  /**
   * Find the previous local fall event scanning backward from a date
   * @param {Object} region - Region with id
   * @param {Object} fromDate - Starting date
   * @param {number} daysToScan - How many days to scan back
   * @returns {Object|null} Date of previous local fall, or null if none found
   */
  findPrevLocalFall(region, fromDate, daysToScan = WANDERER_CONFIG.GATE_SCAN_DAYS) {
    let currentDate = { ...fromDate, hour: 0 };

    for (let i = 0; i < daysToScan; i++) {
      // Go back to previous day (skip current day on first iteration)
      if (i > 0) {
        currentDate = advanceDate(currentDate, -24);
      }

      const event = this.getWandererEvent(region, currentDate);
      if (event.eventType === 'local_fall') {
        return {
          year: currentDate.year,
          month: currentDate.month,
          day: currentDate.day,
          hour: event.hourOfEvent
        };
      }
    }

    return null;
  }

  /**
   * Check if traveling from one date to another would cross a gate
   * @param {Object} fromDate - Starting date
   * @param {Object} toDate - Destination date
   * @param {Object} gate - Gate date {year, month, day, hour}
   * @returns {boolean} True if the gate would be crossed
   */
  crossesGate(fromDate, toDate, gate) {
    if (!gate) return false;

    const fromCompare = compareDates(fromDate, gate);
    const toCompare = compareDates(toDate, gate);

    // Moving forward: gate is after from and at or before to
    if (compareDates(fromDate, toDate) < 0) {
      return fromCompare < 0 && toCompare >= 0;
    }
    // Moving backward: gate is before from and at or after to
    else if (compareDates(fromDate, toDate) > 0) {
      return fromCompare > 0 && toCompare <= 0;
    }

    return false;
  }

  /**
   * Core calculation - deterministic based on seed
   * @private
   */
  calculateWandererEvent(region, date, weather) {
    // Use 'wanderer' context for unique random stream
    const seed = generateSeed(region.id, date, 'wanderer');
    const rng = new SeededRandom(seed);

    // Roll for streak occurrence
    const streakRoll = rng.next();
    if (streakRoll > WANDERER_CONFIG.DAILY_STREAK_CHANCE) {
      return this.createNoEventResult();
    }

    // Streak occurred! Determine timing
    const hourOfEvent = this.determineEventHour(rng);
    const timeDescription = this.getTimeDescription(hourOfEvent);

    // Check if it was a local fall (much rarer)
    const localFallRoll = rng.next();
    const isLocalFall = localFallRoll < WANDERER_CONFIG.LOCAL_FALL_RATIO;

    // Check visibility based on weather and time
    const visibility = this.checkVisibility(hourOfEvent, weather);

    if (isLocalFall) {
      return this.createLocalFallEvent(rng, hourOfEvent, timeDescription, visibility);
    } else {
      return this.createStreakEvent(hourOfEvent, timeDescription, visibility);
    }
  }

  /**
   * Determine what hour the event occurs (weighted toward night)
   * @private
   */
  determineEventHour(rng) {
    const peakHours = [21, 22, 23, 0, 1, 2, 3, 4];
    if (rng.next() < 0.7) {
      // 70% chance during peak hours
      return rng.choice(peakHours);
    }
    // 30% chance any hour
    return rng.int(0, 23);
  }

  /**
   * Get human-readable time description
   * @private
   */
  getTimeDescription(hour) {
    if (hour >= 5 && hour < 7) return 'Dawn';
    if (hour >= 7 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 14) return 'Midday';
    if (hour >= 14 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 20) return 'Evening';
    if (hour >= 20 && hour < 23) return 'Late evening';
    return 'Pre-dawn hours';
  }

  /**
   * Check if the event was visible given conditions
   * @private
   */
  checkVisibility(hourOfEvent, weather) {
    const result = { wasObservable: true, visibilityBlocker: null };

    // Daylight blocks visibility (roughly 7am-7pm)
    if (hourOfEvent >= 7 && hourOfEvent <= 19) {
      result.wasObservable = false;
      result.visibilityBlocker = 'Daylight obscured the event';
      return result;
    }

    // Check cloud cover if weather data available
    if (weather && weather.cloudCover > WANDERER_CONFIG.CLOUD_COVER_VISIBILITY_THRESHOLD) {
      result.wasObservable = false;
      result.visibilityBlocker = 'Heavy cloud cover blocked the view';
      return result;
    }

    // Check for precipitation
    if (weather && weather.precipitationType && weather.precipitationType !== 'none') {
      result.wasObservable = false;
      result.visibilityBlocker = `${weather.precipitationType} obscured the sky`;
      return result;
    }

    return result;
  }

  /**
   * Create a "no event" result object
   * @private
   */
  createNoEventResult() {
    return {
      occurred: false,
      eventType: null,
      hourOfEvent: null,
      timeDescription: null,
      wasObservable: false,
      visibilityBlocker: null,
      crash: null,
      displaySummary: null,
      dmNotes: null
    };
  }

  /**
   * Create a streak (visible only) event
   * @private
   */
  createStreakEvent(hourOfEvent, timeDescription, visibility) {
    const visNote = visibility.wasObservable
      ? 'Observers could see it streak across the sky'
      : `Event occurred but ${visibility.visibilityBlocker.toLowerCase()}`;

    return {
      occurred: true,
      eventType: 'streak',
      hourOfEvent,
      timeDescription,
      wasObservable: visibility.wasObservable,
      visibilityBlocker: visibility.visibilityBlocker,
      crash: null,
      displaySummary: visibility.wasObservable
        ? `A Wanderer streaked across the sky (${timeDescription.toLowerCase()})`
        : `A Wanderer passed overhead unseen (${visibility.visibilityBlocker.toLowerCase()})`,
      dmNotes: `During the ${timeDescription.toLowerCase()}, a Wanderer streaked across the heavens. ${visNote}.`
    };
  }

  /**
   * Create a local fall event with crash details
   * @private
   */
  createLocalFallEvent(rng, hourOfEvent, timeDescription, visibility) {
    // Determine crash details - use float for full range then format appropriately
    const distanceRaw = WANDERER_CONFIG.FALL_DISTANCE_MIN +
      rng.next() * (WANDERER_CONFIG.FALL_DISTANCE_MAX - WANDERER_CONFIG.FALL_DISTANCE_MIN);
    // Round to reasonable precision: 2 decimals under 1 mile, integers above
    const distance = distanceRaw < 1 ? Math.round(distanceRaw * 100) / 100 : Math.round(distanceRaw);
    const direction = rng.choice(COMPASS_DIRECTIONS);

    // Determine size (rarer = bigger)
    const sizeRoll = rng.next();
    let size;
    if (sizeRoll < WANDERER_CONFIG.SIZE_THRESHOLDS.small) size = 'small';
    else if (sizeRoll < WANDERER_CONFIG.SIZE_THRESHOLDS.medium) size = 'medium';
    else if (sizeRoll < WANDERER_CONFIG.SIZE_THRESHOLDS.large) size = 'large';
    else size = 'massive';

    const sizeInfo = WANDERER_SIZE_DETAILS[size];

    // Generate detailed information
    const terrain = rng.choice(WANDERER_TERRAINS);
    const hooks = this.selectHooks(rng, size);
    const complications = this.generateComplications(rng, terrain, size);

    // Generate impact effects based on size and distance
    const impactEffects = this.generateImpactEffects(size, distance, terrain);

    const crash = {
      distance,
      direction,
      size,
      impactEffects,
      details: {
        terrain,
        estimatedValue: sizeInfo.valueDesc,
        typicalWeight: sizeInfo.typicalWeight,
        interestLevel: sizeInfo.interestLevel,
        hooks,
        complications
      }
    };

    // Format distance for display (feet if under 1 mile)
    const distanceDisplay = distance < 1
      ? `~${Math.round(distance * 5280)} feet`
      : `~${distance} mile${distance !== 1 ? 's' : ''}`;
    const distanceNotes = distance < 1
      ? `approximately ${Math.round(distance * 5280)} feet`
      : `approximately ${distance} mile${distance !== 1 ? 's' : ''}`;

    return {
      occurred: true,
      eventType: 'local_fall',
      hourOfEvent,
      timeDescription,
      wasObservable: visibility.wasObservable,
      visibilityBlocker: visibility.visibilityBlocker,
      crash,
      displaySummary: `A Wanderer fell ${distanceDisplay} ${direction}!`,
      dmNotes: `During the ${timeDescription.toLowerCase()}, a Wanderer impacted ${distanceNotes} to the ${direction}. Size assessment: ${sizeInfo.name} (${sizeInfo.typicalWeight}). The impact site appears to be in ${terrain.toLowerCase()}. ${sizeInfo.interestLevel}.`
    };
  }

  /**
   * Select adventure hooks based on size
   * @private
   */
  selectHooks(rng, size) {
    // More hooks for larger falls
    const hookCount = size === 'massive' ? 3 : size === 'large' ? 2 : 1;
    const selectedHooks = [];
    const availableHooks = [...WANDERER_HOOKS];

    for (let i = 0; i < hookCount && availableHooks.length > 0; i++) {
      const index = rng.int(0, availableHooks.length - 1);
      selectedHooks.push(availableHooks.splice(index, 1)[0]);
    }

    return selectedHooks;
  }

  /**
   * Generate terrain/size-based complications
   * @private
   */
  generateComplications(rng, terrain, size) {
    const complications = [];

    // Terrain-based complications
    if (terrain.includes('forest')) {
      complications.push('Dense vegetation makes the exact location hard to pinpoint');
    }
    if (terrain.includes('Marsh') || terrain.includes('wetlands')) {
      complications.push('The boggy ground may have swallowed part of the material');
    }
    if (terrain.includes('Mountain') || terrain.includes('hills')) {
      complications.push('Treacherous terrain makes approach dangerous');
    }
    if (terrain.includes('tundra')) {
      complications.push('Extreme cold complicates the expedition');
    }

    // Size-based complications
    if (size === 'massive' || size === 'large') {
      complications.push('The impact created a small crater that may be flooding');
      if (rng.next() < 0.3) {
        complications.push('Reports of strange magical emanations from the site');
      }
    }

    return complications;
  }

  /**
   * Get the distance band for a given distance
   * @private
   */
  getDistanceBand(distance) {
    const { DISTANCE_BANDS } = WANDERER_IMPACT_EFFECTS;
    if (distance < DISTANCE_BANDS.close) return 'close';
    if (distance < DISTANCE_BANDS.near) return 'near';
    return 'far';
  }

  /**
   * Generate compositional impact effects based on size and distance
   * @param {string} size - Size category (small, medium, large, massive)
   * @param {number} distance - Distance in miles
   * @param {string} terrain - Terrain type where it landed
   * @returns {Object} Impact effects with narrative and optional mechanics
   */
  generateImpactEffects(size, distance, terrain) {
    const band = this.getDistanceBand(distance);
    const { SOUND, VISUAL, PHYSICAL, MECHANICS } = WANDERER_IMPACT_EFFECTS;

    const sound = SOUND[size][band];
    const visual = VISUAL[size][band];
    const physical = PHYSICAL[size][band];
    const mechanics = MECHANICS[size][band];

    // Build the narrative from components
    const narrativeParts = [];
    if (visual) narrativeParts.push(visual);
    if (sound) narrativeParts.push(sound);
    if (physical) narrativeParts.push(physical);

    const narrative = narrativeParts.join(' ');

    // Determine severity level for UI styling
    let severity = 'minor';
    if (size === 'massive' || (size === 'large' && band === 'close')) {
      severity = 'catastrophic';
    } else if (size === 'large' || (size === 'medium' && band === 'close')) {
      severity = 'major';
    } else if (size === 'medium' || band === 'close') {
      severity = 'notable';
    }

    return {
      band,
      severity,
      narrative,
      sound,
      visual,
      physical,
      mechanics,
      summary: this.getEffectSummary(size, band)
    };
  }

  /**
   * Get a short summary of what the party experiences
   * @private
   */
  getEffectSummary(size, band) {
    const summaries = {
      small: {
        close: 'Startling impact nearby',
        near: 'Distant boom heard',
        far: 'Faint rumble noticed'
      },
      medium: {
        close: 'Powerful impact, ground shakes',
        near: 'Clear boom, ground trembles',
        far: 'Distant boom heard'
      },
      large: {
        close: 'Devastating shockwave',
        near: 'Major impact felt',
        far: 'Significant event on horizon'
      },
      massive: {
        close: 'Catastrophic impact zone',
        near: 'Terrifying impact nearby',
        far: 'Massive event witnessed'
      }
    };
    return summaries[size][band];
  }

  /**
   * Clear the event cache
   */
  clearCache() {
    this.eventCache.clear();
  }

  /**
   * Run a year simulation for testing/statistics
   * @param {Object} region - Region to test
   * @param {number} year - Year to simulate
   * @returns {Object} Statistics about wanderer events
   */
  getYearlyStats(region, year) {
    const stats = {
      totalStreaks: 0,
      totalLocalFalls: 0,
      observableStreaks: 0,
      sizeDistribution: { small: 0, medium: 0, large: 0, massive: 0 },
      events: []
    };

    // Simulate each day of the year
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
      for (let day = 1; day <= daysInMonth; day++) {
        const date = { year, month, day, hour: 12 };
        const event = this.getWandererEvent(region, date);

        if (event.occurred) {
          if (event.eventType === 'streak') {
            stats.totalStreaks++;
            if (event.wasObservable) stats.observableStreaks++;
          } else if (event.eventType === 'local_fall') {
            stats.totalLocalFalls++;
            stats.sizeDistribution[event.crash.size]++;
            stats.events.push({
              date: `${month}/${day}`,
              size: event.crash.size,
              distance: event.crash.distance,
              direction: event.crash.direction
            });
          }
        }
      }
    }

    return stats;
  }
}

// Export singleton instance
export default new WandererService();
