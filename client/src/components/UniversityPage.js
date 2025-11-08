import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import './UniversityPage.css';

const UniversityPage = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', code: '', description: '' });
  const [error, setError] = useState('');
  const [usersInUniversity, setUsersInUniversity] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  useEffect(() => {
    if (socket && user?.university?._id) {
      socket.emit('join-university', user.university._id);

      socket.on('new-class', (classData) => {
        setClasses((prev) => [classData, ...prev]);
      });

      socket.on('class-deleted', (classId) => {
        setClasses((prev) => prev.filter(c => c._id !== classId));
      });

      return () => {
        socket.off('new-class');
        socket.off('class-deleted');
      };
    }
  }, [socket, user]);

  const fetchClasses = async () => {
    try {
      const response = await api.get(`/universities/${user.university._id}`);
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/auth/stats');
      setUsersInUniversity(response.data.usersInYourUniversity);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/classes', newClass);
      setClasses([response.data, ...classes]);
      setNewClass({ name: '', code: '', description: '' });
      setShowCreateClass(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create class');
    }
  };

  const handleDeleteClass = async (classId, e) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    
    if (!window.confirm('Are you sure you want to delete this class? This will also delete all study groups in it.')) {
      return;
    }

    try {
      await api.delete(`/classes/${classId}`);
      setClasses(classes.filter(c => c._id !== classId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete class');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="university-page">
      <header className="university-header">
        <div>
          <h1>{user?.university?.name}</h1>
          <p>Welcome, {user?.name}!</p>
          <div className="stats-info">
            <span>{usersInUniversity} {usersInUniversity === 1 ? 'student' : 'students'} at your university</span>
          </div>
        </div>
        <button onClick={logout} className="btn-secondary">
          Logout
        </button>
      </header>

      <div className="university-content">
        <div className="classes-header">
          <h2>Classes</h2>
          <button
            onClick={() => setShowCreateClass(!showCreateClass)}
            className="btn-primary"
          >
            {showCreateClass ? 'Cancel' : '+ Create Class'}
          </button>
        </div>

        {showCreateClass && (
          <div className="create-class-form">
            <h3>Create New Class</h3>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleCreateClass}>
              <div className="form-group">
                <label>Class Name</label>
                <input
                  type="text"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  required
                  placeholder="e.g., Introduction to Computer Science"
                />
              </div>
              <div className="form-group">
                <label>Class Code</label>
                <input
                  type="text"
                  value={newClass.code}
                  onChange={(e) => setNewClass({ ...newClass, code: e.target.value })}
                  required
                  placeholder="e.g., CS101"
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  placeholder="Add a description for this class"
                  rows="3"
                />
              </div>
              <button type="submit" className="btn-primary">
                Create Class
              </button>
            </form>
          </div>
        )}

        <div className="classes-grid">
          {classes.length === 0 ? (
            <div className="empty-state">
              <p>No classes yet. Create one to get started!</p>
            </div>
          ) : (
            classes.map((classItem) => (
              <div
                key={classItem._id}
                className="class-card"
                onClick={() => navigate(`/class/${classItem._id}`)}
              >
                {classItem.createdBy?._id === user._id && (
                  <button
                    className="delete-class-btn"
                    onClick={(e) => handleDeleteClass(classItem._id, e)}
                    title="Delete class"
                  >
                    ×
                  </button>
                )}
                <h3>{classItem.name}</h3>
                <p className="class-code">{classItem.code}</p>
                {classItem.description && (
                  <p className="class-description">{classItem.description}</p>
                )}
                <div className="class-meta">
                  <span>{classItem.studyGroups?.length || 0} Study Groups</span>
                  <span>Created by {classItem.createdBy?.name}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UniversityPage;

