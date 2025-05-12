// src/components/celestial/MoonPosition.jsx
import React, { useEffect, useState, useRef } from "react";

const MoonPosition = ({
  width,
  height,
  moonriseHour,
  moonsetHour,
  moonProgress,
  moonPhase,
}) => {
  // Animation state
  const [animationState, setAnimationState] = useState({
    isVisible: moonProgress !== null,
    position:
      moonProgress !== null
        ? getPositionFromProgress(moonProgress, width, height)
        : null,
    opacity: 1,
  });

  // Refs for animation control
  const animationRef = useRef(null);
  const prevProgressRef = useRef(moonProgress);
  const targetProgressRef = useRef(moonProgress);

  // Function to map hour of day (0-24) to position on the horizon (0-width)
  const hourToHorizonPosition = (hour) => {
    if (hour === null) return null;
    return (hour / 24) * width;
  };

  // Function to get position from progress
  function getPositionFromProgress(progress, width, height) {
    if (progress === null) return null;

    // Clamp progress to 0-1 range
    const clampedProgress = Math.max(0, Math.min(1, progress));

    // Calculate arc parameters
    const arcCenterX = width / 2;
    const arcCenterY = height;
    const arcRadius = Math.min(width / 2, height) * 0.9;

    // Convert progress to angle in radians (180°->0°)
    const angle = Math.PI * (1 - clampedProgress);

    // Calculate coordinates on arc
    const x = arcCenterX + arcRadius * Math.cos(angle);
    const y = arcCenterY - arcRadius * Math.sin(angle);

    return { x, y };
  }

  // Effect to handle moonProgress changes
  useEffect(() => {
    // Update target - this ensures the latest target is always used
    targetProgressRef.current = moonProgress;

    // If we have a valid target, start/update the animation
    if (moonProgress !== prevProgressRef.current) {
      startAnimation();
    }

    // Cleanup function
    return () => {
      // Cancel any ongoing animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [moonProgress, width, height]);

  // Start or update animation
  function startAnimation() {
    // Cancel any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const startProgress = prevProgressRef.current;
    const endProgress = targetProgressRef.current;

    // Determine if we need a day cycle animation
    const isLargeTimeJump =
      startProgress !== null &&
      endProgress !== null &&
      (Math.abs(endProgress - startProgress) > 0.5 ||
        (endProgress < startProgress &&
          endProgress < 0.1 &&
          startProgress > 0.9));

    if (isLargeTimeJump) {
      // Create waypoints for full day cycle animation
      let waypoints = [];
      let opacities = [];

      if (startProgress !== null) {
        // Add current position
        waypoints.push(startProgress);
        opacities.push(1);

        // Add setting point
        const setPoint = startProgress > 0.5 ? 1 : 0;
        waypoints.push(setPoint);
        opacities.push(0);
      }

      // Add invisible under point (at the opposite horizon, ready to rise)
      const risePoint = startProgress === null || startProgress > 0.5 ? 0 : 1;
      waypoints.push(risePoint);
      opacities.push(0);

      if (endProgress !== null) {
        // Add rise visibility threshold
        const riseVisibilityPoint = risePoint === 0 ? 0.01 : 0.99;
        waypoints.push(riseVisibilityPoint); // Just past horizon
        opacities.push(0.5);

        // Add final position
        waypoints.push(endProgress);
        opacities.push(1);
      }

      // Animation durations - faster for invisible segments
      const totalDuration = 1600;
      const segmentDurations = waypoints
        .map((_, i) => {
          if (i === 0) return 0; // No duration for first point
          // Faster for below-horizon segments
          const isVisibleSegment = opacities[i - 1] > 0 || opacities[i] > 0;
          return isVisibleSegment ? totalDuration / 3 : totalDuration / 6;
        })
        .slice(1); // Remove first element which is meaningless

      // Start multi-segment animation
      animateWaypoints(waypoints, opacities, segmentDurations, 0);
    } else {
      // Simple animation for smaller time jumps
      let actualStartProgress, actualEndProgress;
      let startOpacity = 1,
        endOpacity = 1;

      if (startProgress === null && endProgress !== null) {
        // Moon is rising
        // Determine which horizon to rise from based on position
        actualStartProgress = endProgress < 0.5 ? 0 : 1;
        actualEndProgress = endProgress;
        startOpacity = 0;
      } else if (startProgress !== null && endProgress === null) {
        // Moon is setting
        actualStartProgress = startProgress;
        // Determine which horizon to set at based on position
        actualEndProgress = startProgress < 0.5 ? 0 : 1;
        endOpacity = 0;
      } else if (startProgress === null && endProgress === null) {
        // Moon stays below horizon - no animation needed
        prevProgressRef.current = endProgress;
        return;
      } else {
        // Normal case - both positions visible
        actualStartProgress = startProgress;
        actualEndProgress = endProgress;
      }

      // Standard animation
      const duration = 800; // milliseconds
      animateSegment(
        actualStartProgress,
        actualEndProgress,
        startOpacity,
        endOpacity,
        duration
      );
    }

    // When animation completes, update prevProgress
    prevProgressRef.current = endProgress;
  }

  // Function to animate a single segment from start to end
  function animateSegment(
    fromProgress,
    toProgress,
    fromOpacity,
    toOpacity,
    duration
  ) {
    const startTime = Date.now();

    const updateFrame = () => {
      // Check if the target has changed
      if (targetProgressRef.current !== prevProgressRef.current) {
        // Target changed - restart animation with new target
        startAnimation();
        return;
      }

      const elapsed = Date.now() - startTime;
      const timeProgress = Math.min(1, elapsed / duration);

      // Use easeInOutQuad easing function
      const easedProgress =
        timeProgress < 0.5
          ? 2 * timeProgress * timeProgress
          : -1 + (4 - 2 * timeProgress) * timeProgress;

      // Calculate current progress position along the arc
      const currentArcProgress =
        fromProgress + (toProgress - fromProgress) * easedProgress;

      // Get actual position on arc from progress
      const position = getPositionFromProgress(
        currentArcProgress,
        width,
        height
      );

      // Calculate opacity
      const opacity = fromOpacity + (toOpacity - fromOpacity) * easedProgress;

      // Update animation state
      setAnimationState({
        isVisible: opacity > 0.01, // Only show if somewhat visible
        position: position,
        opacity: opacity,
      });

      // Continue animation or finish
      if (timeProgress < 1) {
        // Request next frame
        animationRef.current = requestAnimationFrame(updateFrame);
      } else {
        // Segment complete
        animationRef.current = null;

        // Set final state
        const finalPos = getPositionFromProgress(toProgress, width, height);
        setAnimationState({
          isVisible: toOpacity > 0.01,
          position: finalPos,
          opacity: toOpacity,
        });
      }
    };

    // Start animation
    animationRef.current = requestAnimationFrame(updateFrame);
  }

  // Function to animate through multiple waypoints
  function animateWaypoints(points, opacities, durations, currentIndex) {
    if (currentIndex >= points.length - 1) {
      // All segments complete
      animationRef.current = null;
      return;
    }

    const fromProgress = points[currentIndex];
    const toProgress = points[currentIndex + 1];
    const fromOpacity = opacities[currentIndex];
    const toOpacity = opacities[currentIndex + 1];
    const duration = durations[currentIndex];

    const startTime = Date.now();

    const updateFrame = () => {
      // Check if the target has changed
      if (targetProgressRef.current !== prevProgressRef.current) {
        // Target changed - restart animation with new target
        startAnimation();
        return;
      }

      const elapsed = Date.now() - startTime;
      const timeProgress = Math.min(1, elapsed / duration);

      // Use easeInOutQuad easing function
      const easedProgress =
        timeProgress < 0.5
          ? 2 * timeProgress * timeProgress
          : -1 + (4 - 2 * timeProgress) * timeProgress;

      // Calculate current progress position along the arc
      const currentArcProgress =
        fromProgress + (toProgress - fromProgress) * easedProgress;

      // Get actual position on arc from progress
      const position = getPositionFromProgress(
        currentArcProgress,
        width,
        height
      );

      // Calculate opacity
      const opacity = fromOpacity + (toOpacity - fromOpacity) * easedProgress;

      // Update animation state
      setAnimationState({
        isVisible: opacity > 0.01, // Only show if somewhat visible
        position: position,
        opacity: opacity,
      });

      // Continue animation or move to next segment
      if (timeProgress < 1) {
        // Request next frame
        animationRef.current = requestAnimationFrame(updateFrame);
      } else {
        // Segment complete - move to next
        animateWaypoints(points, opacities, durations, currentIndex + 1);
      }
    };

    // Start animation
    animationRef.current = requestAnimationFrame(updateFrame);
  }

  return (
    <>
      {/* Moonrise marker */}
      {moonriseHour !== null && (
        <g>
          <line
            x1={hourToHorizonPosition(moonriseHour)}
            y1={height}
            x2={hourToHorizonPosition(moonriseHour)}
            y2={height - 20}
            stroke="#E6E6FA"
            strokeWidth="2"
            strokeDasharray="2,2"
          />
          <text
            x={hourToHorizonPosition(moonriseHour)}
            y={height - 25}
            textAnchor="middle"
            fill="#E6E6FA"
            fontSize="10"
          >
            ↑
          </text>
        </g>
      )}

      {/* Moonset marker */}
      {moonsetHour !== null && (
        <g>
          <line
            x1={hourToHorizonPosition(moonsetHour)}
            y1={height}
            x2={hourToHorizonPosition(moonsetHour)}
            y2={height - 20}
            stroke="#C0C0C0"
            strokeWidth="2"
            strokeDasharray="2,2"
          />
          <text
            x={hourToHorizonPosition(moonsetHour)}
            y={height - 25}
            textAnchor="middle"
            fill="#C0C0C0"
            fontSize="10"
          >
            ↓
          </text>
        </g>
      )}

      {/* Moon position */}
      {animationState.isVisible && animationState.position && moonPhase && (
        <g style={{ opacity: animationState.opacity }}>
          {/* Moon circle */}
          <circle
            cx={animationState.position.x}
            cy={animationState.position.y}
            r="8"
            fill="#E6E6FA"
            stroke="#C0C0C0"
            strokeWidth="1"
          />
          {/* Moon phase icon */}
          <text
            x={animationState.position.x}
            y={animationState.position.y + 3}
            textAnchor="middle"
            fontSize="10"
            fill="#C0C0C0"
          >
            {moonPhase.icon}
          </text>
        </g>
      )}
    </>
  );
};

export default MoonPosition;
