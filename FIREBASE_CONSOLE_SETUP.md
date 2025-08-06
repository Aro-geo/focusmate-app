# 🔥 Firebase Console Setup Instructions

## ⚠️ CRITICAL: You must complete these steps in Firebase Console for authentication to work!

### 1. 🔐 Enable Authentication

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **focusmate-ai-8cad6**
3. Click **Authentication** in the left sidebar
4. Click **Get started** if not already enabled
5. Go to **Sign-in method** tab
6. Click **Email/Password**
7. **Enable** the first toggle (Email/Password)
8. Click **Save**

### 2. 🗃️ Set up Firestore Database

1. Click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your preferred location (closest to your users)
5. Click **Done**

### 3. 🔒 Configure Firestore Security Rules

1. In Firestore Database, go to **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own tasks
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Users can read/write their own journal entries
    match /journal/{entryId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Users can read/write their own pomodoro sessions
    match /pomodoro/{sessionId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Click **Publish**

### 4. 🌐 Verify Firebase Hosting

1. Click **Hosting** in the left sidebar
2. Ensure your domain is listed: `focusmate-ai-8cad6.web.app`
3. If not set up, run: `firebase init hosting` and `firebase deploy`

## 🧪 Test Authentication

### Create Test User:
1. Go to **Authentication** → **Users** tab
2. Click **Add user**
3. Email: `test@focusmate.ai`
4. Password: `test123456`
5. Click **Add user**

### Test Login:
1. Open your app: `https://focusmate-ai-8cad6.web.app`
2. Should redirect to `/login`
3. Use test credentials to login
4. Should redirect to `/app/dashboard` after successful login

## 🔍 Debugging Authentication Issues

### Check Browser Console:
- Open Developer Tools (F12)
- Look for Firebase errors in Console tab
- Common errors:
  - "Firebase: Error (auth/configuration-not-found)" → Enable Authentication
  - "Firebase: Error (auth/invalid-email)" → Check email format
  - "Firebase: Error (auth/user-not-found)" → User doesn't exist

### Check Network Tab:
- Look for failed requests to Firebase Auth API
- Status 400/401 = Authentication issue
- Status 403 = Firestore rules issue

### Verify Environment Variables:
Your `.env` file should have:
```
REACT_APP_FIREBASE_API_KEY=AIzaSyD0A6vB81_lMuBnR7mXi6Kb6DO2TS3hGVY
REACT_APP_FIREBASE_AUTH_DOMAIN=focusmate-ai-8cad6.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=focusmate-ai-8cad6
```

## 🚀 After Setup Complete:

1. **Build and Deploy:**
   ```bash
   npm run build
   firebase deploy
   ```

2. **Test Flow:**
   - Visit app → Redirects to login
   - Sign up new user → Creates account
   - Login → Redirects to dashboard
   - Logout → Redirects to login

## 📞 Troubleshooting:

If authentication still doesn't work:
1. Check Firebase Console → Authentication → Users (should show registered users)
2. Check Firestore → Data (should show user documents)
3. Check browser localStorage for Firebase tokens
4. Verify all Firebase services are enabled in Console