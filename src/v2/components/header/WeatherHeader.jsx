import React, { useState } from 'react';
import { Container, Button, Modal, Form, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { WiMoonNew, WiMoonWaxingCrescent3, WiMoonFirstQuarter, WiMoonWaxingGibbous3, WiMoonFull, WiMoonWaningGibbous3, WiMoonThirdQuarter, WiMoonWaningCrescent3 } from 'react-icons/wi';
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
  celestialData
}) => {
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

  // Get next celestial event (sunrise or sunset) with hour for jumping
  const getNextCelestialEvent = () => {
    if (!celestialData || !currentDate) return null;

    const { sunriseTime, sunsetTime } = celestialData;
    if (!sunriseTime || !sunsetTime) return null;

    const sunriseHour = parseTime(sunriseTime);
    const sunsetHour = parseTime(sunsetTime);
    const currentHour = currentDate.hour;

    // Determine which event is next
    if (sunriseHour !== null && currentHour < sunriseHour) {
      return { label: `Sunrise ${sunriseTime}`, hour: sunriseHour, isTomorrow: false };
    } else if (sunsetHour !== null && currentHour < sunsetHour) {
      return { label: `Sunset ${sunsetTime}`, hour: sunsetHour, isTomorrow: false };
    } else if (sunriseHour !== null) {
      return { label: `Sunrise ${sunriseTime}`, hour: sunriseHour, isTomorrow: true };
    }
    return null;
  };

  const nextEvent = getNextCelestialEvent();

  // Get moon icon based on phase
  const getMoonIcon = (phase) => {
    if (!phase) return <WiMoonNew />;
    const phaseLower = phase.toLowerCase();
    if (phaseLower.includes('new')) return <WiMoonNew />;
    if (phaseLower.includes('waxing crescent')) return <WiMoonWaxingCrescent3 />;
    if (phaseLower.includes('first quarter')) return <WiMoonFirstQuarter />;
    if (phaseLower.includes('waxing gibbous')) return <WiMoonWaxingGibbous3 />;
    if (phaseLower.includes('full')) return <WiMoonFull />;
    if (phaseLower.includes('waning gibbous')) return <WiMoonWaningGibbous3 />;
    if (phaseLower.includes('last quarter') || phaseLower.includes('third quarter')) return <WiMoonThirdQuarter />;
    if (phaseLower.includes('waning crescent')) return <WiMoonWaningCrescent3 />;
    return <WiMoonNew />;
  };

  // Determine if moon is currently visible (above horizon)
  const isMoonUp = () => {
    if (!celestialData || !currentDate) return false;
    const { moonriseTime, moonsetTime } = celestialData;

    // Handle special cases
    if (moonriseTime === 'Always' || moonsetTime === 'Never') return true;
    if (moonriseTime === 'Never' || moonsetTime === 'Always') return false;

    const moonriseHour = parseTime(moonriseTime);
    const moonsetHour = parseTime(moonsetTime);
    const currentHour = currentDate.hour;

    if (moonriseHour === null || moonsetHour === null) return false;

    // Moon can rise before or after it sets (depending on phase)
    if (moonriseHour < moonsetHour) {
      // Normal case: moonrise in morning, moonset in evening
      return currentHour >= moonriseHour && currentHour < moonsetHour;
    } else {
      // Moon rises in evening, sets next morning
      return currentHour >= moonriseHour || currentHour < moonsetHour;
    }
  };

  const moonVisible = isMoonUp();
  const moonPhase = celestialData?.moonPhase;

  // Jump to the next celestial event's hour
  const handleJumpToEvent = () => {
    if (nextEvent && onAdvanceTime) {
      let hoursToJump = nextEvent.hour - currentDate.hour;
      // If it's tomorrow's event, add 24 hours
      if (nextEvent.isTomorrow) {
        hoursToJump += 24;
      }
      onAdvanceTime(hoursToJump);
    }
  };

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
            {/* Compact date line with day-jump chevrons and moon indicator */}
            <div className="date-line">
              {/* Moon indicator */}
              {moonPhase && (
                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    <Tooltip id="moon-tooltip">
                      {moonPhase}{moonVisible ? ' (visible)' : ' (below horizon)'}
                    </Tooltip>
                  }
                >
                  <span className={`moon-indicator ${moonVisible ? 'moon-up' : 'moon-down'}`}>
                    {getMoonIcon(moonPhase)}
                  </span>
                </OverlayTrigger>
              )}
              <button
                className="day-chevron"
                onClick={() => onAdvanceTime(-24)}
                title="Back 1 day"
              >
                ‹
              </button>
              <span className="compact-date">{formatCompactDate(currentDate)}</span>
              {nextEvent && (
                <>
                  <span className="date-separator">•</span>
                  <button
                    className="next-event"
                    onClick={handleJumpToEvent}
                    title={`Jump to ${nextEvent.label}`}
                  >
                    {nextEvent.label}
                  </button>
                </>
              )}
              <button
                className="day-chevron"
                onClick={() => onAdvanceTime(24)}
                title="Forward 1 day"
              >
                ›
              </button>
            </div>

            {/* Time row: hour arrows flanking the time */}
            <div className="time-row">
              {/* Left arrows (back) */}
              <div className="time-controls-left">
                <Button
                  variant="link"
                  className="time-control-btn"
                  onClick={() => onAdvanceTime(-4)}
                  title="Back 4 hours"
                >
                  -4<span className="btn-unit">h</span>
                </Button>
                <Button
                  variant="link"
                  className="time-control-btn"
                  onClick={() => onAdvanceTime(-1)}
                  title="Back 1 hour"
                >
                  -1<span className="btn-unit">h</span>
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
                  title="Forward 1 hour"
                >
                  +1<span className="btn-unit">h</span>
                </Button>
                <Button
                  variant="link"
                  className="time-control-btn"
                  onClick={() => onAdvanceTime(4)}
                  title="Forward 4 hours"
                >
                  +4<span className="btn-unit">h</span>
                </Button>
              </div>
            </div>

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
          <div className="d-flex justify-content-between align-items-center w-100">
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => onAdvanceTime(-24)}
                title="Back 1 day"
              >
                -1 Day
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => onAdvanceTime(24)}
                title="Forward 1 day"
              >
                +1 Day
              </Button>
            </div>
            <div className="d-flex gap-2">
              <Button variant="secondary" onClick={() => setShowDatePicker(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleJumpToDate}>
                Jump to Date
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>

    </>
  );
};

export default WeatherHeader;
