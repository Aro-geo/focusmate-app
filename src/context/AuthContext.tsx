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
  signInWithGoogle: () => Promise<boolean>;
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
      console.log('Auth state changed:', firebaseUser?.email, 'Email verified:', firebaseUser?.emailVerified);
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser && firebaseUser.emailVerified) {
        try {
          const profile = await AuthService.getUserProfile(firebaseUser.uid);
          const userData: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || profile?.displayName || 'User',
            email: firebaseUser.email || '',
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
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Use Firebase user data as fallback
          const userData: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
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
        console.log('User signed out or email not verified');
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = await AuthService.signIn(email, password);
      // Check if email is verified
      if (!user.emailVerified) {
        await AuthService.signOut();
        throw new Error('Please verify your email before signing in. Check your inbox for a verification link.');
      }
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string): Promise<boolean> => {
    try {
      await AuthService.signUp(email, password, displayName);
      // Sign out immediately after signup to force email verification
      await AuthService.signOut();
      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      return false;
    }
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      const user = await AuthService.signInWithGoogle();
      // User state will be updated automatically by onAuthStateChanged
      return true;
    } catch (error) {
      console.error('Google sign-in error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AuthService.signOut();
      // Redirect to landing page after logout
      window.location.href = '/';
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
      signInWithGoogle,
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