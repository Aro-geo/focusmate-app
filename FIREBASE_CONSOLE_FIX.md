# 🚨 URGENT: Firebase Console Configuration Required

## ⚠️ Current Issue: App Check Token Invalid Error

The error `auth/firebase-app-check-token-is-invalid` means Firebase App Check is enabled but not properly configured.

## 🔧 IMMEDIATE FIX - Disable App Check (Recommended for Development)

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com)
2. Select project: **focusmate-ai-8cad6**

### Step 2: Disable App Check
1. Click **App Check** in the left sidebar
2. If App Check is enabled, click **Settings** (gear icon)
3. Click **Disable App Check** or **Turn off enforcement**
4. Confirm the action

### Step 3: Enable Authentication (If Not Already Done)
1. Click **Authentication** in left sidebar
2. Click **Get started** if not enabled
3. Go to **Sign-in method** tab
4. Enable **Email/Password** provider
5. Click **Save**

### Step 4: Set Up Firestore Database
1. Click **Firestore Database** in left sidebar
2. Click **Create database**
3. Choose **Start in test mode**
4. Select location and click **Done**

## 🧪 Test Authentication Now

1. **Build and deploy:**
   ```bash
   npm run build
   firebase deploy
   ```

2. **Test signup:**
   - Go to your app
   - Try creating a new account
   - Should work without App Check errors

## 🔒 Alternative: Configure App Check (Production Setup)

If you want to keep App Check enabled:

### Step 1: Get reCAPTCHA Site Key
1. Go to [Google reCAPTCHA](https://www.google.com/recaptcha/admin)
2. Create new site with reCAPTCHA v3
3. Add your domain: `focusmate-ai-8cad6.web.app`
4. Copy the **Site Key**

### Step 2: Configure App Check in Firebase
1. In Firebase Console → **App Check**
2. Click **Apps** tab
3. Select your web app
4. Choose **reCAPTCHA v3**
5. Enter your Site Key
6. Click **Save**

### Step 3: Update Firebase Config
Replace the placeholder in `firebase.js`:
```javascript
// Replace this line:
window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

// With proper reCAPTCHA configuration:
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_ACTUAL_SITE_KEY_HERE'),
  isTokenAutoRefreshEnabled: true
});
```

## 🎯 Recommended Approach

**For Development:** Disable App Check (Step 2 above)
**For Production:** Configure App Check properly with reCAPTCHA

## 🔍 Verify Fix

After making changes:
1. Clear browser cache and cookies
2. Try signing up with a new email
3. Check browser console for errors
4. Should see successful authentication

## 📞 Still Having Issues?

Check these in Firebase Console:
- **Authentication** → **Users** (should show new users after signup)
- **Firestore** → **Data** (should show user documents)
- **App Check** → **Metrics** (should show requests if enabled)

The authentication should work immediately after disabling App Check!