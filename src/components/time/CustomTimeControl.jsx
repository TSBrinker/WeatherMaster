// components/time/CustomTimeControl.jsx
import React, { useState } from "react";
import useWeather from "../../hooks/useWeather";
import useWeatherIntegration from "../../hooks/useWeatherIntegration";

const CustomTimeControl = ({ onAdvanceTime }) => {
  const { currentDate, jumpToDate, isLoading } = useWeather();
  const { activeLocation, saveCurrentWeather } = useWeatherIntegration();

  const [customHours, setCustomHours] = useState(1);
  const [targetDate, setTargetDate] = useState(() => {
    // Initialize with current date in YYYY-MM-DD format
    return new Date(currentDate).toISOString().split("T")[0];
  });

  // Handler for custom hours advancement
  const handleCustomAdvance = () => {
    if (isLoading || !activeLocation || customHours < 1) return;

    if (onAdvanceTime) {
      onAdvanceTime(customHours);
    } else {
      // Fallback if no callback provided
      advanceTime(customHours);
      saveCurrentWeather();
    }
  };

  // Handler for jumping to a specific date
  const handleJumpToDate = () => {
    if (isLoading || !activeLocation) return;

    const selectedDate = new Date(targetDate);
    // Set to noon to avoid time zone issues
    selectedDate.setHours(12, 0, 0, 0);

    // Only proceed if the target date is valid and different from the current date
    if (!isNaN(selectedDate.getTime())) {
      const currentDateNoon = new Date(currentDate);
      currentDateNoon.setHours(12, 0, 0, 0);

      // Calculate difference in days
      const diffMs = selectedDate - currentDateNoon;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours !== 0) {
        if (onAdvanceTime && diffHours > 0) {
          onAdvanceTime(diffHours);
        } else {
          jumpToDate(selectedDate);
          saveCurrentWeather();
        }
      }
    }
  };

  return (
    <div className="custom-time-control">
      <div className="custom-hours-control mb-4">
        <div className="form-group">
          <label htmlFor="custom-hours" className="form-label">
            Custom Hours:
          </label>
          <div className="flex gap-2">
            <input
              id="custom-hours"
              type="number"
              min="1"
              className="form-input"
              value={customHours}
              onChange={(e) =>
                setCustomHours(Math.max(1, parseInt(e.target.value) || 1))
              }
            />
            <button
              className="btn btn-primary"
              onClick={handleCustomAdvance}
              disabled={isLoading || !activeLocation}
            >
              Advance
            </button>
          </div>
        </div>
      </div>

      <div className="date-jump-control">
        <div className="form-group">
          <label htmlFor="target-date" className="form-label">
            Jump to Date:
          </label>
          <div className="flex gap-2">
            <input
              id="target-date"
              type="date"
              className="form-input"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={handleJumpToDate}
              disabled={isLoading || !activeLocation}
            >
              Jump
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomTimeControl;
