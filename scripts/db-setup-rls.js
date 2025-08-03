const { Client } = require('pg');
require('dotenv').config();

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Create auth schema and JWT functions
    await client.query(`
      -- Create auth schema if it doesn't exist
      CREATE SCHEMA IF NOT EXISTS auth;

      -- Create a function to get the current user_id from JWT
      CREATE OR REPLACE FUNCTION auth.user_id() RETURNS INTEGER AS $$
      BEGIN
        RETURN nullif(current_setting('request.jwt.claim.user_id', true), '')::INTEGER;
      EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('Created auth schema and functions');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        username VARCHAR(50) UNIQUE,
        full_name VARCHAR(100),
        timezone VARCHAR(50) DEFAULT 'UTC',
        is_active BOOLEAN DEFAULT true,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP WITH TIME ZONE,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create user_preferences table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        theme VARCHAR(20) DEFAULT 'light',
        notifications_enabled BOOLEAN DEFAULT true,
        pomodoro_duration INTEGER DEFAULT 25,
        break_duration INTEGER DEFAULT 5,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create user_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create user_activity_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create todos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT false,
        priority VARCHAR(10) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'pending',
        due_date TIMESTAMP WITH TIME ZONE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('Created todos table');

    // Apply Row Level Security
    await client.query(`
      -- Enable RLS on todos table
      ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

      -- Drop any existing policies
      DROP POLICY IF EXISTS todos_isolation_policy ON todos;

      -- Create RLS policy for todos
      CREATE POLICY todos_isolation_policy ON todos
        USING (user_id = auth.user_id());
    `);

    console.log('Applied Row Level Security policies');

  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

setupDatabase();
