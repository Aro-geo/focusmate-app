const { supabase } = require('../lib/db');
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

    // Check if user already exists
    const { data: existingUsers, error: existingError } = await supabase
      .from('users')
      .select('id, email, is_active')
      .eq('email', sanitizedEmail)
      .limit(1);

    if (existingError) {
      console.error('Error checking existing user:', existingError);
      return res.status(500).json({
        success: false,
        message: 'Database error occurred',
        error: 'DATABASE_ERROR'
      });
    }

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      
      if (existingUser.is_active) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists',
          error: 'EMAIL_ALREADY_EXISTS'
        });
      } else {
        // Reactivate deactivated account
        const hashedPassword = await hashPassword(password);
        
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            password_hash: hashedPassword,
            username: username,
            full_name: fullName,
            timezone: timezone,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)
          .select('id, email, username, full_name, timezone, created_at')
          .single();

        if (updateError) {
          console.error('Error updating user:', updateError);
          return res.status(500).json({
            success: false,
            message: 'Failed to reactivate account',
            error: 'UPDATE_ERROR'
          });
        }

        // Generate tokens
        const token = generateToken(updatedUser);
        const refreshToken = generateRefreshToken(updatedUser);

        // Store refresh token
        await supabase
          .from('user_sessions')
          .insert({
            user_id: updatedUser.id,
            refresh_token: refreshToken,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });

        // Log signup event
        await supabase
          .from('user_activity_logs')
          .insert({
            user_id: updatedUser.id,
            action: 'signup',
            ip_address: clientIP,
            user_agent: req.headers['user-agent'] || 'unknown'
          });

        return res.status(200).json({
          success: true,
          message: 'Account reactivated successfully',
          data: {
            user: {
              id: updatedUser.id,
              email: updatedUser.email,
              username: updatedUser.username,
              fullName: updatedUser.full_name,
              timezone: updatedUser.timezone,
              createdAt: updatedUser.created_at
            },
            token,
            refreshToken
          }
        });
      }
    }

    // Check if username is already taken (if provided)
    if (username) {
      const { data: existingUsernames, error: usernameError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .limit(1);

      if (usernameError) {
        console.error('Error checking username:', usernameError);
        return res.status(500).json({
          success: false,
          message: 'Database error occurred',
          error: 'DATABASE_ERROR'
        });
      }

      if (existingUsernames && existingUsernames.length > 0) {
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
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: sanitizedEmail,
        password_hash: hashedPassword,
        username: username,
        full_name: fullName,
        timezone: timezone,
        is_active: true
      })
      .select('id, email, username, full_name, timezone, created_at')
      .single();

    if (insertError) {
      console.error('Error creating user:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create account',
        error: 'INSERT_ERROR'
      });
    }

    // Create default user preferences
    await supabase
      .from('user_preferences')
      .insert({
        user_id: newUser.id,
        theme: 'light',
        notifications_enabled: true,
        pomodoro_duration: 25,
        break_duration: 5
      });

    // Generate tokens
    const token = generateToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // Store refresh token
    await supabase
      .from('user_sessions')
      .insert({
        user_id: newUser.id,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    // Log signup event
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: newUser.id,
        action: 'signup',
        ip_address: clientIP,
        user_agent: req.headers['user-agent'] || 'unknown'
      });

    // Return success response
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
    console.error('Signup error:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'An error occurred during signup',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}

module.exports = handler;
module.exports.default = handler;
