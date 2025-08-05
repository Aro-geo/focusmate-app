// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Import Firestore service

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD0A6vB81_lMuBnR7mXi6Kb6DO2TS3hGVY",
  authDomain: "focusmate-ai-8cad6.firebaseapp.com",
  projectId: "focusmate-ai-8cad6", // Your Project ID!
  storageBucket: "focusmate-ai-8cad6.firebasestorage.app",
  messagingSenderId: "704086849869",
  appId: "1:704086849869:web:5374e89bfb21729f8c1f04",
  measurementId: "G-JH4NYF7RNJ" // Your Google Analytics info
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { db };