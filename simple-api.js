// Simple API test server
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.post('/api/auth-register', (req, res) => {
  console.log('Registration request received:', req.body);
  res.json({
    success: true,
    message: 'Registration endpoint is working',
    data: {
      user: {
        id: 1,
        email: req.body.email,
        name: req.body.name
      },
      token: 'test-token'
    }
  });
});

app.post('/api/auth-login', (req, res) => {
  console.log('Login request received:', req.body);
  res.json({
    success: true,
    message: 'Login endpoint is working',
    data: {
      user: {
        id: 1,
        email: req.body.email
      },
      token: 'test-token'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple API server running on http://localhost:${PORT}`);
});
