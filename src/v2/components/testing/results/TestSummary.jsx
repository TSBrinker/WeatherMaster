import React from 'react';
import { Alert, Badge, Button } from 'react-bootstrap';

/**
 * ProblemBiomesAlert - Highlighted summary of biomes with issues
 */
export const ProblemBiomesAlert = ({ results }) => {
  if (!results?.problemBiomes?.length) return null;

  return (
    <Alert variant="danger" className="mb-4">
      <h5>⚠️ Problem Biomes ({results.problemBiomes.length})</h5>
      <p className="text-muted mb-2">These biomes have issues that may need attention:</p>
      {results.problemBiomes.map((pb, idx) => (
        <div key={idx} className="mb-2">
          <strong>{pb.biome}</strong> <Badge bg="secondary">{pb.latitudeBand}</Badge>
          <ul className="mb-0 mt-1">
            {pb.problems.map((problem, pIdx) => (
              <li key={pIdx}><small>{problem}</small></li>
            ))}
          </ul>
        </div>
      ))}
    </Alert>
  );
};

/**
 * TestResultsSummary - Overall test results summary with export buttons
 */
export const TestResultsSummary = ({ results, onExportProblems, onExportFull }) => {
  if (!results) return null;

  const hasAnomalies = results.anomalies.length > 0 ||
    results.transitionAnomalies.length > 0 ||
    results.seasonalTransitionAnomalies.length > 0;

  return (
    <Alert variant={hasAnomalies ? 'warning' : 'success'}>
      <h5>Test Results Summary</h5>
      <div className="d-flex flex-wrap gap-4">
        <div>
          <p className="mb-1"><strong>Total Tests:</strong> {results.totalTests.toLocaleString()}</p>
          <p className="mb-1"><strong>Passed:</strong> {results.successfulTests.toLocaleString()}</p>
          <p className="mb-1">
            <strong>Success Rate:</strong> {((results.successfulTests / results.totalTests) * 100).toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="mb-1"><strong>Validation Anomalies:</strong> {results.anomalies.length}</p>
          <p className="mb-1"><strong>Hourly Transition Anomalies:</strong> {results.transitionAnomalies.length}</p>
          <p className="mb-1">
            <strong>Seasonal Transition Anomalies:</strong> {results.seasonalTransitionAnomalies.length}
          </p>
        </div>
        <div>
          <p className="mb-1"><strong>Similar Biome Pairs:</strong> {results.biomeSimilarities.length}</p>
          <p className="mb-1"><strong>Problem Biomes:</strong> {results.problemBiomes.length}</p>
        </div>
      </div>

      <Button variant="primary" size="sm" onClick={onExportProblems} className="mt-3 me-2">
        Export Problems Only
      </Button>
      <Button variant="secondary" size="sm" onClick={onExportFull} className="mt-3">
        Export Full Results
      </Button>
    </Alert>
  );
};
