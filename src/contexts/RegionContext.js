// src/contexts/RegionContext.js
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Storage keys for localStorage
const STORAGE_KEY = 'gm-weather-companion-regions';
const ACTIVE_REGION_KEY = 'gm-weather-companion-active-region';

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

  // Load regions from localStorage on init - ONCE ONLY
  useEffect(() => {
    const loadRegionsData = () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      try {
        console.log("Loading region data from localStorage");
        // Load regions
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
          try {
            console.log("Found stored region data");
            const parsedData = JSON.parse(storedData);
            console.log("Loaded regions:", parsedData.length);
            dispatch({ type: ACTIONS.SET_REGIONS, payload: parsedData });
          } catch (parseError) {
            console.error("Error parsing stored region data:", parseError);
          }
        } else {
          console.log("No stored region data found");
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
        dispatch({ type: ACTIONS.SET_ERROR, payload: 'Failed to load saved data' });
      }
    };
    
    loadRegionsData();
  }, []); // Empty dependency array means this runs once on mount

  // Load active region ID - SEPARATE EFFECT to avoid race conditions
  useEffect(() => {
    const loadActiveRegion = () => {
      try {
        const activeId = localStorage.getItem(ACTIVE_REGION_KEY);
        if (activeId) {
          console.log("Found active region ID:", activeId);
          dispatch({ type: ACTIONS.SET_ACTIVE_REGION, payload: activeId });
        } else {
          console.log("No active region ID found");
        }
      } catch (error) {
        console.error('Error loading active region ID:', error);
      }
    };
    
    loadActiveRegion();
  }, []); // Empty dependency array means this runs once on mount

  // Save regions to localStorage whenever they change
  useEffect(() => {
    // Don't try to save empty regions array during initialization
    if (state.regions.length === 0 && state.isLoading) {
      return;
    }
    
    try {
      console.log("Saving regions to localStorage:", state.regions.length);
      // Convert to string first to help with debugging
      const jsonData = JSON.stringify(state.regions);
      console.log("Saving regions data size:", jsonData.length, "bytes");
      localStorage.setItem(STORAGE_KEY, jsonData);
      
      // Verify save worked
      const savedData = localStorage.getItem(STORAGE_KEY);
      console.log("Verify saved regions data:", savedData ? savedData.substring(0, 50) + "..." : "none");
    } catch (error) {
      console.error('Error saving regions to localStorage:', error);
    }
  }, [state.regions, state.isLoading]);
  
  // Save active region ID whenever it changes
  useEffect(() => {
    try {
      if (state.activeRegionId) {
        console.log("Saving active region ID:", state.activeRegionId);
        localStorage.setItem(ACTIVE_REGION_KEY, state.activeRegionId);
      } else {
        console.log("Clearing active region ID");
        localStorage.removeItem(ACTIVE_REGION_KEY);
      }
    } catch (error) {
      console.error('Error saving active region to localStorage:', error);
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

  // Action creators
  const createRegion = (regionData) => {
    const newRegion = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...regionData
    };
    dispatch({ type: ACTIONS.ADD_REGION, payload: newRegion });
    return newRegion;
  };

  const updateRegion = (id, regionData) => {
    const updatedRegion = {
      ...state.regions.find(region => region.id === id),
      ...regionData,
      updatedAt: new Date().toISOString()
    };
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