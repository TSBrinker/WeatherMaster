// components/time/TimeControlPanel.jsx
import React, { useState } from 'react';
import useWeather from '../../hooks/useWeather';
import CustomTimeControl from './CustomTimeControl';
import DayNightCycle from './DayNightCycle';

const TimeControlPanel = () => {
  const { currentDate, advanceTime, isLoading } = useWeather();
  const [showCustomControls, setShowCustomControls] = useState(false);
  
  // Handler for standard time advancement buttons
  const handleAdvanceTime = (hours) => {
    if (isLoading) return;
    advanceTime(hours);
  };
  
  // Toggle custom time controls
  const toggleCustomControls = () => {
    setShowCustomControls(!showCustomControls);
  };
  
  return (
    <div className="time-control-panel card">
      <h3 className="card-title">Time Controls</h3>
      
      <DayNightCycle currentDate={currentDate} />
      
      <div className="quick-controls grid grid-cols-3 gap-2 mb-4">
        <button 
          className="btn btn-primary"
          onClick={() => handleAdvanceTime(1)}
          disabled={isLoading}
        >
          +1 Hour
        </button>
        <button 
          className="btn btn-primary"
          onClick={() => handleAdvanceTime(4)}
          disabled={isLoading}
        >
          +4 Hours
        </button>
        <button 
          className="btn btn-primary"
          onClick={() => handleAdvanceTime(24)}
          disabled={isLoading}
        >
          +24 Hours
        </button>
      </div>
      
      <div className="advanced-controls">
        <button 
          className="btn btn-secondary w-full mb-4"
          onClick={toggleCustomControls}
        >
          {showCustomControls ? 'Hide Custom Time' : 'Custom Time Advance'}
        </button>
        
        {showCustomControls && <CustomTimeControl />}
      </div>
    </div>
  );
};

export default TimeControlPanel;