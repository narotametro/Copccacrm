/**
 * Password Validator - Enforces strong password requirements
 * Prevents weak passwords and guides users to create secure ones
 */

export interface PasswordValidationResult {
  isValid: boolean;
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  score: number; // 0-100
  errors: string[];
  suggestions: string[];
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minSpecialChars: number;
  preventCommonPasswords: boolean;
  preventUserInfo: boolean;
}

// Default requirements
const DEFAULT_REQUIREMENTS: PasswordRequirements = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minSpecialChars: 1,
  preventCommonPasswords: true,
  preventUserInfo: true,
};

// Common weak passwords to reject
const COMMON_PASSWORDS = [
  'password',
  'password123',
  '123456',
  '12345678',
  'qwerty',
  'abc123',
  'monkey',
  '1234567',
  'letmein',
  'trustno1',
  'dragon',
  'baseball',
  '111111',
  'iloveyou',
  'master',
  'sunshine',
  'ashley',
  'bailey',
  'shadow',
  '123123',
  '654321',
  'superman',
  'qazwsx',
  'michael',
  'football',
  'welcome',
  'jesus',
  'ninja',
  'mustang',
  'password1',
  'admin',
  'administrator',
  'root',
  'toor',
];

/**
 * Validate password against requirements
 */
export function validatePassword(
  password: string,
  userInfo?: { email?: string; name?: string; company?: string },
  requirements: Partial<PasswordRequirements> = {}
): PasswordValidationResult {
  const reqs = { ...DEFAULT_REQUIREMENTS, ...requirements };
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Check length
  if (password.length < reqs.minLength) {
    errors.push(`Password must be at least ${reqs.minLength} characters long`);
  } else {
    score += 20;
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 10;
  }

  // Check uppercase
  if (reqs.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 15;
  }

  // Check lowercase
  if (reqs.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 15;
  }

  // Check numbers
  if (reqs.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/\d/.test(password)) {
    score += 15;
  }

  // Check special characters
  const specialChars = password.match(/[^A-Za-z0-9]/g);
  const specialCharCount = specialChars?.length || 0;

  if (reqs.requireSpecialChars && specialCharCount < reqs.minSpecialChars) {
    errors.push(
      `Password must contain at least ${reqs.minSpecialChars} special character(s) (!@#$%^&*)`
    );
  } else if (specialCharCount > 0) {
    score += 15;
    if (specialCharCount >= 2) score += 5;
  }

  // Check for common passwords
  if (reqs.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.some((common) => lowerPassword.includes(common))) {
      errors.push('Password is too common or easily guessable');
      score = Math.min(score, 30);
    }
  }

  // Check for user information
  if (reqs.preventUserInfo && userInfo) {
    const lowerPassword = password.toLowerCase();
    const checks = [
      { value: userInfo.email?.split('@')[0], name: 'email' },
      { value: userInfo.name, name: 'name' },
      { value: userInfo.company, name: 'company name' },
    ];

    for (const check of checks) {
      if (check.value && lowerPassword.includes(check.value.toLowerCase())) {
        errors.push(`Password should not contain your ${check.name}`);
        score = Math.min(score, 40);
      }
    }
  }

  // Check for sequential patterns
  if (/012|123|234|345|456|567|678|789|890/.test(password)) {
    suggestions.push('Avoid sequential numbers in your password');
    score -= 10;
  }

  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
    suggestions.push('Avoid sequential letters in your password');
    score -= 10;
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    suggestions.push('Avoid repeating the same character multiple times');
    score -= 5;
  }

  // Bonus for variety
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const varietyCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  if (varietyCount === 4) {
    score += 10; // All character types used
  }

  // Entropy bonus (more unique characters = higher entropy)
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.7) {
    score += 10; // High character diversity
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine strength
  let strength: PasswordValidationResult['strength'];
  if (score >= 90) strength = 'very-strong';
  else if (score >= 70) strength = 'strong';
  else if (score >= 50) strength = 'good';
  else if (score >= 30) strength = 'fair';
  else strength = 'weak';

  // Add helpful suggestions
  if (errors.length === 0 && score < 90) {
    if (password.length < 16) {
      suggestions.push('Consider using a longer password for extra security');
    }
    if (specialCharCount < 2) {
      suggestions.push('Adding more special characters increases security');
    }
    if (uniqueChars < password.length * 0.7) {
      suggestions.push('Use more varied characters throughout the password');
    }
  }

  return {
    isValid: errors.length === 0,
    strength,
    score,
    errors,
    suggestions,
  };
}

/**
 * Generate a strong random password
 */
export function generateStrongPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = uppercase + lowercase + numbers + special;

  let password = '';

  // Ensure at least one of each required type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password to avoid predictable patterns
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Check if password has been compromised (client-side check only)
 * For production, integrate with Have I Been Pwned API
 */
export async function checkPasswordCompromised(password: string): Promise<boolean> {
  // This is a placeholder for HIBP integration
  // In production, use k-anonymity model with HIBP API
  // https://haveibeenpwned.com/API/v3#PwnedPasswords

  // For now, just check against common passwords
  return COMMON_PASSWORDS.includes(password.toLowerCase());
}

/**
 * Get password strength color for UI
 */
export function getStrengthColor(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'very-strong':
      return 'text-green-600 bg-green-100';
    case 'strong':
      return 'text-green-500 bg-green-50';
    case 'good':
      return 'text-blue-500 bg-blue-50';
    case 'fair':
      return 'text-yellow-500 bg-yellow-50';
    case 'weak':
      return 'text-red-500 bg-red-50';
  }
}

/**
 * Get password strength label
 */
export function getStrengthLabel(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'very-strong':
      return 'Very Strong';
    case 'strong':
      return 'Strong';
    case 'good':
      return 'Good';
    case 'fair':
      return 'Fair';
    case 'weak':
      return 'Weak';
  }
}
