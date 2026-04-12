import { useState, useEffect } from 'react';
import { experimentService } from '../services/experimentService';
import { Experiment } from '../types';
import './ExperimentsList.css';

interface ExperimentsListProps {
  onSelectExperiment: (experiment: Experiment) => void;
}

export default function ExperimentsList({ onSelectExperiment }: ExperimentsListProps) {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  useEffect(() => {
    loadExperiments();
  }, [filter]);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = filter === 'all' 
        ? await experimentService.getAllExperiments()
        : await experimentService.getExperimentsByDifficulty(filter);
      
      setExperiments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '🟢';
      case 'intermediate': return '🟡';
      case 'advanced': return '🔴';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="experiments-list">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading experiments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="experiments-list">
        <div className="error-state">
          <p>❌ {error}</p>
          <button onClick={loadExperiments} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="experiments-list">
      <div className="list-header">
        <h2>Available Experiments</h2>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'beginner' ? 'active' : ''}`}
            onClick={() => setFilter('beginner')}
          >
            🟢 Beginner
          </button>
          <button
            className={`filter-btn ${filter === 'intermediate' ? 'active' : ''}`}
            onClick={() => setFilter('intermediate')}
          >
            🟡 Intermediate
          </button>
          <button
            className={`filter-btn ${filter === 'advanced' ? 'active' : ''}`}
            onClick={() => setFilter('advanced')}
          >
            🔴 Advanced
          </button>
        </div>
      </div>

      <div className="experiments-grid">
        {experiments.map((experiment) => (
          <div
            key={experiment.id}
            className="experiment-card"
            onClick={() => onSelectExperiment(experiment)}
          >
            <div className="card-header">
              <h3>{experiment.title}</h3>
              <span
                className="difficulty-badge"
                style={{ backgroundColor: getDifficultyColor(experiment.difficulty) }}
              >
                {getDifficultyIcon(experiment.difficulty)} {experiment.difficulty}
              </span>
            </div>

            <p className="card-description">{experiment.description}</p>

            <div className="card-meta">
              <span className="meta-item">
                ⏱️ {experiment.estimatedTime} min
              </span>
              <span className="meta-item">
                📝 {experiment.instructions.length} steps
              </span>
            </div>

            <div className="card-objectives">
              <strong>Objectives:</strong>
              <ul>
                {experiment.objectives.slice(0, 2).map((obj, idx) => (
                  <li key={idx}>{obj}</li>
                ))}
                {experiment.objectives.length > 2 && (
                  <li>+ {experiment.objectives.length - 2} more...</li>
                )}
              </ul>
            </div>

            <button className="btn-start">Start Experiment →</button>
          </div>
        ))}
      </div>

      {experiments.length === 0 && (
        <div className="empty-state">
          <p>No experiments found for this difficulty level.</p>
        </div>
      )}
    </div>
  );
}
