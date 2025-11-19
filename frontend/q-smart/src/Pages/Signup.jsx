import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    phone: '',
    studentId: '',
    children: [{ name: '', studentId: '', grade: '' }]
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChildChange = (index, field, value) => {
    const updatedChildren = formData.children.map((child, i) => 
      i === index ? { ...child, [field]: value } : child
    );
    setFormData(prev => ({ ...prev, children: updatedChildren }));
  };

  const addChild = () => {
    setFormData(prev => ({
      ...prev,
      children: [...prev.children, { name: '', studentId: '', grade: '' }]
    }));
  };

  const removeChild = (index) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }));
  };

  // Helper function to get the correct dashboard route based on role
  const getDashboardRoute = (userRole) => {
    switch(userRole) {
      case 'parent':
        return '/parent';
      case 'admin':
        return '/admin';
      case 'teacher':
        return '/teacher';
      case 'student':
      default:
        return '/dashboard';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    // Role-specific validation
    if (formData.role === 'student' && !formData.studentId) {
      setError('Student ID is required for students');
      setLoading(false);
      return;
    }

    if (formData.role === 'parent') {
      const validChildren = formData.children.filter(child => 
        child.name && child.studentId && child.grade
      );
      if (validChildren.length === 0) {
        setError('Please add at least one child with complete information');
        setLoading(false);
        return;
      }
    }

    // Prepare data for API
    const submitData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      phone: formData.phone || undefined,
      ...(formData.role === 'student' && { studentId: formData.studentId }),
      ...(formData.role === 'parent' && { 
        children: formData.children.filter(child => child.name && child.studentId && child.grade)
      })
    };

    try {
      const result = await register(submitData);
      
      if (result.success) {
        // Use the redirect route from the auth context OR fallback to role-based routing
        const redirectTo = result.redirectTo || getDashboardRoute(result.user?.role);
        navigate(redirectTo);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('Registration failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="logo">
            <span className="logo-text">QSmart</span>
          </div>
          <h1>Create Account</h1>
          <p>Join Q-Smart to manage your school queues</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">I am a *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="role-select"
                >
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
            </div>
          </div>

          {/* Student-specific fields */}
          {formData.role === 'student' && (
            <div className="form-section">
              <h3 className="section-title">Student Information</h3>
              <div className="form-group">
                <label htmlFor="studentId">Student ID *</label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          {/* Parent-specific fields */}
          {formData.role === 'parent' && (
            <div className="form-section">
              <h3 className="section-title">Children Information</h3>
              {formData.children.map((child, index) => (
                <div key={index} className="child-form">
                  <div className="child-header">
                    <h4>Child {index + 1}</h4>
                    {formData.children.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChild(index)}
                        className="remove-btn"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Child Name *</label>
                      <input
                        type="text"
                        value={child.name}
                        onChange={(e) => handleChildChange(index, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Student ID *</label>
                      <input
                        type="text"
                        value={child.studentId}
                        onChange={(e) => handleChildChange(index, 'studentId', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Grade *</label>
                      <input
                        type="text"
                        value={child.grade}
                        onChange={(e) => handleChildChange(index, 'grade', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addChild}
                className="add-child-btn"
              >
                + Add Another Child
              </button>
            </div>
          )}

          {/* Password Section */}
          <div className="form-section">
            <h3 className="section-title">Security</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength="6"
                  required
                />
                <small className="input-hint">Minimum 6 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-btn primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>Already have an account?</span>
        </div>

        {/* Sign In Link */}
        <Link to="/signin" className="auth-link">
          Sign in to your account
        </Link>
      </div>
    </div>
  );
};

export default Signup;