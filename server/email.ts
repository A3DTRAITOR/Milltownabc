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
  let paymentMessage = '';
  let headerTitle = 'Booking Confirmed';
  
  if (data.paymentType === 'free') {
    priceDisplay = '<span class="free-badge">FREE</span>';
    paymentMessage = `
      <div class="payment-info free">
        <h3>Your First Session is FREE!</h3>
        <p>Welcome to Mill Town ABC! As this is your first session, there's no payment required. Just turn up and get ready to train!</p>
      </div>
    `;
  } else if (data.paymentType === 'card') {
    priceDisplay = `£${data.price} <span class="paid-badge">PAID</span>`;
    paymentMessage = `
      <div class="payment-info paid">
        <h3>Payment Received</h3>
        <p>Your payment of £${data.price} has been processed successfully. You're all set - just turn up and train!</p>
      </div>
    `;
  } else if (data.paymentType === 'cash') {
    priceDisplay = `£${data.price} <span class="cash-badge">PAY ON ARRIVAL</span>`;
    paymentMessage = `
      <div class="payment-info cash">
        <h3>Pay Cash on Arrival</h3>
        <p>Please bring <strong>£${data.price} in cash</strong> to pay at reception when you arrive. Exact change is appreciated!</p>
      </div>
    `;
  }

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
        .paid-badge { background: #22c55e; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
        .cash-badge { background: #f59e0b; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
        .payment-info { padding: 15px; margin: 15px 0; border-radius: 8px; }
        .payment-info.free { background: #dcfce7; border: 1px solid #22c55e; }
        .payment-info.paid { background: #dcfce7; border: 1px solid #22c55e; }
        .payment-info.cash { background: #fef3c7; border: 1px solid #f59e0b; }
        .payment-info h3 { margin: 0 0 10px 0; }
        .payment-info p { margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${headerTitle}</h1>
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
            <p><strong>Price:</strong> ${priceDisplay}</p>
          </div>

          ${paymentMessage}

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
    console.log("[Email] Getting Resend client...");
    const { client, fromEmail } = await getResendClient();
    console.log("[Email] Got client, sending from:", fromEmail);
    
    const result = await client.emails.send({
      from: fromEmail,
      replyTo: 'Milltownabc@gmail.com',
      to: data.memberEmail,
      subject: `Booking Confirmed - ${data.sessionTitle} on ${data.sessionDate}`,
      html: htmlContent,
    });
    
    console.log("[Email] Confirmation email sent successfully to:", data.memberEmail, "Result:", JSON.stringify(result));
    return true;
  } catch (error: any) {
    console.error("[Email] Failed to send confirmation email:", error?.message || error);
    console.error("[Email] Full error:", JSON.stringify(error, null, 2));
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

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6b7280; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f5f5f5; }
        .details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .info-box { background: #e0f2fe; border: 1px solid #0ea5e9; padding: 15px; border-radius: 8px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Cancelled</h1>
          <p>Mill Town ABC</p>
        </div>
        <div class="content">
          <p>Hi ${data.memberName},</p>
          <p>Your booking has been cancelled as requested.</p>
          
          <div class="details">
            <h3>Cancelled Session</h3>
            <p><strong>Class:</strong> ${data.sessionTitle}</p>
            <p><strong>Date:</strong> ${data.sessionDate}</p>
            <p><strong>Time:</strong> ${data.sessionTime}</p>
          </div>

          ${data.freeSessionRestored ? `
          <div class="info-box">
            <p><strong>Good news!</strong> Your free first session has been restored. You can use it on your next booking.</p>
          </div>
          ` : ''}

          ${!data.freeSessionRestored ? `
          <div class="info-box">
            <p><strong>Refunds:</strong> If you paid by card and are eligible for a refund, please contact us at <a href="mailto:Milltownabc@gmail.com">Milltownabc@gmail.com</a> or speak to a coach at the gym. Refunds are processed within a few days.</p>
          </div>
          ` : ''}

          <p>If you'd like to book another session, visit our website to view available classes.</p>
          
          <p>Hope to see you soon!</p>
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
    console.log("[Email] Getting Resend client for cancellation email...");
    const { client, fromEmail } = await getResendClient();
    console.log("[Email] Got client, sending cancellation from:", fromEmail);
    
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
    console.error("[Email] Full error:", JSON.stringify(error, null, 2));
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
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
          <p>Mill Town ABC</p>
        </div>
        <div class="content">
          <p>Hi ${data.memberName},</p>
          <p>We received a request to reset the password for your Mill Town ABC account. Click the button below to set a new password:</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </p>

          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetLink}</p>

          <div class="warning">
            <p style="margin: 0;"><strong>This link will expire in 1 hour.</strong> If you didn't request a password reset, you can safely ignore this email — your password won't be changed.</p>
          </div>
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
    console.log("[Email] Getting Resend client for password reset email...");
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
    console.log("[Email] Getting Resend client for verification email...");
    const { client, fromEmail } = await getResendClient();
    console.log("[Email] Got client, sending verification from:", fromEmail);
    
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
    console.error("[Email] Full error:", JSON.stringify(error, null, 2));
    return false;
  }
}
