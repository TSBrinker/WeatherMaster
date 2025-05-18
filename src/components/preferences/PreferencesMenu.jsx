// src/components/preferences/PreferencesMenu.jsx
import React from "react";
import { usePreferences } from "../../contexts/PreferencesContext";

const PreferencesMenu = () => {
  const { state, setWeatherSystem, setDebugMode, togglePreferencesMenu } =
    usePreferences();

  // Handle clicking outside to close
  const handleModalClick = (e) => {
    if (e.target.classList.contains("preferences-overlay")) {
      togglePreferencesMenu();
    }
  };

  if (!state.isOpen) return null;

  return (
    <div className="preferences-overlay" onClick={handleModalClick}>
      <div className="preferences-modal">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-semibold">App Preferences</h2>
          <button
            onClick={togglePreferencesMenu}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-3">Weather Generation</h3>
            <div className="bg-surface-light p-3 rounded mb-2">
              <div className="flex items-center justify-between">
                <label htmlFor="weatherSystem" className="font-medium">
                  Weather System
                </label>
                <select
                  id="weatherSystem"
                  value={state.weatherSystem}
                  onChange={(e) => setWeatherSystem(e.target.value)}
                  className="p-2 rounded bg-surface text-white border border-border"
                >
                  <option value="diceTable">Basic (Dice Tables)</option>
                  <option value="meteorological">
                    Advanced (Meteorological)
                  </option>
                </select>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {state.weatherSystem === "diceTable"
                  ? "Simple weather generation based on probability tables. Less resource-intensive and quicker to generate."
                  : "Realistic weather simulation based on physical parameters. Provides more natural weather progression and detailed statistics."}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-3">Developer Options</h3>
            <div className="bg-surface-light p-3 rounded">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="debugMode"
                  checked={state.debugMode}
                  onChange={(e) => setDebugMode(e.target.checked)}
                  className="mr-3"
                />
                <label htmlFor="debugMode" className="font-medium">
                  Debug Mode
                </label>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Enables additional debugging information and tools for
                troubleshooting weather generation.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <p className="text-sm text-gray-400">
            Preferences apply to all regions and are saved automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PreferencesMenu;
