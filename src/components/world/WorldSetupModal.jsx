// src/components/world/WorldSetupModal.jsx
import React, { useState, useEffect } from "react";
import { useWorldSettings } from "../../contexts/WorldSettings";
import { useWorld } from "../../contexts/WorldContext";
import GameDateInput from "../common/GameDateInput";
import { storageUtils } from "../../utils/storageUtils";

const WorldSetupModal = ({ onClose, forceShow = false, editMode = false }) => {
  const { state, setWorldName, setGameTime, setIsConfigured } =
    useWorldSettings();
  const { setCurrentDate } = useWorld();

  // Add states for data checking and restoration
  const [dataChecked, setDataChecked] = useState(false);
  const [dataRestored, setDataRestored] = useState(false);
  const [checkMessage, setCheckMessage] = useState("");

  // Get current date from state or use current date as fallback
  const currentGameDate = state.gameTime
    ? new Date(state.gameTime)
    : new Date();

  // Form state - initialize with current values in edit mode
  const [formData, setFormData] = useState({
    worldName: state.worldName || "My Fantasy World",
    gameDate: currentGameDate.toISOString().split("T")[0],
    hourOfDay: currentGameDate.getHours(),
  });

  // Only perform auto-checks if we're not in edit mode and not forced to show
  useEffect(() => {
    if (editMode) {
      console.log("WorldSetupModal in edit mode - skipping auto-check");
      return; // Skip all auto-checks in edit mode
    }

    if (forceShow) {
      console.log("Forcing world setup modal to show");
      return; // Skip the check if forceShow is true
    }

    const setupCompleted = localStorage.getItem(
      "gm-weather-companion-setup-completed"
    );
    const hasRegions = localStorage.getItem("gm-weather-companion-regions");

    console.log("WorldSetupModal check:", {
      setupCompleted,
      hasRegions: !!hasRegions,
      forceShow,
      editMode,
    });

    // If setup is completed or we have regions, close the modal
    if (setupCompleted === "true" || hasRegions) {
      console.log("Setup already completed, closing modal");
      setIsConfigured(true);
      onClose();
    }
  }, [onClose, setIsConfigured, forceShow, editMode]);

  // Update form data when state changes (important for edit mode)
  useEffect(() => {
    if (editMode && state.gameTime) {
      const date = new Date(state.gameTime);
      setFormData({
        worldName: state.worldName || "My Fantasy World",
        gameDate: date.toISOString().split("T")[0],
        hourOfDay: date.getHours(),
      });
    }
  }, [editMode, state.worldName, state.gameTime]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle date change from our custom component
  const handleDateChange = (dateString) => {
    setFormData({
      ...formData,
      gameDate: dateString,
    });
  };

  // Function to check for existing data
  const checkForExistingData = () => {
    try {
      // Check for world settings
      const savedSettings = storageUtils.loadData(
        "gm-weather-companion-world-settings",
        null
      );
      const setupCompleted = localStorage.getItem(
        "gm-weather-companion-setup-completed"
      );
      const hasRegions = localStorage.getItem("gm-weather-companion-regions");

      setDataChecked(true);

      if (savedSettings) {
        // Update form with saved data
        const savedDate = new Date(savedSettings.gameTime || new Date());

        setFormData({
          worldName: savedSettings.worldName || "My Fantasy World",
          gameDate: savedDate.toISOString().split("T")[0],
          hourOfDay: savedDate.getHours(),
        });

        setDataRestored(true);
        setCheckMessage("World settings restored successfully!");
        console.log("Existing world data found and restored!", savedSettings);

        // If setup was completed, we could ask user if they want to proceed
        if (setupCompleted === "true" && !forceShow) {
          setCheckMessage("World already configured. Settings restored!");
        }
      } else if (hasRegions) {
        setDataRestored(false);
        setCheckMessage(
          "Found regions but no world settings. Create new world settings or cancel to use defaults."
        );
      } else {
        setDataRestored(false);
        setCheckMessage(
          "No existing world data found. Please create new settings."
        );
      }
    } catch (error) {
      console.error("Error checking for existing data:", error);
      setDataChecked(true);
      setDataRestored(false);
      setCheckMessage("Error checking for data: " + error.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    try {
      // Create date from exact parts to avoid browser auto-corrections
      const [yearStr, monthStr, dayStr] = formData.gameDate.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1; // 0-indexed months in JS
      const day = parseInt(dayStr, 10);

      const dateTime = new Date();
      dateTime.setFullYear(year); // Set year first to avoid auto-correction
      dateTime.setMonth(month);
      dateTime.setDate(day);
      dateTime.setHours(parseInt(formData.hourOfDay, 10), 0, 0, 0);

      console.log("Saving world settings:", {
        name: formData.worldName,
        date: dateTime.toString(),
        editMode,
      });

      // Important: Update both contexts to ensure synchronization
      setWorldName(formData.worldName);
      setGameTime(dateTime);
      setCurrentDate(dateTime); // Also update in the WorldContext
      setIsConfigured(true);

      // Only set the setup completed flag if not in edit mode
      if (!editMode) {
        localStorage.setItem("gm-weather-companion-setup-completed", "true");
        localStorage.removeItem("gm-weather-companion-setup-attempted");
      }

      // Close modal with a small delay to allow state updates
      setTimeout(() => {
        onClose();
      }, 50);
    } catch (error) {
      console.error("Error setting game date/time:", error);
    }
  };

  // Handle click outside to close - disable this if forceShow is true
  const handleModalClick = (e) => {
    if (!forceShow && e.target.classList.contains("modal-overlay")) {
      onClose();
    }
  };

  // Generate hours for the select dropdown (1-12 AM/PM format)
  const hoursOptions = [];
  for (let i = 0; i < 24; i++) {
    const hour12 = i === 0 ? 12 : i > 12 ? i - 12 : i;
    const ampm = i < 12 ? "AM" : "PM";
    hoursOptions.push(
      <option key={i} value={i}>
        {hour12} {ampm}
      </option>
    );
  }

  return (
    <div className="modal-overlay" onClick={handleModalClick}>
      <div className="modal-content">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-semibold">
            {editMode ? "Edit World Settings" : "World Setup"}
          </h2>
          {!forceShow && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Data check/restore section - only show in creation mode */}
        {!editMode && (
          <div className="p-4 bg-gray-800 rounded-md m-4 mb-2">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-white">Existing World Data</h3>
                <p className="text-sm text-gray-400">
                  {dataChecked
                    ? checkMessage
                    : "Check for previously saved world settings."}
                </p>
              </div>
              <button
                onClick={checkForExistingData}
                className={`px-3 py-1 rounded text-sm ${
                  dataRestored
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {dataChecked
                  ? dataRestored
                    ? "✓ Data Restored"
                    : "Check Again"
                  : "Check for Data"}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="worldName" className="block mb-2">
              World Name
            </label>
            <input
              type="text"
              id="worldName"
              name="worldName"
              value={formData.worldName}
              onChange={handleChange}
              className="w-full p-2 rounded bg-surface-light text-white border border-border"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">Game Date</label>
            <GameDateInput
              id="world-setup-date"
              initialValue={formData.gameDate}
              onChange={handleDateChange}
            />
            <div className="text-sm text-gray-400 mt-1">
              The date in your game world
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="hourOfDay" className="block mb-2">
              Hour of Day
            </label>
            <select
              id="hourOfDay"
              name="hourOfDay"
              value={formData.hourOfDay}
              onChange={handleChange}
              className="w-full p-2 rounded bg-surface-light text-white border border-border"
              required
            >
              {hoursOptions}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border mt-6">
            {!forceShow && (
              <button type="button" onClick={onClose} className="btn">
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              {editMode
                ? "Save Changes"
                : dataRestored
                ? "Use Restored Settings"
                : "Create World"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorldSetupModal;
