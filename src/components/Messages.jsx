import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Messages.css';

const Messages = () => {
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id || currentUser?._id;
  // const currentUserIdStr = currentUserId != null ? String(currentUserId) : '';

  const [conversations, setConversations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showTeachersList, setShowTeachersList] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const isAdmin = currentUser?.role === 'admin';
  const peopleList = isAdmin ? allUsers : teachers;

  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get('/api/messages/conversations');
      setConversations(response.data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError(err.response?.data?.message || 'Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConversationMessages = useCallback(async (otherUserId) => {
    if (!otherUserId) return;
    setLoadingChat(true);
    try {
      const response = await api.get(`/api/messages/conversation/${otherUserId}`);
      setChatMessages(response.data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setChatMessages([]);
    } finally {
      setLoadingChat(false);
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

  const fetchAllUsers = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/all?limit=200');
      const users = (response.data.users || []).filter(
        (u) => String(u._id) !== String(currentUserId) && u.role !== 'admin'
      );
      setAllUsers(users);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchConversations();
    fetchTeachers();
    if (isAdmin) fetchAllUsers();
    pollIntervalRef.current = setInterval(fetchConversations, 15000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchConversations, fetchTeachers, isAdmin, fetchAllUsers]);

  useEffect(() => {
    if (selectedConversation?.otherUser?._id) {
      fetchConversationMessages(selectedConversation.otherUser._id);
    } else {
      setChatMessages([]);
    }
  }, [selectedConversation?.otherUser?._id, fetchConversationMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const receiverId = selectedConversation.otherUser?._id || selectedConversation._id;
    if (!receiverId) {
      setError('Please select a teacher');
      return;
    }

    setSendingMessage(true);
    setError('');

    try {
      await api.post('/api/messages/send', {
        receiver: receiverId,
        subject: 'Chat',
        content: newMessage.trim(),
        appointment: null,
      });
      setNewMessage('');
      await fetchConversationMessages(receiverId);
      await fetchConversations();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send message.';
      setError(errorMsg);
    } finally {
      setSendingMessage(false);
    }
  };

  const startNewConversation = (person) => {
    setError('');
    setSelectedConversation({
      otherUser: {
        _id: person._id,
        name: person.name,
        email: person.email,
      },
      lastMessage: null,
      unreadCount: 0,
      messageCount: 0,
    });
    setChatMessages([]);
    setShowTeachersList(false);
    setNewMessage('');
  };

  const selectConversation = (conv) => {
    setError('');
    setSelectedConversation(conv);
  };

  const getMessageText = (msg) => msg?.content || msg?.message || '';

  if (loading && conversations.length === 0) {
    return (
      <div className="messages-loading">
        <span className="messages-loading-spinner"></span>
        Loading messages...
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-list-panel">
        <div className="messages-header">
          <h4>💬 Conversations</h4>
          <button
            type="button"
            className="btn-new-message"
            onClick={() => setShowTeachersList(!showTeachersList)}
            title="New message"
          >
            ✎
          </button>
        </div>

        {showTeachersList ? (
          <div className="teachers-list">
            <h5>{currentUser?.role === 'admin' ? 'Select a User' : 'Select a Teacher'}</h5>
            {peopleList.length === 0 ? (
              <p className="no-teachers">
                {currentUser?.role === 'admin' ? 'No users available' : 'No teachers available'}
              </p>
            ) : (
              peopleList.map((person) => (
                <div
                  key={person._id}
                  className="teacher-item"
                  onClick={() => startNewConversation(person)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && startNewConversation(person)}
                >
                  <div className="teacher-avatar">
                    {person.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="teacher-info">
                    <h6>{person.name}</h6>
                    <p>{person.email} {person.role && `(${person.role})`}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-messages">
            <p>No conversations yet</p>
            <button
              type="button"
              className="btn-start-chat"
              onClick={() => setShowTeachersList(true)}
            >
              Start New Chat
            </button>
          </div>
        ) : (
          <div className="messages-scroll">
            {conversations.map((conv) => {
              const other = conv.otherUser || {};
              const last = conv.lastMessage || {};
              const preview = getMessageText(last);
              const isActive =
                selectedConversation?.otherUser?._id === other._id ||
                selectedConversation?._id === other._id;

              return (
                <div
                  key={other._id || conv._id}
                  className={`message-item ${isActive ? 'active' : ''}`}
                  onClick={() => selectConversation(conv)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && selectConversation(conv)}
                >
                  <div className="message-avatar">
                    {other.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="message-preview">
                    <h5>{other.name || 'Unknown'}</h5>
                    <p>{preview ? `${preview.substring(0, 40)}${preview.length > 40 ? '...' : ''}` : 'No messages yet'}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="unread-badge">{conv.unreadCount}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="messages-chat-panel">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <div>
                <h4>{selectedConversation.otherUser?.name || selectedConversation.sender?.name || 'Chat'}</h4>
                <p>{selectedConversation.otherUser?.email || selectedConversation.sender?.email || ''}</p>
              </div>
            </div>

            <div className="chat-messages">
              {loadingChat ? (
                <div className="chat-loading">Loading...</div>
              ) : chatMessages.length === 0 ? (
                <div className="chat-empty">No messages yet. Say hello!</div>
              ) : (
                chatMessages.map((msg) => {
                  const senderId = msg.sender?._id ?? msg.sender?.id ?? msg.sender;
                  const isOutgoing = String(senderId) === String(currentUserId);

                  return (
                    <div
                      key={msg._id}
                      className={`message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`}
                    >
                      <p>{getMessageText(msg)}</p>
                      <span className="message-time">
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleString(undefined, {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : ''}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {error && <div className="message-error">{error}</div>}
            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={sendingMessage}
                maxLength={2000}
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
            <p>📥 Inbox – Select a conversation or start a new chat</p>
            {peopleList.length > 0 && (
              <button type="button" className="btn-primary" onClick={() => setShowTeachersList(true)}>
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
