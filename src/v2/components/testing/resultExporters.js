/**
 * Result Exporters
 * Functions for downloading test results as JSON
 */

/**
 * Download full test results as JSON
 * @param {Object} results - Complete test results object
 */
export const downloadFullResults = (results) => {
  if (!results) return;

  const data = JSON.stringify(results, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `weather-test-results-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Download condensed problems report as JSON
 * @param {Object} results - Complete test results object
 */
export const downloadProblemsReport = (results) => {
  if (!results) return;

  const problemsReport = {
    summary: {
      totalTests: results.totalTests,
      successRate: ((results.successfulTests / results.totalTests) * 100).toFixed(2) + '%',
      validationAnomalies: results.anomalies.length,
      hourlyTransitionAnomalies: results.transitionAnomalies.length,
      seasonalTransitionAnomalies: results.seasonalTransitionAnomalies.length,
      similarBiomePairs: results.biomeSimilarities.length,
      problemBiomeCount: results.problemBiomes.length
    },
    problemBiomes: results.problemBiomes,
    seasonalTransitionAnomalies: results.seasonalTransitionAnomalies,
    biomeSimilarities: results.biomeSimilarities,
    // Condensed biome stats (just key metrics, not daily temps)
    biomeStats: Object.fromEntries(
      Object.entries(results.biomeStats).map(([name, stats]) => [
        name,
        {
          latitudeBand: stats.latitudeBand,
          tempMin: stats.tempMin,
          tempMax: stats.tempMax,
          avgTemp: (stats.tempSum / stats.count).toFixed(1),
          expectedTemp: stats.expectedAnnualTemp,
          tempDeviation: stats.tempDeviation?.toFixed(1),
          precipPercent: ((stats.precipCount / stats.count) * 100).toFixed(1),
          longestDry: results.precipitationStreaks[name]?.longestDry,
          longestWet: results.precipitationStreaks[name]?.longestWet
        }
      ])
    ),
    // Only include first 20 of each anomaly type
    validationAnomalies: results.anomalies.slice(0, 20),
    transitionAnomalies: results.transitionAnomalies.slice(0, 20),
    environmentalStats: results.environmentalStats,
    snowStats: results.snowStats
  };

  const data = JSON.stringify(problemsReport, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `weather-problems-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
