import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import EnhancedDashboard from './pages/EnhancedDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Pomodoro from './pages/Pomodoro';
import Journal from './pages/Journal';
import Stats from './pages/Stats';
import CalendarPage from './pages/calendar/CalendarPage';
import Profile from './pages/Profile';
import SettingsPage from './pages/SettingsPage';
import EnhancedTodoList from './pages/EnhancedTodoList';
import PlanPricing from './pages/PlanPricing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import LandingPage from './pages/LandingPage';
import MobileTestComponent from './components/MobileTestComponent';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <Routes>
              {/* Test Route for Theme and Responsiveness */}
              <Route path="/test" element={<MobileTestComponent />} />
              
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Authentication Routes (no layout) */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              
              {/* Main App Routes (with layout and authentication) */}
              <Route path="/app" element={
                <ProtectedRoute>
                  <Layout><Navigate to="/app/dashboard" replace /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/app/*" element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="dashboard" element={<EnhancedDashboard />} />
                      <Route path="admin" element={
                        <AdminRoute>
                          <AdminDashboard />
                        </AdminRoute>
                      } />
                      <Route path="pomodoro" element={<Pomodoro />} />
                      <Route path="journal" element={<Journal />} />
                      <Route path="stats" element={<Stats />} />
                      <Route path="calendar" element={<CalendarPage />} />
                      <Route path="todos" element={<EnhancedTodoList />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="pricing" element={<PlanPricing />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Legacy routes redirect for backwards compatibility */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/pomodoro" element={<Navigate to="/" replace />} />
              <Route path="/journal" element={<Navigate to="/" replace />} />
              <Route path="/stats" element={<Navigate to="/" replace />} />
              <Route path="/profile" element={<Navigate to="/" replace />} />
              <Route path="/settings" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
