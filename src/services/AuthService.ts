import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  updateProfile
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

  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as UserProfile : null;
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

export default new AuthService();