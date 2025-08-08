// Security utilities for input sanitization and validation
export class SecurityUtils {
  /**
   * Sanitize user input for logging to prevent log injection
   */
  static sanitizeForLog(input: any): string {
    if (typeof input !== 'string') {
      input = String(input);
    }
    
    // Remove or encode dangerous characters
    return input
      .replace(/\r\n/g, '\\r\\n')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/[\x00-\x1f\x7f-\x9f]/g, ''); // Remove control characters
  }

  /**
   * Validate and sanitize task input
   */
  static validateTaskInput(input: string): { isValid: boolean; sanitized: string } {
    if (!input || typeof input !== 'string') {
      return { isValid: false, sanitized: '' };
    }

    // Basic validation
    if (input.length > 500) {
      return { isValid: false, sanitized: '' };
    }

    // Sanitize HTML and dangerous characters
    const sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();

    return { isValid: sanitized.length > 0, sanitized };
  }

  /**
   * Generate CSRF token
   */
  static generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}