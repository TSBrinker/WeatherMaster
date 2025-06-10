// Debug component to add temporarily to see what's happening with regions
// Add this to your WeatherDashboard component right after the imports

const DebugRegionStatus = () => {
  const { regions, activeRegion, hasRegions, isLoading } = useRegion();

  // Add this inside WeatherDashboard component, right before the return statement:
  console.log("=== REGION DEBUG ===");
  console.log("Regions:", regions);
  console.log("Active Region:", activeRegion);
  console.log("Has Regions:", hasRegions);
  console.log("Is Loading:", isLoading);
  console.log("Regions length:", regions?.length || 0);

  // Also check localStorage directly
  const storedRegions = localStorage.getItem("gm-weather-companion-regions");
  const storedActiveId = localStorage.getItem(
    "gm-weather-companion-active-region"
  );
  console.log("Stored regions raw:", storedRegions);
  console.log("Stored active ID:", storedActiveId);

  if (storedRegions) {
    try {
      const parsed = JSON.parse(storedRegions);
      console.log("Parsed regions:", parsed);
    } catch (e) {
      console.error("Error parsing stored regions:", e);
    }
  }

  return null;
};

// SOLUTION 1: If no regions exist, add a quick fix to create a default region
const createDefaultRegion = () => {
  const { createRegion } = useRegion();

  const defaultRegion = {
    name: "Default Region",
    climate: "temperate-deciduous",
    latitudeBand: "temperate",
    templateId: "temperate-deciduous-forest",
  };

  console.log("Creating default region:", defaultRegion);
  createRegion(defaultRegion);
};

// SOLUTION 2: If regions exist but no active region, select the first one
const selectFirstRegion = () => {
  const { regions, setActiveRegion } = useRegion();

  if (regions && regions.length > 0) {
    console.log("Setting first region as active:", regions[0]);
    setActiveRegion(regions[0].id);
  }
};

// Add this to your WeatherDashboard component in the render section:
// (Replace the loading screen logic with this enhanced version)

// Enhanced loading/no-region handling
if (isLoading && !initialized) {
  return (
    <div className="weather-dashboard loading">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading weather data...</p>
      </div>
      <DebugRegionStatus />
    </div>
  );
}

// Enhanced no-region handling
if (!activeRegion) {
  const { regions, hasRegions, createRegion, setActiveRegion } = useRegion();

  return (
    <div className="weather-dashboard loading">
      <DebugRegionStatus />
      <div className="loading-spinner">
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2>No Active Region</h2>
          <p>Regions found: {regions?.length || 0}</p>

          {hasRegions ? (
            <div>
              <p>Regions exist but none is active. Select one:</p>
              {regions.map((region) => (
                <button
                  key={region.id}
                  onClick={() => setActiveRegion(region.id)}
                  style={{
                    display: "block",
                    margin: "0.5rem auto",
                    padding: "0.5rem 1rem",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "0.25rem",
                    cursor: "pointer",
                  }}
                >
                  Select: {region.name}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <p>No regions found. Create a default one:</p>
              <button
                onClick={() => {
                  const defaultRegion = {
                    name: "Default Region",
                    climate: "temperate-deciduous",
                    latitudeBand: "temperate",
                    templateId: "temperate-deciduous-forest",
                  };
                  createRegion(defaultRegion);
                }}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                }}
              >
                Create Default Region
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
