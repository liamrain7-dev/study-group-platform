import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import './ChatBox.css';

const ChatBox = ({ type, classId, studyGroupId, onLeave, onRejoin, hasLeftChat }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const chatId = type === 'class' ? classId : studyGroupId;

  useEffect(() => {
    if (!chatId) return;

    // Join socket room
    if (socket) {
      if (type === 'class') {
        socket.emit('join-class', chatId);
        socket.on('new-class-message', handleNewMessage);
      } else {
        socket.emit('join-study-group', chatId);
        socket.on('new-study-group-message', handleNewMessage);
      }
    }

    fetchMessages();

    return () => {
      if (socket) {
        if (type === 'class') {
          socket.off('new-class-message');
        } else {
          socket.off('new-study-group-message');
        }
      }
    };
  }, [socket, chatId, type]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const endpoint = type === 'class' 
        ? `/chat/class/${classId}` 
        : `/chat/study-group/${studyGroupId}`;
      const response = await api.get(endpoint);
      setMessages(response.data.chat?.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (data) => {
    if (data.chatId && data.message) {
      setMessages((prev) => [...prev, data.message]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || hasLeftChat) return;

    try {
      setSending(true);
      const endpoint = type === 'class'
        ? `/chat/class/${classId}`
        : `/chat/study-group/${studyGroupId}`;
      
      await api.post(endpoint, { message: newMessage });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="chatbox-loading">Loading chat...</div>;
  }

  return (
    <div className="chatbox-container">
      <div className="chatbox-header">
        <h3>{type === 'class' ? 'Class Chat' : 'Group Chat'}</h3>
        {type === 'class' && (
          <div className="chatbox-actions">
            {hasLeftChat ? (
              <button onClick={onRejoin} className="btn-rejoin-chat">
                Rejoin Chat
              </button>
            ) : (
              <button onClick={onLeave} className="btn-leave-chat">
                Leave Chat
              </button>
            )}
          </div>
        )}
      </div>

      {hasLeftChat && type === 'class' ? (
        <div className="chatbox-left-message">
          <p>You have left this chat.</p>
          <button onClick={onRejoin} className="btn-rejoin-chat">
            Rejoin Chat
          </button>
        </div>
      ) : (
        <>
          <div className="chatbox-messages">
            {messages.length === 0 ? (
              <div className="chatbox-empty">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isOwnMessage = msg.user?._id === user?._id || 
                                   msg.user?._id?.toString() === user?._id?.toString();
                return (
                  <div
                    key={index}
                    className={`chatbox-message ${isOwnMessage ? 'own-message' : ''}`}
                  >
                    <div className="message-header">
                      <span className="message-author">
                        {isOwnMessage ? 'You' : msg.user?.name || 'Unknown'}
                      </span>
                      <span className="message-time">{formatTime(msg.createdAt)}</span>
                    </div>
                    <div className="message-content">{msg.message}</div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chatbox-input-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending || hasLeftChat}
              className="chatbox-input"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || hasLeftChat}
              className="chatbox-send-btn"
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatBox;

