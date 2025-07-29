# Neon Database Access Implementation

## Overview
All Netlify Functions now use a centralized database access pattern through `netlify/functions/db-utils.js`. This provides consistent connection pooling, error handling, and response formatting across the entire backend.

## Database Utilities (`db-utils.js`)

### Connection Pool Configuration
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,                    // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,   // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
});
```

### Available Functions

#### Database Operations
- `query(text, params)` - Execute a SQL query with parameters
- `transaction(callback)` - Execute multiple queries in a transaction
- `getPool()` - Get the connection pool instance (for advanced use)

#### Validation
- `validateRequiredFields(data, requiredFields)` - Validate required fields in request data

#### Response Helpers
- `createSuccessResponse(data, message)` - Create standardized success response
- `createErrorResponse(statusCode, message)` - Create standardized error response
- `handleOptions()` - Handle CORS preflight requests

## Usage Examples

### Basic Query
```javascript
const { query, createSuccessResponse, createErrorResponse } = require('./db-utils');

// Get user by ID
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
if (result.rows.length === 0) {
  return createErrorResponse(404, 'User not found');
}
return createSuccessResponse({ user: result.rows[0] }, 'User retrieved successfully');
```

### Transaction Example
```javascript
const { transaction, createSuccessResponse } = require('./db-utils');

const result = await transaction(async (client) => {
  // Create user
  const userResult = await client.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
    [email, hashedPassword]
  );
  
  // Create user profile
  const profileResult = await client.query(
    'INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2) RETURNING *',
    [userResult.rows[0].id, displayName]
  );
  
  return { user: userResult.rows[0], profile: profileResult.rows[0] };
});

return createSuccessResponse(result, 'User created successfully');
```

### Complete Function Template
```javascript
const jwt = require('jsonwebtoken');
const { 
  query, 
  transaction,
  createErrorResponse, 
  createSuccessResponse, 
  handleOptions, 
  validateRequiredFields 
} = require('./db-utils');

// Helper function to verify JWT token
const verifyToken = (token) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    // Authentication
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse(401, 'Authorization token required');
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    if (event.httpMethod === 'GET') {
      const result = await query('SELECT * FROM table WHERE user_id = $1', [userId]);
      return createSuccessResponse({ data: result.rows }, 'Data retrieved successfully');
    }

    if (event.httpMethod === 'POST') {
      const { field1, field2 } = JSON.parse(event.body);
      validateRequiredFields({ field1, field2 }, ['field1', 'field2']);
      
      const result = await query(
        'INSERT INTO table (user_id, field1, field2) VALUES ($1, $2, $3) RETURNING *',
        [userId, field1, field2]
      );
      
      return createSuccessResponse({ data: result.rows[0] }, 'Data created successfully');
    }

    return createErrorResponse(405, 'Method Not Allowed');

  } catch (error) {
    console.error('Function error:', error);
    
    if (error.message === 'Invalid token') {
      return createErrorResponse(401, 'Invalid authorization token');
    }
    
    if (error.message.includes('Missing required fields')) {
      return createErrorResponse(400, error.message);
    }
    
    return createErrorResponse(500, 'Server error: ' + error.message);
  }
};
```

## Updated Functions

All the following functions have been converted to use the centralized database utilities:

### Authentication Functions
- ✅ `auth-register.js` - User registration with database storage
- ✅ `auth-login.js` - User authentication and JWT generation

### User Management
- ✅ `user-profile.js` - User profile management (GET/PUT operations)

### Task Management
- ✅ `tasks.js` - Complete CRUD operations for user tasks

### AI Integration
- ✅ `openai-proxy.js` - Centralized OpenAI proxy with database logging
- ✅ `ai-interactions.js` - AI interaction storage and retrieval

### Session Management
- ✅ `focus-sessions.js` - Focus session CRUD with statistics

## Benefits

### 1. Connection Pooling
- Efficient database connection management
- Configurable pool size and timeouts
- Automatic connection cleanup

### 2. Consistent Error Handling
- Standardized error responses across all functions
- Proper HTTP status codes
- Detailed error logging

### 3. CORS Management
- Centralized CORS header handling
- Consistent preflight request support

### 4. Response Standardization
- Uniform response format: `{ success: boolean, data?: any, message: string }`
- Consistent status codes and headers

### 5. Input Validation
- Built-in required field validation
- Clear error messages for missing data

### 6. Transaction Support
- Safe multi-query operations
- Automatic rollback on errors
- Connection management within transactions

## Environment Variables Required

```env
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-jwt-secret-key
```

## Testing the Implementation

1. **Connection Test**: Use the `health.js` function to verify database connectivity
2. **Authentication Flow**: Test registration → login → protected endpoints
3. **CRUD Operations**: Test all HTTP methods on each endpoint
4. **Error Handling**: Test with invalid tokens, missing fields, etc.
5. **Transaction Integrity**: Test operations that modify multiple tables

This centralized approach ensures scalable, maintainable, and consistent database operations across the entire FocusMate AI backend.
