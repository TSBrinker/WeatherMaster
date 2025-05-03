// src/components/region/RegionsDropdown.jsx
import React, { useState, useRef, useEffect } from "react";
import { useRegion } from "../../contexts/RegionContext";

const RegionsDropdown = ({ onShowCreateForm }) => {
  const { regions, activeRegion, hasRegions, setActiveRegion } = useRegion();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleRegionSelect = (regionId) => {
    setActiveRegion(regionId);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    if (onShowCreateForm) {
      onShowCreateForm();
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        className="region-selector-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {activeRegion
          ? activeRegion.name
          : hasRegions
          ? "Select Region"
          : "+ New Region"}
        <span className="ml-2">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-surface rounded shadow-lg z-10">
          {hasRegions ? (
            <>
              <div className="p-2 text-sm text-gray-400 border-b border-border">
                Select a region
              </div>
              <div className="max-h-60 overflow-y-auto">
                {regions.map((region) => (
                  <div
                    key={region.id}
                    className={`p-3 cursor-pointer hover:bg-surface-light ${
                      activeRegion?.id === region.id ? "bg-primary" : ""
                    }`}
                    onClick={() => handleRegionSelect(region.id)}
                  >
                    <div className="font-semibold">{region.name}</div>
                    <div className="text-xs text-gray-400">
                      {region.climate.replace("-", " ")}
                    </div>
                  </div>
                ))}
              </div>
              <div
                className="p-3 border-t border-border cursor-pointer hover:bg-surface-light text-center"
                onClick={handleCreateNew}
              >
                + New Region
              </div>
            </>
          ) : (
            <div
              className="p-3 cursor-pointer hover:bg-surface-light text-center"
              onClick={handleCreateNew}
            >
              + Create Your First Region
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegionsDropdown;
