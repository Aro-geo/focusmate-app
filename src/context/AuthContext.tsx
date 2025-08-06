import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import AuthService, { UserProfile } from '../services/AuthService';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences?: {
    theme: 'light' | 'dark';
    notifications: boolean;
    pomodoroLength: number;
    shortBreakLength: number;
    longBreakLength: number;
  };
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        const profile = await AuthService.getUserProfile(firebaseUser.uid);
        if (profile) {
          const userData: User = {
            id: profile.uid,
            name: profile.displayName,
            email: profile.email,
            preferences: {
              theme: 'light',
              notifications: true,
              pomodoroLength: 25,
              shortBreakLength: 5,
              longBreakLength: 15,
            }
          };
          setUser(userData);
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await AuthService.signIn(email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signUp = async (email: string, password: string, displayName: string): Promise<boolean> => {
    try {
      await AuthService.signUp(email, password, displayName);
      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AuthService.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      isAuthenticated,
      login,
      signUp,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};