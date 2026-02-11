import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Messages from '../components/Messages';
import './Dashboard.css';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [activeSection, setActiveSection] = useState('requests');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/api/appointments/teacher');
      setAppointments(response.data.appointments || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch appointments');
    }
  };

  const handleStatusUpdate = async (appointmentId, status, meetingLink = '') => {
    setLoading(true);
    try {
      const updateData = { status };
      if (meetingLink) {
        updateData.meetingLink = meetingLink;
      }
      await api.put(`/api/appointments/update/${appointmentId}`, updateData);
      fetchAppointments();
      setSelectedAppointment(null);
      setMeetingLink('');
      alert(`Appointment ${status} successfully!`);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update appointment status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'approved';
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="header-content">
            <h1>Teacher Dashboard</h1>
            <p>Welcome, {user?.name}</p>
          </div>
          <div className="header-actions">
            <button onClick={logout} className="btn-logout">
              📤 Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="header-nav">
        <button 
          onClick={() => setActiveSection('requests')}
          className={`nav-tab ${activeSection === 'requests' ? 'active' : ''}`}
        >
          📬 Requests
        </button>
        <button 
          onClick={() => setActiveSection('approved')}
          className={`nav-tab ${activeSection === 'approved' ? 'active' : ''}`}
        >
          ✅ Approved
        </button>
        <button 
          onClick={() => setShowMessagesModal(true)}
          className={`nav-tab`}
        >
          💬 Messages
        </button>
      </nav>

      <div className="dashboard-content">
        {/* Appointment Requests */}
        {activeSection === 'requests' && (
          <div className="section-card">
            <h2>Appointment Requests</h2>
            {error && <div className="error-message">{error}</div>}
            
            <div className="appointments-list">
              {appointments.filter(app => app.status === 'pending').length === 0 ? (
                <p>No pending requests</p>
              ) : (
                appointments.filter(app => app.status === 'pending').map((appointment) => (
                  <div key={appointment._id} className="appointment-item">
                    <div className="appointment-info">
                      <h4>{appointment.student?.name}</h4>
                      <p>Email: {appointment.student?.email}</p>
                      <p>Date: {new Date(appointment.date).toLocaleDateString()}</p>
                      <p>Time: {appointment.time}</p>
                      <p>Purpose: {appointment.purpose}</p>
                      
                    </div>
                    <div className="appointment-actions">
                      <button
                        onClick={() => setSelectedAppointment(appointment)}
                        className="btn-success"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                        disabled={loading}
                        className="btn-danger"

                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Approved Appointments */}
        {activeSection === 'approved' && (
          <div className="section-card">
            <h2>Approved Appointments</h2>
            <div className="appointments-list">
              {appointments.filter(app => app.status === 'approved').length === 0 ? (
                <p>No approved appointments</p>
              ) : (
                appointments.filter(app => app.status === 'approved').map((appointment) => (
                  <div key={appointment._id} className="appointment-item">
                    <div className="appointment-info">
                      <h4>{appointment.student?.name}</h4>
                      <p>Email: {appointment.student?.email}</p>
                      <p>Date: {new Date(appointment.date).toLocaleDateString()}</p>
                      <p>Time: {appointment.time}</p>
                      <p>Meeting Link: {appointment.meetingLink || 'Not provided'}</p>
                    </div>
                    <div className="appointment-actions">
                      {appointment.meetingLink && (
                        <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer" className="btn-primary">
                          Join
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {selectedAppointment && (
        <div className="modal-overlay" onClick={() => setSelectedAppointment(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Approve Appointment</h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Approve appointment with <strong>{selectedAppointment.student?.name}</strong>?</p>
              <div className="form-group">
                <label>Meeting Link (Optional)</label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                />
              </div>
              <button
                onClick={() => handleStatusUpdate(selectedAppointment._id, 'approved', meetingLink)}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Modal */}
      {showMessagesModal && (
        <div className="modal-overlay" onClick={() => setShowMessagesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Messages</h3>
              <button
                onClick={() => setShowMessagesModal(false)}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>
            <Messages />
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
