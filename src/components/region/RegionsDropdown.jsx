// src/components/region/RegionsDropdown.jsx - Complete fixed version
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
    <div className="dropdown-wrapper" ref={dropdownRef}>
      <button
        className="region-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {activeRegion
          ? activeRegion.name
          : hasRegions
          ? "Select Region"
          : "+ New Region"}
        <span className="ml-2">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {hasRegions ? (
            <>
              <div className="dropdown-header">Select a region</div>
              <div className="dropdown-items">
                {regions.map((region) => (
                  <div
                    key={region.id}
                    className={`dropdown-item ${
                      activeRegion?.id === region.id ? "active" : ""
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
              <div className="dropdown-footer" onClick={handleCreateNew}>
                + New Region
              </div>
            </>
          ) : (
            <div
              className="dropdown-item text-center"
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
