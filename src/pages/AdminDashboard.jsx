import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Messages from '../components/Messages';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    subject: '',
    specialization: '',
    officeHours: '',
    bio: '',
    studentId: '',
    year: '',
    course: ''
  });

  useEffect(() => {
    fetchAppointments();
    fetchUsers();
    fetchPendingUsers();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/api/appointments/admin/all');
      setAppointments(response.data.appointments || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch appointments');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/all');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const response = await api.get('/api/admin/all?approved=false');
      setPendingUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
    }
  };


  const getAppointmentStats = () => {
    const total = appointments.length;
    const pending = appointments.filter(app => app.status === 'pending').length;
    const approved = appointments.filter(app => app.status === 'approved').length;
    const cancelled = appointments.filter(app => app.status === 'cancelled').length;
    return { total, pending, approved, cancelled };
  };

  const getUserStats = () => {
    const total = users.length;
    const students = users.filter(user => user.role === 'student').length;
    const teachers = users.filter(user => user.role === 'teacher').length;
    const admins = users.filter(user => user.role === 'admin').length;
    return { total, students, teachers, admins };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'approved';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/register', userFormData);
      setShowUserForm(false);
      setUserFormData({
        name: '',
        email: '',
        password: '',
        role: 'student',
        department: '',
        subject: '',
        specialization: '',
        officeHours: '',
        bio: '',
        studentId: '',
        year: '',
        course: ''
      });
      fetchUsers();
      alert('User created successfully!');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/api/appointments/${appointmentId}`);
      fetchAppointments();
      alert('Appointment deleted successfully!');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/api/admin/user/${userId}`);
      fetchUsers();
      alert('User deleted successfully!');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId, approved) => {
    setLoading(true);
    try {
      await api.put(`/api/admin/approve/${userId}`, { approved });
      fetchUsers();
      fetchPendingUsers();
      alert(`User ${approved ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update user approval');
    } finally {
      setLoading(false);
    }
  };

  const stats = getAppointmentStats();
  const userStats = getUserStats();
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="header-content">
            <h1>Admin Dashboard</h1>
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
          📅 Appointments
        </button>
        <button
          onClick={() => setActiveSection('users')}
          className={`nav-tab ${activeSection === 'users' ? 'active' : ''}`}
        >
          👥 Users
        </button>
        <button
          onClick={() => setActiveSection('approvals')}
          className={`nav-tab ${activeSection === 'approvals' ? 'active' : ''}`}
        >
          ✓ Approvals
          {pendingUsers.length > 0 && (
            <span className="notification-badge">{pendingUsers.length}</span>
          )}
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
            <h2>System Overview</h2>
            
            <div className="overview-section">
              <h3>Appointment Statistics</h3>
              <div className="stats-container">
                <div className="stat-box">
                  <h4>{stats.total}</h4>
                  <p>Total Appointments</p>
                </div>
                <div className="stat-box">
                  <h4>{stats.pending}</h4>
                  <p>Pending</p>
                </div>
                <div className="stat-box">
                  <h4>{stats.approved}</h4>
                  <p>Approved</p>
                </div>
                <div className="stat-box">
                  <h4>{stats.cancelled}</h4>
                  <p>Cancelled</p>
                </div>
              </div>
            </div>

            <div className="overview-section">
              <h3>User Statistics</h3>
              <div className="stats-container">
                <div className="stat-box">
                  <h4>{userStats.total}</h4>
                  <p>Total Users</p>
                </div>
                <div className="stat-box">
                  <h4>{userStats.students}</h4>
                  <p>Students</p>
                </div>
                <div className="stat-box">
                  <h4>{userStats.teachers}</h4>
                  <p>Teachers</p>
                </div>
                <div className="stat-box">
                  <h4>{userStats.admins}</h4>
                  <p>Admins</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Section */}
        {activeSection === 'appointments' && (
          <div className="section-card">
            <h2>All Appointments</h2>
            {error && <div className="error-message">{error}</div>}

            <div className="appointments-list">
              {appointments.length === 0 ? (
                <div className="empty-state">
                  <p>No appointments found</p>
                </div>
              ) : (
                appointments.map((appointment) => (
                  <div key={appointment._id} className="appointment-card">
                    <div className="appointment-header">
                      <h3>
                        {appointment.student?.name || 'Student'} →{' '}
                        {appointment.teacher?.name || 'Teacher'}
                      </h3>
                      <span className={`status-badge ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="appointment-info">
                      <p>
                        <strong>Student:</strong> {appointment.student?.name}{' '}
                        ({appointment.student?.email})
                      </p>
                      <p>
                        <strong>Teacher:</strong> {appointment.teacher?.name}{' '}
                        ({appointment.teacher?.email})
                      </p>
                      <p>
                        <strong>Date & Time:</strong>{' '}
                        {new Date(appointment.date).toLocaleDateString()} at{' '}
                        {appointment.time}
                      </p>
                      <p>
                        <strong>Purpose:</strong> {appointment.purpose}
                      </p>
                      <p>
                        <strong>Created:</strong>{' '}
                        {new Date(appointment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAppointment(appointment._id)}
                      disabled={loading}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Users Section */}
        {activeSection === 'users' && (
          <div className="section-card">
            <h2>User Management</h2>
            {error && <div className="error-message">{error}</div>}

            <button
              onClick={() => setShowUserForm(!showUserForm)}
              className="btn-primary"
            >
              Add New User
            </button>

            {showUserForm && (
              <div className="modal-overlay" onClick={() => setShowUserForm(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Create New User</h3>
                    <button
                      onClick={() => setShowUserForm(false)}
                      className="modal-close-btn"
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ padding: '25px', overflowY: 'auto', maxHeight: 'calc(85vh - 100px)' }}>
                    <form onSubmit={handleCreateUser} className="user-form">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          value={userFormData.name}
                          onChange={(e) =>
                            setUserFormData({ ...userFormData, name: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          value={userFormData.email}
                          onChange={(e) =>
                            setUserFormData({ ...userFormData, email: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Password</label>
                        <input
                          type="password"
                          value={userFormData.password}
                          onChange={(e) =>
                            setUserFormData({ ...userFormData, password: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Role</label>
                        <select
                          value={userFormData.role}
                          onChange={(e) =>
                            setUserFormData({ ...userFormData, role: e.target.value })
                          }
                          required
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      {userFormData.role === 'teacher' && (
                        <>
                          <div className="form-group">
                            <label>Department</label>
                            <input
                              type="text"
                              value={userFormData.department}
                              onChange={(e) =>
                                setUserFormData({
                                  ...userFormData,
                                  department: e.target.value
                                })
                              }
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>Subject</label>
                            <input
                              type="text"
                              value={userFormData.subject}
                              onChange={(e) =>
                                setUserFormData({
                                  ...userFormData,
                                  subject: e.target.value
                                })
                              }
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>Specialization</label>
                            <input
                              type="text"
                              value={userFormData.specialization}
                              onChange={(e) =>
                                setUserFormData({
                                  ...userFormData,
                                  specialization: e.target.value
                                })
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label>Office Hours</label>
                            <input
                              type="text"
                              value={userFormData.officeHours}
                              onChange={(e) =>
                                setUserFormData({
                                  ...userFormData,
                                  officeHours: e.target.value
                                })
                              }
                              placeholder="e.g., Mon-Fri 9AM-5PM"
                            />
                          </div>

                          <div className="form-group">
                            <label>Bio</label>
                            <textarea
                              value={userFormData.bio}
                              onChange={(e) =>
                                setUserFormData({ ...userFormData, bio: e.target.value })
                              }
                              placeholder="Brief description about the teacher..."
                              rows="3"
                            />
                          </div>
                        </>
                      )}

                      {userFormData.role === 'student' && (
                        <>
                          <div className="form-group">
                            <label>Student ID</label>
                            <input
                              type="text"
                              value={userFormData.studentId}
                              onChange={(e) =>
                                setUserFormData({
                                  ...userFormData,
                                  studentId: e.target.value
                                })
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label>Year</label>
                            <input
                              type="text"
                              value={userFormData.year}
                              onChange={(e) =>
                                setUserFormData({ ...userFormData, year: e.target.value })
                              }
                              placeholder="e.g., 3rd Year"
                            />
                          </div>

                          <div className="form-group">
                            <label>Course</label>
                            <input
                              type="text"
                              value={userFormData.course}
                              onChange={(e) =>
                                setUserFormData({
                                  ...userFormData,
                                  course: e.target.value
                                })
                              }
                              placeholder="e.g., Computer Science"
                            />
                          </div>
                        </>
                      )}

                      <div className="form-actions">
                        <button
                          type="button"
                          onClick={() => setShowUserForm(false)}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary">
                          Create User
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            <div className="users-list">
              {users.length === 0 ? (
                <div className="empty-state">
                  <p>No users found</p>
                </div>
              ) : (
                users.map((userData) => (
                  <div key={userData._id} className="user-card">
                    <div className="user-info">
                      <h3>{userData.name}</h3>
                      <p>{userData.email}</p>
                      <span className="role-badge">
                        {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteUser(userData._id)}
                      disabled={loading}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Approvals Section */}
        {activeSection === 'approvals' && (
          <div className="section-card">
            <h2>User Approvals</h2>
            {error && <div className="error-message">{error}</div>}

            <div className="approvals-list">
              {pendingUsers.length === 0 ? (
                <div className="empty-state">
                  <p>No pending approvals</p>
                </div>
              ) : (
                pendingUsers.map((pendingUser) => (
                  <div key={pendingUser._id} className="approval-card">
                    <div className="approval-info">
                      <h3>{pendingUser.name}</h3>
                      <p>{pendingUser.email}</p>
                      <p>
                        <strong>Role:</strong>{' '}
                        {pendingUser.role.charAt(0).toUpperCase() +
                          pendingUser.role.slice(1)}
                      </p>
                      <p>
                        <strong>Registered:</strong>{' '}
                        {new Date(pendingUser.createdAt).toLocaleDateString()}
                      </p>

                      {pendingUser.role === 'teacher' && (
                        <>
                          <p>
                            <strong>Department:</strong>{' '}
                            {pendingUser.department || 'Not specified'}
                          </p>
                          <p>
                            <strong>Subject:</strong>{' '}
                            {pendingUser.subject || 'Not specified'}
                          </p>
                          {pendingUser.specialization && (
                            <p>
                              <strong>Specialization:</strong>{' '}
                              {pendingUser.specialization}
                            </p>
                          )}
                          {pendingUser.bio && (
                            <p>
                              <strong>Bio:</strong> {pendingUser.bio}
                            </p>
                          )}
                        </>
                      )}

                      {pendingUser.role === 'student' && (
                        <>
                          {pendingUser.studentId && (
                            <p>
                              <strong>Student ID:</strong> {pendingUser.studentId}
                            </p>
                          )}
                          {pendingUser.year && (
                            <p>
                              <strong>Year:</strong> {pendingUser.year}
                            </p>
                          )}
                          {pendingUser.course && (
                            <p>
                              <strong>Course:</strong> {pendingUser.course}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <div className="approval-actions">
                      <button
                        onClick={() => handleApproveUser(pendingUser._id, true)}
                        disabled={loading}
                        className="btn-success"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproveUser(pendingUser._id, false)}
                        disabled={loading}
                        className="btn-danger"
                      >
                        Reject
                      </button>
                    </div>
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
            <button
              className="modal-close-btn"
              onClick={() => setShowMessagesModal(false)}
            >
              ✕
            </button>
            <Messages />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
