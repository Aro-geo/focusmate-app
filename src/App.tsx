import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pomodoro from './pages/Pomodoro';
import Journal from './pages/Journal';
import Stats from './pages/Stats';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import TodoList from './pages/TodoList';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import MobileTestComponent from './components/MobileTestComponent';
import PWAManager from './components/PWAManager';
import ProtectedRoute from './components/ProtectedRoute';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <UserProvider>
            {/* PWA Manager for install prompts and offline functionality */}
            <PWAManager />
            <Routes>
              {/* Test Route for Theme and Responsiveness */}
              <Route path="/test" element={<MobileTestComponent />} />
              
              {/* Authentication Routes (no layout) */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              
              {/* Main App Routes (with layout and authentication) */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/app" element={
                <ProtectedRoute>
                  <Layout><Navigate to="/app/dashboard" replace /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/app/*" element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="pomodoro" element={<Pomodoro />} />
                      <Route path="journal" element={<Journal />} />
                      <Route path="stats" element={<Stats />} />
                      <Route path="todos" element={<TodoList />} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Legacy routes redirect for backwards compatibility */}
              <Route path="/dashboard" element={<Navigate to="/login" replace />} />
              <Route path="/pomodoro" element={<Navigate to="/login" replace />} />
              <Route path="/journal" element={<Navigate to="/login" replace />} />
              <Route path="/stats" element={<Navigate to="/login" replace />} />
              <Route path="/profile" element={<Navigate to="/login" replace />} />
              <Route path="/settings" element={<Navigate to="/login" replace />} />
            </Routes>
            </UserProvider>
          </AuthProvider>
        </Router>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
