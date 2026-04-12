import { useState } from 'react';
import { ComponentFactory } from '../models/ComponentFactory';
import { ComponentType } from '../types';
import './ComponentLibrary.css';

interface ComponentLibraryProps {
  onComponentSelect: (type: ComponentType) => void;
}

export default function ComponentLibrary({ onComponentSelect }: ComponentLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ComponentFactory.getComponentsByCategory();
  const allCategories = ['All', ...Object.keys(categories)];

  const getFilteredComponents = (): ComponentType[] => {
    let components: ComponentType[] = [];

    if (selectedCategory === 'All') {
      components = ComponentFactory.getAllComponentTypes();
    } else {
      components = categories[selectedCategory] || [];
    }

    if (searchQuery) {
      components = components.filter((type) => {
        const info = ComponentFactory.getComponentInfo(type);
        return (
          info?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          info?.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    return components;
  };

  const filteredComponents = getFilteredComponents();

  return (
    <div className="component-library">
      <div className="library-header">
        <h3>Component Library</h3>
        <input
          type="text"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="category-tabs">
        {allCategories.map((category) => (
          <button
            key={category}
            className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="component-grid">
        {filteredComponents.map((type) => {
          const info = ComponentFactory.getComponentInfo(type);
          if (!info) return null;

          return (
            <div
              key={type}
              className="component-card"
              onClick={() => onComponentSelect(type)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('componentType', type);
              }}
            >
              <div className="component-icon">{info.icon}</div>
              <div className="component-info">
                <h4>{info.name}</h4>
                <p>{info.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {filteredComponents.length === 0 && (
        <div className="empty-state">
          <p>No components found matching your search.</p>
        </div>
      )}
    </div>
  );
}
