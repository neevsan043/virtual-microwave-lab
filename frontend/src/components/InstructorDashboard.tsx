import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { userManagementService } from '../services/userManagementService';
import './InstructorDashboard.css';

interface Student {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface Progress {
  _id: string;
  userId: string;
  experimentId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  lastAccessedAt: string;
  circuitSaved: boolean;
  simulationRun: boolean;
  score?: number;
  attempts: number;
  timeSpent: number;
}

interface ClassStats {
  totalStudents: number;
  totalCompleted: number;
  totalInProgress: number;
  totalTimeSpent: number;
  totalAttempts: number;
  averageTimePerStudent: number;
  averageAttemptsPerStudent: number;
}

export default function InstructorDashboard() {
  const { user, logout } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [allProgress, setAllProgress] = useState<Progress[]>([]);
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'overview' | 'students' | 'progress'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load students
      const studentsRes = await api.get('/instructor/students');
      setStudents(studentsRes.data.students);

      // Load all progress
      const progressRes = await api.get('/instructor/progress/all');
      setAllProgress(progressRes.data.progress);

      // Load class stats
      const statsRes = await api.get('/instructor/stats/class');
      setClassStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load instructor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDate = (date: string | undefined): string => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStudentProgress = (studentId: string) => {
    return allProgress.filter(p => p.userId === studentId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#FF9800';
      case 'not_started': return '#9E9E9E';
      default: return '#666';
    }
  };

  const handleDeleteUser = async (studentId: string, studentName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${studentName}?\n\n` +
      'This will:\n' +
      '• Remove the user from the system\n' +
      '• Delete all their progress and circuits\n' +
      '• Prevent them from logging in\n\n' +
      'This action CANNOT be undone!'
    );

    if (!confirmed) return;

    try {
      await userManagementService.deleteUser(studentId);
      alert(`User ${studentName} has been deleted successfully.`);
      
      // Reload data
      await loadData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete user';
      alert(`Error: ${errorMessage}`);
      console.error('Delete user error:', error);
    }
  };

  if (loading) {
    return (
      <div className="instructor-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading instructor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="instructor-dashboard">
      <header className="dashboard-header">
        <h1>Instructor Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.name}</span>
          <button onClick={logout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="view-tabs">
          <button
            className={`tab ${view === 'overview' ? 'active' : ''}`}
            onClick={() => setView('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`tab ${view === 'students' ? 'active' : ''}`}
            onClick={() => setView('students')}
          >
            👥 Students
          </button>
          <button
            className={`tab ${view === 'progress' ? 'active' : ''}`}
            onClick={() => setView('progress')}
          >
            📈 Progress
          </button>
        </div>

        {view === 'overview' && classStats && (
          <div className="overview-section">
            <h2>Class Overview</h2>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-value">{classStats.totalStudents}</div>
                  <div className="stat-label">Total Students</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-value">{classStats.totalCompleted}</div>
                  <div className="stat-label">Completed Experiments</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🔄</div>
                <div className="stat-content">
                  <div className="stat-value">{classStats.totalInProgress}</div>
                  <div className="stat-label">In Progress</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⏱️</div>
                <div className="stat-content">
                  <div className="stat-value">{formatTime(classStats.averageTimePerStudent)}</div>
                  <div className="stat-label">Avg Time/Student</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <div className="stat-value">{classStats.averageAttemptsPerStudent.toFixed(1)}</div>
                  <div className="stat-label">Avg Attempts/Student</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-value">{formatTime(classStats.totalTimeSpent)}</div>
                  <div className="stat-label">Total Time Spent</div>
                </div>
              </div>
            </div>

            <div className="recent-activity-section">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {allProgress
                  .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
                  .slice(0, 10)
                  .map((progress) => {
                    const student = students.find(s => s.id === progress.userId);
                    return (
                      <div key={progress._id} className="activity-item">
                        <div className="activity-icon">
                          {progress.status === 'completed' ? '✅' : 
                           progress.status === 'in_progress' ? '🔄' : '📝'}
                        </div>
                        <div className="activity-details">
                          <div className="activity-title">
                            {student?.name || 'Unknown Student'} - {progress.experimentId}
                          </div>
                          <div className="activity-meta">
                            <span className="status-badge" style={{ backgroundColor: getStatusColor(progress.status) }}>
                              {progress.status.replace('_', ' ')}
                            </span>
                            <span className="activity-time">{formatDate(progress.lastAccessedAt)}</span>
                            {progress.score !== undefined && (
                              <span className="score-badge">Score: {progress.score}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {view === 'students' && (
          <div className="students-section">
            <h2>Students ({students.length})</h2>
            
            <div className="students-grid">
              {students.map((student) => {
                const studentProgress = getStudentProgress(student.id);
                const completed = studentProgress.filter(p => p.status === 'completed').length;
                const inProgress = studentProgress.filter(p => p.status === 'in_progress').length;
                const totalTime = studentProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
                
                return (
                  <div key={student.id} className="student-card">
                    <div className="student-header">
                      <div className="student-avatar">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="student-info">
                        <h3>{student.name}</h3>
                        <p>{student.email}</p>
                      </div>
                    </div>

                    <div className="student-stats">
                      <div className="student-stat">
                        <span className="stat-label">Completed:</span>
                        <span className="stat-value">{completed}</span>
                      </div>
                      <div className="student-stat">
                        <span className="stat-label">In Progress:</span>
                        <span className="stat-value">{inProgress}</span>
                      </div>
                      <div className="student-stat">
                        <span className="stat-label">Time Spent:</span>
                        <span className="stat-value">{formatTime(totalTime)}</span>
                      </div>
                    </div>

                    <button
                      className="btn-view-details"
                      onClick={() => setSelectedStudent(student.id)}
                    >
                      View Details
                    </button>
                    
                    <button
                      className="btn-delete-user"
                      onClick={() => handleDeleteUser(student.id, student.name)}
                    >
                      🗑️ Delete User
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'progress' && (
          <div className="progress-section">
            <h2>All Progress ({allProgress.length})</h2>
            
            <div className="progress-table">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Experiment</th>
                    <th>Status</th>
                    <th>Started</th>
                    <th>Last Accessed</th>
                    <th>Time Spent</th>
                    <th>Attempts</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {allProgress.map((progress) => {
                    const student = students.find(s => s.id === progress.userId);
                    return (
                      <tr key={progress._id}>
                        <td>{student?.name || 'Unknown'}</td>
                        <td>{progress.experimentId}</td>
                        <td>
                          <span className="status-badge" style={{ backgroundColor: getStatusColor(progress.status) }}>
                            {progress.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>{formatDate(progress.startedAt)}</td>
                        <td>{formatDate(progress.lastAccessedAt)}</td>
                        <td>{formatTime(progress.timeSpent)}</td>
                        <td>{progress.attempts}</td>
                        <td>{progress.score !== undefined ? `${progress.score}%` : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
