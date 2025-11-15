import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import ChatBox from './ChatBox';
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
  const [newGroup, setNewGroup] = useState({ name: '', description: '', maxMembers: 10, isPrivate: false });
  const [error, setError] = useState('');
  const [hasLeftChat, setHasLeftChat] = useState(false);
  const [showInviteCodeInput, setShowInviteCodeInput] = useState({});
  const [inviteCodes, setInviteCodes] = useState({});
  const [openChatGroupId, setOpenChatGroupId] = useState(null);
  const [isGeneralChatOpen, setIsGeneralChatOpen] = useState(false);

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
        setStudyGroups((prev) => {
          // Check if group already exists to prevent duplicates
          const exists = prev.some(g => g._id === group._id);
          if (exists) return prev;
          return [group, ...prev];
        });
      });

      socket.on('study-group-updated', (group) => {
        setStudyGroups((prev) =>
          prev.map((g) => (g._id === group._id ? group : g))
        );
      });

      socket.on('study-group-deleted', (groupId) => {
        setStudyGroups((prev) => prev.filter(g => g._id !== groupId));
      });

      return () => {
        socket.off('new-study-group');
        socket.off('study-group-updated');
        socket.off('study-group-deleted');
      };
    }
  }, [socket, id]);

  const fetchClassData = async () => {
    try {
      const response = await api.get(`/classes/${id}`);
      setClassData(response.data);
      setStudyGroups(response.data.studyGroups || []);
      
      // Check if user has left chat
      const chatResponse = await api.get(`/chat/class/${id}`);
      setHasLeftChat(chatResponse.data.chat?.hasLeftChat || false);
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
      await api.post('/study-groups', {
        ...newGroup,
        classId: id,
      });
      // Don't add here - let the socket event handle it to avoid duplicates
      setNewGroup({ name: '', description: '', maxMembers: 10, isPrivate: false });
      setShowCreateGroup(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create study group');
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const group = studyGroups.find(g => g._id === groupId);
      const inviteCode = group?.isPrivate ? inviteCodes[groupId] : undefined;
      
      if (group?.isPrivate && !inviteCode) {
        setShowInviteCodeInput({ ...showInviteCodeInput, [groupId]: true });
        return;
      }

      const response = await api.post(`/study-groups/${groupId}/join`, { inviteCode });
      setStudyGroups((prev) =>
        prev.map((g) => (g._id === groupId ? response.data : g))
      );
      setShowInviteCodeInput({ ...showInviteCodeInput, [groupId]: false });
      setInviteCodes({ ...inviteCodes, [groupId]: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join study group');
    }
  };

  const handleLeaveClassChat = async () => {
    try {
      await api.post(`/chat/class/${id}/leave`);
      setHasLeftChat(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave chat');
    }
  };

  const handleRejoinClassChat = async () => {
    try {
      await api.post(`/chat/class/${id}/rejoin`);
      setHasLeftChat(false);
      setIsGeneralChatOpen(true);
      // The ChatBox component will handle fetching messages when it mounts
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to rejoin chat');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to leave this study group?')) {
      return;
    }

    try {
      const response = await api.post(`/study-groups/${groupId}/leave`);
      // Update the group in the list (socket will also update it, but this ensures immediate update)
      setStudyGroups((prev) =>
        prev.map((g) => (g._id === groupId ? response.data.studyGroup : g))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave study group');
    }
  };

  const handleDisbandGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to disband this study group? This will remove all members and delete the group permanently.')) {
      return;
    }

    try {
      await api.delete(`/study-groups/${groupId}`);
      // Group will be removed via socket event
      setStudyGroups((prev) => prev.filter(g => g._id !== groupId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to disband study group');
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
      <button onClick={() => navigate(-1)} className="btn-back">
        ← Back
      </button>
      <header className="class-header">
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
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newGroup.isPrivate}
                    onChange={(e) => setNewGroup({ ...newGroup, isPrivate: e.target.checked })}
                  />
                  Private Group (requires invite code to join)
                </label>
              </div>
              <button type="submit" className="btn-primary">
                Create Study Group
              </button>
            </form>
          </div>
        )}

        <div className="study-groups-grid">
          {/* General Chat Card - Always visible */}
          <div className="study-group-card general-chat-card">
            <h3>General Chat</h3>
            <p className="group-description">Class-wide discussion for all students</p>
            <div className="group-meta">
              <span>All students in {classData.name}</span>
            </div>
            {hasLeftChat ? (
              <div className="group-member-actions">
                <button
                  onClick={handleRejoinClassChat}
                  className="btn-rejoin-chat"
                >
                  Rejoin Chat
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsGeneralChatOpen(!isGeneralChatOpen)}
                className="btn-chat-toggle"
              >
                {isGeneralChatOpen ? 'Close Chat' : 'Open Chat'}
              </button>
            )}
            {isGeneralChatOpen && !hasLeftChat && (
              <ChatBox
                type="class"
                classId={id}
                onLeave={handleLeaveClassChat}
                onRejoin={handleRejoinClassChat}
                hasLeftChat={hasLeftChat}
              />
            )}
          </div>

          {studyGroups.length === 0 ? (
            <div className="empty-state">
              <p>No study groups yet. Create one to get started!</p>
            </div>
          ) : (
            studyGroups.map((group) => {
              // Check if user is creator - handle both ObjectId and populated objects
              const creatorId = group.createdBy?._id || group.createdBy;
              const userId = user?._id || user?.id;
              
              // Normalize IDs to strings for comparison (handle null/undefined)
              const creatorIdStr = creatorId ? (creatorId.toString?.() || String(creatorId)) : '';
              const userIdStr = userId ? (userId.toString?.() || String(userId)) : '';
              
              const isCreator = creatorIdStr && userIdStr && (creatorIdStr === userIdStr);
              
              // Check if user is a member - handle both ObjectId and populated objects
              const isMember = (userIdStr && group.members?.some(
                (member) => {
                  if (!member) return false;
                  const memberId = member._id || member;
                  const memberIdStr = memberId ? (memberId.toString?.() || String(memberId)) : '';
                  return memberIdStr === userIdStr;
                }
              )) || false;
              
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
                    {group.isPrivate && (
                      <span className="private-badge">🔒 Private</span>
                    )}
                  </div>
                  {isCreator && group.isPrivate && group.inviteCode && (
                    <div className="invite-code-display">
                      <strong>Invite Code:</strong> <code>{group.inviteCode}</code>
                    </div>
                  )}
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
                  {isCreator && (
                    <div className="group-member-actions">
                      <button
                        className="btn-in-group"
                        disabled
                      >
                        In Group (Creator)
                      </button>
                      <button
                        onClick={() => handleDisbandGroup(group._id)}
                        className="btn-disband-group"
                      >
                        Disband Group
                      </button>
                    </div>
                  )}
                  {!isCreator && isMember && (
                    <div className="group-member-actions">
                      <button
                        className="btn-in-group"
                        disabled
                      >
                        In Group
                      </button>
                      <button
                        onClick={() => handleLeaveGroup(group._id)}
                        className="btn-leave-group"
                      >
                        Leave Group
                      </button>
                    </div>
                  )}
                  {!isCreator && !isMember && (
                    <div>
                      {showInviteCodeInput[group._id] ? (
                        <div className="invite-code-input-group">
                          <input
                            type="text"
                            placeholder="Enter invite code"
                            value={inviteCodes[group._id] || ''}
                            onChange={(e) => setInviteCodes({ ...inviteCodes, [group._id]: e.target.value.toUpperCase() })}
                            className="invite-code-input"
                            maxLength="6"
                          />
                          <button
                            onClick={() => handleJoinGroup(group._id)}
                            disabled={isFull || !inviteCodes[group._id]}
                            className={isFull ? 'btn-disabled' : 'btn-primary'}
                          >
                            Join
                          </button>
                          <button
                            onClick={() => {
                              setShowInviteCodeInput({ ...showInviteCodeInput, [group._id]: false });
                              setInviteCodes({ ...inviteCodes, [group._id]: '' });
                            }}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleJoinGroup(group._id)}
                          disabled={isFull}
                          className={isFull ? 'btn-disabled' : 'btn-primary'}
                        >
                          {isFull ? 'Group Full' : 'Join Group'}
                        </button>
                      )}
                    </div>
                  )}
                  {isMember && (
                    <button
                      onClick={() => setOpenChatGroupId(openChatGroupId === group._id ? null : group._id)}
                      className="btn-chat-toggle"
                    >
                      {openChatGroupId === group._id ? 'Close Chat' : 'Open Chat'}
                    </button>
                  )}
                  {isMember && openChatGroupId === group._id && (
                    <ChatBox
                      type="studyGroup"
                      studyGroupId={group._id}
                    />
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

