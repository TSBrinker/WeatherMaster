import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Container } from 'react-bootstrap';
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
  const [showSunJumpConfirm, setShowSunJumpConfirm] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0, right: 0 });
  const sunEventButtonRef = useRef(null);
  const timeButtonRef = useRef(null);
  const dateButtonRef = useRef(null);

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

  // Format compact date (e.g., "Feb 4, 1024")
  const formatCompactDate = (dateObj) => {
    if (!dateObj) return '';
    return `${monthNames[dateObj.month - 1]} ${dateObj.day}, ${dateObj.year}`;
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

  // Jump to sun event - now shows confirmation first
  const handleSunEventClick = () => {
    // Calculate position for the portal-rendered popover
    if (sunEventButtonRef.current) {
      const rect = sunEventButtonRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + 8, // 8px below the button
        right: window.innerWidth - rect.right, // Align right edge with button
      });
    }
    setShowSunJumpConfirm(true);
  };

  const handleConfirmSunJump = () => {
    if (sunInfo && onAdvanceTime) {
      let hoursToJump = sunInfo.hour - currentDate.hour;
      if (sunInfo.tomorrow) hoursToJump += 24;
      onAdvanceTime(hoursToJump);
    }
    setShowSunJumpConfirm(false);
  };

  // Open time picker
  const handleOpenTimePicker = () => {
    if (timeButtonRef.current) {
      const rect = timeButtonRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + 8,
        left: rect.left,
        right: 0,
      });
    }
    setPickTimeOffset(0); // Start at current time
    setShowTimePicker(true);
  };

  // Open date picker
  const handleOpenDatePicker = () => {
    if (dateButtonRef.current) {
      const rect = dateButtonRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + 8,
        left: 0,
        right: window.innerWidth - rect.right,
      });
    }
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
    if (dayOffset <= -1) dayLabel = ' (yst)';
    else if (dayOffset >= 1) dayLabel = ' (tmw)';

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
                ref={timeButtonRef}
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
                ref={dateButtonRef}
                className="date-display"
                onClick={handleOpenDatePicker}
                title="Tap to change date"
              >
                {formatCompactDate(currentDate)}
              </button>
              {sunInfo && (
                <button
                  ref={sunEventButtonRef}
                  className="sun-event"
                  onClick={handleSunEventClick}
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

      {/* Time Picker Popover - Portaled to body */}
      {showTimePicker && createPortal(
        <>
          <div
            className="popover-overlay"
            onClick={() => setShowTimePicker(false)}
          />
          <div
            className="picker-popover"
            style={{
              top: popoverPosition.top,
              left: popoverPosition.left,
            }}
          >
            <div className="picker-popover-header">
              <span>Select Time</span>
              <button className="picker-close-btn" onClick={() => setShowTimePicker(false)}>✕</button>
            </div>
            <div className="scroll-wheel-row">
              <ScrollWheel
                items={hourItems}
                value={pickTimeOffset}
                onChange={setPickTimeOffset}
              />
            </div>
            <div className="picker-popover-actions">
              <button
                className="picker-action-btn"
                onClick={() => setPickTimeOffset(Math.max(-24, pickTimeOffset - 4))}
              >
                -4h
              </button>
              <button
                className="picker-action-btn"
                onClick={() => setPickTimeOffset(Math.max(-24, pickTimeOffset - 1))}
              >
                -1h
              </button>
              <button
                className="picker-action-btn"
                onClick={() => setPickTimeOffset(Math.min(23, pickTimeOffset + 1))}
              >
                +1h
              </button>
              <button
                className="picker-action-btn"
                onClick={() => setPickTimeOffset(Math.min(23, pickTimeOffset + 4))}
              >
                +4h
              </button>
            </div>
            <div className="picker-popover-footer">
              <button className="picker-cancel-btn" onClick={() => setShowTimePicker(false)}>
                Cancel
              </button>
              <button className="picker-confirm-btn" onClick={handleApplyTime}>
                Set Time
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Date Picker Popover - Portaled to body */}
      {showDatePicker && createPortal(
        <>
          <div
            className="popover-overlay"
            onClick={() => setShowDatePicker(false)}
          />
          <div
            className="picker-popover picker-popover-date"
            style={{
              top: popoverPosition.top,
              right: popoverPosition.right,
            }}
          >
            <div className="picker-popover-header">
              <span>Select Date</span>
              <button className="picker-close-btn" onClick={() => setShowDatePicker(false)}>✕</button>
            </div>
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
            <div className="picker-popover-actions">
              <button
                className="picker-action-btn"
                onClick={() => {
                  onAdvanceTime(-24);
                  setShowDatePicker(false);
                }}
              >
                -1 Day
              </button>
              <button
                className="picker-action-btn"
                onClick={() => {
                  onAdvanceTime(24);
                  setShowDatePicker(false);
                }}
              >
                +1 Day
              </button>
            </div>
            <div className="picker-popover-footer">
              <button className="picker-cancel-btn" onClick={() => setShowDatePicker(false)}>
                Cancel
              </button>
              <button className="picker-confirm-btn" onClick={handleApplyDate}>
                Set Date
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Sun Jump Confirmation - Portaled to body for full-screen overlay */}
      {showSunJumpConfirm && sunInfo && createPortal(
        <>
          <div
            className="popover-overlay"
            onClick={() => setShowSunJumpConfirm(false)}
          />
          <div
            className="sun-jump-popover sun-jump-popover-portal"
            style={{
              top: popoverPosition.top,
              right: popoverPosition.right,
            }}
          >
            <span>Jump to {sunInfo.type}?</span>
            <div className="popover-buttons">
              <button onClick={() => setShowSunJumpConfirm(false)}>✕</button>
              <button onClick={handleConfirmSunJump}>✓</button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default WeatherHeader;
