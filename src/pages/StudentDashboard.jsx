import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Messages from '../components/Messages';
import './Dashboard.css';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingData, setBookingData] = useState({
    teacherId: '',
    date: '',
    time: '',
    purpose: ''
  });
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [avatarError, setAvatarError] = useState(false);

  // Helper function to get profile picture URL
  const getProfilePictureUrl = () => {
    if (!user?.profilePicture) return null;
    // If it's a relative path from backend, construct full URL
    if (user.profilePicture.startsWith('/uploads/')) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${user.profilePicture}`;
    }
    return user.profilePicture;
  };

  // Helper to get initials for fallback avatar
  const getInitials = () => {
    if (!user?.name) return '?';
    return user.name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    fetchAppointments();
    fetchTeachers();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/api/appointments/student');
      setAppointments(response.data.appointments || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch appointments');
    }
  };

  const fetchTeachers = async (search = '') => {
    try {
      const params = search.trim() ? { search: search.trim() } : {};
      const response = await api.get('/api/teachers', { params });
      setTeachers(response.data.teachers || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch teachers');
    }
  };

  const handleSearchTeachers = (e) => {
    e.preventDefault();
    fetchTeachers(searchQuery);
  };

  const handleBookingChange = (e) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value
    });
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/appointments/book', bookingData);
      setShowBookingForm(false);
      setBookingData({ teacherId: '', date: '', time: '', purpose: '' });
      fetchAppointments();
      alert('Appointment booked successfully!');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointment = async (appointmentId, updates) => {
    try {
      await api.put(`/api/appointments/updateStudentAppointment/${appointmentId}`, updates);
      fetchAppointments();
      alert('Appointment updated successfully!');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update appointment');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="header-content">
            <h1>Student Dashboard</h1>
            <div className="avatar-container">
              {!avatarError && getProfilePictureUrl() ? (
                <img 
                  src={getProfilePictureUrl()} 
                  alt="Student Avatar" 
                  className="avatar" 
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="avatar avatar-fallback">
                  {getInitials()}
                </div>
              )}
            </div>
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
          onClick={() => setActiveSection('overview')}
          className={`nav-tab ${activeSection === 'overview' ? 'active' : ''}`}
        >
          📊 Overview
        </button>
        <button 
          onClick={() => setActiveSection('appointments')}
          className={`nav-tab ${activeSection === 'appointments' ? 'active' : ''}`}
        >
          📅 My Appointments
        </button>
        <button 
          onClick={() => setActiveSection('teachers')}
          className={`nav-tab ${activeSection === 'teachers' ? 'active' : ''}`}
        >
          👨‍🏫 Search Teachers
        </button>
        <button 
          onClick={() => setShowMessagesModal(true)}
          className={`nav-tab`}
        >
          💬 Messages
        </button>
      </nav>

      <div className="dashboard-content">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="section-card">
            <h2>Overview</h2>
            <div className="stats-container">
              <div className="stat-box">
                <h3>{appointments.length}</h3>
                <p>Total Appointments</p>
              </div>
              <div className="stat-box">
                <h3>{appointments.filter(a => a.status === 'pending').length}</h3>
                <p>Pending</p>
              </div>
              <div className="stat-box">
                <h3>{appointments.filter(a => a.status === 'approved').length}</h3>
                <p>Approved</p>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Section */}
        {activeSection === 'appointments' && (
          <div className="section-card">
            <h2>My Appointments</h2>
            {error && <div className="error-message">{error}</div>}
            
            <button 
              onClick={() => setShowBookingForm(!showBookingForm)}
              className="btn-primary"
            >
              Book New Appointment
            </button>

            {showBookingForm && (
              <div className="modal-overlay" onClick={() => setShowBookingForm(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Book New Appointment</h3>
                    <button
                      onClick={() => setShowBookingForm(false)}
                      className="modal-close-btn"
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ padding: '25px', overflowY: 'auto', maxHeight: 'calc(85vh - 100px)' }}>
                    <form onSubmit={handleBookAppointment} className="appointment-form">
                      <div className="form-group">
                        <label>Select Teacher</label>
                        <select
                          name="teacherId"
                          value={bookingData.teacherId}
                          onChange={handleBookingChange}
                          required
                        >
                          <option value="">Choose a teacher</option>
                          {teachers.map((teacher) => (
                            <option key={teacher._id} value={teacher._id}>
                              {teacher.name} ({teacher.email})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Date</label>
                        <input
                          type="date"
                          name="date"
                          value={bookingData.date}
                          onChange={handleBookingChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Time</label>
                        <input
                          type="time"
                          name="time"
                          value={bookingData.time}
                          onChange={handleBookingChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Purpose</label>
                        <textarea
                          name="purpose"
                          value={bookingData.purpose}
                          onChange={handleBookingChange}
                          placeholder="Describe the purpose of your appointment..."
                          required
                        />
                      </div>
                      <div className="form-actions">
                        <button
                          type="button"
                          onClick={() => setShowBookingForm(false)}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary">
                          {loading ? 'Booking...' : 'Book Appointment'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            <div className="appointments-list">
              {appointments.length === 0 ? (
                <p>No appointments yet. Book your first appointment!</p>
              ) : (
                appointments.map((appointment) => (
                  <div key={appointment._id} className="appointment-item">
                    <div className="appointment-info">
                      <h4>{appointment.teacher?.name}</h4>
                      <p>Date: {new Date(appointment.date).toLocaleDateString()}</p>
                      <p>Time: {appointment.time}</p>
                      <p>Purpose: {appointment.purpose}</p>
                      <span className={`status-badge ${appointment.status}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="appointment-actions">
                      {appointment.status === 'pending' && (
                        <button 
                          onClick={() => handleUpdateAppointment(appointment._id, { status: 'cancelled' })}
                          className="btn-danger"
                        >
                          Cancel
                        </button>
                      )}
                      {appointment.status === 'approved' && appointment.meetingLink && (
                        <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer" className="btn-success">
                          Join Meeting
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Teachers Section */}
        {activeSection === 'teachers' && (
          <div className="section-card">
            <h2>Search Teachers</h2>
            <form onSubmit={handleSearchTeachers} className="search-form">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
              />
              <button type="submit" className="btn-primary">Search</button>
              <button 
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchTeachers();
                }}
                className="btn-secondary"
              >
                Clear
              </button>
            </form>

            <div className="teachers-list">
              {teachers.length === 0 ? (
                <p>No teachers found. Try searching again!</p>
              ) : (
                teachers.map((teacher) => (
                  <div key={teacher._id} className="teacher-item">
                    <div className="teacher-info">
                      <h4>{teacher.name}</h4>
                      <p>Email: {teacher.email}</p>
                      <p>Department: {teacher.department}</p>
                      <p>Subject: {teacher.subject}</p>
                    </div>
                    <button
                      onClick={() => {
                        setBookingData({ ...bookingData, teacherId: teacher._id });
                        setActiveSection('appointments');
                        setShowBookingForm(true);
                      }}
                      className="btn-primary"
                    >
                      Book Appointment
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

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

export default StudentDashboard;
