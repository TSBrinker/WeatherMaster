// src/components/celestial/CelestialBody.jsx - Minimalist fix
import React, { useEffect, useState, useRef } from "react";

const CelestialBody = ({
  width,
  height,
  riseHour,
  setHour,
  progress,
  bodyType, // "sun" or "moon"
  customProps = {},
}) => {
  // State for position and animation
  const [position, setPosition] = useState(
    progress !== null ? getPositionFromProgress(progress, width, height) : null
  );
  const [isVisible, setIsVisible] = useState(progress !== null);
  const [opacity, setOpacity] = useState(1);

  // Refs for animation
  const prevProgressRef = useRef(progress);
  const animationRef = useRef(null);

  // CRITICAL MIDNIGHT OVERRIDE: Keep track of visibility that should override progress
  const forceMoonVisibleRef = useRef(false);

  // Function to map hour of day (0-24) to position on the horizon (0-width)
  const hourToHorizonPosition = (hour) => {
    if (hour === null) return null;
    return (hour / 24) * width;
  };

  // Function to get position from progress
  function getPositionFromProgress(prog, w, h) {
    if (prog === null) return null;

    // Clamp progress to 0-1 range
    const clampedProgress = Math.max(0, Math.min(1, prog));

    // Calculate arc parameters
    const arcCenterX = w / 2;
    const arcCenterY = h;
    const arcRadius = Math.min(w / 2, h) * 0.9;

    // Convert progress to angle in radians (180°->0°)
    const angle = Math.PI * (1 - clampedProgress);

    // Calculate coordinates on arc
    const x = arcCenterX + arcRadius * Math.cos(angle);
    const y = arcCenterY - arcRadius * Math.sin(angle);

    return { x, y };
  }

  // Simple animation function
  const animatePosition = (fromProgress, toProgress, duration = 500) => {
    // Cancel any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Ease function
      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;

      // Interpolate between progress values
      const currentProgress =
        fromProgress + (toProgress - fromProgress) * eased;

      // Calculate position for this progress
      const newPosition = getPositionFromProgress(
        currentProgress,
        width,
        height
      );
      setPosition(newPosition);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // Handle visibility changes with fade animation
  const animateVisibility = (toVisible, duration = 300) => {
    const startTime = Date.now();
    const startOpacity = opacity;
    const targetOpacity = toVisible
      ? bodyType === "moon" && customProps.visibilityFactor
        ? customProps.visibilityFactor
        : 1
      : 0;

    const fade = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Linear fade
      const newOpacity =
        startOpacity + (targetOpacity - startOpacity) * progress;
      setOpacity(newOpacity);

      if (progress < 1) {
        requestAnimationFrame(fade);
      } else {
        setIsVisible(toVisible || forceMoonVisibleRef.current);
      }
    };

    requestAnimationFrame(fade);
  };

  // CRITICAL MIDNIGHT FIX: Check if moon should be visible based on rise/set times
  useEffect(() => {
    if (bodyType === "moon" && customProps.currentHour !== undefined) {
      const isMidnightCrossing =
        riseHour !== null && setHour !== null && riseHour > setHour;

      if (isMidnightCrossing) {
        const currentHour = customProps.currentHour;
        // Check if it should be visible based on rise/set times
        const shouldBeVisible =
          currentHour >= riseHour || currentHour < setHour;

        console.log(
          `Moon midnight check: hour=${currentHour}, rise=${riseHour}, set=${setHour}, visible=${shouldBeVisible}`
        );

        // Force visibility if it should be visible by hours
        if (shouldBeVisible) {
          forceMoonVisibleRef.current = true;

          // If progress is null but should be visible, force visibility
          if (progress === null && !isVisible) {
            console.log("FORCED MOON VISIBILITY");
            setIsVisible(true);

            // Manually calculate a position
            if (currentHour >= riseHour) {
              // After rise, before midnight
              const elapsedHours = currentHour - riseHour;
              const totalVisibleHours = 24 - riseHour + setHour;
              const calculatedProgress = elapsedHours / totalVisibleHours;

              const newPosition = getPositionFromProgress(
                calculatedProgress,
                width,
                height
              );
              setPosition(newPosition);
              setOpacity(customProps.visibilityFactor || 1);
            } else {
              // After midnight, before set
              const elapsedHours = 24 - riseHour + currentHour;
              const totalVisibleHours = 24 - riseHour + setHour;
              const calculatedProgress = elapsedHours / totalVisibleHours;

              const newPosition = getPositionFromProgress(
                calculatedProgress,
                width,
                height
              );
              setPosition(newPosition);
              setOpacity(customProps.visibilityFactor || 1);
            }
          }
        } else {
          forceMoonVisibleRef.current = false;
        }
      }
    }
  }, [customProps.currentHour, riseHour, setHour, progress, bodyType]);

  // Update position when progress changes
  useEffect(() => {
    // For moon that should be forced visible, skip this update if progress is null
    if (
      bodyType === "moon" &&
      forceMoonVisibleRef.current &&
      progress === null
    ) {
      console.log("Skipping null progress update for forced visible moon");
      return;
    }

    console.log(`${bodyType} progress changed:`, {
      prev: prevProgressRef.current,
      current: progress,
    });

    // Handle visibility changes
    if (progress === null && prevProgressRef.current !== null) {
      // Skip becoming invisible if force visible
      if (bodyType === "moon" && forceMoonVisibleRef.current) {
        console.log("Skipping fade out for forced visible moon");
      } else {
        // Becoming invisible
        animateVisibility(false);
      }
    } else if (progress !== null && prevProgressRef.current === null) {
      // Becoming visible
      setIsVisible(true);
      setPosition(getPositionFromProgress(progress, width, height));
      animateVisibility(true);
    } else if (progress !== null && prevProgressRef.current !== null) {
      // Both visible, animate position
      const isLargeJump = Math.abs(progress - prevProgressRef.current) > 0.5;

      if (isLargeJump) {
        // For large jumps, just update position directly
        setPosition(getPositionFromProgress(progress, width, height));
      } else {
        // For small changes, animate smoothly
        animatePosition(prevProgressRef.current, progress);
      }

      // Update opacity if needed (for moon phases)
      if (bodyType === "moon" && customProps.visibilityFactor) {
        setOpacity(customProps.visibilityFactor);
      }
    }

    // Update ref for next comparison
    prevProgressRef.current = progress;

    // Cleanup animation on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [progress, width, height, bodyType, customProps.visibilityFactor]);

  // Colors based on type
  const riseColor = bodyType === "sun" ? "#FFD700" : "#E6E6FA";
  const setColor = bodyType === "sun" ? "#FF4500" : "#C0C0C0";
  const bodyFill = bodyType === "sun" ? "#FFD700" : "#E6E6FA";
  const bodyStroke = bodyType === "sun" ? "#FFA500" : "#C0C0C0";
  const glowFill =
    bodyType === "sun" ? "rgba(255, 215, 0, 0.3)" : "rgba(230, 230, 250, 0.3)";

  return (
    <>
      {/* Rise marker */}
      {riseHour !== null && (
        <g>
          <line
            x1={hourToHorizonPosition(riseHour)}
            y1={height}
            x2={hourToHorizonPosition(riseHour)}
            y2={height - 20}
            stroke={riseColor}
            strokeWidth="2"
            strokeDasharray="2,2"
          />
          <text
            x={hourToHorizonPosition(riseHour)}
            y={height - 25}
            textAnchor="middle"
            fill={riseColor}
            fontSize="10"
          >
            ↑
          </text>
        </g>
      )}

      {/* Set marker */}
      {setHour !== null && (
        <g>
          <line
            x1={hourToHorizonPosition(setHour)}
            y1={height}
            x2={hourToHorizonPosition(setHour)}
            y2={height - 20}
            stroke={setColor}
            strokeWidth="2"
            strokeDasharray="2,2"
          />
          <text
            x={hourToHorizonPosition(setHour)}
            y={height - 25}
            textAnchor="middle"
            fill={setColor}
            fontSize="10"
          >
            ↓
          </text>
        </g>
      )}

      {/* Debug text for midnight crossing cases */}
      {bodyType === "moon" && forceMoonVisibleRef.current && (
        <text
          x={width / 2}
          y={20}
          textAnchor="middle"
          fontSize="10"
          fill="#ff0000"
        >
          Midnight Moon Visible
        </text>
      )}

      {/* Render the celestial body */}
      {isVisible && position && (
        <g style={{ opacity: opacity }}>
          {/* Glow */}
          <circle
            cx={position.x}
            cy={position.y}
            r={bodyType === "sun" ? 15 : 12}
            fill={glowFill}
          />
          {/* Body */}
          <circle
            cx={position.x}
            cy={position.y}
            r={bodyType === "sun" ? 10 : 8}
            fill={bodyFill}
            stroke={bodyStroke}
            strokeWidth="1"
          />
          {/* For moon, add the emoji */}
          {bodyType === "moon" && customProps.icon && (
            <text
              x={position.x}
              y={position.y + 3}
              textAnchor="middle"
              fontSize="10"
              fill="#404040"
            >
              {customProps.icon}
            </text>
          )}
        </g>
      )}
    </>
  );
};

export default CelestialBody;
