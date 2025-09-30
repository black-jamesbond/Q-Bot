import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Firebase Authentication Service
export const firebaseAuthService = {
  // Register new user with email and password
  register: async (email, password, firstName = 'John', lastName = '') => {
    if (!auth || !db) {
      return {
        success: false,
        message: 'Firebase services not available. Please enable Authentication and Firestore in Firebase Console.'
      };
    }

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with display name
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`.trim()
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        firstName: firstName,
        lastName: lastName,
        displayName: `${firstName} ${lastName}`.trim(),
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true
      });

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          firstName: firstName,
          lastName: lastName,
          displayName: user.displayName
        }
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: getErrorMessage(error.code)
      };
    }
  },

  // Login with email and password
  login: async (email, password) => {
    if (!auth || !db) {
      return {
        success: false,
        message: 'Firebase services not available. Please enable Authentication and Firestore in Firebase Console.'
      };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update last login in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        lastLogin: new Date().toISOString()
      }, { merge: true });

      // Get user data from Firestore
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : {};

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          displayName: user.displayName || userData.displayName || ''
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: getErrorMessage(error.code)
      };
    }
  },

  // Google Sign In
  googleLogin: async () => {
    console.log('🔵 Starting Google login process...');

    if (!auth) {
      console.error('❌ Firebase auth not available');
      return {
        success: false,
        message: 'Firebase Authentication not available. Please enable Authentication in Firebase Console.'
      };
    }

    if (!db) {
      console.error('❌ Firestore not available');
      return {
        success: false,
        message: 'Firestore not available. Please enable Firestore in Firebase Console.'
      };
    }

    try {
      console.log('🔵 Opening Google popup...');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log('✅ Google popup completed, user:', user.email);

      // Check if user document exists, create if not
      console.log('🔵 Checking user document in Firestore...');
      const userDocRef = doc(db, 'users', user.uid);

      let userData;
      const nameParts = user.displayName ? user.displayName.split(' ') : ['', ''];

      try {
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.log('🔵 Creating new user document...');
          // Create new user document
          userData = {
            uid: user.uid,
            email: user.email,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            displayName: user.displayName || '',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isActive: true,
            provider: 'google'
          };

          await setDoc(userDocRef, userData);
          console.log('✅ User document created successfully');
        } else {
          console.log('🔵 Updating existing user document...');
          // Update last login
          userData = userDoc.data();
          await setDoc(userDocRef, {
            lastLogin: new Date().toISOString()
          }, { merge: true });
          console.log('✅ User document updated successfully');
        }
      } catch (firestoreError) {
        console.error('⚠️ Firestore operation failed, continuing without user document:', firestoreError);
        // Continue with basic user data even if Firestore fails
        userData = {
          uid: user.uid,
          email: user.email,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          displayName: user.displayName || ''
        };
      }

      console.log('✅ Google login completed successfully');
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          firstName: userData.firstName || nameParts[0] || '',
          lastName: userData.lastName || nameParts.slice(1).join(' ') || '',
          displayName: user.displayName || ''
        }
      };
    } catch (error) {
      console.error('❌ Google login error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);

      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        return {
          success: false,
          message: 'Google login was cancelled. Please try again.'
        };
      } else if (error.code === 'auth/popup-blocked') {
        return {
          success: false,
          message: 'Popup was blocked by browser. Please allow popups and try again.'
        };
      }

      return {
        success: false,
        message: getErrorMessage(error.code)
      };
    }
  },

  // Logout
  logout: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Failed to logout'
      };
    }
  },

  // Password Reset
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Password reset email sent'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: getErrorMessage(error.code)
      };
    }
  },

  // Get current user
  getCurrentUser: () => {
    return auth ? auth.currentUser : null;
  },

  // Auth state observer
  onAuthStateChanged: (callback) => {
    if (!auth) {
      // Call callback with null user if auth not available
      setTimeout(() => callback(null), 100);
      return () => {}; // Return empty unsubscribe function
    }
    return onAuthStateChanged(auth, callback);
  }
};

// Helper function to get user-friendly error messages
const getErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed';
    default:
      return 'An error occurred. Please try again';
  }
};

export default firebaseAuthService;
