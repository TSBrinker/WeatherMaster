// src/components/world/WorldSetupModal.jsx - Updated to force hours only
import React, { useState } from "react";
import { useWorldSettings } from "../../contexts/WorldSettings";
import { useWorld } from "../../contexts/WorldContext";

const WorldSetupModal = ({ onClose }) => {
  const { state, setWorldName, setGameTime, setGameYear, setIsConfigured } =
    useWorldSettings();
  const { currentDate } = useWorld();

  // Form state
  const [formData, setFormData] = useState({
    worldName: state.worldName || "My Fantasy World",
    startDate: new Date(state.gameTime || currentDate)
      .toISOString()
      .split("T")[0],
    hourOfDay: new Date(state.gameTime || currentDate).getHours(),
    gameYear: state.gameYear || 1492,
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

    // Create new date with hour only (no minutes)
    const dateTime = new Date(`${formData.startDate}T00:00:00`);
    // Set hours only - force minutes to 0
    dateTime.setHours(parseInt(formData.hourOfDay, 10), 0, 0, 0);

    // Update context
    setWorldName(formData.worldName);
    setGameTime(dateTime.toISOString());
    setGameYear(parseInt(formData.gameYear, 10));
    setIsConfigured(true);

    // Close modal
    onClose();
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

          <div className="mb-4">
            <label htmlFor="gameYear" className="block mb-2">
              Game Year
            </label>
            <input
              type="number"
              id="gameYear"
              name="gameYear"
              value={formData.gameYear}
              onChange={handleChange}
              className="w-full p-2 rounded bg-surface-light text-white border border-border"
              min="1"
              required
            />
            <div className="text-sm text-gray-400 mt-1">
              Year for your game world (e.g. 1492, 3025)
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="startDate" className="block mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full p-2 rounded bg-surface-light text-white border border-border"
                required
              />
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
