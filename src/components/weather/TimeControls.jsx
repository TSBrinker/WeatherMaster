// src/components/weather/TimeControls.jsx
import React, { useState } from "react";
import { Clock, Sun, Calendar, Settings } from "lucide-react";
import CustomTimeControls from "./CustomTimeControls";

const TimeControls = ({ onAdvanceTime, currentDate }) => {
  const [showCustomControls, setShowCustomControls] = useState(false);

  const handleAdvancePreset = (hours) => {
    onAdvanceTime(hours);
  };

  // Handler for advancing to a specific date and time
  const handleAdvanceToDateTime = (targetDate, hoursDiff) => {
    // Pass the calculated hours difference to onAdvanceTime
    onAdvanceTime(hoursDiff);
  };

  return (
    <div className="time-control-container">
      {/* Main time control buttons */}
      <div className="time-control-panel">
        <div className="preset-buttons">
          <button
            onClick={() => handleAdvancePreset(1)}
            className="time-button time-button-small"
            title="Advance 1 hour"
          >
            <Clock size={14} />
            <span>+1h</span>
          </button>

          <button
            onClick={() => handleAdvancePreset(4)}
            className="time-button"
            title="Advance 4 hours"
          >
            <Sun size={16} />
            <span>+4h</span>
          </button>

          <button
            onClick={() => handleAdvancePreset(24)}
            className="time-button"
            title="Advance to tomorrow"
          >
            <Calendar size={16} />
            <span>+24h</span>
          </button>

          <button
            onClick={() => setShowCustomControls(!showCustomControls)}
            className={`time-button time-button-custom ${
              showCustomControls ? "active" : ""
            }`}
            title="Custom time advance"
          >
            <Settings size={16} />
            <span>Custom</span>
          </button>
        </div>
      </div>

      {/* Custom time controls (conditionally rendered) */}
      {showCustomControls && (
        <CustomTimeControls
          onAdvanceTime={onAdvanceTime}
          onAdvanceToDateTime={handleAdvanceToDateTime}
          onClose={() => setShowCustomControls(false)}
          currentDate={currentDate}
        />
      )}
    </div>
  );
};

export default TimeControls;
