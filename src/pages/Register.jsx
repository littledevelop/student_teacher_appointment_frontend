import React, { useState, useEffect } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [validationError, setValidationError] = useState("");
  const { register, error, loading, user, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Redirect based on user role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (user.role === 'student') {
        navigate('/student/dashboard');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setValidationError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return;
    }

    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.role
    );

    if (result.success) {
          // Navigation will happen via useEffect when user state updates
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>✨ Register</h2>
        {(error || validationError) && (
          <div className="error-message">{error || validationError}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your name"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="profilePicture">Profile Picture URL</label>
            <input
              type="text"
              name="profilePicture"
              value={formData.profilePicture || ''}
              onChange={handleChange}
              placeholder="Enter profile picture URL"
            />
          </div>
          <div className="form-group">
            <label>Department</label>
            <select
              name="department"
              value={formData.department || ''}
              onChange={handleChange}            >
              <option value="">Select Department (for teachers)</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="Arts">Arts</option>
              <option value="History">History</option>
            </select>
          </div>
          <div className="form-group">
          <label htmlFor="subject">Subject</label>
            <input
              type="text"
              name="subject"  
              value={formData.subject || ''}
              onChange={handleChange}
              placeholder="Enter subject (for teachers)"
            />
          </div>
          <div className="form-group">
            <label htmlFor="specialization">Specialization</label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization || ''}
              onChange={handleChange}
              placeholder="Enter specialization (for teachers)"
            />
          </div>
          <div className="form-group">
            <label htmlFor="officeHours">Office Hours</label>
            <input
              type="text"
              name="officeHours"
              value={formData.officeHours || ''}
              onChange={handleChange}
              placeholder="Enter office hours (for teachers)"
            />
          </div>
          {/* <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              name="bio"
              value={formData.bio || ''}
              onChange={handleChange}
              placeholder="Enter your bio"
            />
          </div> */}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
