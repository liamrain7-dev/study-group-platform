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
  const [allClasses, setAllClasses] = useState([]); // Store all classes for search
  const [loading, setLoading] = useState(true);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClass, setNewClass] = useState({ code: '', description: '' });
  const [error, setError] = useState('');
  const [usersInUniversity, setUsersInUniversity] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

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
        setAllClasses((prev) => {
          const updated = [classData, ...prev];
          // Update filtered classes based on current search
          setClasses((currentFiltered) => {
            const query = searchQuery.toLowerCase();
            if (query.trim() === '') {
              return updated;
            }
            const matches = classData.name.toLowerCase().includes(query) ||
                           classData.code.toLowerCase().includes(query) ||
                           classData.description?.toLowerCase().includes(query);
            if (matches) {
              return [classData, ...currentFiltered];
            }
            return currentFiltered;
          });
          return updated;
        });
      });

      socket.on('class-deleted', (classId) => {
        setAllClasses((prev) => prev.filter(c => c._id !== classId));
        setClasses((prev) => prev.filter(c => c._id !== classId));
      });

      return () => {
        socket.off('new-class');
        socket.off('class-deleted');
      };
    }
  }, [socket, user, searchQuery]);

  const fetchClasses = async () => {
    try {
      const response = await api.get(`/universities/${user.university._id}`);
      const fetchedClasses = response.data.classes || [];
      setAllClasses(fetchedClasses);
      setClasses(fetchedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setClasses(allClasses);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allClasses.filter(classItem => {
      const nameMatch = classItem.name.toLowerCase().includes(query);
      const codeMatch = classItem.code.toLowerCase().includes(query);
      const descMatch = classItem.description?.toLowerCase().includes(query);
      return nameMatch || codeMatch || descMatch;
    });

    setClasses(filtered);
  }, [searchQuery, allClasses]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i}>{part}</mark>
      ) : (
        part
      )
    );
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
      // Use course name for both name and code fields
      const classData = {
        name: newClass.code,
        code: newClass.code,
        description: newClass.description
      };
      const response = await api.post('/classes', classData);
      setAllClasses([response.data, ...allClasses]);
      // Update displayed classes based on search
      if (searchQuery.trim() === '') {
        setClasses([response.data, ...classes]);
      } else {
        // Re-run search filter
        const query = searchQuery.toLowerCase();
        const matches = response.data.name.toLowerCase().includes(query) ||
                       response.data.code.toLowerCase().includes(query) ||
                       response.data.description?.toLowerCase().includes(query);
        if (matches) {
          setClasses([response.data, ...classes]);
        }
      }
      setNewClass({ code: '', description: '' });
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
        <div className="header-actions">
          <button onClick={() => navigate('/my-groups')} className="btn-secondary">
            My Groups
          </button>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
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

        <div className="class-search-container">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {}}
            placeholder="Search for a class by course name..."
            className="class-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
              }}
              className="clear-search-btn"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {showCreateClass && (
          <div className="create-class-form">
            <h3>Create New Class</h3>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleCreateClass}>
              <div className="form-group">
                <label>Course Name</label>
                <input
                  type="text"
                  value={newClass.code}
                  onChange={(e) => setNewClass({ ...newClass, code: e.target.value })}
                  required
                  placeholder="e.g., CS135"
                />
                <small className="form-hint">The course name or code (e.g., CS135, MATH101, BIO200)</small>
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
          {classes.length === 0 && searchQuery ? (
            <div className="empty-state search-no-results">
              <p>No classes found matching "<strong>{searchQuery}</strong>"</p>
              <p className="suggestion-text">Would you like to create this class?</p>
              <button
                onClick={() => {
                  setShowCreateClass(true);
                  // Use search query as course name
                  setNewClass({ 
                    code: searchQuery, 
                    description: '' 
                  });
                  setSearchQuery('');
                }}
                className="btn-primary"
              >
                Create Class
              </button>
            </div>
          ) : classes.length === 0 ? (
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
                <h3>
                  {searchQuery ? highlightMatch(classItem.name, searchQuery) : classItem.name}
                </h3>
                <p className="class-code">
                  {searchQuery ? highlightMatch(classItem.code, searchQuery) : classItem.code}
                </p>
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

