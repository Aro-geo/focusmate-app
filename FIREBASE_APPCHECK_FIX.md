# 🚨 URGENT: Firebase App Check Debug Token Setup

## Your Debug Token: `E6B1146D-EE32-4D1F-A994-3060912218C7`

## 🔧 STEP-BY-STEP FIX (Do this NOW):

### Step 1: Register Debug Token in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **focusmate-ai-8cad6**
3. Click **App Check** in the left sidebar
4. Click the **Apps** tab
5. Find your web app and click **Manage debug tokens**
6. Click **Add debug token**
7. Enter your token: `E6B1146D-EE32-4D1F-A994-3060912218C7`
8. Click **Save**

### Step 2: Alternative - Disable App Check Completely
If Step 1 doesn't work, disable App Check:
1. In Firebase Console → **App Check**
2. Click **Settings** (gear icon)
3. Toggle **Enforce App Check** to OFF
4. Click **Save**

### Step 3: Enable Authentication (Critical)
1. Click **Authentication** in left sidebar
2. Click **Get started** if not already enabled
3. Go to **Sign-in method** tab
4. Click **Email/Password**
5. Enable the toggle
6. Click **Save**

### Step 4: Set Up Firestore
1. Click **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode**
4. Select location and click **Done**

## 🧪 Test After Setup

1. Clear browser cache completely
2. Try signing up with a new email
3. Should work without the 401 error

## 🔍 Debug Information

Your current setup:
- Debug Token: `E6B1146D-EE32-4D1F-A994-3060912218C7`
- Project: `focusmate-ai-8cad6`
- Domain: `focusmate-ai-8cad6.web.app`

## 📞 If Still Not Working

Try this in browser console:
```javascript
// Check if debug token is set
console.log('Debug token:', window.FIREBASE_APPCHECK_DEBUG_TOKEN);

// Should show: E6B1146D-EE32-4D1F-A994-3060912218C7
```

## ⚡ Quick Alternative

If you want to bypass App Check entirely for now:
1. Firebase Console → App Check → Settings
2. Turn OFF "Enforce App Check"
3. This will allow authentication to work immediately

The authentication should work immediately after completing Step 1 or Step 2!