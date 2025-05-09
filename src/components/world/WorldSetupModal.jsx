// src/components/world/WorldSetupModal.jsx
import React, { useState } from "react";
import { useWorldSettings } from "../../contexts/WorldSettings";
import { useWorld } from "../../contexts/WorldContext"; // Add this import

const WorldSetupModal = ({ onClose }) => {
  const { state, setWorldName, setGameTime, setIsConfigured } =
    useWorldSettings();
  const { setCurrentDate } = useWorld(); // Get setCurrentDate from WorldContext

  // Get current date from state or use current date as fallback
  const currentGameDate = state.gameTime
    ? new Date(state.gameTime)
    : new Date();

  // Form state
  const [formData, setFormData] = useState({
    worldName: state.worldName || "My Fantasy World",
    gameDate: currentGameDate.toISOString().split("T")[0], // yyyy-mm-dd format for date input
    hourOfDay: currentGameDate.getHours(),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    try {
      // Create a new date object with the selected date and time
      const [year, month, day] = formData.gameDate.split("-").map(Number);
      const dateTime = new Date(year, month - 1, day);
      dateTime.setHours(parseInt(formData.hourOfDay, 10), 0, 0, 0);

      // Important: Update both contexts to ensure synchronization
      setWorldName(formData.worldName);
      setGameTime(dateTime);
      setCurrentDate(dateTime); // Also update in the WorldContext
      setIsConfigured(true);

      // Force a re-render by setting a small timeout
      setTimeout(() => {
        // Close modal
        onClose();
      }, 50);
    } catch (error) {
      console.error("Error setting game date/time:", error);
      // You could add error handling UI here
    }
  };

  // Handle click outside to close
  const handleModalClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
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
          <h2 className="text-xl font-semibold">World Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

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

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="gameDate" className="block mb-2">
                Game Date
              </label>
              <input
                type="date"
                id="gameDate"
                name="gameDate"
                value={formData.gameDate}
                onChange={handleChange}
                className="w-full p-2 rounded bg-surface-light text-white border border-border"
                required
              />
              <div className="text-sm text-gray-400 mt-1">
                The date in your game world
              </div>
            </div>
            <div>
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
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border mt-6">
            <button type="button" onClick={onClose} className="btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorldSetupModal;
