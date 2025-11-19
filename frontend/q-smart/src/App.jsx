// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './Pages/Home';
import Signin from './Pages/Signin';
import Signup from './Pages/Signup';
import Dashboard from './Pages/Dashboard';
import ParentDashboard from './Pages/ParentDashboard';
import TeacherDashboard from './Pages/TeacherDashboard';
import AdminDashboard from './Pages/AdminDashboard';
import Unauthorized from './Pages/Unauthorized';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Role-specific protected routes */}
            
            {/* Student Dashboard */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* Parent Dashboard */}
            <Route 
              path="/parent" 
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <ParentDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Teacher Dashboard */}
            <Route 
              path="/teacher" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Admin Dashboard */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Redirect authenticated users away from auth pages */}
            <Route 
              path="/signin" 
              element={
                <PublicRoute>
                  <Signin />
                </PublicRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              } 
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Public Route component - redirects to appropriate dashboard if already authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    const getDashboardRoute = (userRole) => {
      switch(userRole) {
        case 'parent': return '/parent';
        case 'teacher': return '/teacher';
        case 'admin': return '/admin';
        case 'student':
        default: return '/dashboard';
      }
    };
    
    return <Navigate to={getDashboardRoute(user.role)} replace />;
  }

  return children;
};