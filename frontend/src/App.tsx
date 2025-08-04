import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CandidateDashboard from './pages/CandidateDashboard';
import HRDashboard from './pages/HRDashboard';
import JobApplicationPage from './pages/JobApplicationPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import JobsPage from './pages/JobsPage';
import LoadingSpinner from './components/LoadingSpinner';

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'HR' | 'Candidate' }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && <Navigation />}
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/apply"
          element={
            <ProtectedRoute requiredRole="Candidate">
              <JobApplicationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-applications"
          element={
            <ProtectedRoute requiredRole="Candidate">
              <ApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/applications"
          element={
            <ProtectedRoute requiredRole="HR">
              <ApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/applications/:id"
          element={
            <ProtectedRoute requiredRole="HR">
              <ApplicationDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/jobs"
          element={
            <ProtectedRoute requiredRole="HR">
              <JobsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
}

function DashboardRouter() {
  const { isHR } = useAuth();
  return isHR ? <HRDashboard /> : <CandidateDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;