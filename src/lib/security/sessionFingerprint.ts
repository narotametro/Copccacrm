/**
 * Session Fingerprinting - Detects session hijacking
 * Tracks device, browser, IP to identify suspicious changes
 */

import { supabase } from '../supabase';
import { logSessionHijackAttempt, logSuspiciousActivity } from './auditLogger';
import { UAParser } from 'ua-parser-js';

export interface SessionFingerprint {
  deviceFingerprint: string;
  ipAddress?: string;
  userAgent: string;
  browser: string;
  os: string;
  deviceType: string;
  screenResolution: string;
  timezone: string;
  language: string;
}

/**
 * Generate a device fingerprint from browser characteristics
 */
export function generateDeviceFingerprint(): SessionFingerprint {
  if (typeof window === 'undefined') {
    return {
      deviceFingerprint: 'server-side',
      userAgent: '',
      browser: 'unknown',
      os: 'unknown',
      deviceType: 'unknown',
      screenResolution: '0x0',
      timezone: 'UTC',
      language: 'en-US',
    };
  }

  // Parse user agent
  const parser = new UAParser();
  const result = parser.getResult();
  const browser = result.browser.name || 'unknown';
  const os = result.os.name || 'unknown';
  const deviceType = result.device.type || 'desktop';

  // Build fingerprint from various browser characteristics
  const components = [
    navigator.userAgent,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.language,
    navigator.platform,
    navigator.hardwareConcurrency || 0,
  ];

  // Simple hash function for fingerprint
  const fingerprint = hashString(components.join('|'));

  return {
    deviceFingerprint: fingerprint,
    userAgent: navigator.userAgent,
    browser: browser,
    os: os,
    deviceType: deviceType,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  };
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Store session fingerprint in database
 */
export async function storeSessionFingerprint(
  userId: string,
  sessionToken: string,
  fingerprint: SessionFingerprint,
  expiresAt: Date
): Promise<void> {
  try {
    // Hash the session token for storage
    const tokenHash = await hashToken(sessionToken);

    const { error } = await supabase.from('session_fingerprints').insert({
      user_id: userId,
      session_token_hash: tokenHash,
      device_fingerprint: fingerprint.deviceFingerprint,
      ip_address: fingerprint.ipAddress || 'unknown',
      user_agent: fingerprint.userAgent,
      browser: fingerprint.browser,
      os: fingerprint.os,
      device_type: fingerprint.deviceType,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      console.error('Failed to store session fingerprint:', error);
    }
  } catch (err) {
    console.error('Failed to store session fingerprint:', err);
  }
}

/**
 * Verify session fingerprint matches stored fingerprint
 */
export async function verifySessionFingerprint(
  userId: string,
  sessionToken: string,
  currentFingerprint: SessionFingerprint
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const tokenHash = await hashToken(sessionToken);

    // Get stored fingerprint
    const { data: storedSession, error } = await supabase
      .from('session_fingerprints')
      .select('*')
      .eq('user_id', userId)
      .eq('session_token_hash', tokenHash)
      .eq('is_active', true)
      .single();

    if (error || !storedSession) {
      return { valid: false, reason: 'Session not found' };
    }

    // Check if session expired
    if (new Date(storedSession.expires_at) < new Date()) {
      return { valid: false, reason: 'Session expired' };
    }

    // Verify fingerprint components
    const suspiciousChanges: string[] = [];

    // Device fingerprint should match exactly
    if (storedSession.device_fingerprint !== currentFingerprint.deviceFingerprint) {
      suspiciousChanges.push('device_fingerprint_mismatch');
    }

    // Browser and OS should match
    if (storedSession.browser !== currentFingerprint.browser) {
      suspiciousChanges.push('browser_change');
    }

    if (storedSession.os !== currentFingerprint.os) {
      suspiciousChanges.push('os_change');
    }

    // IP address can change (mobile networks) but log it
    if (
      storedSession.ip_address !== currentFingerprint.ipAddress &&
      currentFingerprint.ipAddress !== 'unknown'
    ) {
      suspiciousChanges.push('ip_address_change');
    }

    // If critical components changed, it's likely session hijacking
    const criticalChanges = suspiciousChanges.filter((c) =>
      ['device_fingerprint_mismatch', 'browser_change', 'os_change'].includes(c)
    );

    if (criticalChanges.length > 0) {
      // Log potential session hijacking
      await logSessionHijackAttempt(userId, criticalChanges.join(', '), currentFingerprint.ipAddress, currentFingerprint.userAgent, {
        stored_fingerprint: storedSession.device_fingerprint,
        current_fingerprint: currentFingerprint.deviceFingerprint,
        suspicious_changes: suspiciousChanges,
      });

      return {
        valid: false,
        reason: `Session verification failed: ${criticalChanges.join(', ')}`,
      };
    }

    // IP change alone is not critical, but log it
    if (suspiciousChanges.includes('ip_address_change')) {
      await logSuspiciousActivity(userId, 'IP address changed during session', currentFingerprint.ipAddress, currentFingerprint.userAgent, {
        old_ip: storedSession.ip_address,
        new_ip: currentFingerprint.ipAddress,
      });
    }

    // Update last activity
    await supabase
      .from('session_fingerprints')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', storedSession.id);

    return { valid: true };
  } catch (err) {
    console.error('Failed to verify session fingerprint:', err);
    return { valid: false, reason: 'Verification error' };
  }
}

/**
 * Get active sessions for a user
 */
export async function getActiveSessions(userId: string) {
  const { data, error } = await supabase
    .from('session_fingerprints')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .order('last_activity', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Revoke a specific session
 */
export async function revokeSession(userId: string, sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('session_fingerprints')
    .update({ is_active: false })
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

/**
 * Revoke all other sessions except current
 */
export async function revokeAllOtherSessions(
  userId: string,
  currentSessionToken: string
): Promise<void> {
  const tokenHash = await hashToken(currentSessionToken);

  const { error } = await supabase
    .from('session_fingerprints')
    .update({ is_active: false })
    .eq('user_id', userId)
    .neq('session_token_hash', tokenHash);

  if (error) {
    throw error;
  }
}

/**
 * Check concurrent session limit
 */
export async function checkConcurrentSessionLimit(
  userId: string,
  maxSessions: number = 3
): Promise<{ allowed: boolean; activeCount: number }> {
  const sessions = await getActiveSessions(userId);
  const activeCount = sessions.length;

  return {
    allowed: activeCount < maxSessions,
    activeCount,
  };
}

/**
 * Hash a token using Web Crypto API
 */
async function hashToken(token: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Fallback for server-side or old browsers
    return hashString(token);
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Clean up expired sessions periodically
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const { error } = await supabase
    .from('session_fingerprints')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Failed to cleanup expired sessions:', error);
  }
}
