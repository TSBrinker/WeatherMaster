import { useState, useEffect, useRef } from 'react';

/**
 * Animation phases for celestial bodies during time transitions
 */
export const ANIMATION_PHASE = {
  IDLE: 'idle',
  CIRCUIT_EXIT: 'circuit-exit',
  CIRCUIT_ENTER: 'circuit-enter',
};

/**
 * Animation timing constants (in ms)
 */
const ANIMATION_TIMING = {
  EXIT_DURATION: 300,
  ENTER_DURATION: 300,
  POSITION_TRANSITION: 500,
};

/**
 * Maximum days to animate circuit - beyond this, skip animation
 */
const MAX_DAYS_FOR_CIRCUIT = 30;

/**
 * Compare two dates and return the day difference
 * @param {Object} date1 - { year, month, day, hour }
 * @param {Object} date2 - { year, month, day, hour }
 * @returns {number} Approximate day difference (positive if date2 > date1)
 */
function getDayDifference(date1, date2) {
  if (!date1 || !date2) return 0;

  // Rough calculation: 365 days per year, 30 days per month
  const days1 = date1.year * 365 + date1.month * 30 + date1.day;
  const days2 = date2.year * 365 + date2.month * 30 + date2.day;
  return days2 - days1;
}

/**
 * Check if two dates are on different days
 */
function isDifferentDay(date1, date2) {
  if (!date1 || !date2) return false;
  return date1.year !== date2.year ||
         date1.month !== date2.month ||
         date1.day !== date2.day;
}

/**
 * Hook for managing celestial animation state during time transitions
 *
 * @param {Object} currentDate - Current game date { year, month, day, hour }
 * @param {Object} previousDate - Previous game date (before time change)
 * @returns {Object} Animation state and controls
 */
export function useCelestialAnimation(currentDate, previousDate) {
  const [animationPhase, setAnimationPhase] = useState(ANIMATION_PHASE.IDLE);
  const [exitDirection, setExitDirection] = useState('right'); // 'left' or 'right'
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clean up any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // No previous date means first render - no animation
    if (!previousDate || !currentDate) {
      setAnimationPhase(ANIMATION_PHASE.IDLE);
      return;
    }

    // Check if we crossed a day boundary
    if (isDifferentDay(previousDate, currentDate)) {
      const dayDiff = getDayDifference(previousDate, currentDate);

      // Skip animation for large jumps
      if (Math.abs(dayDiff) > MAX_DAYS_FOR_CIRCUIT) {
        setAnimationPhase(ANIMATION_PHASE.IDLE);
        return;
      }

      // Determine exit direction based on time direction
      const isForward = dayDiff > 0;
      setExitDirection(isForward ? 'right' : 'left');

      // Start circuit animation
      setAnimationPhase(ANIMATION_PHASE.CIRCUIT_EXIT);

      // After exit animation, start enter animation
      timeoutRef.current = setTimeout(() => {
        setAnimationPhase(ANIMATION_PHASE.CIRCUIT_ENTER);

        // After enter animation, return to idle
        timeoutRef.current = setTimeout(() => {
          setAnimationPhase(ANIMATION_PHASE.IDLE);
        }, ANIMATION_TIMING.ENTER_DURATION);
      }, ANIMATION_TIMING.EXIT_DURATION);
    } else {
      // Same day, just position transition (handled by CSS)
      setAnimationPhase(ANIMATION_PHASE.IDLE);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentDate, previousDate]);

  return {
    animationPhase,
    exitDirection,
    isAnimating: animationPhase !== ANIMATION_PHASE.IDLE,
    timings: ANIMATION_TIMING,
  };
}

export default useCelestialAnimation;
