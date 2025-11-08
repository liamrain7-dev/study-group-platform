import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './MyGroups.css';

const MyGroups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('joined'); // 'joined' or 'created'
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [createdGroups, setCreatedGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', maxMembers: 10 });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchGroups();
  }, [user, navigate]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const [joinedRes, createdRes] = await Promise.all([
        api.get('/study-groups/my-joined'),
        api.get('/study-groups/my-created')
      ]);
      setJoinedGroups(joinedRes.data);
      setCreatedGroups(createdRes.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (group) => {
    setEditingGroup(group._id);
    setEditForm({
      name: group.name,
      description: group.description || '',
      maxMembers: group.maxMembers
    });
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setEditForm({ name: '', description: '', maxMembers: 10 });
    setError('');
  };

  const handleSaveEdit = async (groupId) => {
    setError('');
    try {
      const response = await api.put(`/study-groups/${groupId}`, editForm);
      
      // Update local state
      setCreatedGroups(prev =>
        prev.map(g => g._id === groupId ? response.data : g)
      );
      
      setEditingGroup(null);
      setEditForm({ name: '', description: '', maxMembers: 10 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update study group');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to leave this study group?')) {
      return;
    }

    try {
      await api.post(`/study-groups/${groupId}/leave`);
      // Remove from joined groups
      setJoinedGroups(prev => prev.filter(g => g._id !== groupId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave study group');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this study group? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/study-groups/${groupId}`);
      // Remove from created groups
      setCreatedGroups(prev => prev.filter(g => g._id !== groupId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete study group');
    }
  };

  const renderGroupCard = (group, isCreated = false) => {
    const isEditing = editingGroup === group._id;

    return (
      <div key={group._id} className="group-card">
        {isEditing ? (
          <div className="edit-form">
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
              <label>Group Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Max Members</label>
              <input
                type="number"
                value={editForm.maxMembers}
                onChange={(e) => setEditForm({ ...editForm, maxMembers: parseInt(e.target.value) || 10 })}
                min={group.members?.length || 1}
                required
              />
            </div>
            <div className="edit-actions">
              <button
                onClick={() => handleSaveEdit(group._id)}
                className="btn-primary"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="group-header">
              <h3>{group.name}</h3>
              {isCreated && (
                <div className="group-actions">
                  <button
                    onClick={() => handleEdit(group)}
                    className="btn-edit"
                    title="Edit group"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group._id)}
                    className="btn-delete"
                    title="Delete group"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
            
            {group.class && (
              <div className="group-class-info">
                <span className="class-link" onClick={() => navigate(`/class/${group.class._id || group.class}`)}>
                  {group.class.name} - {group.class.code}
                </span>
                {group.class.university && (
                  <span className="university-name">{group.class.university.name}</span>
                )}
              </div>
            )}

            {group.description && (
              <p className="group-description">{group.description}</p>
            )}

            <div className="group-meta">
              <span>
                {group.members?.length || 0} / {group.maxMembers} Members
              </span>
              {!isCreated && (
                <span>Created by {group.createdBy?.name}</span>
              )}
            </div>

            <div className="group-members">
              <strong>Members:</strong>
              <div className="members-list">
                {group.members?.map((member) => (
                  <span key={member._id} className="member-tag">
                    {member.name}
                    {member._id === user._id && ' (You)'}
                  </span>
                ))}
              </div>
            </div>

            {!isCreated && (
              <button
                onClick={() => handleLeaveGroup(group._id)}
                className="btn-leave"
              >
                Leave Group
              </button>
            )}

            {isCreated && (
              <button
                onClick={() => navigate(`/class/${group.class._id || group.class}`)}
                className="btn-primary"
              >
                View Class
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading your groups...</div>;
  }

  return (
    <div className="my-groups-page">
      <header className="my-groups-header">
        <button onClick={() => navigate('/university')} className="btn-back">
          ← Home
        </button>
        <h1>My Groups</h1>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'joined' ? 'active' : ''}`}
          onClick={() => setActiveTab('joined')}
        >
          Groups I Joined ({joinedGroups.length})
        </button>
        <button
          className={`tab ${activeTab === 'created' ? 'active' : ''}`}
          onClick={() => setActiveTab('created')}
        >
          Groups I Created ({createdGroups.length})
        </button>
      </div>

      <div className="groups-content">
        {activeTab === 'joined' ? (
          <div className="groups-section">
            {joinedGroups.length === 0 ? (
              <div className="empty-state">
                <p>You haven't joined any study groups yet.</p>
                <p>Browse classes to find and join study groups!</p>
              </div>
            ) : (
              <div className="groups-grid">
                {joinedGroups.map(group => renderGroupCard(group, false))}
              </div>
            )}
          </div>
        ) : (
          <div className="groups-section">
            {createdGroups.length === 0 ? (
              <div className="empty-state">
                <p>You haven't created any study groups yet.</p>
                <p>Create a study group in any class to get started!</p>
              </div>
            ) : (
              <div className="groups-grid">
                {createdGroups.map(group => renderGroupCard(group, true))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGroups;

