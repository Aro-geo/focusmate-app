// Simple test server for API routes
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Import API routes
const authSignup = require('./api/auth-signup');
const authLogin = require('./api/auth-login');

// Route handlers
app.post('/api/auth-signup', authSignup);
app.post('/api/auth-login', authLogin);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Test database connection
app.get('/api/db-test', async (req, res) => {
  try {
    const { testConnection } = require('./lib/db');
    const success = await testConnection();
    res.json({ 
      success, 
      message: success ? 'Database connected' : 'Database connection failed' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database test error', 
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📚 Available endpoints:`);
  console.log(`  POST /api/auth-signup - User registration`);
  console.log(`  POST /api/auth-login - User login`);
  console.log(`  GET  /api/health - Health check`);
  console.log(`  GET  /api/db-test - Database connection test`);
});

module.exports = app;
