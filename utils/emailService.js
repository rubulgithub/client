import nodemailer from "nodemailer";

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: `"${process.env.APP_NAME}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully");
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Email could not be sent");
    }
  }

  async sendWelcomeEmail(email, name) {
    const subject = "Welcome to Our Platform";
    const html = `
      <h1>Welcome ${name}!</h1>
      <p>Thank you for registering with us.</p>
      <p>Please verify your email to complete your registration.</p>
    `;

    await this.sendEmail(email, subject, html);
  }

  async sendAppointmentConfirmation(email, appointmentDetails) {
    const subject = "Appointment Confirmation";
    const html = `
      <h1>Appointment Confirmed</h1>
      <p>Your appointment has been confirmed for ${appointmentDetails.date} at ${appointmentDetails.time}.</p>
      <p>Doctor: ${appointmentDetails.doctorName}</p>
      <p>Please arrive 15 minutes early.</p>
    `;

    await this.sendEmail(email, subject, html);
  }
}

export default new EmailService();
