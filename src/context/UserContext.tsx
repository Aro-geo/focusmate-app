import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { userDataService, UserData, UserDataService } from '../services/UserDataService';
import { realAuthService } from '../services/RealAuthService';

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
  const navigate = useNavigate();

  const refreshUserData = async () => {
    // Bypass authentication - set demo user data
    setUserData({
      id: 1,
      username: 'demo',
      email: 'demo@example.com',
      created_at: new Date().toISOString(),
      tasks: [],
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        completionRate: 0
      }
    });
    setIsLoading(false);
  };

  const logout = async () => {
    try {
      await realAuthService.logout();
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

  // Load demo user data on mount
  useEffect(() => {
    refreshUserData();
  }, []);

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
