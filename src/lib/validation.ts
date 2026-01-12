import { VALIDATION } from './constants';

/**
 * Validation utilities for form inputs
 * Provides consistent validation logic across the application
 */

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return VALIDATION.EMAIL_REGEX.test(email.trim());
}

/**
 * Validates password strength
 */
export function isValidPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password) {
    return { isValid: false, errors: ['Password is required'] };
  }

  if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates phone number format
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  return VALIDATION.PHONE_REGEX.test(phone.trim());
}

/**
 * Validates URL format
 */
export function isValidURL(url: string): boolean {
  if (!url) return false;
  return VALIDATION.URL_REGEX.test(url.trim());
}

/**
 * Validates file size
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= VALIDATION.MAX_FILE_SIZE;
}

/**
 * Validates required field
 */
export function isRequired(value: any): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
}

/**
 * Validates number range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validates string length
 */
export function isLengthValid(value: string, min: number, max?: number): boolean {
  const length = value.trim().length;
  if (max !== undefined) {
    return length >= min && length <= max;
  }
  return length >= min;
}

/**
 * Generic form validation function
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: {
    [K in keyof T]?: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      custom?: (value: T[K]) => string | null;
    };
  }
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};

  for (const field in rules) {
    const value = data[field];
    const fieldRules = rules[field];

    if (!fieldRules) continue;

    // Required check
    if (fieldRules.required && !isRequired(value)) {
      errors[field] = `${String(field)} is required`;
      continue;
    }

    // Skip other validations if field is empty and not required
    if (!isRequired(value)) continue;

    // Length validation
    if (typeof value === 'string') {
      if (fieldRules.minLength && value.trim().length < fieldRules.minLength) {
        errors[field] = `${String(field)} must be at least ${fieldRules.minLength} characters`;
        continue;
      }

      if (fieldRules.maxLength && value.trim().length > fieldRules.maxLength) {
        errors[field] = `${String(field)} must be at most ${fieldRules.maxLength} characters`;
        continue;
      }
    }

    // Pattern validation
    if (fieldRules.pattern && typeof value === 'string' && !fieldRules.pattern.test(value)) {
      errors[field] = `${String(field)} format is invalid`;
      continue;
    }

    // Custom validation
    if (fieldRules.custom) {
      const customError = fieldRules.custom(value);
      if (customError) {
        errors[field] = customError;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
