// components/weather/RegionTransitionControls.jsx
import React, { useState, useEffect } from "react";
import useWorld from "../../hooks/useWorld";
import useRegionWeather from "../../hooks/useRegionWeather";

const RegionTransitionControls = () => {
  const { getActiveWorld, getActiveRegion, activeWorldId, activeRegionId } =
    useWorld();

  const { inTransition, startRegionTransition, endTransition, advanceTime } =
    useRegionWeather();

  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [adjacentRegions, setAdjacentRegions] = useState([]);
  const [customHours, setCustomHours] = useState(1);

  // Get active world and region
  const activeWorld = getActiveWorld();
  const activeRegion = getActiveRegion();

  // Find adjacent regions when active region changes
  useEffect(() => {
    if (!activeWorld || !activeRegion) {
      setAdjacentRegions([]);
      return;
    }

    // For now, we'll consider all other regions as adjacent
    // In a real app, you'd have a map with adjacency information
    const adjacent = activeWorld.regions.filter(
      (region) => region.id !== activeRegionId
    );

    setAdjacentRegions(adjacent);

    // Reset selected region when active region changes
    setSelectedRegionId("");
  }, [activeWorld, activeRegion, activeRegionId]);

  // Handler for region selection
  const handleRegionChange = (e) => {
    setSelectedRegionId(e.target.value);
  };

  // Handler for starting a transition
  const handleStartTransition = () => {
    if (!selectedRegionId) return;

    // Find the target region
    const targetRegion = adjacentRegions.find(
      (region) => region.id === selectedRegionId
    );

    if (targetRegion) {
      startRegionTransition(targetRegion);
    }
  };

  // Handler for custom travel time
  const handleCustomTravel = () => {
    if (customHours < 1) return;

    advanceTime(parseInt(customHours));
  };

  // Handler for arriving at destination
  const handleArriveNow = () => {
    endTransition();
  };

  // If no regions available, don't show this component
  if (!activeWorld || !activeRegion || adjacentRegions.length === 0) {
    return null;
  }

  return (
    <div className="region-transition-controls card">
      <h3 className="card-title mb-4">Region Travel</h3>

      {!inTransition ? (
        // Travel planning UI
        <>
          <div className="form-group mb-4">
            <label htmlFor="region-select" className="form-label">
              Travel to Region:
            </label>
            <select
              id="region-select"
              className="form-select"
              value={selectedRegionId}
              onChange={handleRegionChange}
            >
              <option value="">-- Select destination --</option>
              {adjacentRegions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={handleStartTransition}
            disabled={!selectedRegionId}
          >
            Start Journey
          </button>

          <div className="travel-info mt-4 p-3 bg-surface-light rounded-lg text-sm">
            <p>
              Select a destination region to begin travel. Weather will
              transition gradually as you journey between regions.
            </p>
          </div>
        </>
      ) : (
        // Journey in progress UI
        <>
          <div className="journey-controls">
            <div className="text-center mb-4">
              <div className="journey-icon text-2xl mb-2">🧭</div>
              <div className="font-semibold">Journey in Progress</div>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="travel-hours" className="form-label">
                Travel for Hours:
              </label>
              <div className="flex gap-2">
                <input
                  id="travel-hours"
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
                  onClick={handleCustomTravel}
                >
                  Travel
                </button>
              </div>
            </div>

            <div className="quick-travel-buttons grid grid-cols-3 gap-2 mb-4">
              <button
                className="btn btn-secondary"
                onClick={() => advanceTime(1)}
              >
                +1h
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => advanceTime(4)}
              >
                +4h
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => advanceTime(8)}
              >
                +8h
              </button>
            </div>

            <button
              className="btn btn-primary w-full mb-3"
              onClick={handleArriveNow}
            >
              Arrive Now
            </button>

            <div className="travel-tips p-3 bg-surface-light rounded-lg text-sm">
              <p>
                As you travel, the weather will gradually transition from your
                origin region to your destination region. This simulates the
                changing climate as you move across the land.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RegionTransitionControls;
