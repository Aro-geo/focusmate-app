# Firebase Authentication & Firestore Setup Guide

## 🔐 Environment Variables Setup
Your sensitive keys are now stored in `.env` file. **Never commit this file to version control.**

## 🚀 Firebase Console Setup

### 1. Enable Authentication
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `focusmate-ai-8cad6`
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Email/Password** provider
5. Click **Save**

### 2. Configure Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your preferred location
5. Click **Done**

### 3. Set Firestore Security Rules
Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
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

## 📱 App Integration

### 1. Update App.tsx
Wrap your app with AuthProvider:

```tsx
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          {/* Add ProtectedRoute to other authenticated pages */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

### 2. Install Required Dependencies
```bash
npm install firebase
```

## 🔧 Usage Examples

### Login Component
```tsx
import { useAuth } from '../context/AuthContext';

const { login, isAuthenticated, user } = useAuth();

const handleLogin = async () => {
  const success = await login(email, password);
  if (success) {
    navigate('/dashboard');
  }
};
```

### Protected Component
```tsx
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

## 🗃️ Firestore Collections Structure

### Users Collection (`/users/{userId}`)
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  lastLogin: Date;
}
```

### Tasks Collection (`/tasks/{taskId}`)
```typescript
{
  id: string;
  userId: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔒 Security Best Practices

1. **Environment Variables**: All sensitive keys are in `.env`
2. **Firestore Rules**: Users can only access their own data
3. **Authentication**: All protected routes require authentication
4. **Client-side Validation**: Form validation before API calls
5. **Error Handling**: Proper error messages without exposing sensitive info

## 🚀 Next Steps

1. Enable Authentication in Firebase Console
2. Set up Firestore security rules
3. Test login/signup functionality
4. Create user profile management
5. Implement task management with Firestore
6. Add real-time updates with Firestore listeners

## 📞 Support

If you encounter issues:
1. Check Firebase Console for errors
2. Verify environment variables are loaded
3. Check browser console for detailed error messages
4. Ensure Firestore rules allow your operations