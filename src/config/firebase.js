// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdgnpVEqnzB5Rpu9lteZhcYYJEFdcwpzc",
  authDomain: "king-58c2a.firebaseapp.com",
  projectId: "king-58c2a",
  storageBucket: "king-58c2a.firebasestorage.app",
  messagingSenderId: "925771594412",
  appId: "1:925771594412:web:9930b4ac84b95d5a397d09",
  measurementId: "G-YN6RZLVL45"
};

// Initialize Firebase with error handling
let app = null;
let auth = null;
let db = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('✅ Firebase initialized successfully with project:', firebaseConfig.projectId);
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  console.log('🔧 Please enable Authentication and Firestore in Firebase Console:');
  console.log('   https://console.firebase.google.com/project/king-58c2a');
}

export { auth, db };
export default app;
