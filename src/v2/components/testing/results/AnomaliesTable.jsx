import React from 'react';
import { Card, Table } from 'react-bootstrap';
import { THRESHOLDS } from '../testConfig';

/**
 * TransitionAnomaliesTable - Temperature transition anomalies
 */
export const TransitionAnomaliesTable = ({ results }) => {
  if (!results?.transitionAnomalies?.length) return null;

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5>Temperature Transition Anomalies ({results.transitionAnomalies.length})</h5>
        <small className="text-muted">
          Unrealistic temperature jumps (&gt;{THRESHOLDS.maxTempChangePerHour}°F/hour)
        </small>
      </Card.Header>
      <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Biome</th>
              <th>Latitude</th>
              <th>Time Period</th>
              <th>Temperature Change</th>
              <th>Weather Change</th>
            </tr>
          </thead>
          <tbody>
            {results.transitionAnomalies.slice(0, 100).map((anomaly, idx) => (
              <tr key={idx}>
                <td>{anomaly.biome}</td>
                <td>{anomaly.latitudeBand}</td>
                <td>
                  <small>{anomaly.from}</small><br />
                  <small>→ {anomaly.to}</small>
                </td>
                <td>{anomaly.tempChange}</td>
                <td><small>{anomaly.precipChange}</small></td>
              </tr>
            ))}
          </tbody>
        </Table>
        {results.transitionAnomalies.length > 100 && (
          <p className="text-muted">
            Showing first 100 of {results.transitionAnomalies.length} transition anomalies.
            Download full results for complete list.
          </p>
        )}
      </Card.Body>
    </Card>
  );
};

/**
 * SeasonalAnomaliesTable - Seasonal transition anomalies
 */
export const SeasonalAnomaliesTable = ({ results }) => {
  if (!results?.seasonalTransitionAnomalies?.length) return null;

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5>Seasonal Transition Anomalies ({results.seasonalTransitionAnomalies.length})</h5>
        <small className="text-muted">
          Weekly average temperature jumps during season changes
          (&gt;{THRESHOLDS.maxWeeklySeasonalJump}°F between pre/post boundary weeks)
        </small>
      </Card.Header>
      <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Biome</th>
              <th>Band</th>
              <th>Season</th>
              <th>Weekly Avg Change</th>
            </tr>
          </thead>
          <tbody>
            {results.seasonalTransitionAnomalies.slice(0, 50).map((anomaly, idx) => (
              <tr key={idx}>
                <td><small>{anomaly.biome}</small></td>
                <td><small>{anomaly.latitudeBand}</small></td>
                <td><small>{anomaly.season}</small></td>
                <td>{anomaly.beforeAvg}°F → {anomaly.afterAvg}°F (Δ{anomaly.weeklyChange}°F)</td>
              </tr>
            ))}
          </tbody>
        </Table>
        {results.seasonalTransitionAnomalies.length > 50 && (
          <p className="text-muted">
            Showing first 50 of {results.seasonalTransitionAnomalies.length}. Download full results for complete list.
          </p>
        )}
      </Card.Body>
    </Card>
  );
};

/**
 * ValidationAnomaliesTable - Weather validation anomalies
 */
export const ValidationAnomaliesTable = ({ results }) => {
  if (!results?.anomalies?.length) return null;

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5>Validation Anomalies ({results.anomalies.length})</h5>
      </Card.Header>
      <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Biome</th>
              <th>Latitude</th>
              <th>Date</th>
              <th>Issues</th>
            </tr>
          </thead>
          <tbody>
            {results.anomalies.slice(0, 100).map((anomaly, idx) => (
              <tr key={idx}>
                <td>{anomaly.biome}</td>
                <td>{anomaly.latitudeBand}</td>
                <td>{anomaly.date}</td>
                <td>
                  {anomaly.issues.map((issue, i) => (
                    <div key={i}><small>{issue}</small></div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {results.anomalies.length > 100 && (
          <p className="text-muted">
            Showing first 100 of {results.anomalies.length} anomalies. Download full results for complete list.
          </p>
        )}
      </Card.Body>
    </Card>
  );
};

/**
 * BiomeSimilaritiesTable - Similar biome pairs
 */
export const BiomeSimilaritiesTable = ({ results }) => {
  if (!results?.biomeSimilarities?.length) return null;

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5>Similar Biome Pairs ({results.biomeSimilarities.length})</h5>
        <small className="text-muted">
          Biomes with nearly identical weather patterns
          (temp diff &lt;{THRESHOLDS.biomeSimilarityThreshold}°F and precip diff &lt;5%)
        </small>
      </Card.Header>
      <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Biome 1</th>
              <th>Band</th>
              <th>Biome 2</th>
              <th>Band</th>
              <th>Temp Δ</th>
              <th>Precip Δ</th>
            </tr>
          </thead>
          <tbody>
            {results.biomeSimilarities.map((sim, idx) => (
              <tr key={idx}>
                <td><small>{sim.biome1}</small></td>
                <td><small>{sim.band1}</small></td>
                <td><small>{sim.biome2}</small></td>
                <td><small>{sim.band2}</small></td>
                <td>{sim.avgTempDiff}°F</td>
                <td>{sim.precipDiff}%</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};
