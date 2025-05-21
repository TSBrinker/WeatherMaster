// src/components/weather/CustomTimeControls.jsx
import React, { useState, useEffect } from "react";
import { ChevronRight, Clock, Calendar, X } from "lucide-react";

const CustomTimeControls = ({
  onAdvanceTime,
  onAdvanceToDateTime,
  onClose,
  currentDate,
}) => {
  // Safely handle currentDate - use current time if not provided
  const safeCurrentDate =
    currentDate instanceof Date && !isNaN(currentDate.getTime())
      ? currentDate
      : new Date();

  // State for the two advancement modes
  const [advanceMode, setAdvanceMode] = useState("hours"); // "hours" or "datetime"
  const [customHours, setCustomHours] = useState(48);

  // Error message state
  const [errorMessage, setErrorMessage] = useState("");

  // State for separate date inputs
  const [targetDate, setTargetDate] = useState({
    year: safeCurrentDate.getFullYear(),
    month: safeCurrentDate.getMonth() + 1, // Convert to 1-indexed month
    day: safeCurrentDate.getDate(),
    hour: safeCurrentDate.getHours(),
  });

  // Update date state when currentDate changes
  useEffect(() => {
    if (currentDate instanceof Date && !isNaN(currentDate.getTime())) {
      setTargetDate({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1, // Convert to 1-indexed month
        day: currentDate.getDate(),
        hour: currentDate.getHours(),
      });
    }
  }, [currentDate]);

  // Handle hours advancement - Don't close on submit
  const handleAdvanceByHours = () => {
    if (customHours <= 0) {
      setErrorMessage("Please enter a positive number of hours.");
      return;
    }

    setErrorMessage("");
    onAdvanceTime(parseInt(customHours));
    // No onClose() call - keep dialog open
  };

  // Handle advancing to specific date/time - Don't close on submit
  const handleAdvanceToDateTime = () => {
    try {
      // Create a new date object from separate inputs
      const newDate = new Date(
        targetDate.year,
        targetDate.month - 1, // Convert back to 0-indexed month
        targetDate.day,
        targetDate.hour,
        0, // Minutes set to 0
        0 // Seconds set to 0
      );

      // Check if date is valid
      if (isNaN(newDate.getTime())) {
        setErrorMessage("Invalid date. Please check your inputs.");
        return;
      }

      // Calculate hours difference between current date and target date
      const currentTime = safeCurrentDate.getTime();
      const targetTime = newDate.getTime();
      const hoursDiff = Math.round(
        (targetTime - currentTime) / (1000 * 60 * 60)
      );

      // Check if date is in the past
      if (hoursDiff < 0) {
        setErrorMessage(
          "Cannot travel back in time. Please select a future date."
        );
        return;
      }

      // Clear any error message
      setErrorMessage("");

      if (hoursDiff !== 0) {
        if (typeof onAdvanceToDateTime === "function") {
          onAdvanceToDateTime(newDate, hoursDiff);
        } else {
          // Fall back to regular hour advancement if the special function isn't provided
          onAdvanceTime(hoursDiff);
        }
        // No onClose() call - keep dialog open
      } else {
        setErrorMessage(
          "Target date and time is the same as current. No advancement needed."
        );
      }
    } catch (error) {
      console.error("Error advancing to date/time:", error);
      setErrorMessage(
        "There was a problem with the date selection. Please try again."
      );
    }
  };

  // Handle changes to date part inputs
  const handleDatePartChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value === "" ? "" : parseInt(value, 10);

    // Clear error message when user makes changes
    setErrorMessage("");

    setTargetDate((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  // Handle changes to the hour input
  const handleHourChange = (e) => {
    const newHour = parseInt(e.target.value);
    setErrorMessage("");
    setTargetDate({
      ...targetDate,
      hour: newHour,
    });
  };

  // Generate hour options for select
  const hourOptions = [];
  for (let i = 0; i < 24; i++) {
    const hour12 = i === 0 ? 12 : i > 12 ? i - 12 : i;
    const ampm = i < 12 ? "AM" : "PM";
    hourOptions.push(
      <option key={i} value={i}>
        {hour12} {ampm}
      </option>
    );
  }

  return (
    <div className="custom-time-control-panel">
      <div className="custom-time-header">
        <h3>Custom Time Advancement</h3>
        <button
          onClick={onClose}
          className="close-button"
          aria-label="Close custom time controls"
        >
          <X size={18} />
        </button>
      </div>

      <div className="custom-mode-buttons">
        <button
          className={`mode-button ${advanceMode === "hours" ? "active" : ""}`}
          onClick={() => setAdvanceMode("hours")}
        >
          <Clock size={16} />
          <span>Advance Hours</span>
        </button>
        <button
          className={`mode-button ${
            advanceMode === "datetime" ? "active" : ""
          }`}
          onClick={() => setAdvanceMode("datetime")}
        >
          <Calendar size={16} />
          <span>Specific Date & Time</span>
        </button>
      </div>

      {/* Error message display */}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {advanceMode === "hours" ? (
        <div className="hours-advancement">
          {/* Improved layout with side-by-side input and button */}
          <div className="hours-input-row">
            <div className="input-group flex-grow">
              <label htmlFor="custom-hours">Hours to advance:</label>
              <div className="hours-input-container">
                <input
                  id="custom-hours"
                  type="number"
                  min="1"
                  max="8760" // Max 1 year in hours
                  value={customHours}
                  onChange={(e) => {
                    setCustomHours(parseInt(e.target.value) || 1);
                    setErrorMessage("");
                  }}
                  className="custom-hours-input"
                />
                <span className="input-suffix">hours</span>
              </div>
            </div>

            <button
              onClick={handleAdvanceByHours}
              className="advance-button hours-advance-button"
            >
              <span>Advance</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="preset-hours">
            <button onClick={() => setCustomHours(6)}>6h</button>
            <button onClick={() => setCustomHours(12)}>12h</button>
            <button onClick={() => setCustomHours(48)}>48h</button>
            <button onClick={() => setCustomHours(168)}>1 week</button>
          </div>
        </div>
      ) : (
        <div className="datetime-advancement">
          {/* Separated date inputs */}
          <div className="datetime-input-row">
            <div className="date-time-inputs">
              <div className="date-inputs">
                <div className="date-input-group">
                  <div className="input-group">
                    <label htmlFor="target-year">Year:</label>
                    <input
                      id="target-year"
                      type="number"
                      name="year"
                      min="1"
                      max="9999"
                      value={targetDate.year}
                      onChange={handleDatePartChange}
                      className="date-part-input"
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="target-month">Month:</label>
                    <input
                      id="target-month"
                      type="number"
                      name="month"
                      min="1"
                      max="12"
                      value={targetDate.month}
                      onChange={handleDatePartChange}
                      className="date-part-input"
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="target-day">Day:</label>
                    <input
                      id="target-day"
                      type="number"
                      name="day"
                      min="1"
                      max="31"
                      value={targetDate.day}
                      onChange={handleDatePartChange}
                      className="date-part-input"
                    />
                  </div>
                </div>
              </div>

              <div className="time-inputs">
                <div className="input-group">
                  <label htmlFor="target-hour">Hour:</label>
                  <select
                    id="target-hour"
                    value={targetDate.hour}
                    onChange={handleHourChange}
                    className="time-select"
                  >
                    {hourOptions}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleAdvanceToDateTime}
              className="advance-button datetime-advance-button"
            >
              <span>Advance</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTimeControls;
