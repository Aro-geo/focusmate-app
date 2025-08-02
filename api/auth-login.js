const { supabase } = require('../lib/db');
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

    // Find user by email
    const { data: users, error: userError } = await supabase
      .from('users')
      .select(`
        id, email, password_hash, username, full_name, timezone, is_active, 
        failed_login_attempts, locked_until, created_at, updated_at
      `)
      .eq('email', sanitizedEmail)
      .limit(1);

    if (userError) {
      console.error('Error finding user:', userError);
      return res.status(500).json({
        success: false,
        message: 'Database error occurred',
        error: 'DATABASE_ERROR'
      });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    const user = users[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
        error: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check if account is temporarily locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
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
        lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
      }

      await supabase
        .from('users')
        .update({
          failed_login_attempts: failedAttempts,
          locked_until: lockUntil,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      // Log failed login attempt
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action: 'failed_login',
          ip_address: clientIP,
          user_agent: req.headers['user-agent'] || 'unknown'
        });

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
    await supabase
      .from('users')
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    // Get user preferences
    const { data: preferencesData, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (preferencesError) {
      console.error('Error fetching preferences:', preferencesError);
    }

    const preferences = preferencesData?.[0] || {};

    // Generate tokens
    const tokenExpiry = rememberMe ? '30d' : '24h';
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Clean up old sessions (keep only the 5 most recent)
    const { data: oldSessions } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (oldSessions && oldSessions.length > 0) {
      const keepIds = oldSessions.map(s => s.id);
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id)
        .not('id', 'in', `(${keepIds.join(',')})`);
    }

    // Store new refresh token
    const refreshTokenExpiry = rememberMe 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();  // 7 days

    await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        refresh_token: refreshToken,
        expires_at: refreshTokenExpiry,
        ip_address: clientIP,
        user_agent: req.headers['user-agent'] || 'unknown'
      });

    // Log successful login
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        action: 'login',
        ip_address: clientIP,
        user_agent: req.headers['user-agent'] || 'unknown'
      });

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
  }
}

module.exports = handler;
module.exports.default = handler;
