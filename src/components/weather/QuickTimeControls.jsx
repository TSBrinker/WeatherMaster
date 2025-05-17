// src/components/weather/QuickTimeControls.jsx
import React from "react";

const QuickTimeControls = ({ onAdvanceTime }) => {
  return (
    <div className="quick-time-controls">
      <button onClick={() => onAdvanceTime(1)} className="time-button">
        +1h
      </button>
      <button onClick={() => onAdvanceTime(4)} className="time-button">
        +4h
      </button>
      <button onClick={() => onAdvanceTime(24)} className="time-button">
        +24h
      </button>
    </div>
  );
};

export default QuickTimeControls;
