import React, { useState, useRef, useEffect } from 'react';
import { Container, Button, Modal } from 'react-bootstrap';
import { WiSunrise, WiSunset } from 'react-icons/wi';
import CelestialTrackDisplay from './CelestialTrackDisplay';
import './WeatherHeader.css';

/**
 * ScrollWheelInner - Just the scrollable part (no container/label)
 */
const ScrollWheelInner = ({ items, value, onChange }) => {
  const containerRef = useRef(null);
  const itemHeight = 40;
  const visibleItems = 5;

  const selectedIndex = items.findIndex(item => item.value === value);

  useEffect(() => {
    if (containerRef.current && selectedIndex >= 0) {
      const scrollTop = selectedIndex * itemHeight;
      containerRef.current.scrollTop = scrollTop;
    }
  }, [selectedIndex, itemHeight]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    if (items[clampedIndex] && items[clampedIndex].value !== value) {
      onChange(items[clampedIndex].value);
    }
  };

  return (
    <div
      ref={containerRef}
      className="scroll-wheel"
      onScroll={handleScroll}
      style={{ height: itemHeight * visibleItems }}
    >
      <div style={{ height: itemHeight * 2 }} />
      {items.map((item, index) => (
        <div
          key={index}
          className={`scroll-wheel-item ${item.value === value ? 'selected' : ''}`}
          style={{ height: itemHeight }}
          onClick={() => {
            onChange(item.value);
            if (containerRef.current) {
              containerRef.current.scrollTo({
                top: index * itemHeight,
                behavior: 'smooth'
              });
            }
          }}
        >
          {item.label}
        </div>
      ))}
      <div style={{ height: itemHeight * 2 }} />
    </div>
  );
};

/**
 * ScrollWheel - iOS-style scroll picker component (with container and label)
 */
const ScrollWheel = ({ items, value, onChange, label }) => {
  return (
    <div className="scroll-wheel-container">
      {label && <div className="scroll-wheel-label">{label}</div>}
      <div className="scroll-wheel-wrapper">
        <div className="scroll-wheel-highlight" />
        <ScrollWheelInner items={items} value={value} onChange={onChange} />
      </div>
    </div>
  );
};

/**
 * WeatherHeader - Compact mobile-first header
 * Time on left with +1/+4 buttons, date on right with sunrise/sunset
 * Tap time for time picker modal, tap date for date picker modal
 */
const WeatherHeader = ({
  currentDate,
  onAdvanceTime,
  onJumpToDate,
  celestialData,
}) => {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Time picker state - stores offset in hours from current time (-24 to +24)
  const [pickTimeOffset, setPickTimeOffset] = useState(0);

  // Date picker state
  const [pickYear, setPickYear] = useState(currentDate?.year || 1);
  const [pickMonth, setPickMonth] = useState(currentDate?.month || 1);
  const [pickDay, setPickDay] = useState(currentDate?.day || 1);
  const [yearInputMode, setYearInputMode] = useState(false); // Toggle between scroll wheel and text input

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Format time display (e.g., "2:00 PM")
  const formatTime = (dateObj) => {
    if (!dateObj) return '';
    const hour = dateObj.hour % 12 || 12;
    const period = dateObj.hour >= 12 ? 'PM' : 'AM';
    return `${hour}:00 ${period}`;
  };

  // Format compact date (e.g., "Feb 4")
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

  // Get sunrise/sunset info for display
  const getSunInfo = () => {
    if (!celestialData || !currentDate) return null;
    const { sunriseTime, sunsetTime } = celestialData;
    if (!sunriseTime || !sunsetTime) return null;

    const sunriseHour = parseTime(sunriseTime);
    const sunsetHour = parseTime(sunsetTime);
    const currentHour = currentDate.hour;

    // Show next event: sunrise if before sunrise, sunset if after sunrise but before sunset
    if (sunriseHour !== null && currentHour < sunriseHour) {
      return { type: 'sunrise', time: sunriseTime, hour: sunriseHour };
    } else if (sunsetHour !== null && currentHour < sunsetHour) {
      return { type: 'sunset', time: sunsetTime, hour: sunsetHour };
    } else {
      // After sunset, show tomorrow's sunrise
      return { type: 'sunrise', time: sunriseTime, hour: sunriseHour, tomorrow: true };
    }
  };

  const sunInfo = getSunInfo();

  // Jump to sun event
  const handleJumpToSunEvent = () => {
    if (sunInfo && onAdvanceTime) {
      let hoursToJump = sunInfo.hour - currentDate.hour;
      if (sunInfo.tomorrow) hoursToJump += 24;
      onAdvanceTime(hoursToJump);
    }
  };

  // Open time picker
  const handleOpenTimePicker = () => {
    setPickTimeOffset(0); // Start at current time
    setShowTimePicker(true);
  };

  // Open date picker
  const handleOpenDatePicker = () => {
    setPickYear(currentDate?.year || 1);
    setPickMonth(currentDate?.month || 1);
    setPickDay(currentDate?.day || 1);
    setYearInputMode(false); // Reset to scroll wheel mode
    setShowDatePicker(true);
  };

  // Apply time selection - uses offset to advance/rewind time
  const handleApplyTime = () => {
    if (onAdvanceTime && pickTimeOffset !== 0) {
      onAdvanceTime(pickTimeOffset);
    }
    setShowTimePicker(false);
  };

  // Apply date selection
  const handleApplyDate = () => {
    if (onJumpToDate) {
      onJumpToDate(pickYear, pickMonth, pickDay, currentDate.hour);
    }
    setShowDatePicker(false);
  };

  // Generate hour items for scroll wheel: 48 hours centered on current time (-24 to +23)
  const hourItems = Array.from({ length: 48 }, (_, i) => {
    const offset = i - 24; // -24 to +23
    const targetHour = ((currentDate?.hour || 0) + offset + 24) % 24;
    const displayHour = targetHour % 12 || 12;
    const period = targetHour >= 12 ? 'PM' : 'AM';

    // Calculate day offset for label
    const dayOffset = Math.floor(((currentDate?.hour || 0) + offset) / 24);
    let dayLabel = '';
    if (dayOffset === -1) dayLabel = ' (yesterday)';
    else if (dayOffset === 1) dayLabel = ' (tomorrow)';

    return { value: offset, label: `${displayHour}:00 ${period}${dayLabel}` };
  });

  // Generate year items centered around current year (±50 years, minimum 1)
  const baseYear = Math.max(1, (currentDate?.year || 1) - 50);
  const yearItems = Array.from({ length: 100 }, (_, i) => ({
    value: baseYear + i,
    label: `${baseYear + i}`
  }));

  // Generate month items
  const monthItems = monthNames.map((name, i) => ({
    value: i + 1,
    label: name
  }));

  // Generate day items (1-30 for simplicity)
  const dayItems = Array.from({ length: 30 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}`
  }));

  return (
    <>
      <div className="weather-header">
        <Container fluid>
          {/* Compact top bar: time on left, date on right */}
          <div className="compact-header-row">
            {/* Left side: Time + forward controls */}
            <div className="header-left">
              <button
                className="time-display"
                onClick={handleOpenTimePicker}
                title="Tap to change time"
              >
                {formatTime(currentDate)}
              </button>
              <div className="quick-controls">
                <button
                  className="quick-btn"
                  onClick={() => onAdvanceTime(1)}
                  title="Forward 1 hour"
                >
                  +1
                </button>
                <button
                  className="quick-btn"
                  onClick={() => onAdvanceTime(4)}
                  title="Forward 4 hours"
                >
                  +4
                </button>
              </div>
            </div>

            {/* Right side: Date + sunrise/sunset */}
            <div className="header-right">
              <button
                className="date-display"
                onClick={handleOpenDatePicker}
                title="Tap to change date"
              >
                {formatCompactDate(currentDate)}
              </button>
              {sunInfo && (
                <button
                  className="sun-event"
                  onClick={handleJumpToSunEvent}
                  title={`Jump to ${sunInfo.type}`}
                >
                  {sunInfo.type === 'sunrise' ? <WiSunrise /> : <WiSunset />}
                  <span className="sun-time">{sunInfo.time}</span>
                </button>
              )}
            </div>
          </div>

          {/* Celestial Track Display - sun/moon positions */}
          <CelestialTrackDisplay
            currentDate={currentDate}
            celestialData={celestialData}
          />
        </Container>
      </div>

      {/* Time Picker Modal with Scroll Wheel */}
      <Modal
        show={showTimePicker}
        onHide={() => setShowTimePicker(false)}
        centered
        className="picker-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Select Time</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="scroll-wheel-row">
            <ScrollWheel
              items={hourItems}
              value={pickTimeOffset}
              onChange={setPickTimeOffset}
            />
          </div>
          {/* Quick hour adjustments - these adjust the selected offset */}
          <div className="picker-quick-controls">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setPickTimeOffset(Math.max(-24, pickTimeOffset - 4))}
            >
              -4h
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setPickTimeOffset(Math.max(-24, pickTimeOffset - 1))}
            >
              -1h
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setPickTimeOffset(Math.min(23, pickTimeOffset + 1))}
            >
              +1h
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setPickTimeOffset(Math.min(23, pickTimeOffset + 4))}
            >
              +4h
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTimePicker(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApplyTime}>
            Set Time
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Date Picker Modal with Scroll Wheels */}
      <Modal
        show={showDatePicker}
        onHide={() => setShowDatePicker(false)}
        centered
        className="picker-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Select Date</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="scroll-wheel-row multi">
            <ScrollWheel
              items={monthItems}
              value={pickMonth}
              onChange={setPickMonth}
              label="Month"
            />
            <ScrollWheel
              items={dayItems}
              value={pickDay}
              onChange={setPickDay}
              label="Day"
            />
            {/* Year: toggle between scroll wheel and text input */}
            <div className="scroll-wheel-container">
              <button
                className="scroll-wheel-label scroll-wheel-label-clickable"
                onClick={() => setYearInputMode(!yearInputMode)}
                title={yearInputMode ? "Switch to scroll wheel" : "Switch to text input"}
              >
                Year {yearInputMode ? '▼' : '⌨'}
              </button>
              {yearInputMode ? (
                <div className="year-input-wrapper">
                  <input
                    type="number"
                    className="year-input"
                    value={pickYear}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setPickYear(Math.max(1, val));
                    }}
                    min="1"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="scroll-wheel-wrapper">
                  <div className="scroll-wheel-highlight" />
                  <ScrollWheelInner
                    items={yearItems}
                    value={pickYear}
                    onChange={setPickYear}
                  />
                </div>
              )}
            </div>
          </div>
          {/* Quick day adjustments */}
          <div className="picker-quick-controls">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => onAdvanceTime(-24)}
            >
              -1 Day
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => onAdvanceTime(24)}
            >
              +1 Day
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDatePicker(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApplyDate}>
            Set Date
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default WeatherHeader;
