const { query, getClient } = require('../lib/db');
const { verifyPassword } = require('../utils/password');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const { validateInput, loginSchema, sanitizeEmail, checkRateLimit } = require('../utils/validation');
const { corsMiddleware, securityHeaders } = require('../middleware/cors');

/**
 * User login API endpoint
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function handler(req, res) {
  // Apply CORS and security headers
  corsMiddleware(req, res);
  securityHeaders(req, res);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'METHOD_NOT_ALLOWED'
    });
  }

  const client = await getClient();

  try {
    // Rate limiting
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const rateLimitResult = checkRateLimit(`login:${clientIP}`, 10, 15 * 60 * 1000); // 10 attempts per 15 minutes

    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      });
    }

    // Validate request body
    const validation = validateInput(req.body, loginSchema);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: validation.errors
      });
    }

    const { email, password, rememberMe } = validation.data;
    const sanitizedEmail = sanitizeEmail(email);

    // Start transaction
    await client.query('BEGIN');

    // Find user by email
    const userResult = await client.query(
      `SELECT id, email, password_hash, username, full_name, timezone, is_active, 
              failed_login_attempts, locked_until, created_at, updated_at
       FROM users WHERE email = $1`,
      [sanitizedEmail]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    const user = userResult.rows[0];

    // Check if account is active
    if (!user.is_active) {
      await client.query('ROLLBACK');
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
        error: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check if account is temporarily locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await client.query('ROLLBACK');
      const lockTimeRemaining = Math.ceil((new Date(user.locked_until) - new Date()) / 1000 / 60);
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed login attempts. Try again in ${lockTimeRemaining} minutes.`,
        error: 'ACCOUNT_LOCKED',
        lockTimeRemaining
      });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      let lockUntil = null;

      // Lock account after 5 failed attempts for 30 minutes
      if (failedAttempts >= 5) {
        lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }

      await client.query(
        'UPDATE users SET failed_login_attempts = $1, locked_until = $2, updated_at = NOW() WHERE id = $3',
        [failedAttempts, lockUntil, user.id]
      );

      // Log failed login attempt
      await client.query(
        'INSERT INTO user_activity_logs (user_id, action, ip_address, user_agent, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [user.id, 'failed_login', clientIP, req.headers['user-agent'] || 'unknown']
      );

      await client.query('COMMIT');

      let message = 'Invalid email or password';
      if (lockUntil) {
        message = 'Account has been temporarily locked due to multiple failed login attempts.';
      }

      return res.status(401).json({
        success: false,
        message,
        error: 'INVALID_CREDENTIALS',
        attemptsRemaining: Math.max(0, 5 - failedAttempts)
      });
    }

    // Reset failed login attempts on successful login
    await client.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW(), updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Get user preferences
    const preferencesResult = await client.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [user.id]
    );

    const preferences = preferencesResult.rows[0] || {};

    // Generate tokens
    const tokenExpiry = rememberMe ? '30d' : '24h';
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Clean up old sessions (keep only the 5 most recent)
    await client.query(
      `DELETE FROM user_sessions 
       WHERE user_id = $1 
       AND id NOT IN (
         SELECT id FROM user_sessions 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 5
       )`,
      [user.id]
    );

    // Store new refresh token
    const refreshTokenExpiry = rememberMe 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);  // 7 days

    await client.query(
      `INSERT INTO user_sessions (user_id, refresh_token, expires_at, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [user.id, refreshToken, refreshTokenExpiry, clientIP, req.headers['user-agent'] || 'unknown']
    );

    // Log successful login
    await client.query(
      'INSERT INTO user_activity_logs (user_id, action, ip_address, user_agent, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [user.id, 'login', clientIP, req.headers['user-agent'] || 'unknown']
    );

    await client.query('COMMIT');

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.full_name,
          timezone: user.timezone,
          createdAt: user.created_at,
          lastLogin: new Date().toISOString(),
          preferences: {
            theme: preferences.theme || 'light',
            notificationsEnabled: preferences.notifications_enabled !== false,
            pomodoroDuration: preferences.pomodoro_duration || 25,
            breakDuration: preferences.break_duration || 5
          }
        },
        token,
        refreshToken,
        expiresIn: tokenExpiry
      }
    });

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
      email: req.body?.email
    });

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
      error: 'INTERNAL_SERVER_ERROR'
    });

  } finally {
    // Release the client back to the pool
    client.release();
  }
}

module.exports = handler;
