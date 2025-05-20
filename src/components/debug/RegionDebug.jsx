// src/components/debug/RegionDebug.jsx
import React from "react";

const RegionDebug = ({ region }) => {
  if (!region) return null;

  // Only show in development mode
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="p-3 bg-gray-800 rounded text-xs mt-2 border border-gray-700">
      <h3 className="font-bold mb-1">Region Debug Info</h3>
      <div>
        <strong>Name:</strong> {region.name}
      </div>
      <div>
        <strong>ID:</strong> {region.id.substring(0, 8)}...
      </div>
      <div>
        <strong>Root latitudeBand:</strong> {region.latitudeBand || "undefined"}
      </div>
      <div>
        <strong>Profile latitudeBand:</strong>{" "}
        {region.profile?.latitudeBand || "undefined"}
      </div>
      <div>
        <strong>Root climate:</strong> {region.climate || "undefined"}
      </div>
      <div>
        <strong>Profile climate/biome:</strong>{" "}
        {region.profile?.climate || region.profile?.biome || "undefined"}
      </div>
      <div>
        <strong>Weather Type:</strong> {region.weatherType || "undefined"}
      </div>
    </div>
  );
};

export default RegionDebug;
