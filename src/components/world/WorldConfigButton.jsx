// src/components/world/WorldConfigButton.jsx
import React from "react";
import { useWorldSettings } from "../../contexts/WorldSettings";

const WorldConfigButton = ({ onClick }) => {
  const { state, formatGameDate } = useWorldSettings();

  // Get formatted date to display (optional)
  const formattedDate = state.gameTime ? formatGameDate(state.gameTime) : "";

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
        {/* <span className="text-sm ml-2 text-gray-400">{formattedDate}</span> */}
      </span>
    </button>
  );
};

export default WorldConfigButton;
