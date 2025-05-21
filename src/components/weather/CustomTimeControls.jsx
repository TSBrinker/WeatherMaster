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

  // State for the date-time picker
  const [targetDate, setTargetDate] = useState({
    date: formatDateForInput(safeCurrentDate),
    hour: safeCurrentDate.getHours(),
    minute: 0,
  });

  // Format date for date input
  function formatDateForInput(date) {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      // Return today's date as fallback
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  // Handle hours advancement - Don't close on submit
  const handleAdvanceByHours = () => {
    if (customHours > 0) {
      onAdvanceTime(parseInt(customHours));
      // No onClose() call - keep dialog open
    }
  };

  // Handle advancing to specific date/time - Don't close on submit
  const handleAdvanceToDateTime = () => {
    try {
      // Parse the target date and time
      const [year, month, day] = targetDate.date
        .split("-")
        .map((num) => parseInt(num));

      // Create a new date object (month is 0-indexed in JavaScript)
      const newDate = new Date(
        year,
        month - 1,
        day,
        targetDate.hour,
        targetDate.minute,
        0
      );

      // Calculate hours difference between current date and target date
      const currentTime = safeCurrentDate.getTime();
      const targetTime = newDate.getTime();
      const hoursDiff = Math.round(
        (targetTime - currentTime) / (1000 * 60 * 60)
      );

      if (hoursDiff !== 0) {
        if (typeof onAdvanceToDateTime === "function") {
          onAdvanceToDateTime(newDate, hoursDiff);
        } else {
          // Fall back to regular hour advancement if the special function isn't provided
          onAdvanceTime(hoursDiff);
        }
        // No onClose() call - keep dialog open
      } else {
        // Optional: Show a message that dates are the same
        alert(
          "Target date and time is the same as current. No advancement needed."
        );
      }
    } catch (error) {
      console.error("Error advancing to date/time:", error);
      alert("There was a problem with the date selection. Please try again.");
    }
  };

  // Handle changes to the date input
  const handleDateChange = (e) => {
    setTargetDate({
      ...targetDate,
      date: e.target.value,
    });
  };

  // Handle changes to the hour input
  const handleHourChange = (e) => {
    const newHour = parseInt(e.target.value);
    if (!isNaN(newHour) && newHour >= 0 && newHour <= 23) {
      setTargetDate({
        ...targetDate,
        hour: newHour,
      });
    }
  };

  // // Handle changes to the minute input
  // const handleMinuteChange = (e) => {
  //   const newMinute = parseInt(e.target.value);
  //   if (!isNaN(newMinute) && newMinute >= 0 && newMinute <= 59) {
  //     setTargetDate({
  //       ...targetDate,
  //       minute: newMinute,
  //     });
  //   }
  // };

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

  // // Generate minute options for select (intervals of 5)
  // const minuteOptions = [];
  // for (let i = 0; i < 60; i += 5) {
  //   minuteOptions.push(
  //     <option key={i} value={i}>
  //       {String(i).padStart(2, "0")}
  //     </option>
  //   );
  // }

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
                  onChange={(e) =>
                    setCustomHours(parseInt(e.target.value) || 1)
                  }
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
          {/* Improved layout with side-by-side date and button */}
          <div className="datetime-input-row">
            <div className="date-time-inputs">
              <div className="input-group">
                <label htmlFor="target-date">Target Date:</label>
                <input
                  id="target-date"
                  type="date"
                  value={targetDate.date}
                  onChange={handleDateChange}
                  className="date-input"
                />
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
