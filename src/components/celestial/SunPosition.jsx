// src/components/celestial/SunPosition.jsx
import React, { useEffect, useState, useRef } from "react";

const SunPosition = ({
  width,
  height,
  sunriseHour,
  sunsetHour,
  sunProgress,
}) => {
  // Animation state
  const [animationState, setAnimationState] = useState({
    isVisible: sunProgress !== null,
    position:
      sunProgress !== null
        ? getPositionFromProgress(sunProgress, width, height)
        : null,
    opacity: 1,
  });

  // Refs for animation control
  const animationRef = useRef(null);
  const prevProgressRef = useRef(sunProgress);
  const targetProgressRef = useRef(sunProgress);

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

  // Effect to handle sunProgress changes
  useEffect(() => {
    // Update target - this ensures the latest target is always used
    targetProgressRef.current = sunProgress;

    // If we have a valid target, start/update the animation
    if (sunProgress !== prevProgressRef.current) {
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
  }, [sunProgress, width, height]);

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

        // Add sunset point (right horizon)
        waypoints.push(1);
        opacities.push(0);
      }

      // Add invisible under point (at the left horizon, ready to rise)
      waypoints.push(0);
      opacities.push(0);

      if (endProgress !== null) {
        // Add sunrise visibility threshold
        waypoints.push(0.01); // Just past horizon
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
        // Sun is rising - start from below horizon
        actualStartProgress = 0; // Left horizon for sunrise
        actualEndProgress = endProgress;
        startOpacity = 0;
      } else if (startProgress !== null && endProgress === null) {
        // Sun is setting - end below horizon
        actualStartProgress = startProgress;
        actualEndProgress = 1; // Right horizon for sunset
        endOpacity = 0;
      } else if (startProgress === null && endProgress === null) {
        // Sun stays below horizon - no animation needed
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
      {/* Sunrise marker */}
      {sunriseHour !== null && (
        <g>
          <line
            x1={hourToHorizonPosition(sunriseHour)}
            y1={height}
            x2={hourToHorizonPosition(sunriseHour)}
            y2={height - 20}
            stroke="#FFD700"
            strokeWidth="2"
            strokeDasharray="2,2"
          />
          <text
            x={hourToHorizonPosition(sunriseHour)}
            y={height - 25}
            textAnchor="middle"
            fill="#FFD700"
            fontSize="10"
          >
            ↑
          </text>
        </g>
      )}

      {/* Sunset marker */}
      {sunsetHour !== null && (
        <g>
          <line
            x1={hourToHorizonPosition(sunsetHour)}
            y1={height}
            x2={hourToHorizonPosition(sunsetHour)}
            y2={height - 20}
            stroke="#FF4500"
            strokeWidth="2"
            strokeDasharray="2,2"
          />
          <text
            x={hourToHorizonPosition(sunsetHour)}
            y={height - 25}
            textAnchor="middle"
            fill="#FF4500"
            fontSize="10"
          >
            ↓
          </text>
        </g>
      )}

      {/* Sun position */}
      {animationState.isVisible && animationState.position && (
        <g style={{ opacity: animationState.opacity }}>
          {/* Sun glow */}
          <circle
            cx={animationState.position.x}
            cy={animationState.position.y}
            r="15"
            fill="rgba(255, 215, 0, 0.3)"
          />
          {/* Sun */}
          <circle
            cx={animationState.position.x}
            cy={animationState.position.y}
            r="10"
            fill="#FFD700"
            stroke="#FFA500"
            strokeWidth="1"
          />
        </g>
      )}
    </>
  );
};

export default SunPosition;
