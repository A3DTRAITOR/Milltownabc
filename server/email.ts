import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("Email not configured - skipping confirmation email");
    console.log("Would have sent:", data);
    return false;
  }

  const priceText = data.isFreeSession 
    ? "FREE (First Session)" 
    : `£${data.price}`;

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

          ${!data.isFreeSession ? '<p><strong>Payment:</strong> £5 is payable at the session. (Online payment coming soon!)</p>' : ''}
          
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
    await transporter.sendMail({
      from: `"Mill Town ABC" <${process.env.SMTP_USER}>`,
      to: data.memberEmail,
      subject: `Booking Confirmed - ${data.sessionTitle} on ${data.sessionDate}`,
      html: htmlContent,
    });
    console.log(`Confirmation email sent to ${data.memberEmail}`);
    return true;
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    return false;
  }
}
