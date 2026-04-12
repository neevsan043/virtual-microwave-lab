import { Component } from '../models/Component';
import { ComponentFactory } from '../models/ComponentFactory';
import './ComponentProperties.css';

interface ComponentPropertiesProps {
  component: Component | null;
  onParameterChange: (key: string, value: number | string | boolean) => void;
  onDelete: () => void;
}

export default function ComponentProperties({
  component,
  onParameterChange,
  onDelete,
}: ComponentPropertiesProps) {
  if (!component) {
    return (
      <div className="component-properties">
        <div className="properties-header">
          <h3>Component Properties</h3>
        </div>
        <div className="empty-state">
          <p>Select a component to view its properties</p>
        </div>
      </div>
    );
  }

  const info = ComponentFactory.getComponentInfo(component.type);

  const renderParameterInput = (key: string, value: number | string | boolean) => {
    if (typeof value === 'boolean') {
      return (
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onParameterChange(key, e.target.checked)}
          />
          <span>{formatParameterName(key)}</span>
        </label>
      );
    }

    if (typeof value === 'string') {
      return (
        <div className="parameter-group">
          <label>{formatParameterName(key)}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => onParameterChange(key, e.target.value)}
          />
        </div>
      );
    }

    // Number input
    return (
      <div className="parameter-group">
        <label>{formatParameterName(key)}</label>
        <input
          type="number"
          value={value}
          onChange={(e) => onParameterChange(key, parseFloat(e.target.value))}
          step="any"
        />
        <span className="parameter-unit">{getParameterUnit(key)}</span>
      </div>
    );
  };

  const formatParameterName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const getParameterUnit = (key: string): string => {
    const units: Record<string, string> = {
      frequency: 'Hz',
      power: 'dBm',
      impedance: 'Ω',
      resistance: 'Ω',
      length: 'm',
      gain: 'dB',
      noiseFigure: 'dB',
      bandwidth: 'Hz',
      centerFrequency: 'Hz',
      startFrequency: 'Hz',
      stopFrequency: 'Hz',
      rbw: 'Hz',
      vbw: 'Hz',
      attenuation: 'dB',
      sweepTime: 's',
      tolerance: '%',
      powerRating: 'W',
      loss: 'dB/m',
      p1dB: 'dBm',
      accuracy: 'dB',
    };
    return units[key] || '';
  };

  return (
    <div className="component-properties">
      <div className="properties-header">
        <h3>Component Properties</h3>
        <button onClick={onDelete} className="btn-delete" title="Delete component">
          🗑️
        </button>
      </div>

      <div className="component-details">
        <div className="component-icon-large">{info?.icon}</div>
        <h4>{component.name}</h4>
        <p className="component-type">{info?.name}</p>
        <p className="component-description">{info?.description}</p>
      </div>

      <div className="properties-section">
        <h5>Parameters</h5>
        <div className="parameters-list">
          {Object.entries(component.parameters).map(([key, value]) => (
            <div key={key}>{renderParameterInput(key, value)}</div>
          ))}
        </div>
      </div>

      <div className="properties-section">
        <h5>Ports</h5>
        <div className="ports-list">
          {component.ports.map((port) => (
            <div key={port.id} className="port-item">
              <span className="port-name">{port.name}</span>
              <span className={`port-type ${port.type}`}>{port.type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="properties-section">
        <h5>Position</h5>
        <div className="position-info">
          <span>X: {component.position.x.toFixed(0)}px</span>
          <span>Y: {component.position.y.toFixed(0)}px</span>
          <span>Rotation: {component.rotation}°</span>
        </div>
      </div>
    </div>
  );
}
