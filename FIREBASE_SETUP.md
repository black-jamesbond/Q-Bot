# Firebase Setup Guide for Q-bot

## ✅ Firebase Project Configured

Your Firebase project `king-58c2a` is already configured and ready to use!

**Project Details:**
- **Project ID**: `king-58c2a`
- **Auth Domain**: `king-58c2a.firebaseapp.com`
- **Storage Bucket**: `king-58c2a.firebasestorage.app`

## 🚨 Required Setup Steps

You still need to configure these services in your Firebase Console:

### Step 1: Enable Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/project/king-58c2a)
2. Click **Authentication** in the left sidebar
3. Click **Get started**
4. Go to **Sign-in method** tab
5. Enable these providers:
   - **Email/Password**: Click and toggle "Enable"
   - **Google**: Click, toggle "Enable", add your support email

### Step 2: Create Firestore Database

1. Go to **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your preferred location (recommend: us-central1)
5. Click **Done**

### Step 6: Configure Authorized Domains (for Production)

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Add your production domain: `crownvibe300.github.io`
3. For development, `localhost` should already be included

## 🚀 Features Implemented

### ✅ Authentication Features
- **Email/Password Registration** with two-step process
- **Email/Password Login** 
- **Google Sign-In** with popup
- **Password Reset** via email
- **Auto-login persistence** across browser sessions
- **Secure logout** with proper cleanup

### ✅ User Management
- **User profiles** stored in Firestore
- **Auto-generated display names** from first/last name
- **Default firstName** ("John") if not provided
- **User metadata** (creation date, last login, etc.)

### ✅ Security Features
- **Firebase ID tokens** for secure authentication
- **Real-time auth state** monitoring
- **Automatic token refresh**
- **Secure user data** storage in Firestore

## 🔧 Development vs Production

### Development (Current)
- Test mode Firestore rules (open access)
- Localhost authorized domain
- Console logging enabled

### Production Recommendations
1. **Update Firestore Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

2. **Environment Variables**: Move Firebase config to environment variables
3. **Error Handling**: Implement proper error logging service
4. **Rate Limiting**: Configure Firebase Auth rate limits

## 🎯 Next Steps

1. **Update Firebase config** with your actual project credentials
2. **Test authentication** in development
3. **Deploy to production** and test with live Firebase
4. **Monitor usage** in Firebase Console
5. **Set up proper Firestore security rules**

## 📝 Notes

- The current implementation maintains the same UI/UX as before
- All existing features (two-step registration, theme support) are preserved
- Firebase handles all authentication complexity
- User data is automatically synced across devices
- No backend server required for authentication

## 🆘 Troubleshooting

### Common Issues:
1. **"Firebase not configured"**: Update `src/config/firebase.js` with real config
2. **"Domain not authorized"**: Add your domain to Firebase Auth settings
3. **"Permission denied"**: Check Firestore security rules
4. **Google login fails**: Ensure Google provider is enabled and configured

### Debug Mode:
Enable Firebase debug mode by adding to your browser console:
```javascript
localStorage.setItem('debug', 'firebase*');
```
