const Joi = require('joi');

/**
 * Email validation schema
 */
const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .min(5)
  .max(254)
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.min': 'Email must be at least 5 characters long',
    'string.max': 'Email must be less than 254 characters long',
    'any.required': 'Email is required'
  });

/**
 * Password validation schema
 */
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]).{8,}$'))
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must be less than 128 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required'
  });

/**
 * Username validation schema
 */
const usernameSchema = Joi.string()
  .alphanum()
  .min(3)
  .max(30)
  .optional()
  .messages({
    'string.alphanum': 'Username must only contain letters and numbers',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username must be less than 30 characters long'
  });

/**
 * Full name validation schema
 */
const fullNameSchema = Joi.string()
  .min(2)
  .max(100)
  .pattern(new RegExp('^[a-zA-Z\\s\\-\']+$'))
  .optional()
  .messages({
    'string.min': 'Full name must be at least 2 characters long',
    'string.max': 'Full name must be less than 100 characters long',
    'string.pattern.base': 'Full name can only contain letters, spaces, hyphens, and apostrophes'
  });

/**
 * Signup validation schema
 */
const signupSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
  fullName: fullNameSchema,
  timezone: Joi.string().optional(),
  agreeToTerms: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must agree to the terms and conditions'
  })
});

/**
 * Login validation schema
 */
const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  }),
  rememberMe: Joi.boolean().optional()
});

/**
 * User update validation schema
 */
const updateUserSchema = Joi.object({
  username: usernameSchema,
  fullName: fullNameSchema,
  timezone: Joi.string().optional(),
  bio: Joi.string().max(500).optional(),
  preferences: Joi.object().optional()
});

/**
 * Password reset validation schema
 */
const passwordResetSchema = Joi.object({
  email: emailSchema
});

/**
 * Change password validation schema
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: passwordSchema
});

/**
 * Validate request body against schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Joi validation schema
 * @returns {Object} Validation result
 */
function validateInput(data, schema) {
  const { error, value } = schema.validate(data, {
    abortEarly: false, // Return all errors, not just the first one
    stripUnknown: true, // Remove unknown fields
    convert: true // Convert strings to appropriate types
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type
    }));

    return {
      isValid: false,
      errors,
      data: null
    };
  }

  return {
    isValid: true,
    errors: [],
    data: value
  };
}

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().trim();
}

/**
 * Check if email domain is allowed
 * @param {string} email - Email to check
 * @returns {boolean} Domain allowed status
 */
function isEmailDomainAllowed(email) {
  const blockedDomains = [
    '10minutemail.com',
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return !blockedDomains.includes(domain);
}

/**
 * Rate limiting validation
 * @param {string} identifier - IP or user identifier
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} Rate limit status
 */
const rateLimitStore = new Map();

function checkRateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / windowMs)}`;
  
  const attempts = rateLimitStore.get(key) || 0;
  
  if (attempts >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: Math.ceil(now / windowMs) * windowMs
    };
  }
  
  rateLimitStore.set(key, attempts + 1);
  
  // Clean up old entries
  if (rateLimitStore.size > 1000) {
    const cutoff = Math.floor((now - windowMs) / windowMs);
    for (const [storedKey] of rateLimitStore) {
      const keyTime = parseInt(storedKey.split(':')[1]);
      if (keyTime < cutoff) {
        rateLimitStore.delete(storedKey);
      }
    }
  }
  
  return {
    allowed: true,
    remaining: maxAttempts - attempts - 1,
    resetTime: Math.ceil(now / windowMs) * windowMs
  };
}

module.exports = {
  validateInput,
  signupSchema,
  loginSchema,
  updateUserSchema,
  passwordResetSchema,
  changePasswordSchema,
  sanitizeEmail,
  isEmailDomainAllowed,
  checkRateLimit
};
