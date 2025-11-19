// context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Check if user is logged in on app start
  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data.data.user);
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
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

  // Login function - UPDATED to return redirectTo
  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      return { 
        success: true, 
        user,
        redirectTo: getDashboardRoute(user.role) // ADD THIS LINE
      };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  // Register function - UPDATED to return redirectTo
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      return { 
        success: true, 
        user,
        redirectTo: getDashboardRoute(user.role) // ADD THIS LINE
      };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  // Get dashboard route for current user
  const getCurrentUserDashboard = () => {
    return getDashboardRoute(user?.role);
  };

  const value = {
    user,
    login,
    register,
    logout,
    hasRole,
    hasAnyRole,
    getCurrentUserDashboard,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};