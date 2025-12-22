/**
 * Email Service
 * Handles sending emails via Resend API
 * Supports Gmail, Outlook, and all email providers
 */

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send email via Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email will not be sent.');
    console.log('📧 Email that would be sent:', options);
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || 'COPCCA CRM <onboarding@resend.dev>',
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Resend API error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await response.json();
    console.log('✅ Email sent successfully:', data);
    return true;
  } catch (error: any) {
    console.error('❌ Email sending error:', error);
    throw error;
  }
}

/**
 * Create HTML email template for team invitation
 */
export function createInvitationEmailHTML(params: {
  recipientName: string;
  inviterName: string;
  companyName: string;
  role: string;
  inviteLink: string;
  expiryDays: number;
}): string {
  const { recipientName, inviterName, companyName, role, inviteLink, expiryDays } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🎉 You're Invited!
              </h1>
              <p style="margin: 10px 0 0 0; color: #fce7f3; font-size: 16px;">
                Join ${companyName} on COPCCA CRM
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi <strong>${recipientName}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on COPCCA CRM!
              </p>

              <div style="background-color: #fef3f8; border-left: 4px solid #ec4899; padding: 16px; margin: 0 0 24px 0; border-radius: 4px;">
                <p style="margin: 0; color: #831843; font-size: 14px; line-height: 1.5;">
                  <strong>Your Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}<br>
                  ${role === 'admin' 
                    ? '✨ You\'ll have full access to manage the team and view all data.' 
                    : '✨ You\'ll be able to manage your own customer data and tasks.'}
                </p>
              </div>

              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Click the button below to create your account and get started:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 32px 0;">
                    <a href="${inviteLink}" 
                       style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(236, 72, 153, 0.3);">
                      Accept Invitation &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 0 0 24px 0;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="margin: 0; color: #4b5563; font-size: 13px; word-break: break-all; font-family: 'Courier New', monospace;">
                  ${inviteLink}
                </p>
              </div>

              <!-- Expiry Notice -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <p style="margin: 0; color: #9ca3af; font-size: 14px; line-height: 1.5;">
                  ⏰ <strong>Important:</strong> This invitation will expire in <strong>${expiryDays} days</strong>. Make sure to sign up before it expires!
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Sent from <strong>${companyName}</strong> via COPCCA CRM
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                COPCCA CRM - Your AI-powered customer management system
              </p>
            </td>
          </tr>

        </table>

        <!-- Spam Notice -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 0 20px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                If you didn't expect this invitation, you can safely ignore this email.<br>
                This invitation was sent to ${params.recipientName} at the request of ${inviterName}.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Create plain text version of invitation email (fallback)
 */
export function createInvitationEmailText(params: {
  recipientName: string;
  inviterName: string;
  companyName: string;
  role: string;
  inviteLink: string;
  expiryDays: number;
}): string {
  const { recipientName, inviterName, companyName, role, inviteLink, expiryDays } = params;

  return `
Hi ${recipientName},

${inviterName} has invited you to join ${companyName} on COPCCA CRM!

Your Role: ${role.charAt(0).toUpperCase() + role.slice(1)}
${role === 'admin' 
  ? 'You\'ll have full access to manage the team and view all data.' 
  : 'You\'ll be able to manage your own customer data and tasks.'}

Click the link below to create your account and get started:
${inviteLink}

⏰ Important: This invitation will expire in ${expiryDays} days. Make sure to sign up before it expires!

---
Sent from ${companyName} via COPCCA CRM

If you didn't expect this invitation, you can safely ignore this email.
  `.trim();
}

/**
 * Send team invitation email
 */
export async function sendInvitationEmail(params: {
  to: string;
  recipientName: string;
  inviterName: string;
  companyName: string;
  role: 'user' | 'admin';
  inviteLink: string;
  expiryDays?: number;
}): Promise<boolean> {
  const expiryDays = params.expiryDays || 7;

  const subject = `You're invited to join ${params.companyName} on COPCCA CRM`;
  const html = createInvitationEmailHTML({
    recipientName: params.recipientName,
    inviterName: params.inviterName,
    companyName: params.companyName,
    role: params.role,
    inviteLink: params.inviteLink,
    expiryDays,
  });

  return await sendEmail({
    to: params.to,
    subject,
    html,
  });
}