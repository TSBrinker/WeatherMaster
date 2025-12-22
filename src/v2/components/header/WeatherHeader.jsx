import React, { useState } from 'react';
import { Container, Button } from 'react-bootstrap';
import HamburgerMenu from '../menu/HamburgerMenu';
import './WeatherHeader.css';

/**
 * WeatherHeader - iOS Weather-inspired header
 * Time display + controls (<<, <, >, >>) + Hamburger menu on RIGHT
 */
const WeatherHeader = ({
  currentDate,
  onAdvanceTime,
  regions,
  activeRegion,
  onSelectRegion,
  onAddLocation,
  worldName
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // Format date for display
  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthName = months[dateObj.month - 1];
    const day = dateObj.day;
    const hour = dateObj.hour % 12 || 12;
    const period = dateObj.hour >= 12 ? 'PM' : 'AM';

    return `${hour}:00 ${period} • ${monthName} ${day}`;
  };

  return (
    <>
      <div className="weather-header">
        <Container fluid>
          <div className="header-row">
            {/* Time display - center */}
            <div className="time-display-section">
              <div className="current-time">
                {formatDate(currentDate)}
              </div>
            </div>

            {/* Time controls - center below time */}
            <div className="time-controls-section">
              <Button
                variant="link"
                className="time-control-btn"
                onClick={() => onAdvanceTime(-4)}
                title="Back 4 hours"
              >
                ≪
              </Button>
              <Button
                variant="link"
                className="time-control-btn"
                onClick={() => onAdvanceTime(-1)}
                title="Back 1 hour"
              >
                ‹
              </Button>
              <Button
                variant="link"
                className="time-control-btn"
                onClick={() => onAdvanceTime(1)}
                title="Forward 1 hour"
              >
                ›
              </Button>
              <Button
                variant="link"
                className="time-control-btn"
                onClick={() => onAdvanceTime(4)}
                title="Forward 4 hours"
              >
                ≫
              </Button>
            </div>

            {/* Hamburger menu - RIGHT */}
            <Button
              variant="link"
              className="hamburger-toggle"
              onClick={() => setShowMenu(true)}
            >
              ☰
            </Button>
          </div>
        </Container>
      </div>

      {/* Hamburger menu offcanvas */}
      <HamburgerMenu
        show={showMenu}
        onHide={() => setShowMenu(false)}
        regions={regions}
        activeRegion={activeRegion}
        onSelectRegion={onSelectRegion}
        onAddLocation={onAddLocation}
        worldName={worldName}
      />
    </>
  );
};

export default WeatherHeader;
