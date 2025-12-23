import React, { useState } from 'react';
import { Dropdown, Modal, Button, Form } from 'react-bootstrap';
import { FaTrash, FaBomb } from 'react-icons/fa';
import { Cloud, Shield, RefreshCw } from 'lucide-react';
import { useWorld } from '../../contexts/WorldContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import WeatherPrimerModal from '../modals/WeatherPrimerModal';
import GameplayMechanicsModal from '../modals/GameplayMechanicsModal';
import weatherService from '../../services/weather/WeatherService';
import { getPhrasingExample } from '../../utils/conditionPhrasing';

/**
 * Settings Menu - Dangerous operations + educational resources
 * Provides access to data deletion functions and help modals
 */
const SettingsMenu = ({ inline = false }) => {
  const { worlds, deleteRegion, deleteWorld } = useWorld();
  const { conditionPhrasing, setConditionPhrasing } = usePreferences();
  const [showNukeRegionsConfirm, setShowNukeRegionsConfirm] = useState(false);
  const [showNukeAllConfirm, setShowNukeAllConfirm] = useState(false);
  const [showWeatherPrimer, setShowWeatherPrimer] = useState(false);
  const [showGameplayMechanics, setShowGameplayMechanics] = useState(false);

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

  const handleClearWeatherCache = () => {
    weatherService.clearCache();
    alert('Weather cache cleared! Weather will regenerate on next view.');
    // Force a page reload to ensure fresh weather data
    window.location.reload();
  };

  // If inline (used in hamburger menu), show menu items directly
  if (inline) {
    return (
      <>
        <div className="settings-inline">
          <h6 className="mb-3">Help & Resources</h6>
          <div className="d-grid gap-2 mb-3">
            <Button
              variant="outline-info"
              onClick={() => setShowWeatherPrimer(true)}
            >
              <Cloud size={16} className="me-2" style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
              Weather Primer
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => setShowGameplayMechanics(true)}
            >
              <Shield size={16} className="me-2" style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
              Gameplay Mechanics
            </Button>
          </div>

          <h6 className="mb-3 mt-4">Settings</h6>
          <div className="d-grid gap-2 mb-3">
            <div className="phrasing-toggle mb-2">
              <Form.Label className="mb-1">Condition Phrasing</Form.Label>
              <Form.Select
                size="sm"
                value={conditionPhrasing}
                onChange={(e) => setConditionPhrasing(e.target.value)}
              >
                <option value="standard">Standard (Mist, Heavy Rain)</option>
                <option value="descriptive">Descriptive (Misty, Raining Heavily)</option>
              </Form.Select>
              <Form.Text className="text-muted">
                {getPhrasingExample(conditionPhrasing)}
              </Form.Text>
            </div>
            <Button
              variant="outline-secondary"
              onClick={handleClearWeatherCache}
            >
              <RefreshCw size={16} className="me-2" style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
              Clear Weather Cache
            </Button>
          </div>

          <h6 className="mb-3 mt-4">Danger Zone</h6>
          <div className="d-grid gap-2">
            <Button
              variant="outline-warning"
              onClick={() => setShowNukeRegionsConfirm(true)}
            >
              <FaTrash /> Nuke All Regions
            </Button>
            <Button
              variant="outline-danger"
              onClick={() => setShowNukeAllConfirm(true)}
            >
              <FaBomb /> Nuke All Data
            </Button>
          </div>
        </div>

        {/* Educational Modals */}
        <WeatherPrimerModal
          show={showWeatherPrimer}
          onHide={() => setShowWeatherPrimer(false)}
        />
        <GameplayMechanicsModal
          show={showGameplayMechanics}
          onHide={() => setShowGameplayMechanics(false)}
        />

        {/* Confirmation Modals */}
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
  }

  // Default dropdown version
  return (
    <>
      <Dropdown align="end">
        <Dropdown.Toggle variant="link" className="settings-toggle">
          ⋯
        </Dropdown.Toggle>

        <Dropdown.Menu className="settings-menu">
          <Dropdown.Header>Help & Resources</Dropdown.Header>
          <Dropdown.Item onClick={() => setShowWeatherPrimer(true)}>
            <Cloud size={16} className="me-2" style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
            Weather Primer
          </Dropdown.Item>
          <Dropdown.Item onClick={() => setShowGameplayMechanics(true)}>
            <Shield size={16} className="me-2" style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
            Gameplay Mechanics
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Header>Settings</Dropdown.Header>
          <Dropdown.Item
            onClick={() => setConditionPhrasing(conditionPhrasing === 'standard' ? 'descriptive' : 'standard')}
          >
            Phrasing: {conditionPhrasing === 'standard' ? 'Standard' : 'Descriptive'}
          </Dropdown.Item>
          <Dropdown.Item onClick={handleClearWeatherCache}>
            <RefreshCw size={16} className="me-2" style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
            Clear Weather Cache
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Header>Danger Zone</Dropdown.Header>
          <Dropdown.Item
            onClick={() => setShowNukeRegionsConfirm(true)}
            className="text-warning"
          >
            <FaTrash /> Nuke All Regions
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => setShowNukeAllConfirm(true)}
            className="text-danger"
          >
            <FaBomb /> Nuke All Data
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {/* Educational Modals */}
      <WeatherPrimerModal
        show={showWeatherPrimer}
        onHide={() => setShowWeatherPrimer(false)}
      />
      <GameplayMechanicsModal
        show={showGameplayMechanics}
        onHide={() => setShowGameplayMechanics(false)}
      />

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
