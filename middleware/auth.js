const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { query } = require('../lib/db');

/**
 * Authentication middleware to verify JWT tokens
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
        error: 'MISSING_TOKEN'
      });
    }

    // Verify the token
    const decoded = verifyToken(token);
    
    // Optional: Check if user still exists and is active
    const userResult = await query(
      'SELECT id, email, username, is_active, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        error: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      isActive: user.is_active,
      createdAt: user.created_at
    };

    if (typeof next === 'function') {
      next();
    }

  } catch (error) {
    console.error('Authentication error:', error.message);
    
    let message = 'Invalid or expired token';
    let errorCode = 'INVALID_TOKEN';
    
    if (error.message === 'Token has expired') {
      message = 'Token has expired';
      errorCode = 'TOKEN_EXPIRED';
    }

    return res.status(401).json({
      success: false,
      message,
      error: errorCode
    });
  }
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      
      const userResult = await query(
        'SELECT id, email, username, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
        req.user = userResult.rows[0];
      }
    }

    if (typeof next === 'function') {
      next();
    }

  } catch (error) {
    // Silently fail for optional auth
    if (typeof next === 'function') {
      next();
    }
  }
}

/**
 * Role-based authorization middleware
 * @param {Array} allowedRoles - Array of allowed roles
 * @returns {Function} Middleware function
 */
function requireRole(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED'
        });
      }

      // Get user role from database
      const roleResult = await query(
        'SELECT role FROM users WHERE id = $1',
        [req.user.id]
      );

      if (roleResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }

      const userRole = roleResult.rows[0].role || 'user';

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          error: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      req.user.role = userRole;

      if (typeof next === 'function') {
        next();
      }

    } catch (error) {
      console.error('Authorization error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        error: 'AUTHORIZATION_ERROR'
      });
    }
  };
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole
};
