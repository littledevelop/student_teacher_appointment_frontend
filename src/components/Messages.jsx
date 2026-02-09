import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import './Messages.css';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showTeachersList, setShowTeachersList] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/messages');
      setConversations(response.data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      const response = await api.get('/api/teachers');
      setTeachers(response.data.teachers || []);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    }
  }, []);


  const fetchConversations = useCallback(async () => {
    await fetchMessages();
  }, [fetchMessages]);

  const startPolling = useCallback(() => {
    // Polling for new messages every 30 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 30000);
  }, [fetchMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchTeachers();
    startPolling();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchConversations, fetchTeachers, startPolling]);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      setError('Please type a message');
      return;
    }
    
    if (!selectedConversation) {
      setError('Please select a teacher');
      return;
    }

    setSendingMessage(true);
    setError('');

    try {
      console.log('Sending message to:', selectedConversation._id || selectedConversation.id);
      console.log('Message content:', newMessage);
      const response = await api.post('/api/messages/send', {
        receiver: selectedConversation._id || selectedConversation.id,
        subject: 'Message from Student',
        content: newMessage,
        appointment: null,
      });
      console.log(response)
      console.log('Message sent successfully:', response.data);
      setNewMessage('');
      
      // Refresh messages to show the sent message
      setTimeout(() => {
        fetchMessages();
      }, 500);
      
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send message. Please try again.';
      setError(errorMsg);
    } finally {
      setSendingMessage(false);
    }
  };

  const startNewConversation = (teacher) => {
    setError('');
    setSelectedConversation({
      _id: teacher._id,
      id: teacher._id,
      sender: {
        name: teacher.name,
        email: teacher.email
      }
    });
    setShowTeachersList(false);
    setNewMessage('');
  };

  if (loading) {
    return <div className="messages-loading">Loading messages...</div>;
  }

  return (
    <div className="messages-container">
      <div className="messages-list-panel">
        <div className="messages-header">
          <h4>💬 Conversations</h4>
          <button 
            className="btn-new-message" 
            onClick={() => setShowTeachersList(!showTeachersList)}
            title="New message"
          >
            ✎
          </button>
        </div>
        
        {showTeachersList ? (
          <div className="teachers-list">
            <h5>Select a Teacher</h5>
            {teachers.length === 0 ? (
              <p className="no-teachers">No teachers available</p>
            ) : (
              teachers.map((teacher) => (
                <div
                  key={teacher._id}
                  className="teacher-item"
                  onClick={() => startNewConversation(teacher)}
                >
                  <div className="teacher-avatar">{teacher.name?.charAt(0).toUpperCase() || '?'}</div>
                  <div className="teacher-info">
                    <h6>{teacher.name}</h6>
                    <p>{teacher.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-messages">
            <p>No conversations yet</p>
            <button
              className="btn-start-chat"
              onClick={() => setShowTeachersList(true)}
            >
              Start New Chat
            </button>
          </div>
        ) : (
          <div className="messages-scroll">
            {conversations.map((msg) => (
              <div
                key={msg._id}
                className={`message-item ${selectedConversation?._id === msg._id ? 'active' : ''}`}
                onClick={() => setSelectedConversation(msg)}
              >
                <div className="message-avatar">{msg.sender?.name?.charAt(0).toUpperCase() || '?'}</div>
                <div className="message-preview">
                  <h5>{msg.sender?.name || 'Unknown'}</h5>
                  <p>{msg.content?.substring(0, 40)}...</p>
                </div>
                {msg.unread && <span className="unread-badge"></span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="messages-chat-panel">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <div>
                <h4>{selectedConversation.sender?.name}</h4>
                <p>{selectedConversation.sender?.email}</p>
              </div>
            </div>
            <div className="chat-messages">
              {conversations.find(m => m._id === selectedConversation._id) && (
                <div className="message-bubble incoming">
                  <p>{conversations.find(m => m._id === selectedConversation._id).content}</p>
                  <span className="message-time">
                    {new Date(conversations.find(m => m._id === selectedConversation._id).createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            {error && <div className="message-error">{error}</div>}
            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={sendingMessage}
              />
              <button 
                type="submit" 
                disabled={sendingMessage || !newMessage.trim()} 
                className="btn-send"
                title="Send message"
              >
                {sendingMessage ? '⏳' : '➤'}
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>👋 Select a teacher to start messaging</p>
            {teachers.length > 0 && (
              <button 
                className="btn-primary"
                onClick={() => setShowTeachersList(true)}
              >
                ✎ New Message
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;