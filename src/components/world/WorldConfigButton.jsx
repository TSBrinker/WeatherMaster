// src/components/world/WorldConfigButton.jsx
import React from "react";
import { useWorldSettings } from "../../contexts/WorldSettings";

const WorldConfigButton = ({ onClick }) => {
  const { state } = useWorldSettings();

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-2 bg-surface-light rounded hover:bg-surface"
      title="World Settings"
    >
      <span className="text-lg">🌍</span>
      <span className="hidden sm:inline">{state.worldName}</span>
    </button>
  );
};

export default WorldConfigButton;
