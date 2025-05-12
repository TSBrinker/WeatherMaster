// src/components/weather/TimeControls.jsx

import React, { useState } from "react";

const TimeControls = ({ currentDate, onAdvanceTime, currentHour }) => {
  const [customHours, setCustomHours] = useState(1);

  // Format time without minutes
  const formatHour = (date) => {
    return date.toLocaleString("en-US", {
      hour: "numeric",
      hour12: true,
    });
  };

  return (
    <div className="card p-4">
      <h2 className="card-title mb-4">Time Controls</h2>

      {/* Day/Night cycle visualization */}
      <div
        className="relative h-10 rounded-full overflow-hidden mb-8 mt-6"
        style={{
          background:
            "linear-gradient(to right, #0c1445 0%, #0c1445 20%, #5b6ee1 30%, #f9d71c 50%, #e86f2d 70%, #0c1445 80%, #0c1445 100%)",
        }}
      >
        {/* Markers for key times */}
        {[
          { time: "6 AM", position: "25%", icon: "🌅" },
          { time: "12 PM", position: "50%", icon: "☀️" },
          { time: "6 PM", position: "75%", icon: "🌇" },
        ].map((marker) => (
          <div
            key={marker.time}
            className="absolute top-0 h-full"
            style={{
              left: marker.position,
              width: "2px",
              backgroundColor: "rgba(255,255,255,0.7)",
            }}
          >
            <div className="absolute -top-8 -left-3 text-lg">{marker.icon}</div>
            <div className="absolute -top-6 -left-6 text-xs bg-black bg-opacity-50 px-1 rounded">
              {marker.time}
            </div>
          </div>
        ))}

        {/* Current time marker */}
        <div
          className="absolute top-0 h-full z-10"
          style={{
            left: `${(currentHour / 24) * 100}%`,
            width: "3px",
            backgroundColor: "white",
            boxShadow: "0 0 5px white",
          }}
        >
          <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-white shadow-md"></div>
          <div className="absolute top-12 -left-8 bg-black bg-opacity-50 px-2 py-1 rounded text-sm font-bold">
            {formatHour(currentDate)}
          </div>
        </div>
      </div>

      {/* Quick time controls */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button className="btn btn-primary" onClick={() => onAdvanceTime(1)}>
          +1 Hour
        </button>
        <button className="btn btn-primary" onClick={() => onAdvanceTime(4)}>
          +4 Hours
        </button>
        <button className="btn btn-primary" onClick={() => onAdvanceTime(24)}>
          +24 Hours
        </button>
      </div>

      {/* Custom time control */}
      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          value={customHours}
          onChange={(e) => setCustomHours(parseInt(e.target.value) || 1)}
          onClick={(e) => e.target.select()}
          className="flex-1 p-2 bg-surface-light text-white border border-border rounded"
        />
        <button
          className="btn btn-secondary"
          onClick={() => onAdvanceTime(customHours)}
        >
          Advance
        </button>
      </div>
    </div>
  );
};

// export default TimeControls;
