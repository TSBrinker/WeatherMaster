// src/components/weather/celestialComponents/SkyBackground.jsx
import React from "react";

const SkyBackground = ({ width, height, hourOfDay }) => {
  // Arc radius calculation
  const arcRadius = Math.min(width / 2, height) * 0.9; // 90% of available space

  // Determine which gradient to use based on time of day
  const getSkyGradient = () => {
    if (hourOfDay >= 5 && hourOfDay < 8) {
      return "url(#dawnSky)"; // Dawn
    } else if (hourOfDay >= 8 && hourOfDay < 17) {
      return "url(#daySky)"; // Day
    } else if (hourOfDay >= 17 && hourOfDay < 20) {
      return "url(#sunsetSky)"; // Sunset/Dusk
    } else {
      return "url(#nightSky)"; // Night
    }
  };

  return (
    <>
      {/* Sky gradients definitions */}
      <defs>
        <linearGradient id="dawnSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF7E45" />
          <stop offset="100%" stopColor="#FFB347" />
        </linearGradient>
        <linearGradient id="daySky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#87CEEB" />
          <stop offset="100%" stopColor="#1E90FF" />
        </linearGradient>
        <linearGradient id="sunsetSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF7E45" />
          <stop offset="100%" stopColor="#FF4500" />
        </linearGradient>
        <linearGradient id="nightSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#191970" />
          <stop offset="100%" stopColor="#000033" />
        </linearGradient>
      </defs>

      {/* Sky background arc */}
      <path
        d={`M 0,${height} A ${arcRadius},${arcRadius} 0 0,1 ${width},${height}`}
        fill={getSkyGradient()}
        stroke="#4b5563"
        strokeWidth="2"
      />

      {/* Horizon line */}
      <line
        x1="0"
        y1={height}
        x2={width}
        y2={height}
        stroke="#4b5563"
        strokeWidth="2"
      />
    </>
  );
};

export default SkyBackground;
