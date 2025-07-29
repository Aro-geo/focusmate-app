# Focusmate Backend Setup Guide

## 📦 Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables Setup

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Update `.env.local` with your actual values:
```bash
# Your Neon Database URL
DATABASE_URL=postgresql://neondb_owner:npg_s8ahEI0jtxTM@ep-summer-term-abunoc3n.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Generate a secure JWT secret (32+ characters)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

### 3. Database Schema

Make sure your Neon database has these tables. Run this SQL if needed:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(254) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(30) UNIQUE,
  full_name VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  pomodoro_duration INTEGER DEFAULT 25,
  break_duration INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User sessions table (for refresh tokens)
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User activity logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
```

### 4. Test Database Connection

```bash
node -e "
const { testConnection } = require('./lib/db');
testConnection().then(success => {
  console.log(success ? '✅ Database connected!' : '❌ Database connection failed');
  process.exit(success ? 0 : 1);
});
"
```

## 🚀 Development

### Start Development Server

```bash
vercel dev
```

This will start the development server on `http://localhost:3000`

### Test API Endpoints

#### 1. Test Signup
```bash
curl -X POST http://localhost:3000/api/auth-signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "username": "testuser",
    "fullName": "Test User",
    "agreeToTerms": true
  }'
```

#### 2. Test Login
```bash
curl -X POST http://localhost:3000/api/auth-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

## 🌐 Production Deployment

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 2. Set Environment Variables in Vercel

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add these variables:

```
DATABASE_URL=your-neon-database-url
JWT_SECRET=your-jwt-secret-32-chars-minimum
FRONTEND_URL=https://your-frontend-domain.vercel.app
NODE_ENV=production
```

### 3. Update CORS Origins

In `middleware/cors.js`, update the `allowedOrigins` array with your production domain:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-frontend-domain.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);
```

## 🔐 Security Checklist

- ✅ JWT secrets are secure (32+ characters)
- ✅ Database connections use SSL
- ✅ Passwords are hashed with bcrypt
- ✅ Rate limiting is implemented
- ✅ Input validation is in place
- ✅ CORS is properly configured
- ✅ Security headers are set
- ✅ SQL injection protection (parameterized queries)
- ✅ Account lockout after failed attempts

## 📁 Project Structure

```
focusmate/
├── api/
│   ├── auth-login.js
│   └── auth-signup.js
├── lib/
│   └── db.js
├── middleware/
│   ├── auth.js
│   └── cors.js
├── utils/
│   ├── jwt.js
│   ├── password.js
│   └── validation.js
├── package.json
├── vercel.json
├── .env.example
└── .env.local
```
