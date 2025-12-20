/**
 * Helper functions for working with region templates
 */

import { regionTemplates, latitudeBands } from './region-templates';

/**
 * Get all templates for a specific latitude band
 */
export const getTemplatesByLatitude = (latitudeBand) => {
  const templates = regionTemplates[latitudeBand] || {};
  return Object.entries(templates).map(([id, template]) => ({
    id,
    ...template,
    latitudeBand
  }));
};

/**
 * Get all templates (flat list)
 */
export const getAllTemplates = () => {
  const allTemplates = [];
  Object.keys(latitudeBands).forEach(latitudeBand => {
    const templates = getTemplatesByLatitude(latitudeBand);
    allTemplates.push(...templates);
  });
  return allTemplates;
};

/**
 * Get a specific template by latitude band and template ID
 */
export const getTemplate = (latitudeBand, templateId) => {
  const template = regionTemplates[latitudeBand]?.[templateId];
  if (!template) return null;

  return {
    id: templateId,
    ...template,
    latitudeBand
  };
};

/**
 * Get latitude band info
 */
export const getLatitudeBandInfo = (latitudeBand) => {
  return latitudeBands[latitudeBand] || null;
};

/**
 * Get all latitude bands
 */
export const getAllLatitudeBands = () => {
  return Object.entries(latitudeBands).map(([key, value]) => ({
    key,
    ...value
  }));
};

/**
 * Extract climate profile from template for region creation
 */
export const extractClimateProfile = (template) => {
  if (!template) return null;

  return {
    biome: template.defaultBiome || 'temperate',
    ...template.parameters,
    templateName: template.name,
    templateDescription: template.description
  };
};
