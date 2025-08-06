import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Set App Check debug token for development
if (typeof window !== 'undefined' && process.env.REACT_APP_FIREBASE_APPCHECK_DEBUG_TOKEN) {
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.REACT_APP_FIREBASE_APPCHECK_DEBUG_TOKEN;
  console.log('🔧 App Check Debug Token set:', process.env.REACT_APP_FIREBASE_APPCHECK_DEBUG_TOKEN);
} else {
  console.warn('⚠️ App Check Debug Token not found in environment variables');
}

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };