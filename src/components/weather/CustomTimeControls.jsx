// src/components/weather/CustomTimeControls.jsx
import React, { useState } from "react";

const CustomTimeControls = ({ onAdvanceTime }) => {
  const [customHours, setCustomHours] = useState(1);

  const handleAdvance = () => {
    if (customHours > 0) {
      onAdvanceTime(customHours);
    }
  };

  return (
    <div className="custom-time-controls">
      <input
        type="number"
        min="1"
        value={customHours}
        onChange={(e) => setCustomHours(parseInt(e.target.value) || 1)}
        className="custom-hours-input"
        aria-label="Custom hours"
      />
      <button onClick={handleAdvance} className="custom-advance-button">
        Advance
      </button>
    </div>
  );
};

export default CustomTimeControls;
