import React, { useState } from 'react';
import { Dropdown, Modal, Button } from 'react-bootstrap';
import { useWorld } from '../../contexts/WorldContext';

/**
 * Settings Menu - Dangerous operations
 * Provides access to data deletion functions
 */
const SettingsMenu = () => {
  const { worlds, deleteRegion, deleteWorld } = useWorld();
  const [showNukeRegionsConfirm, setShowNukeRegionsConfirm] = useState(false);
  const [showNukeAllConfirm, setShowNukeAllConfirm] = useState(false);

  // Get all regions from all worlds
  const allRegions = worlds.flatMap(world => world.regions);

  const handleNukeRegions = () => {
    // Delete all regions in all worlds
    allRegions.forEach(region => {
      deleteRegion(region.id);
    });
    setShowNukeRegionsConfirm(false);
    alert('All regions have been deleted.');
  };

  const handleNukeAll = () => {
    // Delete all worlds (which cascades to delete all regions)
    worlds.forEach(world => {
      deleteWorld(world.id);
    });
    setShowNukeAllConfirm(false);
    // Clear all localStorage
    localStorage.clear();
    alert('All data has been deleted. Refreshing page...');
    window.location.reload();
  };

  return (
    <>
      <Dropdown align="end">
        <Dropdown.Toggle
          variant="outline-secondary"
          size="sm"
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            zIndex: 1000
          }}
        >
          ⚙️
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Header>Danger Zone</Dropdown.Header>
          <Dropdown.Item
            onClick={() => setShowNukeRegionsConfirm(true)}
            className="text-warning"
          >
            🗑️ Nuke All Regions
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => setShowNukeAllConfirm(true)}
            className="text-danger"
          >
            💣 Nuke All Data
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {/* Nuke Regions Confirmation */}
      <Modal show={showNukeRegionsConfirm} onHide={() => setShowNukeRegionsConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete All Regions?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-warning">
            <strong>Warning:</strong> This will permanently delete all regions in all worlds.
          </p>
          <p>You currently have <strong>{allRegions.length} region(s)</strong>.</p>
          <p>This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNukeRegionsConfirm(false)}>
            Cancel
          </Button>
          <Button variant="warning" onClick={handleNukeRegions}>
            Delete All Regions
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Nuke All Data Confirmation */}
      <Modal show={showNukeAllConfirm} onHide={() => setShowNukeAllConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Everything?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-danger">
            <strong>DANGER:</strong> This will permanently delete ALL data including:
          </p>
          <ul>
            <li>All worlds ({worlds.length})</li>
            <li>All regions ({allRegions.length})</li>
            <li>All preferences and settings</li>
          </ul>
          <p><strong>This action cannot be undone.</strong></p>
          <p>The page will refresh after deletion.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNukeAllConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleNukeAll}>
            Delete Everything
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SettingsMenu;
