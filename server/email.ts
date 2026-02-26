import { Resend } from 'resend';

async function getCredentials() {
  if (process.env.RESEND_API_KEY) {
    return {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL || 'Mill Town ABC <noreply@milltownabc.co.uk>'
    };
  }

  throw new Error('Resend API key not configured. Set RESEND_API_KEY environment variable.');
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

function emailLayout(title: string, preheader: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #111111;
      color: #e0e0e0;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #111111;">
  <span style="display:none !important; visibility:hidden; mso-hide:all; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">${preheader}</span>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #111111;">
    <tr>
      <td align="center" style="padding: 30px 15px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">
          
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px 16px 0 0; padding: 32px 40px 28px; text-align: center; border-bottom: 3px solid #C8102E;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <img src="https://milltownabc.co.uk/logo.png" alt="Mill Town ABC" width="80" height="80" style="display: block; margin: 0 auto; border-radius: 12px; border: 2px solid #333333;" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 6px;">
                    <span style="font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 2px; text-transform: uppercase;">MILL TOWN ABC</span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <span style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; color: #888888; letter-spacing: 3px; text-transform: uppercase;">Boxing Club &bull; Glossop</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 0;">
              ${bodyContent}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #0d0d0d; border-radius: 0 0 16px 16px; padding: 30px 40px; border-top: 1px solid #2a2a2a;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <span style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; color: #C8102E; letter-spacing: 2px; text-transform: uppercase;">Mill Town ABC</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <span style="font-family: 'Inter', sans-serif; font-size: 13px; color: #888888;">Whitfield Community Centre, Ebenezer Street, Glossop, SK13 8JY</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <span style="font-family: 'Inter', sans-serif; font-size: 13px; color: #888888;">
                      Alex: <a href="tel:07565208193" style="color: #C8102E; text-decoration: none;">07565 208193</a>
                      &nbsp;&bull;&nbsp;
                      Mark: <a href="tel:07713659360" style="color: #C8102E; text-decoration: none;">07713 659360</a>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="mailto:Milltownabc@gmail.com" style="font-family: 'Inter', sans-serif; font-size: 13px; color: #C8102E; text-decoration: none;">Milltownabc@gmail.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, href: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding: 30px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="background-color: #C8102E; border-radius: 8px;">
              <a href="${href}" target="_blank" style="display: inline-block; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; letter-spacing: 0.5px;">${text}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function infoCard(title: string, rows: { label: string; value: string }[]): string {
  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #2a2a2a; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; color: #888888; width: 100px; vertical-align: top;">${r.label}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #2a2a2a; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: #e0e0e0;">${r.value}</td>
    </tr>
  `).join('');

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #222222; border-radius: 12px; margin: 20px 0; overflow: hidden;">
    <tr>
      <td style="padding: 20px 24px 12px;">
        <span style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; color: #C8102E; letter-spacing: 2px; text-transform: uppercase;">${title}</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 24px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          ${rowsHtml}
        </table>
      </td>
    </tr>
  </table>`;
}

function statusBadge(text: string, color: string, bgColor: string): string {
  return `<span style="display: inline-block; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; color: ${color}; background-color: ${bgColor}; padding: 4px 12px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase;">${text}</span>`;
}

function alertBox(message: string, type: 'info' | 'warning' | 'success'): string {
  const colors = {
    info: { bg: '#1e293b', border: '#3b82f6', icon: 'ℹ️', text: '#93c5fd' },
    warning: { bg: '#2a2017', border: '#f59e0b', icon: '⚠️', text: '#fcd34d' },
    success: { bg: '#162017', border: '#22c55e', icon: '✓', text: '#86efac' },
  };
  const c = colors[type];
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
    <tr>
      <td style="background-color: ${c.bg}; border-left: 4px solid ${c.border}; border-radius: 0 8px 8px 0; padding: 16px 20px;">
        <span style="font-family: 'Inter', sans-serif; font-size: 14px; color: ${c.text}; line-height: 1.6;">${message}</span>
      </td>
    </tr>
  </table>`;
}

interface BookingEmailData {
  memberName: string;
  memberEmail: string;
  sessionTitle: string;
  sessionDate: string;
  sessionTime: string;
  isFreeSession: boolean;
  paymentType: 'card' | 'cash' | 'free';
  price: string;
}

export async function sendBookingConfirmationEmail(data: BookingEmailData): Promise<boolean> {
  console.log("[Email] Attempting to send booking confirmation to:", data.memberEmail);
  
  let priceDisplay = '';
  let paymentSection = '';
  let subjectEmoji = '';
  
  if (data.paymentType === 'free') {
    priceDisplay = statusBadge('FREE', '#ffffff', '#22c55e');
    subjectEmoji = '';
    paymentSection = alertBox(
      '<strong>Your first session is FREE!</strong><br>Welcome to Mill Town ABC. No payment needed — just turn up and get ready to train!',
      'success'
    );
  } else if (data.paymentType === 'card') {
    priceDisplay = `£${data.price} ${statusBadge('PAID', '#ffffff', '#22c55e')}`;
    subjectEmoji = '';
    paymentSection = alertBox(
      `<strong>Payment received.</strong><br>Your payment of £${data.price} has been processed. You're all set!`,
      'success'
    );
  } else if (data.paymentType === 'cash') {
    priceDisplay = `£${data.price} ${statusBadge('PAY ON ARRIVAL', '#1a1a1a', '#f59e0b')}`;
    subjectEmoji = '';
    paymentSection = alertBox(
      `<strong>Pay cash on arrival.</strong><br>Please bring £${data.price} in cash to pay when you arrive. Exact change appreciated!`,
      'warning'
    );
  }

  const bodyContent = `
    <td style="padding: 40px;">
      <span style="font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 800; color: #ffffff; display: block; margin-bottom: 8px;">Booking Confirmed</span>
      <span style="font-family: 'Inter', sans-serif; font-size: 14px; color: #888888; display: block; margin-bottom: 24px;">Hi ${data.memberName}, your session is booked!</span>
      
      ${infoCard('Session Details', [
        { label: 'Class', value: data.sessionTitle },
        { label: 'Date', value: data.sessionDate },
        { label: 'Time', value: data.sessionTime },
        { label: 'Price', value: priceDisplay },
      ])}
      
      ${paymentSection}

      ${infoCard('Location', [
        { label: 'Venue', value: 'Whitfield Community Centre' },
        { label: 'Address', value: 'Ebenezer Street, Glossop, SK13 8JY' },
      ])}

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #222222; border-radius: 12px; margin: 20px 0;">
        <tr>
          <td style="padding: 20px 24px 12px;">
            <span style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; color: #C8102E; letter-spacing: 2px; text-transform: uppercase;">What to Bring</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr><td style="padding: 4px 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #e0e0e0;">Comfortable workout clothes</td></tr>
              <tr><td style="padding: 4px 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #e0e0e0;">Water bottle</td></tr>
              <tr><td style="padding: 4px 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #e0e0e0;">Towel</td></tr>
              <tr><td style="padding: 4px 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #e0e0e0;">Boxing gloves (we have spares!)</td></tr>
            </table>
          </td>
        </tr>
      </table>

      <span style="font-family: 'Inter', sans-serif; font-size: 15px; color: #888888; display: block; margin-top: 24px;">See you at the gym!</span>
    </td>
  `;

  const htmlContent = emailLayout(
    'Booking Confirmed - Mill Town ABC',
    `Your ${data.sessionTitle} session on ${data.sessionDate} is confirmed.`,
    bodyContent
  );

  try {
    console.log("[Email] Getting Resend client...");
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail,
      replyTo: 'Milltownabc@gmail.com',
      to: data.memberEmail,
      subject: `${subjectEmoji}Booking Confirmed - ${data.sessionTitle} on ${data.sessionDate}`,
      html: htmlContent,
    });
    
    console.log("[Email] Confirmation email sent successfully to:", data.memberEmail, "Result:", JSON.stringify(result));
    return true;
  } catch (error: any) {
    console.error("[Email] Failed to send confirmation email:", error?.message || error);
    return false;
  }
}

interface CancellationEmailData {
  memberName: string;
  memberEmail: string;
  sessionTitle: string;
  sessionDate: string;
  sessionTime: string;
  freeSessionRestored: boolean;
}

export async function sendCancellationEmail(data: CancellationEmailData): Promise<boolean> {
  console.log("[Email] Attempting to send cancellation email to:", data.memberEmail);

  let extraInfo = '';
  if (data.freeSessionRestored) {
    extraInfo = alertBox(
      '<strong>Good news!</strong> Your free first session has been restored. You can use it on your next booking.',
      'success'
    );
  } else {
    extraInfo = alertBox(
      '<strong>Refunds:</strong> If you paid by card and are eligible for a refund, please contact us at <a href="mailto:Milltownabc@gmail.com" style="color: #93c5fd;">Milltownabc@gmail.com</a> or speak to a coach at the gym.',
      'info'
    );
  }

  const bodyContent = `
    <td style="padding: 40px;">
      <span style="font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 800; color: #ffffff; display: block; margin-bottom: 8px;">Booking Cancelled</span>
      <span style="font-family: 'Inter', sans-serif; font-size: 14px; color: #888888; display: block; margin-bottom: 24px;">Hi ${data.memberName}, your booking has been cancelled as requested.</span>
      
      ${infoCard('Cancelled Session', [
        { label: 'Class', value: data.sessionTitle },
        { label: 'Date', value: data.sessionDate },
        { label: 'Time', value: data.sessionTime },
        { label: 'Status', value: statusBadge('Cancelled', '#ffffff', '#6b7280') },
      ])}
      
      ${extraInfo}

      <span style="font-family: 'Inter', sans-serif; font-size: 15px; color: #888888; display: block; margin-top: 24px;">If you'd like to book another session, visit our website to view available classes.</span>
      <span style="font-family: 'Inter', sans-serif; font-size: 15px; color: #888888; display: block; margin-top: 8px;">Hope to see you soon!</span>
    </td>
  `;

  const htmlContent = emailLayout(
    'Booking Cancelled - Mill Town ABC',
    `Your ${data.sessionTitle} session on ${data.sessionDate} has been cancelled.`,
    bodyContent
  );

  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail,
      replyTo: 'Milltownabc@gmail.com',
      to: data.memberEmail,
      subject: `Booking Cancelled - ${data.sessionTitle} on ${data.sessionDate}`,
      html: htmlContent,
    });
    
    console.log("[Email] Cancellation email sent successfully to:", data.memberEmail, "Result:", JSON.stringify(result));
    return true;
  } catch (error: any) {
    console.error("[Email] Failed to send cancellation email:", error?.message || error);
    return false;
  }
}

interface PasswordResetEmailData {
  memberName: string;
  memberEmail: string;
  resetToken: string;
  baseUrl: string;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
  console.log("[Email] Attempting to send password reset email to:", data.memberEmail);
  
  const resetLink = `${data.baseUrl}/reset-password?token=${data.resetToken}`;

  const bodyContent = `
    <td style="padding: 40px;">
      <span style="font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 800; color: #ffffff; display: block; margin-bottom: 8px;">Reset Your Password</span>
      <span style="font-family: 'Inter', sans-serif; font-size: 14px; color: #888888; display: block; margin-bottom: 24px;">Hi ${data.memberName}, we received a request to reset the password for your Mill Town ABC account.</span>
      
      <span style="font-family: 'Inter', sans-serif; font-size: 15px; color: #e0e0e0; display: block; margin-bottom: 8px;">Click the button below to set a new password:</span>

      ${ctaButton('Reset Password', resetLink)}
      
      <span style="font-family: 'Inter', sans-serif; font-size: 13px; color: #666666; display: block; margin-bottom: 8px;">Or copy and paste this link into your browser:</span>
      <span style="font-family: 'Inter', sans-serif; font-size: 12px; color: #C8102E; word-break: break-all; display: block; margin-bottom: 24px;"><a href="${resetLink}" style="color: #C8102E; text-decoration: none;">${resetLink}</a></span>
      
      ${alertBox(
        '<strong>This link expires in 1 hour.</strong> If you didn\'t request a password reset, you can safely ignore this email — your password won\'t be changed.',
        'warning'
      )}
    </td>
  `;

  const htmlContent = emailLayout(
    'Reset Your Password - Mill Town ABC',
    'You requested a password reset for your Mill Town ABC account.',
    bodyContent
  );

  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail,
      replyTo: 'Milltownabc@gmail.com',
      to: data.memberEmail,
      subject: "Reset your password - Mill Town ABC",
      html: htmlContent,
    });
    
    console.log("[Email] Password reset email sent successfully to:", data.memberEmail, "Result:", JSON.stringify(result));
    return true;
  } catch (error: any) {
    console.error("[Email] Failed to send password reset email:", error?.message || error);
    return false;
  }
}

interface VerificationEmailData {
  memberName: string;
  memberEmail: string;
  verificationToken: string;
  baseUrl: string;
}

export async function sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
  console.log("[Email] Attempting to send verification email to:", data.memberEmail);
  
  const verificationLink = `${data.baseUrl}/verify-email?token=${data.verificationToken}`;

  const bodyContent = `
    <td style="padding: 40px;">
      <span style="font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 800; color: #ffffff; display: block; margin-bottom: 8px;">Verify Your Email</span>
      <span style="font-family: 'Inter', sans-serif; font-size: 14px; color: #888888; display: block; margin-bottom: 24px;">Hi ${data.memberName}, thanks for registering with Mill Town ABC!</span>
      
      <span style="font-family: 'Inter', sans-serif; font-size: 15px; color: #e0e0e0; display: block; margin-bottom: 8px;">Please verify your email address by clicking the button below:</span>

      ${ctaButton('Verify Email Address', verificationLink)}
      
      <span style="font-family: 'Inter', sans-serif; font-size: 13px; color: #666666; display: block; margin-bottom: 8px;">Or copy and paste this link into your browser:</span>
      <span style="font-family: 'Inter', sans-serif; font-size: 12px; color: #C8102E; word-break: break-all; display: block; margin-bottom: 24px;"><a href="${verificationLink}" style="color: #C8102E; text-decoration: none;">${verificationLink}</a></span>
      
      ${alertBox(
        'This link will expire in 24 hours.',
        'info'
      )}

      <span style="font-family: 'Inter', sans-serif; font-size: 15px; color: #888888; display: block; margin-top: 24px;">See you at the gym!</span>
    </td>
  `;

  const htmlContent = emailLayout(
    'Verify Your Email - Mill Town ABC',
    'Please verify your email to complete your Mill Town ABC registration.',
    bodyContent
  );

  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail,
      replyTo: 'Milltownabc@gmail.com',
      to: data.memberEmail,
      subject: "Verify your email - Mill Town ABC",
      html: htmlContent,
    });
    
    console.log("[Email] Verification email sent successfully to:", data.memberEmail, "Result:", JSON.stringify(result));
    return true;
  } catch (error: any) {
    console.error("[Email] Failed to send verification email:", error?.message || error);
    return false;
  }
}
