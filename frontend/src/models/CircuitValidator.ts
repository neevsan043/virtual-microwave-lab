import { Component } from './Component';
import { Connection, ValidationResult, ValidationError } from '../types';

export class CircuitValidator {
  static validateConnection(
    fromComponent: Component,
    fromPortId: string,
    toComponent: Component,
    toPortId: string
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if ports exist
    const fromPort = fromComponent.getPort(fromPortId);
    const toPort = toComponent.getPort(toPortId);

    if (!fromPort) {
      errors.push({
        type: 'connection',
        message: `Port ${fromPortId} not found on component ${fromComponent.name}`,
        componentId: fromComponent.id,
      });
    }

    if (!toPort) {
      errors.push({
        type: 'connection',
        message: `Port ${toPortId} not found on component ${toComponent.name}`,
        componentId: toComponent.id,
      });
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Check port type compatibility
    if (fromPort!.type === 'input' && toPort!.type === 'input') {
      errors.push({
        type: 'connection',
        message: 'Cannot connect two input ports together',
      });
    }

    // Check component compatibility
    if (!fromComponent.canConnectTo(toComponent, fromPortId, toPortId)) {
      errors.push({
        type: 'connection',
        message: `${fromComponent.name} cannot connect to ${toComponent.name}`,
        componentId: fromComponent.id,
      });
    }

    // Check for self-connection
    if (fromComponent.id === toComponent.id) {
      errors.push({
        type: 'connection',
        message: 'Cannot connect a component to itself',
        componentId: fromComponent.id,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateCircuit(
    components: Component[],
    connections: Connection[]
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Check for duplicate connections
    const connectionKeys = new Set<string>();
    connections.forEach((conn) => {
      const key = `${conn.fromComponent}-${conn.fromPort}-${conn.toComponent}-${conn.toPort}`;
      if (connectionKeys.has(key)) {
        errors.push({
          type: 'connection',
          message: 'Duplicate connection detected',
          connectionId: conn.id,
        });
      }
      connectionKeys.add(key);
    });

    // Check for multiple connections to the same port
    const portConnections = new Map<string, number>();
    connections.forEach((conn) => {
      const fromKey = `${conn.fromComponent}-${conn.fromPort}`;
      const toKey = `${conn.toComponent}-${conn.toPort}`;

      portConnections.set(fromKey, (portConnections.get(fromKey) || 0) + 1);
      portConnections.set(toKey, (portConnections.get(toKey) || 0) + 1);
    });

    portConnections.forEach((count, key) => {
      if (count > 1) {
        errors.push({
          type: 'connection',
          message: `Port ${key} has multiple connections`,
        });
      }
    });

    // Check for isolated components (no connections)
    const connectedComponents = new Set<string>();
    connections.forEach((conn) => {
      connectedComponents.add(conn.fromComponent);
      connectedComponents.add(conn.toComponent);
    });

    components.forEach((comp) => {
      // Sources and measurement instruments can be isolated
      const canBeIsolated = [
        'signal_generator',
        'power_meter',
        'spectrum_analyzer',
        'network_analyzer',
      ].includes(comp.type);

      if (!connectedComponents.has(comp.id) && !canBeIsolated) {
        errors.push({
          type: 'component',
          message: `Component ${comp.name} is not connected`,
          componentId: comp.id,
        });
      }
    });

    // Check for required components
    const hasSource = components.some((c) => c.type === 'signal_generator');
    const hasMeasurement = components.some((c) =>
      ['power_meter', 'spectrum_analyzer', 'network_analyzer'].includes(c.type)
    );

    if (!hasSource) {
      errors.push({
        type: 'circuit',
        message: 'Circuit must have at least one signal source',
      });
    }

    if (!hasMeasurement) {
      errors.push({
        type: 'circuit',
        message: 'Circuit must have at least one measurement instrument',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static getConnectionErrorMessage(error: ValidationError): string {
    switch (error.type) {
      case 'connection':
        return `Connection Error: ${error.message}`;
      case 'component':
        return `Component Error: ${error.message}`;
      case 'circuit':
        return `Circuit Error: ${error.message}`;
      default:
        return error.message;
    }
  }
}
