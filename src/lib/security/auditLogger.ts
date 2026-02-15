/**
 * Security Audit Logger
 * Logs all security-relevant user actions to database
 */

import { supabase } from '../supabase';

export type SecurityAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  | 'password_reset_request'
  | 'password_reset_complete'
  | '2fa_enabled'
  | '2fa_disabled'
  | '2fa_verified'
  | '2fa_failed'
  | 'email_change'
  | 'profile_update'
  | 'user_created'
  | 'user_deleted'
  | 'role_changed'
  | 'data_export'
  | 'data_import'
  | 'sensitive_data_access'
  | 'settings_change'
  | 'api_key_created'
  | 'api_key_deleted'
  | 'session_created'
  | 'session_hijack_detected'
  | 'suspicious_activity';

export type SecurityStatus = 'success' | 'failed' | 'blocked' | 'warning';

export interface AuditLogData {
  userId?: string;
  action: SecurityAction;
  resourceType?: string;
  resourceId?: string;
  status?: SecurityStatus;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Log a security event to the audit log
 */
export async function logSecurityEvent(data: AuditLogData): Promise<void> {
  try {
    const { error } = await supabase.from('security_audit_logs').insert({
      user_id: data.userId || null,
      company_id: null, // Will be set by database trigger
      action: data.action,
      resource_type: data.resourceType || null,
      resource_id: data.resourceId || null,
      status: data.status || 'success',
      ip_address: data.ipAddress || null,
      user_agent: data.userAgent || null,
      request_method: data.requestMethod || null,
      request_path: data.requestPath || null,
      error_message: data.errorMessage || null,
      metadata: data.metadata || null,
    });

    if (error) {
      console.error('Failed to log security event:', error);
      // Don't throw - logging failures shouldn't break the app
    }
  } catch (err) {
    console.error('Failed to log security event:', err);
  }
}

/**
 * Log a login attempt
 */
export async function logLogin(
  userId: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  errorMessage?: string
): Promise<void> {
  await logSecurityEvent({
    userId,
    action: success ? 'login' : 'login_failed',
    status: success ? 'success' : 'failed',
    ipAddress,
    userAgent,
    errorMessage,
  });

  // Also log to failed_login_attempts table if failed
  if (!success && ipAddress) {
    try {
      await supabase.from('failed_login_attempts').insert({
        email: null, // Will be filled by auth system
        ip_address: ipAddress,
        user_agent: userAgent,
        reason: errorMessage || 'Login failed',
      });
    } catch (err) {
      console.error('Failed to log failed login attempt:', err);
    }
  }
}

/**
 * Log a logout
 */
export async function logLogout(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logSecurityEvent({
    userId,
    action: 'logout',
    status: 'success',
    ipAddress,
    userAgent,
  });
}

/**
 * Log data access to sensitive resources
 */
export async function logDataAccess(
  userId: string,
  resourceType: string,
  resourceId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logSecurityEvent({
    userId,
    action: 'sensitive_data_access',
    resourceType,
    resourceId,
    status: 'success',
    ipAddress,
    userAgent,
  });
}

/**
 * Log a data export
 */
export async function logDataExport(
  userId: string,
  resourceType: string,
  recordCount: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logSecurityEvent({
    userId,
    action: 'data_export',
    resourceType,
    status: 'success',
    ipAddress,
    userAgent,
    metadata: { record_count: recordCount },
  });
}

/**
 * Log password change
 */
export async function logPasswordChange(
  userId: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logSecurityEvent({
    userId,
    action: 'password_change',
    status: success ? 'success' : 'failed',
    ipAddress,
    userAgent,
  });
}

/**
 * Log 2FA events
 */
export async function log2FAEvent(
  userId: string,
  action: '2fa_enabled' | '2fa_disabled' | '2fa_verified' | '2fa_failed',
  success: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logSecurityEvent({
    userId,
    action,
    status: success ? 'success' : 'failed',
    ipAddress,
    userAgent,
  });
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  userId: string | undefined,
  description: string,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    userId,
    action: 'suspicious_activity',
    status: 'warning',
    ipAddress,
    userAgent,
    errorMessage: description,
    metadata,
  });
}

/**
 * Log session hijacking detection
 */
export async function logSessionHijackAttempt(
  userId: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    userId,
    action: 'session_hijack_detected',
    status: 'blocked',
    ipAddress,
    userAgent,
    errorMessage: reason,
    metadata,
  });
}

/**
 * Get client IP and User-Agent from browser
 */
export function getBrowserInfo(): { ipAddress?: string; userAgent?: string } {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    userAgent: navigator.userAgent,
    // IP address will be set by server/edge function
    ipAddress: undefined,
  };
}

/**
 * Query audit logs (admin only)
 */
export async function getAuditLogs(filters: {
  userId?: string;
  action?: SecurityAction;
  status?: SecurityStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  let query = supabase
    .from('security_audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters.action) {
    query = query.eq('action', filters.action);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString());
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString());
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get failed login attempts for monitoring
 */
export async function getFailedLoginAttempts(filters: {
  email?: string;
  ipAddress?: string;
  hours?: number;
  limit?: number;
}) {
  let query = supabase
    .from('failed_login_attempts')
    .select('*')
    .order('attempt_time', { ascending: false });

  if (filters.email) {
    query = query.eq('email', filters.email);
  }

  if (filters.ipAddress) {
    query = query.eq('ip_address', filters.ipAddress);
  }

  if (filters.hours) {
    const cutoff = new Date(Date.now() - filters.hours * 60 * 60 * 1000);
    query = query.gte('attempt_time', cutoff.toISOString());
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}
