import React, { useState } from 'react';
import { Card, Table } from 'react-bootstrap';
import { THRESHOLDS } from '../testConfig';

/**
 * BiomeStatsTable - Sortable table of biome weather statistics
 */
const BiomeStatsTable = ({ results }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  if (!results?.biomeStats) return null;

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const SortHeader = ({ label, sortKey, minWidth }) => (
    <th
      style={{ cursor: 'pointer', minWidth, whiteSpace: 'nowrap' }}
      onClick={() => handleSort(sortKey)}
    >
      {label} {sortConfig.key === sortKey && (sortConfig.direction === 'asc' ? '↑' : '↓')}
    </th>
  );

  const rows = Object.entries(results.biomeStats)
    .map(([name, stats]) => ({
      name,
      tempMin: stats.tempMin,
      tempMax: stats.tempMax,
      avgTemp: stats.tempSum / stats.count,
      expectedTemp: stats.expectedAnnualTemp,
      deviation: stats.tempDeviation,
      variance: stats.dailyTempVariance,
      precip: (stats.precipCount / stats.count) * 100,
      dryStreak: results.precipitationStreaks[name]?.longestDry || 0,
      wetStreak: results.precipitationStreaks[name]?.longestWet || 0
    }))
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === undefined) return 1;
      if (bVal === undefined) return -1;
      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5>Biome Statistics</h5>
        <small className="text-muted">
          Click column headers to sort. Includes expected vs actual temps, variance, and precipitation streaks.
        </small>
      </Card.Header>
      <Card.Body style={{ maxHeight: '500px', overflowY: 'auto', padding: 0 }}>
        <Table striped bordered hover size="sm" style={{ marginBottom: 0, fontSize: '0.85rem' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#212529', zIndex: 1 }}>
            <tr>
              <th style={{ cursor: 'default', width: '30px' }}>#</th>
              <SortHeader label="Biome" sortKey="name" />
              <SortHeader label="Min" sortKey="tempMin" />
              <SortHeader label="Max" sortKey="tempMax" />
              <SortHeader label="Avg" sortKey="avgTemp" />
              <SortHeader label="Expected" sortKey="expectedTemp" />
              <SortHeader label="Diff" sortKey="deviation" />
              <SortHeader label="StdDev" sortKey="variance" />
              <SortHeader label="Precip%" sortKey="precip" />
              <SortHeader label="Dry" sortKey="dryStreak" />
              <SortHeader label="Wet" sortKey="wetStreak" />
            </tr>
          </thead>
          <tbody style={{ color: '#212529' }}>
            {rows.map((row, idx) => (
              <tr key={row.name}>
                <td style={{ color: '#6c757d' }}>{idx + 1}</td>
                <td><small>{row.name}</small></td>
                <td>{row.tempMin.toFixed(0)}°</td>
                <td>{row.tempMax.toFixed(0)}°</td>
                <td>{row.avgTemp.toFixed(0)}°</td>
                <td>{row.expectedTemp !== undefined ? `${row.expectedTemp}°` : '-'}</td>
                <td style={{
                  color: row.deviation !== undefined && Math.abs(row.deviation) > THRESHOLDS.expectedTempDeviation
                    ? '#ff6b7a'
                    : 'inherit'
                }}>
                  {row.deviation !== undefined ? `${row.deviation > 0 ? '+' : ''}${row.deviation.toFixed(1)}°` : '-'}
                </td>
                <td>{row.variance !== undefined ? row.variance.toFixed(1) : '-'}</td>
                <td>{row.precip.toFixed(0)}%</td>
                <td>{row.dryStreak}d</td>
                <td style={{ color: row.wetStreak > 14 ? '#ffe066' : 'inherit' }}>{row.wetStreak}d</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default BiomeStatsTable;
