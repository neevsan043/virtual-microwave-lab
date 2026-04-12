import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LandingPage from './LandingPage';
import CircuitWorkspace from './CircuitWorkspace';
import ExperimentsList from './ExperimentsList';
import MyExperiments from './MyExperiments';
import UserMenu from './UserMenu';
import ProfileModal from './ProfileModal';
import ChangePasswordModal from './ChangePasswordModal';
import { Experiment, ExperimentProgress } from '../types';
import { progressService } from '../services/progressService';
import { experimentService } from '../services/experimentService';
import './Dashboard.css';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showLanding, setShowLanding] = useState(true);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showExperiments, setShowExperiments] = useState(false);
  const [showMyExperiments, setShowMyExperiments] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [progressStats, setProgressStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
  });
  const [recentProgress, setRecentProgress] = useState<ExperimentProgress[]>([]);
  const [experimentTitles, setExperimentTitles] = useState<Map<string, string>>(new Map());
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalPosition, setProfileModalPosition] = useState({ x: 0, y: 0 });
  const [profileModalMode, setProfileModalMode] = useState<'view' | 'edit'>('view');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalPosition, setPasswordModalPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const stats = await progressService.getProgressStats();
      setProgressStats(stats);

      const allProgress = await progressService.getUserProgress();
      // Sort by last accessed and take top 5
      const recent = allProgress
        .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
        .slice(0, 5);
      setRecentProgress(recent);

      // Fetch experiment titles for recent progress
      const titles = new Map<string, string>();
      try {
        const experiments = await experimentService.getAllExperiments();
        experiments.forEach(exp => titles.set(exp.id, exp.title));
        setExperimentTitles(titles);
      } catch (error) {
        console.error('Failed to load experiment titles:', error);
      }
    } catch (error) {
      console.error('Failed to load progress data:', error);
    }
  };

  const handleSelectExperiment = async (experiment: Experiment) => {
    setSelectedExperiment(experiment);
    setShowExperiments(false);
    setShowWorkspace(true);

    // Mark experiment as started
    try {
      await progressService.startExperiment(experiment.id);
      loadProgressData(); // Refresh stats
    } catch (error) {
      console.error('Failed to start experiment:', error);
    }
  };

  const handleBackToDashboard = () => {
    setShowWorkspace(false);
    setShowExperiments(false);
    setShowMyExperiments(false);
    setSelectedExperiment(null);
    
    // Refresh stats after a small delay to ensure data is saved
    setTimeout(() => {
      loadProgressData();
    }, 100);
  };

  const handleLandingComplete = () => {
    setShowLanding(false);
    window.scrollTo(0, 0);
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setShowLanding(true);
    }, 500);
  };

  const handleChangePassword = () => {
    alert('Change Password feature coming soon!');
  };

  const handleUpdatePhone = () => {
    alert('Update Phone Number feature coming soon!');
  };

  const handleOpenProfile = (position: { x: number; y: number }, mode: 'view' | 'edit') => {
    setProfileModalPosition(position);
    setProfileModalMode(mode);
    setShowProfileModal(true);
  };

  const handleCloseProfile = () => {
    setShowProfileModal(false);
  };

  const handleOpenPasswordModal = (position: { x: number; y: number }) => {
    setPasswordModalPosition(position);
    setShowPasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
  };

  if (showLanding) {
    return <LandingPage onComplete={handleLandingComplete} />;
  }

  if (showWorkspace) {
    return (
      <CircuitWorkspace 
        experiment={selectedExperiment} 
        onBack={handleBackToDashboard} 
      />
    );
  }

  if (showMyExperiments) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Virtual Microwave Lab</h1>
          </div>
          <div className="header-right">
            <button onClick={toggleTheme} className="btn-theme" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <UserMenu 
              onOpenProfile={handleOpenProfile}
              onChangePassword={handleOpenPasswordModal}
            />
          </div>
        </header>
        <MyExperiments 
          onSelectExperiment={handleSelectExperiment}
          onBack={handleBackToDashboard}
        />
        <ProfileModal 
          isOpen={showProfileModal}
          onClose={handleCloseProfile}
          menuPosition={profileModalPosition}
          mode={profileModalMode}
        />
        <ChangePasswordModal 
          isOpen={showPasswordModal}
          onClose={handleClosePasswordModal}
          menuPosition={passwordModalPosition}
        />
      </div>
    );
  }

  if (showExperiments) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="header-left">
            <button onClick={() => setShowExperiments(false)} className="btn-back">
              ← Back
            </button>
            <h1>Virtual Microwave Lab</h1>
          </div>
          <div className="header-right">
            <button onClick={toggleTheme} className="btn-theme" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <UserMenu 
              onOpenProfile={handleOpenProfile}
              onChangePassword={handleOpenPasswordModal}
            />
          </div>
        </header>
        <ExperimentsList onSelectExperiment={handleSelectExperiment} />
        <ProfileModal 
          isOpen={showProfileModal}
          onClose={handleCloseProfile}
          menuPosition={profileModalPosition}
          mode={profileModalMode}
        />
        <ChangePasswordModal 
          isOpen={showPasswordModal}
          onClose={handleClosePasswordModal}
          menuPosition={passwordModalPosition}
        />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Virtual Microwave Lab</h1>
        </div>
        <div className="header-right">
          <button onClick={toggleTheme} className="btn-theme" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <UserMenu 
            onOpenProfile={handleOpenProfile}
            onChangePassword={handleOpenPasswordModal}
          />
        </div>
      </header>

      <div className="dashboard-content">
        <button onClick={handleScrollToTop} className="btn-scroll-top" title="Back to Landing Page">
          ↑
        </button>
        
        <div className="welcome-section">
          <h2>Student Dashboard</h2>
          <p>Welcome to your Virtual Microwave Lab workspace!</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>📚 Available Experiments</h3>
            <p>Browse and start microwave engineering experiments</p>
            <button 
              className="btn-secondary"
              onClick={() => setShowExperiments(true)}
            >
              View Experiments
            </button>
          </div>

          <div className="dashboard-card">
            <h3>📊 My Progress</h3>
            <p>Track your completed experiments and scores</p>
            <div className="progress-stats">
              <div className="stat">
                <span className="stat-value">{progressStats.completed}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat">
                <span className="stat-value">{progressStats.inProgress}</span>
                <span className="stat-label">In Progress</span>
              </div>
            </div>
            <button 
              className="btn-secondary"
              style={{ marginTop: '16px' }}
              onClick={() => setShowMyExperiments(true)}
            >
              View My Experiments
            </button>
          </div>

          <div className="dashboard-card">
            <h3>🔧 Circuit Builder</h3>
            <p>Build and test microwave circuits</p>
            <button 
              className="btn-secondary"
              onClick={() => setShowWorkspace(true)}
            >
              Open Builder
            </button>
          </div>

          <div className="dashboard-card">
            <h3>📖 Learning Resources</h3>
            <p>Access tutorials and reference materials</p>
            <button className="btn-secondary">View Resources</button>
          </div>
        </div>

        <div className="recent-activity">
          <h3>Recent Activity</h3>
          {recentProgress.length > 0 ? (
            <div className="activity-list">
              {recentProgress.map((progress) => (
                <div key={progress.id} className="activity-item">
                  <div className="activity-icon">
                    {progress.status === 'completed' ? '✅' : 
                     progress.status === 'in_progress' ? '🔄' : '📝'}
                  </div>
                  <div className="activity-details">
                    <div className="activity-title">
                      {experimentTitles.get(progress.experimentId) || progress.experimentId}
                    </div>
                    <div className="activity-meta">
                      <span className={`status-badge status-${progress.status}`}>
                        {progress.status.replace('_', ' ')}
                      </span>
                      <span className="activity-time">
                        {new Date(progress.lastAccessedAt).toLocaleDateString()}
                      </span>
                      {progress.circuitSaved && <span className="activity-badge">💾 Saved</span>}
                      {progress.simulationRun && <span className="activity-badge">▶️ Simulated</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No recent activity yet. Start an experiment to get started!</p>
          )}
        </div>
      </div>

      <ProfileModal 
        isOpen={showProfileModal}
        onClose={handleCloseProfile}
        menuPosition={profileModalPosition}
        mode={profileModalMode}
      />

      <ChangePasswordModal 
        isOpen={showPasswordModal}
        onClose={handleClosePasswordModal}
        menuPosition={passwordModalPosition}
      />
    </div>
  );
}
