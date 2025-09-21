import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.js';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  lastLogin: Date;
}

class AuthService {
  async signUp(email: string, password: string, displayName: string): Promise<User> {
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
    return user;
  }

  async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await setDoc(doc(db, 'users', user.uid), { lastLogin: new Date() }, { merge: true });
    return user;
  }

  async signOut(): Promise<void> {
    await signOut(auth);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
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
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      // Try popup first
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
      return user;
    } catch (error: any) {
      // Enhanced error detection for COOP and popup issues
      const isPopupError = 
        error.code === 'auth/popup-blocked' || 
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request' ||
        error.message?.includes('Cross-Origin-Opener-Policy') ||
        error.message?.includes('window.closed') ||
        error.message?.includes('popup') ||
        error.toString().includes('popup') ||
        error.toString().includes('COOP');
        
      if (isPopupError) {
        console.log('Popup authentication failed, using redirect method');
        try {
          await signInWithRedirect(auth, provider);
          throw new Error('REDIRECT_INITIATED');
        } catch (redirectError) {
          console.error('Redirect authentication also failed:', redirectError);
          throw new Error('Authentication failed. Please try again or check your browser settings.');
        }
      }
      
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  async handleRedirectResult(): Promise<User | null> {
    try {
      const result = await getRedirectResult(auth);
      if (result?.user) {
        const user = result.user;
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || 'User',
          createdAt: new Date(),
          lastLogin: new Date()
        };
        
        await setDoc(doc(db, 'users', user.uid), userProfile, { merge: true });
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error handling redirect result:', error);
      throw error;
    }
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
      return { success: false, message: 'Failed to get current user' };
    }
  }

  async login(credentials: { email: string; password: string }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const user = userCredential.user;
      
      await setDoc(doc(db, 'users', user.uid), { lastLogin: new Date() }, { merge: true });
      
      const profile = await this.getUserProfile(user.uid);
      return {
        success: true,
        data: {
          user: {
            id: user.uid,
            email: user.email,
            fullName: profile?.displayName || user.displayName,
            created_at: profile?.createdAt || new Date()
          }
        }
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async register(userData: { email: string; password: string; fullName: string; agreeToTerms: boolean }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: userData.fullName });
      
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: userData.fullName,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      return {
        success: true,
        data: {
          user: {
            id: user.uid,
            email: user.email,
            fullName: userData.fullName,
            created_at: new Date()
          }
        }
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  isAuthenticated(): boolean {
    return auth.currentUser !== null;
  }

  private authErrorListeners: Array<() => void> = [];

  onAuthError(callback: () => void): void {
    this.authErrorListeners.push(callback);
  }

  offAuthError(callback: () => void): void {
    this.authErrorListeners = this.authErrorListeners.filter(listener => listener !== callback);
  }

  private triggerAuthError(): void {
    this.authErrorListeners.forEach(callback => callback());
  }
}

const authService = new AuthService();
export default authService;