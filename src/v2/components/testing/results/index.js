/**
 * Results Components Index
 * Re-exports all result display components
 */

export { default as BiomeStatsTable } from './BiomeStatsTable';
export { default as EnvironmentalStatsTable } from './EnvironmentalStatsTable';
export { default as SnowStatsTable } from './SnowStatsTable';
export {
  TransitionAnomaliesTable,
  SeasonalAnomaliesTable,
  ValidationAnomaliesTable,
  BiomeSimilaritiesTable
} from './AnomaliesTable';
export { ProblemBiomesAlert, TestResultsSummary } from './TestSummary';
