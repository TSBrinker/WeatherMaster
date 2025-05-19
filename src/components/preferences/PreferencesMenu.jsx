// src/components/preferences/PreferencesMenu.jsx
import React, { useState } from "react";
import { usePreferences } from "../../contexts/PreferencesContext";
import { storageUtils } from "../../utils/storageUtils"; // Make sure this is imported

const PreferencesMenu = () => {
  const { state, setWeatherSystem, setDebugMode, togglePreferencesMenu } =
    usePreferences();

  // Add these states for the nuclear option
  const [showNuclearConfirm, setShowNuclearConfirm] = useState(false);
  const [nuclearConfirmText, setNuclearConfirmText] = useState("");

  // Handle clicking outside to close
  const handleModalClick = (e) => {
    if (e.target.classList.contains("preferences-overlay")) {
      togglePreferencesMenu();
    }
  };

  // Handle nuclear reset
  const handleNuclearReset = () => {
    // Show confirmation dialog
    setShowNuclearConfirm(true);
  };

  // Handle confirmation
  const confirmNuclearReset = () => {
    if (nuclearConfirmText.toLowerCase() === "yes") {
      // Clear all localStorage data
      localStorage.clear();
      // Notify user
      alert("All data has been cleared. The app will now reload.");
      // Reload the page
      window.location.reload();
    } else {
      alert("Confirmation text doesn't match. Reset canceled.");
      setShowNuclearConfirm(false);
      setNuclearConfirmText("");
    }
  };

  // Handle cancel
  const cancelNuclearReset = () => {
    setShowNuclearConfirm(false);
    setNuclearConfirmText("");
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

          {/* Nuclear Reset Section */}
          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-lg font-semibold mb-3 text-danger">
              Danger Zone
            </h3>
            <div className="bg-red-900 bg-opacity-20 p-3 rounded border border-danger">
              <h4 className="font-semibold text-danger mb-2">Nuclear Reset</h4>
              <p className="text-sm text-gray-300 mb-3">
                This will erase all saved data including worlds, regions, and
                preferences. This action cannot be undone.
              </p>

              {!showNuclearConfirm ? (
                <button
                  onClick={handleNuclearReset}
                  className="bg-danger text-white py-2 px-3 rounded hover:bg-opacity-90"
                >
                  Reset Everything
                </button>
              ) : (
                <div className="nuclear-confirm p-3 bg-surface-dark rounded border border-danger">
                  <p className="text-sm text-gray-200 mb-2">
                    Type "yes" to confirm that you want to delete all data:
                  </p>
                  <input
                    type="text"
                    value={nuclearConfirmText}
                    onChange={(e) => setNuclearConfirmText(e.target.value)}
                    className="w-full p-2 mb-3 rounded bg-surface text-white border border-danger"
                    placeholder="Type 'yes' to confirm"
                    autoFocus
                  />
                  <div className="flex justify-between">
                    <button
                      onClick={cancelNuclearReset}
                      className="bg-surface-light text-white py-1 px-3 rounded hover:bg-opacity-90"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmNuclearReset}
                      className="bg-danger text-white py-1 px-3 rounded hover:bg-opacity-90"
                      disabled={nuclearConfirmText.toLowerCase() !== "yes"}
                    >
                      Confirm Reset
                    </button>
                  </div>
                </div>
              )}
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
