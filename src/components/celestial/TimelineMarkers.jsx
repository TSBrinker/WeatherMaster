// src/components/celestial/TimelineMarkers.jsx
import React, { useEffect, useState } from "react";
import { useSpring, animated } from "react-spring";

const TimelineMarkers = ({ width, height, currentHour }) => {
  // Track previous hour for animations
  const [prevHour, setPrevHour] = useState(currentHour);

  // Function to map hour of day (0-24) to position on the horizon (0-width)
  const hourToHorizonPosition = (hour) => {
    if (hour === null) return null;
    return (hour / 24) * width;
  };

  // Update prevHour when currentHour changes
  useEffect(() => {
    if (currentHour !== null) {
      setPrevHour(currentHour);
    }
  }, [currentHour]);

  // Animated values for current time marker
  const timeMarkerAnimation = useSpring({
    to: {
      x: hourToHorizonPosition(currentHour),
    },
    from: {
      x: hourToHorizonPosition(prevHour),
    },
    config: {
      tension: 170, // Higher tension = faster movement
      friction: 26, // Higher friction = less oscillation
      mass: 1, // Lower mass = less inertia
    },
  });

  // Hour markers to display
  const hourMarkers = [0, 6, 12, 18, 24];

  return (
    <>
      {/* Time markers along horizon */}
      {hourMarkers.map((hour) => (
        <g key={hour}>
          <line
            x1={hourToHorizonPosition(hour)}
            y1={height}
            x2={hourToHorizonPosition(hour)}
            y2={height - 10}
            stroke="#4b5563"
            strokeWidth="1"
          />
          <text
            x={hourToHorizonPosition(hour)}
            y={height - 15}
            textAnchor="middle"
            fill="white"
            fontSize="10"
          >
            {hour === 0
              ? "12 AM"
              : hour === 12
              ? "12 PM"
              : hour > 12
              ? `${hour - 12} PM`
              : `${hour} AM`}
          </text>
        </g>
      ))}

      {/* Current time marker - animated */}
      <animated.line
        x1={timeMarkerAnimation.x}
        y1={height}
        x2={timeMarkerAnimation.x}
        y2={height - 15}
        stroke="#FFFFFF"
        strokeWidth="2"
      />
      <animated.circle
        cx={timeMarkerAnimation.x}
        cy={height - 15}
        r="4"
        fill="#FFFFFF"
      />
    </>
  );
};

export default TimelineMarkers;
