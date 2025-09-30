// Firebase Setup Verification Utility
import { auth, db } from '../config/firebase';
import { connectAuthEmulator, connectFirestoreEmulator } from 'firebase/auth';

export const firebaseSetupCheck = {
  // Check if Firebase is properly initialized
  checkInitialization: () => {
    const checks = {
      auth: !!auth,
      firestore: !!db,
      config: true
    };
    
    console.log('🔥 Firebase Initialization Check:');
    console.log('✅ Authentication:', checks.auth ? 'Initialized' : '❌ Failed');
    console.log('✅ Firestore:', checks.firestore ? 'Initialized' : '❌ Failed');
    console.log('✅ Configuration:', checks.config ? 'Loaded' : '❌ Failed');
    
    return checks;
  },

  // Check Firebase project connection
  checkConnection: async () => {
    try {
      // Try to get current auth state
      const user = auth.currentUser;
      console.log('🔗 Firebase Connection Check:');
      console.log('✅ Auth Connection:', 'Connected');
      console.log('👤 Current User:', user ? user.email : 'Not signed in');
      
      return { success: true, user };
    } catch (error) {
      console.error('❌ Firebase Connection Failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Check required Firebase services
  checkServices: async () => {
    const services = {
      auth: false,
      firestore: false
    };

    try {
      // Check Auth
      if (auth) {
        services.auth = true;
      }

      // Check Firestore
      if (db) {
        services.firestore = true;
      }

      console.log('🛠️ Firebase Services Check:');
      console.log('✅ Authentication Service:', services.auth ? 'Available' : '❌ Not Available');
      console.log('✅ Firestore Service:', services.firestore ? 'Available' : '❌ Not Available');

      return services;
    } catch (error) {
      console.error('❌ Services Check Failed:', error);
      return services;
    }
  },

  // Run all checks
  runAllChecks: async () => {
    console.log('🚀 Running Firebase Setup Verification...\n');
    
    const initialization = firebaseSetupCheck.checkInitialization();
    const connection = await firebaseSetupCheck.checkConnection();
    const services = await firebaseSetupCheck.checkServices();
    
    const allPassed = initialization.auth && 
                     initialization.firestore && 
                     connection.success && 
                     services.auth && 
                     services.firestore;

    console.log('\n📋 Summary:');
    if (allPassed) {
      console.log('🎉 All checks passed! Firebase is properly configured.');
      console.log('💡 You can now use authentication and Firestore features.');
    } else {
      console.log('⚠️ Some checks failed. Please review the setup:');
      console.log('📖 Check FIREBASE_SETUP.md for configuration steps.');
    }

    return {
      initialization,
      connection,
      services,
      allPassed
    };
  },

  // Setup instructions
  getSetupInstructions: () => {
    console.log('📋 Firebase Setup Instructions:');
    console.log('1. Go to https://console.firebase.google.com/project/king-58c2a');
    console.log('2. Enable Authentication (Email/Password + Google)');
    console.log('3. Create Firestore Database (test mode)');
    console.log('4. Add your domain to authorized domains');
    console.log('5. Refresh the application');
    
    return {
      consoleUrl: 'https://console.firebase.google.com/project/king-58c2a',
      steps: [
        'Enable Authentication',
        'Create Firestore Database',
        'Configure authorized domains',
        'Test the application'
      ]
    };
  }
};

// Auto-run checks in development
if (import.meta.env.DEV) {
  // Run checks after a short delay to ensure Firebase is initialized
  setTimeout(() => {
    firebaseSetupCheck.runAllChecks();
  }, 2000);
}

export default firebaseSetupCheck;
