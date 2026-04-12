import { Connection } from '../types';
import { Component } from '../models/Component';
import './ConnectionInfo.css';

interface ConnectionInfoProps {
  connections: Connection[];
  components: Component[];
  onDeleteConnection: (connectionId: string) => void;
}

export default function ConnectionInfo({ connections, components, onDeleteConnection }: ConnectionInfoProps) {
  const getComponentName = (componentId: string): string => {
    const component = components.find(c => c.id === componentId);
    return component?.name || 'Unknown';
  };

  const getPortName = (componentId: string, portId: string): string => {
    const component = components.find(c => c.id === componentId);
    const port = component?.ports.find(p => p.id === portId);
    return port?.name || 'Unknown';
  };

  if (connections.length === 0) {
    return (
      <div className="connection-info">
        <h4>Connections</h4>
        <div className="empty-state">
          <p>No connections yet. Click on component ports to create connections.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="connection-info">
      <h4>Connections ({connections.length})</h4>
      <div className="connections-list">
        {connections.map((conn) => (
          <div key={conn.id} className={`connection-item ${conn.isValid ? 'valid' : 'invalid'}`}>
            <div className="connection-details">
              <div className="connection-from">
                <span className="component-name">{getComponentName(conn.fromComponent)}</span>
                <span className="port-name">{getPortName(conn.fromComponent, conn.fromPort)}</span>
              </div>
              <div className="connection-arrow">→</div>
              <div className="connection-to">
                <span className="component-name">{getComponentName(conn.toComponent)}</span>
                <span className="port-name">{getPortName(conn.toComponent, conn.toPort)}</span>
              </div>
            </div>
            <div className="connection-status">
              {conn.isValid ? (
                <span className="status-badge valid">✓ Valid</span>
              ) : (
                <span className="status-badge invalid">⚠ Check</span>
              )}
              <button
                onClick={() => onDeleteConnection(conn.id)}
                className="btn-delete-conn"
                title="Delete connection"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
