// src/services/AuthService.js
class AuthService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || '';
    this.token = localStorage.getItem('authToken');
  }

  /**
   * Set authentication token
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  /**
   * Get authentication token
   * @returns {string|null} JWT token
   */
  getToken() {
    return this.token || localStorage.getItem('authToken');
  }

  /**
   * Remove authentication token
   */
  removeToken() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * Get authorization headers
   * @returns {Object} Headers object
   */
  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  /**
   * Make authenticated API request
   * @param {string} url - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} API response
   */
  async apiRequest(url, options = {}) {
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(`${this.baseURL}${url}`, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401 && data.error === 'TOKEN_EXPIRED') {
          await this.refreshToken();
          // Retry the request with new token
          return this.apiRequest(url, options);
        }
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * User signup
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Signup response
   */
  async signup(userData) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Store tokens and user data
      this.setToken(data.data.token);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  /**
   * User login
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} Login response
   */
  async login(credentials) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store tokens and user data
      this.setToken(data.data.token);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * User logout
   */
  async logout() {
    try {
      // Optional: Call logout endpoint to invalidate server-side session
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await fetch(`${this.baseURL}/api/auth-logout`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ refreshToken })
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      this.removeToken();
    }
  }

  /**
   * Refresh authentication token
   * @returns {Promise<Object>} Refresh response
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.baseURL}/api/auth-refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      // Update tokens
      this.setToken(data.data.token);
      localStorage.setItem('refreshToken', data.data.refreshToken);

      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.removeToken(); // Clear invalid tokens
      throw error;
    }
  }

  /**
   * Get current user
   * @returns {Object|null} User object
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Get user profile
   * @returns {Promise<Object>} User profile
   */
  async getProfile() {
    return this.apiRequest('/api/user/profile');
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile update data
   * @returns {Promise<Object>} Update response
   */
  async updateProfile(profileData) {
    return this.apiRequest('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }
}

// Export singleton instance
export default new AuthService();
