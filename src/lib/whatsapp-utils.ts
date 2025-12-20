/**
 * WhatsApp Utilities
 * Helper functions for opening WhatsApp on desktop and mobile
 */

/**
 * Detects if the user is on a desktop device
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  return !isMobile;
}

/**
 * Opens WhatsApp with a pre-filled message
 * - On desktop: Opens WhatsApp Web (web.whatsapp.com)
 * - On mobile: Opens WhatsApp app (wa.me)
 * 
 * @param phoneNumber - Phone number in international format (with or without +)
 * @param message - Pre-filled message (optional)
 */
export function openWhatsApp(phoneNumber: string, message?: string): void {
  // Clean phone number (remove all non-numeric characters except +)
  const cleanedNumber = phoneNumber.replace(/[^0-9+]/g, '');
  
  // Remove + for URL
  const numberForUrl = cleanedNumber.replace(/\+/g, '');
  
  // Encode message if provided
  const encodedMessage = message ? encodeURIComponent(message) : '';
  
  // Build URL based on device type
  let url: string;
  
  if (isDesktop()) {
    // Desktop: Use WhatsApp Web
    url = `https://web.whatsapp.com/send?phone=${numberForUrl}`;
    if (encodedMessage) {
      url += `&text=${encodedMessage}`;
    }
  } else {
    // Mobile: Use WhatsApp app deep link
    url = `https://wa.me/${numberForUrl}`;
    if (encodedMessage) {
      url += `?text=${encodedMessage}`;
    }
  }
  
  // Open in new window/tab
  window.open(url, '_blank');
}

/**
 * Validates if a phone number is in a valid format for WhatsApp
 * @param phoneNumber - Phone number to validate
 * @returns boolean indicating if valid
 */
export function isValidWhatsAppNumber(phoneNumber: string): boolean {
  if (!phoneNumber) return false;
  
  // Remove all non-numeric characters except +
  const cleaned = phoneNumber.replace(/[^0-9+]/g, '');
  
  // Should have + and at least 10 digits (international format)
  return /^\+?\d{10,15}$/.test(cleaned);
}

/**
 * Formats a phone number for display
 * @param phoneNumber - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  const cleaned = phoneNumber.replace(/[^0-9+]/g, '');
  
  // If it doesn't start with +, add it
  if (!cleaned.startsWith('+')) {
    return '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Gets a user-friendly device type message
 */
export function getWhatsAppStatusMessage(): string {
  return isDesktop() 
    ? 'Opening WhatsApp Web...' 
    : 'Opening WhatsApp...';
}

/**
 * Creates a pre-filled WhatsApp message for debt collection
 */
export function createDebtReminderMessage(customerName: string, amount: number, daysOverdue: number, currencySymbol: string): string {
  return `Hello ${customerName}, this is a reminder regarding your payment of ${currencySymbol}${amount.toLocaleString()} which is ${daysOverdue} days overdue. Please contact us to arrange payment.`;
}