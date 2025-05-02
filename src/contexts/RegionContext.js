// src/contexts/RegionContext.js
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Storage key for local storage
const STORAGE_KEY = 'gm-weather-companion-regions';

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
        activeRegionId: action.payload.id,
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
    case ACTIONS.DELETE_REGION:
      return {
        ...state,
        regions: state.regions.filter(region => region.id !== action.payload),
        activeRegionId: state.activeRegionId === action.payload ? null : state.activeRegionId,
        isLoading: false
      };
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

  // Load regions from localStorage on init
  useEffect(() => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        dispatch({ type: ACTIONS.SET_REGIONS, payload: parsedData });
      }
    } catch (error) {
      console.error('Error loading regions from localStorage:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Failed to load regions' });
    }
  }, []);

  // Save regions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.regions));
    } catch (error) {
      console.error('Error saving regions to localStorage:', error);
    }
  }, [state.regions]);

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
    isLoading: state.isLoading,
    error: state.error,
    createRegion,
    updateRegion,
    deleteRegion,
    setActiveRegion
  };
};