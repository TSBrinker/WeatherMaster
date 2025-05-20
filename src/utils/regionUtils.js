// src/utils/regionUtils.js
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
  console.log('Processing region data:', {
    isUpdate: !!existingRegion,
    regionData,
    existingRegion,
    weatherSystem: preferredWeatherSystem
  });
  
  // Get base properties with proper fallbacks
  const name = regionData.name || (existingRegion ? existingRegion.name : '');
  const latitudeBand = regionData.latitudeBand || 
    (existingRegion ? (existingRegion.latitudeBand || (existingRegion.profile ? existingRegion.profile.latitudeBand : 'temperate')) : 'temperate');
  const climate = regionData.climate || 
    (existingRegion ? (existingRegion.climate || (existingRegion.profile ? existingRegion.profile.climate : 'temperate-deciduous')) : 'temperate-deciduous');
  const templateId = regionData.templateId || 
    (existingRegion ? (existingRegion.templateId || (existingRegion.templateInfo ? existingRegion.templateInfo.templateId : null)) : null);
  
  // Create profile based on template or basic parameters
  let profile = null;
  
  if (templateId) {
    console.log(`Creating profile from template: ${latitudeBand}/${templateId}`);
    
    // Create from template - use regionProfileService from context
    profile = regionProfileService.createProfileFromTemplate(
      name,
      latitudeBand,
      templateId
    );
  } else {
    console.log(`Creating basic profile: ${climate}, ${latitudeBand}`);
    
    // Create basic profile - use regionProfileService from context
    profile = regionProfileService.getRegionProfile(climate, {
      name: name,
      latitudeBand: latitudeBand
    });
  }
  
  // CRITICAL: Ensure latitude band is explicitly set at the root level
  if (profile && !profile.latitudeBand) {
    console.log(`Fixing missing latitudeBand in profile: ${latitudeBand}`);
    profile.latitudeBand = latitudeBand;
  }
  
  // CRITICAL: Ensure climate is explicitly set for backward compatibility
  if (profile && !profile.climate) {
    console.log(`Fixing missing climate in profile: ${climate}`);
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
    weatherType: preferredWeatherSystem,
    updatedAt: new Date().toISOString()
  });
  
  console.log('Processed region:', {
    name: regionObject.name,
    latitudeBand: regionObject.latitudeBand,
    profileLatitudeBand: regionObject.profile.latitudeBand,
    climate: regionObject.climate,
    profileClimate: regionObject.profile.climate || regionObject.profile.biome,
    weatherType: regionObject.weatherType
  });
  
  return regionObject;
};