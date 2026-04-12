import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Text, Group, Circle } from 'react-konva';
import { Component } from '../models/Component';
import { ComponentFactory } from '../models/ComponentFactory';
import { ComponentType, Connection } from '../types';
import { findOrthogonalPath } from '../utils/pathfinding';
import './CircuitBuilder.css';

interface CircuitBuilderProps {
  onComponentSelect: (component: Component | null) => void;
  onCircuitChange: (components: Component[], connections: Connection[]) => void;
  initialComponents?: Component[];
  initialConnections?: Connection[];
}

// Orthogonal (Manhattan) routing removed — now imported from A* pathfinding.ts

export default function CircuitBuilder({
  onComponentSelect,
  onCircuitChange,
  initialComponents = [],
  initialConnections = []
}: CircuitBuilderProps) {
  const [components, setComponents] = useState<Component[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ componentId: string; portId: string } | null>(null);
  const stageRef = useRef<any>(null);
  const hasInitialized = useRef(false);

  // Initialize with loaded data
  useEffect(() => {
    if (initialComponents.length > 0 || initialConnections.length > 0) {
      const isNewData =
        initialComponents.length !== components.length ||
        initialConnections.length !== connections.length ||
        !hasInitialized.current;

      if (isNewData) {
        setComponents(initialComponents);
        setConnections(initialConnections);
        hasInitialized.current = true;
      }
    }
  }, [initialComponents, initialConnections]);

  // Keyboard shortcuts: Delete/Backspace removes selected component or connection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponent) {
          e.preventDefault();
          deleteSelectedComponent();
        } else if (selectedConnectionId) {
          e.preventDefault();
          deleteSelectedConnection(selectedConnectionId);
        }
      }
      // Escape clears selection
      if (e.key === 'Escape') {
        setSelectedComponent(null);
        setSelectedConnectionId(null);
        setConnectionStart(null);
        if (connectionMode) setConnectionMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponent, selectedConnectionId, components, connections, connectionMode]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType') as ComponentType;
    if (!componentType) return;

    const stage = stageRef.current;
    if (!stage) return;

    const rect = stage.container().getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const component = ComponentFactory.createComponent(componentType, { x, y });
    if (component) {
      const newComponents = [...components, component];
      setComponents(newComponents);
      onCircuitChange(newComponents, connections);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearCanvas = () => {
    setComponents([]);
    setConnections([]);
    setSelectedComponent(null);
    setSelectedConnectionId(null);
    setConnectionMode(false);
    setConnectionStart(null);
    onComponentSelect(null);
    onCircuitChange([], []);
  };

  const deleteSelectedComponent = () => {
    if (!selectedComponent) return;

    const newComponents = components.filter(c => c.id !== selectedComponent.id);
    const newConnections = connections.filter(
      c => c.fromComponent !== selectedComponent.id && c.toComponent !== selectedComponent.id
    );

    setComponents(newComponents);
    setConnections(newConnections);
    setSelectedComponent(null);
    onComponentSelect(null);
    onCircuitChange(newComponents, newConnections);
  };

  const deleteSelectedConnection = (connectionId: string) => {
    const newConnections = connections.filter(c => c.id !== connectionId);
    setConnections(newConnections);
    setSelectedConnectionId(null);
    onCircuitChange(components, newConnections);
  };

  const toggleConnectionMode = () => {
    setConnectionMode(!connectionMode);
    setConnectionStart(null);
    setSelectedConnectionId(null);
  };

  const handlePortClick = (componentId: string, portId: string) => {
    if (!connectionMode) return;

    if (!connectionStart) {
      setConnectionStart({ componentId, portId });
    } else {
      if (connectionStart.componentId === componentId) {
        setConnectionStart(null);
        return;
      }

      const newConnection: Connection = {
        id: `conn_${Date.now()}`,
        fromComponent: connectionStart.componentId,
        fromPort: connectionStart.portId,
        toComponent: componentId,
        toPort: portId,
        isValid: true,
      };

      const newConnections = [...connections, newConnection];
      setConnections(newConnections);
      onCircuitChange(components, newConnections);
      setConnectionStart(null);
    }
  };

  // Click on the stage background → deselect everything
  const handleStageClick = () => {
    if (!connectionMode) {
      setSelectedComponent(null);
      setSelectedConnectionId(null);
      onComponentSelect(null);
    }
  };

  // ── Grid ──────────────────────────────────────────────────────────────────
  const gridSize = 20;
  const gridLines: JSX.Element[] = [];

  for (let i = 0; i <= 1600 / gridSize; i++) {
    gridLines.push(
      <Line key={`v-${i}`} points={[i * gridSize, 0, i * gridSize, 1000]} stroke="#ddd" strokeWidth={1} />
    );
  }
  for (let i = 0; i <= 1000 / gridSize; i++) {
    gridLines.push(
      <Line key={`h-${i}`} points={[0, i * gridSize, 1600, i * gridSize]} stroke="#ddd" strokeWidth={1} />
    );
  }

  // ── Hit-test helper for orthogonal polyline ───────────────────────────────
  // Returns the minimum distance from point (px,py) to any segment of the polyline.
  function distToPolyline(pts: number[], px: number, py: number): number {
    let minDist = Infinity;
    for (let i = 0; i < pts.length - 2; i += 2) {
      const ax = pts[i], ay = pts[i + 1];
      const bx = pts[i + 2], by = pts[i + 3];
      const dx = bx - ax, dy = by - ay;
      const lenSq = dx * dx + dy * dy;
      let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const cx = ax + t * dx, cy = ay + t * dy;
      const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="circuit-builder">
      <div className="builder-toolbar">
        <button onClick={clearCanvas} className="toolbar-btn">🗑️ Clear</button>

        <button
          onClick={deleteSelectedComponent}
          className="toolbar-btn"
          disabled={!selectedComponent}
          title="Delete selected component (Del)"
        >
          ❌ Delete Component
        </button>

        {/* ── Delete Connection button ─────────────────────────── */}
        <button
          onClick={() => selectedConnectionId && deleteSelectedConnection(selectedConnectionId)}
          className={`toolbar-btn ${selectedConnectionId ? 'btn-del-conn' : ''}`}
          disabled={!selectedConnectionId}
          title="Delete selected connection (Del)"
        >
          ✂️ Delete Connection
        </button>

        <button
          onClick={toggleConnectionMode}
          className={`toolbar-btn ${connectionMode ? 'active' : ''}`}
        >
          🔌 {connectionMode ? 'Connecting...' : 'Connect'}
        </button>

        <div className="toolbar-info">
          <span>Components: {components.length}</span>
          <span>Connections: {connections.length}</span>
          {connectionStart && <span>⚡ Click a port to complete connection</span>}
          {selectedConnectionId && !connectionMode && (
            <span className="conn-selected-hint">🔗 Connection selected — press Del or click ✂️</span>
          )}
        </div>
      </div>

      <div
        className="canvas-container"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Stage
          ref={stageRef}
          width={1600}
          height={1000}
          style={{ backgroundColor: '#f8f9fa' }}
          onClick={handleStageClick}
        >
          <Layer key={`layer-${components.length}-${connections.length}`}>
            {/* Grid */}
            {gridLines}

            {/* ── Orthogonal connection lines ────────────────────────── */}
            {connections.map(conn => {
              const fromComp = components.find(c => c.id === conn.fromComponent);
              const toComp   = components.find(c => c.id === conn.toComponent);
              if (!fromComp || !toComp) return null;

              const fromPort = fromComp.ports.find(p => p.id === conn.fromPort);
              const toPort   = toComp.ports.find(p => p.id === conn.toPort);
              if (!fromPort || !toPort) return null;

              const x1 = fromComp.position.x + fromPort.position.x;
              const y1 = fromComp.position.y + fromPort.position.y;
              const x2 = toComp.position.x   + toPort.position.x;
              const y2 = toComp.position.y   + toPort.position.y;

              const pts = findOrthogonalPath(x1, y1, x2, y2, components);
              const isSelected = selectedConnectionId === conn.id;

              // Base stroke color
              const strokeColor = isSelected
                ? '#f6ad55'
                : conn.isValid
                  ? '#667eea'
                  : '#f56565';

              return (
                <Group key={conn.id}>
                  {/* Wide invisible hit area so clicks are easy */}
                  <Line
                    points={pts}
                    stroke="transparent"
                    strokeWidth={18}
                    lineCap="round"
                    lineJoin="round"
                    onClick={(e) => {
                      e.cancelBubble = true;
                      if (!connectionMode) {
                        setSelectedComponent(null);
                        onComponentSelect(null);
                        setSelectedConnectionId(
                          selectedConnectionId === conn.id ? null : conn.id
                        );
                      }
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage()?.container();
                      if (container && !connectionMode) container.style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                      const container = e.target.getStage()?.container();
                      if (container) container.style.cursor = 'default';
                    }}
                  />
                  {/* Visible wire */}
                  <Line
                    points={pts}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 4 : 2.5}
                    lineCap="round"
                    lineJoin="round"
                    dash={isSelected ? [8, 4] : undefined}
                    shadowEnabled={isSelected}
                    shadowColor="#f6ad55"
                    shadowBlur={8}
                    listening={false}
                  />
                  {/* Corner dots for selected connection */}
                  {isSelected && (() => {
                    const dots: JSX.Element[] = [];
                    for (let i = 2; i < pts.length - 2; i += 2) {
                      const px = pts[i], py = pts[i + 1];
                      // Only add a dot if this is a real corner (direction changes)
                      const prevDx = pts[i] - pts[i - 2];
                      const prevDy = pts[i + 1] - pts[i - 1];
                      const nextDx = pts[i + 2] - pts[i];
                      const nextDy = pts[i + 3] - pts[i + 1];
                      if (Math.abs(prevDx) !== Math.abs(nextDx) || Math.abs(prevDy) !== Math.abs(nextDy)) {
                        dots.push(
                          <Circle
                            key={`dot-${i}`}
                            x={px} y={py}
                            radius={4}
                            fill="#f6ad55"
                            listening={false}
                          />
                        );
                      }
                    }
                    return dots;
                  })()}
                </Group>
              );
            })}

            {/* ── Components ──────────────────────────────────────────── */}
            {components.map(component => {
              const info = ComponentFactory.getComponentInfo(component.type);
              if (!info) return null;

              const isSelected = selectedComponent?.id === component.id;

              return (
                <Group key={component.id}>
                  <Group
                    x={component.position.x}
                    y={component.position.y}
                    draggable
                    onClick={(e) => {
                      e.cancelBubble = true;
                      if (!connectionMode) {
                        setSelectedComponent(component);
                        setSelectedConnectionId(null);
                        onComponentSelect(component);
                      }
                    }}
                    onDragMove={() => {
                      // Live re-render while dragging so wires follow
                      setComponents([...components]);
                    }}
                    onDragEnd={(e) => {
                      component.position.x = e.target.x();
                      component.position.y = e.target.y();
                      setComponents([...components]);
                      onCircuitChange([...components], connections);
                    }}
                  >
                    {/* Component box */}
                    <Rect
                      width={80}
                      height={50}
                      fill="#fff"
                      stroke={isSelected ? '#f6ad55' : '#667eea'}
                      strokeWidth={isSelected ? 3 : 2}
                      cornerRadius={8}
                      shadowBlur={isSelected ? 10 : 0}
                      shadowColor="orange"
                    />

                    {/* Icon */}
                    <Text text={info.icon} x={15} y={5} fontSize={24} />

                    {/* Label */}
                    <Text
                      text={info.name}
                      x={5} y={32}
                      fontSize={10}
                      fill="#333"
                      width={70}
                      align="center"
                    />

                    {/* Ports */}
                    {component.ports.map(port => {
                      const isStartPort =
                        connectionStart?.componentId === component.id &&
                        connectionStart?.portId === port.id;

                      return (
                        <Circle
                          key={port.id}
                          x={port.position.x}
                          y={port.position.y}
                          radius={6}
                          fill={
                            isStartPort ? '#f6ad55' :
                            port.type === 'input'  ? '#48bb78' :
                            port.type === 'output' ? '#f56565' :
                            '#667eea'
                          }
                          stroke="#fff"
                          strokeWidth={2}
                          onClick={(e) => {
                            e.cancelBubble = true;
                            handlePortClick(component.id, port.id);
                          }}
                          onMouseEnter={(e) => {
                            const container = e.target.getStage()?.container();
                            if (container) container.style.cursor = connectionMode ? 'pointer' : 'default';
                          }}
                          onMouseLeave={(e) => {
                            const container = e.target.getStage()?.container();
                            if (container) container.style.cursor = 'default';
                          }}
                        />
                      );
                    })}
                  </Group>
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
