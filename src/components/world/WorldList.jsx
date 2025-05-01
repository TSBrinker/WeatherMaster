// components/world/WorldList.jsx
import React, { useState, useEffect } from "react";
import useWorld from "../../hooks/useWorld";

const WorldList = ({ onCreateNew, onSelectWorld }) => {
  const {
    worlds,
    activeWorldId,
    loadWorlds,
    setActiveWorld,
    deleteWorld,
    isLoading,
  } = useWorld();

  const [confirmDelete, setConfirmDelete] = useState(null);

  // Load worlds on component mount
  useEffect(() => {
    loadWorlds();
  }, [loadWorlds]);

  // Handler for selecting a world
  const handleSelect = (worldId) => {
    setActiveWorld(worldId);
    if (onSelectWorld) {
      onSelectWorld(worldId);
    }
  };

  // Handler for deleting a world
  const handleDelete = (worldId) => {
    // Show delete confirmation
    setConfirmDelete(worldId);
  };

  // Confirm delete
  const confirmDeleteWorld = () => {
    if (confirmDelete) {
      deleteWorld(confirmDelete);
      setConfirmDelete(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="world-list card">
        <div className="card-title">Your Worlds</div>
        <div className="loading-state text-center py-4">
          <p>Loading worlds...</p>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!worlds || worlds.length === 0) {
    return (
      <div className="world-list card">
        <div className="card-title">Your Worlds</div>
        <div className="empty-state text-center py-10">
          <div className="empty-state-icon">🌍</div>
          <div className="empty-state-title">No Worlds Yet</div>
          <div className="empty-state-desc">
            Create your first world to get started.
          </div>
          <button className="btn btn-primary mt-4" onClick={onCreateNew}>
            Create World
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="world-list card">
      <div className="flex justify-between items-center mb-4">
        <div className="card-title">Your Worlds</div>
        <button className="btn btn-primary btn-small" onClick={onCreateNew}>
          + New World
        </button>
      </div>

      <div className="worlds-container">
        {worlds.map((world) => (
          <div
            key={world.id}
            className={`world-item p-4 mb-2 rounded-lg cursor-pointer transition-all hover:scale-102 flex justify-between items-center ${
              world.id === activeWorldId
                ? "bg-primary text-white"
                : "bg-surface-light"
            }`}
            onClick={() => handleSelect(world.id)}
          >
            <div className="world-info">
              <div className="world-name font-semibold">{world.name}</div>
              <div className="world-meta text-sm text-gray-400">
                {world.regions?.length || 0} Regions
              </div>
            </div>

            {/* Delete button */}
            <button
              className="delete-btn p-1 rounded hover:bg-surface-light"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(world.id);
              }}
            >
              <span role="img" aria-label="Delete">
                🗑️
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="delete-confirm-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="modal-content bg-surface p-6 rounded-lg max-w-md">
            <h3 className="text-xl font-bold mb-4">Delete World?</h3>
            <p className="mb-6">
              Are you sure you want to delete this world? This action cannot be
              undone, and all regions and locations will be permanently deleted.
            </p>
            <div className="flex justify-end gap-4">
              <button className="btn" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDeleteWorld}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldList;
