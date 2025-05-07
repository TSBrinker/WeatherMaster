// src/components/weather/MoonPhaseDisplay.jsx
import React from "react";
import moonService from "../../services/MoonService";
import { useWorldSettings } from "../../contexts/WorldSettings";

const MoonPhaseDisplay = ({ currentDate }) => {
  // Get world settings
  const { state: worldSettings } = useWorldSettings();

  if (!currentDate) return null;

  // Get moon phase information from the service with world settings integration
  const moonInfo = moonService.getFormattedMoonInfo(currentDate, worldSettings);

  return (
    <div className="card p-4">
      <h2 className="card-title mb-4">Moon</h2>

      <div className="flex items-center justify-center mb-4">
        <div className="text-5xl mr-4">{moonInfo.icon}</div>
        <div>
          <div className="text-xl font-semibold">{moonInfo.name}</div>
          <div className="text-gray-400 text-sm">
            {Math.round(moonInfo.exactPercentage)}% illuminated
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-gray-400 text-sm">Moonrise</div>
          <div>{moonInfo.moonriseTime}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Moonset</div>
          <div>{moonInfo.moonsetTime}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Full Moon</div>
          <div>{moonInfo.nextFullMoonDate}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">New Moon</div>
          <div>{moonInfo.nextNewMoonDate}</div>
        </div>
      </div>
    </div>
  );
};

export default MoonPhaseDisplay;
