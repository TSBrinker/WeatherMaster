// src/components/world/WorldConfigButton.jsx - Updated with better display
import React from "react";
import { useWorldSettings } from "../../contexts/WorldSettings";

const WorldConfigButton = ({ onClick }) => {
  const { state } = useWorldSettings();

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-2 bg-surface-light rounded hover:bg-surface"
      title="World Settings"
      type="button"
    >
      <span className="text-lg">🌍</span>
      <span className="hidden sm:inline font-semibold">
        {state.worldName || "My World"}
        {state.gameYear && (
          <span className="text-sm ml-1 text-gray-400">{state.gameYear}</span>
        )}
      </span>
    </button>
  );
};

export default WorldConfigButton;
