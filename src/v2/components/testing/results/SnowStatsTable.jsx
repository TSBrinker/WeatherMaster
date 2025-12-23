import React from 'react';
import { Card, Table } from 'react-bootstrap';

/**
 * SnowStatsTable - Snow and ground conditions statistics by biome
 */
const SnowStatsTable = ({ results }) => {
  if (!results?.snowStats || Object.keys(results.snowStats).length === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5>Snow & Ground Conditions Statistics</h5>
        <small className="text-muted">
          Tracking snow accumulation, ice, and ground conditions across the test year
        </small>
      </Card.Header>
      <Card.Body style={{ maxHeight: '500px', overflowY: 'auto', padding: 0 }}>
        <Table striped bordered hover size="sm" style={{ marginBottom: 0, fontSize: '0.8rem' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#212529', zIndex: 1 }}>
            <tr>
              <th>Biome</th>
              <th title="Maximum snow depth (inches)">Max Snow</th>
              <th title="Days with 0.5+ inches of snow">Snow Days</th>
              <th title="Maximum ice accumulation (inches)">Max Ice</th>
              <th title="Days with 0.1+ inches of ice">Ice Days</th>
              <th title="Days with frozen ground">Frozen</th>
              <th title="Days with muddy ground">Muddy</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(results.snowStats)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([biomeName, snowStats]) => (
                <tr key={biomeName}>
                  <td><small>{biomeName}</small></td>
                  <td style={{ color: snowStats.maxSnowDepth > 12 ? '#60a5fa' : 'inherit' }}>
                    {snowStats.maxSnowDepth.toFixed(1)}"
                  </td>
                  <td style={{ color: snowStats.daysWithSnow > 100 ? '#60a5fa' : 'inherit' }}>
                    {snowStats.daysWithSnow}d
                  </td>
                  <td style={{ color: snowStats.maxIceAccumulation > 0.25 ? '#17a2b8' : 'inherit' }}>
                    {snowStats.maxIceAccumulation.toFixed(2)}"
                  </td>
                  <td>{snowStats.daysWithIce}d</td>
                  <td>{snowStats.groundConditionCounts.frozen}d</td>
                  <td>{snowStats.groundConditionCounts.muddy}d</td>
                </tr>
              ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default SnowStatsTable;
