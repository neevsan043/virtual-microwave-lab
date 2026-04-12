import { useState, useEffect } from 'react';
import { experimentService } from '../services/experimentService';
import { progressService } from '../services/progressService';
import { Experiment, ExperimentProgress } from '../types';
import './MyExperiments.css';

interface MyExperimentsProps {
  onSelectExperiment: (experiment: Experiment) => void;
  onBack: () => void;
}

type FilterType = 'all' | 'in_progress' | 'completed' | 'not_started';

interface ExperimentWithProgress {
  experiment: Experiment;
  progress: ExperimentProgress | null;
}

export default function MyExperiments({ onSelectExperiment, onBack }: MyExperimentsProps) {
  const [experiments, setExperiments] = useState<ExperimentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'status'>('recent');

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      
      // Load all experiments
      const allExperiments = await experimentService.getAllExperiments();
      
      // Load progress for each experiment
      const progressData = await progressService.getUserProgress();
      const progressMap = new Map(progressData.map(p => [p.experimentId, p]));
      
      // Combine experiments with their progress
      const combined: ExperimentWithProgress[] = allExperiments.map(exp => ({
        experiment: exp,
        progress: progressMap.get(exp.id) || null,
      }));
      
      setExperiments(combined);
    } catch (error) {
      console.error('Failed to load experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (progress: ExperimentProgress | null): 'not_started' | 'in_progress' | 'completed' => {
    if (!progress) return 'not_started';
    return progress.status;
  };

  const filteredExperiments = experiments.filter(({ progress }) => {
    if (filter === 'all') return true;
    const status = getStatus(progress);
    return status === filter;
  });

  const sortedExperiments = [...filteredExperiments].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        const timeA = a.progress?.lastAccessedAt ? new Date(a.progress.lastAccessedAt).getTime() : 0;
        const timeB = b.progress?.lastAccessedAt ? new Date(b.progress.lastAccessedAt).getTime() : 0;
        return timeB - timeA;
      case 'title':
        return a.experiment.title.localeCompare(b.experiment.title);
      case 'status':
        const statusOrder = { completed: 0, in_progress: 1, not_started: 2 };
        return statusOrder[getStatus(a.progress)] - statusOrder[getStatus(b.progress)];
      default:
        return 0;
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'not_started': return '📝';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#FF9800';
      case 'not_started': return '#9E9E9E';
      default: return '#9E9E9E';
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

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleContinue = (experiment: Experiment) => {
    onSelectExperiment(experiment);
  };

  const handleMarkComplete = async (experimentId: string) => {
    try {
      await progressService.completeExperiment(experimentId);
      loadExperiments(); // Refresh
    } catch (error) {
      console.error('Failed to mark experiment as complete:', error);
    }
  };

  const stats = {
    total: experiments.length,
    completed: experiments.filter(e => getStatus(e.progress) === 'completed').length,
    inProgress: experiments.filter(e => getStatus(e.progress) === 'in_progress').length,
    notStarted: experiments.filter(e => getStatus(e.progress) === 'not_started').length,
  };

  if (loading) {
    return (
      <div className="my-experiments">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your experiments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-experiments">
      <div className="experiments-header">
        <div className="header-top">
          <button onClick={onBack} className="btn-back">
            ← Back to Dashboard
          </button>
          <h2>My Experiments</h2>
        </div>

        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item stat-completed">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-item stat-progress">
            <span className="stat-number">{stats.inProgress}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-item stat-not-started">
            <span className="stat-number">{stats.notStarted}</span>
            <span className="stat-label">Not Started</span>
          </div>
        </div>

        <div className="controls-bar">
          <div className="filter-group">
            <label>Filter:</label>
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'in_progress' ? 'active' : ''}`}
              onClick={() => setFilter('in_progress')}
            >
              🔄 In Progress
            </button>
            <button
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              ✅ Completed
            </button>
            <button
              className={`filter-btn ${filter === 'not_started' ? 'active' : ''}`}
              onClick={() => setFilter('not_started')}
            >
              📝 Not Started
            </button>
          </div>

          <div className="sort-group">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <option value="recent">Recent Activity</option>
              <option value="title">Title</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      <div className="experiments-list">
        {sortedExperiments.length === 0 ? (
          <div className="empty-state">
            <p>No experiments found matching your filter.</p>
          </div>
        ) : (
          sortedExperiments.map(({ experiment, progress }) => {
            const status = getStatus(progress);
            return (
              <div key={experiment.id} className="experiment-card">
                <div className="card-header">
                  <div className="card-title-row">
                    <h3>{experiment.title}</h3>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(status) }}
                    >
                      {getStatusIcon(status)} {status.replace('_', ' ')}
                    </span>
                  </div>
                  <span
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(experiment.difficulty) }}
                  >
                    {experiment.difficulty}
                  </span>
                </div>

                <p className="card-description">{experiment.description}</p>

                <div className="card-meta">
                  <span className="meta-item">⏱️ {experiment.estimatedTime} min</span>
                  <span className="meta-item">📝 {experiment.objectives.length} objectives</span>
                  {progress?.circuitSaved && <span className="meta-badge">💾 Saved</span>}
                  {progress?.simulationRun && <span className="meta-badge">▶️ Simulated</span>}
                </div>

                {progress && (
                  <div className="progress-info">
                    <div className="progress-row">
                      <span className="progress-label">Started:</span>
                      <span className="progress-value">
                        {formatDate(progress.startedAt)} {formatTime(progress.startedAt)}
                      </span>
                    </div>
                    <div className="progress-row">
                      <span className="progress-label">Last Accessed:</span>
                      <span className="progress-value">
                        {formatDate(progress.lastAccessedAt)} {formatTime(progress.lastAccessedAt)}
                      </span>
                    </div>
                    {progress.completedAt && (
                      <div className="progress-row">
                        <span className="progress-label">Completed:</span>
                        <span className="progress-value">
                          {formatDate(progress.completedAt)} {formatTime(progress.completedAt)}
                        </span>
                      </div>
                    )}
                    {progress.score !== undefined && (
                      <div className="progress-row">
                        <span className="progress-label">Score:</span>
                        <span className="progress-value score">{progress.score}%</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="card-actions">
                  <button
                    className="btn-primary"
                    onClick={() => handleContinue(experiment)}
                  >
                    {status === 'not_started' ? 'Start' : status === 'completed' ? 'Review' : 'Continue'} →
                  </button>
                  {status === 'in_progress' && (
                    <button
                      className="btn-secondary"
                      onClick={() => handleMarkComplete(experiment.id)}
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
