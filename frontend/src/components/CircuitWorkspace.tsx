import { useState, useEffect, useRef } from 'react';
import CircuitBuilder from './CircuitBuilder';
import ComponentLibrary from './ComponentLibrary';
import ComponentProperties from './ComponentProperties';
import ConnectionInfo from './ConnectionInfo';
import SimulationResults from './SimulationResults';
import InstrumentsPanel from './InstrumentsPanel';
import CircuitImageUpload from './CircuitImageUpload';
import { Component } from '../models/Component';
import { ComponentFactory } from '../models/ComponentFactory';
import { ComponentType, Connection, CircuitData, Experiment } from '../types';
import { circuitService } from '../services/circuitService';
import { progressService } from '../services/progressService';
import { RFSimulator, SimulationResult } from '../simulation/RFSimulator';
import './CircuitWorkspace.css';

export default function CircuitWorkspace({ experiment, onBack }: { experiment?: Experiment | null; onBack?: () => void }) {
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [experimentId] = useState(experiment?.id || 'default_experiment');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [simulationResults, setSimulationResults] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAIUpload, setShowAIUpload] = useState(false);
  const [aiToast, setAiToast] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved circuit when component mounts
  useEffect(() => {
    loadSavedCircuit();
  }, [experimentId]);

  const loadSavedCircuit = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading circuit for experiment:', experimentId);
      
      const circuitData = await circuitService.loadCircuit(experimentId);
      
      if (circuitData) {
        console.log('✅ Circuit data loaded from backend:', {
          components: circuitData.components.length,
          connections: circuitData.connections.length,
          metadata: circuitData.metadata
        });
        
        // Reconstruct components from JSON
        const reconstructedComponents: Component[] = [];
        for (const compData of circuitData.components) {
          const component = ComponentFactory.fromJSON(compData);
          if (component) {
            reconstructedComponents.push(component);
            console.log('✅ Reconstructed component:', component.type, component.id);
          } else {
            console.error('❌ Failed to reconstruct component:', compData);
          }
        }
        
        console.log('📊 Setting state with:', {
          components: reconstructedComponents.length,
          connections: circuitData.connections.length
        });
        
        setComponents(reconstructedComponents);
        setConnections(circuitData.connections);
        setLastSaved(circuitData.metadata.modified ? new Date(circuitData.metadata.modified) : null);
        
        console.log(`✅ Successfully loaded ${reconstructedComponents.length} components and ${circuitData.connections.length} connections`);
      } else {
        console.log('ℹ️ No saved circuit found for experiment:', experimentId);
      }
    } catch (error) {
      console.error('❌ Failed to load saved circuit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    if (components.length === 0 && connections.length === 0) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSave();
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [components, connections]);

  const handleAutoSave = async () => {
    try {
      const circuitData: CircuitData = {
        components: components.map(c => c.toJSON()),
        connections,
        metadata: {
          created: new Date(),
          modified: new Date(),
          version: '1.0',
        },
      };

      await circuitService.autoSaveCircuit(experimentId, circuitData);
      setLastSaved(new Date());
      console.log('Circuit auto-saved');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleComponentSelect = (type: ComponentType) => {
    // Component will be added via drag and drop
    console.log('Component selected:', type);
  };

  const handleComponentPropertySelect = (component: Component | null) => {
    setSelectedComponent(component);
  };

  const handleParameterChange = (key: string, value: number | string | boolean) => {
    if (!selectedComponent) return;

    selectedComponent.updateParameter(key, value);
    setSelectedComponent({ ...selectedComponent });
  };

  const handleDeleteComponent = () => {
    if (!selectedComponent) return;
    setSelectedComponent(null);
  };

  const handleCircuitChange = (newComponents: Component[], newConnections: Connection[]) => {
    setComponents(newComponents);
    setConnections(newConnections);
  };

  const handleDeleteConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  };

  const handleSaveCircuit = async () => {
    try {
      const circuitData: CircuitData = {
        components: components.map(c => c.toJSON()),
        connections,
        metadata: {
          created: new Date(),
          modified: new Date(),
          version: '1.0',
        },
      };

      await circuitService.saveCircuit(experimentId, circuitData);
      setLastSaved(new Date());
      
      // Update progress
      if (experiment) {
        await progressService.updateProgress(experiment.id, {
          circuitSaved: true,
          lastAccessedAt: new Date(),
        });
      }
      
      alert('Circuit saved successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to save circuit');
    }
  };

  const handleMarkComplete = async () => {
    if (!experiment) return;

    const confirmed = window.confirm(
      'Mark this experiment as complete?\n\n' +
      'This will:\n' +
      '• Save your current circuit\n' +
      '• Mark the experiment as completed\n' +
      '• Return you to the dashboard'
    );

    if (!confirmed) return;

    try {
      // Save circuit first
      const circuitData: CircuitData = {
        components: components.map(c => c.toJSON()),
        connections,
        metadata: {
          created: new Date(),
          modified: new Date(),
          version: '1.0',
        },
      };

      await circuitService.saveCircuit(experimentId, circuitData);
      console.log('✅ Circuit saved before marking complete');
      
      // Mark as complete with explicit status
      await progressService.updateProgress(experiment.id, {
        status: 'completed',
        completedAt: new Date(),
        lastAccessedAt: new Date(),
        circuitSaved: true,
        simulationRun: simulationResults?.success || false,
      });
      console.log('✅ Progress updated to completed');

      // Also update localStorage directly to ensure it's saved
      const stored = localStorage.getItem('experiment_progress') || '{}';
      const allProgress = JSON.parse(stored);
      if (allProgress[experiment.id]) {
        allProgress[experiment.id].status = 'completed';
        allProgress[experiment.id].completedAt = new Date();
        localStorage.setItem('experiment_progress', JSON.stringify(allProgress));
        console.log('✅ LocalStorage updated');
      }

      alert('Experiment marked as complete! 🎉');
      
      // Return to dashboard
      if (onBack) {
        onBack();
      }
    } catch (error: any) {
      console.error('Failed to mark experiment as complete:', error);
      alert(error.message || 'Failed to mark experiment as complete');
    }
  };

  const handleLoadCircuit = async () => {
    try {
      const circuitData = await circuitService.loadCircuit(experimentId);
      if (!circuitData) {
        alert('No saved circuit found');
        return;
      }

      // TODO: Reconstruct components and connections from loaded data
      alert('Circuit loaded! (Full reconstruction pending)');
      console.log('Loaded circuit:', circuitData);
    } catch (error: any) {
      alert(error.message || 'Failed to load circuit');
    }
  };

  const handleExportCircuit = async () => {
    try {
      const circuitData: CircuitData = {
        components: components.map(c => c.toJSON()),
        connections,
        metadata: {
          created: new Date(),
          modified: new Date(),
          version: '1.0',
        },
      };

      const blob = await circuitService.exportCircuit(circuitData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `circuit_${experimentId}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert('Failed to export circuit');
    }
  };

  const handleImportCircuit = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const circuitData = await circuitService.importCircuit(file);
      // TODO: Reconstruct components and connections from imported data
      alert('Circuit imported! (Full reconstruction pending)');
      console.log('Imported circuit:', circuitData);
    } catch (error: any) {
      alert(error.message || 'Failed to import circuit');
    }
  };

  const handleSimulate = async () => {
    if (components.length === 0) {
      alert('Please add components to the circuit first!');
      return;
    }

    setIsSimulating(true);

    try {
      // Create simulator instance
      const simulator = new RFSimulator(components, connections, {
        start: 1e9, // 1 GHz
        stop: 3e9,  // 3 GHz
        points: 101,
      });

      // Run simulation
      const results = await simulator.simulate();
      setSimulationResults(results);

      // Update progress
      if (experiment && results.success) {
        await progressService.updateProgress(experiment.id, {
          simulationRun: true,
          lastAccessedAt: new Date(),
        });
      }

      if (!results.success) {
        alert('Simulation failed. Check the results for errors.');
      }
    } catch (error: any) {
      alert('Simulation error: ' + (error.message || 'Unknown error'));
      console.error('Simulation error:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCloseResults = () => {
    setSimulationResults(null);
  };

  // ── AI Image Load ──────────────────────────────────────────────────────────
  const handleAILoadComponents = (payload: { components: any[], connections: any[] }) => {
    if (!payload.components || payload.components.length === 0) return;

    // ── Step 1: Map spatial components ───────────────────────────────────────
    // Normalized coords (0-1) scaled to a typical canvas size (e.g. 1000x800)
    // with some padding to keep them away from the far edges.
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 500;
    const OFFSET_X = 50;
    const OFFSET_Y = 50;

    const newComponents: Component[] = payload.components.map((c: any) => {
      const position = { 
        x: OFFSET_X + (c.x * CANVAS_WIDTH), 
        y: OFFSET_Y + (c.y * CANVAS_HEIGHT) 
      };
      
      const comp = ComponentFactory.createComponent(c.type as ComponentType, position);
      if (comp) {
        // Retain an internal mapping ID so we can wire them correctly
        (comp as any)._aiId = c.id; 
      }
      return comp;
    }).filter(Boolean) as Component[];

    // ── Step 2: Extract explicit graph connections ───────────────────────────
    const newConnections: Connection[] = [];
    
    // Fallback: If AI returned 0 explicit connections but multiple components, 
    // attempt to link them linearly from left to right as a baseline.
    let edges = payload.connections || [];
    if (edges.length === 0 && newComponents.length > 1) {
      const sorted = [...newComponents].sort((a, b) => a.position.x - b.position.x);
      for (let i = 0; i < sorted.length - 1; i++) {
        edges.push({ from: (sorted[i] as any)._aiId, to: (sorted[i+1] as any)._aiId });
      }
    }

    for (const edge of edges) {
      const from = newComponents.find(c => (c as any)._aiId === edge.from);
      const to = newComponents.find(c => (c as any)._aiId === edge.to);

      if (!from || !to) continue;

      // Find best output port on 'from'
      const fromPort =
        from.ports.find(p => p.type === 'output') ||
        from.ports.find(p => p.type === 'bidirectional') ||
        from.ports[from.ports.length - 1];

      // Find best input port on 'to'
      const toPort =
        to.ports.find(p => p.type === 'input') ||
        to.ports.find(p => p.type === 'bidirectional') ||
        to.ports[0];

      if (!fromPort || !toPort) continue;

      newConnections.push({
        id: `ai_conn_${edge.from}_${edge.to}_${Date.now()}`,
        fromComponent: from.id,
        fromPort: fromPort.id,
        toComponent: to.id,
        toPort: toPort.id,
      });
    }

    // ── Step 4: merge into existing circuit ─────────────────────────────────
    const updated    = [...components, ...newComponents];
    const allConns   = [...connections, ...newConnections];

    setComponents(updated);
    setConnections(allConns);

    // ── Step 5: feedback toast ───────────────────────────────────────────────
    const msg = `✅ AI mapped ${newComponents.length} components into their spatial layout with ${newConnections.length} connection${newConnections.length !== 1 ? 's' : ''}.`;
    setAiToast(msg);
    setTimeout(() => setAiToast(null), 5000);
    console.log('🤖 AI spatial load finished — nodes:', newComponents.length, 'edges:', newConnections.length);
  };


  // Proxy to satisfy CircuitBuilder's onCircuitChange signature
  const onCircuitChange = (newComponents: Component[], newConnections: Connection[]) => {
    handleCircuitChange(newComponents, newConnections);
  };

  return (
    <div className="circuit-workspace">
      <div className="workspace-header">
        <div className="header-left">
          {onBack && (
            <button onClick={onBack} className="btn-back" title="Back to Dashboard">
              ← Back
            </button>
          )}
          <h2>{experiment?.title || 'Circuit Builder Workspace'}</h2>
          {experiment && (
            <span className="experiment-info">
              {experiment.difficulty} • {experiment.estimatedTime} min
            </span>
          )}
          {lastSaved && (
            <span className="last-saved">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="workspace-actions">
          <input
            type="file"
            accept=".json"
            onChange={handleImportCircuit}
            style={{ display: 'none' }}
            id="import-circuit"
          />
          <label htmlFor="import-circuit" className="btn-action">
            📥 Import
          </label>
          <button onClick={handleExportCircuit} className="btn-action">
            📤 Export
          </button>
          <button onClick={handleSaveCircuit} className="btn-action">
            💾 Save
          </button>
          <button onClick={handleLoadCircuit} className="btn-action">
            📂 Load
          </button>
          <button
            onClick={() => setShowAIUpload(true)}
            className="btn-action btn-ai"
            title="Upload a circuit image and let AI load components automatically"
          >
            🤖 AI Load
          </button>
          <button 
            onClick={handleSimulate} 
            className="btn-action btn-primary"
            disabled={isSimulating}
          >
            {isSimulating ? '⏳ Simulating...' : '▶️ Simulate'}
          </button>
          {experiment && (
            <button 
              onClick={handleMarkComplete} 
              className="btn-action btn-success"
              title="Mark this experiment as complete"
            >
              ✅ Mark Complete
            </button>
          )}
        </div>
      </div>

      <div className="workspace-content">
        <div className="workspace-sidebar left">
          <ComponentLibrary onComponentSelect={handleComponentSelect} />
        </div>

        <div className="workspace-main">
          {isLoading ? (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Loading circuit...</p>
            </div>
          ) : (
            <CircuitBuilder
              onComponentSelect={handleComponentPropertySelect}
              onCircuitChange={handleCircuitChange}
              initialComponents={components}
              initialConnections={connections}
            />
          )}
        </div>

        <div className="workspace-sidebar right">
          <ComponentProperties
            component={selectedComponent}
            onParameterChange={handleParameterChange}
            onDelete={handleDeleteComponent}
          />
          <ConnectionInfo
            connections={connections}
            components={components}
            onDeleteConnection={handleDeleteConnection}
          />
          {simulationResults && simulationResults.success && (
            <InstrumentsPanel simulationResults={simulationResults} />
          )}
        </div>
      </div>

      <SimulationResults results={simulationResults} onClose={handleCloseResults} />

      {/* ── AI Circuit Image Upload Modal ───────────────────────────── */}
      {showAIUpload && (
        <CircuitImageUpload
          onLoadComponents={handleAILoadComponents}
          onClose={() => setShowAIUpload(false)}
        />
      )}

      {/* ── AI Toast Notification ──────────────────────────────────── */}
      {aiToast && (
        <div className="ai-toast">
          {aiToast}
        </div>
      )}
    </div>
  );
}
