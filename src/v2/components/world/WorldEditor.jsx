import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useWorld } from '../../contexts/WorldContext';

/**
 * WorldEditor - Modal for editing the active world's name
 * Simple modal that allows renaming the current world
 */
const WorldEditor = ({ show, onHide }) => {
  const { activeWorld, updateWorld } = useWorld();

  const [worldName, setWorldName] = useState('');

  // Initialize form when modal opens
  useEffect(() => {
    if (show && activeWorld) {
      setWorldName(activeWorld.name || '');
    }
  }, [show, activeWorld]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!worldName.trim()) {
      alert('Please enter a world name');
      return;
    }

    updateWorld(activeWorld.id, { name: worldName.trim() });
    onHide();
  };

  if (!activeWorld) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit World</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>World Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Forgotten Realms, Eberron, My Campaign"
              value={worldName}
              onChange={(e) => setWorldName(e.target.value)}
              autoFocus
            />
            <Form.Text className="text-muted">
              The name of your campaign world
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default WorldEditor;
