const { testConnection } = require('../lib/db');
const { corsMiddleware, securityHeaders } = require('../middleware/cors');

async function handler(req, res) {
  corsMiddleware(req, res);
  securityHeaders(req, res);

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const dbHealthy = await testConnection();
    
    res.status(200).json({
      success: true,
      message: 'API is healthy',
      data: {
        timestamp: new Date().toISOString(),
        database: dbHealthy ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
}

module.exports = handler;