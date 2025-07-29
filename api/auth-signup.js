const { query, getClient } = require('../lib/db');
const { hashPassword } = require('../utils/password');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const { validateInput, signupSchema, sanitizeEmail, isEmailDomainAllowed, checkRateLimit } = require('../utils/validation');
const { corsMiddleware, securityHeaders } = require('../middleware/cors');

/**
 * User signup API endpoint
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
    const rateLimitResult = checkRateLimit(`signup:${clientIP}`, 5, 15 * 60 * 1000); // 5 attempts per 15 minutes

    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Too many signup attempts. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      });
    }

    // Validate request body
    const validation = validateInput(req.body, signupSchema);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: validation.errors
      });
    }

    const { email, password, username, fullName, timezone, agreeToTerms } = validation.data;
    const sanitizedEmail = sanitizeEmail(email);

    // Check if email domain is allowed
    if (!isEmailDomainAllowed(sanitizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Email domain is not allowed',
        error: 'INVALID_EMAIL_DOMAIN'
      });
    }

    // Start transaction
    await client.query('BEGIN');

    // Check if user already exists
    const existingUserResult = await client.query(
      'SELECT id, email, is_active FROM users WHERE email = $1',
      [sanitizedEmail]
    );

    if (existingUserResult.rows.length > 0) {
      const existingUser = existingUserResult.rows[0];
      
      if (existingUser.is_active) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists',
          error: 'EMAIL_ALREADY_EXISTS'
        });
      } else {
        // Reactivate deactivated account
        const hashedPassword = await hashPassword(password);
        
        await client.query(
          `UPDATE users 
           SET password_hash = $1, username = $2, full_name = $3, timezone = $4, 
               is_active = true, updated_at = NOW() 
           WHERE id = $5`,
          [hashedPassword, username, fullName, timezone, existingUser.id]
        );

        const updatedUserResult = await client.query(
          'SELECT id, email, username, full_name, timezone, created_at FROM users WHERE id = $1',
          [existingUser.id]
        );

        const user = updatedUserResult.rows[0];
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        // Store refresh token
        await client.query(
          'INSERT INTO user_sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)',
          [user.id, refreshToken, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] // 30 days
        );

        await client.query('COMMIT');

        return res.status(200).json({
          success: true,
          message: 'Account reactivated successfully',
          data: {
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              fullName: user.full_name,
              timezone: user.timezone,
              createdAt: user.created_at
            },
            token,
            refreshToken
          }
        });
      }
    }

    // Check if username is already taken (if provided)
    if (username) {
      const existingUsernameResult = await client.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (existingUsernameResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: 'Username is already taken',
          error: 'USERNAME_ALREADY_EXISTS'
        });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const insertUserResult = await client.query(
      `INSERT INTO users (email, password_hash, username, full_name, timezone, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       RETURNING id, email, username, full_name, timezone, created_at`,
      [sanitizedEmail, hashedPassword, username, fullName, timezone]
    );

    const newUser = insertUserResult.rows[0];

    // Create default user preferences
    await client.query(
      `INSERT INTO user_preferences (user_id, theme, notifications_enabled, pomodoro_duration, break_duration)
       VALUES ($1, 'light', true, 25, 5)`,
      [newUser.id]
    );

    // Generate tokens
    const token = generateToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // Store refresh token
    await client.query(
      'INSERT INTO user_sessions (user_id, refresh_token, expires_at, created_at) VALUES ($1, $2, $3, NOW())',
      [newUser.id, refreshToken, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
    );

    // Log signup event
    await client.query(
      'INSERT INTO user_activity_logs (user_id, action, ip_address, user_agent, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [newUser.id, 'signup', clientIP, req.headers['user-agent'] || 'unknown']
    );

    await client.query('COMMIT');

    // Return success response (don't include sensitive data)
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          fullName: newUser.full_name,
          timezone: newUser.timezone,
          createdAt: newUser.created_at
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    
    console.error('Signup error:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });

    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'Email or username already exists',
        error: 'DUPLICATE_ENTRY'
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'An error occurred during signup',
      error: 'INTERNAL_SERVER_ERROR'
    });

  } finally {
    // Release the client back to the pool
    client.release();
  }
}

module.exports = handler;
