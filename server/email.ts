// Resend email integration for Mill Town ABC
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('Resend credentials not available');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email || 'Mill Town ABC <onboarding@resend.dev>'
  };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

interface BookingEmailData {
  memberName: string;
  memberEmail: string;
  sessionTitle: string;
  sessionDate: string;
  sessionTime: string;
  isFreeSession: boolean;
  price: string;
}

export async function sendBookingConfirmationEmail(data: BookingEmailData): Promise<boolean> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #C8102E; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f5f5f5; }
        .details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .free-badge { background: #22c55e; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmed</h1>
          <p>Mill Town ABC</p>
        </div>
        <div class="content">
          <p>Hi ${data.memberName},</p>
          <p>Your boxing session has been booked successfully!</p>
          
          <div class="details">
            <h3>Session Details</h3>
            <p><strong>Class:</strong> ${data.sessionTitle}</p>
            <p><strong>Date:</strong> ${data.sessionDate}</p>
            <p><strong>Time:</strong> ${data.sessionTime}</p>
            <p><strong>Price:</strong> ${data.isFreeSession ? '<span class="free-badge">FREE</span>' : `£${data.price}`}</p>
          </div>

          <div class="details">
            <h3>Location</h3>
            <p>Whitfield Community Centre<br>
            Ebenezer Street<br>
            Glossop, SK13 8JY</p>
          </div>

          <p><strong>What to bring:</strong></p>
          <ul>
            <li>Comfortable workout clothes</li>
            <li>Water bottle</li>
            <li>Towel</li>
            <li>Boxing gloves (if you have them - we have spares!)</li>
          </ul>

          ${data.isFreeSession ? '<p><strong>Note:</strong> This is your FREE first session - no payment required!</p>' : '<p><strong>Payment:</strong> Your £5 payment has been processed successfully.</p>'}
          
          <p>See you at the gym!</p>
        </div>
        <div class="footer">
          <p>Mill Town ABC<br>
          Contact: Alex 07565 208193 | Mark 07713 659360<br>
          Email: Milltownabc@gmail.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail,
      replyTo: 'Milltownabc@gmail.com',
      to: data.memberEmail,
      subject: `Booking Confirmed - ${data.sessionTitle} on ${data.sessionDate}`,
      html: htmlContent,
    });
    
    console.log(`Confirmation email sent to ${data.memberEmail}`, result);
    return true;
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
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
  const verificationLink = `${data.baseUrl}/verify-email?token=${data.verificationToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #C8102E; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f5f5f5; }
        .button { display: inline-block; background: #C8102E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
          <p>Mill Town ABC</p>
        </div>
        <div class="content">
          <p>Hi ${data.memberName},</p>
          <p>Thanks for registering with Mill Town ABC! Please verify your email address by clicking the button below:</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" class="button">Verify Email Address</a>
          </p>

          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationLink}</p>

          <p>This link will expire in 24 hours.</p>
          
          <p>See you at the gym!</p>
        </div>
        <div class="footer">
          <p>Mill Town ABC<br>
          Contact: Alex 07565 208193 | Mark 07713 659360<br>
          Email: Milltownabc@gmail.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail,
      replyTo: 'Milltownabc@gmail.com',
      to: data.memberEmail,
      subject: "Verify your email - Mill Town ABC",
      html: htmlContent,
    });
    
    console.log(`Verification email sent to ${data.memberEmail}`, result);
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}
