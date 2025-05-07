// src/components/weather/RegionHeader.jsx
import React from "react";

const RegionHeader = ({ regionName }) => {
  if (!regionName) return null;
  
  return (
    <div className="region-header">
      <h2 className="region-name">{regionName}</h2>
    </div>
  );
};

export default RegionHeader;