import React from 'react';
import { Link } from 'react-router-dom';
import './Unauthorized.css';

const Unauthorized = () => {
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <div className="error-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <div className="unauthorized-actions">
          <Link to="/dashboard" className="back-btn">
            Go to Dashboard
          </Link>
          <Link to="/" className="home-btn">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;