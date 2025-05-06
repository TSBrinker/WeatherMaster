// src/components/world/WorldSetupModal.jsx
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
    startTime: new Date(state.gameTime || currentDate)
      .toISOString()
      .split("T")[1]
      .substring(0, 5),
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

    // Combine date and time
    const dateTime = new Date(`${formData.startDate}T${formData.startTime}`);

    // Update context
    setWorldName(formData.worldName);
    setGameTime(dateTime.toISOString());
    setGameYear(formData.gameYear);
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

  return (
    <div className="modal-overlay" onClick={handleModalClick}>
      <div className="bg-surface rounded-lg shadow-lg max-w-md w-full p-4">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
          <h2 className="text-xl font-bold">World Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="worldName" className="block mb-1">
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
            <label htmlFor="gameYear" className="block mb-1">
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
              <label htmlFor="startDate" className="block mb-1">
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
              <label htmlFor="startTime" className="block mb-1">
                Start Time
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full p-2 rounded bg-surface-light text-white border border-border"
                required
              />
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="btn mr-2">
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
