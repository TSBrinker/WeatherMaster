// src/components/celestial/MoonPosition.jsx - SVG path animation approach
import React, { useEffect, useState, useRef } from "react";

const MoonPosition = ({
  width,
  height,
  moonriseHour,
  moonsetHour,
  moonProgress,
  moonPhase,
}) => {
  // State for moon visibility
  const [isVisible, setIsVisible] = useState(moonProgress !== null);

  // Refs for tracking values
  const moonPathRef = useRef(null);
  const prevProgressRef = useRef(moonProgress);
  const animationIdRef = useRef(null);

  // Function to map hour of day (0-24) to position on the horizon (0-width)
  const hourToHorizonPosition = (hour) => {
    if (hour === null) return null;
    return (hour / 24) * width;
  };

  // Function to create SVG arc path for the moon
  const createMoonPath = () => {
    // Create an arc path from left to right horizon
    const arcCenterX = width / 2;
    const arcCenterY = height;
    const arcRadius = Math.min(width / 2, height) * 0.9;

    // Create an SVG arc path
    return `M ${
      arcCenterX - arcRadius
    } ${arcCenterY} A ${arcRadius} ${arcRadius} 0 1 0 ${
      arcCenterX + arcRadius
    } ${arcCenterY}`;
  };

  // Update the path when dimensions change
  useEffect(() => {
    moonPathRef.current = createMoonPath();
  }, [width, height]);

  // Custom animation function that follows the arc
  const animateAlongArc = (fromProgress, toProgress, duration = 500) => {
    // Cancel any ongoing animation
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }

    const startTime = Date.now();
    let progress = 0;

    const animate = () => {
      const currentTime = Date.now();
      progress = Math.min(1, (currentTime - startTime) / duration);

      // Use easeInOutQuad easing
      const easedProgress =
        progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;

      // Calculate current position along the arc
      const currentPoint =
        fromProgress + (toProgress - fromProgress) * easedProgress;
      updateMoonPosition(currentPoint);

      if (progress < 1) {
        animationIdRef.current = requestAnimationFrame(animate);
      } else {
        animationIdRef.current = null;
      }
    };

    animationIdRef.current = requestAnimationFrame(animate);
  };

  // Function to update moon position based on progress
  const updateMoonPosition = (progressValue) => {
    if (!moonPathRef.current) return;

    // Handle visibility
    if (progressValue === null) {
      setIsVisible(false);
      return;
    }

    // Clamp progress to 0-1 range
    const clampedProgress = Math.max(0, Math.min(1, progressValue));

    // Get coordinate along the arc
    const arcCenterX = width / 2;
    const arcCenterY = height;
    const arcRadius = Math.min(width / 2, height) * 0.9;

    // Convert progress to angle in radians (180°->0°)
    const angle = Math.PI * (1 - clampedProgress);

    // Calculate coordinates on arc
    const x = arcCenterX + arcRadius * Math.cos(angle);
    const y = arcCenterY - arcRadius * Math.sin(angle);

    // Find the moon element and update its position
    const moonElement = document.getElementById("moon-element");
    if (moonElement) {
      moonElement.setAttribute("transform", `translate(${x}, ${y})`);

      // Update opacity based on phase
      const baseOpacity = moonPhase?.visibilityFactor || 1;
      moonElement.style.opacity = baseOpacity;
    }

    setIsVisible(true);
  };

  // Handle moonProgress changes
  useEffect(() => {
    // Handle initial case
    if (prevProgressRef.current === undefined) {
      updateMoonPosition(moonProgress);
      prevProgressRef.current = moonProgress;
      return;
    }

    // Handle visibility changes
    if (moonProgress === null && prevProgressRef.current !== null) {
      setIsVisible(false);
    } else if (moonProgress !== null && prevProgressRef.current === null) {
      // Immediately position and fade in
      updateMoonPosition(moonProgress);
      setIsVisible(true);
    } else if (moonProgress !== null && prevProgressRef.current !== null) {
      // Both values valid - animate the transition
      const isLargeJump =
        Math.abs(moonProgress - prevProgressRef.current) > 0.4;

      if (isLargeJump) {
        // For large jumps, directly update position
        updateMoonPosition(moonProgress);
      } else {
        // For small changes, animate along the arc
        animateAlongArc(prevProgressRef.current, moonProgress);
      }
    }

    // Update the ref
    prevProgressRef.current = moonProgress;

    // Cleanup function
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [moonProgress, moonPhase]);

  // Fix for midnight disappearance: force update of visibility when currentDate changes
  useEffect(() => {
    // Make sure moon stays visible if it should be
    if (moonProgress !== null && !isVisible) {
      setIsVisible(true);
      updateMoonPosition(moonProgress);
    }
  }, [moonProgress, isVisible]);

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

      {/* Moon with direct DOM manipulation for smoother arc following */}
      {isVisible && moonPhase && (
        <g
          id="moon-element"
          style={{ opacity: 0, transition: "opacity 0.3s ease-in-out" }}
        >
          {/* Moon circle */}
          <circle
            cx={0}
            cy={0}
            r="8"
            fill="#E6E6FA"
            stroke="#C0C0C0"
            strokeWidth="1"
          />
          {/* Moon phase icon */}
          <text x={0} y={3} textAnchor="middle" fontSize="10" fill="#C0C0C0">
            {moonPhase.icon}
          </text>
        </g>
      )}

      {/* Debug: Visualize the path (remove in production) */}
      {/* <path d={createMoonPath()} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" /> */}
    </>
  );
};

export default MoonPosition;
