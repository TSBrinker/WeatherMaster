/**
 * Helper functions for working with region templates
 */

import { regionTemplates, latitudeBands } from './region-templates';

/**
 * Get all templates for a specific latitude band
 * Includes both regular templates and compatible special templates
 */
export const getTemplatesByLatitude = (latitudeBand) => {
  // Get regular templates for this latitude band
  const regularTemplates = regionTemplates[latitudeBand] || {};
  const results = Object.entries(regularTemplates).map(([id, template]) => ({
    id,
    ...template,
    latitudeBand
  }));

  // Also include special templates that are compatible with this latitude band
  const specialTemplates = regionTemplates.special || {};
  Object.entries(specialTemplates).forEach(([id, template]) => {
    if (template.compatibleBands && template.compatibleBands.includes(latitudeBand)) {
      results.push({
        id,
        ...template,
        latitudeBand: 'special',
        originalLatitudeBand: latitudeBand
      });
    }
  });

  return results;
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
 * Handles both regular and special templates
 */
export const getTemplate = (latitudeBand, templateId) => {
  // First check regular templates
  let template = regionTemplates[latitudeBand]?.[templateId];

  // If not found and latitudeBand is 'special', check special templates
  if (!template && latitudeBand === 'special') {
    template = regionTemplates.special?.[templateId];
  }

  // Also check special templates if the template ID exists there
  // (for cases where latitudeBand is the original band but template is special)
  if (!template) {
    template = regionTemplates.special?.[templateId];
    if (template) {
      return {
        id: templateId,
        ...template,
        latitudeBand: 'special'
      };
    }
  }

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
