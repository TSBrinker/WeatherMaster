// src/utils/regionUtils.js - Fixed
import { v4 as uuidv4 } from 'uuid';

/**
 * Processes region data consistently for both creation and updates
 * @param {object} regionData - Form data for the region
 * @param {object} existingRegion - Optional existing region (for updates)
 * @param {object} regionProfileService - The profile service
 * @param {string} preferredWeatherSystem - Weather system preference
 * @returns {object} - Processed region data
 */
export const processRegionData = (
  regionData,
  existingRegion = null,
  regionProfileService,
  preferredWeatherSystem = 'diceTable'
) => {
  const isUpdate = !!existingRegion;
  console.log(`[RegionUtils] Processing region data (${isUpdate ? 'UPDATE' : 'CREATE'})`, {
    name: regionData.name,
    latitudeBand: regionData.latitudeBand, 
    existingLatitudeBand: existingRegion?.latitudeBand,
    climate: regionData.climate,
    existingClimate: existingRegion?.climate,
    templateId: regionData.templateId,
    existingTemplateId: existingRegion?.templateId || (existingRegion?.templateInfo ? existingRegion.templateInfo.templateId : null)
  });
  
  // Get base properties with proper fallbacks
  const name = regionData.name || (existingRegion ? existingRegion.name : '');
  const latitudeBand = regionData.latitudeBand || 
    (existingRegion ? (existingRegion.latitudeBand || (existingRegion.profile ? existingRegion.profile.latitudeBand : 'temperate')) : 'temperate');
  const climate = regionData.climate || 
    (existingRegion ? (existingRegion.climate || (existingRegion.profile ? existingRegion.profile.climate || existingRegion.profile.biome : 'temperate-deciduous')) : 'temperate-deciduous');
  const templateId = regionData.templateId || 
    (existingRegion ? (existingRegion.templateId || (existingRegion.templateInfo ? existingRegion.templateInfo.templateId : null)) : null);
  
  console.log(`[RegionUtils] Resolved base properties:`, {
    name,
    latitudeBand,
    climate,
    templateId
  });
  
  // Create profile based on template or basic parameters
  let profile = null;
  
  if (templateId) {
    console.log(`[RegionUtils] Creating profile from template: ${latitudeBand}/${templateId}`);
    
    // Create from template
    profile = regionProfileService.createProfileFromTemplate(
      latitudeBand,
      templateId, 
      name
    );
  } else {
    console.log(`[RegionUtils] Creating basic profile: ${climate}, ${latitudeBand}`);
    
    // Create basic profile
    profile = regionProfileService.getRegionProfile(climate, {
      name: name,
      latitudeBand: latitudeBand
    });
  }
  
  // CRITICAL: Ensure latitude band is explicitly set at the root level
  if (profile && !profile.latitudeBand) {
    console.log(`[RegionUtils] Fixing missing latitudeBand in profile: ${latitudeBand}`);
    profile.latitudeBand = latitudeBand;
  }
  
  // CRITICAL: Ensure climate is explicitly set for backward compatibility
  if (profile && !profile.climate) {
    console.log(`[RegionUtils] Fixing missing climate in profile: ${climate}`);
    profile.climate = climate;
  }
  
  // Create common object structure
  const regionObject = existingRegion ? { ...existingRegion } : {
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  
  // Update properties
  Object.assign(regionObject, {
    name,
    profile,
    latitudeBand, // EXPLICITLY store at root level too
    climate,      // EXPLICITLY store at root level too
    templateInfo: templateId ? {
      latitudeBand,
      templateId
    } : (existingRegion ? existingRegion.templateInfo : null),
    templateId,   // EXPLICITLY store for easier access
    weatherType: preferredWeatherSystem,
    updatedAt: new Date().toISOString()
  });
  
  console.log('[RegionUtils] Final processed region:', {
    name: regionObject.name,
    latitudeBand: regionObject.latitudeBand,
    profileLatitudeBand: regionObject.profile.latitudeBand,
    climate: regionObject.climate,
    profileClimate: regionObject.profile.climate || regionObject.profile.biome,
    templateId: regionObject.templateId,
    weatherType: regionObject.weatherType
  });
  
  return regionObject;
};