/* import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Signin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="signin-page">
      <div className="signin-container">
        <h1>Sign In to QueueSmart</h1>
        
        <form onSubmit={handleSubmit} className="signin-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="signin-btn"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="signin-footer">
          <p>Don't have an account? <a href="/signup">Sign up</a></p>
        </div>

        <div className="demo-credentials">
          <h3>Demo Credentials:</h3>
          <p><strong>Parent:</strong> john.parent@email.com / parent123</p>
          <p><strong>Student:</strong> mike.student@school.edu / student123</p>
          <p><strong>Teacher:</strong> sarah@school.edu / teacher123</p>
        </div>
      </div>
    </div>
  );
};

export default Signin; */