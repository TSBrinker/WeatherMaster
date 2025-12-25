import React, { useState, useMemo } from 'react';
import { ListGroup, Button, Form } from 'react-bootstrap';
import { HiLocationMarker } from 'react-icons/hi';
import { IoChevronBack } from 'react-icons/io5';
import SettingsMenu from './SettingsMenu';
import weatherService from '../../services/weather/WeatherService';
import './HamburgerMenu.css';

/**
 * HamburgerMenu - Full-screen location list with settings
 * iOS Weather-inspired navigation with live weather preview
 * Includes edit mode for bulk region deletion
 *
 * Now renders as a full-page overlay instead of an Offcanvas.
 * Users exit by selecting a location (no close X button).
 */
const HamburgerMenu = ({ show, onHide, regions, activeRegion, onSelectRegion, onAddLocation, onDeleteRegions, worldName, currentDate }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState(new Set());

  // Get weather data for all regions (memoized to avoid recalculating on every render)
  const regionWeather = useMemo(() => {
    if (!regions || !currentDate) return {};

    const weatherMap = {};
    regions.forEach(region => {
      try {
        // Get current weather
        const weather = weatherService.getCurrentWeather(region, currentDate);

        // Calculate daily high/low by sampling all 24 hours
        const temps = [];
        for (let hour = 0; hour < 24; hour++) {
          const hourDate = { ...currentDate, hour };
          const hourWeather = weatherService.getCurrentWeather(region, hourDate);
          temps.push(hourWeather.temperature);
        }

        weatherMap[region.id] = {
          temp: Math.round(weather.temperature),
          condition: weather.condition,
          high: Math.round(Math.max(...temps)),
          low: Math.round(Math.min(...temps))
        };
      } catch (e) {
        // If weather fails to load, just skip it
        weatherMap[region.id] = null;
      }
    });
    return weatherMap;
  }, [regions, currentDate, show]); // Recalculate when menu opens

  const resetMenuState = () => {
    setShowSettings(false);
    setEditMode(false);
    setSelectedRegions(new Set());
  };

  const handleRegionClick = (regionId) => {
    if (editMode) {
      // In edit mode, toggle selection
      setSelectedRegions(prev => {
        const next = new Set(prev);
        if (next.has(regionId)) {
          next.delete(regionId);
        } else {
          next.add(regionId);
        }
        return next;
      });
    } else {
      onSelectRegion(regionId);
      resetMenuState();
      onHide();
    }
  };

  // Back button - only enabled when there's an active region to go back to
  const handleBack = () => {
    if (activeRegion) {
      resetMenuState();
      onHide();
    }
  };

  const handleSelectAll = () => {
    if (selectedRegions.size === regions.length) {
      // Deselect all
      setSelectedRegions(new Set());
    } else {
      // Select all
      setSelectedRegions(new Set(regions.map(r => r.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedRegions.size === 0) return;

    const count = selectedRegions.size;
    const confirmMessage = count === 1
      ? 'Delete this region?'
      : `Delete ${count} regions?`;

    if (window.confirm(confirmMessage)) {
      // Delete each selected region
      selectedRegions.forEach(regionId => {
        onDeleteRegions(regionId);
      });
      setSelectedRegions(new Set());
      setEditMode(false);
    }
  };

  const enterEditMode = () => {
    setShowSettings(false);
    setEditMode(true);
  };

  const exitEditMode = () => {
    setEditMode(false);
    setSelectedRegions(new Set());
  };

  if (!show) return null;

  return (
    <div className="locations-fullpage">
      {/* Header */}
      <div className="locations-header">
        <button
          className={`back-button ${!activeRegion ? 'disabled' : ''}`}
          onClick={handleBack}
          disabled={!activeRegion}
          aria-label="Back to weather"
        >
          <IoChevronBack />
        </button>
        <h1 className="locations-title">{editMode ? 'Edit Locations' : 'Locations'}</h1>
        {!editMode && (
          <Button
            variant="link"
            className="settings-trigger"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⋯
          </Button>
        )}
        {editMode && <div className="header-spacer" />}
      </div>

      {/* Settings panel (slide down when active) */}
      {showSettings && (
        <div className="settings-panel">
          {/* Edit List button at top of settings */}
          {regions && regions.length > 0 && (
            <Button
              variant="outline-secondary"
              className="w-100 mb-3"
              onClick={enterEditMode}
            >
              Edit List
            </Button>
          )}
          <SettingsMenu inline={true} />
        </div>
      )}

      {/* World name / Select All in edit mode */}
      <div className="world-header">
        {editMode ? (
          <Form.Check
            type="checkbox"
            id="select-all"
            label="Select All"
            checked={regions && selectedRegions.size === regions.length}
            onChange={handleSelectAll}
            className="select-all-check"
          />
        ) : (
          <small><HiLocationMarker /> {worldName}</small>
        )}
      </div>

      {/* Locations list */}
      <div className="locations-scroll-area">
        <ListGroup variant="flush" className="location-list">
          {regions && regions.length > 0 ? (
            regions.map(region => {
              const weather = regionWeather[region.id];
              const isSelected = selectedRegions.has(region.id);
              return (
                <ListGroup.Item
                  key={region.id}
                  action
                  active={!editMode && activeRegion?.id === region.id}
                  onClick={() => handleRegionClick(region.id)}
                  className={`location-list-item ${editMode ? 'edit-mode' : ''} ${isSelected ? 'selected' : ''}`}
                >
                  {editMode && (
                    <Form.Check
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="edit-checkbox"
                    />
                  )}
                  <div className="location-item-content">
                    <div className="location-item-name">
                      {region.name}
                      {!editMode && activeRegion?.id === region.id && (
                        <span className="active-indicator">✓</span>
                      )}
                    </div>
                    {weather && (
                      <div className="location-item-condition">{weather.condition}</div>
                    )}
                  </div>
                  {!editMode && weather && (
                    <div className="location-item-weather">
                      <div className="location-item-temp">{weather.temp}°</div>
                      <div className="location-item-highlow">
                        <span className="high">H:{weather.high}°</span>
                        {' '}
                        <span className="low">L:{weather.low}°</span>
                      </div>
                    </div>
                  )}
                </ListGroup.Item>
              );
            })
          ) : (
            <div className="no-locations">
              <p>No locations yet</p>
              <p className="no-locations-hint">Add your first location to get started</p>
            </div>
          )}
        </ListGroup>
      </div>

      {/* Footer: Add location OR edit mode actions */}
      <div className="add-location-footer">
        {editMode ? (
          <div className="edit-mode-actions">
            <Button
              variant="outline-secondary"
              onClick={exitEditMode}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteSelected}
              disabled={selectedRegions.size === 0}
            >
              Delete{selectedRegions.size > 0 ? ` (${selectedRegions.size})` : ''}
            </Button>
          </div>
        ) : (
          <Button
            variant="outline-primary"
            className="w-100"
            onClick={() => {
              onAddLocation();
              resetMenuState();
              onHide();
            }}
          >
            + Add Location
          </Button>
        )}
      </div>
    </div>
  );
};

export default HamburgerMenu;
