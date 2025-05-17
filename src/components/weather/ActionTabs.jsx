// src/components/weather/ActionTabs.jsx
import React from "react";

const ActionTabs = ({
  activeSection,
  setActiveSection,
  excludeForecast = false, // New prop to hide forecast tab
}) => {
  return (
    <div className="action-buttons">
      <button
        className={`effects-button ${
          activeSection === "effects" ? "active" : ""
        }`}
        onClick={() =>
          setActiveSection(activeSection === "effects" ? null : "effects")
        }
      >
        Game Effects
      </button>

      {/* Only show forecast tab if not excluded */}
      {!excludeForecast && (
        <button
          className={`forecast-button ${
            activeSection === "forecast" ? "active" : ""
          }`}
          onClick={() =>
            setActiveSection(activeSection === "forecast" ? null : "forecast")
          }
        >
          24h Forecast
        </button>
      )}

      <button
        className={`region-details-button ${
          activeSection === "region" ? "active" : ""
        }`}
        onClick={() =>
          setActiveSection(activeSection === "region" ? null : "region")
        }
      >
        Region Details
      </button>
    </div>
  );
};

export default ActionTabs;
