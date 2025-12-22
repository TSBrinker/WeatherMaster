import React, { useState } from 'react';
import { Card, Button, ButtonGroup, Form, Row, Col } from 'react-bootstrap';

/**
 * Time Controls Component
 * Buttons to advance time by various increments
 */
const TimeControls = ({ onAdvanceTime, onJumpToDate, currentDate }) => {
  const [showJumpControls, setShowJumpControls] = useState(false);
  const [jumpMonth, setJumpMonth] = useState(currentDate?.month || 1);
  const [jumpDay, setJumpDay] = useState(currentDate?.day || 1);

  const handleJumpToDate = () => {
    if (onJumpToDate) {
      onJumpToDate(jumpMonth, jumpDay);
    }
  };

  return (
    <Card className="mb-3">
      <Card.Body>
        <h5>Time Controls</h5>

        <div className="mb-3">
          <strong>Advance Time:</strong>
          <ButtonGroup className="w-100 mt-2">
            <Button variant="outline-primary" onClick={() => onAdvanceTime(1)}>
              +1 Hour
            </Button>
            <Button variant="outline-primary" onClick={() => onAdvanceTime(4)}>
              +4 Hours
            </Button>
            <Button variant="outline-primary" onClick={() => onAdvanceTime(8)}>
              +8 Hours
            </Button>
            <Button variant="outline-primary" onClick={() => onAdvanceTime(24)}>
              +1 Day
            </Button>
          </ButtonGroup>
        </div>

        {onJumpToDate && (
          <div>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setShowJumpControls(!showJumpControls)}
              className="mb-2"
            >
              {showJumpControls ? '▼' : '▶'} Jump to Date
            </Button>

            {showJumpControls && (
              <div className="p-3 border rounded bg-light">
                <Row>
                  <Col>
                    <Form.Group>
                      <Form.Label>Month (1-12)</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="12"
                        value={jumpMonth}
                        onChange={(e) => setJumpMonth(parseInt(e.target.value))}
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group>
                      <Form.Label>Day (1-30)</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="30"
                        value={jumpDay}
                        onChange={(e) => setJumpDay(parseInt(e.target.value))}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Button
                  variant="primary"
                  className="w-100 mt-3"
                  onClick={handleJumpToDate}
                >
                  Jump to Month {jumpMonth}, Day {jumpDay}
                </Button>
                <small className="text-muted d-block mt-2">
                  Note: Stays in current year, resets hour to 0
                </small>
              </div>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default TimeControls;
