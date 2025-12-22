// WhatsApp API integration module
// This module handles secure WhatsApp messaging through the WhatsApp Business API

interface WhatsAppMessage {
  to: string; // Phone number in E.164 format (e.g., +1234567890)
  message: string;
  type?: 'text' | 'template';
  templateName?: string;
  templateParams?: string[];
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends a WhatsApp message using the configured API
 * @param message - WhatsApp message details
 * @returns Promise with the API response
 */
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
  const apiKey = Deno.env.get('WHATSAPP_API_KEY');
  
  if (!apiKey) {
    console.error('WhatsApp API key not configured');
    return {
      success: false,
      error: 'WhatsApp API is not configured. Please contact your administrator.',
    };
  }

  try {
    // Format phone number (remove spaces, dashes, etc.)
    const formattedPhone = message.to.replace(/[^\d+]/g, '');
    
    if (!formattedPhone.startsWith('+')) {
      return {
        success: false,
        error: 'Phone number must be in international format (e.g., +1234567890)',
      };
    }

    console.log('📱 Sending WhatsApp message to:', formattedPhone);

    // Example integration with WhatsApp Business API (Twilio)
    // You can modify this based on your WhatsApp API provider (Twilio, MessageBird, etc.)
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`YOUR_ACCOUNT_SID:${apiKey}`)}`,
      },
      body: new URLSearchParams({
        From: 'whatsapp:+14155238886', // Your Twilio WhatsApp number
        To: `whatsapp:${formattedPhone}`,
        Body: message.message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', data);
      return {
        success: false,
        error: data.message || 'Failed to send WhatsApp message',
      };
    }

    console.log('✅ WhatsApp message sent successfully:', data.sid);

    return {
      success: true,
      messageId: data.sid,
    };
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return {
      success: false,
      error: `Failed to send WhatsApp message: ${error.message}`,
    };
  }
}

/**
 * Validates a phone number format for WhatsApp
 * @param phone - Phone number to validate
 * @returns boolean indicating if the number is valid
 */
export function isValidWhatsAppNumber(phone: string): boolean {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Must start with + and have at least 10 digits
  return /^\+\d{10,15}$/.test(cleaned);
}

/**
 * Formats a phone number for WhatsApp (adds + if missing, removes spaces)
 * @param phone - Phone number to format
 * @returns Formatted phone number
 */
export function formatWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Sends a bulk WhatsApp message to multiple recipients
 * @param messages - Array of WhatsApp messages
 * @returns Promise with array of responses
 */
export async function sendBulkWhatsAppMessages(messages: WhatsAppMessage[]): Promise<WhatsAppResponse[]> {
  const results: WhatsAppResponse[] = [];
  
  for (const message of messages) {
    const result = await sendWhatsAppMessage(message);
    results.push(result);
    
    // Add a small delay between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

/**
 * Sends a template-based WhatsApp message
 * @param to - Recipient phone number
 * @param templateName - Template name configured in WhatsApp Business
 * @param params - Template parameters
 * @returns Promise with the API response
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  params: string[]
): Promise<WhatsAppResponse> {
  return sendWhatsAppMessage({
    to,
    message: '', // Message content comes from template
    type: 'template',
    templateName,
    templateParams: params,
  });
}
