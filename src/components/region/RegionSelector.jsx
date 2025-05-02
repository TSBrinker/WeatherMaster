// src/components/RegionSelector.jsx
import React from 'react';
import { useRegion } from '../contexts/RegionContext';

const RegionSelector = () => {
  const { regions, activeRegion, setActiveRegion } = useRegion();
  
  const handleChange = (e) => {
    const regionId = e.target.value;
    if (regionId === 'create-new') {
      // This would typically navigate to region creation form
      console.log('Navigate to region creation');
    } else {
      setActiveRegion(regionId);
    }
  };
  
  return (
    <div>
      <select
        value={activeRegion?.id || ''}
        onChange={handleChange}
        className="p-2 rounded bg-surface-light text-white border border-border"
      >
        <option value="" disabled>
          {regions.length > 0 ? 'Select a region' : 'No regions available'}
        </option>
        
        {regions.map(region => (
          <option key={region.id} value={region.id}>
            {region.name}
          </option>
        ))}
        
        <option value="create-new">+ Add New Region</option>
      </select>
    </div>
  );
};

export default RegionSelector;