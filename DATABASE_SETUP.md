# 🚀 FocusMate AI - Database Setup & Deployment Guide

## Prerequisites

Before setting up your database, ensure you have:

- ✅ Node.js (v16 or higher)
- ✅ A Neon account and database
- ✅ Your project dependencies installed (`npm install`)

## 🏗️ Database Setup Steps

### Step 1: Get Your Neon Database URL

1. Log in to your [Neon Console](https://console.neon.tech)
2. Select your project or create a new one
3. Go to the **Connection Details** section
4. Copy the connection string that looks like:
   ```
   postgresql://username:password@host/database?sslmode=require
   ```

### Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your actual credentials:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://your_username:your_password@your_host/your_database?sslmode=require
   
   # JWT Configuration (generate a secure random string)
   JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters_long
   
   # Optional: Additional configuration
   NODE_ENV=development
   OPENAI_API_KEY=your_openai_api_key_if_using_ai_features
   ```

   **💡 Pro Tip**: Generate a secure JWT secret using:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

### Step 3: Initialize the Database

Run the setup script to create all tables:

```bash
# Basic setup (creates tables only)
npm run db:setup

# Setup with test user (creates tables + test user)
npm run db:setup:with-test
```

### Step 4: Verify Database Health

Check that everything is working correctly:

```bash
npm run db:health
```

This will show you:
- ✅ Connection status
- ✅ Table creation status
- ✅ Performance metrics
- ✅ Recommendations for optimization

## 🗃️ Database Schema Overview

Your database will include these tables:

| Table | Purpose |
|-------|---------|
| `users` | User accounts and authentication |
| `user_preferences` | User settings and preferences |
| `tasks` | Task management and tracking |
| `pomodoro_sessions` | Focus session data |
| `journal_entries` | Daily reflections and notes |
| `focus_partners` | Partner relationships |
| `session_messages` | Chat messages during sessions |
| `user_analytics` | Usage analytics and insights |
| `partner_compatibility` | Partner matching data |
| `user_achievements` | Gamification and achievements |

## 🔧 Available Database Commands

| Command | Purpose |
|---------|---------|
| `npm run db:setup` | Initialize database with all tables |
| `npm run db:setup:with-test` | Setup + create test user |
| `npm run db:health` | Run comprehensive health check |
| `npm run db:reset` | ⚠️ Reset database (destructive) |

## 🧪 Testing Your Setup

### 1. Test Database Connection

```bash
npm run db:health
```

Expected output:
```
🏥 Running database health checks...

✅ Connection: connected
✅ Database Info: your_database (your_user)
✅ Tables: 10 found
✅ Schema: All required tables present
✅ Performance: 25ms avg query time
✅ Pool: 0/20 connections

🏥 Overall Status: HEALTHY
```

### 2. Test User Registration (if using test user)

If you used `npm run db:setup:with-test`, you can test with:
- **Email**: `test@focusmate.ai`
- **Password**: `password123`

### 3. Verify Tables

Connect to your Neon database console and run:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

## 🚨 Troubleshooting

### Connection Issues

**Problem**: `DATABASE_URL environment variable is required`
**Solution**: Ensure your `.env` file exists and contains the correct `DATABASE_URL`

**Problem**: `Connection failed`
**Solutions**:
- Verify your Neon database is active
- Check your connection string format
- Ensure your IP is allowlisted in Neon (if restrictions are enabled)

### Schema Issues

**Problem**: `No tables found`
**Solution**: Run `npm run db:setup` to create tables

**Problem**: `Missing tables`
**Solution**: Check the health report and re-run setup if needed

### Performance Issues

**Problem**: High query response times
**Solutions**:
- Check your internet connection
- Verify Neon database region
- Consider upgrading your Neon plan for better performance

## 🔐 Security Best Practices

1. **JWT Secret**: Use a strong, randomly generated secret (at least 32 characters)
2. **Environment Variables**: Never commit `.env` files to version control
3. **Database Access**: Use connection pooling (already configured)
4. **Password Hashing**: Passwords are hashed with bcrypt (salt rounds: 12)

## 📚 Next Steps

After successful database setup:

1. **Start Development Server**:
   ```bash
   npm start
   ```

2. **Test Authentication**: Try registering a new user through your app

3. **Explore Features**: Test the Pomodoro timer, task management, and other features

4. **Monitor Health**: Periodically run `npm run db:health` to ensure everything is working

## 🤝 Getting Help

If you encounter issues:

1. Run `npm run db:health` for diagnostic information
2. Check the console logs for detailed error messages
3. Verify your `.env` configuration
4. Ensure your Neon database is accessible

## 📊 Monitoring & Maintenance

### Regular Health Checks

Add this to your CI/CD pipeline:
```bash
npm run db:health
```

### Database Backups

Neon provides automatic backups, but you can also:
1. Use Neon's branching feature for point-in-time recovery
2. Export data using `pg_dump` if needed

### Performance Monitoring

Monitor these metrics:
- Query response times
- Connection pool usage
- Database size growth
- Active sessions

---

🎉 **Congratulations!** Your FocusMate AI database is now ready for development and production use!
