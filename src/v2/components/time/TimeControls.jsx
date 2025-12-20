import React from 'react';
import { Card, Button, ButtonGroup } from 'react-bootstrap';

/**
 * Time Controls Component
 * Buttons to advance time by various increments
 */
const TimeControls = ({ onAdvanceTime }) => {
  return (
    <Card className="mb-3">
      <Card.Body>
        <h5>Advance Time</h5>
        <ButtonGroup className="w-100">
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
      </Card.Body>
    </Card>
  );
};

export default TimeControls;
