// contexts/WorldContext.js
import React, { createContext, useReducer, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Initial state for the world context
const initialState = {
  worlds: [],
  activeWorldId: null,
  activeRegionId: null,
  activeLocationId: null,
  isLoading: false,
  error: null
};

// Create the context
export const WorldContext = createContext();

// Action types for the reducer
export const ACTIONS = {
  SET_WORLDS: 'set_worlds',
  ADD_WORLD: 'add_world',
  UPDATE_WORLD: 'update_world',
  DELETE_WORLD: 'delete_world',
  SET_ACTIVE_WORLD: 'set_active_world',
  ADD_REGION: 'add_region',
  UPDATE_REGION: 'update_region',
  DELETE_REGION: 'delete_region',
  SET_ACTIVE_REGION: 'set_active_region',
  ADD_LOCATION: 'add_location',
  UPDATE_LOCATION: 'update_location',
  DELETE_LOCATION: 'delete_location',
  SET_ACTIVE_LOCATION: 'set_active_location',
  UPDATE_WEATHER_DATA: 'update_weather_data',
  SET_LOADING: 'set_loading',
  SET_ERROR: 'set_error'
};

// Reducer function to handle state updates
const worldReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_WORLDS:
      return {
        ...state,
        worlds: action.payload,
        isLoading: false
      };
    case ACTIONS.ADD_WORLD:
      return {
        ...state,
        worlds: [...state.worlds, action.payload],
        activeWorldId: action.payload.id,
        isLoading: false
      };
    case ACTIONS.UPDATE_WORLD:
      return {
        ...state,
        worlds: state.worlds.map(world => 
          world.id === action.payload.id ? action.payload : world
        ),
        isLoading: false
      };
    case ACTIONS.DELETE_WORLD: {
      const updatedWorlds = state.worlds.filter(world => world.id !== action.payload);
      // Reset active IDs if deleting the active world
      const resetActiveIds = state.activeWorldId === action.payload;
      
      return {
        ...state,
        worlds: updatedWorlds,
        activeWorldId: resetActiveIds ? null : state.activeWorldId,
        activeRegionId: resetActiveIds ? null : state.activeRegionId,
        activeLocationId: resetActiveIds ? null : state.activeLocationId,
        isLoading: false
      };
    }
    case ACTIONS.SET_ACTIVE_WORLD:
      return {
        ...state,
        activeWorldId: action.payload,
        activeRegionId: null,
        activeLocationId: null
      };
    case ACTIONS.ADD_REGION: {
      const { worldId, region } = action.payload;
      return {
        ...state,
        worlds: state.worlds.map(world => {
          if (world.id === worldId) {
            return {
              ...world,
              regions: [...(world.regions || []), region]
            };
          }
          return world;
        }),
        activeRegionId: region.id,
        isLoading: false
      };
    }
    case ACTIONS.UPDATE_REGION: {
      const { worldId, region } = action.payload;
      return {
        ...state,
        worlds: state.worlds.map(world => {
          if (world.id === worldId) {
            return {
              ...world,
              regions: world.regions.map(r => 
                r.id === region.id ? region : r
              )
            };
          }
          return world;
        }),
        isLoading: false
      };
    }
    case ACTIONS.DELETE_REGION: {
      const { worldId, regionId } = action.payload;
      const resetActiveIds = state.activeRegionId === regionId;
      
      return {
        ...state,
        worlds: state.worlds.map(world => {
          if (world.id === worldId) {
            return {
              ...world,
              regions: world.regions.filter(region => region.id !== regionId)
            };
          }
          return world;
        }),
        activeRegionId: resetActiveIds ? null : state.activeRegionId,
        activeLocationId: resetActiveIds ? null : state.activeLocationId,
        isLoading: false
      };
    }
    case ACTIONS.SET_ACTIVE_REGION:
      return {
        ...state,
        activeRegionId: action.payload,
        activeLocationId: null
      };
    case ACTIONS.ADD_LOCATION: {
      const { worldId, regionId, location } = action.payload;
      return {
        ...state,
        worlds: state.worlds.map(world => {
          if (world.id === worldId) {
            return {
              ...world,
              regions: world.regions.map(region => {
                if (region.id === regionId) {
                  return {
                    ...region,
                    locations: [...(region.locations || []), location]
                  };
                }
                return region;
              })
            };
          }
          return world;
        }),
        activeLocationId: location.id,
        isLoading: false
      };
    }
    case ACTIONS.UPDATE_LOCATION: {
      const { worldId, regionId, location } = action.payload;
      return {
        ...state,
        worlds: state.worlds.map(world => {
          if (world.id === worldId) {
            return {
              ...world,
              regions: world.regions.map(region => {
                if (region.id === regionId) {
                  return {
                    ...region,
                    locations: region.locations.map(loc => 
                      loc.id === location.id ? location : loc
                    )
                  };
                }
                return region;
              })
            };
          }
          return world;
        }),
        isLoading: false
      };
    }
    case ACTIONS.DELETE_LOCATION: {
      const { worldId, regionId, locationId } = action.payload;
      return {
        ...state,
        worlds: state.worlds.map(world => {
          if (world.id === worldId) {
            return {
              ...world,
              regions: world.regions.map(region => {
                if (region.id === regionId) {
                  return {
                    ...region,
                    locations: region.locations.filter(location => location.id !== locationId)
                  };
                }
                return region;
              })
            };
          }
          return world;
        }),
        activeLocationId: state.activeLocationId === locationId ? null : state.activeLocationId,
        isLoading: false
      };
    }
    case ACTIONS.SET_ACTIVE_LOCATION:
      return {
        ...state,
        activeLocationId: action.payload
      };
    case ACTIONS.UPDATE_WEATHER_DATA: {
      const { worldId, regionId, locationId, weatherData } = action.payload;
      return {
        ...state,
        worlds: state.worlds.map(world => {
          if (world.id === worldId) {
            return {
              ...world,
              regions: world.regions.map(region => {
                if (region.id === regionId) {
                  return {
                    ...region,
                    locations: region.locations.map(location => {
                      if (location.id === locationId) {
                        return {
                          ...location,
                          weatherData
                        };
                      }
                      return location;
                    })
                  };
                }
                return region;
              })
            };
          }
          return world;
        }),
        isLoading: false
      };
    }
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

// World context provider component
export const WorldProvider = ({ children }) => {
  const [state, dispatch] = useReducer(worldReducer, initialState);
  
  // Create a memoized value to avoid unnecessary re-renders
  const value = React.useMemo(() => ({
    state,
    dispatch
  }), [state]);

  return (
    <WorldContext.Provider value={value}>
      {children}
    </WorldContext.Provider>
  );
};

// Custom hook to use the world context
export const useWorldContext = () => {
  const context = useContext(WorldContext);
  if (context === undefined) {
    throw new Error('useWorldContext must be used within a WorldProvider');
  }
  return context;
};