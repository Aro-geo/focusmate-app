/**
 * CORS middleware for API routes
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
function corsMiddleware(req, res, next) {
  // Allow requests from your frontend domain
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://your-app-domain.vercel.app', // Replace with your actual domain
    process.env.FRONTEND_URL
  ].filter(Boolean);

  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (typeof next === 'function') {
    next();
  }
}

/**
 * Security headers middleware
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
function securityHeaders(req, res) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Remove server header for security
  res.removeHeader('X-Powered-By');
}

module.exports = {
  corsMiddleware,
  securityHeaders
};
