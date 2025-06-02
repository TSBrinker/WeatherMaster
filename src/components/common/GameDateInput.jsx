// src/components/common/GameDateInput.jsx
import React, { useState, useEffect } from "react";

const GameDateInput = ({ initialValue, onChange, id }) => {
  // Parse the initial value if provided
  const parseInitialDate = () => {
    try {
      if (initialValue) {
        const date = new Date(initialValue);
        if (!isNaN(date.getTime())) {
          return {
            year: date.getFullYear(),
            // Month is 0-indexed in JavaScript Date
            month: date.getMonth() + 1,
            day: date.getDate(),
          };
        }
      }
      // Default to current date if no valid initialValue
      const today = new Date();
      return {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate(),
      };
    } catch (e) {
      console.error("Error parsing initial date:", e);
      // Default to current date on error
      const today = new Date();
      return {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate(),
      };
    }
  };

  const [dateValues, setDateValues] = useState(parseInitialDate);

  // Notify parent component on change
  useEffect(() => {
    // ISO format: YYYY-MM-DD
    const formattedDate = `${dateValues.year}-${String(
      dateValues.month
    ).padStart(2, "0")}-${String(dateValues.day).padStart(2, "0")}`;
    onChange(formattedDate);
  }, [dateValues, onChange]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Convert to appropriate numeric values
    let numValue = parseInt(value, 10);

    // Handle validation
    if (name === "year") {
      // Allow any year, including 0 and negative for fantasy settings
      // Just ensure it's a valid number
      numValue = isNaN(numValue) ? 0 : numValue;
    } else if (name === "month") {
      // Ensure month is between 1-12
      numValue = isNaN(numValue) ? 1 : Math.max(1, Math.min(12, numValue));
    } else if (name === "day") {
      // Get days in the current month
      const daysInMonth = new Date(
        dateValues.year,
        dateValues.month,
        0
      ).getDate();
      numValue = isNaN(numValue)
        ? 1
        : Math.max(1, Math.min(daysInMonth, numValue));
    }

    setDateValues((prev) => ({
      ...prev,
      [name]: numValue,
    }));
  };

  // Get days in current month for validation
  const daysInMonth = new Date(dateValues.year, dateValues.month, 0).getDate();

  // Month names for the dropdown
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="game-date-input">

      {/* Month dropdown */}
      <div className="date-input-group">
        <label
          htmlFor={`${id}-month`}
          className="block text-sm text-gray-400 mb-1"
        >
          Month
        </label>
        <select
          id={`${id}-month`}
          name="month"
          value={dateValues.month}
          onChange={handleChange}
          className="w-full p-2 rounded bg-surface-light text-white border border-border"
          aria-label="Month"
        >
          {monthNames.map((name, index) => (
            <option key={index} value={index + 1}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Day input */}
      <div className="date-input-group">
        <label
          htmlFor={`${id}-day`}
          className="block text-sm text-gray-400 mb-1"
        >
          Day
        </label>
        <select
          id={`${id}-day`}
          name="day"
          value={dateValues.day}
          onChange={handleChange}
          className="w-full p-2 rounded bg-surface-light text-white border border-border"
          aria-label="Day"
        >
          {[...Array(daysInMonth)].map((_, index) => (
            <option key={index} value={index + 1}>
              {index + 1}
            </option>
          ))}
        </select>
      </div>
      
      {/* Year input */}
      <div className="date-input-group">
        <label
          htmlFor={`${id}-year`}
          className="block text-sm text-gray-400 mb-1"
        >
          Year
        </label>
        <input
          type="number"
          id={`${id}-year`}
          name="year"
          value={dateValues.year}
          onChange={handleChange}
          className="w-full p-2 rounded bg-surface-light text-white border border-border"
          aria-label="Year"
        />
      </div>
    </div>
  );
};

export default GameDateInput;
