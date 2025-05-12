// src/components/region/RegionTemplateSelector.jsx
import React, { useState, useEffect } from "react";
import {
  regionTemplates,
  getTemplateForBiome,
} from "../../data-tables/regionTemplates";

/**
 * Component for selecting a region template when creating/editing regions
 * Displays available region templates as cards with descriptions
 */
const RegionTemplateSelector = ({
  selectedTemplate,
  onSelectTemplate,
  initialBiome,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTemplates, setFilteredTemplates] = useState(regionTemplates);

  // If initial biome is provided, find the matching template
  useEffect(() => {
    if (initialBiome && !selectedTemplate) {
      const template = getTemplateForBiome(initialBiome);
      if (template) {
        onSelectTemplate(template.id);
      }
    }
  }, [initialBiome, selectedTemplate, onSelectTemplate]);

  // Filter templates based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredTemplates(regionTemplates);
      return;
    }

    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = regionTemplates.filter(
      (template) =>
        template.name.toLowerCase().includes(lowerCaseSearch) ||
        template.description.toLowerCase().includes(lowerCaseSearch)
    );

    setFilteredTemplates(filtered);
  }, [searchTerm]);

  return (
    <div className="template-selector">
      <h3 className="text-xl font-semibold mb-4">Choose a Region Template</h3>

      {/* Search box */}
      <div className="search-box mb-4">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 rounded bg-surface-light text-white border border-border"
        />
      </div>

      {/* Template grid */}
      <div className="template-grid grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={`template-card p-4 rounded cursor-pointer transition-all hover:bg-surface-light ${
              selectedTemplate === template.id
                ? "bg-primary bg-opacity-30 border border-primary"
                : "bg-surface"
            }`}
            onClick={() => onSelectTemplate(template.id)}
          >
            <div className="template-content">
              <h4 className="template-title text-lg font-semibold mb-1">
                {template.name}
              </h4>
              <p className="template-description text-sm text-gray-400 mb-3">
                {template.description}
              </p>

              {/* Only show the full description if this template is selected */}
              {selectedTemplate === template.id && (
                <div className="template-full-description bg-surface-light p-3 rounded text-sm mt-2">
                  {template.gameDescription}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* No results message */}
      {filteredTemplates.length === 0 && (
        <div className="empty-results p-4 text-center bg-surface-light rounded">
          <p>No templates match your search. Try different keywords.</p>
        </div>
      )}
    </div>
  );
};

export default RegionTemplateSelector;
