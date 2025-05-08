// src/components/weather/ActionTabs.jsx
import React from "react";

const ActionTabs = ({ activeSection, setActiveSection }) => {
  return (
    <div className="action-buttons">
      <button
        className={`forecast-button ${
          activeSection === "forecast" ? "active" : ""
        }`}
        onClick={() =>
          setActiveSection(activeSection === "forecast" ? null : "forecast")
        }
      >
        Forecast
      </button>
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
      <button
        className={`weather-effects-button ${
          activeSection === "effects" ? "active" : ""
        }`}
        onClick={() =>
          setActiveSection(activeSection === "effects" ? null : "effects")
        }
      >
        Weather Effects
      </button>
    </div>
  );
};

export default ActionTabs;
