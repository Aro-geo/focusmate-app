// src/hooks/useAuth.js
import { useState, useEffect, useContext, createContext } from 'react';
import AuthService from '../services/ProductionAuthService';

// Create Auth Context
const AuthContext = createContext({});

// Auth Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Bypass authentication - set default user
    setUser({ id: 1, email: 'demo@example.com', username: 'demo' });
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await AuthService.login(credentials);
      setUser(response.data.user);
      
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await AuthService.signup(userData);
      setUser(response.data.user);
      
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await AuthService.logout();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await AuthService.updateProfile(profileData);
      setUser(response.data.user);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    updateProfile,
    clearError,
    isAuthenticated: true
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Higher-order component for protected routes
export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { user, loading } = useAuth();
    
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!user) {
      // Redirect to login or show login form
      return <div>Please log in to access this page.</div>;
    }
    
    return <Component {...props} />;
  };
}
