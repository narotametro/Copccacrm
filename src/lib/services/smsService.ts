/**
 * SMS Service - Automated SMS Reminders for Debt Collection
 * Supports Twilio for SMS delivery
 * 
 * Setup Instructions:
 * 1. Create a Twilio account at https://www.twilio.com
 * 2. Get your Account SID, Auth Token, and Phone Number
 * 3. Add these to system_settings table:
 *    - twilio_account_sid
 *    - twilio_auth_token
 *    - twilio_phone_number
 */

import { supabase } from '../supabase';

export interface SMSMessage {
  to: string;
  body: string;
  debtId?: string;
  invoiceNumber?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  to: string;
  provider: 'twilio' | 'demo';
}

export interface SMSConfig {
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  enabled: boolean;
  language: 'en' | 'sw';
  reminderIntervalDays: number; // Days between automatic reminders
}

/**
 * Load SMS configuration from database
 */
export async function loadSMSConfig(): Promise<SMSConfig> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', [
        'twilio_account_sid', 
        'twilio_auth_token', 
        'twilio_phone_number', 
        'sms_enabled',
        'sms_language',
        'sms_reminder_interval_days'
      ]);

    if (error) {
      console.error('Failed to load SMS config:', error);
      return { 
        enabled: false, 
        language: 'en',
        reminderIntervalDays: 7 
      };
    }

    const config: SMSConfig = { 
      enabled: false,
      language: 'en',
      reminderIntervalDays: 7
    };
    
    data?.forEach(setting => {
      switch (setting.key) {
        case 'twilio_account_sid':
          config.twilioAccountSid = setting.value;
          break;
        case 'twilio_auth_token':
          config.twilioAuthToken = setting.value;
          break;
        case 'twilio_phone_number':
          config.twilioPhoneNumber = setting.value;
          break;
        case 'sms_enabled':
          config.enabled = setting.value === 'true';
          break;
        case 'sms_language':
          config.language = (setting.value === 'sw' ? 'sw' : 'en') as 'en' | 'sw';
          break;
        case 'sms_reminder_interval_days':
          config.reminderIntervalDays = parseInt(setting.value) || 7;
          break;
      }
    });

    // SMS is enabled only if all Twilio credentials are present
    if (config.twilioAccountSid && config.twilioAuthToken && config.twilioPhoneNumber) {
      config.enabled = true;
    }

    return config;
  } catch (error) {
    console.error('Error loading SMS config:', error);
    return { 
      enabled: false,
      language: 'en',
      reminderIntervalDays: 7
    };
  }
}

/**
 * Send SMS via Twilio
 */
async function sendViaTwilio(
  to: string,
  body: string,
  config: SMSConfig
): Promise<SMSResult> {
  try {
    if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
      return {
        success: false,
        error: 'Twilio credentials not configured',
        to,
        provider: 'twilio'
      };
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(to)) {
      return {
        success: false,
        error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)',
        to,
        provider: 'twilio'
      };
    }

    // Call Twilio API
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`;
    const auth = btoa(`${config.twilioAccountSid}:${config.twilioAuthToken}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      body: new URLSearchParams({
        To: to,
        From: config.twilioPhoneNumber,
        Body: body
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || 'Failed to send SMS',
        to,
        provider: 'twilio'
      };
    }

    return {
      success: true,
      messageId: result.sid,
      to,
      provider: 'twilio'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
      to,
      provider: 'twilio'
    };
  }
}

/**
 * Demo mode SMS (for testing without Twilio)
 */
function sendViaDemoMode(to: string, body: string): SMSResult {
  console.log('📱 DEMO SMS MODE - Message would be sent:');
  console.log(`To: ${to}`);
  console.log(`Body: ${body}`);
  console.log('---');

  return {
    success: true,
    messageId: `demo_${Date.now()}`,
    to,
    provider: 'demo'
  };
}

/**
 * Log SMS to database for tracking
 */
async function logSMS(
  to: string,
  body: string,
  result: SMSResult,
  metadata?: { debtId?: string; invoiceNumber?: string }
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('sms_logs').insert({
      phone_number: to,
      message_body: body,
      status: result.success ? 'sent' : 'failed',
      provider: result.provider,
      message_id: result.messageId,
      error_message: result.error,
      debt_id: metadata?.debtId,
      invoice_number: metadata?.invoiceNumber,
      sent_by: user?.id,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log SMS:', error);
    // Don't throw - logging failure shouldn't block SMS sending
  }
}

/**
 * Send a single SMS
 */
export async function sendSMS(message: SMSMessage): Promise<SMSResult> {
  const config = await loadSMSConfig();
  
  // Check balance BEFORE sending
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) throw new Error('Company not found');

    // Check if company has sufficient balance
    const { data: hasBalance, error: balanceError } = await supabase
      .rpc('has_sufficient_sms_balance', {
        p_company_id: userData.company_id,
        p_required_amount: 0.02 // Cost per SMS
      });

    if (balanceError) {
      console.error('Balance check error:', balanceError);
    } else if (!hasBalance) {
      return {
        success: false,
        error: 'Insufficient SMS credits. Please top up your account in Settings → SMS / Automation.',
        to: message.to,
        provider: 'demo'
      };
    }
  } catch (error) {
    console.error('Balance check failed:', error);
    // Continue with demo mode if balance check fails
  }
  
  let result: SMSResult;

  if (config.enabled && config.twilioAccountSid) {
    // Send via Twilio
    result = await sendViaTwilio(message.to, message.body, config);
  } else {
    // Demo mode for testing
    result = sendViaDemoMode(message.to, message.body);
  }

  // Log the SMS
  await logSMS(message.to, message.body, result, {
    debtId: message.debtId,
    invoiceNumber: message.invoiceNumber
  });

  return result;
}

/**
 * Send bulk SMS with rate limiting
 */
export async function sendBulkSMS(messages: SMSMessage[]): Promise<SMSResult[]> {
  const results: SMSResult[] = [];
  
  // Send with 1 second delay between messages to avoid rate limits
  for (const message of messages) {
    const result = await sendSMS(message);
    results.push(result);
    
    // Wait 1 second between messages
    if (messages.indexOf(message) < messages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Generate debt reminder SMS message
 * Supports English and Swahili
 */
export function generateDebtReminderMessage(
  customerName: string,
  invoiceNumber: string,
  amount: string,
  daysOverdue: number,
  language: 'en' | 'sw' = 'en'
): string {
  if (language === 'sw') {
    // Swahili message
    const urgency = daysOverdue > 30 
      ? 'DHARURA' 
      : daysOverdue > 14 
      ? 'Muhimu' 
      : 'Ukumbusho';

    return `${urgency}: Mpendwa ${customerName}, ankara yako #${invoiceNumber} (${amount}) imechelewa siku ${daysOverdue}. Tafadhali lipia haraka iwezekanavyo. Jibu PAID ukilipa. - COPCCA CRM`;
  } else {
    // English message
    const urgency = daysOverdue > 30 
      ? 'URGENT' 
      : daysOverdue > 14 
      ? 'Important' 
      : 'Reminder';

    return `${urgency}: Dear ${customerName}, your invoice #${invoiceNumber} (${amount}) is ${daysOverdue} days overdue. Please arrange payment at your earliest convenience. Reply PAID when settled. - COPCCA CRM`;
  }
}

/**
 * Generate payment confirmation message
 * Supports English and Swahili
 */
export function generatePaymentConfirmationMessage(
  customerName: string,
  invoiceNumber: string,
  amount: string,
  language: 'en' | 'sw' = 'en'
): string {
  if (language === 'sw') {
    // Swahili message
    return `Asante ${customerName}! Tumepokea malipo yako ya ${amount} kwa ankara #${invoiceNumber}. Risiti imetumwa kwa barua pepe yako. - COPCCA CRM`;
  } else {
    // English message
    return `Thank you ${customerName}! We've received your payment of ${amount} for invoice #${invoiceNumber}. Receipt sent to your email. - COPCCA CRM`;
  }
}

/**
 * Get SMS statistics
 */
export async function getSMSStats(companyId?: string) {
  try {
    const query = supabase
      .from('sms_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (companyId) {
      // Filter by company if needed (requires joining with debts table)
      // For now, return all SMS for the authenticated user's company
    }

    const { data, error } = await query;

    if (error) throw error;

    const total = data?.length || 0;
    const sent = data?.filter(log => log.status === 'sent').length || 0;
    const failed = data?.filter(log => log.status === 'failed').length || 0;
    const deliveryRate = total > 0 ? Math.round((sent / total) * 100) : 0;

    return {
      total,
      sent,
      failed,
      deliveryRate,
      recentLogs: data?.slice(0, 10) || []
    };
  } catch (error) {
    console.error('Failed to get SMS stats:', error);
    return {
      total: 0,
      sent: 0,
      failed: 0,
      deliveryRate: 0,
      recentLogs: []
    };
  }
}
