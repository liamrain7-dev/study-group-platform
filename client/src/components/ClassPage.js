import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import './ClassPage.css';

const ClassPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [studyGroups, setStudyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', maxMembers: 10 });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchClassData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, navigate]);

  useEffect(() => {
    if (socket && id) {
      socket.emit('join-class', id);

      socket.on('new-study-group', (group) => {
        setStudyGroups((prev) => [group, ...prev]);
      });

      socket.on('study-group-updated', (group) => {
        setStudyGroups((prev) =>
          prev.map((g) => (g._id === group._id ? group : g))
        );
      });

      return () => {
        socket.off('new-study-group');
        socket.off('study-group-updated');
      };
    }
  }, [socket, id]);

  const fetchClassData = async () => {
    try {
      const response = await api.get(`/classes/${id}`);
      setClassData(response.data);
      setStudyGroups(response.data.studyGroups || []);
    } catch (error) {
      console.error('Error fetching class:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/study-groups', {
        ...newGroup,
        classId: id,
      });
      setStudyGroups([response.data, ...studyGroups]);
      setNewGroup({ name: '', description: '', maxMembers: 10 });
      setShowCreateGroup(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create study group');
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const response = await api.post(`/study-groups/${groupId}/join`);
      setStudyGroups((prev) =>
        prev.map((g) => (g._id === groupId ? response.data : g))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join study group');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!classData) {
    return <div className="error-message">Class not found</div>;
  }

  return (
    <div className="class-page">
      <header className="class-header">
        <button onClick={() => navigate('/university')} className="btn-back">
          ← Back to University
        </button>
        <div>
          <h1>{classData.name}</h1>
          <p className="class-code">{classData.code}</p>
        </div>
      </header>

      <div className="class-content">
        <div className="study-groups-header">
          <h2>Study Groups</h2>
          <button
            onClick={() => setShowCreateGroup(!showCreateGroup)}
            className="btn-primary"
          >
            {showCreateGroup ? 'Cancel' : '+ Create Study Group'}
          </button>
        </div>

        {showCreateGroup && (
          <div className="create-group-form">
            <h3>Create New Study Group</h3>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  required
                  placeholder="e.g., Study Group 1"
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="Add a description for this study group"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Max Members</label>
                <input
                  type="number"
                  value={newGroup.maxMembers}
                  onChange={(e) => setNewGroup({ ...newGroup, maxMembers: parseInt(e.target.value) })}
                  min="2"
                  max="50"
                  required
                />
              </div>
              <button type="submit" className="btn-primary">
                Create Study Group
              </button>
            </form>
          </div>
        )}

        <div className="study-groups-grid">
          {studyGroups.length === 0 ? (
            <div className="empty-state">
              <p>No study groups yet. Create one to get started!</p>
            </div>
          ) : (
            studyGroups.map((group) => {
              const isMember = group.members?.some(
                (member) => member._id === user._id
              );
              const isFull = group.members?.length >= group.maxMembers;

              return (
                <div key={group._id} className="study-group-card">
                  <h3>{group.name}</h3>
                  {group.description && (
                    <p className="group-description">{group.description}</p>
                  )}
                  <div className="group-meta">
                    <span>
                      {group.members?.length || 0} / {group.maxMembers} Members
                    </span>
                    <span>Created by {group.createdBy?.name}</span>
                  </div>
                  <div className="group-members">
                    <strong>Members:</strong>
                    <div className="members-list">
                      {group.members?.map((member) => (
                        <span key={member._id} className="member-tag">
                          {member.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  {!isMember && (
                    <button
                      onClick={() => handleJoinGroup(group._id)}
                      disabled={isFull}
                      className={isFull ? 'btn-disabled' : 'btn-primary'}
                    >
                      {isFull ? 'Group Full' : 'Join Group'}
                    </button>
                  )}
                  {isMember && (
                    <div className="member-badge">You're a member</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassPage;

