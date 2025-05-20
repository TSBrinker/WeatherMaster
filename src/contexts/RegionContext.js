// src/contexts/RegionContext.js
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { storageUtils } from '../utils/storageUtils';
import RegionProfileService from '../services/meteorological/RegionProfileService';
import { processRegionData } from '../utils/regionUtils';

// Storage keys for localStorage
const STORAGE_KEY = 'gm-weather-companion-regions';
const ACTIVE_REGION_KEY = 'gm-weather-companion-active-region';

// Initialize the region profile service
const regionProfileService = new RegionProfileService();

// Initial state
const initialState = {
  regions: [],
  activeRegionId: null,
  isLoading: false,
  error: null
};

// Create the context
export const RegionContext = createContext();

// Action types
export const ACTIONS = {
  SET_REGIONS: 'set_regions',
  ADD_REGION: 'add_region',
  UPDATE_REGION: 'update_region',
  DELETE_REGION: 'delete_region',
  SET_ACTIVE_REGION: 'set_active_region',
  SET_LOADING: 'set_loading',
  SET_ERROR: 'set_error'
};

// Reducer function
const regionReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_REGIONS:
      return {
        ...state,
        regions: action.payload,
        isLoading: false
      };
    case ACTIONS.ADD_REGION:
      return {
        ...state,
        regions: [...state.regions, action.payload],
        activeRegionId: action.payload.id, // Set as active when created
        isLoading: false
      };
    case ACTIONS.UPDATE_REGION:
      return {
        ...state,
        regions: state.regions.map(region => 
          region.id === action.payload.id ? action.payload : region
        ),
        isLoading: false
      };
    case ACTIONS.DELETE_REGION: {
      const updatedRegions = state.regions.filter(region => region.id !== action.payload);
      const newActiveId = state.activeRegionId === action.payload 
        ? (updatedRegions.length > 0 ? updatedRegions[0].id : null) 
        : state.activeRegionId;
      
      return {
        ...state,
        regions: updatedRegions,
        activeRegionId: newActiveId,
        isLoading: false
      };
    }
    case ACTIONS.SET_ACTIVE_REGION:
      return {
        ...state,
        activeRegionId: action.payload
      };
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    default:
      return state;
  }
};

// Provider component
export const RegionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(regionReducer, initialState);

  // Load regions on initial render
  useEffect(() => {
    const loadRegions = () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      // Debug - list all localStorage keys
      storageUtils.listKeys();
      
      // Load regions
      const regions = storageUtils.loadData(STORAGE_KEY, []);
      if (regions && regions.length > 0) {
        // console.log(`Loaded ${regions.length} regions from storage`);
        dispatch({ type: ACTIONS.SET_REGIONS, payload: regions });
      }
      
      // Load active region ID
      const activeId = storageUtils.loadData(ACTIVE_REGION_KEY, null);
      if (activeId) {
        // console.log(`Loaded active region ID: ${activeId}`);
        dispatch({ type: ACTIONS.SET_ACTIVE_REGION, payload: activeId });
      }
      
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    };
    
    loadRegions();
  }, []);

  // Save regions when they change
  useEffect(() => {
    // Don't save if we're still loading or if regions array is empty from initialization
    if (state.isLoading) return;
    
    // Even if empty, save it (could be after deletion)
    // console.log(`Saving ${state.regions.length} regions to storage`);
    storageUtils.saveData(STORAGE_KEY, state.regions);
  }, [state.regions, state.isLoading]);

  // Save active region ID when it changes
  useEffect(() => {
    // If there's an active region ID, save it
    if (state.activeRegionId) {
      // console.log(`Saving active region ID: ${state.activeRegionId}`);
      storageUtils.saveData(ACTIVE_REGION_KEY, state.activeRegionId);
    } else {
      // If there's no active region ID, remove it from storage
      storageUtils.removeData(ACTIVE_REGION_KEY);
    }
  }, [state.activeRegionId]);

  // Memoize value to avoid unnecessary re-renders
  const value = React.useMemo(() => ({
    state,
    dispatch
  }), [state]);

  return (
    <RegionContext.Provider value={value}>
      {children}
    </RegionContext.Provider>
  );
};

// Custom hook for consuming the context
export const useRegion = () => {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within a RegionProvider');
  }

  const { state, dispatch } = context;

  // Memoized derived state
  const activeRegion = React.useMemo(() => {
    return state.regions.find(region => region.id === state.activeRegionId) || null;
  }, [state.regions, state.activeRegionId]);

  // Check if any regions exist
  const hasRegions = state.regions.length > 0;

  // Helper function to create a region profile from a template
  const createRegionProfileFromTemplate = (name, latitudeBand, templateId) => {
    return regionProfileService.createProfileFromTemplate(
      latitudeBand,
      templateId,
      name
    );
  };

  // Action creators
const createRegion = (regionData) => {
  const preferredWeatherSystem = preferences?.weatherSystem || 'diceTable';
  
  const newRegion = processRegionData(
    regionData,
    null,
    regionProfileService,
    preferredWeatherSystem
  );
  
  dispatch({ type: ACTIONS.ADD_REGION, payload: newRegion });
  return newRegion;
};

const updateRegion = (id, regionData) => {
  const existingRegion = state.regions.find(region => region.id === id);
  const preferredWeatherSystem = preferences?.weatherSystem || 'diceTable';
  
  if (!existingRegion) {
    console.error(`Region with id ${id} not found`);
    return null;
  }
  
  const updatedRegion = processRegionData(
    regionData,
    existingRegion,
    regionProfileService,
    preferredWeatherSystem
  );
  
  dispatch({ type: ACTIONS.UPDATE_REGION, payload: updatedRegion });
  return updatedRegion;
};

  const deleteRegion = (id) => {
    dispatch({ type: ACTIONS.DELETE_REGION, payload: id });
  };

  const setActiveRegion = (id) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_REGION, payload: id });
  };

  return {
    regions: state.regions,
    activeRegion,
    hasRegions,
    isLoading: state.isLoading,
    error: state.error,
    createRegion,
    updateRegion,
    deleteRegion,
    setActiveRegion
  };
};