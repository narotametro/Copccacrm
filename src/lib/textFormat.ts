/**
 * Text formatting utilities for consistent display across the application
 */

/**
 * Converts text to Title Case (e.g., "hello world" -> "Hello World")
 */
export const toTitleCase = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formats user/company names consistently
 */
export const formatName = (name: string): string => {
  if (!name) return '';
  return toTitleCase(name.trim());
};

/**
 * Formats role/status consistently
 */
export const formatRole = (role: string): string => {
  if (!role) return '';
  return toTitleCase(role.replace(/_/g, ' ').replace(/-/g, ' '));
};

/**
 * Formats email consistently (lowercase)
 */
export const formatEmail = (email: string): string => {
  if (!email) return '';
  return email.toLowerCase().trim();
};
