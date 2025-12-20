import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useWorld } from '../../contexts/WorldContext';
import { MONTH_NAMES, getDaysInMonth } from '../../utils/dateUtils';

const WorldSetup = ({ show, onHide, onComplete }) => {
  const { createWorld } = useWorld();

  const [worldName, setWorldName] = useState('');
  const [year, setYear] = useState(1);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(12);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!worldName.trim()) {
      alert('Please enter a world name');
      return;
    }

    const startDate = {
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour: parseInt(hour)
    };

    createWorld(worldName.trim(), '', startDate);

    if (onComplete) {
      onComplete();
    }
  };

  // Get days in selected month
  const daysInMonth = getDaysInMonth(month);
  const validDay = day > daysInMonth ? daysInMonth : day;

  return (
    <Modal show={show} onHide={onHide} backdrop="static" keyboard={false} centered>
      <Modal.Header>
        <Modal.Title>Create Your World</Modal.Title>
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
              This is your campaign world. You can create multiple worlds for different campaigns.
            </Form.Text>
          </Form.Group>

          <hr />

          <h6>Starting Date & Time</h6>
          <Form.Text className="text-muted d-block mb-3">
            Set when your campaign begins. Uses Earth calendar with any year.
          </Form.Text>

          <Form.Group className="mb-3">
            <Form.Label>Year</Form.Label>
            <Form.Control
              type="number"
              min="1"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </Form.Group>

          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Month</Form.Label>
                <Form.Select
                  value={month}
                  onChange={(e) => {
                    const newMonth = parseInt(e.target.value);
                    setMonth(newMonth);
                    // Adjust day if it exceeds days in new month
                    const maxDays = getDaysInMonth(newMonth);
                    if (day > maxDays) {
                      setDay(maxDays);
                    }
                  }}
                >
                  {MONTH_NAMES.map((monthName, index) => (
                    <option key={index} value={index + 1}>
                      {monthName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Day</Form.Label>
                <Form.Select
                  value={validDay}
                  onChange={(e) => setDay(parseInt(e.target.value))}
                >
                  {[...Array(daysInMonth)].map((_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Hour</Form.Label>
            <Form.Select
              value={hour}
              onChange={(e) => setHour(parseInt(e.target.value))}
            >
              <option value={0}>12 AM (Midnight)</option>
              {[...Array(11)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} AM
                </option>
              ))}
              <option value={12}>12 PM (Noon)</option>
              {[...Array(11)].map((_, i) => (
                <option key={i + 13} value={i + 13}>
                  {i + 1} PM
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleSubmit}>
          Create World
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default WorldSetup;
