import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { UserDataService } from '../services/UserDataService';
import AuthService from '../services/AuthService';

interface UserData {
  id: number;
  username: string;
  email: string;
  created_at: string;
  tasks: any[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
  };
  focusTime?: string;
}

interface UserContextType {
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
  refreshUserData: () => Promise<void>;
  logout: () => Promise<void>;
  getGreeting: () => string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, firebaseUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const refreshUserData = async () => {
    if (!isAuthenticated || !firebaseUser) {
      setUserData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Get user profile from Firebase
      const profile = await AuthService.getUserProfile(firebaseUser.uid);
      
      if (profile && profile.uid) {
        setUserData({
          id: parseInt(profile.uid.slice(-8), 16), // Convert Firebase UID to number
          username: profile.displayName || 'User',
          email: profile.email,
          created_at: profile.createdAt.toString(),
          tasks: [], // Tasks loaded separately via FirestoreService
          stats: {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            completionRate: 0
          },
          focusTime: '0m'
        });
      } else {
        // Fallback to firebaseUser data if profile is incomplete
        setUserData({
          id: parseInt(firebaseUser.uid.slice(-8), 16),
          username: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          created_at: new Date().toISOString(),
          tasks: [],
          stats: {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            completionRate: 0
          },
          focusTime: '0m'
        });
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthService.signOut();
      setUserData(null);
      setError(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getGreeting = () => {
    return UserDataService.getTimeBasedGreeting();
  };

  // Load user data when authentication state changes
  useEffect(() => {
    if (isAuthenticated && firebaseUser) {
      refreshUserData();
    } else {
      setUserData(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, firebaseUser]);

  const value: UserContextType = {
    userData,
    isLoading,
    error,
    refreshUserData,
    logout,
    getGreeting
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
