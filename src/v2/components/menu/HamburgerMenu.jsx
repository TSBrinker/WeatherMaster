import React, { useState } from 'react';
import { Offcanvas, ListGroup, Button } from 'react-bootstrap';
import { HiLocationMarker } from 'react-icons/hi';
import SettingsMenu from './SettingsMenu';
import './HamburgerMenu.css';

/**
 * HamburgerMenu - Full-screen location list with settings
 * iOS Weather-inspired navigation
 */
const HamburgerMenu = ({ show, onHide, regions, activeRegion, onSelectRegion, onAddLocation, worldName }) => {
  const [showSettings, setShowSettings] = useState(false);

  const handleClose = () => {
    setShowSettings(false); // Reset settings state when menu closes
    onHide();
  };

  const handleRegionClick = (regionId) => {
    onSelectRegion(regionId);
    handleClose();
  };

  return (
    <>
      <Offcanvas show={show} onHide={handleClose} placement="end" className="hamburger-menu-offcanvas">
        <Offcanvas.Header closeButton className="hamburger-header">
          <Offcanvas.Title>Locations</Offcanvas.Title>
          <Button
            variant="link"
            className="settings-trigger"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⋯
          </Button>
        </Offcanvas.Header>

        <Offcanvas.Body className="hamburger-body">
          {/* Settings panel (slide down when active) */}
          {showSettings && (
            <div className="settings-panel mb-3">
              <SettingsMenu inline={true} />
            </div>
          )}

          {/* World name */}
          <div className="world-header">
            <small className="text-muted"><HiLocationMarker /> {worldName}</small>
          </div>

          {/* Locations list */}
          <ListGroup variant="flush" className="location-list">
            {regions && regions.length > 0 ? (
              regions.map(region => (
                <ListGroup.Item
                  key={region.id}
                  action
                  active={activeRegion?.id === region.id}
                  onClick={() => handleRegionClick(region.id)}
                  className="location-list-item"
                >
                  <div className="location-item-content">
                    <div className="location-item-name">{region.name}</div>
                    <div className="location-item-info">
                      {region.latitudeBand}
                      {region.climate?.name && (
                        <span className="ms-2 text-muted">• {region.climate.name}</span>
                      )}
                    </div>
                  </div>
                  {activeRegion?.id === region.id && (
                    <div className="active-indicator">✓</div>
                  )}
                </ListGroup.Item>
              ))
            ) : (
              <div className="no-locations text-center py-5">
                <p className="text-muted">No locations yet</p>
              </div>
            )}
          </ListGroup>

          {/* Add location button */}
          <div className="add-location-footer">
            <Button
              variant="outline-primary"
              className="w-100"
              onClick={() => {
                onAddLocation();
                handleClose();
              }}
            >
              + Add Location
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default HamburgerMenu;
