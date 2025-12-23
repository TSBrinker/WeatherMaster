import React from 'react';
import { Card, Table, Badge } from 'react-bootstrap';

/**
 * EnvironmentalStatsTable - Environmental conditions statistics by biome
 */
const EnvironmentalStatsTable = ({ results }) => {
  if (!results?.environmentalStats || Object.keys(results.environmentalStats).length === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5>Environmental Conditions Statistics</h5>
        <small className="text-muted">
          Tracking drought, flooding, heat waves, cold snaps, and wildfire risk across the test year
        </small>
      </Card.Header>
      <Card.Body style={{ maxHeight: '500px', overflowY: 'auto', padding: 0 }}>
        <Table striped bordered hover size="sm" style={{ marginBottom: 0, fontSize: '0.8rem' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#212529', zIndex: 1 }}>
            <tr>
              <th>Biome</th>
              <th title="Days with drought conditions">Drought</th>
              <th title="Days with flood risk">Flood</th>
              <th title="Days with heat wave conditions">Heat</th>
              <th title="Days with cold snap conditions">Cold</th>
              <th title="Days with elevated wildfire risk">Fire</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(results.environmentalStats)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([biomeName, envStats]) => {
                const droughtDays = envStats.droughtDays.abnormallyDry + envStats.droughtDays.moderate +
                  envStats.droughtDays.severe + envStats.droughtDays.extreme;
                const floodDays = envStats.floodingDays.elevated + envStats.floodingDays.moderate +
                  envStats.floodingDays.high;
                const heatDays = envStats.heatWaveDays.advisory + envStats.heatWaveDays.warning +
                  envStats.heatWaveDays.extreme;
                const coldDays = envStats.coldSnapDays.advisory + envStats.coldSnapDays.warning +
                  envStats.coldSnapDays.extreme;
                const fireDays = envStats.wildfireDays.moderate + envStats.wildfireDays.high +
                  envStats.wildfireDays.veryHigh + envStats.wildfireDays.extreme;

                return (
                  <tr key={biomeName}>
                    <td><small>{biomeName}</small></td>
                    <td style={{ color: droughtDays > 100 ? '#dc3545' : droughtDays > 50 ? '#ffc107' : 'inherit' }}>
                      {droughtDays}d
                      {envStats.maxDroughtLevel >= 3 && (
                        <Badge bg="danger" className="ms-1" style={{ fontSize: '0.6rem' }}>
                          L{envStats.maxDroughtLevel}
                        </Badge>
                      )}
                    </td>
                    <td style={{ color: floodDays > 50 ? '#17a2b8' : 'inherit' }}>
                      {floodDays}d
                      {envStats.maxFloodLevel >= 2 && (
                        <Badge bg="info" className="ms-1" style={{ fontSize: '0.6rem' }}>
                          L{envStats.maxFloodLevel}
                        </Badge>
                      )}
                    </td>
                    <td style={{ color: heatDays > 50 ? '#fd7e14' : 'inherit' }}>
                      {heatDays}d
                      {envStats.maxHeatLevel >= 2 && (
                        <Badge bg="warning" className="ms-1" style={{ fontSize: '0.6rem' }}>
                          L{envStats.maxHeatLevel}
                        </Badge>
                      )}
                    </td>
                    <td style={{ color: coldDays > 50 ? '#6f42c1' : 'inherit' }}>
                      {coldDays}d
                      {envStats.maxColdLevel >= 2 && (
                        <Badge bg="secondary" className="ms-1" style={{ fontSize: '0.6rem' }}>
                          L{envStats.maxColdLevel}
                        </Badge>
                      )}
                    </td>
                    <td style={{ color: fireDays > 100 ? '#dc3545' : fireDays > 50 ? '#fd7e14' : 'inherit' }}>
                      {fireDays}d
                      {envStats.maxFireLevel >= 3 && (
                        <Badge bg="danger" className="ms-1" style={{ fontSize: '0.6rem' }}>
                          L{envStats.maxFireLevel}
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default EnvironmentalStatsTable;
