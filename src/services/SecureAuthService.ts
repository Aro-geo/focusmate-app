import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import { SecurityUtils } from '../utils/security';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  lastLogin: Date;
}

// Secure token storage using sessionStorage instead of localStorage
class SecureTokenStorage {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_KEY = 'refresh_token';

  static setTokens(accessToken: string, refreshToken: string): void {
    // Use sessionStorage for better security (cleared when tab closes)
    sessionStorage.setItem(this.TOKEN_KEY, accessToken);
    sessionStorage.setItem(this.REFRESH_KEY, refreshToken);
  }

  static getAccessToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_KEY);
  }

  static clearTokens(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_KEY);
  }
}

class SecureAuthService {
  private csrfToken: string | null = null;

  constructor() {
    this.generateCSRFToken();
  }

  private generateCSRFToken(): void {
    this.csrfToken = SecurityUtils.generateCSRFToken();
  }

  getCSRFToken(): string | null {
    return this.csrfToken;
  }

  async signUp(email: string, password: string, displayName: string): Promise<User> {
    // Validate inputs
    if (!SecurityUtils.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName });
    await sendEmailVerification(user);
    
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName,
      createdAt: new Date(),
      lastLogin: new Date()
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    // Store tokens securely
    const token = await user.getIdToken();
    SecureTokenStorage.setTokens(token, user.refreshToken);
    
    return user;
  }

  async signIn(email: string, password: string): Promise<User> {
    // Validate inputs
    if (!SecurityUtils.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await setDoc(doc(db, 'users', user.uid), { lastLogin: new Date() }, { merge: true });
    
    // Store tokens securely
    const token = await user.getIdToken();
    SecureTokenStorage.setTokens(token, user.refreshToken);
    
    return user;
  }

  async signOut(): Promise<void> {
    SecureTokenStorage.clearTokens();
    await signOut(auth);
  }

  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as UserProfile : null;
  }

  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || 'User',
      createdAt: new Date(),
      lastLogin: new Date()
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile, { merge: true });
    
    // Store tokens securely
    const token = await user.getIdToken();
    SecureTokenStorage.setTokens(token, user.refreshToken);
    
    return user;
  }

  async getCurrentUser(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const user = auth.currentUser;
      if (user) {
        const profile = await this.getUserProfile(user.uid);
        return {
          success: true,
          data: {
            id: user.uid,
            email: user.email,
            fullName: profile?.displayName || user.displayName,
            created_at: profile?.createdAt || new Date()
          }
        };
      }
      return { success: false, message: 'No user logged in' };
    } catch (error) {
      console.error('Failed to get current user:', SecurityUtils.sanitizeForLog(String(error)));
      return { success: false, message: 'Failed to get current user' };
    }
  }

  isAuthenticated(): boolean {
    return auth.currentUser !== null;
  }

  // Secure method to check if user has valid session
  async hasValidSession(): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      // Verify token is still valid
      await user.getIdToken(true);
      return true;
    } catch (error) {
      console.error('Session validation failed:', SecurityUtils.sanitizeForLog(String(error)));
      SecureTokenStorage.clearTokens();
      return false;
    }
  }
}

export default new SecureAuthService();