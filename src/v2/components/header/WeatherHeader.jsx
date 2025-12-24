import React, { useState } from 'react';
import { Container, Button, Modal, Form, Row, Col } from 'react-bootstrap';
import HamburgerMenu from '../menu/HamburgerMenu';
import SunriseSunsetService from '../../services/celestial/SunriseSunsetService';
import './WeatherHeader.css';

/**
 * WeatherHeader - iOS Weather-inspired header
 * Redesigned with date line, hero time display, and floating menu
 */
const WeatherHeader = ({
  currentDate,
  onAdvanceTime,
  onSetDate,
  regions,
  activeRegion,
  onSelectRegion,
  onAddLocation,
  worldName
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState({ month: 1, day: 1, hour: 12 });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Format compact date (e.g., "Jan 14")
  const formatCompactDate = (dateObj) => {
    if (!dateObj) return '';
    return `${shortMonths[dateObj.month - 1]} ${dateObj.day}`;
  };

  // Format time for hero display (e.g., "11:00 AM")
  const formatHeroTime = (dateObj) => {
    if (!dateObj) return '';
    const hour = dateObj.hour % 12 || 12;
    const period = dateObj.hour >= 12 ? 'PM' : 'AM';
    return `${hour}:00 ${period}`;
  };

  // Get next sun event (sunrise or sunset)
  const getNextSunEvent = (dateObj) => {
    if (!dateObj || !activeRegion) return null;

    try {
      const latitudeBand = activeRegion.latitudeBand || 'temperate';
      const sunData = SunriseSunsetService.getSunriseSunset(latitudeBand, dateObj);

      if (sunData.isPermanentNight) return null;

      const currentHour = dateObj.hour;

      // Determine next event
      if (sunData.sunriseHour !== null && currentHour < sunData.sunriseHour) {
        return {
          type: 'Sunrise',
          time: SunriseSunsetService.formatHour(sunData.sunriseHour)
        };
      } else if (sunData.sunsetHour !== null && currentHour < sunData.sunsetHour) {
        return {
          type: 'Sunset',
          time: SunriseSunsetService.formatHour(sunData.sunsetHour)
        };
      } else if (sunData.sunriseHour !== null) {
        // After sunset, next event is tomorrow's sunrise
        return {
          type: 'Sunrise',
          time: SunriseSunsetService.formatHour(sunData.sunriseHour)
        };
      }

      return null;
    } catch (e) {
      return null;
    }
  };

  const nextEvent = getNextSunEvent(currentDate);

  // Open date picker with current values
  const openDatePicker = () => {
    if (currentDate) {
      setPickerDate({
        month: currentDate.month,
        day: currentDate.day,
        hour: currentDate.hour
      });
    }
    setShowDatePicker(true);
  };

  // Handle date picker submission
  const handleDateSubmit = () => {
    if (onSetDate) {
      onSetDate(pickerDate);
    }
    setShowDatePicker(false);
  };

  return (
    <>
      <div className="weather-header">
        <Container fluid>
          <div className="header-row">
            {/* Date line - top */}
            <div className="date-line">
              <span className="compact-date">{formatCompactDate(currentDate)}</span>
              {nextEvent && (
                <>
                  <span className="date-separator">•</span>
                  <span className="next-event">{nextEvent.type} {nextEvent.time}</span>
                </>
              )}
            </div>

            {/* Time row - hero time with controls */}
            <div className="time-row">
              <div className="time-controls-left">
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
              </div>

              <div
                className="time-display-hero"
                onClick={openDatePicker}
                title="Click to set date/time"
              >
                {formatHeroTime(currentDate)}
              </div>

              <div className="time-controls-right">
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
            </div>
          </div>
        </Container>
      </div>

      {/* Floating hamburger menu button */}
      <Button
        variant="link"
        className="hamburger-toggle"
        onClick={() => setShowMenu(true)}
      >
        ☰
      </Button>

      {/* Date Picker Modal */}
      <Modal
        show={showDatePicker}
        onHide={() => setShowDatePicker(false)}
        centered
        className="date-picker-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Set Date & Time</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col xs={6}>
              <Form.Group>
                <Form.Label>Month</Form.Label>
                <Form.Select
                  value={pickerDate.month}
                  onChange={(e) => setPickerDate({ ...pickerDate, month: parseInt(e.target.value) })}
                >
                  {months.map((month, idx) => (
                    <option key={idx} value={idx + 1}>{month}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group>
                <Form.Label>Day</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  max={30}
                  value={pickerDate.day}
                  onChange={(e) => setPickerDate({ ...pickerDate, day: parseInt(e.target.value) || 1 })}
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Hour (0-23)</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  max={23}
                  value={pickerDate.hour}
                  onChange={(e) => setPickerDate({ ...pickerDate, hour: parseInt(e.target.value) || 0 })}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDatePicker(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleDateSubmit}>
            Set Date
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
