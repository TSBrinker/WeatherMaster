import React, { useState } from 'react';
import { Container, Button, Modal, Form, Row, Col } from 'react-bootstrap';
import HamburgerMenu from '../menu/HamburgerMenu';
import './WeatherHeader.css';

/**
 * WeatherHeader - iOS Lock Screen-inspired header
 * Large time display + compact date with next celestial event
 * Click time to open date picker modal
 */
const WeatherHeader = ({
  currentDate,
  onAdvanceTime,
  onJumpToDate,
  regions,
  activeRegion,
  onSelectRegion,
  onAddLocation,
  worldName,
  celestialData
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [jumpYear, setJumpYear] = useState(currentDate?.year || 1);
  const [jumpMonth, setJumpMonth] = useState(currentDate?.month || 1);
  const [jumpDay, setJumpDay] = useState(currentDate?.day || 1);
  const [jumpHour, setJumpHour] = useState(currentDate?.hour || 12);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Format large time display (e.g., "2:00 PM")
  const formatTime = (dateObj) => {
    if (!dateObj) return '';
    const hour = dateObj.hour % 12 || 12;
    const period = dateObj.hour >= 12 ? 'PM' : 'AM';
    return `${hour}:00 ${period}`;
  };

  // Format compact date (e.g., "Mar 15")
  const formatCompactDate = (dateObj) => {
    if (!dateObj) return '';
    return `${monthNames[dateObj.month - 1]} ${dateObj.day}`;
  };

  // Get next celestial event (sunrise or sunset)
  const getNextCelestialEvent = () => {
    if (!celestialData || !currentDate) return null;

    const { sunriseTime, sunsetTime } = celestialData;
    if (!sunriseTime || !sunsetTime) return null;

    // Parse times like "6:42 AM" to hour
    const parseTime = (timeStr) => {
      if (!timeStr || timeStr === 'Never' || timeStr === 'Always') return null;
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let hour = parseInt(match[1]);
      const period = match[3].toUpperCase();
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      return hour;
    };

    const sunriseHour = parseTime(sunriseTime);
    const sunsetHour = parseTime(sunsetTime);
    const currentHour = currentDate.hour;

    // Determine which event is next
    if (sunriseHour !== null && currentHour < sunriseHour) {
      return `Sunrise ${sunriseTime}`;
    } else if (sunsetHour !== null && currentHour < sunsetHour) {
      return `Sunset ${sunsetTime}`;
    } else if (sunriseHour !== null) {
      return `Sunrise ${sunriseTime}`; // Tomorrow's sunrise
    }
    return null;
  };

  const nextEvent = getNextCelestialEvent();

  // Open date picker with current values
  const handleOpenDatePicker = () => {
    setJumpYear(currentDate?.year || 1);
    setJumpMonth(currentDate?.month || 1);
    setJumpDay(currentDate?.day || 1);
    setJumpHour(currentDate?.hour || 12);
    setShowDatePicker(true);
  };

  // Handle jump to selected date
  const handleJumpToDate = () => {
    if (onJumpToDate) {
      onJumpToDate(jumpYear, jumpMonth, jumpDay, jumpHour);
    }
    setShowDatePicker(false);
  };

  return (
    <>
      <div className="weather-header">
        <Container fluid>
          <div className="header-row">
            {/* Compact date line with next celestial event */}
            <div className="date-line">
              <span className="compact-date">{formatCompactDate(currentDate)}</span>
              {nextEvent && (
                <>
                  <span className="date-separator">•</span>
                  <span className="next-event">{nextEvent}</span>
                </>
              )}
            </div>

            {/* Time row: arrows flanking the time */}
            <div className="time-row">
              {/* Left arrows (back) */}
              <div className="time-controls-left">
                <Button
                  variant="link"
                  className="time-control-btn"
                  onClick={() => onAdvanceTime(-4)}
                >
                  &#x226A;
                </Button>
                <Button
                  variant="link"
                  className="time-control-btn"
                  onClick={() => onAdvanceTime(-1)}
                >
                  &#x2039;
                </Button>
              </div>

              {/* Large time display - clickable */}
              <div
                className="time-display-hero"
                onClick={handleOpenDatePicker}
                title="Click to jump to date"
              >
                {formatTime(currentDate)}
              </div>

              {/* Right arrows (forward) */}
              <div className="time-controls-right">
                <Button
                  variant="link"
                  className="time-control-btn"
                  onClick={() => onAdvanceTime(1)}
                >
                  &#x203A;
                </Button>
                <Button
                  variant="link"
                  className="time-control-btn"
                  onClick={() => onAdvanceTime(4)}
                >
                  &#x226B;
                </Button>
              </div>
            </div>

            {/* Hamburger menu - RIGHT */}
            <Button
              variant="link"
              className="hamburger-toggle"
              onClick={() => setShowMenu(true)}
            >
              &#x2630;
            </Button>
          </div>
        </Container>
      </div>

      {/* Date Picker Modal */}
      <Modal
        show={showDatePicker}
        onHide={() => setShowDatePicker(false)}
        centered
        className="date-picker-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Jump to Date & Time</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col xs={6} md={3}>
              <Form.Group>
                <Form.Label>Year</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={jumpYear}
                  onChange={(e) => setJumpYear(parseInt(e.target.value) || 1)}
                />
              </Form.Group>
            </Col>
            <Col xs={6} md={3}>
              <Form.Group>
                <Form.Label>Month</Form.Label>
                <Form.Select
                  value={jumpMonth}
                  onChange={(e) => setJumpMonth(parseInt(e.target.value))}
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx} value={idx + 1}>{name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={6} md={3}>
              <Form.Group>
                <Form.Label>Day</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="30"
                  value={jumpDay}
                  onChange={(e) => setJumpDay(parseInt(e.target.value) || 1)}
                />
              </Form.Group>
            </Col>
            <Col xs={6} md={3}>
              <Form.Group>
                <Form.Label>Hour</Form.Label>
                <Form.Select
                  value={jumpHour}
                  onChange={(e) => setJumpHour(parseInt(e.target.value))}
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const displayHour = i % 12 || 12;
                    const period = i >= 12 ? 'PM' : 'AM';
                    return (
                      <option key={i} value={i}>{displayHour}:00 {period}</option>
                    );
                  })}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDatePicker(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleJumpToDate}>
            Jump to Date
          </Button>
        </Modal.Footer>
      </Modal>

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
